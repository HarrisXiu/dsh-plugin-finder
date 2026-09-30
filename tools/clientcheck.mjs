/**
 * Verification of the browser half, without a browser.
 *
 * The client bundle is a script that registers a factory through
 * `window.__ModuleLoader__.load`. This script reproduces that contract in a VM:
 * it loads the real `lib/client.js`, drives the factory with a minimal React and
 * a stubbed Cordis context, and renders both components once.
 *
 * What it proves: the bundle parses, registers under the exact package id,
 * declares the services it injects, registers the sidebar entry and the main
 * panel with the fields each slot requires, and renders a tree containing real
 * plugin rows. What it cannot prove: anything visual — slot placement, theme
 * appearance, and the sidebar actually showing the row.
 *
 * Run from the bundle directory: `node tools/clientcheck.mjs`
 */
import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'lib', 'client.js'), 'utf8');

let failures = 0;
const check = (label, condition, detail = '') => {
  if (condition) console.log(`  ok   ${label}`);
  else { failures += 1; console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`); }
};

/* ---------------------------------------------------------------- */
/* A React stub that is just real enough to run one render pass.     */
/* ---------------------------------------------------------------- */
let hookIndex = 0;
const element = (type, props, ...children) => ({
  type, props: { ...(props ?? {}), children: children.length <= 1 ? children[0] : children },
});
const React = {
  createElement: element,
  useState(initial) {
    hookIndex += 1;
    const value = typeof initial === 'function' ? initial() : initial;
    return [value, () => {}];
  },
  useMemo(factory) { hookIndex += 1; return factory(); },
  useCallback(fn) { hookIndex += 1; return fn; },
  useRef(initial) { hookIndex += 1; return { current: initial }; },
  useEffect() { hookIndex += 1; },
};

/** Render one function component, collecting any thrown error. */
function render(Component, props) {
  hookIndex = 0;
  try {
    return { tree: Component(props), error: null };
  } catch (error) {
    return { tree: null, error };
  }
}

/** Depth-first walk over the rendered element tree, yielding nodes and primitives. */
function* walk(node) {
  if (node === null || node === undefined || typeof node === 'boolean') return;
  if (Array.isArray(node)) { for (const child of node) yield* walk(child); return; }
  if (typeof node !== 'object') { yield node; return; }
  yield node;
  if (typeof node.type === 'function') {
    // Render nested function components the same way, so the assertions see the
    // final tree rather than a component reference.
    const nested = render(node.type, node.props ?? {});
    if (nested.error) throw nested.error;
    yield* walk(nested.tree);
    return;
  }
  yield* walk(node.props?.children);
}

/** Collect every piece of visible text in the tree. */
function textOf(node) {
  const out = [];
  for (const item of walk(node)) {
    if (typeof item === 'string' || typeof item === 'number') out.push(String(item));
  }
  return out.join(' ');
}

/** Collect every prop value with the given name across the tree. */
function propsNamed(node, name) {
  const out = [];
  for (const item of walk(node)) {
    if (item && typeof item === 'object' && item.props && item.props[name] !== undefined) {
      out.push(item.props[name]);
    }
  }
  return out;
}

/* ---------------------------------------------------------------- */
/* Load the bundle the way the module loader does.                   */
/* ---------------------------------------------------------------- */
console.log('1) loading lib/client.js through the module-loader contract');
let loaded = null;
let fetchCalls = 0;
const sandbox = {
  window: {
    __ModuleLoader__: {
      load(registration) { loaded = registration; },
    },
  },
  document: { documentElement: { lang: 'zh-CN' } },
  navigator: { language: 'zh-CN' },
  setTimeout,
  clearTimeout,
  AbortController,
  fetch: () => { fetchCalls += 1; return Promise.resolve({ ok: true, json: () => Promise.resolve({ plugins: [] }) }); },
  console,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

let loadError = null;
try {
  vm.runInContext(source, sandbox, { filename: 'lib/client.js' });
} catch (error) {
  loadError = error;
}
check('the bundle evaluates without throwing', loadError === null, String(loadError));
check('it registered exactly one factory', loaded !== null);
if (!loaded) { console.log('\ncannot continue without a registration'); process.exit(1); }
check('the factory id equals the npm package name', loaded.id === 'dsh-plugin-finder', String(loaded.id));
check('the factory is a function', typeof loaded.factory === 'function');
check('evaluating the bundle performed no fetch (the factory stays lazy)',
  fetchCalls === 0, `${fetchCalls} calls`);

/* ---------------------------------------------------------------- */
console.log('\n2) materializing the module');
let module = null;
let factoryError = null;
try {
  module = loaded.factory((specifier) => {
    if (specifier === 'react') return React;
    throw new Error(`require("${specifier}") missed the module table`);
  });
} catch (error) {
  factoryError = error;
}
check('factory() did not throw', factoryError === null, String(factoryError));
check('the module injects the slots and locale services',
  Array.isArray(module?.inject) && module.inject.includes('slots') && module.inject.includes('locale'),
  JSON.stringify(module?.inject));
check('the module exports apply()', typeof module?.apply === 'function');
check('the client module exports no Config (a host-half feature)', module?.Config === undefined);

/* ---------------------------------------------------------------- */
console.log('\n3) registering the sidebar entry and the main panel');
const registrations = [];
const localeNamespaces = [];
let injectedSlots = [];
const ctx = {
  effect(callback, label) { return callback?.(); },
  locale: {
    register(namespace, dictionaries) {
      localeNamespaces.push({ namespace, dictionaries });
      return () => {};
    },
    bind(namespace) {
      const entry = localeNamespaces.find((item) => item.namespace === namespace);
      return (key, params) => {
        const template = entry?.dictionaries?.zh?.[key] ?? entry?.dictionaries?.en?.[key] ?? key;
        return String(template).replace(/\{(\w+)\}/g, (_, name) => String(params?.[name] ?? `{${name}}`));
      };
    },
  },
  slots: {
    inject(slot, callback) {
      injectedSlots.push(slot);
      const disposer = callback();
      return disposer;
    },
    register(options, Component) { registrations.push({ options, Component }); return () => {}; },
  },
};

let applyError = null;
try {
  module.apply(ctx);
} catch (error) {
  applyError = error;
}
check('apply() did not throw', applyError === null, String(applyError));
check('a locale dictionary was registered', localeNamespaces.length === 1
  && Boolean(localeNamespaces[0].dictionaries.zh) && Boolean(localeNamespaces[0].dictionaries.en),
  JSON.stringify(localeNamespaces.map((item) => item.namespace)));
check('both slots were injected', injectedSlots.includes('sidebar.panellist') && injectedSlots.includes('main'),
  injectedSlots.join(', '));
check('exactly two registrations were made', registrations.length === 2, `${registrations.length}`);

const entry = registrations.find((item) => item.options.name === 'sidebar.panellist');
const panel = registrations.find((item) => item.options.name === 'main');
check('the sidebar entry registers into sidebar.panellist with a required id',
  entry?.options.id === 'plugin-finder', JSON.stringify(entry?.options));
check('the main panel registers into main with a matching key',
  panel?.options.key === 'plugin-finder', JSON.stringify(panel?.options));
check('the shared id joins the entry and the panel', entry?.options.id === panel?.options.key);
check('both registrations declare a locale (without it props.t is undefined and the entry vanishes)',
  entry?.options.locale === 'pluginFinder' && panel?.options.locale === 'pluginFinder',
  `${entry?.options.locale} / ${panel?.options.locale}`);
check('the sidebar entry has a label', entry?.options.label !== undefined);
check('the sidebar entry declares an order', Number.isFinite(entry?.options.order));
check('neither registration injects the owner-reserved size/active props',
  entry?.options.inject === undefined && panel?.options.inject === undefined);

/* ---------------------------------------------------------------- */
console.log('\n4) rendering both components once');
const t = ctx.locale.bind('pluginFinder');
check('the bound t() resolves a known key', t('panel').length > 0 && t('panel') !== 'panel', t('panel'));

const icon = render(entry.Component, { size: 16, active: false });
check('the sidebar glyph renders without throwing', icon.error === null, String(icon.error));
check('the glyph is an svg element', icon.tree?.type === 'svg', String(icon.tree?.type));

const rendered = render(panel.Component, { t });
check('the panel renders without throwing', rendered.error === null, String(rendered.error));
const text = rendered.tree ? textOf(rendered.tree) : '';
const hrefs = rendered.tree ? propsNamed(rendered.tree, 'href') : [];
const placeholders = rendered.tree ? propsNamed(rendered.tree, 'placeholder') : [];
check('the panel shows its own title', text.includes('DSH 插件发现'), text.slice(0, 120));
check('the panel renders repository links for plugin rows',
  hrefs.some((href) => String(href).startsWith('https://github.com/')),
  hrefs.slice(0, 5).join(', ') || 'no href found');
check('the panel renders npm links for installable rows',
  hrefs.some((href) => String(href).startsWith('https://www.npmjs.com/package/')),
  hrefs.slice(0, 5).join(', '));
check('the panel renders the catalog page and category chips',
  String(placeholders[0] ?? '').includes('搜索') && text.includes('全部'), String(placeholders[0]));
check('the panel explains how to install a copied package name',
  /Plugins/.test(text) && /Add plugin/.test(text), text.slice(0, 160));
check('the panel names real plugins from the snapshot',
  text.includes('dshmarket') || text.includes('modlens'), text.slice(0, 200));

// The main frame gives a panel a fixed height and clips it, so a page that does
// not take the full height and declare its own overflow simply cannot scroll.
// DSH's own main-panel pages do exactly this. This is the regression guard for
// the reported bug where the list rendered but could not be scrolled.
const rootRule = source.match(/\[data-plugin-finder\]\{[^}]*\}/)?.[0] ?? '';
check('the page root rule was found', rootRule.length > 0);
check('the page root takes the full height', /height:100%/.test(rootRule), rootRule.slice(0, 160));
check('the page root owns its own scrolling', /overflow:auto/.test(rootRule), rootRule.slice(0, 160));
check('the page root is a column that can constrain its children',
  /display:flex/.test(rootRule) && /flex-direction:column/.test(rootRule), rootRule.slice(0, 160));
check('direct children are constrained to a readable column',
  /\[data-plugin-finder\]>\*\{[^}]*max-width/.test(source));

/* ---------------------------------------------------------------- */
console.log('\n5) checking the bundled snapshot data');
const match = source.match(/var SNAPSHOT = (\{.*?\});\n/s);
check('the snapshot literal is present and parseable', Boolean(match));
if (match) {
  let snapshot = null;
  try { snapshot = JSON.parse(match[1]); } catch (error) { console.log(`     parse error: ${error.message}`); }
  check('the snapshot parses as JSON', snapshot !== null);
  if (snapshot) {
    const rows = snapshot.rows ?? [];
    console.log(`     rows=${rows.length} categories=${Object.keys(snapshot.categories ?? {}).length} catalogUpdated=${snapshot.updated}`);
    check('the snapshot carries rows', rows.length > 100, `${rows.length}`);
    check('every snapshot row has a GitHub repository URL',
      rows.every((row) => /^https:\/\/github\.com\//.test(row.url ?? '')),
      rows.filter((row) => !/^https:\/\/github\.com\//.test(row.url ?? '')).map((row) => row.name).join(', '));
    const withNpm = rows.filter((row) => row.npm);
    check('most snapshot rows also carry an npm package name', withNpm.length > rows.length * 0.5,
      `${withNpm.length}/${rows.length}`);
    check('every row has a description in at least one language',
      rows.every((row) => row.zh || row.en));
    check('the snapshot carries the category dictionary', Object.keys(snapshot.categories ?? {}).length > 10);
  }
}

/* ---------------------------------------------------------------- */
// The Host decides whether a package's browser half exists at all before any of
// the above can matter. `dsh-client-modules` drops a package silently when the
// bundle is not selected, when `dsh.client.platform` is not `web`, when
// `exports["./client"]` is missing or not a string, or when the bundle patch
// declares no row. That is the failure mode that renders nothing at all, so it
// is checked here against the real installed profile when one is present.
console.log('\n6) the bundle-discovery contract, as the Host evaluates it');
const profileName = process.env.DSH_PROFILE ?? 'desktop';
const dshHome = process.env.DSH_HOME ?? join(process.env.USERPROFILE ?? process.env.HOME ?? '', '.dsh');
const profileDir = process.env.DSH_PROFILE_DIR ?? join(dshHome, 'profiles', profileName);

if (!existsSync(join(profileDir, 'package.json'))) {
  console.log(`  --   no profile at ${profileDir}; skipping the installed-discovery check`);
} else {
  console.log(`     profile: ${profileDir}`);
  const profileManifest = JSON.parse(readFileSync(join(profileDir, 'package.json'), 'utf8'));
  const bundles = profileManifest?.dsh?.profile?.bundles ?? [];
  check('the profile selects this bundle in dsh.profile.bundles',
    bundles.includes('dsh-plugin-finder'), bundles.join(', '));

  const installedDir = join(profileDir, 'node_modules', 'dsh-plugin-finder');
  check('the bundle resolves in the profile node_modules', existsSync(installedDir), installedDir);
  if (existsSync(installedDir)) {
    const resolved = realpathSync(installedDir);
    check('the installed package is this directory (a link install)',
      resolved.toLowerCase() === realpathSync(root).toLowerCase(), `${resolved} vs ${realpathSync(root)}`);

    const manifest = JSON.parse(readFileSync(join(installedDir, 'package.json'), 'utf8'));
    check('the manifest declares a bundle patch',
      typeof manifest?.dsh?.bundle?.patch === 'string' && manifest.dsh.bundle.patch.length > 0,
      JSON.stringify(manifest?.dsh?.bundle));
    const patchPath = join(installedDir, String(manifest?.dsh?.bundle?.patch ?? ''));
    check('the declared patch file exists', existsSync(patchPath), patchPath);
    if (existsSync(patchPath)) {
      const patch = readFileSync(patchPath, 'utf8');
      check('the patch inserts a row naming this package', /name:\s*dsh-plugin-finder\b/.test(patch),
        patch.trim().split('\n').slice(0, 3).join(' / '));
    }
    check('dsh.client.platform is "web"', manifest?.dsh?.client?.platform === 'web',
      String(manifest?.dsh?.client?.platform));
    const clientExport = manifest?.exports?.['./client'];
    const clientTarget = typeof clientExport === 'string' ? clientExport : clientExport?.default;
    check('exports["./client"] is a string (a non-string export drops the package)', typeof clientTarget === 'string',
      JSON.stringify(clientExport));
    if (typeof clientTarget === 'string') {
      check('the exported browser bundle exists', existsSync(join(installedDir, clientTarget)), clientTarget);
    }
    check('the manifest exports ./package.json (the manager reads it for display metadata)',
      manifest?.exports?.['./package.json'] !== undefined);
    check('the manifest exports the locale files the manager resolves',
      Object.keys(manifest?.exports ?? {}).some((key) => key.startsWith('./locale/')),
      Object.keys(manifest?.exports ?? {}).join(', '));
    if (typeof manifest?.icon === 'string') {
      const iconPath = join(installedDir, manifest.icon);
      check('the declared icon exists', existsSync(iconPath), iconPath);
      check('the icon stays inside the package directory',
        realpathSync(dirname(iconPath)).startsWith(realpathSync(installedDir)));
    } else {
      check('the manifest declares an icon', false, 'no icon field');
    }
    check('every locale file the manifest exports exists',
      Object.entries(manifest?.exports ?? {})
        .filter(([key]) => key.startsWith('./locale/') && !key.includes('*'))
        .every(([, target]) => existsSync(join(installedDir, String(target)))),
      Object.entries(manifest?.exports ?? {}).filter(([key]) => key.startsWith('./locale/')).map(([, t]) => String(t)).join(', '));
  }
}

console.log(`\n${failures === 0 ? 'CLIENT BUNDLE CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
console.log('note: rendering is verified structurally, and the discovery contract against the real profile.');
console.log('      Whether the sidebar row is visible, and how the panel looks, still needs a browser.');
process.exit(failures === 0 ? 0 : 1);
