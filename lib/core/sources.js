/** Direct GitHub topic discovery. Mirrors transport public JSON, never a catalog. */
import { getJson, sleep } from './http.js';
export const GITHUB_QUERIES = Object.freeze(['topic:dsh-plugin fork:true']);
export const DEFAULT_GITHUB_MIRRORS = Object.freeze(['https://gh-proxy.com/', 'https://gh-proxy.org/']);

export function normalizeRepositoryUrl(value) {
  const raw = typeof value === 'string' ? value : value?.url;
  if (typeof raw !== 'string') return '';
  try {
    const url = new URL(raw.replace(/^git\+/, '').replace(/^git:\/\//, 'https://').replace(/^git@github.com:/, 'https://github.com/'));
    if (url.hostname !== 'github.com') return '';
    const match = /^\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/|$)/.exec(url.pathname);
    return match ? `https://github.com/${match[1]}/${match[2]}` : '';
  } catch { return ''; }
}
export function repoFullName(url) { return normalizeRepositoryUrl(url).replace(/^https:\/\/github.com\//, ''); }

function mirrors(values = DEFAULT_GITHUB_MIRRORS) {
  return (Array.isArray(values) ? values : []).map(value => {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('GitHub mirror must be an HTTPS prefix without credentials, query or fragment');
    return url.href.replace(/\/?$/, '/');
  });
}
/** Tokens only go to canonical GitHub, with redirects refused by getJson. */
export async function githubJson(url, options = {}, validate = data => data && typeof data === 'object' && !Array.isArray(data)) {
  const routes = ['', ...mirrors(options.githubMirrors)];
  const preferred = options.routeState?.preferred;
  if (preferred && routes.includes(preferred)) routes.unshift(...routes.splice(routes.indexOf(preferred), 1));
  const errors = [];
  let rateLimit;
  for (const prefix of routes) {
    if (options.signal?.aborted) break;
    const headers = { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' };
    if (!prefix && options.token && new URL(url).hostname === 'api.github.com') headers.authorization = `Bearer ${options.token}`;
    const result = await getJson(prefix + url, { headers, signal: options.signal, timeoutMs: options.timeoutMs ?? 15000, retries: 0 });
    rateLimit = result.rateLimit ?? rateLimit;
    if (result.ok && validate(result.data)) {
      if (options.routeState) options.routeState.preferred = prefix;
      return { ...result, source: prefix ? new URL(prefix).origin : new URL(url).origin };
    }
    errors.push(`${prefix ? new URL(prefix).host : new URL(url).host}: ${result.ok ? 'invalid payload' : result.error}`);
  }
  return { ok: false, error: options.signal?.aborted ? 'aborted' : errors.join('; '), rateLimit };
}
function validSearch(data) {
  return Number.isSafeInteger(data?.total_count) && data.total_count >= 0 && Array.isArray(data.items)
    && data.items.length <= 100 && data.total_count >= data.items.length
    && typeof data.incomplete_results === 'boolean'
    && data.items.every(raw => /^[\w.-]+\/[\w.-]+$/.test(raw?.full_name) && Array.isArray(raw.topics)
      && raw.topics.includes('dsh-plugin') && typeof raw.created_at === 'string');
}
export async function searchGithubRepos(query, options = {}) {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=100&page=${page}`;
  const result = await githubJson(url, options, validSearch);
  if (!result.ok) return { items: [], total: 0, error: result.error, rateLimit: result.rateLimit };
  return {
    items: result.data.items.map(raw => ({
      fullName: raw.full_name, htmlUrl: `https://github.com/${raw.full_name}`,
      description: raw.description ?? '', topics: raw.topics, stars: raw.stargazers_count ?? 0,
      forks: raw.forks_count ?? 0, openIssues: raw.open_issues_count ?? 0,
      createdAt: raw.created_at, pushedAt: raw.pushed_at ?? '', archived: raw.archived === true,
      license: raw.license?.spdx_id === 'NOASSERTION' ? '' : raw.license?.spdx_id ?? '',
      defaultBranch: raw.default_branch ?? 'HEAD', homepage: raw.homepage ?? '', source: result.source,
    })), total: result.data.total_count, incomplete: result.data.incomplete_results,
    rateLimit: result.rateLimit, source: result.source,
  };
}
/** Enumerate pages and bisect creation timestamps around GitHub's 1,000-hit cap.
 * A checkpoint retains the next range/page for resuming a rate-limited scan.
 */
