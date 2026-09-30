/**
 * Render the standalone suggestion-list document.
 *
 * Run from the bundle directory:
 *
 *   node tools/report.mjs                    # use .build/live-index.json when present
 *   node tools/report.mjs --live             # always rebuild the index from the network
 *   node tools/report.mjs --out <file>       # choose the destination
 *
 * The document is generated from whatever index it can obtain, in this order:
 * a live index written by `tools/livecheck.mjs`, a fresh build from the network,
 * or the bundled seed list. The header always states which one was used, so a
 * reader can tell a live catalog listing from an offline snapshot.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FinderEngine } from '../lib/core/engine.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const forceLive = args.includes('--live');
const outIndex = args.indexOf('--out');
const outFile = outIndex >= 0 ? args[outIndex + 1] : join(root, '..', 'DSH-插件建议列表.md');

/** Needs people actually arrive with, mapped to the catalog categories that answer them. */
const INTENTS = [
  { label: '先装一个插件市场', categories: ['market'] },
  { label: '界面 / 侧边栏 / 交互增强', categories: ['ui'] },
  { label: '省钱、看用量与账单', categories: ['usage'] },
  { label: '跨会话记忆与长期上下文', categories: ['memory'] },
  { label: '多智能体、自动化与工作流', categories: ['workflow', 'agi'] },
  { label: '视觉与多模态', categories: ['vision'] },
  { label: '接入别的模型或账号', categories: ['model'] },
  { label: '通知、手机远程访问', categories: ['notify', 'remote'] },
  { label: '换主题换皮肤', categories: ['theme'] },
  { label: '安全、权限与审计', categories: ['security'] },
  { label: '技能包（Skills）', categories: ['skill'] },
  { label: '浏览器与网页能力', categories: ['browser'] },
  { label: 'Git 与代码评审', categories: ['git'] },
  { label: '文档、表格与渲染', categories: ['docs'] },
  { label: '开发与运行时调试', categories: ['dev'] },
  { label: '纯娱乐', categories: ['fun'] },
];

/**
 * Load an index from the most authoritative source available.
 *
 * Preference order: an index the installed plugin itself wrote inside the real
 * Host, then one produced by `tools/livecheck.mjs`, then a fresh network build,
 * then the bundled seed. The header names which one was used, so a reader can
 * tell a live catalog listing from an offline snapshot.
 */
async function obtainIndex() {
  if (!forceLive) {
    for (const [file, label] of [['host-cache.json', 'host'], ['live-index.json', 'live-index']]) {
      try {
        const cached = JSON.parse(await readFile(join(root, '.build', file), 'utf8'));
        if (Array.isArray(cached.candidates) && cached.candidates.length) {
          return { index: cached, source: label };
        }
      } catch {
        // Try the next source.
      }
    }
  }
  const seed = JSON.parse(readFileSync(join(root, 'data', 'seed.json'), 'utf8'));
  const engine = new FinderEngine({ seed, cachePath: '', log: () => {} });
  if (forceLive) {
    const index = await engine.refresh({ force: true, onProgress: (message) => console.log(`  -> ${message}`) });
    return { index, source: 'network' };
  }
  return { index: engine.fromSeed('report'), source: 'seed' };
}

const { index, source } = await obtainIndex();
const engine = new FinderEngine({ seed: [], cachePath: '' });
engine.index = index;

