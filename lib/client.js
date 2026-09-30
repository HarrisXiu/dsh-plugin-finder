/**
 * Plugin Finder — Client half.
 *
 * Registers the "Plugin Finder" sidebar entry and its main panel: a browsable,
 * searchable directory of GitHub repositories carrying the dsh-plugin topic,
 * showing each plugin's npm package name and GitHub repository.
 *
 * Contract this file follows (see the Cordis plugin-development skill):
 *
 * - `window.__ModuleLoader__.load({ id, factory })` where `id` is exactly the npm
 *   package name; the factory is side-effect-free and returns the plugin module.
 * - The sidebar entry is the root-scoped **list** slot `sidebar.panellist` and
 *   requires `id`; the page is the root-scoped **keyed** slot `main` and requires
 *   `key` with the same value, which is what joins the two.
 * - `locale` on both registrations is what makes `props.t` exist. Omitting it
 *   leaves `t` undefined, the component throws, and the renderer silently drops
 *   the entry.
 * - Only `react` is required; the Harness Client packages are not imported.
 * - Styling uses `--dsw-alias-*` theme tokens only, so the panel follows the
 *   active light or dark theme.
 */
window.__ModuleLoader__.load({
  id: 'dsh-plugin-finder',
  factory: function (require) {
    var React = require('react');
    var h = React.createElement;

    /** Locale namespace for this plugin's own strings. */
    var NS = 'pluginFinder';
    /** Shared panel identity: the sidebar entry id equals the main slot key. */
    var PANEL_ID = 'plugin-finder';
    /** All data comes from the same host engine used by the agent tool. */
    var INDEX_URL = '/plugin-finder/index';
    /** How many repository rows are rendered at once. */
    var PAGE = 150;

    /** An empty initial state; discovered data is loaded from the host cache. */
    var SNAPSHOT = {"rows":[],"categories":{},"updated":"","generatedAt":""};

    // The panel follows the interface language.
    var LANG = String(
      (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang)
      || (typeof navigator !== 'undefined' && navigator.language) || 'en',
    ).toLowerCase();
    var ZH = LANG.indexOf('zh') === 0;

    var en = {
      panel: 'Plugin Finder',
      title: 'DSH Plugin Finder',
      subtitle: 'GitHub repositories tagged dsh-plugin. Forks and archived repositories included; categories are inferred.',
      search: 'Search name, repository, or description',
      category: 'Category',
      all: 'All',
      sort: 'Sort',
      sortRecommended: 'Recommended',
      sortStars: 'Stars',
      sortDownloads: 'Downloads',
      sortName: 'Name',
      installableOnly: 'Verified bundle',
      refresh: 'Scan / resume GitHub',
      refreshing: 'Refreshing…',
      loading: 'Scanning GitHub…',
      empty: 'No plugin matched. Clear the search or pick another category.',
      snapshot: 'Cached scan',
      live: 'GitHub scan',
      updated: 'Scanned {date}',
      total: '{count} plugins',
      shown: 'Showing the first {shown} of {total}',
      more: 'Show more',
      installable: 'npm',
      repoOnly: 'GitHub only',
      installedHint: 'For a recognized bundle, copy its install target into Plugins → Add plugin. Otherwise check the repository README.',
      copy: 'Copy install target',
      copied: 'Copied',
      openRepo: 'Repository',
      openNpm: 'npm',
      openPage: 'Catalog page',
      failed: 'Scan is incomplete or unavailable; showing repositories already found.',
      stars: 'stars',
      downloads: 'downloads/month',
      full: 'Full list',
      fullHint: 'Browse the dsh-plugin topic on GitHub',
    };

    var zh = {
      panel: '插件发现',
      title: 'DSH 插件发现',
      subtitle: '直接扫描 GitHub 的 dsh-plugin 标签仓库，包含 fork 和已归档仓库；分类由关键词推断。',
      search: '搜索包名、仓库或描述',
      category: '分类',
      all: '全部',
      sort: '排序',
      sortRecommended: '推荐',
      sortStars: '星标',
      sortDownloads: '下载量',
      sortName: '名称',
      installableOnly: '已识别 bundle',
      refresh: '扫描 / 继续扫描',
      refreshing: '正在刷新…',
      loading: '正在扫描 GitHub…',
      empty: '没有匹配的插件。清空搜索词或换一个分类。',
      snapshot: '扫描缓存',
      live: 'GitHub 扫描',
      updated: '扫描于 {date}',
      total: '共 {count} 个插件',
      shown: '显示前 {shown} / {total} 条',
      more: '显示更多',
      installable: 'npm',
      repoOnly: '仅 GitHub',
      installedHint: '已识别 bundle 可复制安装标识到 Plugins → Add plugin；其他仓库请先查看 README 的安装说明。',
      copy: '复制包名',
      copied: '已复制',
      openRepo: '仓库',
      openNpm: 'npm',
      openPage: '目录页',
      failed: '扫描未完成或网络不可用，显示已找到的仓库。',
      stars: '星标',
      downloads: '下载/月',
      full: '完整目录',
      fullHint: '在 GitHub 查看 dsh-plugin 标签仓库',
    };

    /* ------------------------------------------------------------------ */
    /* Data                                                                */
    /* ------------------------------------------------------------------ */

    /** Format a count compactly. */
    function num(value) {
      var n = Number(value || 0);
      if (!Number.isFinite(n) || n <= 0) return '0';
      if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
      return String(Math.round(n));
    }

    /** Today's date part of an ISO timestamp. */
    function day(iso) {
      var text = String(iso || '');
      return text.length >= 10 ? text.slice(0, 10) : text;
    }

    /** The description in the interface language, with a fallback. */
    function describe(row) {
      var zhText = row.zh || '';
      var enText = row.en || '';
      return (ZH ? (zhText || enText) : (enText || zhText)) || '';
    }

    /** The host already ranked repository identity, manifest shape and stars. */
    function scoreOf(row) { return row.score || 0; }

    /** Flatten host candidates without guessing npm publication or installability. */
    function toRow(entry) {
      var parts = entry.repoFullName.split('/');
      return {
        key: entry.key, name: entry.repoFullName, owner: parts[0], npm: entry.npmName,
        url: entry.repoUrl, page: '', category: entry.category,
        zh: entry.descriptions.zh, en: entry.descriptions.en || entry.description,
        stars: entry.stars, downloads: 0, version: entry.version, capabilities: [],
        added: entry.createdAt, installSpec: entry.installSpec, archived: entry.archived,
        score: entry.score, topics: entry.topics,
      };
    }
    function fetchIndex(signal, refresh) {
      return fetch(refresh ? '/plugin-finder/refresh' : INDEX_URL, {
        method: refresh ? 'POST' : 'GET', headers: { accept: 'application/json' }, signal: signal,
      }).then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status + ' — restart DSH to load the new host engine');
        return response.json();
      }).then(function (data) {
        if (data.mode !== 'github-topic:dsh-plugin' || !Array.isArray(data.candidates)) throw new Error('Invalid direct-discovery response');
        return {
          rows: data.candidates.map(toRow), categories: data.categories || {}, updated: data.generatedAt,
          loading: data.running, progress: data.progress || '',
          error: (data.errors || []).join(' | ') || (!data.running && !data.scan.complete && data.candidates.length
            ? (ZH ? '扫描未完成，点击继续扫描。' : 'Partial scan; click resume.') : ''),
        };
      });
    }

    /* ------------------------------------------------------------------ */
    /* Components                                                          */
    /* ------------------------------------------------------------------ */

    /** Sidebar glyph. The sidebar passes `{ size, active }`; never re-declare those. */
    function FinderIcon(props) {
      // A glyph that throws is invisible: the renderer's error boundary removes the
      // whole entry and leaves the registration on the ledger, which reads to the
      // person as "the plugin never appeared". This one therefore cannot throw.
      try {
        var given = props || {};
        var size = typeof given.size === 'number' ? given.size : 16;
        return h('svg', {
          viewBox: '0 0 16 16', width: size, height: size, fill: 'none',
          stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round',
          strokeLinejoin: 'round', 'aria-hidden': 'true', style: { display: 'block' },
        },
        h('circle', { cx: 7, cy: 7, r: 4.5 }),
        h('path', { d: 'M10.4 10.4 14 14' }),
        h('path', { d: 'M11.5 2.5v3M10 4h3' }));
      } catch (error) {
        console.error('[plugin-finder] the sidebar glyph failed to render:', error);
        return h('span', { 'aria-hidden': 'true' }, '◎');
      }
    }

    /** A tag chip. */
    function Chip(props) {
      return h('span', { style: props.style }, props.children);
    }

    /** One plugin row. */
    function Row(props) {
      var row = props.row;
      var t = props.t;
      var copied = props.copied;
      var chip = {
        display: 'inline-block', padding: '1px 6px', borderRadius: 'var(--dsw-radius-xs, 4px)',
        background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-label-tertiary)',
        fontSize: 11, lineHeight: '16px', whiteSpace: 'nowrap',
      };
      var link = { color: 'var(--dsw-alias-link)', textDecoration: 'none', fontSize: 12 };
      var facts = [];
      if (row.stars) facts.push(num(row.stars) + ' ' + t('stars'));
      if (row.downloads) facts.push(num(row.downloads) + ' ' + t('downloads'));
      if (row.version) facts.push('v' + row.version);

      return h('li', {
        style: {
          padding: '12px 0', borderBottom: '1px solid var(--dsw-alias-border-l2)',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        },
      },
      h('div', { style: { flex: '1 1 auto', minWidth: 0 } },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
          h('span', {
            style: { fontSize: 14, fontWeight: 600, color: 'var(--dsw-alias-label-primary)', wordBreak: 'break-all' },
          }, row.npm || row.name || row.owner + '/' + row.name),
          row.installSpec ? h(Chip, { style: chip }, 'bundle') : h(Chip, { style: chip }, t('repoOnly')),
          row.category ? h(Chip, { style: chip }, props.categoryLabel(row.category)) : null,
          row.archived ? h(Chip, { style: chip }, ZH ? '已归档' : 'Archived') : null),
        h('div', {
          style: { marginTop: 4, fontSize: 12.5, lineHeight: '19px', color: 'var(--dsw-alias-label-secondary)' },
        }, describe(row)),
        h('div', {
          style: { marginTop: 6, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
        },
        facts.length ? h('span', { style: { fontSize: 11.5, color: 'var(--dsw-alias-label-tertiary)' } }, facts.join(' · ')) : null,
        row.url ? h('a', { href: row.url, target: '_blank', rel: 'noreferrer', style: link }, t('openRepo')) : null,
        row.npm ? h('a', {
          href: 'https://www.npmjs.com/package/' + encodeURIComponent(row.npm),
          target: '_blank', rel: 'noreferrer', style: link,
        }, t('openNpm')) : null,
        row.page ? h('a', { href: row.page, target: '_blank', rel: 'noreferrer', style: link }, t('openPage')) : null,
        row.capabilities.length ? h('span', {
          style: { fontSize: 11, color: 'var(--dsw-alias-state-warn-primary, var(--dsw-alias-label-tertiary))' },
        }, 'needs: ' + row.capabilities.join(', ')) : null)),
      h('div', { style: { flex: '0 0 auto' } },
        h('button', {
          type: 'button',
          onClick: function () { props.onCopy(row); },
          title: t('installedHint'),
          style: {
            cursor: 'pointer', font: 'inherit', fontSize: 12, padding: '4px 10px',
            borderRadius: 'var(--dsw-radius-sm, 6px)', border: '1px solid var(--dsw-alias-border-l2)',
            background: copied ? 'var(--dsw-alias-state-success-primary)' : 'var(--dsw-alias-bg-layer-2)',
            color: copied ? '#fff' : 'var(--dsw-alias-label-primary)',
          },
        }, copied ? t('copied') : row.installSpec ? t('copy') : (ZH ? '复制仓库' : 'Copy repository'))));
    }

    /** The main panel. Mounted only while its sidebar entry is selected. */
    function FinderPanel(props) {
      // `t` exists only because both registrations declare `locale`. If the binding
      // is ever absent the fallback keeps the panel renderable instead of throwing,
      // which would blank the page with only a console error to show for it.
      var given = props || {};
      var t = typeof given.t === 'function' ? given.t : function (key) { return String(key); };
      var initial = SNAPSHOT || { rows: [], categories: {}, updated: '', generatedAt: '' };
      var state = React.useState({
        rows: initial.rows, categories: initial.categories, updated: initial.updated,
        source: 'snapshot', loading: false, error: '',
      });
      var view = state[0];
      var setView = state[1];
      var query = React.useState('');
      var text = query[0];
      var setText = query[1];
      var category = React.useState('');
      var activeCategory = category[0];
      var setCategory = category[1];
      var sort = React.useState('recommended');
      var sortBy = sort[0];
      var setSort = sort[1];
      var onlyNpm = React.useState(false);
      var installableOnly = onlyNpm[0];
      var setInstallableOnly = onlyNpm[1];
      var visible = React.useState(PAGE);
      var shown = visible[0];
      var setShown = visible[1];
      var copied = React.useState('');
      var copiedKey = copied[0];
      var setCopiedKey = copied[1];
      var abort = React.useRef(null);

      var poll = React.useRef(null);
      var load = React.useCallback(function (force) {
        if (abort.current) abort.current.abort();
        if (poll.current) clearTimeout(poll.current);
        var controller = new AbortController();
        abort.current = controller;
        var first = !force;
        function update(result) {
          if (controller.signal.aborted) return;
          setView({
            rows: result.rows, categories: result.categories, updated: result.updated,
            source: 'live', loading: result.loading, error: result.error, progress: result.progress,
          });
          if (first && !result.loading && !result.error &&
              (!result.updated || Date.now() - Date.parse(result.updated) > 43200000)) {
            first = false;
            return fetchIndex(controller.signal, true).then(update);
          }
          first = false;
          if (result.loading) poll.current = setTimeout(function () {
            fetchIndex(controller.signal, false).then(update).catch(failed);
          }, 2000);
        }
        function failed(error) {
          if (controller.signal.aborted) return;
          setView(function (previous) {
            return Object.assign({}, previous, { loading: false, error: String(error.message || error) });
          });
        }
        fetchIndex(controller.signal, force === true).then(update).catch(failed);
      }, []);

      React.useEffect(function () {
        load(false);
        return function () {
          if (abort.current) abort.current.abort();
          if (poll.current) clearTimeout(poll.current);
        };
      }, [load]);

      /** Category label in the interface language, falling back to the id. */
      var categoryLabel = React.useCallback(function (id) {
        var entry = view.categories[id];
        if (!entry) return id;
        return (ZH ? (entry.zh || entry.en) : (entry.en || entry.zh)) || id;
      }, [view.categories]);

      /** Categories actually present, most populated first, for the chips. */
      var chips = React.useMemo(function () {
        var counts = {};
        for (var i = 0; i < view.rows.length; i += 1) {
          var id = view.rows[i].category;
          if (id) counts[id] = (counts[id] || 0) + 1;
        }
        return Object.keys(counts)
          .map(function (id) { return { id: id, count: counts[id] }; })
          .sort(function (a, b) { return b.count - a.count; })
          .slice(0, 14);
      }, [view.rows]);

      var filtered = React.useMemo(function () {
        var needle = text.trim().toLowerCase();
        var rows = view.rows.filter(function (row) {
          if (installableOnly && !row.installSpec) return false;
          if (activeCategory && row.category !== activeCategory) return false;
          if (!needle) return true;
          return (row.npm + ' ' + row.name + ' ' + row.owner + ' ' + row.url + ' ' + row.en + ' ' + row.zh + ' ' + row.category + ' ' + row.topics.join(' '))
            .toLowerCase().indexOf(needle) >= 0;
        });
        if (sortBy === 'stars') rows.sort(function (a, b) { return b.stars - a.stars; });
        else if (sortBy === 'downloads') rows.sort(function (a, b) { return b.downloads - a.downloads; });
        else if (sortBy === 'name') {
          rows.sort(function (a, b) { return (a.npm || a.name).localeCompare(b.npm || b.name); });
        } else {
          rows.sort(function (a, b) {
            return scoreOf(b) - scoreOf(a) || b.stars - a.stars;
          });
        }
        return rows;
      }, [view.rows, text, activeCategory, sortBy, installableOnly]);

      var copy = React.useCallback(function (row) {
        var value = row.installSpec || row.url;
        var done = function () {
          setCopiedKey(row.key);
          setTimeout(function () {
            setCopiedKey(function (current) { return current === row.key ? '' : current; });
          }, 1600);
        };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(value).then(done, done);
            return;
          }
        } catch (ignored) { /* fall through to the legacy path */ }
        done();
      }, []);

      // The main frame gives a panel a fixed height and clips it. A page must
      // therefore take the full height AND own its own scrolling — `overflow:auto`
      // on this root is what makes a long list scrollable at all. DSH's own
      // main-panel pages (the Plugins page) do exactly this.
      var css = '[data-plugin-finder]{box-sizing:border-box;height:100%;display:flex;flex-direction:column;'
        + 'align-items:center;overflow:auto;padding:0 clamp(24px,4vw,48px) 48px;'
        + 'background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);'
        + 'font-family:var(--dsw-font-family,inherit)}'
        + '[data-plugin-finder]>*{width:100%;max-width:1040px;flex:none}'
        + '[data-plugin-finder] .pf-head{position:sticky;top:0;z-index:1;padding:20px 0 10px;'
        + 'background:var(--dsw-alias-bg-base)}'
        + '[data-platform=darwin] [data-plugin-finder] .pf-head{padding-top:calc(20px + var(--dsh-frame-top-clearance,0px))}'
        + '[data-plugin-finder] ul{margin:0;padding:0;list-style:none}'
        + '[data-plugin-finder] input,[data-plugin-finder] select{font:inherit;font-size:13px;padding:6px 10px;'
        + 'border-radius:var(--dsw-radius-sm,6px);border:1px solid var(--dsw-alias-border-l2);'
        + 'background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}'
        + '[data-plugin-finder] input:focus-visible,[data-plugin-finder] select:focus-visible,'
        + '[data-plugin-finder] button:focus-visible,[data-plugin-finder] a:focus-visible{outline:'
        + 'var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color,var(--dsw-alias-brand-primary));outline-offset:2px}'
        + '[data-plugin-finder] .pf-chip{cursor:pointer;font:inherit;font-size:12px;padding:3px 10px;'
        + 'border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:transparent;'
        + 'color:var(--dsw-alias-label-secondary)}'
        + '[data-plugin-finder] .pf-chip[data-on="true"]{background:var(--dsw-alias-brand-primary);'
        + 'border-color:var(--dsw-alias-brand-primary);color:#fff}'
        + '[data-plugin-finder] .pf-chip:hover{background:var(--dsw-alias-interactive-bg-hover)}'
        + '[data-plugin-finder] .pf-chip[data-on="true"]:hover{background:var(--dsw-alias-brand-primary)}';

      var head = h('div', { className: 'pf-head' },
        h('div', { style: { display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' } },
          h('h2', { style: { margin: 0, fontSize: 18 } }, t('title')),
          h('span', { style: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' } },
            t('total', { count: num(view.rows.length) })
            + (view.updated ? ' · ' + t('updated', { date: day(view.updated) }) : '')
            + ' · ' + (view.source === 'live' ? t('live') : t('snapshot'))),
          h('button', {
            type: 'button', onClick: function () { load(true); }, disabled: view.loading,
            style: {
              marginLeft: 'auto', cursor: view.loading ? 'default' : 'pointer', font: 'inherit', fontSize: 12,
              padding: '5px 12px', borderRadius: 'var(--dsw-radius-sm, 6px)',
              border: '1px solid var(--dsw-alias-border-l2)', background: 'var(--dsw-alias-bg-layer-2)',
              color: 'var(--dsw-alias-label-primary)',
            },
          }, view.loading ? t('refreshing') : t('refresh'))),
        h('p', { style: { margin: '6px 0 10px', fontSize: 12.5, color: 'var(--dsw-alias-label-secondary)' } }, t('subtitle')),
        view.progress ? h('p', { role: 'status', style: { fontSize: 12 } }, view.progress) : null,
        view.error ? h('p', {
          style: {
            margin: '0 0 10px', fontSize: 12, padding: '6px 10px', borderRadius: 'var(--dsw-radius-sm, 6px)',
            background: 'var(--dsw-alias-bg-layer-3)', color: 'var(--dsw-alias-state-warn-primary, var(--dsw-alias-label-secondary))',
          },
        }, t('failed') + ' (' + view.error + ')') : null,
        h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 } },
          h('input', {
            value: text, placeholder: t('search'), 'aria-label': t('search'),
            onChange: function (event) { setText(event.target.value); setShown(PAGE); },
            style: { flex: '1 1 260px', minWidth: 200 },
          }),
          h('select', {
            value: sortBy, 'aria-label': t('sort'),
            onChange: function (event) { setSort(event.target.value); },
          },
          h('option', { value: 'recommended' }, t('sortRecommended')),
          h('option', { value: 'stars' }, t('sortStars')),
          h('option', { value: 'name' }, t('sortName'))),
          h('label', { style: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--dsw-alias-label-secondary)' } },
            h('input', {
              type: 'checkbox', checked: installableOnly,
              onChange: function (event) { setInstallableOnly(event.target.checked); setShown(PAGE); },
            }), t('installableOnly'))),
        h('div', { style: { display: 'flex', gap: 6, flexWrap: 'wrap' } },
          h('button', {
            type: 'button', className: 'pf-chip', 'data-on': activeCategory === '' ? 'true' : 'false',
            onClick: function () { setCategory(''); setShown(PAGE); },
          }, t('all') + ' ' + num(view.rows.length)),
          chips.map(function (chip) {
            return h('button', {
              key: chip.id, type: 'button', className: 'pf-chip',
              'data-on': activeCategory === chip.id ? 'true' : 'false',
              onClick: function () {
                setCategory(function (current) { return current === chip.id ? '' : chip.id; });
                setShown(PAGE);
              },
            }, categoryLabel(chip.id) + ' ' + num(chip.count));
          })));

      var body = filtered.length === 0
        ? h('p', { style: { marginTop: 24, fontSize: 13, color: 'var(--dsw-alias-label-tertiary)' } },
          view.loading && view.rows.length === 0 ? t('loading') : t('empty'))
        : h('ul', null, filtered.slice(0, shown).map(function (row) {
          return h(Row, {
            key: row.key, row: row, t: t, categoryLabel: categoryLabel,
            copied: copiedKey === row.key, onCopy: copy,
          });
        }));

      var more = filtered.length > shown
        ? h('div', { style: { marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' } },
          h('button', {
            type: 'button', onClick: function () { setShown(shown + PAGE); },
            style: {
              cursor: 'pointer', font: 'inherit', fontSize: 12.5, padding: '6px 14px',
              borderRadius: 'var(--dsw-radius-sm, 6px)', border: '1px solid var(--dsw-alias-border-l2)',
              background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)',
            },
          }, t('more')),
          h('span', { style: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary)' } },
            t('shown', { shown: num(Math.min(shown, filtered.length)), total: num(filtered.length) })))
        : null;

      var footer = h('p', { style: { marginTop: 20, fontSize: 11.5, color: 'var(--dsw-alias-label-caption, var(--dsw-alias-label-tertiary))' } },
        t('installedHint') + ' ',
        h('a', {
          href: 'https://github.com/topics/dsh-plugin', target: '_blank', rel: 'noreferrer',
          style: { color: 'var(--dsw-alias-link)' },
        }, t('fullHint')));

      return h('div', { 'data-plugin-finder': '' },
        h('style', null, css), head, body, more, footer);
    }

    return {
      inject: ['slots', 'locale'],
      apply: function (ctx) {
        // Reaching this line proves the browser half was discovered, fetched and
        // executed. Without it, "the entry is missing" is indistinguishable from
        // "the bundle never loaded", so it is logged deliberately.
        console.info('[plugin-finder] browser half loaded; registering the sidebar entry and panel');
        ctx.effect(function () {
          return ctx.locale.register(NS, { en: en, zh: zh });
        }, 'plugin-finder:dictionaries');
        var t = ctx.locale.bind(NS);

        try {
          // Sidebar entry: a root-scoped list slot, so `id` is required.
          ctx.slots.inject('sidebar.panellist', function () {
            var disposer = ctx.slots.register({
              name: 'sidebar.panellist',
              id: PANEL_ID,
              order: 40,
              label: function () { return t('panel'); },
              locale: NS,
            }, FinderIcon);
            console.info('[plugin-finder] sidebar entry registered as "' + PANEL_ID + '"');
            return disposer;
          });

          // Main panel: a root-scoped keyed slot whose `key` is that same id.
          ctx.slots.inject('main', function () {
            var disposer = ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS }, FinderPanel);
            console.info('[plugin-finder] main panel registered as "' + PANEL_ID + '"');
            return disposer;
          });
        } catch (error) {
          console.error('[plugin-finder] registering the UI failed:', error);
        }
      },
    };
  },
});
