/**
 * Build step for the Plugin Finder bundle.
 *
 * Run from the bundle directory:
 *
 *   node tools/build-data.mjs            # fetch the catalog and rebuild both artifacts
 *   node tools/build-data.mjs --cached   # reuse .build/catalog.json
 *
 * It produces two files, so the shipped plugin needs no network to show
 * something useful and the sidebar panel renders instantly:
 *
 * 1. `data/seed.json` — the ranked seed list the Host half loads, carrying the
 *    editor's picks plus the strongest catalog rows.
 * 2. `lib/client.js` — `src/client.js` with a ranked snapshot of catalog rows
 *    inlined in place of the `__SNAPSHOT__` marker.
 *
 * Nothing here runs at plugin runtime; it is a development tool.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fetchCatalog } from '../lib/core/catalog.js';
import { mergeCandidates } from '../lib/core/candidates.js';
import { fetchNpmLatest, normalizeRepositoryUrl, repoFullName } from '../lib/core/sources.js';
import { CURATED, SEED_SIZE, SNAPSHOT_SIZE } from './curation.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const cacheFile = join(root, '.build', 'catalog.json');
const cached = process.argv.includes('--cached');

/**
 * Resolve curated picks the catalog does not list, through the npm registry, so
 * a pick never ships as a bare package name with no repository to point at.
 * @param {object[]} entries - normalized catalog entries.
 * @returns {Promise<object[]>} the catalog entries plus the resolved picks.
 */
async function enrichCurated(entries) {
  const known = new Set(entries.map((entry) => entry.npmName.toLowerCase()).filter(Boolean));
  const missing = CURATED.map((pick) => pick.npm).filter((npm) => npm && !known.has(npm.toLowerCase()));
  if (!missing.length) return entries;
  console.log(`curated: resolving ${missing.length} pick(s) the catalog does not list: ${missing.join(', ')}`);
  const extra = [];
  for (const npm of missing) {
    const manifest = await fetchNpmLatest(npm, {});
    if (!manifest) {
      console.warn(`  ! ${npm} is in neither the catalog nor the npm registry; it will not be seeded`);
      continue;
    }
    const repoUrl = normalizeRepositoryUrl(manifest.repository);
    console.log(`  + ${npm} -> ${repoUrl || '(no repository field)'}`);
    extra.push({
      npmName: npm,
      repoUrl,
      repoFullName: repoFullName(repoUrl),
      name: npm,
      owner: repoUrl ? repoUrl.split('/')[3] ?? '' : '',
      page: '',
      category: '',
      descriptions: { en: String(manifest.description ?? ''), zh: '' },
      version: String(manifest.version ?? ''),
      stars: 0,
      downloadsLastMonth: null,
      capabilities: [],
      capabilityRedLines: [],
      addedAt: '',
      screenshots: [],
    });
  }
  return [...entries, ...extra];
}

/** Load the catalog from the local build cache or the network. */
async function loadCatalog() {
  if (cached) {
    try {
      const parsed = JSON.parse(await readFile(cacheFile, 'utf8'));
      if (Array.isArray(parsed.entries) && parsed.entries.length) {
        console.log(`catalog: ${parsed.entries.length} rows from ${cacheFile}`);
        return parsed;
      }
    } catch {
      console.log('catalog: no usable build cache, fetching');
    }
  }
  const result = await fetchCatalog({});
  if (result.error) throw new Error(`catalog unavailable: ${result.error}`);
  console.log(`catalog: ${result.entries.length} rows from ${result.source} (updated ${result.updated})`);
  // Cache the normalized rows, so repeated builds do not re-fetch a multi-megabyte
  // document and the cache carries exactly the fields the build consumes.
  const payload = { updated: result.updated, categories: result.categories, entries: result.entries };
  await mkdir(dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, JSON.stringify(payload), 'utf8');
  return payload;
}

/**
 * Build the seed list: the editor's picks plus the highest-ranked catalog rows,
 * merged through the same code path the Host half uses at runtime.
 */
