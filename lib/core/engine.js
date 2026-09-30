/** Shared host engine: topic discovery, checkpointed disk cache, optional manifests. */
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { searchGithubAll, fetchRepoManifest, fetchNpmLatest } from './sources.js';
import { mergeCandidates, CATEGORIES, scoreCandidate } from './candidates.js';
export const DEFAULT_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
export const DEFAULT_REPO_LIMIT = 25;
export const DEFAULT_MANIFEST_LIMIT = 25;
export const INDEX_SCHEMA = 3;
export const DISCOVERY_MODE = 'github-topic:dsh-plugin';

export async function mapLimit(tasks, limit) {
  const results = new Array(tasks.length).fill(null);
  let next = 0;
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, tasks.length)) }, async () => {
    while (next < tasks.length) {
      const index = next++;
      try { results[index] = await tasks[index](); } catch { results[index] = null; }
    }
  }));
  return results;
}

export class FinderEngine {
  constructor(options = {}) {
    this.cachePath = options.cachePath ?? '';
    this.cacheTtlMs = Number.isFinite(options.cacheTtlMs) ? options.cacheTtlMs : DEFAULT_CACHE_TTL_MS;
    this.token = options.token ?? '';
    this.githubMirrors = options.githubMirrors;
    this.repoLimit = options.repoLimit ?? DEFAULT_REPO_LIMIT;
    this.manifestLimit = options.manifestLimit ?? DEFAULT_MANIFEST_LIMIT;
    this.spacingMs = options.spacingMs;
    this.maxRequests = options.maxRequests;
    this.installedProvider = options.installedProvider ?? (() => new Set());
    this.profile = options.profile ?? '';
    this.log = options.log ?? (() => {});
    this.index = null;
    this.pending = null;
    this.progress = '';
    this.routeState = {};
    this.repoManifests = new Map();
    this.manifests = new Map();
    // Injection points also allow deterministic verification without live GitHub.
    this.scan = options.scan ?? searchGithubAll;
    this.fetchRepo = options.fetchRepo ?? fetchRepoManifest;
    this.fetchNpm = options.fetchNpm ?? fetchNpmLatest;
  }
  validRecord(record) {
    return record?.schema === INDEX_SCHEMA && record.mode === DISCOVERY_MODE
      && Array.isArray(record.candidates) && record.candidates.every(c => c.topics?.includes('dsh-plugin'));
  }
  isStaleRecord(record) {
    const age = Date.now() - Date.parse(record?.generatedAt ?? '');
    return !this.validRecord(record) || !Number.isFinite(age) || age > this.cacheTtlMs || age < 0;
  }
  isStale() { return this.isStaleRecord(this.index); }
  reindex() {
    if (!this.index) return null;
    const installed = this.installedProvider();
    for (const c of this.index.candidates) {
      c.installed = installed.has(c.repoUrl.toLowerCase()) || Boolean(c.npmName && installed.has(c.npmName.toLowerCase()));
      c.score = scoreCandidate(c);
    }
    this.index.candidates.sort((a, b) => b.score - a.score || a.repoFullName.localeCompare(b.repoFullName));
    this.index.counts.installed = this.index.candidates.filter(c => c.installed).length;
    return this.index;
  }
  async adoptCache({ stale = false } = {}) {
    if (!this.cachePath) return null;
    try {
      const parsed = JSON.parse(await readFile(this.cachePath, 'utf8'));
      if (!this.validRecord(parsed) || (!stale && this.isStaleRecord(parsed))) return null;
      this.repoManifests = new Map(Object.entries(parsed.repoManifests ?? {}));
      this.manifests = new Map(Object.entries(parsed.manifests ?? {}));
      this.index = parsed;
      return this.reindex();
    } catch { return null; }
  }
  async saveCache() {
    if (!this.cachePath || !this.index) return;
    try {
      await mkdir(dirname(this.cachePath), { recursive: true });
      const temporary = this.cachePath + '.tmp';
      await writeFile(temporary, JSON.stringify(this.index), 'utf8');
      await rename(temporary, this.cachePath);
    } catch (error) { this.log(`cache write failed: ${error.message}`); }
  }
  async suggest(options = {}) {
    if (!this.index) await this.adoptCache({ stale: true });
    if (options.offline) return this.reindex() ?? this.fromSeed('no direct-discovery cache yet');
    if (this.index && !options.force && !this.isStale()) return this.reindex();
    return this.refresh(options);
  }
  refresh(options = {}) {
    if (this.pending) return this.pending;
    this.pending = this.build(options).finally(() => { this.pending = null; });
    return this.pending;
  }
  fromSeed(reason) {
    // Historical curated snapshots are deliberately never loaded or migrated.
    return this.makeIndex([], { complete: false, total: null, sources: [], checkpoint: null }, [`offline: ${reason}`]);
  }
  makeIndex(repos, scan, errors = []) {
    const candidates = mergeCandidates({ repos, repoManifests: this.repoManifests, manifests: this.manifests, installed: this.installedProvider() });
    return {
      schema: INDEX_SCHEMA, mode: DISCOVERY_MODE, generatedAt: new Date().toISOString(),
      categories: CATEGORIES, scan, errors, candidates,
      repoManifests: Object.fromEntries(this.repoManifests), manifests: Object.fromEntries(this.manifests),
      counts: { candidates: candidates.length, installable: candidates.filter(c => c.installSpec).length,
        published: candidates.filter(c => c.npmName).length, installed: candidates.filter(c => c.installed).length,
        repositories: repos.length, packages: this.manifests.size, manifests: this.repoManifests.size },
    };
  }
  async enrich(repos, signal) {
    const targets = repos.slice().sort((a, b) => b.stars - a.stars)
      .filter(repo => !this.repoManifests.has(repo.fullName)).slice(0, Math.max(0, this.repoLimit));
    this.progress = `Reading ${targets.length} repository manifests (all tagged repos remain visible)`;
    await mapLimit(targets.map(repo => async () => {
      const manifest = await this.fetchRepo(repo.fullName, { token: this.token, signal, githubMirrors: this.githubMirrors,
        defaultBranch: repo.defaultBranch, routeState: {} });
      if (manifest) this.repoManifests.set(repo.fullName, manifest);
    }), 4);
    const names = [...new Set(repos.map(repo => this.repoManifests.get(repo.fullName))
      .filter(m => m?.name && m.private !== true).map(m => m.name))]
      .filter(name => !this.manifests.has(name)).slice(0, Math.max(0, this.manifestLimit));
    await mapLimit(names.map(name => async () => {
      const manifest = await this.fetchNpm(name, { signal });
      if (manifest) this.manifests.set(name, manifest);
    }), 4);
  }
  async build(options = {}) {
    if (!this.index) await this.adoptCache({ stale: true });
    if (!options.force && this.index && !this.isStale()) return this.reindex();
    // Continue interrupted scans. A completed scan starts a new enumeration.
    const checkpoint = !this.index?.scan?.complete && this.index?.scan?.checkpoint?.queue?.length
      ? this.index.scan.checkpoint : undefined;
    this.progress = 'Starting GitHub topic:dsh-plugin discovery';
    const signal = options.signal;
    try {
      const result = await this.scan({
        token: this.token, githubMirrors: this.githubMirrors, signal, checkpoint,
        spacingMs: this.spacingMs, maxRequests: this.maxRequests, routeState: this.routeState,
        onProgress: message => { this.progress = message; options.onProgress?.(message); },
        onCheckpoint: async current => {
          this.index = this.makeIndex(current.items, { complete: false, total: current.total,
            sources: current.sources, checkpoint: current });
          await this.saveCache();
        },
      });
      if (!result.complete && !result.items.length && this.index?.candidates.length) {
        // A failed new scan must not erase the last readable direct-discovery cache.
        this.index.scan = { complete: false, total: result.total, sources: this.index.scan.sources,
          checkpoint: result.checkpoint };
        this.index.errors = result.errors;
        this.progress = 'Discovery unavailable; showing cached repositories. Refresh to resume.';
        await this.saveCache();
        return this.index;
      }
      await this.enrich(result.items, signal);
      this.index = this.makeIndex(result.items, { complete: result.complete, total: result.total, sources: result.sources,
        checkpoint: result.complete ? null : result.checkpoint }, result.errors);
      this.progress = result.complete ? `Scan complete: ${result.items.length} repositories`
        : `Partial scan: ${result.items.length} repositories; refresh to resume`;
      await this.saveCache();
      return this.index;
    } catch (error) {
      this.index ??= this.fromSeed('discovery failed');
      this.index.errors = [`github: ${error.message}`];
      this.index.scan.complete = false;
      this.progress = 'Discovery failed; refresh to retry';
      await this.saveCache();
      return this.index;
    }
  }
  async searchLive({ text = '', signal, onProgress } = {}) {
    // A quoted literal cannot introduce qualifiers that escape the topic restriction.
    const literal = String(text).replace(/["\\\r\n]/g, ' ').slice(0, 120).trim();
    const query = `topic:dsh-plugin fork:true "${literal}" in:name,description,readme`;
    const result = await this.scan({ query, signal, token: this.token, githubMirrors: this.githubMirrors,
      spacingMs: this.spacingMs, maxRequests: this.maxRequests, onProgress, routeState: this.routeState });
    await this.enrich(result.items, signal);
    return { candidates: mergeCandidates({ repos: result.items, repoManifests: this.repoManifests,
      manifests: this.manifests, installed: this.installedProvider() }), errors: result.errors,
      total: result.total, complete: result.complete };
  }
  query({ text = '', category = '', tag = '', installable = false, excludeInstalled = false, limit = 20 } = {}) {
    const needle = String(text).trim().toLowerCase();
    return (this.reindex()?.candidates ?? [])
      .filter(c => !tag || c.tags.includes(tag)).filter(c => !category || c.category === category)
      .filter(c => !installable || c.installSpec).filter(c => !excludeInstalled || !c.installed)
      .filter(c => !needle || [c.npmName, c.packageName, c.repoFullName, c.description, c.category,
        c.topics.join(' '), c.keywords.join(' ')].join(' ').toLowerCase().includes(needle))
      .slice(0, Math.max(1, limit));
  }
}
