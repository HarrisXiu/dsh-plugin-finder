import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { searchGithubAll, searchGithubRepos, githubJson, normalizeRepositoryUrl } from '../lib/core/sources.js';
import { mergeCandidates } from '../lib/core/candidates.js';
import { FinderEngine } from '../lib/core/engine.js';
import { mountFinderRoutes } from '../lib/core/routes.js';
import { sleep } from '../lib/core/http.js';

let checks = 0;
async function test(name, fn) { await fn(); checks++; console.log(`ok ${name}`); }
const repo = (n, extra = {}) => ({ fullName: `author/plugin-${n}`, topics: ['dsh-plugin'], description: `Plugin ${n}`,
  stars: n, createdAt: new Date(Date.UTC(2026, 8, 1) + n * 1000).toISOString(), pushedAt: '', ...extra });
const all = Array.from({ length: 2501 }, (_, n) => repo(n, { archived: n === 0 }));
await test('enumerates 2,501 tagged repositories through partitions and pagination', async () => {
  let pages = 0;
  const search = async (query, { page }) => {
    assert.ok(query.startsWith('topic:dsh-plugin fork:true'));
    const range = query.match(/created:(\S+)\.\.(\S+)/);
    const list = all.filter(r => Date.parse(r.createdAt) >= Date.parse(range[1]) && Date.parse(r.createdAt) <= Date.parse(range[2]));
    assert.ok(page <= 10); if (page > 1) pages++;
    return { items: list.slice((page - 1) * 100, page * 100), total: list.length, incomplete: false, source: 'fixture' };
  };
  const result = await searchGithubAll({ search, spacingMs: 0 });
  assert.equal(result.complete, true); assert.equal(result.items.length, all.length);
  assert.equal(new Set(result.items.map(r => r.fullName)).size, all.length); assert.ok(pages);
});
await test('request budget and HTTP failures keep the exact resume page', async () => {
  const pool = all.slice(0, 205);
  const pages = async (_q, { page }) => ({ items: pool.slice((page - 1) * 100, page * 100), total: pool.length, incomplete: false });
  const first = await searchGithubAll({ search: pages, spacingMs: 0, maxRequests: 1 });
  assert.equal(first.complete, false); assert.equal(first.checkpoint.queue[0].page, 2);
  const failed = await searchGithubAll({ checkpoint: first.checkpoint, spacingMs: 0,
    search: async () => ({ items: [], total: 0, error: 'HTTP 403 rate limit' }) });
  assert.equal(failed.items.length, 100); assert.equal(failed.checkpoint.queue[0].page, 2);
  const resumed = await searchGithubAll({ search: pages, spacingMs: 0, checkpoint: failed.checkpoint });
  assert.equal(resumed.complete, true); assert.equal(resumed.items.length, 205);
});
await test('empty searches, unexpected empty pages and incomplete_results differ', async () => {
  const empty = await searchGithubAll({ search: async () => ({ items: [], total: 0, incomplete: false }) });
  assert.equal(empty.complete, true);
  const missing = await searchGithubAll({ search: async () => ({ items: [], total: 2, incomplete: false }) });
  assert.equal(missing.complete, false); assert.equal(missing.checkpoint.queue.length, 1);
  const checkpoint = { query: 'topic:dsh-plugin fork:true', items: [], queue: [{ start: 1, end: 1, page: 1 }] };
  const incomplete = await searchGithubAll({ checkpoint, search: async () => ({ items: [], total: 0, incomplete: true }) });
  assert.equal(incomplete.complete, false); assert.ok(incomplete.errors.length);
});
await test('cancel retains results and interrupts pacing', async () => {
  const controller = new AbortController();
  const result = await searchGithubAll({ signal: controller.signal, spacingMs: 60000, search: async () => {
    controller.abort(); return { items: [repo(0)], total: 101, incomplete: false };
  } });
  assert.equal(result.complete, false); assert.equal(result.items.length, 1);
  const next = new AbortController(); const waiting = sleep(60000, next.signal); next.abort();
  await assert.rejects(waiting, /aborted/);
});
await test('strict topics, archived repositories and same-name forks survive', () => {
  const repositories = [repo(1), repo(2, { fullName: 'fork/plugin', archived: true }), repo(3, { topics: ['deepseek-harness'] })];
  const manifest = { name: 'shared-package', dsh: { bundle: { patch: './cordis.patch.yml' } } };
  const result = mergeCandidates({ repos: repositories,
    repoManifests: new Map(repositories.slice(0, 2).map(r => [r.fullName, manifest])),
    manifests: new Map([['shared-package', { ...manifest, repository: 'git+https://github.com/author/plugin-1.git' }]]) });
  assert.equal(result.length, 2); assert.equal(result.find(c => c.archived).npmName, '');
  assert.equal(result.find(c => !c.archived).npmName, 'shared-package');
  assert.equal(normalizeRepositoryUrl('git+https://github.com/author/plugin-1.git'), 'https://github.com/author/plugin-1');
});
await test('manifest name is not proof of npm publication or bundle installation', () => {
  const r = repo(9);
  const unknown = mergeCandidates({ repos: [r] })[0];
  assert.equal(unknown.npmName, ''); assert.equal(unknown.installSpec, '');
  const privateBundle = mergeCandidates({ repos: [r], repoManifests: new Map([[r.fullName,
    { name: 'private-name', private: true, dsh: { bundle: { patch: './patch.yml' } } }]]) })[0];
  assert.equal(privateBundle.npmName, ''); assert.equal(privateBundle.installSpec, privateBundle.repoUrl);
});

