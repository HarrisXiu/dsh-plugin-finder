/**
 * Offline self-check for the Plugin Finder bundle.
 *
 * Runs with no network: it loads the shipped seed list, exercises the engine,
 * and prints the ranked suggestions plus sanity assertions. Run it from the
 * bundle directory:
 *
 *   node tools/selfcheck.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FinderEngine } from '../lib/core/engine.js';
import { renderToolText, renderMarkdownTable } from '../lib/core/format.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seed = JSON.parse(readFileSync(join(root, 'data', 'seed.json'), 'utf8'));

let failures = 0;
const check = (label, condition, detail = '') => {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

console.log(`seed entries: ${seed.length}`);
check('seed has entries', seed.length > 0);
check('every seed entry has a package name or repository',
  seed.every((entry) => entry.npmName || entry.repoUrl));
check('every seed entry has a repository URL',
  seed.every((entry) => /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+/.test(entry.repoUrl ?? '')),
  seed.filter((entry) => !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+/.test(entry.repoUrl ?? '')).map((e) => e.npmName).join(', '));
check('editor picks carry a weight', seed.filter((entry) => entry.weight > 0).length >= 20,
  `${seed.filter((entry) => entry.weight > 0).length} weighted`);

const engine = new FinderEngine({ seed, cachePath: '' });
const index = await engine.suggest({ offline: true });

console.log(`\noffline index: ${index.counts.candidates} candidates, errors=${JSON.stringify(index.errors)}`);
check('offline index built from the seed', index.counts.candidates === seed.length, `${index.counts.candidates} vs ${seed.length}`);

const top = engine.query({ limit: 15 });
console.log(`\n--- top 15 (recommended) ---\n${renderToolText(top, { limit: 15, profile: 'desktop' })}`);

check('top row is an editor pick', seed.some((entry) => entry.npmName === top[0]?.npmName && entry.weight > 0),
  `top = ${top[0]?.npmName}`);
check('every row carries both a package name and a repository',
  top.every((row) => row.npmName && /^https:\/\/github\.com\//.test(row.repoUrl)),
  top.filter((row) => !row.npmName || !row.repoUrl).map((row) => row.npmName).join(', '));
check('rows are ranked in descending score',
  top.every((row, position) => position === 0 || top[position - 1].score >= row.score));

const search = engine.query({ text: 'market', limit: 5 });
check('free-text search matches the description', search.length > 0, `market -> ${search.length}`);
const categorized = engine.query({ category: 'memory', limit: 5 });
check('category filter works', categorized.length > 0 && categorized.every((row) => row.category === 'memory'));
const installable = engine.query({ installable: true, limit: 100 });
check('installable filter requires a package name', installable.every((row) => row.npmName));

const table = renderMarkdownTable(top.slice(0, 3), { limit: 3 });
console.log(`\n--- markdown sample ---\n${table}`);
check('markdown table has a header and rows', table.split('\n').filter(Boolean).length >= 5);

const installed = new FinderEngine({ seed, cachePath: '', installedProvider: () => new Set([top[0].npmName.toLowerCase()]) });
await installed.suggest({ offline: true });
const reindexed = installed.query({ limit: 200 });
check('installed packages are marked', reindexed.some((row) => row.installed === true));

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
