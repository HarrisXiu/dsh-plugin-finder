/** Bounded live transport smoke; --all explicitly requests a full enumeration. */
import { mkdir, writeFile } from 'node:fs/promises';
import { FinderEngine } from '../lib/core/engine.js';
const full = process.argv.includes('--all');
const engine = new FinderEngine({
  token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '',
  cachePath: '', repoLimit: full ? 25 : 1, manifestLimit: full ? 25 : 1,
  maxRequests: full ? undefined : 2,
});
const index = await engine.refresh({ force: true, onProgress: console.log });
console.log(JSON.stringify({ counts: index.counts, scan: { ...index.scan, checkpoint: undefined }, errors: index.errors }, null, 2));
if (!index.candidates.length) process.exitCode = 1;
if (index.candidates.some(c => !c.topics.includes('dsh-plugin'))) throw new Error('Untagged repository escaped filter');
await mkdir(new URL('../.build/', import.meta.url), { recursive: true });
await writeFile(new URL('../.build/live-index.json', import.meta.url), JSON.stringify(index));
