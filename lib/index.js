/**
 * Plugin Finder — Host half.
 *
 * Registers one agent-facing tool, `dsh_plugin_finder`, that answers where DSH
 * plugins live: the npm package name, the GitHub repository, the community
 * signals, and the exact command that installs them.
 *
 * Design constraints this file deliberately respects:
 *
 * - **No bare imports.** A profile-installed plugin resolves `@deepseek-ai/*`
 *   only through the Host's resolver interception, and a failure there would
 *   stop the whole boot. Everything here comes from `node:` builtins and the
 *   global `fetch`, so module evaluation cannot fail.
 * - **Registration cannot throw out of `apply`.** A plugin row that throws
 *   during activation can take the boot with it, so the tool is registered
 *   inside a guard that reports the failure instead of propagating it.
 * - **Nothing runs until the tool is called.** The engine holds no timers and
 *   opens no sockets at activation.
 *
 * @module dsh-plugin-finder
 */
import { readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { FinderEngine } from './core/engine.js';
import { renderToolText } from './core/format.js';
import { mountFinderRoutes } from './core/routes.js';

/** Loader identity, used in diagnostics and by the profile patch. */
export const name = 'plugin-finder';

/** Wait for the tool registry before activating. */
export const inject = ['tools'];

/** The agent-facing tool name. Prefixed to avoid collisions with other plugins. */
export const TOOL_NAME = 'dsh_plugin_finder';

/** Everything the model needs to know to call the tool correctly. */
const TOOL_DESCRIPTION = `Find public GitHub repositories carrying the exact dsh-plugin topic, including forks and archived repositories.
suggest: search the direct-discovery cache; refresh: scan all result pages with timestamp partitions and resume interrupted scans;
search: query GitHub live within topic:dsh-plugin; stats: report cached state; diagnose: check plugin wiring.
Domestic GitHub API/raw mirrors provide fallback transport. npm/npmmirror only verifies published package metadata for discovered repositories.
Root manifests are optional enrichment. Missing manifests never remove a tagged repository.
Unverified npm names and undeclared bundles are not presented as confirmed install targets. Partial scans are reported explicitly.`;

/** The raw JSON Schema the model sees; no authoring helper is involved. */
const TOOL_PARAMETERS = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['suggest', 'search', 'refresh', 'stats', 'diagnose'],
      description: 'suggest: ranked matches from the direct GitHub cache. search: live topic:dsh-plugin queries. refresh: enumerate all topic results or resume a partial scan. stats: report index state. diagnose: report whether this plugin\'s own Host row and browser half are actually mounted.',
    },
    query: {
      type: 'string',
      description: 'Free text matched against package name, repository, description, category, and keywords. Required for "search".',
    },
    category: {
      type: 'string',
      description: 'Restrict to one inferred category: ui, tools, memory, theme, workflow, vision, market.',
    },
    tag: {
      type: 'string',
      enum: ['bundle', 'bundle-partial', 'ui', 'profile'],
      description: 'Restrict to a manifest shape: bundle installs through a cordis patch, ui ships a browser half, profile supplies an agent preset.',
    },
    installable: {
      type: 'boolean',
      description: 'When true, only repositories whose root manifest declares dsh.bundle.patch are returned; npm publication is optional.',
    },
    limit: {
      // Stated in the description rather than as `minimum`/`maximum`: the
      // registry accepts only the documented keyword subset, and the model reads
      // the prose anyway.
      type: 'integer',
      description: 'Maximum rows to return, 1 to 50. Defaults to 15.',
    },
    offline: {
      type: 'boolean',
      description: 'Never touch the network; use only caches from direct topic discovery. A first offline run is empty.',
    },
  },
  required: ['action'],
};

/**
 * Activate the plugin.
 * @param {any} ctx - the Cordis context carrying the `tools` service.
 * @param {object} [config] - the row's config object, passed through verbatim.
 * @returns {void}
 */
