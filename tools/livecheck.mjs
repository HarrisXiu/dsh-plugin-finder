/**
 * Live end-to-end check: builds the index from the real catalog, the GitHub
 * search, and the npm registry, then exercises every query path.
 *
 * Run from the bundle directory:
 *
 *   node tools/livecheck.mjs [search text]
 *
 * The resulting index is written to `.build/live-index.json` so the report
 * generator can render a document from exactly the data that was verified.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';
import { FinderEngine } from '../lib/core/engine.js';
import { renderToolText } from '../lib/core/format.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const searchText = process.argv[2] ?? 'task board';

const seed = JSON.parse(readFileSync(join(root, 'data', 'seed.json'), 'utf8'));
const engine = new FinderEngine({
  seed,
  cachePath: '',
  // Match the Host half's view: this profile's installed packages are known.
  installedProvider: () => new Set(['dsh-plugin-whale-pet']),
  log: (message) => console.log(`  [engine] ${message}`),
});

const started = Date.now();
console.log('refreshing from the catalog, GitHub, and npm…');
const index = await engine.refresh({
  force: true,
  onProgress: (message) => console.log(`  -> ${message}`),
});
console.log(`\nrefresh took ${((Date.now() - started) / 1000).toFixed(1)}s`);
console.log(JSON.stringify(index.counts, null, 1));
console.log(`catalog: ${JSON.stringify(index.catalog)}`);
console.log(`categories: ${Object.keys(index.categories).length}`);
console.log(`errors: ${JSON.stringify(index.errors, null, 1)}`);

const top = engine.query({ limit: 10 });
console.log(`\n--- top 10 ---\n${renderToolText(top, { limit: 10, profile: 'desktop' })}`);

const byCategory = engine.query({ category: 'memory', limit: 5 });
console.log(`\n--- memory category (5) ---\n${renderToolText(byCategory, { limit: 5 })}`);
const bundles = engine.query({ tag: 'bundle', limit: 5 });
console.log(`\n--- tag bundle (5) ---\n${renderToolText(bundles, { limit: 5 })}`);
const installable = engine.query({ installable: true, limit: 3 });
console.log(`\n--- installable (3) ---\n${renderToolText(installable, { limit: 3 })}`);

console.log(`\n--- live search: "${searchText}" ---`);
const live = await engine.searchLive({ text: searchText, onProgress: (message) => console.log(`  -> ${message}`) });
console.log(`live hits reported: ${live.total}, candidates merged: ${live.candidates.length}, errors: ${JSON.stringify(live.errors)}`);
console.log(renderToolText(live.candidates.slice(0, 8), { limit: 8 }));

await mkdir(join(root, '.build'), { recursive: true });
// The whole index is kept, not a page of it: the report's per-category counts and
// its category sections must describe every candidate, not only the top rows.
await writeFile(join(root, '.build', 'live-index.json'), JSON.stringify({
  generatedAt: index.generatedAt,
  catalog: index.catalog,
  categories: index.categories,
  counts: index.counts,
  errors: index.errors,
  candidates: index.candidates,
}), 'utf8');
console.log(`wrote .build/live-index.json (${index.candidates.length} candidates)`);