const originalFetch = globalThis.fetch;
try {
  await test('mirror error payload fallback and Token isolation', async () => {
    const calls = [];
    globalThis.fetch = async (url, options) => {
      calls.push({ url, ...options });
      if (url.startsWith('https://api.github.com/')) return new Response('{"message":"forbidden"}', { status: 403 });
      if (url.startsWith('https://first.example/')) return new Response('{"message":"proxy error"}');
      return new Response(JSON.stringify({ total_count: 1, incomplete_results: false, items: [{
        full_name: 'author/plugin', topics: ['dsh-plugin'], created_at: '2026-09-01T00:00:00Z',
      }] }));
    };
    const result = await searchGithubRepos('topic:dsh-plugin fork:true', {
      token: 'test-secret', githubMirrors: ['https://first.example/', 'https://second.example/'],
    });
    assert.equal(result.items.length, 1); assert.equal(result.source, 'https://second.example');
    assert.equal(calls[0].headers.authorization, 'Bearer test-secret'); assert.equal(calls[0].redirect, 'error');
    assert.ok(calls.slice(1).every(c => !c.headers.authorization));
  });
  await test('successful mirror is reused and untagged proxy records are rejected', async () => {
    let canonical = 0; const state = {};
    globalThis.fetch = async url => {
      if (url.startsWith('https://api.github.com/')) { canonical++; return new Response('bad json'); }
      return new Response(JSON.stringify({ total_count: 0, incomplete_results: false, items: [] }));
    };
    const opts = { githubMirrors: ['https://mirror.example/'], routeState: state };
    await searchGithubRepos('topic:dsh-plugin', opts); await searchGithubRepos('topic:dsh-plugin', opts);
    assert.equal(canonical, 1);
    globalThis.fetch = async () => new Response(JSON.stringify({ total_count: 1, incomplete_results: false,
      items: [{ full_name: 'author/wrong', topics: [], created_at: '2026-01-01' }] }));
    assert.ok((await searchGithubRepos('topic:dsh-plugin', { githubMirrors: [] })).error);
    await assert.rejects(githubJson('https://api.github.com/repos/a/b', { githubMirrors: ['https://secret@mirror.example/'] }), /without credentials/);
  });
} finally { globalThis.fetch = originalFetch; }