export function apply(ctx, config = {}) {
  const settings = config && typeof config === 'object' ? config : {};
  const log = makeLogger(ctx);
  // The Host process does not carry DSH_PROFILE in its environment, so the
  // profile is read from the service the composition already provides. Both
  // fields are optional: a host without the service simply renders a more
  // generic install hint.
  const profile = readProfileContext(ctx);

  let engine;
  try {
    engine = new FinderEngine({
      cachePath: settings.cachePath ?? defaultCachePath(),
      cacheTtlMs: minutes(settings.cacheTtlMinutes, 720),
      token: readToken(settings),
      githubMirrors: settings.githubMirrors,
      maxRequests: settings.maxSearchRequests,
      manifestLimit: settings.manifestLimit,
      repoLimit: settings.repoLimit,
      profile: profile.name,
      // `|| undefined` so an empty resolved directory still falls back to the
      // environment instead of reporting "nothing installed".
      installedProvider: () => installedPackages(profile.dir || undefined),
      log: message => log('warn', message),
    });
  } catch (error) {
    log('error', `engine construction failed: ${error?.message ?? error}`);
    return;
  }

  if (settings.enabled === false) {
    log('info', 'disabled by config; no tool registered');
    return;
  }

  // Optional service injection keeps the tool usable in headless profiles too.
  if (typeof ctx.inject === 'function') {
    ctx.inject(['webServer'], host => {
      host.effect(() => mountFinderRoutes(host, engine), 'plugin-finder:http');
    });
  }

  try {
    // A raw registration: `parameters` is already valid JSON Schema, which the
    // registry forwards to the model untouched, so no authoring helper is needed.
    ctx.tools.register({
      name: TOOL_NAME,
      description: TOOL_DESCRIPTION,
      parameters: TOOL_PARAMETERS,
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: String(value) }],
      },
      // The engine serializes its own refreshes; a second concurrent call would
      // only wait on the same promise while holding the turn open.
      isConcurrencySafe: () => false,
      timeoutMs: 1800000,
      execute: (args, exec) => run(engine, args, exec, profile, ctx),
    });
    log('info', `registered tool ${TOOL_NAME}${profile.name ? ` for profile "${profile.name}"` : ''}`);
  } catch (error) {
    // Never let a registration failure escape: the row stays loaded, the tool is
    // simply absent, and the reason is in the log.
    log('error', `registering ${TOOL_NAME} failed: ${error?.message ?? error}`);
  }
}

/**
 * Report what the running Host knows about this plugin's own wiring.
 *
 * The failure this exists for is silent: `dsh-client-modules` drops a package's
 * browser half without any user-visible error when the bundle is not selected,
 * when `dsh.client.platform` is not `web`, when `exports["./client"]` is missing,
 * or when the patch declares no row. The composed graph is therefore asked
 * directly — `clientModules.clientPath(id)` answers with the bundle path only
 * when the package made it into `window.__DSH_BOOT__`.
 *
 * Every probe is guarded: a diagnostic that throws would be worse than useless.
 *
 * @param {any} ctx - the Cordis context captured at activation.
 * @param {{name: string, dir: string}} profile - the profile identity.
 * @returns {string} a line-per-fact report.
 */
