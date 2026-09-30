/**
 * Hand-picked plugins for the bundled seed list.
 *
 * `weight` raises a pick above the community-signal ranking of the same list;
 * it is the only editorial input the finder applies. `note` is shown in the
 * standalone report, and is written only from a description that was actually
 * read — never inferred from a name.
 *
 * Every entry is matched against the live catalog at build time, so a renamed
 * package or a moved repository drops out of the seed instead of shipping a
 * stale identifier.
 */
export const CURATED = [
  { npm: 'dshmarket', weight: 30, note: '社区插件市场，可浏览、搜索并一键安装目录里的插件。' },
  { npm: 'dsh-plugin', weight: 28, note: 'DSH Plugin Hub：收录量最大的社区插件市场，与 dsh-plugin.org 同源。' },
  { npm: 'dsh-find-plugin', weight: 26, note: '专门用来发现插件的插件，可作为本插件的对照工具。' },
  { npm: '@liustack/modlens', weight: 24 },
  { npm: 'dsh-better-sidebar', weight: 22 },
  { npm: 'dsh-whale-widget', weight: 20 },
  { npm: 'billion-context', weight: 20 },
  { npm: 'dsh-context', weight: 18 },
  { npm: '@nanmicoder/dsh-agent-teams', weight: 18 },
  { npm: '@deepseek-harness-tui/dsh-tui', weight: 16 },
  { npm: '@linxin666/dsh-client-ui-git-graph', weight: 16 },
  { npm: '@linxin666/dsh-client-ui-task-board', weight: 16 },
  { npm: '@linxin666/dsh-client-ui-skill-explorer', weight: 14 },
  { npm: '@linxin666/dsh-ssh', weight: 14 },
  { npm: '@michengai/dsh-codex-ui', weight: 14 },
  { npm: 'dsh-cost-meter', weight: 14 },
  { npm: '@xmanrui/dsh-im', weight: 12 },
  { npm: 'dsh-pocket', weight: 12 },
  { npm: 'dsh-univer-office', weight: 12 },
  { npm: 'dsh-vision-router', weight: 12 },
  { npm: '@liustack/modsearch', weight: 10 },
  { npm: 'dsh-mnemon', weight: 10 },
  { npm: 'dsh-dream-skin', weight: 10 },
  { npm: '@cloudbase/dsh-plugin', weight: 8 },
  { npm: 'dsh-deja', weight: 8 },
  { npm: 'dsh-tongflow', weight: 8 },
  { npm: 'dsh-free-search', weight: 8 },
  { npm: 'dsh-token-usage-stats', weight: 6 },
  { npm: 'dsh-my-guardian', weight: 6 },
  { npm: '@roarpeng/graphflow', weight: 6 },
];

/** How many catalog rows in total the bundled seed list carries. */
export const SEED_SIZE = 160;

/** How many rows the client snapshot inlines. */
export const SNAPSHOT_SIZE = 200;