const categories = index.categories ?? {};
const label = (id) => categories[id]?.zh || categories[id]?.en || id;
const rows = (query) => engine.query(query);
const installCommand = (row) => `dsh plugin --profile desktop add ${row.npmName || row.repoUrl}`;
const describe = (row) => row.descriptions?.zh || row.descriptions?.en || row.description || '';
const clamp = (text, limit) => {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > limit ? `${flat.slice(0, limit - 1)}…` : flat;
};
const cell = (text) => String(text ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
const signals = (row) => [
  row.stars ? `★${row.stars}` : '',
  row.downloadsLastMonth ? `${row.downloadsLastMonth}/月` : '',
  row.version ? `v${row.version}` : '',
  row.license || '',
].filter(Boolean).join(' · ') || '—';

const sourceNote = {
  host: '已安装的插件在真实 DSH Host 里构建的索引（目录 + GitHub 搜索 + npm registry）',
  'live-index': '由 `tools/livecheck.mjs` 生成的联网索引（目录 + GitHub 搜索 + npm registry）',
  network: '本次生成时从网络实时构建的索引（目录 + GitHub 搜索 + npm registry）',
  seed: '**离线**：随插件发布的 160 条内置快照，未联网',
}[source];

const lines = [];
lines.push('# DSH 插件建议列表');
lines.push('');
lines.push(`> 生成时间：${index.generatedAt ?? '未知'}　|　数据来源：${sourceNote}`);
if (index.catalog?.updated) {
  lines.push(`> 社区目录更新时间：${index.catalog.updated}（${index.catalog.entries ?? 0} 条）　|　`
    + `目录地址：${index.catalog.source || '—'}`);
}
lines.push(`> 本次收录：**${index.counts?.candidates ?? 0}** 个插件，其中 **${index.counts?.installable ?? 0}** 个已发布到 npm，`
  + `覆盖 **${Object.keys(categories).length}** 个分类。`);
lines.push('');
lines.push('这份文档由 `dsh-plugin-finder` 插件生成，和它在 DSH 里看到的建议列表同源。每一条都给出 **npm 包名** 和 **GitHub 仓库地址**——'
  + '这两个是装插件真正需要的东西。');
lines.push('');
lines.push('---');
lines.push('');

/* ------------------------------------------------------------------ */
lines.push('## 一分钟结论');
lines.push('');
lines.push('如果你只想装几个，按下面的顺序看。这些都是在社区目录里排在最前面的一批，全都能用一条命令装上：');
lines.push('');
const top = rows({ limit: 12 });
lines.push('| # | npm 包名 | GitHub 仓库 | 它做什么 | 社区信号 | 安装命令 |');
lines.push('| --- | --- | --- | --- | --- | --- |');
top.forEach((row, position) => {
  lines.push(`| ${position + 1} | \`${row.npmName || '—'}\` | [${row.repoFullName || 'repo'}](${row.repoUrl || '#'}) `
    + `| ${cell(clamp(describe(row), 90))} | ${signals(row)} | \`${installCommand(row)}\` |`);
});
lines.push('');
lines.push('> `dsh-plugin-finder` 只负责「找到」，不代装。安装方式见文末「安装一个插件」。');
lines.push('');

/* ------------------------------------------------------------------ */
lines.push('## 数据从哪里来');
lines.push('');
lines.push('| 来源 | 提供了什么 | 本次结果 |');
lines.push('| --- | --- | --- |');
lines.push(`| [awesome-dsh-plugin.com](https://awesome-dsh-plugin.com/plugins.json) | 人工精选目录：npm 包名、GitHub 仓库、分类、中英描述、星标、月下载量、已知能力需求 | ${index.catalog?.entries ?? 0} 条 |`);
lines.push(`| GitHub 搜索 | \`topic:dsh-plugin\`、\`topic:deepseek-harness\`、名字/描述/README 命中「dsh plugin」的仓库——用来发现目录还没收录的新插件 | ${index.counts?.repositories ?? 0} 个仓库 |`);
lines.push(`| npm registry | 关键词检索 + 读取候选包的 \`package.json\`（只有它知道 \`dsh.bundle\` / \`dsh.client\` 这些清单字段） | ${index.counts?.packages ?? 0} 个包，读取 ${index.counts?.manifests ?? 0} 份清单 |`);
lines.push('');
if (index.errors?.length) {
  lines.push('本次生成中的告警（原样保留，没有隐藏失败）：');
  lines.push('');
  for (const error of index.errors) lines.push(`- \`${error}\``);
  lines.push('');
}
lines.push('合并与排序规则：以 **npm 包名**为主键，没有包名的条目退回 `owner/repo`（同一 monorepo 下的子包不会互相覆盖）；'
  + '排除 DSH 自带的官方 `@deepseek-ai/*`；权重顺序为「声明了 `dsh.bundle.patch` 的 bundle / 目录精选条目」>'
  + '「有浏览器端的 UI 插件」>「有 npm 包名」> 星标 / 月下载量 / 最近更新时间；已安装的会被降权并标注。');
lines.push('');

/* ------------------------------------------------------------------ */
lines.push('## 按需求挑（场景速查）');
lines.push('');
for (const intent of INTENTS) {
  const picks = [];
  for (const category of intent.categories) {
    picks.push(...rows({ category, limit: 6 }));
  }
  const unique = [];
  const seen = new Set();
  for (const row of picks) {
    if (seen.has(row.key) || !row.npmName) continue;
    seen.add(row.key);
    unique.push(row);
    if (unique.length >= 4) break;
  }
  if (!unique.length) continue;
  lines.push(`**${intent.label}**`);
  lines.push('');
  for (const row of unique) {
    lines.push(`- \`${row.npmName}\` — ${clamp(describe(row), 100)} 　[仓库](${row.repoUrl})　${signals(row)}`);
  }
  lines.push('');
}

/* ------------------------------------------------------------------ */
lines.push('## 推荐清单（前 50）');
lines.push('');
lines.push('| # | npm 包名 | GitHub 仓库 | 分类 | 说明 | 形态 | 社区信号 |');
lines.push('| --- | --- | --- | --- | --- | --- | --- |');
rows({ limit: 50 }).forEach((row, position) => {
  lines.push(`| ${position + 1} | \`${row.npmName || '—'}\` | [${row.repoFullName || 'repo'}](${row.repoUrl || '#'}) `
    + `| ${row.category ? label(row.category) : '—'} | ${cell(clamp(describe(row), 100))} `
    + `| ${row.tags.join(', ') || (row.catalogRow ? '目录收录' : '—')} | ${signals(row)} |`);
});
lines.push('');

/* ------------------------------------------------------------------ */
lines.push('## 分类精选');
lines.push('');
const counts = {};
for (const row of index.candidates ?? []) {
  if (row.category) counts[row.category] = (counts[row.category] ?? 0) + 1;
}
const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12);
for (const [id, count] of ranked) {
  const picks = rows({ category: id, limit: 8 });
  if (!picks.length) continue;
  lines.push(`### ${label(id)}　<sub>${count} 个</sub>`);
  lines.push('');
  for (const row of picks) {
    lines.push(`- \`${row.npmName || '(无 npm 包)'}\` — ${clamp(describe(row), 110)} 　`
      + `[仓库](${row.repoUrl || '#'})　${signals(row)}`);
  }
  lines.push('');
}

