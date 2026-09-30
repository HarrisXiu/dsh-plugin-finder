/** Repository identity keeps forks with identical package names separate. */
import { normalizeRepositoryUrl } from './sources.js';
export const CATEGORIES = {
  memory: { en: 'Memory (inferred)', zh: '记忆（推断）' }, theme: { en: 'Themes (inferred)', zh: '主题（推断）' },
  market: { en: 'Markets (inferred)', zh: '插件市场（推断）' }, ui: { en: 'UI (inferred)', zh: '界面（推断）' },
  workflow: { en: 'Workflow (inferred)', zh: '工作流（推断）' }, vision: { en: 'Vision (inferred)', zh: '视觉（推断）' },
  tools: { en: 'Other tools', zh: '其他工具' },
};
export function classifyDsh(dsh) {
  const tags = [];
  if (typeof dsh?.bundle?.patch === 'string') tags.push('bundle');
  else if (dsh?.bundle !== undefined) tags.push('bundle-partial');
  if (dsh?.client) tags.push('ui');
  if (dsh?.profile) tags.push('profile');
  return tags;
}
export function daysSince(iso) {
  const time = Date.parse(iso);
  return Number.isFinite(time) ? Math.floor((Date.now() - time) / 86400000) : null;
}
export function scoreCandidate(c) {
  return Math.round((Math.log2(c.stars + 1) * 4 + (c.tags.includes('bundle') ? 20 : 0)
    + (c.npmName ? 8 : 0) + (c.installed ? -6 : 0) + (c.archived ? -20 : 0)) * 10) / 10;
}
export function isDshPlugin(c) { return c.topics?.includes('dsh-plugin') === true; }
function categoryOf(repo) {
  const text = `${repo.fullName} ${repo.description} ${repo.topics.join(' ')}`.toLowerCase();
  for (const [id, pattern] of [
    ['memory', /memory|mnemon|记忆/], ['theme', /theme|skin|主题/], ['market', /market|plugin-finder|plugin-hub|插件市场/],
    ['vision', /vision|ocr|multimodal|视觉/], ['workflow', /workflow|automation|工作流/], ['ui', /sidebar|\bui\b|界面/],
  ]) if (pattern.test(text)) return id;
  return 'tools';
}
export function mergeCandidates({ repos = [], repoManifests = new Map(), manifests = new Map(), installed = new Set() } = {}) {
  const unique = new Map();
  for (const repo of repos) {
    if (!repo.topics?.includes('dsh-plugin') || !/^[\w.-]+\/[\w.-]+$/.test(repo.fullName)) continue;
    unique.set(repo.fullName.toLowerCase(), repo);
  }
  return [...unique.values()].map(repo => {
    const manifest = repoManifests.get(repo.fullName);
    const repoUrl = `https://github.com/${repo.fullName}`;
    const published = manifest?.private !== true && manifests.get(manifest?.name);
    const verified = published?.name === manifest?.name && Boolean(published)
      && normalizeRepositoryUrl(published.repository).toLowerCase() === repoUrl.toLowerCase();
    const c = {
      key: `gh:${repo.fullName.toLowerCase()}`, repoFullName: repo.fullName, repoUrl,
      npmName: verified ? published.name : '', packageName: manifest?.name ?? '',
      description: repo.description || manifest?.description || '', descriptions: { en: repo.description || manifest?.description || '', zh: '' },
      category: categoryOf(repo), version: verified ? published.version ?? '' : manifest?.version ?? '',
      stars: Math.max(0, Number(repo.stars) || 0), forks: repo.forks ?? 0, openIssues: repo.openIssues ?? 0,
      downloadsLastMonth: null, pushedAt: repo.pushedAt, createdAt: repo.createdAt, addedAt: '', archived: repo.archived === true,
      license: repo.license || manifest?.license || '', topics: repo.topics, keywords: Array.isArray(manifest?.keywords) ? manifest.keywords : [],
      dshKeys: Object.keys(manifest?.dsh ?? {}), tags: classifyDsh(manifest?.dsh),
      capabilities: [], capabilityRedLines: [], screenshots: [], page: '', homepage: repo.homepage ?? '',
      sources: ['github', ...(repo.source ? [repo.source] : [])], evidence: ['GitHub topic:dsh-plugin'],
      installed: installed.has(repoUrl.toLowerCase()) || Boolean(verified && installed.has(published.name.toLowerCase())),
      installSpec: '', score: 0,
    };
    c.installSpec = c.tags.includes('bundle') ? c.npmName || repoUrl : '';
    c.score = scoreCandidate(c);
    return c;
  }).sort((a, b) => b.score - a.score || a.repoFullName.localeCompare(b.repoFullName));
}
