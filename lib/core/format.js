/**
 * Rendering for the two places a suggestion list is read: an agent tool result
 * and a standalone Markdown document.
 *
 * @module dsh-plugin-finder/core/format
 */

/**
 * Render candidates as a compact, line-oriented list for a tool result.
 * @param {object[]} candidates - ranked candidates.
 * @param {object} [options] - rendering options.
 * @param {number} [options.limit] - maximum rows, default 15.
 * @param {string} [options.profile] - the profile name, for a runnable install command.
 * @returns {string} the text a model reads.
 */
export function renderToolText(candidates, options = {}) {
  const { limit = 15, profile = '' } = options;
  const rows = candidates.slice(0, Math.max(1, limit));
  if (!rows.length) return 'No matching DSH plugin was found.';
  const lines = [];
  for (const [index, candidate] of rows.entries()) {
    const tags = candidate.tags.length ? ` [${candidate.tags.join(',')}]` : '';
    lines.push(`${index + 1}. ${candidate.npmName || candidate.repoFullName}${tags}${candidate.archived ? ' [archived]' : ''}`);
    if (candidate.repoUrl) lines.push(`   repo: ${candidate.repoUrl}`);
    if (!candidate.installSpec) lines.push('   install: unverified — check the repository README for its install target');
    const about = candidate.descriptions?.zh || candidate.description;
    if (about) lines.push(`   about: ${truncate(about, 160)}`);
    const facts = [];
    if (candidate.stars) facts.push(`${candidate.stars} stars`);
    if (candidate.downloadsLastMonth !== null && candidate.downloadsLastMonth !== undefined) {
      facts.push(`${candidate.downloadsLastMonth} downloads/month`);
    }
    if (candidate.version) facts.push(`v${candidate.version}`);
    if (candidate.category) facts.push(`category: ${candidate.category}`);
    if (candidate.license) facts.push(candidate.license);
    if (candidate.installed) facts.push('ALREADY INSTALLED');
    if (candidate.capabilities?.length) facts.push(`needs: ${candidate.capabilities.join(',')}`);
    if (facts.length) lines.push(`   ${facts.join(' | ')}`);
    if (candidate.installSpec) {
      // Without a profile name the CLI form would be wrong (`dsh plugin` requires
      // `--profile`), so the GUI instruction is the honest one to give.
      lines.push(profile
        ? `   install: dsh plugin --profile ${profile} add ${candidate.installSpec}`
        : `   install: ${candidate.installSpec} — add it from the sidebar Plugins page (Add plugin)`);
    }
  }
  return lines.join('\n');
}

/**
 * Render candidates as a Markdown table plus an installation note.
 * @param {object[]} candidates - ranked candidates.
 * @param {object} [options] - rendering options.
 * @param {number} [options.limit] - maximum rows, default 50.
 * @param {boolean} [options.notes] - add the per-candidate note column.
 * @returns {string} Markdown.
 */
export function renderMarkdownTable(candidates, options = {}) {
  const { limit = 50 } = options;
  const rows = candidates.slice(0, Math.max(1, limit));
  if (!rows.length) return '_No candidate was found._\n';
  const lines = [
    '| # | npm 包名 | GitHub 仓库 | 说明 | 标签 | 社区信号 | 安装标识 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const [index, candidate] of rows.entries()) {
    const name = candidate.npmName ? `\`${candidate.npmName}\`` : '—';
    const repo = candidate.repoUrl ? `[${candidate.repoFullName || 'repo'}](${candidate.repoUrl})` : '—';
    const signals = [
      candidate.stars ? `★${candidate.stars}` : '',
      candidate.downloadsLastMonth !== null && candidate.downloadsLastMonth !== undefined
        ? `${candidate.downloadsLastMonth}/月` : '',
      candidate.pushedAt ? `更新 ${String(candidate.pushedAt).slice(0, 10)}` : '',
    ].filter(Boolean).join(' · ') || '—';
    lines.push([
      index + 1, name, repo,
      escapeCell(truncate(candidate.description || '—', 110)),
      candidate.tags.join(', ') || '—',
      signals,
      candidate.installSpec ? `\`${candidate.installSpec}\`` : '—',
    ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'));
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Escape a value for use inside a Markdown table cell.
 * @param {string} value - the raw text.
 * @returns {string} the cell-safe text.
 */
function escapeCell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/**
 * Shorten text to a byte-safe length on a word boundary.
 * @param {string} value - the raw text.
 * @param {number} limit - maximum characters.
 * @returns {string} the shortened text.
 */
export function truncate(value, limit) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1).trimEnd()}…`;
}
