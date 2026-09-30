/**
 * The two discovery sources behind the suggestion list: the GitHub REST API and
 * the npm registry.
 *
 * Both are public and reachable without credentials. GitHub's unauthenticated
 * search budget is small (about ten searches per minute, sixty core requests
 * per hour), so this module keeps the query set short, spaces searches out, and
 * reports rate-limit exhaustion instead of silently returning nothing. An
 * optional token, read from the environment by the Host plugin, raises the
 * limits and is never logged.
 *
 * @module dsh-plugin-finder/core/sources
 */
import { getJson, sleep } from './http.js';

const GITHUB_API = 'https://api.github.com';
const NPM_REGISTRY = 'https://registry.npmjs.org';
const NPM_DOWNLOADS = 'https://api.npmjs.org/downloads/point/last-month';

/**
 * The repository searches that actually find DSH plugins. Kept deliberately
 * short: each entry costs one request from a ten-per-minute budget.
 */
export const GITHUB_QUERIES = Object.freeze([
  'topic:dsh-plugin',
  'topic:deepseek-harness',
  'dsh-plugin in:name',
  '"dsh plugin" in:description,readme',
  '"deepseek harness" plugin in:description,readme',
]);

/** The registry searches that actually find DSH plugin packages. */
export const NPM_QUERIES = Object.freeze([
  'dsh-plugin',
  'deepseek-harness',
  'keywords:dsh-plugin',
  'dsh bundle plugin',
]);

/**
 * GitHub request headers, including a token when one is configured.
 * @param {string|undefined} token - a personal access token, or nothing.
 * @returns {Record<string,string>} headers for the GitHub API.
 */
function githubHeaders(token) {
  const headers = {
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
  };
  if (token) headers.authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Search GitHub repositories and return raw, already-normalized repository records.
 * @param {string} query - a GitHub repository search qualifier string.
 * @param {object} [options] - search options.
 * @param {string} [options.token] - GitHub token.
 * @param {number} [options.perPage] - results per query, default 40.
 * @param {AbortSignal} [options.signal] - cancellation.
 * @returns {Promise<{items: object[], total: number, error?: string}>} matches, or the failure reason.
 */
export async function searchGithubRepos(query, options = {}) {
  const { token, perPage = 40, signal } = options;
  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}`
    + `&sort=stars&order=desc&per_page=${Math.min(100, Math.max(1, perPage))}`;
  const result = await getJson(url, { headers: githubHeaders(token), signal, timeoutMs: 20000 });
  if (!result.ok) return { items: [], total: 0, error: result.error, rateLimit: result.rateLimit };
  const items = Array.isArray(result.data?.items) ? result.data.items : [];
  return {
    items: items.map(toRepoRecord),
    total: Number(result.data?.total_count ?? items.length),
    rateLimit: result.rateLimit,
  };
}

/**
 * Reduce one GitHub search result to the fields the finder keeps.
 * @param {object} raw - one element of `items` from the search response.
 * @returns {object} a repository record.
 */
function toRepoRecord(raw) {
  const license = raw?.license?.spdx_id;
  return {
    fullName: String(raw?.full_name ?? ''),
    htmlUrl: String(raw?.html_url ?? ''),
    description: typeof raw?.description === 'string' ? raw.description : '',
    topics: Array.isArray(raw?.topics) ? raw.topics.map(String) : [],
    stars: Number(raw?.stargazers_count ?? 0),
    forks: Number(raw?.forks_count ?? 0),
    openIssues: Number(raw?.open_issues_count ?? 0),
    pushedAt: typeof raw?.pushed_at === 'string' ? raw.pushed_at : '',
    createdAt: typeof raw?.created_at === 'string' ? raw.created_at : '',
    archived: raw?.archived === true,
    license: typeof license === 'string' && license !== 'NOASSERTION' ? license : '',
    defaultBranch: typeof raw?.default_branch === 'string' ? raw.default_branch : 'HEAD',
    homepage: typeof raw?.homepage === 'string' ? raw.homepage : '',
  };
}

/**
 * Read a repository's `package.json` — the authoritative source for its npm
 * package name and its `dsh` manifest keys.
 * @param {string} fullName - `owner/repo`.
 * @param {object} [options] - read options.
 * @param {string} [options.token] - GitHub token, used for the API fallback.
 * @param {AbortSignal} [options.signal] - cancellation.
 * @returns {Promise<object|null>} the manifest, or null when the repository has none.
 */
export async function fetchRepoManifest(fullName, options = {}) {
  const { token, signal } = options;
  if (!/^[\w.-]+\/[\w.-]+$/.test(fullName)) return null;
  // raw.githubusercontent serves the default branch as HEAD for every repository.
  const raw = await getJson(`https://raw.githubusercontent.com/${fullName}/HEAD/package.json`, {
    signal, timeoutMs: 12000, retries: 0,
  });
  if (raw.ok && raw.data && typeof raw.data === 'object') return raw.data;
  // A private, renamed, or monorepo repository answers through the contents API instead.
  const viaApi = await getJson(`${GITHUB_API}/repos/${fullName}/contents/package.json`, {
    headers: { ...githubHeaders(token), accept: 'application/vnd.github.raw+json' }, signal, timeoutMs: 12000, retries: 0,
  });
  if (viaApi.ok && viaApi.data && typeof viaApi.data === 'object') return viaApi.data;
  return null;
}