export async function searchGithubAll(options = {}) {
  const baseQuery = options.query ?? GITHUB_QUERIES[0];
  const start = Math.floor(Date.parse('2008-01-01T00:00:00Z') / 1000);
  const end = Math.floor(Date.now() / 1000);
  const previous = options.checkpoint;
  const queue = previous?.query === baseQuery && Array.isArray(previous.queue)
    ? structuredClone(previous.queue) : [{ start, end, page: 1 }];
  const found = new Map((previous?.query === baseQuery ? previous.items ?? [] : []).map(repo => [repo.fullName.toLowerCase(), repo]));
  const errors = [], sources = new Set(previous?.sources ?? []);
  const request = options.search ?? searchGithubRepos;
  const state = options.routeState ?? {};
  let requests = 0, total = previous?.total ?? null, complete = true;
  const stamp = n => new Date(n * 1000).toISOString().replace('.000Z', 'Z');
  const checkpoint = () => ({ query: baseQuery, queue: structuredClone(queue), items: [...found.values()], sources: [...sources], total });
  while (queue.length) {
    if (options.signal?.aborted || requests >= (options.maxRequests ?? Infinity)) {
      errors.push(options.signal?.aborted ? 'github: scan cancelled; resume to continue' : 'github: request budget reached; resume to continue');
      complete = false; break;
    }
    if (requests) {
      try { await sleep(options.spacingMs ?? (options.token ? 2100 : 6500), options.signal); }
      catch { complete = false; errors.push('github: scan cancelled; resume to continue'); break; }
    }
    const range = queue[0];
    const q = `${baseQuery} created:${stamp(range.start)}..${stamp(range.end)}`;
    options.onProgress?.(`GitHub: ${found.size} repositories; page ${range.page}, ${queue.length} ranges remaining`);
    const result = await request(q, { ...options, page: range.page, routeState: state });
    requests++;
    if (result.error) { errors.push(`github: ${result.error}`); complete = false; break; }
    if (total === null) total = result.total;
    if (result.source) sources.add(result.source);
    for (const repo of result.items) {
      if (repo.topics?.includes('dsh-plugin')) found.set(repo.fullName.toLowerCase(), repo);
    }
    if ((result.total > 1000 || result.incomplete) && range.start < range.end) {
      const mid = Math.floor((range.start + range.end) / 2);
      queue.splice(0, 1, { start: range.start, end: mid, page: 1 }, { start: mid + 1, end: range.end, page: 1 });
    } else {
      if (result.incomplete || result.total > 1000) {
        errors.push(`github: ${stamp(range.start)} partition remains incomplete (GitHub search limit)`); complete = false;
      }
      if (!result.items.length && (range.page - 1) * 100 < Math.min(result.total, 1000)) {
        errors.push('github: unexpected empty page; retained for retry'); complete = false; break;
      }
      if (range.page * 100 < Math.min(result.total, 1000)) range.page++;
      else queue.shift();
    }
    await options.onCheckpoint?.(checkpoint());
    options.onItems?.([...found.values()]);
  }
  return { items: [...found.values()], errors, complete: complete && queue.length === 0,
    total, requests, sources: [...sources], checkpoint: checkpoint() };
}
export async function fetchRepoManifest(fullName, options = {}) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(fullName)) return null;
  const result = await githubJson(`https://raw.githubusercontent.com/${fullName}/${encodeURIComponent(options.defaultBranch ?? 'HEAD')}/package.json`,
    options, data => typeof data?.name === 'string' && !Array.isArray(data));
  return result.ok ? result.data : null;
}
/** npm enriches tagged repos only; its repository field must match before use. */
export async function fetchNpmLatest(name, options = {}) {
  for (const registry of ['https://registry.npmmirror.com', 'https://registry.npmjs.org']) {
    if (options.signal?.aborted) break;
    const result = await getJson(`${registry}/${encodeURIComponent(name)}/latest`, { signal: options.signal, retries: 0, timeoutMs: 10000 });
    if (result.ok && result.data?.name === name) return result.data;
  }
  return null;
}
