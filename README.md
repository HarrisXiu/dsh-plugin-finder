# dsh-plugin-finder · 插件发现

一个 DSH（DeepSeek Harness）插件：**自动在 GitHub 与 npm 上找到 DSH 插件，给出 npm 包名、GitHub 仓库地址，并维护一份可直接安装的建议列表。**

装上之后你会得到两样东西：

1. **侧边栏「插件发现」页面** —— 浏览、搜索、按分类筛选收录的全部社区插件，每行都带 npm 包名与 GitHub 仓库链接，一键复制包名去安装。
2. **Agent 工具 `dsh_plugin_finder`** —— 让你在对话里直接问「有哪些做记忆的插件」「XXX 的仓库在哪」，它返回包名、仓库、星标、月下载量与安装命令。

不想装插件也可以直接看这份**独立建议列表**：[docs/DSH-插件建议列表.md](docs/DSH-插件建议列表.md) —— 4,483 个插件，带 23 个分类与「按需求挑」场景速查，由 `tools/report.mjs` 从真实索引生成。

---

## 关于「桌面版还是网页版」

**这是给 DSH 桌面版做的。** 桌面版本身就是这套 Cordis Web UI 的宿主——它内嵌的窗口加载的就是 `http://127.0.0.1:19387` 这个界面，profile 就是 `desktop`。所以「桌面版」和「Web UI」不是两套东西，侧边栏也是同一个侧边栏。

不是靠推测，`desktop` profile 自己的合成配置（`~/.dsh/profiles/desktop/cordis.yml`）里，浏览器端这些行都是挂载且未禁用的：

| 行 id | 包 | 作用 |
| --- | --- | --- |
| `modules` | `@deepseek-ai/dsh-client-modules` | 组装浏览器端插件模块图——**决定一个包的浏览器半边是否被发现** |
| `ui-sidebar` | `@deepseek-ai/dsh-client-ui-sidebar` | 声明 `sidebar.panellist`（侧边栏条目槽） |
| `ui-layout` | `@deepseek-ai/dsh-client-ui-layout` | 声明 `main`（主面板槽） |
| `ui-renderer` | `@deepseek-ai/dsh-client-ui-renderer` | 渲染槽位、把 `locale` 绑成 `props.t` |
| `locale` | `@deepseek-ai/dsh-client-locale` | 运行期文案 |
| `ui-plugin-manager` | `@deepseek-ai/dsh-client-ui-plugin-manager` | DSH 自带的 **Plugins** 页面 |

最后一行是关键对照：DSH 自带的 Plugins 页面注册用的就是 `sidebar.panellist` + `main` 这两个槽、同样的 `id === key` 约定，和本插件一样。它能在桌面版侧边栏出现，本插件就走在同一条路上。

桌面版里让新插件生效：**重新加载窗口（Ctrl+R）**，或重启 DSH。之后侧边栏底部应出现「插件发现」。

## 安装

> **本机状态：已安装。** 本包已经以 `link:` 方式装进 `desktop` profile
> （`~/.dsh/profiles/desktop/package.json` 的 `dsh.profile.bundles` 里已有 `dsh-plugin-finder`），
> 指向本目录。刷新页面即可看到侧边栏新条目；改动 Host 端代码需要重启 DSH 才生效。

### 方式一：GUI（推荐，无需授权）

1. 侧边栏打开 **Plugins** 页面 → **Add plugin**
2. 粘贴本包的绝对路径：
   ```
   C:\Users\53031\Desktop\dsh-one\dsh-plugin-finder
   ```
3. 确认安装，然后刷新页面（或重启 DSH）即可看到侧边栏新条目。

### 方式二：命令行

```powershell
& "C:\Users\53031\AppData\Local\Programs\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd" plugin --profile desktop add "C:\Users\53031\Desktop\dsh-one\dsh-plugin-finder"
```

> 命令行会写入 `~/.dsh/profiles/<profile>/`，在沙箱下需要一次授权。
> 也可以先启用 `plugin_manager` 工具，再用 `install_bundle` 安装。

### 卸载

在 Plugins 页面里删除，或：

```powershell
dsh plugin --profile desktop remove dsh-plugin-finder
```

---

## Agent 工具

工具名：`dsh_plugin_finder`

| 参数 | 说明 |
| --- | --- |
| `action` | `suggest`（默认，读缓存目录）· `search`（额外实时查 GitHub + npm）· `refresh`（重建索引）· `stats`（索引状态与错误）· `diagnose`（自检：本插件的 Host 行与浏览器半边到底有没有挂上） |
| `query` | 自由文本，匹配包名 / 仓库 / 描述 / 分类 / 关键词 |
| `category` | 限定一个目录分类：`ui` `tools` `memory` `theme` `session` `workflow` `model` `market` `notify` `vision` `skill` `security` `remote` `docs` `browser` `git` `dev` `usage` `fun` `wsl` `voice` `identity` `agi` |
| `tag` | 限定清单形态：`bundle`（带 cordis patch 的 bundle）· `ui`（带浏览器端）· `profile`（提供 agent preset） |
| `installable` | `true` 时只返回已发布到 npm、可按包名安装的插件 |
| `limit` | 返回条数，1–50，默认 15 |
| `offline` | `true` 时完全不联网，只用内置快照与磁盘缓存 |

