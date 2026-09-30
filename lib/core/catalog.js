/**
 * The curated community catalog.
 *
 * A single JSON document lists thousands of DSH plugins with the two facts a
 * person actually needs — the npm package name and the GitHub repository — plus
 * a category, a bilingual description, star and download counts, and the
 * capabilities the plugin is known to require. It costs one request, which
 * makes it the backbone of the suggestion list, with the GitHub and npm
 * searches layered on top to catch plugins the catalog has not indexed yet.
 *
 * @module dsh-plugin-finder/core/catalog
 */
import { getJson } from './http.js';
import { normalizeRepositoryUrl, repoFullName } from './sources.js';

/** The default catalog: community-maintained, refreshed daily by CI. */
export const DEFAULT_CATALOG_URL = 'https://awesome-dsh-plugin.com/plugins.json';

/** Mirror of the same document, served from npm for networks that reach it better. */
export const CATALOG_FALLBACK_URLS = Object.freeze([
  'https://cdn.jsdelivr.net/gh/awesome-dsh-plugin/awesome-dsh-plugin@main/plugins.json',
]);

/**
 * Read and normalize the catalog.
 * @param {object} [options] - read options.
 * @param {string} [options.url] - primary catalog URL.
 * @param {string[]} [options.fallbacks] - URLs to try when the primary fails.
 * @param {AbortSignal} [options.signal] - cancellation.
 * @returns {Promise<{entries: object[], categories: Record<string, object>, updated: string, error?: string}>}
 *   normalized entries, the category dictionary, and the catalog's own timestamp.
 */
export async function fetchCatalog(options = {}) {
  const { url = DEFAULT_CATALOG_URL, fallbacks = CATALOG_FALLBACK_URLS, signal } = options;
  const attempts = [url, ...fallbacks];
  const errors = [];
  for (const candidate of attempts) {
    const result = await getJson(candidate, { signal, timeoutMs: 25000, retries: 0 });
    if (!result.ok) {
      errors.push(`${candidate}: ${result.error}`);
      continue;
    }
    const plugins = Array.isArray(result.data?.plugins) ? result.data.plugins : null;
    if (!plugins) {
      errors.push(`${candidate}: no "plugins" array`);
      continue;
    }
    return {
      entries: plugins.map(toCatalogEntry).filter(Boolean),
      categories: normalizeCategories(result.data?.categories),
      updated: typeof result.data?.updated === 'string' ? result.data.updated : '',
      source: candidate,
    };
  }
  return { entries: [], categories: {}, updated: '', error: errors.join('; ') };
}

/**
 * Reduce one catalog row to the fields the finder keeps.
 * @param {object} raw - one element of the catalog's `plugins` array.
 * @returns {object|null} a catalog entry, or null when the row has no identity.
 */
function toCatalogEntry(raw) {
  const repoUrl = normalizeRepositoryUrl(raw?.url);
  const npmName = typeof raw?.npm === 'string' && raw.npm.trim() ? raw.npm.trim() : '';
  if (!repoUrl && !npmName) return null;
  return {
    npmName,
    repoUrl,
    repoFullName: repoFullName(repoUrl),
    name: typeof raw?.name === 'string' ? raw.name : '',
    owner: typeof raw?.owner === 'string' ? raw.owner : '',
    page: typeof raw?.page === 'string' ? raw.page : '',
    category: typeof raw?.category === 'string' ? raw.category : '',
    descriptions: {
      en: typeof raw?.description?.en === 'string' ? raw.description.en : '',
      zh: typeof raw?.description?.zh === 'string' ? raw.description.zh : '',
    },
    version: typeof raw?.version === 'string' ? raw.version : '',
    stars: Number(raw?.stars ?? 0),
    downloadsLastMonth: Number.isFinite(raw?.downloads) ? raw.downloads : null,
    capabilities: Array.isArray(raw?.capabilities) ? raw.capabilities.map(String) : [],
    capabilityRedLines: Array.isArray(raw?.capabilityRedLines) ? raw.capabilityRedLines.map(String) : [],
    addedAt: typeof raw?.added === 'string' ? raw.added : '',
    screenshots: Array.isArray(raw?.screenshots) ? raw.screenshots.slice(0, 4).map(String) : [],
  };
}

/**
 * Normalize the catalog's category dictionary into `{ id: { en, zh } }`.
 * @param {unknown} raw - the catalog's `categories` field.
 * @returns {Record<string, {en: string, zh: string}>} the dictionary.
 */
function normalizeCategories(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, value] of Object.entries(raw)) {
    out[id] = {
      en: typeof value?.en === 'string' ? value.en : id,
      zh: typeof value?.zh === 'string' ? value.zh : (typeof value?.en === 'string' ? value.en : id),
    };
  }
  return out;
}