/* ------------------------------------------------------------------ */
lines.push('## 安装一个插件');
lines.push('');
lines.push('**方式一 · GUI（推荐）**：侧边栏 **Plugins** 页面 → **Add plugin** → 粘贴上面表格里的 npm 包名 → 确认安装。'
  + '大多数插件装完刷新页面就生效，少数需要重启 DSH。');
lines.push('');
lines.push('**方式二 · 命令行**：');
lines.push('');
lines.push('```powershell');
lines.push('dsh plugin --profile desktop add <npm 包名>');
lines.push('# 例：');
lines.push('dsh plugin --profile desktop add dshmarket');
lines.push('```');
lines.push('');
lines.push('**已经装过想升级**：`add` 不会覆盖已装版本，先 `remove` 再 `add`；'
  + '或者装一个插件市场（如 `dshmarket`）用界面一键更新。');
lines.push('');
lines.push('> 只给出 GitHub 仓库、没有 npm 包名的插件，需要在 Plugins 页面用 Git 地址或本地路径安装，'
  + '而且可能要本地构建（pnpm 依赖安装脚本默认被拦截，需要你明确批准）。');
lines.push('');

/* ------------------------------------------------------------------ */
lines.push('## 同类工具');
lines.push('');
lines.push('「找插件」这件事在本插件出现之前已经有人做了，诚实起见一并列出，你可以对比着用：');
lines.push('');
for (const name of ['dshmarket', 'dsh-plugin', 'dsh-find-plugin']) {
  const row = (index.candidates ?? []).find((item) => item.npmName === name);
  if (!row) continue;
  lines.push(`- \`${row.npmName}\` — ${clamp(describe(row), 130)} 　[仓库](${row.repoUrl})　${signals(row)}`);
}
lines.push('- [AdamPlatin123/dsh-plugin-radar](https://github.com/AdamPlatin123/dsh-plugin-radar) — GitHub 上按 `dsh-plugin` 主题做雷达式发现的项目。');
lines.push('');
lines.push('和它们的区别：本插件是 **只读的检索与建议**，不代装、不改你的 profile；'
  + '数据同时来自人工精选目录、GitHub 实时搜索和 npm 清单，因此既能给出稳定推荐，也能发现刚发布、还没被目录收录的插件。');