/**
 * Search the npm registry.
 * @param {string} query - a registry search string.
 * @param {object} [options] - search options.
 * @param {number} [options.size] - results per query, default 60.
 * @param {AbortSignal} [options.signal] - cancellation.
 * @returns {Promise<{items: object[], total: number, error?: string}>} matches, or the failure reason.
 */
export async function searchNpm(query, options = {}) {
  const { size = 60, signal } = options;
  const url = `${NPM_REGISTRY}/-/v1/search?text=${encodeURIComponent(query)}&size=${Math.min(250, Math.max(1, size))}`;
  const result = await getJson(url, { signal, timeoutMs: 20000 });
  if (!result.ok) return { items: [], total: 0, error: result.error };
  const objects = Array.isArray(result.data?.objects) ? result.data.objects : [];
  return {
    items: objects.map(toNpmRecord).filter(Boolean),
    total: Number(result.data?.total ?? objects.length),
  };
}

/**
 * Reduce one npm search result to the fields the finder keeps.
 * @param {object} raw - one element of `objects` from the registry search.
 * @returns {object|null} a package record, or null for a malformed entry.
 */
function toNpmRecord(raw) {
  const pkg = raw?.package;
  const name = typeof pkg?.name === 'string' ? pkg.name : '';
  if (!name) return null;
  return {
    name,
    version: typeof pkg?.version === 'string' ? pkg.version : '',
    description: typeof pkg?.description === 'string' ? pkg.description : '',
    keywords: Array.isArray(pkg?.keywords) ? pkg.keywords.map(String) : [],
    date: typeof pkg?.date === 'string' ? pkg.date : '',
    repositoryUrl: normalizeRepositoryUrl(pkg?.links?.repository ?? pkg?.repository?.url ?? ''),
    homepage: typeof pkg?.links?.homepage === 'string' ? pkg.links.homepage : '',
    npmUrl: typeof pkg?.links?.npm === 'string' ? pkg.links.npm : `https://www.npmjs.com/package/${name}`,
    score: Number(raw?.score?.final ?? 0),
  };
}

/**
 * Read a published package manifest, which carries the `dsh` keys that decide
 * whether the package is an installable bundle.
 * @param {string} name - the npm package name.
 * @param {object} [options] - read options.
 * @param {AbortSignal} [options.signal] - cancellation.
 * @returns {Promise<object|null>} the latest manifest, or null when unavailable.
 */
export async function fetchNpmLatest(name, options = {}) {
  const { signal } = options;
  const result = await getJson(`${NPM_REGISTRY}/${encodeNpmName(name)}/latest`, { signal, timeoutMs: 12000, retries: 0 });
  return result.ok && result.data && typeof result.data === 'object' ? result.data : null;
}

/**
 * Read last-month download counts for a batch of packages.
 * @param {string[]} names - npm package names.
 * @param {object} [options] - read options.
 * @param {AbortSignal} [options.signal] - cancellation.
 * @returns {Promise<Record<string, number>>} download counts by package name; missing entries are unknown.
 */
