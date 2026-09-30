/** Rebuild the browser bundle; no catalog or baked-in repository list. */
import { readFile, writeFile } from 'node:fs/promises';
const template = await readFile(new URL('../src/client.js', import.meta.url), 'utf8');
const snapshot = { rows: [], categories: {}, updated: '', generatedAt: '' };
const output = template.replace('/*__SNAPSHOT__*/ null', JSON.stringify(snapshot));
if (output === template) throw new Error('Missing browser template marker');
await writeFile(new URL('../lib/client.js', import.meta.url), output, 'utf8');
console.log('Built lib/client.js (no catalog, no curated snapshot).');
