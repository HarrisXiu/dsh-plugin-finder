/** Browser contract plus actual async data/loading/polling behavior in a VM. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { mergeCandidates } from '../lib/core/candidates.js';

const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8');
const hooks = [], effects = [], timers = new Map(), requests = [];
let cursor = 0, timerId = 0, registration, slots = [], dictionaries, clipboard = '';
const React = {
  createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
  useState(initial) {
    const i = cursor++;
    if (!(i in hooks)) hooks[i] = typeof initial === 'function' ? initial() : initial;
    return [hooks[i], value => { hooks[i] = typeof value === 'function' ? value(hooks[i]) : value; }];
  },
  useMemo(fn) { cursor++; return fn(); },
  useCallback(fn) { cursor++; return fn; },
  useRef(initial) { const i = cursor++; return hooks[i] ??= { current: initial }; },
  useEffect(fn) { const i = cursor++; if (!(i in hooks)) { hooks[i] = true; effects.push(fn); } },
};
const repo = { fullName: 'fixture/plugin', topics: ['dsh-plugin'], description: 'A tagged repository', stars: 8, pushedAt: '', createdAt: '' };
const manifest = { name: 'fixture-package', dsh: { bundle: { patch: './patch.yml' } } };
const candidates = mergeCandidates({ repos: [repo, { ...repo, fullName: 'fork/plugin', archived: true }],
  repoManifests: new Map([[repo.fullName, manifest]]),
  manifests: new Map([[manifest.name, { ...manifest, repository: 'https://github.com/fixture/plugin' }]]) });
let step = 0, fail = false;
const sandbox = {
  window: { __ModuleLoader__: { load: value => { registration = value; } } },
  document: { documentElement: { lang: 'zh-CN' } },
  navigator: { language: 'zh-CN', clipboard: { writeText: async value => { clipboard = value; } } },
  AbortController, console,
  setTimeout: fn => { const id = ++timerId; timers.set(id, fn); return id; },
  clearTimeout: id => timers.delete(id),
  fetch: async (url, options) => {
    requests.push({ url, ...options });
    assert.ok(url.startsWith('/plugin-finder/'), 'browser must never fetch external catalogs');
    if (fail) return { ok: false, status: 503 };
    const data = step++ === 0
      ? { generatedAt: '', running: false, candidates: [], scan: { complete: false } }
      : step === 2
        ? { generatedAt: new Date().toISOString(), running: true, candidates: candidates.slice(0, 1), scan: { complete: false } }
        : { generatedAt: new Date().toISOString(), running: false, candidates, scan: { complete: true } };
    return { ok: true, json: async () => ({ mode: 'github-topic:dsh-plugin', categories: {}, errors: [],
      progress: data.running ? 'Scanning fixture' : 'Scan complete', ...data }) };
  },
};
vm.runInNewContext(source, sandbox);
assert.equal(registration.id, 'dsh-plugin-finder');
assert.equal(requests.length, 0, 'bundle loading must remain lazy');
const plugin = registration.factory(name => { assert.equal(name, 'react'); return React; });
assert.ok(plugin.inject.includes('slots') && plugin.inject.includes('locale'));
plugin.apply({
  effect: fn => fn(),
  locale: { register: (_ns, value) => { dictionaries = value; return () => {}; }, bind: () => t },
  slots: { inject: (_name, fn) => fn(), register: (options, Component) => { slots.push({ options, Component }); return () => {}; } },
});
function t(key, values = {}) {
  let text = dictionaries.zh[key] ?? key;
  for (const [name, value] of Object.entries(values)) text = text.replace('{' + name + '}', value);
  return text;
};
const sidebar = slots.find(s => s.options.name === 'sidebar.panellist');
const panel = slots.find(s => s.options.name === 'main');
assert.equal(sidebar.options.id, panel.options.key);
assert.equal(panel.options.locale, 'pluginFinder');
assert.equal(sidebar.options.locale, 'pluginFinder');
assert.equal(sidebar.Component({ size: 16, active: false }).type, 'svg');
const render = () => { cursor = 0; return panel.Component({ t }); };
function* walk(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return;
  if (Array.isArray(node)) { for (const child of node) yield* walk(child); return; }
  if (typeof node !== 'object') { yield node; return; }
  yield node;
  if (typeof node.type === 'function') { yield* walk(node.type(node.props)); return; }
  yield* walk(node.props?.children);
}
const textOf = tree => [...walk(tree)].filter(n => typeof n === 'string').join(' ');
const elements = tree => [...walk(tree)].filter(n => n && typeof n === 'object');
const tick = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
let tree = render();
assert.ok(!elements(tree).some(n => n.props?.href?.startsWith('https://www.npmjs.com/')), 'first offline render must not carry curated entries');
const cleanup = effects[0]();
await tick();
assert.equal(requests.length, 2);
assert.equal(requests[0].method, 'GET');
assert.equal(requests[1].method, 'POST');
tree = render();
assert.ok(textOf(tree).includes('fixture-package'));
assert.ok(textOf(tree).includes('Scanning fixture'));
assert.ok(elements(tree).some(n => n.props?.href === 'https://www.npmjs.com/package/fixture-package'));
const polling = [...timers.entries()][0]; timers.delete(polling[0]); polling[1]();
await tick();
tree = render();
assert.ok(textOf(tree).includes('fork/plugin') && textOf(tree).includes('已归档'));
assert.ok(textOf(tree).includes('Scan complete'));
assert.equal(requests[2].method, 'GET');
const copy = elements(tree).find(n => n.type === 'button' && textOf(n).includes('复制仓库'));
copy.props.onClick(); await tick(); assert.equal(clipboard, 'https://github.com/fork/plugin');
fail = true;
const refresh = elements(tree).find(n => n.type === 'button' && textOf(n).includes('扫描 / 继续扫描'));
refresh.props.onClick(); await tick();
tree = render();
assert.ok(textOf(tree).includes('HTTP 503'));
assert.ok(textOf(tree).includes('fixture-package'), 'failed refresh must keep existing rows');
cleanup();
assert.ok(!source.includes('awesome-dsh-plugin'));
const snapshot = JSON.parse(source.match(/var SNAPSHOT = (\{.*?\});/s)[1]);
assert.equal(snapshot.rows.length, 0);
assert.ok(source.includes('height:100%') && source.includes('overflow:auto'));
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
assert.equal(pkg.dsh.client.platform, 'web');
for (const target of [pkg.exports['./client'], pkg.dsh.bundle.patch, pkg.icon]) {
  assert.ok(existsSync(new URL('../' + target, import.meta.url)), target);
}
console.log('CLIENT CHECKS PASSED: lazy loading, slots/locales, cold start, POST scan, progress polling, rows, archived badge, copy, failure retention, cleanup and bundle contract.');
