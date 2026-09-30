/**
 * The finder engine: collects, caches, and answers questions about the DSH
 * plugin ecosystem.
 *
 * A refresh folds four sources into one ranked list:
 *
 * 1. the curated community catalog (one request, thousands of rows, each with an
 *    npm name, a GitHub URL, a category, and community signals);
 * 2. the GitHub repository search, which finds plugins the catalog has not
 *    indexed yet;
 * 3. the npm registry search, plus the published `package.json` of anything the
 *    catalog does not already describe — the only authoritative source for a
 *    package name and for the `dsh` manifest keys;
 * 4. a small seed list shipped with the plugin, which keeps the suggestion list
 *    useful with no network at all.
 *
 * @module dsh-plugin-finder/core/engine
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fetchCatalog, DEFAULT_CATALOG_URL, CATALOG_FALLBACK_URLS } from './catalog.js';
import {
  fetchNpmDownloads, fetchNpmLatest, fetchRepoManifest,
  searchGithubAll, searchNpmAll, searchGithubRepos, searchNpm,
} from './sources.js';
import { mergeCandidates } from './candidates.js';

/** Default cache lifetime: twelve hours. */
export const DEFAULT_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

/** How many live package manifests one refresh reads at most. */
export const DEFAULT_MANIFEST_LIMIT = 40;

/** How many live repository manifests one refresh reads at most. */
export const DEFAULT_REPO_LIMIT = 25;

/**
 * Run tasks with bounded concurrency, preserving input order.
 * @param {Array<() => Promise<any>>} tasks - thunks to run.
 * @param {number} limit - maximum concurrent tasks.
 * @returns {Promise<any[]>} results in input order; a rejected task yields null.
 */
export async function mapLimit(tasks, limit) {
  const results = new Array(tasks.length).fill(null);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, tasks.length)) }, async () => {
    while (next < tasks.length) {
      const index = next++;
      try {
        results[index] = await tasks[index]();
      } catch {
        results[index] = null;
      }
    }
  });
  await Promise.all(workers);
  return results;
}

/** The finder's cached, ranked view of the ecosystem. */
export class FinderEngine {
  /**
   * @param {object} [options] - engine options.
   * @param {object[]} [options.seed] - curated seed entries.
   * @param {string} [options.cachePath] - JSON cache file, or empty to stay in memory.
   * @param {number} [options.cacheTtlMs] - cache lifetime.
   * @param {string} [options.token] - GitHub token.
   * @param {string} [options.catalogUrl] - curated catalog URL.
   * @param {string[]} [options.catalogFallbacks] - mirror URLs.
   * @param {number} [options.manifestLimit] - live package manifests per refresh.
   * @param {number} [options.repoLimit] - live repository manifests per refresh.
   * @param {() => Set<string>} [options.installedProvider] - package names installed in the profile.
   * @param {string} [options.profile] - profile name, used to render install commands.
   * @param {(message: string) => void} [options.log] - diagnostic sink.
   */
  constructor(options = {}) {
    this.seed = Array.isArray(options.seed) ? options.seed : [];
    this.cachePath = options.cachePath ?? '';
    this.cacheTtlMs = Number.isFinite(options.cacheTtlMs) ? options.cacheTtlMs : DEFAULT_CACHE_TTL_MS;
    this.token = options.token ?? '';
    this.catalogUrl = options.catalogUrl ?? DEFAULT_CATALOG_URL;
    this.catalogFallbacks = options.catalogFallbacks ?? CATALOG_FALLBACK_URLS;
    this.manifestLimit = options.manifestLimit ?? DEFAULT_MANIFEST_LIMIT;
    this.repoLimit = options.repoLimit ?? DEFAULT_REPO_LIMIT;
    this.installedProvider = options.installedProvider ?? (() => new Set());
    this.profile = options.profile ?? '';
    this.log = options.log ?? (() => {});
    this.index = null;
    this.pending = null;
  }

  /**
   * Answer with the ranked suggestion list, refreshing when the cache is stale.
   * @param {object} [options] - request options.
   * @param {boolean} [options.force] - ignore a fresh cache.
   * @param {boolean} [options.offline] - never touch the network.
   * @param {AbortSignal} [options.signal] - cancellation.
   * @param {(message: string) => void} [options.onProgress] - progress narration.
   * @returns {Promise<object>} the index.
   */
  async suggest(options = {}) {
    const { force = false, offline = false, signal, onProgress } = options;
    if (this.index && !force && !this.isStale()) return this.reindex();
    if (offline) {
      this.index = this.fromSeed('offline');
      return this.index;
    }
    await this.refresh({ signal, onProgress, force });
    return this.index;
  }

  /** Whether the cached index is older than its lifetime. */
  isStale() {
    if (!this.index) return true;
    const age = Date.now() - Date.parse(this.index.generatedAt ?? 0);
    return !Number.isFinite(age) || age > this.cacheTtlMs || age < 0;
  }