典型调用：

```jsonc
{ "action": "suggest", "query": "记忆", "limit": 10 }
{ "action": "suggest", "category": "vision", "installable": true }
{ "action": "search",  "query": "task board" }       // 额外实时搜 GitHub/npm
{ "action": "refresh" }                               // 强制重建索引
{ "action": "stats" }
{ "action": "diagnose" }                              // 侧边栏没看到条目时先跑这个
```

`diagnose` 是给「界面上什么都没出现」这种情况准备的。它从正在运行的 Host 里直接问 `clientModules.clientPath('dsh-plugin-finder')` ——
只有这个包确实被编进 `window.__DSH_BOOT__` 时才会返回路径，其它情况会说清是哪一环断了：

```
profile: name=desktop dir=C:\Users\53031\.dsh\profiles\desktop
services: loader=present clientModules=present webServer=present profileContext=present tools=present
host row: dsh-plugin-finder state=2
browser half: composed, bundle at C:\...\dsh-plugin-finder\lib\client.js
boot graph: mentions this plugin at $.plugins[0].id
```

返回示例：

```
DSH plugin finder | action=suggest query="记忆"
index: 4392 plugins known, 2264 published to npm, catalog 2026-09-29 (4392 rows), built 2026-09-30T…
1. dsh-mnemon [bundle]
   repo: https://github.com/omdsh-dev/dsh-mnemon
   about: …
   423 stars | 37252 downloads/month | category: memory
   install: dsh plugin --profile desktop add dsh-mnemon
```

---

## 数据来源

索引由四个来源合并而成，按优先级：

