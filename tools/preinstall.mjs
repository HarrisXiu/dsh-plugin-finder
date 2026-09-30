/**
 * Pre-installation dry run for the Host half.
 *
 * The profile recomposes as soon as the bundle is installed, and a plugin that
 * throws during activation can take the whole boot with it. This script
 * therefore exercises the exact code path the Host will run, with a fake Cordis
 * context and no network, before anything is installed:
 *
 * 1. import the module and check its export form;
 * 2. call `apply()` with a stub context and capture the registration;
 * 3. validate the registered tool against the JSON-Schema subset the registry
 *    enforces and the parameter shape the model receives;
 * 4. call the tool's own `execute()` for every offline action.
 *
 * Run from the bundle directory: `node tools/preinstall.mjs`
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

let failures = 0;
const check = (label, condition, detail = '') => {
  if (condition) console.log(`  ok   ${label}`);
  else { failures += 1; console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`); }
};

console.log('1) importing the Host module');
const module = await import(new URL('../lib/index.js', import.meta.url));
check('exports a name', typeof module.name === 'string' && module.name.length > 0, JSON.stringify(module.name));
check('injects the tools service', Array.isArray(module.inject) && module.inject.includes('tools'),
  JSON.stringify(module.inject));
check('exports apply()', typeof module.apply === 'function');
check('does not export a default (never mix export forms)', module.default === undefined);
check('does not export Config (a plain object would throw at activation)', module.Config === undefined);

console.log('\n2) activating against a stub context');
const registered = [];
const logs = [];
const ctx = {
  logger: {
    info: (message) => logs.push(`info ${message}`),
    warn: (message) => logs.push(`warn ${message}`),
    error: (message) => logs.push(`error ${message}`),
  },
  // A host without the profile service: the generic install hint must be used.
  get: () => undefined,
  tools: {
    register(definition) {
      registered.push(definition);
      return () => {};
    },
  },
};

let applyError = null;
try {
  module.apply(ctx, {});
} catch (error) {
  applyError = error;
}
check('apply() did not throw', applyError === null, String(applyError));
check('registered exactly one tool', registered.length === 1, `${registered.length} registrations`);
console.log(`     logs: ${logs.join(' | ') || '(none)'}`);

const tool = registered[0];
if (!tool) {
  console.log('\nno tool was registered; stopping here');
  process.exit(1);
}

console.log('\n3) validating the registration');
check('tool name is the documented one', tool.name === 'dsh_plugin_finder', String(tool.name));
check('tool has a description', typeof tool.description === 'string' && tool.description.length > 40);
check('output declares a schema', tool.output?.schema?.type === 'string', JSON.stringify(tool.output?.schema));
check('output declares render()', typeof tool.output?.render === 'function');
const rendered = tool.output.render({}, 'sample');
check('render() returns text content blocks',
  Array.isArray(rendered) && rendered[0]?.type === 'text' && rendered[0]?.text === 'sample',
  JSON.stringify(rendered));
check('timeoutMs is a positive finite number',
  Number.isFinite(tool.timeoutMs) && tool.timeoutMs > 0, String(tool.timeoutMs));
check('isConcurrencySafe returns a boolean', typeof tool.isConcurrencySafe?.( {}) === 'boolean');

// The registry asserts output.schema against this subset; parameters are sent to
// the model as-is, so both must stay inside it.
const ALLOWED = new Set(['type', 'oneOf', 'properties', 'required', 'additionalProperties', 'items', 'enum', 'const',
  'description', 'title', 'default', 'examples']);
const walkSchema = (node, path, problems) => {
  if (!node || typeof node !== 'object') return;
  for (const key of Object.keys(node)) {
    if (!ALLOWED.has(key)) problems.push(`${path}.${key}`);
  }
  if (node.properties) {
    for (const [key, value] of Object.entries(node.properties)) walkSchema(value, `${path}.properties.${key}`, problems);
  }
  if (node.items) walkSchema(node.items, `${path}.items`, problems);
};

const parameterProblems = [];
walkSchema(tool.parameters, 'parameters', parameterProblems);
check('parameters use only supported JSON-Schema keywords', parameterProblems.length === 0, parameterProblems.join(', '));
const outputProblems = [];
walkSchema(tool.output.schema, 'output.schema', outputProblems);
check('output.schema uses only supported keywords', outputProblems.length === 0, outputProblems.join(', '));
check('parameters are object-rooted with declared properties',
  tool.parameters?.type === 'object' && Object.keys(tool.parameters.properties ?? {}).length > 0);
check('every property carries a description for the model',
  Object.values(tool.parameters.properties ?? {}).every((property) => typeof property.description === 'string'),
  Object.entries(tool.parameters.properties ?? {}).filter(([, value]) => typeof value.description !== 'string').map(([key]) => key).join(', '));

console.log('\n3b) activating with a profileContext service');
const profileRegistrations = [];

/** A loader stub shaped like the real one: entries carry an id, a name, and a fiber. */
const makeLoader = () => ({
  entries: () => [
    { id: 'whale-pet', options: { name: 'dsh-plugin-whale-pet' }, fiber: { state: 2 } },
    { id: 'plugin-finder', options: { name: 'dsh-plugin-finder' }, fiber: { state: 2 } },
  ],
});

/** A clientModules stub; `composed` decides whether the browser half was discovered. */
const makeClientModules = (composed) => ({
  clientPath: (id) => (composed && id === 'dsh-plugin-finder' ? join(root, 'lib', 'client.js') : undefined),
  graph: () => (composed
    ? { plugins: [{ id: 'dsh-plugin-finder', immediately: true }], combos: [] }
    : { plugins: [{ id: 'dsh-plugin-whale-pet' }], combos: [] }),
});