function buildSeed(entries, updated) {
  const curated = CURATED.map((pick) => ({ ...pick, verifiedAt: new Date().toISOString().slice(0, 10) }));
  const seedInput = curated.map((pick) => ({
    npmName: pick.npm, weight: pick.weight, note: pick.note, verifiedAt: pick.verifiedAt,
  }));

  // Pass one: rank the whole catalog with only the editor's picks as input, so
  // the seed list itself already reflects the final ordering.
  const ranked = mergeCandidates({ catalog: entries, seed: seedInput });
  const byName = new Map(ranked.filter((row) => row.npmName).map((row) => [row.npmName.toLowerCase(), row]));

  const chosen = new Map();
  for (const pick of curated) {
    const row = byName.get(pick.npm.toLowerCase());
    if (!row) {
      console.warn(`  ! curated pick not found in the catalog: ${pick.npm}`);
      continue;
    }
    chosen.set(row.npmName.toLowerCase(), { row, pick });
  }
  for (const row of ranked) {
    if (chosen.size >= SEED_SIZE) break;
    if (!row.npmName || chosen.has(row.npmName.toLowerCase())) continue;
    chosen.set(row.npmName.toLowerCase(), { row, pick: null });
  }

  const seed = [...chosen.values()].map(({ row, pick }) => ({
    npmName: row.npmName,
    repoUrl: row.repoUrl,
    description: row.descriptions.zh || row.description || row.descriptions.en || '',
    descriptionZh: row.descriptions.zh,
    descriptionEn: row.descriptions.en,
    category: row.category,
    stars: row.stars,
    downloadsLastMonth: row.downloadsLastMonth,
    version: row.version,
    capabilities: row.capabilities,
    tags: row.tags,
    weight: pick?.weight ?? 0,
    note: pick?.note ?? '',
    verifiedAt: pick?.verifiedAt ?? updated ?? '',
  }));
  console.log(`seed: ${seed.length} entries (${curated.length} editor's picks)`);
  return seed;
}

/** Render the client snapshot: the same rows, flattened for the browser. */
function buildSnapshot(entries, updated) {
  const rows = entries
    .filter((entry) => entry.npm || entry.repoUrl)
    .map((entry) => ({
      key: String(entry.npmName || entry.repoUrl || `${entry.owner}/${entry.name}`).toLowerCase(),
      name: entry.name,
      owner: entry.owner,
      npm: entry.npmName,
      url: entry.repoUrl,
      page: entry.page,
      category: entry.category,
      zh: entry.descriptions?.zh ?? '',
      en: entry.descriptions?.en ?? '',
      stars: entry.stars,
      downloads: entry.downloadsLastMonth ?? 0,
      version: entry.version,
      capabilities: entry.capabilities,
      added: entry.addedAt,
    }))
    .sort((a, b) => (b.stars + b.downloads / 100) - (a.stars + a.downloads / 100))
    .slice(0, SNAPSHOT_SIZE);
  console.log(`snapshot: ${rows.length} rows inlined into lib/client.js`);
  return rows;
}

/** Write `lib/client.js` with the snapshot substituted for the marker. */
async function writeClient(snapshot, categories, updated) {
  const template = await readFile(join(root, 'src', 'client.js'), 'utf8');
  if (!template.includes('/*__SNAPSHOT__*/ null')) {
    throw new Error('src/client.js no longer contains the /*__SNAPSHOT__*/ null marker');
  }
  const payload = JSON.stringify({ rows: snapshot, categories, updated, generatedAt: new Date().toISOString() });
  const output = template.replace('/*__SNAPSHOT__*/ null', payload);
  await writeFile(join(root, 'lib', 'client.js'), output, 'utf8');
  // A client bundle is browser ESM loaded through the module table; Node's parser
  // still catches syntax errors, which is what a review can check without a browser.
  console.log(`client: wrote lib/client.js (${(output.length / 1024).toFixed(0)} KiB)`);
}

const catalog = await loadCatalog();
const entries = await enrichCurated(catalog.entries);
const updated = catalog.updated ?? '';

await mkdir(join(root, 'data'), { recursive: true });
const seed = buildSeed(entries, updated);
await writeFile(join(root, 'data', 'seed.json'), `${JSON.stringify(seed, null, 2)}\n`, 'utf8');
console.log(`seed: wrote data/seed.json (${(JSON.stringify(seed).length / 1024).toFixed(0)} KiB)`);

const snapshot = buildSnapshot(entries, updated);
const categories = catalog.categories ?? {};
await writeClient(snapshot, categories, updated);