  /**
   * Re-evaluate the installed flags and re-rank the current index in place.
   * @returns {object|null} the current index.
   */
  reindex() {
    if (!this.index) return null;
    const installed = this.installedProvider();
    for (const candidate of this.index.candidates) {
      candidate.installed = Boolean(candidate.npmName && installed.has(candidate.npmName.toLowerCase()));
    }
    return this.index;
  }

  /**
   * Rebuild the index from every source, coalescing concurrent callers.
   * @param {object} [options] - refresh options.
   * @param {AbortSignal} [options.signal] - cancellation.
   * @param {(message: string) => void} [options.onProgress] - progress narration.
   * @param {boolean} [options.force] - skip reading a valid disk cache.
   * @returns {Promise<object>} the rebuilt index.
   */
  async refresh(options = {}) {
    if (this.pending) return this.pending;
    this.pending = this.#build(options).finally(() => { this.pending = null; });
    return this.pending;
  }

  /**
   * Adopt a cached index from disk when it is still fresh.
   * @returns {Promise<object|null>} the adopted index, or null.
   */
  async adoptCache() {
    if (!this.cachePath) return null;
    try {
      const parsed = JSON.parse(await readFile(this.cachePath, 'utf8'));
      if (!Array.isArray(parsed?.candidates)) return null;
      if (this.isStaleRecord(parsed)) return null;
      this.index = parsed;
      this.reindex();
      return parsed;
    } catch {
      return null;
    }
  }

  /** Persist the current index, ignoring an unwritable cache directory. */
  async saveCache() {
    if (!this.cachePath || !this.index) return;
    try {
      await mkdir(dirname(this.cachePath), { recursive: true });
      await writeFile(this.cachePath, JSON.stringify(this.index), 'utf8');
    } catch (error) {
      this.log(`cache write failed: ${error?.message ?? error}`);
    }
  }

  /**
   * Build the index.
   * @param {object} options - refresh options.
   * @returns {Promise<object>} the new index.
   */
  async #build(options) {
    const { signal, onProgress } = options;
    const errors = [];
    if (!options.force) {
      const adopted = await this.adoptCache();
      if (adopted) {
        onProgress?.('using cached index');
        return adopted;
      }
    }

    onProgress?.('catalog: reading curated plugin index');
    const catalog = await fetchCatalog({
      url: this.catalogUrl, fallbacks: this.catalogFallbacks, signal,
    }).catch((error) => ({ entries: [], categories: {}, updated: '', error: String(error) }));
    if (catalog.error) errors.push(`catalog: ${catalog.error}`);

    // The catalog already covers these packages; only genuinely new names need
    // a registry round trip.
    const known = new Set(catalog.entries.map((entry) => entry.npmName.toLowerCase()).filter(Boolean));
    const knownRepos = new Set(catalog.entries.map((entry) => entry.repoFullName.toLowerCase()).filter(Boolean));

    const [npmResult, githubResult] = await Promise.all([
      searchNpmAll({ signal, onProgress }).catch((error) => ({ items: [], errors: [String(error)] })),
      searchGithubAll({ token: this.token, signal, onProgress }).catch((error) => ({ items: [], errors: [String(error)] })),
    ]);
    errors.push(...npmResult.errors, ...githubResult.errors);

    const packages = dedupeBy(npmResult.items, (item) => item.name.toLowerCase());
    const repos = dedupeBy(githubResult.items, (item) => item.fullName.toLowerCase());
    const freshPackages = packages.filter((pkg) => !known.has(pkg.name.toLowerCase()));
    const freshRepos = repos
      .filter((repo) => !knownRepos.has(repo.fullName.toLowerCase()))
      .filter((repo) => /dsh|deepseek|harness/i.test(`${repo.fullName} ${repo.description} ${repo.topics.join(' ')}`));

    const manifestTargets = freshPackages.slice(0, Math.max(0, this.manifestLimit));
    onProgress?.(`npm: reading ${manifestTargets.length} new package manifests`);
    const manifests = new Map();
    await mapLimit(manifestTargets.map((pkg) => async () => {
      const manifest = await fetchNpmLatest(pkg.name, { signal });
      if (manifest) manifests.set(pkg.name, manifest);
    }), 6);

    const repoManifestTargets = freshRepos.slice(0, Math.max(0, this.repoLimit));
    onProgress?.(`github: reading ${repoManifestTargets.length} new repository manifests`);
    const repoManifests = new Map();
    await mapLimit(repoManifestTargets.map((repo) => async () => {
      const manifest = await fetchRepoManifest(repo.fullName, { token: this.token, signal });
      if (manifest) repoManifests.set(repo.fullName, manifest);
    }), 6);

    const downloads = await fetchNpmDownloads(
      freshPackages.slice(0, 48).map((pkg) => pkg.name), { signal },
    ).catch(() => ({}));

    const installed = this.installedProvider();
    const candidates = mergeCandidates({
      catalog: catalog.entries, repos, packages, manifests, repoManifests, downloads, seed: this.seed, installed,
    });

