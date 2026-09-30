/** Generate a report only from direct-discovery cache (no legacy catalog fallback). */
import { readFile, writeFile } from 'node:fs/promises';
import { FinderEngine, DISCOVERY_MODE, INDEX_SCHEMA } from '../lib/core/engine.js';
import { renderMarkdownTable } from '../lib/core/format.js';
let index;
for (const file of ['live-index.json', 'host-cache.json']) {
  try {
    const record = JSON.parse(await readFile(new URL('../.build/' + file, import.meta.url), 'utf8'));
    if (record.schema === INDEX_SCHEMA && record.mode === DISCOVERY_MODE) { index = record; break; }
  } catch {}
}
index ??= new FinderEngine().fromSeed('尚未生成直接发现缓存');
const report = `# DSH 插件发现列表\n\n数据来自 GitHub 的 \`topic:dsh-plugin fork:true\` 搜索，使用创建时间分片和分页。\n\n`
  + `扫描时间：${index.generatedAt}；已找到 ${index.candidates.length} 个仓库；状态：${index.scan.complete ? '完成' : '未完成'}。\n\n`
  + `来源：${index.scan.sources.join(', ') || '尚无缓存'}。分类由关键词推断，npm 包名仅在发布元数据的仓库地址一致时展示。\n\n`
  + (index.errors.length ? `扫描提示：${index.errors.join('；')}\n\n` : '')
  + renderMarkdownTable(index.candidates, { limit: Math.max(1, index.candidates.length) });
await writeFile(new URL('../../DSH-插件建议列表.md', import.meta.url), report);
await writeFile(new URL('../docs/DSH-插件建议列表.md', import.meta.url), report);
console.log('Updated both reports from direct-discovery data.');