const makeProfileContext = (composed) => ({
  logger: { info: () => {}, warn: () => {}, error: () => {} },
  get: (name) => {
    if (name === 'profileContext') return { name: 'desktop', dir: join(root, '.build', 'fake-profile') };
    if (name === 'loader') return makeLoader();
    if (name === 'clientModules') return makeClientModules(composed);
    if (name === 'webServer') return { register: () => () => {} };
    if (name === 'tools') return { register: () => () => {} };
    return undefined;
  },
  tools: { register: (definition) => { profileRegistrations.push(definition); return () => {}; } },
});

let profileApplyError = null;
try {
  module.apply(makeProfileContext(true), {});
} catch (error) {
  profileApplyError = error;
}
check('apply() survives a context that exposes profileContext', profileApplyError === null, String(profileApplyError));
check('the tool is registered in that context too', profileRegistrations.length === 1);

if (profileRegistrations.length === 1) {
  const withProfile = await profileRegistrations[0].execute({ action: 'suggest', offline: true, limit: 1 }, {});
  console.log(`--- action: suggest with a profile (limit 1) ---\n${withProfile}\n`);
  check('the install command names the profile', withProfile.includes('dsh plugin --profile desktop add '),
    withProfile.split('\n').filter((line) => line.includes('install:')).join(' / '));
  const diagnostics = await profileRegistrations[0].execute({ action: 'stats', offline: true }, {});
  check('stats reports the profile it resolved', diagnostics.includes('name=desktop'), diagnostics);
}

console.log('\n3c) the wiring diagnostic');
const composedTool = profileRegistrations[0];
const composed = await composedTool.execute({ action: 'diagnose' }, {});
console.log(`--- action: diagnose (browser half composed) ---\n${composed}\n`);
check('diagnose names the plugin\'s own loader row', /dsh-plugin-finder state=2/.test(composed), composed);
check('diagnose finds the composed browser bundle', /browser half: composed, bundle at /.test(composed), composed);
check('diagnose finds this plugin in the boot graph', /mentions this plugin at /.test(composed), composed);

// The same plugin, in a host where the browser half was dropped: the diagnostic
// must say so plainly rather than reporting success.
const droppedRegistrations = [];
const droppedCtx = makeProfileContext(false);
droppedCtx.tools = { register: (definition) => { droppedRegistrations.push(definition); return () => {}; } };
module.apply(droppedCtx, {});
const dropped = await droppedRegistrations[0].execute({ action: 'diagnose' }, {});
console.log(`--- action: diagnose (browser half dropped) ---\n${dropped}\n`);
check('diagnose reports a missing browser half as NOT COMPOSED', /browser half: NOT COMPOSED/.test(dropped), dropped);
check('diagnose reports the boot graph omission', /does NOT mention this plugin/.test(dropped), dropped);

// A context with none of the services must degrade, not throw.
const bareRegistrations = [];
module.apply({
  logger: { info: () => {}, warn: () => {}, error: () => {} },
  get: () => undefined,
  tools: { register: (definition) => { bareRegistrations.push(definition); return () => {}; } },
}, {});
let bareError = null;
let bareReport = '';
try {
  bareReport = await bareRegistrations[0].execute({ action: 'diagnose' }, {});
} catch (error) {
  bareError = error;
}
check('diagnose never throws when no service is reachable', bareError === null, String(bareError));
check('diagnose reports the absent services', /clientModules=ABSENT/.test(bareReport), bareReport);

console.log('\n4) executing the offline actions');
const runOffline = async (args) => tool.execute(args, { signal: undefined });

const stats = await runOffline({ action: 'stats', offline: true });
console.log(`--- action: stats ---\n${stats}\n`);
check('stats reports the index state', stats.includes('DSH plugin finder') && stats.includes('plugins known'));

const suggest = await runOffline({ action: 'suggest', offline: true, limit: 3 });
console.log(`--- action: suggest (limit 3) ---\n${suggest}\n`);
check('suggest returns ranked rows with repositories', /repo: https:\/\/github\.com\//.test(suggest));
check('suggest renders an install hint for every row',
  (suggest.match(/install: /g) ?? []).length === 3, String((suggest.match(/install: /g) ?? []).length));
check('without a profile service the hint points at the Plugins page and never emits a broken CLI form',
  suggest.includes('sidebar Plugins page') && !/dsh plugin add /.test(suggest));

const filtered = await runOffline({ action: 'suggest', offline: true, category: 'memory', limit: 2, installable: true });
console.log(`--- action: suggest category=memory ---\n${filtered}\n`);
check('category filter is honored', filtered.includes('category: memory'));

const searched = await runOffline({ action: 'search', query: 'market', offline: true, limit: 2 });
console.log(`--- action: search query=market (offline) ---\n${searched}\n`);
check('offline search reads the local index only', searched.includes('offline'));

let errorForBadAction = null;
try {
  await runOffline({ action: 'nonsense' });
} catch (error) {
  errorForBadAction = error;
}
check('an unsupported action throws (the model sees isError)', errorForBadAction !== null);

let errorForEmptySearch = null;
try {
  await runOffline({ action: 'search', query: '   ' });
} catch (error) {
  errorForEmptySearch = error;
}
check('an empty search query throws a clear error', errorForEmptySearch !== null,
  String(errorForEmptySearch?.message));

console.log(`\n${failures === 0 ? 'PRE-INSTALL DRY RUN PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