lines.push('');

/* ------------------------------------------------------------------ */
lines.push('## 风险与局限');
lines.push('');
lines.push('- **列表 ≠ 审查。** 收录与描述来自社区目录，不代表任何安全背书。目录里的 `capabilities` 字段（如 `shell`、`fs-write`、`network`、`credentials`、`env`）是该插件已知需要的能力，看到就多想一眼。');
lines.push('- **第三方插件是别人的代码**，装上就在你的机器上以你的权限运行。装之前至少看一眼仓库。');
lines.push('- **分类与描述不是本插件写的**，来自目录；npm 搜到、目录还没收录的新包没有分类，描述也是英文原文。');
lines.push('- **数据有时差。** 目录每天更新，本插件默认 12 小时缓存一次。要最新结果就调一次 `dsh_plugin_finder` 的 `refresh`。');
lines.push('- **GitHub 未认证限额**约每分钟 10 次搜索、每小时 60 次核心请求；频繁刷新会触发限流，此时工具会原样报出 warning，而不是假装成功。');
if (source === 'seed') {
  lines.push('- **本文档当前是离线快照**，只有 160 条内置精选，不是完整目录。联网重新生成即可看到全部条目。');
}
lines.push('');

/* ------------------------------------------------------------------ */
lines.push('## 附录 A · 分类字典');
lines.push('');
lines.push('| 分类 id | 中文 | English | 数量 |');
lines.push('| --- | --- | --- | --- |');
for (const [id, value] of Object.entries(categories).sort((a, b) => (counts[b[0]] ?? 0) - (counts[a[0]] ?? 0))) {
  lines.push(`| \`${id}\` | ${cell(value.zh)} | ${cell(value.en)} | ${counts[id] ?? 0} |`);
}
lines.push('');
lines.push('## 附录 B · 本插件的 Agent 工具');
lines.push('');
lines.push('装上 `dsh-plugin-finder` 之后，可以直接在对话里让 agent 查：');
lines.push('');
lines.push('```text');
lines.push('{ "action": "suggest", "query": "记忆", "limit": 10 }');
lines.push('{ "action": "suggest", "category": "vision", "installable": true }');
lines.push('{ "action": "search",  "query": "task board" }   // 额外实时查 GitHub + npm');
lines.push('{ "action": "refresh" }                            // 强制重建索引');
lines.push('{ "action": "stats" }');
lines.push('```');
lines.push('');
lines.push(`_本文档由 \`dsh-plugin-finder/tools/report.mjs\` 生成于 ${new Date().toISOString()}。_`);
lines.push('');

await writeFile(outFile, lines.join('\n'), 'utf8');
const size = (await readFile(outFile, 'utf8')).length;
console.log(`report: wrote ${outFile} (${(size / 1024).toFixed(0)} KiB) from source "${source}"`);
console.log(`report: ${index.counts?.candidates ?? 0} candidates, ${Object.keys(categories).length} categories`);