    this.index = {
      schema: 2,
      generatedAt: new Date().toISOString(),
      catalog: { updated: catalog.updated, source: catalog.source ?? '', entries: catalog.entries.length },
      categories: catalog.categories,
      counts: {
        candidates: candidates.length,
        installable: candidates.filter((c) => c.npmName).length,
        installed: candidates.filter((c) => c.installed).length,
        repositories: repos.length,
        packages: packages.length,
        manifests: manifests.size + repoManifests.size,
      },
      errors,
      candidates,
    };
    await this.saveCache();
    return this.index;
  }

  /**
   * Whether a cached record is still within its lifetime.
   * @param {object} record - a cached index.
   * @returns {boolean} true when the record is stale.
   */
  isStaleRecord(record) {
    const age = Date.now() - Date.parse(record?.generatedAt ?? 0);
    return !Number.isFinite(age) || age > this.cacheTtlMs || age < 0;
  }

  /**
   * Build a seed-only index, for offline use.
   * @param {string} reason - why the network was skipped.
   * @returns {object} an index holding only curated entries.
   */
  fromSeed(reason) {
    const candidates = mergeCandidates({ seed: this.seed, installed: this.installedProvider() });
    return {
      schema: 2,
      generatedAt: new Date().toISOString(),
      catalog: { updated: '', source: '', entries: 0 },
      categories: {},
      counts: { candidates: candidates.length, installable: candidates.filter((c) => c.npmName).length, installed: 0, repositories: 0, packages: 0, manifests: 0 },
      errors: [`offline: ${reason}`],
      candidates,
    };
  }

  /**
   * Search the live sources directly, for a query the cached index cannot answer.
   * @param {object} query - the search request.
   * @param {string} query.text - the search text.
   * @param {AbortSignal} [query.signal] - cancellation.
   * @param {(message: string) => void} [query.onProgress] - progress narration.
   * @returns {Promise<object>} `{ candidates, errors }` for the live matches.
   */
  async searchLive(query = {}) {
    const { text, signal, onProgress } = query;
    const errors = [];
    // A GitHub repository search needs a qualifier string, not a bare phrase, so
    // the free text is quoted and widened across the fields people name plugins in.
    const githubQuery = `${JSON.stringify(text)} in:name,description,readme`;
    onProgress?.(`github: ${githubQuery}`);
    const github = await searchGithubRepos(githubQuery, { token: this.token, signal }).catch((error) => ({ items: [], error: String(error) }));
    if (github.error) errors.push(`github: ${github.error}`);
    onProgress?.(`npm: ${text}`);
    const npm = await searchNpm(text, { size: 25, signal }).catch((error) => ({ items: [], error: String(error) }));
    if (npm.error) errors.push(`npm: ${npm.error}`);

    const repos = github.items ?? [];
    const packages = npm.items ?? [];
    const repoManifests = new Map();
    await mapLimit(repos.slice(0, 10).map((repo) => async () => {
      const manifest = await fetchRepoManifest(repo.fullName, { token: this.token, signal });
      if (manifest) repoManifests.set(repo.fullName, manifest);
    }), 5);
    const manifests = new Map();
    await mapLimit(packages.slice(0, 10).map((pkg) => async () => {
      const manifest = await fetchNpmLatest(pkg.name, { signal });
      if (manifest) manifests.set(pkg.name, manifest);
    }), 5);

    const installed = this.installedProvider();
    const candidates = mergeCandidates({ repos, packages, manifests, repoManifests, installed });
    return { candidates, errors, total: (github.total ?? 0) + (npm.total ?? 0) };
  }

  /**
   * Filter and page the current index.
   * @param {object} [query] - filter options.
   * @param {string} [query.text] - free text matched against name, description, topics.
   * @param {string} [query.category] - a required catalog category id.
   * @param {string} [query.tag] - a required tag, such as `bundle` or `ui`.
   * @param {boolean} [query.installable] - keep only rows with an npm package name.
   * @param {boolean} [query.excludeInstalled] - drop rows already installed.
   * @param {number} [query.limit] - maximum rows, default 20.
   * @returns {object[]} matching candidates.
   */
  query(query = {}) {
    const {
      text = '', category = '', tag = '', installable = false,
      excludeInstalled = false, limit = 20,
    } = query;
    const needle = String(text).trim().toLowerCase();
    return (this.index?.candidates ?? [])
      .filter((candidate) => (tag ? candidate.tags.includes(tag) : true))
      .filter((candidate) => (category ? candidate.category === category : true))
      .filter((candidate) => (installable ? Boolean(candidate.npmName) : true))
      .filter((candidate) => (excludeInstalled ? !candidate.installed : true))
      .filter((candidate) => {
        if (!needle) return true;
        return [candidate.npmName, candidate.repoFullName, candidate.description,
          candidate.descriptions.zh, candidate.descriptions.en, candidate.category,
          candidate.topics.join(' '), candidate.keywords.join(' ')]
          .filter(Boolean).join(' ').toLowerCase().includes(needle);
      })
      .slice(0, Math.max(1, limit));
  }
}

/** Reduce a list to unique items by key, keeping the first. */
function dedupeBy(list, keyOf) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const key = keyOf(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}