| 来源 | 内容 | 成本 |
| --- | --- | --- |
| **社区精选目录** | [awesome-dsh-plugin.com/plugins.json](https://awesome-dsh-plugin.com/plugins.json)，4000+ 条，每条含 npm 包名、GitHub 仓库、分类、中英描述、星标、月下载量 | 1 次请求 |
| **GitHub 搜索** | `topic:dsh-plugin`、`topic:deepseek-harness`、`dsh-plugin in:name` 等 5 条检索，抓目录还没收录的新插件 | 5 次请求 |
| **npm registry** | 关键词检索 + 读取候选包的 `package.json`，只有它才知道 `dsh.bundle` / `dsh.client` 这些清单字段 | 若干次，无严格限流 |
| **内置快照** | 随包发布的 160 条精选（`data/seed.json`）与浏览器端 200 条快照 | 0，离线可用 |

合并规则：

- 以 **npm 包名**为主键；没有包名的条目退回 **owner/repo** 主键。同一 monorepo 下的多个包子包不会互相覆盖。
- 官方 `@deepseek-ai/*` 包被排除（它们是 DSH 自带的，不是「社区插件」）。
- 排序权重：`dsh.bundle.patch`（+50）> 浏览器端 `dsh.client`（+15）> 有 npm 包名（+12）> 人工精选权重 > 星标 / 月下载量 / 最近更新时间。已安装的会被降权并标注，避免重复推荐。
- 结果落盘到 `$DSH_HOME/plugin-finder/cache.json`，默认 12 小时过期。

---

## 配置

写在 profile 的 `cordis.patch.yml` 里（或在 Plugins 页面里改）：

```yaml
- id: plugin-finder
  name: dsh-plugin-finder
  config:
    enabled: true                # false = 只加载、不注册工具
    cacheTtlMinutes: 720         # 索引缓存时长
    cachePath: null              # 默认 $DSH_HOME/plugin-finder/cache.json
    catalogUrl: null             # 覆盖目录地址（可指向内网镜像）
    manifestLimit: 40            # 每次刷新为新包读取多少个 package.json
    repoLimit: 25                # 每次刷新为新仓库读取多少个 package.json
    githubTokenEnv: [GITHUB_TOKEN, GH_TOKEN]   # 只从环境变量读 token，不写进配置
```

**GitHub Token**：不配也能用（搜索接口未认证约 10 次/分钟、60 次/小时），配了之后限额大幅提高。Token 只从环境变量读取，不会写进配置文件。

---

## 开发与验证

```bash
# 一次跑完全部检查（离线三项）
pwsh -File tools/verify-all.ps1
# 再加上联网重建索引 + 重新生成建议列表文档
pwsh -File tools/verify-all.ps1 -Live

# 单独跑：
node tools/selfcheck.mjs      # 种子数据、排序、过滤、Markdown 渲染（离线）
node tools/preinstall.mjs     # 用假 Cordis context 跑一遍 Host 插件：导出、注册、四个 action
node tools/clientcheck.mjs    # 用假 module loader + 假 React 跑一遍浏览器端：注册、渲染、快照数据
node tools/livecheck.mjs "task board"   # 联网端到端：目录 + GitHub + npm
node tools/report.mjs         # 生成 ../DSH-插件建议列表.md

# 从在线目录重建 data/seed.json 与 lib/client.js（内联快照）
node tools/build-data.mjs
node tools/build-data.mjs --cached    # 复用 .build/catalog.json，不重新下载
```

编辑 `tools/curation.mjs` 里的 `CURATED` 可以调整人工推荐位；`weight` 越大排得越前（0–30，超过 30 按 30 计）。

### 已验证 / 未验证

**已在真实环境验证**：插件安装进 `desktop` profile 并通过 HMR 生效，`dsh_plugin_finder` 工具在会话中可调用——
`stats` 返回 4483 个插件（目录 4392 条 + 实时发现）、`suggest` 按分类和关键词返回正确结果、`search` 命中 GitHub 与 npm 的实时结果。

**已验证（结构层面）**：浏览器端 bundle 能在 module loader 契约下加载、以正确的包名注册、向 `sidebar.panellist` 与 `main` 两个 slot 注册且字段齐全、两个组件都能渲染出包含真实插件行的树。

**已验证（发现契约）**：`dsh-client-modules` 会**静默丢弃**一个浏览器端包——只要它没被 `dsh.profile.bundles` 选中、`dsh.client.platform` 不是 `web`、`exports["./client"]` 缺失或不是字符串、或 bundle patch 里没有对应行。这几条以及图标、locale 导出、patch 行名，都在**真实 profile 上逐条断言过**（`tools/clientcheck.mjs` 第 6 节）。这是最容易「什么都看不到」的失败模式。

另外，`dsh-client-modules` 在插件变化时会重新合成浏览器端图，**遇到失败是抛 `ClientPackageCompositionError` 直接中断**（`lib/index.js:544`），不是静默降级。安装本插件时那个进程既没崩、后续调用也都正常，说明合成没有报错。而「包被判为非 web」这种情况又被上面那组断言排除了。

**未验证（需要你在浏览器里确认）**：侧边栏里「插件发现」这一条是否显示、面板的视觉呈现与明暗主题下的观感——这台机器上没有浏览器控制能力，且 `http://127.0.0.1:19387` 对非浏览器请求返回 `401 dsh web authentication required`（URL 里的令牌只在浏览器里，我没去翻它）。`/plugins/<bundle>` 那条路只服务预先算好的精确 URL（带 sha1 修订号），猜不出来，所以也没法从外面把 bundle 抓下来验证。

**你可以自己拿到确定答案**：重启 DSH 后让 agent 调一次 `dsh_plugin_finder` 的 `diagnose`，它会直接告诉你浏览器半边有没有被编进 boot graph。刷新页面后如果侧边栏没出现条目，请打开开发者工具看 console 报错。

**已知行为**：本插件是以 `link:` 方式安装的，指向本目录。**改动 Host 端代码（`lib/*.js`）不会热更新**——DSH 的 HMR 只监视 profile 目录，Node 的 ESM 缓存也不会重新求值同一个 URL。改完 Host 代码需要重启 DSH 才生效；浏览器端（`lib/client.js`）刷新页面即可。


### 目录结构

```
dsh-plugin-finder/
├── package.json           # bundle 清单：dsh.bundle.patch + dsh.client
├── cordis.patch.yml       # 插入 plugin-finder 这一行
├── icon.svg               # Plugins 页面卡片图标
├── locale/{en,zh}.json    # 卡片标题与描述（{ meta: { title, description } }）
├── data/seed.json         # 随包发布的 160 条精选（构建产物）
├── lib/
│   ├── index.js           # Host 端：注册 dsh_plugin_finder 工具
│   ├── client.js          # 浏览器端（构建产物，含内联快照）
│   └── core/              # 引擎：http / catalog / sources / candidates / engine / format
├── src/client.js          # 浏览器端模板（快照注入点）
└── tools/                 # 构建与自检脚本
```

Host 端刻意 **不 import 任何 `@deepseek-ai/*` 包**：只依赖 `node:` 内置模块与全局 `fetch`，工具用原始 JSON Schema 注册（`ctx.tools.register({ parameters: <JSON Schema>, … })`）。这样模块求值不可能失败，插件行不会因为解析不到依赖而拖垮启动。注册本身也包在 try/catch 里——最坏情况是工具缺席并写日志，而不是整个 profile 起不来。

---

## 已知限制

- **只读，不代装。** 本插件只负责「找到」，不替你执行安装。安装走 Plugins 页面或 `dsh plugin add`。
- **列表 ≠ 审查。** 收录与描述来自社区目录，不代表安全背书。目录里的 `capabilities`（如 `fs-write`、`env`）是已知能力需求，看到就多想一眼。
- **分类与描述来自目录**，不是本插件自己判断的；npm 搜索到的、目录还没收录的新包没有分类。
- **未认证 GitHub 限额**下，一次 `refresh` 大约 5 次搜索请求；频繁刷新会触发限流，此时工具会原样报告 warning 而不是假装成功。
- **侧边栏页面直接读公开目录**（该接口带 `access-control-allow-origin: *`），不走 Host 代理，因此它不知道你「已安装了什么」；已安装标注只在 Agent 工具里提供。
- 浏览器端一次最多渲染 150 行，超出用「显示更多」翻页（目录有 4000+ 条）。

## 许可

MIT
