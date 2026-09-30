/**
 * Candidate normalization, merging, classification, and ranking.
 *
 * A "candidate" is one DSH plugin seen from one or more angles: a curated
 * catalog row, a GitHub repository, an npm package, or a hand-written seed
 * entry. Every angle describes the same thing — a package name and the
 * repository that publishes it — so the finder merges them on package name and
 * falls back to the repository identity when a repository publishes no package.
 *
 * @module dsh-plugin-finder/core/candidates
 */
import { normalizeRepositoryUrl, repoFullName } from './sources.js';

/** Official packages ship with DSH; they are not suggestions. */
const OFFICIAL_SCOPE = '@deepseek-ai/';

/** Package-name shapes that only a DSH plugin package uses. */
const PLUGIN_NAME = /^(?:@[^/]+\/)?dsh-(?:plugin|theme|skill|bundle|tool|market|widget|ui|[a-z]+-ui)/i;

/** Words that, in a name, description, or topic list, mark a DSH plugin. */
const DSH_WORDS = /\b(dsh|deepseek[- ]harness|harness plugin)\b/i;

/**
 * Classify a package's `dsh` manifest keys into human tags.
 * @param {unknown} dsh - the `dsh` field of a `package.json`, if any.
 * @returns {string[]} tags such as `bundle`, `ui`, `profile`.
 */
export function classifyDsh(dsh) {
  const tags = [];
  if (!dsh || typeof dsh !== 'object') return tags;
  const bundle = dsh.bundle;
  if (bundle && typeof bundle === 'object' && typeof bundle.patch === 'string') tags.push('bundle');
  else if (bundle !== undefined) tags.push('bundle-partial');
  if (dsh.client && typeof dsh.client === 'object') tags.push('ui');
  if (dsh.profile && typeof dsh.profile === 'object') tags.push('profile');
  return tags;
}

/**
 * Decide whether a record plausibly is a DSH plugin worth suggesting.
 * @param {object} candidate - a merged candidate.
 * @returns {boolean} true when the record should stay in the suggestion list.
 */
export function isDshPlugin(candidate) {
  if (!candidate?.npmName && !candidate?.repoUrl) return false;
  if (candidate.npmName?.startsWith(OFFICIAL_SCOPE)) return false;
  // A curated catalog row or a hand-written seed entry is authoritative.
  if (candidate.catalogRow || candidate.curated) return true;
  if (candidate.dshKeys?.length) return true;
  if (candidate.tags?.includes('bundle')) return true;
  if (candidate.npmName && PLUGIN_NAME.test(candidate.npmName)) return true;
  if (candidate.repoFullName && /(^|[-_/])dsh([-_]|$)/i.test(candidate.repoFullName)) return true;
  const haystack = [candidate.npmName, candidate.description, candidate.topics?.join(' '), candidate.keywords?.join(' ')]
    .filter(Boolean).join(' ');
  return DSH_WORDS.test(haystack);
}

/**
 * Create an empty candidate for one identity.
 * @param {string} key - the merge key.
 * @returns {object} a blank candidate.
 */
function blank(key) {
  return {
    key,
    npmName: '',
    repoUrl: '',
    repoFullName: '',
    description: '',
    descriptions: { en: '', zh: '' },
    category: '',
    version: '',
    stars: 0,
    forks: 0,
    openIssues: 0,
    downloadsLastMonth: null,
    pushedAt: '',
    createdAt: '',
    addedAt: '',
    archived: false,
    license: '',
    topics: [],
    keywords: [],
    capabilities: [],
    capabilityRedLines: [],
    screenshots: [],
    page: '',
    dshKeys: [],
    tags: [],
    installSpec: '',
    homepage: '',
    sources: [],
    evidence: [],
    catalogRow: null,
    curated: null,
    installed: false,
    score: 0,
  };
}