export async function fetchNpmDownloads(names, options = {}) {
  const { signal } = options;
  const counts = {};
  const batch = names.filter(Boolean).slice(0, 128);
  for (let index = 0; index < batch.length; index += 32) {
    const slice = batch.slice(index, index + 32);
    // The point endpoint accepts up to 128 comma-separated names, but a smaller
    // batch keeps one failure from discarding every count.
    const result = await getJson(`${NPM_DOWNLOADS}/${slice.map(encodeNpmName).join(',')}`, {
      signal, timeoutMs: 15000, retries: 0,
    });
    if (!result.ok) continue;
    if (typeof result.data?.downloads === 'number' && slice.length === 1) {
      counts[slice[0]] = result.data.downloads;
    }
    for (const [name, value] of Object.entries(result.data ?? {})) {
      if (value && typeof value === 'object' && typeof value.downloads === 'number') counts[name] = value.downloads;
    }
  }
  return counts;
}

/**
 * Encode a package name for a registry path, keeping the scope separator.
 * @param {string} name - an npm package name.
 * @returns {string} the path-safe name.
 */
function encodeNpmName(name) {
  return String(name).split('/').map(encodeURIComponent).join('/');
}

/**
 * Normalize a `repository` field into a browsable https URL.
 * @param {unknown} value - a string, `{url}`, or nothing.
 * @returns {string} a GitHub-style https URL, or an empty string.
 */
export function normalizeRepositoryUrl(value) {
  const raw = typeof value === 'string' ? value : (value && typeof value === 'object' && 'url' in value ? String(value.url ?? '') : '');
  if (!raw) return '';
  let url = raw.trim()
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^ssh:\/\/git@/, 'https://')
    .replace(/^git@([^:]+):/, 'https://$1/')
    .replace(/\.git$/, '')
    .replace(/^github\.com\//, 'https://github.com/');
  if (url.startsWith('http://')) url = `https://${url.slice(7)}`;
  if (!/^https?:\/\//.test(url)) return '';
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    parsed.search = '';
    return parsed.href.replace(/\/$/, '');
  } catch {
    return '';
  }
}

/**
 * Split a repository URL into its `owner/repo` identity.
 * @param {string} url - a repository URL.
 * @returns {string} `owner/repo`, or an empty string.
 */
export function repoFullName(url) {
  const match = /^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)/.exec(String(url ?? ''));
  return match ? `${match[1]}/${match[2]}` : '';
}

/**
 * Run the fixed GitHub query set, spaced out to stay inside the unauthenticated budget.
 * @param {object} [options] - search options.
 * @param {string} [options.token] - GitHub token.
 * @param {AbortSignal} [options.signal] - cancellation.
 * @param {number} [options.spacingMs] - delay between searches, default 7000.
 * @param {(message: string) => void} [options.onProgress] - progress narration.
 * @returns {Promise<{items: object[], errors: string[], rateLimit?: object}>} repositories and per-query failures.
 */
export async function searchGithubAll(options = {}) {
  const { token, signal, spacingMs = 7000, onProgress } = options;
  const items = [];
  const errors = [];
  let rateLimit;
  for (const [index, query] of GITHUB_QUERIES.entries()) {
    if (signal?.aborted) break;
    if (index > 0) await sleep(token ? Math.min(spacingMs, 2000) : spacingMs);
    onProgress?.(`github: ${query}`);
    const result = await searchGithubRepos(query, { token, signal });
    items.push(...result.items);
    rateLimit = result.rateLimit ?? rateLimit;
    if (result.error) errors.push(`github "${query}": ${result.error}`);
    if (result.rateLimit?.remaining === 0) {
      errors.push('github: unauthenticated search budget exhausted; set a token to raise it');
      break;
    }
  }
  return { items, errors, rateLimit };
}

/**
 * Run the fixed registry query set.
 * @param {object} [options] - search options.
 * @param {AbortSignal} [options.signal] - cancellation.
 * @param {(message: string) => void} [options.onProgress] - progress narration.
 * @returns {Promise<{items: object[], errors: string[]}>} packages and per-query failures.
 */
export async function searchNpmAll(options = {}) {
  const { signal, onProgress } = options;
  const items = [];
  const errors = [];
  for (const query of NPM_QUERIES) {
    if (signal?.aborted) break;
    onProgress?.(`npm: ${query}`);
    const result = await searchNpm(query, { signal });
    items.push(...result.items);
    if (result.error) errors.push(`npm "${query}": ${result.error}`);
    await sleep(400);
  }
  return { items, errors };
}