const temp = new URL('../.build/regression/', import.meta.url);
await mkdir(temp, { recursive: true });
const cache = new URL('cache.json', temp);
const makeEngine = options => new FinderEngine({ cachePath: fileURLToPath(cache), repoLimit: 0, manifestLimit: 0, ...options });
try {
  await test('rejects fresh legacy catalog caches offline', async () => {
    await writeFile(cache, JSON.stringify({ schema: 2, generatedAt: new Date().toISOString(), candidates: [{ topics: ['dsh-plugin'] }] }));
    assert.equal(await makeEngine().adoptCache(), null);
    assert.equal((await makeEngine().suggest({ offline: true })).candidates.length, 0);
  });
  await test('coalesces refresh, persists checkpoints and serves stale direct cache offline', async () => {
    let scans = 0;
    const engine = makeEngine({ scan: async options => {
      scans++;
      const cp = { query: 'topic:dsh-plugin fork:true', items: [repo(1)], queue: [{ start: 1, end: 2, page: 2 }], sources: ['fixture'], total: 2 };
      await options.onCheckpoint(cp);
      return { items: cp.items, complete: false, checkpoint: cp, sources: cp.sources, total: cp.total, errors: ['partial'] };
    } });
    const a = engine.refresh({ force: true }), b = engine.refresh({ force: true });
    assert.equal(a, b); await a; assert.equal(scans, 1);
    const record = JSON.parse(await readFile(cache)); assert.equal(record.scan.checkpoint.queue[0].page, 2);
    record.generatedAt = '2020-01-01T00:00:00Z'; await writeFile(cache, JSON.stringify(record));
    assert.equal((await makeEngine().suggest({ offline: true })).candidates.length, 1);
    const resumed = makeEngine({ scan: async options => {
      assert.equal(options.checkpoint.queue[0].page, 2);
      return { items: [repo(1), repo(2)], complete: true, sources: ['fixture'], total: 2, errors: [] };
    } });
    assert.equal((await resumed.refresh({ force: true })).candidates.length, 2);
    assert.equal((await makeEngine().suggest({ offline: true })).scan.complete, true);
  });
  await test('network failure preserves the previous direct-discovery list', async () => {
    const engine = makeEngine({ scan: async () => ({ items: [], complete: false, sources: [], total: null,
      checkpoint: { query: 'topic:dsh-plugin fork:true', items: [], queue: [{ start: 1, end: 2, page: 1 }] }, errors: ['network failed'] }) });
    const record = await engine.refresh({ force: true });
    assert.equal(record.candidates.length, 2); assert.equal(record.scan.complete, false);
    assert.equal(record.errors[0], 'network failed');
  });
  await test('live text search cannot escape the topic scope', async () => {
    const engine = makeEngine({ scan: async options => {
      assert.ok(options.query.startsWith('topic:dsh-plugin fork:true "'));
      assert.ok(!options.query.includes('" fork:false'));
      return { items: [repo(1)], complete: true, total: 1, sources: [], errors: [] };
    } });
    assert.equal((await engine.searchLive({ text: 'memory" fork:false' })).candidates.length, 1);
  });
  await test('local UI route progress, cross-site fence and disposal cancellation', async () => {
    let capturedSignal, release;
    const engine = makeEngine({ scan: options => {
      capturedSignal = options.signal;
      return new Promise(resolve => { release = () => resolve({ items: [], complete: false, total: 0, sources: [], errors: [] }); });
    } });
    const routes = [], disposed = [];
    const dispose = mountFinderRoutes({ webServer: { register: route => { routes.push(route); return () => disposed.push(route.path); } } }, engine);
    const call = async (path, method, headers = {}) => {
      let status, data;
      await routes.find(r => r.path === path).handler({ method, headers: { host: '127.0.0.1:1234', ...headers } }, {
        writeHead: code => { status = code; }, end: value => { data = JSON.parse(value); },
      }); return { status, data };
    };
    assert.equal((await call('/plugin-finder/refresh', 'GET')).status, 405);
    assert.equal((await call('/plugin-finder/refresh', 'POST', { origin: 'https://evil.example' })).status, 403);
    assert.equal((await call('/plugin-finder/refresh', 'POST', { host: 'evil.example', origin: 'http://evil.example' })).status, 403);
    assert.equal((await call('/plugin-finder/refresh', 'POST')).status, 202);
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal((await call('/plugin-finder/index', 'GET')).data.running, true);
    dispose(); assert.equal(capturedSignal.aborted, true); assert.equal(disposed.length, 2);
    release(); await engine.pending;
  });
} finally { await rm(temp, { recursive: true, force: true }); }
console.log(`DIRECT DISCOVERY CHECKS PASSED (${checks})`);