/**
 * Fold catalog rows, repositories, packages, package manifests, and curated
 * seed entries into one deduplicated, ranked candidate list.
 * @param {object} input - the collected raw material.
 * @param {object[]} [input.catalog] - rows from {@link fetchCatalog}.
 * @param {object[]} [input.repos] - repository records from the GitHub search.
 * @param {object[]} [input.packages] - package records from the npm search.
 * @param {Map<string, object>} [input.manifests] - `package.json` by npm name.
 * @param {Map<string, object>} [input.repoManifests] - `package.json` by `owner/repo`.
 * @param {Record<string, number>} [input.downloads] - last-month downloads by npm name.
 * @param {object[]} [input.seed] - hand-written seed entries.
 * @param {Set<string>} [input.installed] - npm names already installed in the profile.
 * @returns {object[]} merged, filtered, ranked candidates.
 */
export function mergeCandidates(input = {}) {
  const {
    catalog = [], repos = [], packages = [], manifests = new Map(),
    repoManifests = new Map(), downloads = {}, seed = [], installed = new Set(),
  } = input;
  /** @type {Map<string, object>} */
  const byPackage = new Map();
  /** @type {Map<string, object>} */
  const byRepo = new Map();

  /** Find or create the candidate a package name belongs to. */
  const forPackage = (name) => {
    const key = `npm:${name.toLowerCase()}`;
    if (!byPackage.has(key)) {
      const created = blank(key);
      created.npmName = name;
      byPackage.set(key, created);
    }
    return byPackage.get(key);
  };
  /** Find or create the candidate a repository belongs to. */
  const forRepo = (fullName) => {
    const key = `gh:${fullName.toLowerCase()}`;
    if (!byRepo.has(key)) {
      const created = blank(key);
      created.repoFullName = fullName;
      created.repoUrl = `https://github.com/${fullName}`;
      byRepo.set(key, created);
    }
    return byRepo.get(key);
  };

  for (const repo of repos) {
    if (!repo.fullName || repo.archived) continue;
    const candidate = forRepo(repo.fullName);
    candidate.description ||= repo.description;
    candidate.stars = Math.max(candidate.stars, repo.stars);
    candidate.forks = Math.max(candidate.forks, repo.forks);
    candidate.openIssues = Math.max(candidate.openIssues, repo.openIssues);
    candidate.pushedAt = latest(candidate.pushedAt, repo.pushedAt);
    candidate.createdAt ||= repo.createdAt;
    candidate.license ||= repo.license;
    candidate.topics = unique([...candidate.topics, ...repo.topics]);
    candidate.homepage ||= repo.homepage;
    push(candidate.sources, 'github');
    push(candidate.evidence, `github search: ${repo.fullName}`);
    const manifest = repoManifests.get(repo.fullName);
    if (manifest?.name) {
      const pkg = forPackage(String(manifest.name));
      absorb(pkg, candidate);
      applyManifest(pkg, manifest, `github package.json: ${repo.fullName}`);
    }
  }

  for (const pkg of packages) {
    if (!pkg.name) continue;
    const candidate = forPackage(pkg.name);
    candidate.description ||= pkg.description;
    candidate.version ||= pkg.version;
    candidate.keywords = unique([...candidate.keywords, ...pkg.keywords]);
    candidate.homepage ||= pkg.homepage;
    candidate.repoUrl ||= normalizeRepositoryUrl(pkg.repositoryUrl);
    candidate.repoFullName ||= repoFullName(candidate.repoUrl);
    push(candidate.sources, 'npm');
    push(candidate.evidence, `npm search: ${pkg.name}@${pkg.version}`);
    if (candidate.repoFullName) {
      const repo = forRepo(candidate.repoFullName);
      absorb(repo, candidate);
      candidate.stars = Math.max(candidate.stars, repo.stars);
      candidate.pushedAt = latest(candidate.pushedAt, repo.pushedAt);
      candidate.license ||= repo.license;
      candidate.topics = unique([...candidate.topics, ...repo.topics]);
    }
    const manifest = manifests.get(pkg.name);
    if (manifest) applyManifest(candidate, manifest, `npm manifest: ${pkg.name}@${pkg.version}`);
  }

  // A repository that never appeared through a package still deserves a row when
  // its own manifest names a package.
  for (const [fullName, manifest] of repoManifests) {
    if (!manifest?.name) continue;
    const repo = forRepo(fullName);
    const pkg = forPackage(String(manifest.name));
    absorb(pkg, repo);
    applyManifest(pkg, manifest, `github package.json: ${fullName}`);
  }

  // The two maps can hold the same plugin twice — once per identity — so this
  // pass folds rows that now share a package name.
  const folded = new Map();
  for (const candidate of [...byPackage.values(), ...byRepo.values()]) {
    const key = candidate.npmName ? `npm:${candidate.npmName.toLowerCase()}` : candidate.key;
    const existing = folded.get(key);
    if (existing) { absorb(existing, candidate); finish(existing, downloads, installed); continue; }
    folded.set(key, candidate);
  }

  // Catalog rows and seed entries attach to a folded row by package name, or by
  // repository identity when the row has no package.
  const byRepoName = new Map([...folded.values()].filter((c) => c.repoFullName)
    .map((c) => [c.repoFullName.toLowerCase(), c]));
  const attach = (entry, kind) => {
    const nameKey = entry.npmName ? `npm:${String(entry.npmName).toLowerCase()}` : '';
    const repoName = String(entry.repoFullName ?? repoFullName(entry.repoUrl ?? '')).toLowerCase();
    // A row that names a package is identified by that package alone. Several
    // packages commonly live in one monorepo, so falling back to the repository
    // identity here would fold every sibling package into the first one's row.
    let target = nameKey ? folded.get(nameKey) : (repoName ? byRepoName.get(repoName) : undefined);
    if (!target) {
      target = blank(nameKey || `ext:${repoName || entry.name || Math.random().toString(36)}`);
      target.npmName = entry.npmName ?? '';
      target.repoUrl = entry.repoUrl ?? '';
      target.repoFullName = repoName;
      folded.set(target.key, target);
      if (repoName) byRepoName.set(repoName, target);
    }
    if (kind === 'catalog') applyCatalog(target, entry);
    else applySeed(target, entry);
    finish(target, downloads, installed);
  };
  for (const entry of catalog) attach(entry, 'catalog');
  for (const entry of seed) attach(entry, 'seed');

  return [...folded.values()]
    .filter(isDshPlugin)
    .filter((candidate) => !candidate.archived)
    .sort((a, b) => b.score - a.score || a.npmName.localeCompare(b.npmName));
}