function wiringReport(ctx, profile) {
  const out = [];
  const attempt = (label, probe) => {
    try {
      const value = probe();
      out.push(`${label}: ${value === undefined || value === '' ? '(not available)' : value}`);
    } catch (error) {
      out.push(`${label}: probe failed (${error?.message ?? error})`);
    }
  };
  const service = (name) => {
    try { return ctx?.get?.(name); } catch { return undefined; }
  };

  attempt('profile', () => `name=${profile.name || '(not exposed)'} dir=${profile.dir || '(not exposed)'}`);
  attempt('services', () => ['loader', 'clientModules', 'webServer', 'profileContext', 'tools']
    .map((name) => `${name}=${service(name) === undefined ? 'ABSENT' : 'present'}`).join(' '));

  // The row itself: a mounted row means the Host half loaded and the patch applied.
  attempt('host row', () => {
    const loader = service('loader');
    if (typeof loader?.entries !== 'function') return 'loader.entries() is not available';
    const entries = [...loader.entries()];
    const mine = entries.filter((entry) => /plugin-finder/.test(String(entry?.options?.name ?? entry?.id ?? '')));
    if (!mine.length) return `not found among ${entries.length} loader entries`;
    return mine.map((entry) => `${entry?.options?.name ?? entry?.id} state=${entry?.fiber?.state ?? entry?.state ?? 'unknown'}`).join('; ');
  });

  // The decisive answer for the UI question.
  attempt('browser half', () => {
    const clientModules = service('clientModules');
    if (typeof clientModules?.clientPath !== 'function') return 'clientModules.clientPath() is not available';
    const path = clientModules.clientPath('dsh-plugin-finder');
    return path === undefined
      ? 'NOT COMPOSED — the browser half was not discovered, so no sidebar entry can appear'
      : `composed, bundle at ${path}`;
  });

  attempt('boot graph', () => {
    const clientModules = service('clientModules');
    if (typeof clientModules?.graph !== 'function') return 'clientModules.graph() is not available';
    const hits = findPaths(clientModules.graph(), 'plugin-finder');
    return hits.length
      ? `mentions this plugin at ${hits.slice(0, 5).join(', ')}`
      : 'does NOT mention this plugin anywhere in the served boot graph';
  });

  attempt('bundle route', () => {
    const clientModules = service('clientModules');
    const webServer = service('webServer');
    if (webServer === undefined) return 'webServer is absent, so the browser cannot fetch any bundle';
    if (typeof clientModules?.clientPath !== 'function') return 'clientModules.clientPath() is not available';
    return clientModules.clientPath('dsh-plugin-finder') === undefined
      ? 'nothing to serve: the bundle is not composed'
      : 'webServer is present and serves /plugins for composed bundles';
  });

  return out.join('\n');
}

/**
 * Collect the JSON paths at which a substring occurs inside a nested value.
 * Shape-agnostic on purpose: the boot graph's structure is not part of this
 * plugin's contract, and a diagnostic must not depend on it.
 * @param {unknown} value - the value to scan.
 * @param {string} needle - the substring to look for.
 * @returns {string[]} dotted paths, bounded in number and depth.
 */
function findPaths(value, needle) {
  const found = [];
  const seen = new Set();
  const walk = (node, path, depth) => {
    if (found.length >= 40 || depth > 8 || node === null || node === undefined) return;
    if (typeof node === 'string') {
      if (node.includes(needle)) found.push(path);
      return;
    }
    if (typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      node.slice(0, 64).forEach((child, position) => walk(child, `${path}[${position}]`, depth + 1));
      return;
    }
    for (const [key, child] of Object.entries(node).slice(0, 64)) walk(child, `${path}.${key}`, depth + 1);
  };
  walk(value, '$', 0);
  return found;
}

/**
 * Read the profile identity from the composition.
 *
 * `profileContext` is the service the Cordis patch layer gates profile-only rows
 * on, so it is present in exactly the deployments where a profile-scoped install
 * command makes sense. Nothing here may throw: a host without the service is a
 * supported deployment.
 *
 * @param {any} ctx - the Cordis context.
 * @returns {{name: string, dir: string}} the profile name and directory, either possibly empty.
 */
function readProfileContext(ctx) {
  const out = { name: '', dir: '' };
  try {
    const profile = ctx?.get?.('profileContext');
    if (!profile || typeof profile !== 'object') return out;
    for (const key of ['name', 'profileName', 'id']) {
      if (typeof profile[key] === 'string' && profile[key]) { out.name = profile[key]; break; }
    }
    for (const key of ['directory', 'dir', 'path', 'home', 'profileDir']) {
      if (typeof profile[key] === 'string' && profile[key]) { out.dir = profile[key]; break; }
    }
  } catch {
    // A context without a usable profile service reports nothing.
  }
  return out;
}