/**
 * Fold one candidate's facts into another.
 * @param {object} target - the surviving candidate.
 * @param {object} source - the candidate to absorb.
 * @returns {void}
 */
function absorb(target, source) {
  target.npmName ||= source.npmName;
  target.repoUrl ||= source.repoUrl;
  target.repoFullName ||= source.repoFullName;
  target.description ||= source.description;
  target.version ||= source.version;
  target.license ||= source.license;
  target.homepage ||= source.homepage;
  target.category ||= source.category;
  target.page ||= source.page;
  target.addedAt ||= source.addedAt;
  target.curated ||= source.curated;
  target.catalogRow ||= source.catalogRow;
  target.stars = Math.max(target.stars, source.stars);
  target.forks = Math.max(target.forks, source.forks);
  target.openIssues = Math.max(target.openIssues, source.openIssues);
  target.downloadsLastMonth = target.downloadsLastMonth ?? source.downloadsLastMonth;
  target.pushedAt = latest(target.pushedAt, source.pushedAt);
  target.createdAt = target.createdAt || source.createdAt;
  target.archived = target.archived || source.archived;
  target.topics = unique([...target.topics, ...source.topics]);
  target.keywords = unique([...target.keywords, ...source.keywords]);
  target.tags = unique([...target.tags, ...source.tags]);
  target.dshKeys = unique([...target.dshKeys, ...source.dshKeys]);
  target.sources = unique([...target.sources, ...source.sources]);
  target.evidence = unique([...target.evidence, ...source.evidence]);
  target.capabilities = unique([...target.capabilities, ...source.capabilities]);
  target.capabilityRedLines = unique([...target.capabilityRedLines, ...source.capabilityRedLines]);
  target.screenshots = unique([...target.screenshots, ...source.screenshots]);
  target.descriptions = {
    en: target.descriptions.en || source.descriptions.en,
    zh: target.descriptions.zh || source.descriptions.zh,
  };
}

/**
 * Apply a package manifest to a candidate.
 * @param {object} candidate - the candidate to update.
 * @param {object} manifest - the parsed `package.json`.
 * @param {string} evidence - where the manifest came from.
 * @returns {void}
 */
function applyManifest(candidate, manifest, evidence) {
  candidate.description ||= typeof manifest.description === 'string' ? manifest.description : '';
  candidate.version ||= typeof manifest.version === 'string' ? manifest.version : '';
  candidate.license ||= typeof manifest.license === 'string' ? manifest.license : '';
  candidate.repoUrl ||= normalizeRepositoryUrl(manifest.repository);
  if (!candidate.repoFullName && candidate.repoUrl) candidate.repoFullName = repoFullName(candidate.repoUrl);
  if (Array.isArray(manifest.keywords)) candidate.keywords = unique([...candidate.keywords, ...manifest.keywords.map(String)]);
  if (manifest.dsh && typeof manifest.dsh === 'object') {
    candidate.dshKeys = unique([...candidate.dshKeys, ...Object.keys(manifest.dsh)]);
    candidate.tags = unique([...candidate.tags, ...classifyDsh(manifest.dsh)]);
  }
  push(candidate.evidence, evidence);
}

/**
 * Apply one curated catalog row.
 * @param {object} candidate - the candidate to update.
 * @param {object} entry - a catalog entry.
 * @returns {void}
 */
function applyCatalog(candidate, entry) {
  candidate.catalogRow ||= {
    name: entry.name, owner: entry.owner, page: entry.page,
    category: entry.category, addedAt: entry.addedAt, screenshots: entry.screenshots,
  };
  candidate.descriptions = {
    en: candidate.descriptions.en || entry.descriptions.en,
    zh: candidate.descriptions.zh || entry.descriptions.zh,
  };
  const preferred = entry.descriptions.zh || entry.descriptions.en;
  if (preferred && !candidate.description) candidate.description = preferred;
  candidate.category ||= entry.category;
  candidate.page ||= entry.page;
  candidate.addedAt ||= entry.addedAt;
  candidate.version ||= entry.version;
  candidate.stars = Math.max(candidate.stars, entry.stars);
  candidate.downloadsLastMonth = candidate.downloadsLastMonth ?? entry.downloadsLastMonth;
  candidate.capabilities = unique([...candidate.capabilities, ...entry.capabilities]);
  candidate.capabilityRedLines = unique([...candidate.capabilityRedLines, ...entry.capabilityRedLines]);
  candidate.screenshots = unique([...candidate.screenshots, ...entry.screenshots]);
  push(candidate.sources, 'catalog');
  push(candidate.evidence, `catalog: ${entry.owner}/${entry.name}`);
}

/**
 * Apply one hand-written seed entry.
 * @param {object} candidate - the candidate to update.
 * @param {object} entry - a seed entry.
 * @returns {void}
 */
function applySeed(candidate, entry) {
  candidate.curated = entry;
  candidate.description ||= entry.description ?? '';
  candidate.descriptions = {
    en: candidate.descriptions.en || entry.descriptionEn || '',
    zh: candidate.descriptions.zh || entry.descriptionZh || '',
  };
  candidate.category ||= entry.category ?? '';
  candidate.repoUrl ||= entry.repoUrl ?? '';
  if (!candidate.repoFullName) candidate.repoFullName = repoFullName(candidate.repoUrl);
  candidate.stars = Math.max(candidate.stars, Number(entry.stars ?? 0));
  candidate.downloadsLastMonth ??= entry.downloadsLastMonth ?? null;
  candidate.tags = unique([...candidate.tags, ...(entry.tags ?? [])]);
  push(candidate.sources, 'curated');
  push(candidate.evidence, `curated: ${entry.verifiedAt ?? 'seed'}`);
}