/**
 * Execute one tool call.
 * @param {FinderEngine} engine - the shared engine.
 * @param {object} args - validated arguments from the model.
 * @param {any} exec - the execution context, carrying an abort signal.
 * @param {{name: string, dir: string}} profile - the profile identity.
 * @param {any} ctx - the Cordis context, for the wiring diagnostic.
 * @returns {Promise<string>} the text the model receives.
 */
async function run(engine, args, exec, profile, ctx) {
  exec?.signal?.throwIfAborted?.();
  const action = typeof args?.action === 'string' ? args.action : '';
  const query = typeof args?.query === 'string' ? args.query.trim() : '';
  const limit = clamp(args?.limit, 1, 50, 15);
  const signal = exec?.signal;
  const render = { limit, profile: profile.name };
  const header = (index) => [
    `DSH plugin finder | action=${action}${query ? ` query="${query}"` : ''}`,
    `index: ${index.counts.candidates} plugins known, ${index.counts.published ?? 0} verified npm packages, `
      + `GitHub topic:dsh-plugin; scan=${index.scan?.complete ? 'complete' : 'partial'}; built ${index.generatedAt}`,
    index.errors?.length ? `warnings: ${index.errors.join(' | ')}` : '',
  ].filter(Boolean).join('\n');

  // Reports what the Host itself knows about this plugin's wiring, which is the
  // only way to tell whether the browser half will actually appear in the UI.
  if (action === 'diagnose') {
    const index = await engine.suggest({ offline: true, signal });
    return `${header(index)}\n\n${wiringReport(ctx, profile)}`;
  }

  if (action === 'stats') {
    const index = await engine.suggest({ offline: true, signal });
    const installed = installedPackages(profile.dir || undefined);
    return [
      header(index),
      `sources: ${index.scan?.sources?.join(', ') || 'no direct-discovery cache yet'}`,
      `profile: name=${profile.name || '(not exposed by this host)'} dir=${profile.dir || '(not exposed)'} `
        + `installed-detected=${installed.size}`,
      `cache: ${engine.cachePath || '(memory only)'}`,
    ].join('\n');
  }

  if (action === 'refresh') {
    const index = await engine.refresh({ force: true, signal });
    return `${header(index)}\n${engine.progress}`;
  }

  if (action === 'search') {
    if (!query) throw new Error('action "search" requires a non-empty query');
    const index = await engine.suggest({ offline: true, signal });
    const local = engine.query({
      text: query, category: args?.category ?? '', tag: args?.tag ?? '',
      installable: args?.installable === true, limit,
    });
    const lines = [];
    if (local.length) {
      lines.push(`Cached topic matches for "${query}" (${local.length}):`);
      lines.push(renderToolText(local, render));
    }
    if (args?.offline === true) {
      return `${header(index)}\n${lines.join('\n') || `No cached match for "${query}" (offline).`}`;
    }
    const live = await engine.searchLive({ text: query, signal });
    const fresh = live.candidates.filter(candidate => (!args?.category || candidate.category === args.category)
      && (!args?.tag || candidate.tags.includes(args.tag)) && (!args?.installable || candidate.installSpec)).slice(0, limit);
    lines.push(`\nLive GitHub topic:dsh-plugin search for "${query}" (${live.total ?? 0} repository hits, `
      + `scan=${live.complete ? 'complete' : 'partial'}):`);
    lines.push(fresh.length ? renderToolText(fresh, render) : 'No new live match.');
    if (live.errors.length) lines.push(`search warnings: ${live.errors.join(' | ')}`);
    return `${header(index)}\n${lines.join('\n')}`;
  }

  if (action !== 'suggest') {
    throw new Error(`unsupported action ${JSON.stringify(action)}; expected suggest, search, refresh, stats, or diagnose`);
  }

  const index = await engine.suggest({ offline: args?.offline === true, signal });
  const rows = engine.query({
    text: query, category: args?.category ?? '', tag: args?.tag ?? '',
    installable: args?.installable === true, limit,
  });
  if (!rows.length) {
    return `${header(index)}\nNo plugin matched. Try a broader query, drop the category or tag filter, `
      + `or use action "refresh" to rebuild the index.`;
  }
  const tail = profile.name
    ? `\n\nInstall a package name from the sidebar Plugins page (Add plugin), `
      + `or run: dsh plugin --profile ${profile.name} add <name>`
    : '\n\nInstall a package name from the sidebar Plugins page (Add plugin).';
  return `${header(index)}\n\n${renderToolText(rows, render)}${tail}`;
}