/**
 * Fill derived fields and score a candidate.
 * @param {object} candidate - the candidate to finish.
 * @param {Record<string, number>} downloads - last-month downloads by npm name.
 * @param {Set<string>} installed - npm names already installed in the profile.
 * @returns {void}
 */
function finish(candidate, downloads, installed) {
  if (candidate.downloadsLastMonth === null && candidate.npmName && downloads[candidate.npmName] !== undefined) {
    candidate.downloadsLastMonth = downloads[candidate.npmName];
  }
  candidate.sources = unique(candidate.sources);
  candidate.evidence = unique(candidate.evidence);
  candidate.tags = unique(candidate.tags);
  candidate.installSpec = candidate.npmName || candidate.repoUrl;
  candidate.installed = Boolean(candidate.npmName && installed.has(candidate.npmName.toLowerCase()))
    || Boolean(candidate.repoUrl && installed.has(candidate.repoUrl.toLowerCase()));
  candidate.score = scoreCandidate(candidate);
}

/**
 * Rank one candidate.
 *
 * The weights favor what actually decides whether a person can install the
 * plugin. Two facts grant the installability tier and are treated as
 * equivalent: a manifest that declares `dsh.bundle.patch`, which is read only
 * for packages the catalog does not cover, and a curated catalog row, which by
 * construction lists installable DSH plugins. Without that equivalence a
 * freshly published package would outrank every catalogued one simply because
 * its manifest was read.
 *
 * @param {object} candidate - a finished candidate.
 * @returns {number} a comparable score.
 */
export function scoreCandidate(candidate) {
  let score = 0;
  // Installability and shape.
  if (candidate.tags.includes('bundle')) score += 50;
  else if (candidate.tags.includes('bundle-partial')) score += 30;
  else if (candidate.catalogRow || candidate.curated) score += 40;
  if (candidate.tags.includes('ui')) score += 14;
  if (candidate.npmName) score += 12;
  if (candidate.repoUrl) score += 8;
  // Editorial signals.
  if (candidate.catalogRow) score += 6;
  if (candidate.curated) score += 10 + Math.min(30, Number(candidate.curated.weight ?? 0));
  // Community signals.
  score += Math.min(22, Math.log2(Math.max(0, candidate.stars) + 1) * 4);
  score += Math.min(16, Math.log10(Math.max(0, candidate.downloadsLastMonth ?? 0) + 1) * 5);
  const ageDays = daysSince(candidate.pushedAt || candidate.addedAt);
  if (ageDays !== null) {
    if (ageDays <= 60) score += 12;
    else if (ageDays <= 180) score += 7;
    else if (ageDays <= 540) score += 3;
    else score -= 4;
  }
  // Hygiene and risk.
  if (candidate.license) score += 3;
  if (candidate.topics.some((topic) => /dsh|deepseek|harness/i.test(topic))) score += 6;
  if (candidate.installed) score -= 6;
  if (candidate.capabilityRedLines.length) score -= 8;
  if (candidate.archived) score -= 40;
  return Math.round(score * 10) / 10;
}

/**
 * Days between a timestamp and now.
 * @param {string} iso - an ISO timestamp.
 * @returns {number|null} whole days, or null when the timestamp is unusable.
 */
export function daysSince(iso) {
  const time = Date.parse(String(iso ?? ''));
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.round((Date.now() - time) / 86400000));
}

/** Keep the later of two ISO timestamps. */
function latest(a, b) {
  if (!a) return b ?? '';
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

/** Append a value once, preserving order. */
function push(list, value) {
  if (value && !list.includes(value)) list.push(value);
}

/** Deduplicate a list, preserving order. */
function unique(list) {
  return [...new Set(list.filter((value) => value !== undefined && value !== null && value !== ''))];
}