/**
 * Build the diagnostic logger. A Host logger may be absent or differently
 * shaped, and logging must never be the reason a call fails.
 * @param {any} ctx - the Cordis context.
 * @returns {(level: string, message: string) => void} a safe sink.
 */
function makeLogger(ctx) {
  return (level, message) => {
    try {
      const logger = ctx?.logger;
      const sink = typeof logger?.[level] === 'function' ? logger[level].bind(logger)
        : typeof logger?.info === 'function' ? logger.info.bind(logger)
          : undefined;
      sink?.(`[${name}] ${message}`);
    } catch {
      // A logger is a convenience, never a requirement.
    }
  };
}

/**
 * Resolve the on-disk cache location.
 * @returns {string} an absolute path under the DSH home directory.
 */
function defaultCachePath() {
  const home = process.env.DSH_HOME || join(homedir(), '.dsh');
  return join(home, 'plugin-finder', 'cache.json');
}

/**
 * Read the GitHub token from the environment, never from the config file, so a
 * secret does not end up in the profile's patch file.
 * @param {object} settings - the row config.
 * @returns {string} the token, or an empty string.
 */
function readToken(settings) {
  const names = Array.isArray(settings.githubTokenEnv) ? settings.githubTokenEnv : ['GITHUB_TOKEN', 'GH_TOKEN'];
  for (const key of names) {
    const value = process.env[String(key)];
    if (value) return value;
  }
  return '';
}

/**
 * Collect the npm names this profile already has installed, so the suggestion
 * list can mark them instead of proposing them again.
 * @param {string} [dir] - the profile directory; falls back to the environment.
 * @returns {Set<string>} lower-cased package names.
 */
export function installedPackages(dir = profileDir()) {
  const found = new Set();
  if (!dir) return found;
  try {
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    for (const field of ['dependencies', 'devDependencies']) {
      for (const dependency of Object.keys(manifest?.[field] ?? {})) found.add(dependency.toLowerCase());
    }
  } catch {
    // A profile without a readable manifest simply has no known installations.
  }
  try {
    const modules = join(dir, 'node_modules');
    for (const entry of readdirSync(modules)) {
      if (entry.startsWith('.')) continue;
      if (entry.startsWith('@')) {
        try {
          for (const scoped of readdirSync(join(modules, entry))) found.add(`${entry}/${scoped}`.toLowerCase());
        } catch { /* an unreadable scope contributes nothing */ }
      } else {
        found.add(entry.toLowerCase());
      }
    }
  } catch {
    // node_modules may legitimately be absent.
  }
  return found;
}

/**
 * Resolve this profile's directory.
 *
 * `DSH_PROFILE_DIR` is set for every shell a profile-launched Harness starts,
 * but the Host process itself may not carry it, so the documented layout under
 * `DSH_HOME` is the fallback.
 * @returns {string} an absolute path, or an empty string when neither is known.
 */
function profileDir() {
  if (process.env.DSH_PROFILE_DIR) return process.env.DSH_PROFILE_DIR;
  const home = process.env.DSH_HOME;
  const profile = process.env.DSH_PROFILE;
  return home && profile ? join(home, 'profiles', profile) : '';
}

/** Convert a minutes setting to milliseconds with a default. */
function minutes(value, fallbackMinutes) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackMinutes * 60 * 1000;
  return Math.min(parsed, 60 * 24 * 30) * 60 * 1000;
}

/** Clamp an optional numeric argument. */
function clamp(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}
