# DSH 插件建议列表

> 生成时间：2026-09-30T05:07:36.218Z　|　数据来源：已安装的插件在真实 DSH Host 里构建的索引（目录 + GitHub 搜索 + npm registry）
> 社区目录更新时间：2026-09-29（4392 条）　|　目录地址：https://awesome-dsh-plugin.com/plugins.json
> 本次收录：**4483** 个插件，其中 **2352** 个已发布到 npm，覆盖 **23** 个分类。

这份文档由 `dsh-plugin-finder` 插件生成，和它在 DSH 里看到的建议列表同源。每一条都给出 **npm 包名** 和 **GitHub 仓库地址**——这两个是装插件真正需要的东西。

---

## 一分钟结论

如果你只想装几个，按下面的顺序看。这些都是在社区目录里排在最前面的一批，全都能用一条命令装上：

| # | npm 包名 | GitHub 仓库 | 它做什么 | 社区信号 | 安装命令 |
| --- | --- | --- | --- | --- | --- |
| 1 | `dsh-plugin` | [dshplugin/dsh-plugin-hub](https://github.com/dshplugin/dsh-plugin-hub) | A community plugin marketplace for DeepSeek Harness, built to the official plugin spec — … | ★151 · v1.4.11 · MIT | `dsh plugin --profile desktop add dsh-plugin` |
| 2 | `dshmarket` | [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) | 在 DeepSeek Harness 设置页内浏览、搜索并安装社区插件，支持分类筛选、一键更新与停用，以及主题切换与配置备份。 | ★5021 · 452852/月 · v1.66.6 · MIT | `dsh plugin --profile desktop add dshmarket` |
| 3 | `@nanmicoder/dsh-agent-teams` | [NanmiCoder/dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams) | AgentTeams 多智能体团队。 | ★1852 · 56432/月 · v0.1.22 · MIT | `dsh plugin --profile desktop add @nanmicoder/dsh-agent-teams` |
| 4 | `dsh-context` | [bowenliang123/dsh-context](https://github.com/bowenliang123/dsh-context) | DSH 上下文洞察面板：Context 仪表盘 + /context命令 + Context 浏览器，查看 Context的分类组成、内容详情、演进趋势、压缩/注入事件、统计等一… | ★1580 · 114780/月 · v0.60.0 · Apache-2.0 | `dsh plugin --profile desktop add dsh-context` |
| 5 | `dsh-find-plugin` | [awesome-dsh-plugin/dsh-find-plugin](https://github.com/awesome-dsh-plugin/dsh-find-plugin) | 会话内直接找插件：按关键词/分类搜索本精选 registry，返回描述与可直接执行的安装命令。 | ★158 · 27424/月 · v0.4.0 · MIT | `dsh plugin --profile desktop add dsh-find-plugin` |
| 6 | `@linxin666/dsh-client-ui-git-graph` | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web) | 输入框上方提供 Git 分支选择器，并把分支泳道与提交历史画成图谱，沿着时间线找到任意变更。 | ★8188 · 156009/月 · v0.4.4 · Apache-2.0 | `dsh plugin --profile desktop add @linxin666/dsh-client-ui-git-graph` |
| 7 | `@linxin666/dsh-client-ui-task-board` | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web) | 侧边栏多列任务看板：卡片交给真实 DSH 智能体会话执行，支持 cron 定时（Host 侧到点执行，关浏览器也生效）。 | ★8188 · 172427/月 · v0.4.4 · Apache-2.0 | `dsh plugin --profile desktop add @linxin666/dsh-client-ui-task-board` |
| 8 | `@liustack/modlens` | [liustack/modlens](https://github.com/liustack/modlens) | 为纯文本模型架起视觉桥梁：粘贴图片，输出结构化 JSON 证据（OCR、版面、语义）。 | ★4076 · 86589/月 · v3.26.5 | `dsh plugin --profile desktop add @liustack/modlens` |
| 9 | `dsh-better-sidebar` | [omdsh-dev/dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | 侧边栏完整工作台：内置文件渲染编辑、终端、Git 与子代理，支持三方插件注册新 Tab。 | ★3903 · 261106/月 · v0.24.1 | `dsh plugin --profile desktop add dsh-better-sidebar` |
| 10 | `dsh-whale-widget` | [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) | 右下角常驻的小鲸鱼挂件：余额、今日已用与每轮对话消耗（含峰谷价），余额预警与今日预算的泡泡内容都可编辑；泡泡点击序列模块化自定义，支持并列加权 A/B、随机台词与随机图片；内置 … | ★3535 · 68518/月 · v0.3.17 · MIT | `dsh plugin --profile desktop add dsh-whale-widget` |
| 11 | `@deepseek-harness-tui/dsh-tui` | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | Claude Code 风格全屏终端 UI：像素鲸鱼顶栏、实时工作状态行、思考流式展开。 | ★3822 · 37137/月 · v0.12.0 · MIT | `dsh plugin --profile desktop add @deepseek-harness-tui/dsh-tui` |
| 12 | `@linxin666/dsh-client-ui-skill-explorer` | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web/tree/main/packages/dsh-skill-explorer) | 技能中心：按来源分级浏览已加载的全部 skill，启用/禁用模型调用、创建新技能、删除进可恢复回收站。 | ★8178 · 171221/月 · v0.4.4 | `dsh plugin --profile desktop add @linxin666/dsh-client-ui-skill-explorer` |

> `dsh-plugin-finder` 只负责「找到」，不代装。安装方式见文末「安装一个插件」。

## 数据从哪里来

| 来源 | 提供了什么 | 本次结果 |
| --- | --- | --- |
| [awesome-dsh-plugin.com](https://awesome-dsh-plugin.com/plugins.json) | 人工精选目录：npm 包名、GitHub 仓库、分类、中英描述、星标、月下载量、已知能力需求 | 4392 条 |
| GitHub 搜索 | `topic:dsh-plugin`、`topic:deepseek-harness`、名字/描述/README 命中「dsh plugin」的仓库——用来发现目录还没收录的新插件 | 131 个仓库 |
| npm registry | 关键词检索 + 读取候选包的 `package.json`（只有它知道 `dsh.bundle` / `dsh.client` 这些清单字段） | 230 个包，读取 56 份清单 |

合并与排序规则：以 **npm 包名**为主键，没有包名的条目退回 `owner/repo`（同一 monorepo 下的子包不会互相覆盖）；排除 DSH 自带的官方 `@deepseek-ai/*`；权重顺序为「声明了 `dsh.bundle.patch` 的 bundle / 目录精选条目」>「有浏览器端的 UI 插件」>「有 npm 包名」> 星标 / 月下载量 / 最近更新时间；已安装的会被降权并标注。

## 按需求挑（场景速查）

**先装一个插件市场**

- `dshmarket` — 在 DeepSeek Harness 设置页内浏览、搜索并安装社区插件，支持分类筛选、一键更新与停用，以及主题切换与配置备份。 　[仓库](https://github.com/dsh-market/dsh-market)　★5021 · 452852/月 · v1.66.6 · MIT
- `dsh-find-plugin` — 会话内直接找插件：按关键词/分类搜索本精选 registry，返回描述与可直接执行的安装命令。 　[仓库](https://github.com/awesome-dsh-plugin/dsh-find-plugin)　★158 · 27424/月 · v0.4.0 · MIT
- `@sanqi-normal/dsh-webui-market-plugin` — dsh Web GUI 内的社区插件市场：浏览 awesome-dsh-plugin.com 目录，从 设置 → 插件 → 插件市场 安装/卸载插件到 profile。 　[仓库](https://github.com/Sanqi-normal/dsh-webui-market-plugin)　★104 · 1566/月 · v0.5.5
- `dsh-skin-market` — 原生皮肤市场与生命周期管理器，发现社区皮肤、展示预览与兼容状态，并提供已验证的一键安装或手动安装入口。 　[仓库](https://github.com/kingOfSoySauce/dsh-skin-market)　★169 · 6418/月 · v0.1.56

**界面 / 侧边栏 / 交互增强**

- `@linxin666/dsh-client-ui-task-board` — 侧边栏多列任务看板：卡片交给真实 DSH 智能体会话执行，支持 cron 定时（Host 侧到点执行，关浏览器也生效）。 　[仓库](https://github.com/zhu1090093659/dsh-web)　★8188 · 172427/月 · v0.4.4 · Apache-2.0
- `dsh-better-sidebar` — 侧边栏完整工作台：内置文件渲染编辑、终端、Git 与子代理，支持三方插件注册新 Tab。 　[仓库](https://github.com/omdsh-dev/DSH-better-sidebar)　★3903 · 261106/月 · v0.24.1
- `dsh-whale-widget` — 右下角常驻的小鲸鱼挂件：余额、今日已用与每轮对话消耗（含峰谷价），余额预警与今日预算的泡泡内容都可编辑；泡泡点击序列模块化自定义，支持并列加权 A/B、随机台词与随机图片；内置 30+ 厂商模板（O… 　[仓库](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget)　★3535 · 68518/月 · v0.3.17 · MIT
- `@deepseek-harness-tui/dsh-tui` — Claude Code 风格全屏终端 UI：像素鲸鱼顶栏、实时工作状态行、思考流式展开。 　[仓库](https://github.com/ccch1mneyyy/dsh-TUI)　★3822 · 37137/月 · v0.12.0 · MIT

**省钱、看用量与账单**

- `dsh-context` — DSH 上下文洞察面板：Context 仪表盘 + /context命令 + Context 浏览器，查看 Context的分类组成、内容详情、演进趋势、压缩/注入事件、统计等一站式 Context… 　[仓库](https://github.com/bowenliang123/dsh-context)　★1580 · 114780/月 · v0.60.0 · Apache-2.0
- `dsh-cost-meter` — 会话与当日 API 费用统计、预算图框（已用%）、官方余额、历史看板，支持峰谷计价与官方价格一键同步。 　[仓库](https://github.com/Han-1413141/dsh-cost-meter)　★349 · 82799/月 · v1.7.46
- `dsh-damage-pulse` — 在 DSH Web 界面追踪 DeepSeek Token 用量、单次与会话费用及账户余额，并显示缓存感知的扣费动画。 　[仓库](https://github.com/wssfk12138/dsh-damage-pulse)　★224 · 3861/月 · v4.2.0
- `dsh-token-pet` — DSH 悬浮桌面用量小宠物：用 12 个正式状态动作反馈请求、工具、上下文压缩、归档和提示词增强，展示实时上下文占用、跨会话终身用量账本、服务商/模型统计、小时趋势与近 7/30 日视图；支持深色/… 　[仓库](https://github.com/Jimmy0123-ux/dsh-token-pet)　★56 · 2502/月 · v0.4.2

**跨会话记忆与长期上下文**

- `dsh-mnemon` — 由 Mnemon 驱动的 DeepSeek Harness（DSH）跨 Agent、本地优先的持久记忆插件。它可在支持 Mnemon 的 Agent 之间共享长期记忆，并提供运行时记忆、可检索项目档… 　[仓库](https://github.com/omdsh-dev/dsh-mnemon)　★423 · 37252/月 · v0.5.20
- `@openviking/dsh-memory-plugin` — 面向 DeepSeek Harness 的 OpenViking 记忆与上下文插件：pre-step 自动召回与画像注入、会话捕获、`viking://` URI 防护，以及对接 OpenVikin… 　[仓库](https://github.com/volcengine/OpenViking)　★39000 · 26475/月 · v0.5.11 · AGPL-3.0
- `dsh-deja` — 读取本机上其他三十三个编程智能体已经写下的会话文件——Claude Code、Codex、Cursor、VS Code Copilot Chat、opencode、OpenClaw、Hermes、K… 　[仓库](https://github.com/vshulcz/deja-vu/tree/main/extensions/dsh)　★1093 · 3111/月 · v0.21.4
- `@a9i5k4/dsh-auto-memory` — 主动联想记忆 + Astra 式上下文管理：自动唤回（固定边界注入，前缀缓存友好）/自动沉淀/技能固化/交接账本与 PLAN 白板跨窗口续命/水位感知（窗口自动适配当前模型）。本地 Markdown… 　[仓库](https://github.com/Aik358/dsh-auto-memory)　★88 · 12466/月 · v3.2.4

**多智能体、自动化与工作流**

- `@nanmicoder/dsh-agent-teams` — AgentTeams 多智能体团队。 　[仓库](https://github.com/NanmiCoder/dsh-agent-teams)　★1852 · 56432/月 · v0.1.22 · MIT
- `dsh-tongflow` — 基于 TongFlow 的“片场”插件，用于图片、配音、音乐与视频制作：agent 为每个资产生成 TongFlow 工作流文件（.tongflow.json）并通过 TongFlow 插件执行，内… 　[仓库](https://github.com/tong-io/tongflow/tree/main/packages/dsh-tongflow)　★1034 · 1427/月 · v0.8.3
- `@mstar-harness/dsh` — 技能驱动的 harness/loop 工程化工作流插件。 　[仓库](https://github.com/btspoony/mstar-harness/tree/main/packages/dsh)　★62 · 4907/月 · v3.11.2
- `@zseven-w/dsh-crew` — 从 Claude Code / Codex 派发任务给 DSH Agent：原生子代理进度、按能力分层预设的宿主内工作会话，以及为纯文本 Harness 提供视觉与图像生成的多模态桥。 　[仓库](https://github.com/ZSeven-W/dsh-crew)　★153 · 1758/月 · v0.1.0-rc.11

**视觉与多模态**

- `@liustack/modlens` — 为纯文本模型架起视觉桥梁：粘贴图片，输出结构化 JSON 证据（OCR、版面、语义）。 　[仓库](https://github.com/liustack/modlens)　★4076 · 86589/月 · v3.26.5
- `dsh-vision-router` — 为纯文本 Agent 提供视觉能力：内置免 Key 视觉链 + 像素级视觉工具（看图问答、定位、裁剪、像素对比、取色、OCR、矢量化、抠图、截图）；粘贴图片即可用。 　[仓库](https://github.com/ysr666/dsh-vision-router)　★1129 · 33633/月 · v2.2.8
- `@dickpy/dsh-imagegen` — 面向 DSH Web GUI 的 AI 生图插件：通过可配置的 OpenAI 兼容端点（gpt-image-2 / gpt-image-1 / dall-e-3）实现文生图与图生图，提供 api_u… 　[仓库](https://github.com/dickpy/dsh-imagegen)　★96 · 10553/月 · v1.6.6
- `picturereader` — 给纯文本模型的"读图"能力：图片降分辨率+降色深+结构/色彩指纹渲染成文本网格喂回对话，模型像多模态一样自主缩放、取样、OCR 读图；纯本地零外部模型依赖，附读图方法论 skill 与可选 Padd… 　[仓库](https://github.com/jing-hy/picturereader)　★37 · 1367/月 · v3.3.3

**接入别的模型或账号**

- `@opencode2dsh/dsh-plugin` — 将 OpenCode Zen 免费模型接入 DeepSeek Harness，无需 API Key。 　[仓库](https://github.com/FishBottle7/opencode2dsh/tree/master/packages/plugin)　★96 · 3290/月 · v0.3.3
- `dsh-agy-link` — 将 Google Antigravity (agy CLI) 接入 DSH：无 API Key 使用 Gemini/Claude/GPT-OSS 订阅模型，支持流式对话、原生工具卡片、思考轮次注记及… 　[仓库](https://github.com/amlyczz/dsh-agy-link)　★89 · 4731/月 · v0.4.40
- `dsh-connect-workbuddy` — 将本机登录的 WorkBuddy 模型接入 DSH，支持逐模型图片输入开关、账号切换，以及带每日签到的只读积分概览。 　[仓库](https://github.com/dingminhua/dsh-connect-workbuddy)　★48 · 6743/月 · v2.3.1
- `dsh-deepseek-web-login` — 新增 deepseek-web provider，把 chat.deepseek.com 网页端模型接入 DSH：浏览器登录抓取、PoW 请求签名、SSE 流式传输与基于提示词的工具调用。 　[仓库](https://github.com/cv-superding/dsh-deepseek-web-login)　★188 · 3493/月 · v0.6.6

**通知、手机远程访问**

- `@xmanrui/dsh-im` — 通过二维码或机器人凭据将 IM 机器人接入 DeepSeek Harness（支持飞书、微信、钉钉、企业微信、QQ、Slack、Telegram、Discord 和 WhatsApp 共 9 种渠道… 　[仓库](https://github.com/xmanrui/dsh-im)　★1552 · 51521/月 · v4.32.0 · MIT
- `dsh-pocket` — 手机远程访问 DSH Web 界面：扫码即用局域网或公网（cloudflared 隧道）访问，实时同屏、移动端适配布局，带设置页管理。 　[仓库](https://github.com/shaobeichen/dsh-pocket)　★1415 · 15377/月 · v2.10.6
- `dsh-notifier` — DSH 通知与远程操作控制面：一个 `notify()` API 接入 28 个出站渠道，六条入站控制通道承载手机审批、提问与任务控制；提供 DSH 原生「通知与控制」UI、出站热生效、多 agen… 　[仓库](https://github.com/THEWOLFWALKER/dsh-notifier)　★55 · 4752/月 · v0.13.1
- `dsh-lark-bot` — 把 DeepSeek Harness 装进飞书的桥接插件：扫码绑定 PersonalAgent、流式卡片、git worktree 项目工作区、scope 并行任务、多角色 Agent、跨会话通知、… 　[仓库](https://github.com/PlutoKeating/dsh-lark-bot)　★41 · 2151/月 · v0.19.16

**换主题换皮肤**

- `dsh-dream-skin` — 一键换肤插件：8 套原创主题、背景壁纸（透明度/模糊）、强调色、主题包导入/导出+分享链接、收藏与随机，纯原生 token 系统接入。 　[仓库](https://github.com/RevolutionLA/dsh-dream-skin)　★195 · 26603/月 · v9.29.0
- `@nonamelego/dsh-catppuccin` — DSH Web GUI 的 Catppuccin 主题插件：Latte、Frappé、Macchiato、Mocha 四套主题接入原生主题系统，一键切换并记住选择；另附可开关的玻璃质感皮肤，顶栏、侧… 　[仓库](https://github.com/NoNameLeGo/dsh-catppuccin-theme)　★49 · 9806/月 · v0.5.8
- `@smalltailqwq/dsh-client-ui-skin-maid-atelier` — DSH Web 鲸鱼娘皮肤系列（深海女仆工坊 maid-atelier）。 　[仓库](https://github.com/Small-tailqwq/dsh-deep-whale/tree/main/maid-atelier)　★2288 · 11831/月 · v0.1.6
- `beauticode-dsh` — 为 DSH Web 设置本地图片与 MP4 视频背景：侧栏「背景」面板、可保存主题（含内置「画窗」）、声音开关、恢复上次背景，以及 /bg、/bg-theme、/bg-clear 命令。 　[仓库](https://github.com/starsstreaming/beautiCode/tree/main/integrations/deepseek-harness)　★83 · 7916/月 · v1.0.26

**安全、权限与审计**

- `@nanmicoder/dsh-auto-mode` — 在 Workspace Write 与 Full access 之间增加 Auto 权限档：日常操作留在官方 workspace-write 沙箱内，由当前会话模型复核升权与破坏性调用，精确的越界访… 　[仓库](https://github.com/NanmiCoder/dsh-auto-mode)　★164 · 3377/月 · v0.2.0
- `dsh-approval-gate` — DeepSeek Harness 自动审批门控：Flash 预判写入/命令是否不可回补，安全操作自动批准、危险操作转人工（fail-safe）。另含文件改动对比（unified diff）与一键撤销… 　[仓库](https://github.com/moon09300731/dsh-approval-gate)　★82 · 5228/月 · v0.5.0
- `dsh-auto-review` — 审批链上的第二模型自动审查：只读审查子代理返回带理由的 allow/deny 结构化裁决，默认 fail-closed。 　[仓库](https://github.com/PerryLink/dsh-auto-review)　★218 · 5737/月 · v0.12.10
- `dsh-passwords` — 让 DeepSeek Harness 变成服务器级多租户平台：远程访问 + 自动 HTTPS、子用户权限与配额、沙盒强制、加密认证与审计日志。 　[仓库](https://github.com/slywalker2006/dsh-passwords)　★66 · 4981/月 · v2.7.6

**技能包（Skills）**

- `@linxin666/dsh-client-ui-skill-explorer` — 技能中心：按来源分级浏览已加载的全部 skill，启用/禁用模型调用、创建新技能、删除进可恢复回收站。 　[仓库](https://github.com/zhu1090093659/dsh-web/tree/main/packages/dsh-skill-explorer)　★8178 · 171221/月 · v0.4.4
- `dsh-plugin-guide` — DSH 插件开发知识库，作为按需加载的 agent 技能随 bundle 安装：官方约束、任务工作流、API 参考与社区踩坑，写插件时让 DSH 自己查。 　[仓库](https://github.com/PerryLink/dsh-plugin-guide)　★43 · 5209/月 · v0.3.19 · Apache-2.0
- `@dhicoc/dsh-reverse-skill` — 完整 reverse-skill（85 个 SKILL.md）的 DeepSeek Harness 插件：逆向工程、授权渗透测试与安全研究的技能路由包。 　[仓库](https://github.com/dhicoc/dsh-reverse-skill)　★177 · 3529/月 · v1.0.5
- `@michengai/dsh-agency-agents` — 增加可召唤的领域专家名单，专家以子代理运行，主会话保留任务和最终答复。 　[仓库](https://github.com/MichengAI/dsh-agency-agents)　★74 · 141209/月 · v1.0.7

**浏览器与网页能力**

- `@liustack/modsearch` — 纯文本 agent 的联网搜索桥：搜索网页与 X，返回结构化 JSON 证据（search/fetch/引用）。 　[仓库](https://github.com/liustack/modsearch)　★572 · 38517/月 · v5.10.5
- `@wxg-prc-cpg/browser-skill-dsh-plugin` — BrowserSkill 的 DeepSeek Harness 浏览器自动化桥接插件，通过原生浏览器工具控制可见的 Chrome 和 Edge Agent Window，支持可访问性与 VOM 页面… 　[仓库](https://github.com/Tencent/BrowserSkill)　★7919 · 17098/月 · v0.3.2 · MIT
- `dsh-builtin-browser` — 共享真实浏览器：用户可观看并随时接管的原生 Electron 窗口，agent 通过 CDP 驱动，内置 20 个 browser_* 工具（打开/快照/执行/填表/截图/下载/登录态）；任务级会话… 　[仓库](https://github.com/wqty123/dsh-browser)　★84 · 12575/月 · v0.1.22
- `dsh-free-search` — DSH 免费搜索插件：7 个引擎（DuckDuckGo/Bing/SearXNG 免费 + Exa/Perplexity/DeepSeek 付费）、自动回退、设置页 UI（API key 输入 + … 　[仓库](https://github.com/DDDMUC/dsh-free-search)　★281 · 24518/月 · v0.6.5

**Git 与代码评审**

- `@linxin666/dsh-client-ui-git-graph` — 输入框上方提供 Git 分支选择器，并把分支泳道与提交历史画成图谱，沿着时间线找到任意变更。 　[仓库](https://github.com/zhu1090093659/dsh-web)　★8188 · 156009/月 · v0.4.4 · Apache-2.0
- `@cerbur/clutch-dsh-worktree` — 为 DSH Web UI 增加按 Git Worktree 组织 Session 的视角，同时继续由 DSH 管理原始 Project 和 Session 数据。 　[仓库](https://github.com/Cerbur/clutch-dsh/tree/main/packages/clutch-dsh-worktree)　★30 · 1821/月 · v0.1.15
- `dsh-git-worktree` — Git Worktree Session Target：任务在隔离 Session 中运行，支持 Ready for Review、可撤回的 Local Preview、人工确认交付、环境保留与恢复… 　[仓库](https://github.com/wloops/dsh-git-worktree)　★15 · 2702/月 · v0.9.3
- `dsh-user-experience` — 帮你发现项目中可能存在的用户体验问题：自动走查 React/TypeScript 源码，定位问题并给出具体优化建议。 　[仓库](https://github.com/DietCokewithSugar/dsh-user-experience)　★20 · 702/月 · v0.4.2

**文档、表格与渲染**

- `dsh-univer-office` — 为 DeepSeek Harness 打造一个真正的办公环境。Univer Office 插件将电子表格、文档、幻灯片、画布、多维表格等汇聚到同一个运行时——数据互联、修改经过校验、变更按版本管理，… 　[仓库](https://github.com/dream-num/dsh-univer-office)　★442 · 64692/月 · v0.3.5
- `@tt-a1i/archify-dsh` — 从仓库或系统描述生成经过校验的自包含交互式架构图、流程图、时序图、数据流图和生命周期图。 　[仓库](https://github.com/tt-a1i/archify)　★74418 · 17842/月 · v0.1.0 · MIT
- `dsh-industry-research` — 面向 DeepSeek Harness 的确定性行业研究报告：公司与行业研究流程基于分阶段证据产出结构化、可核验的报告。 　[仓库](https://github.com/PerryLink/dsh-industry-research)　★186 · 3718/月 · v0.3.15
- `dsh-office-tools` — 面向 agent 的工作区安全 Office 工具集：创建/读取 Word、创建/读取/更新 Excel、创建/读取 PowerPoint，并支持 PNG/JPG/GIF 图片排版。 　[仓库](https://github.com/kw78/dsh-office-tools)　★26 · 9382/月 · v1.0.4

**开发与运行时调试**

- `@michengai/dsh-skills-manager` — 在设置里管理本地 DSH 技能，并只读查看公共 Agent 技能。 　[仓库](https://github.com/MichengAI/dsh-skills-manager)　★79 · 138017/月 · v1.1.7
- `@tnnevol/dsh-fnos` — 把 DeepSeek Harness 接进飞牛 fnOS：DSH 界面跑在 fnOS 应用框架里时通过 fnOS 浏览器 SDK 工作——DSH 设为跟随系统时读取并跟随 NAS 主题，在设置里列出… 　[仓库](https://github.com/tnnevol/fn-os-apps/tree/main/plugins/dsh-fnos-plugin)　★47 · 10304/月 · v0.1.1-rc.2.0
- `dsh-mcp-panel` — 官方 MCP 客户端（dsh-mcp-client）的只读运行时管理面板：/mcp 命令与设置页 MCP 页签展示连接状态、已注册工具、错误与重连计数，脱敏展示并提供启停 patch 建议。 　[仓库](https://github.com/PerryLink/dsh-mcp-panel)　★69 · 9086/月 · v0.6.19
- `dsh-skill-mcp-panel` — 在 DSH Web 设置中管理技能与 MCP 服务器：技能卡片热启停、工作区作用域、分组、批量迁移与拖拽导入，以及 stdio/HTTP MCP 增删改查、连接测试、密钥脱敏，并附带统一 dsh-p… 　[仓库](https://github.com/Fishquito7/dsh-skill-mcp-panel)　★158 · 1795/月 · v2.1.3

**纯娱乐**

- `dsh-emoji` — 为 AI 回复自动添加表情。 　[仓库](https://github.com/hellodigua/dsh-emoji)　★45 · 1946/月 · v0.3.6
- `dsh-meme` — 聊天表情包：纯文本斗图、情绪主动发图、像 QQ/微信 一样发图、AI 自动学图、自定义表情包。 　[仓库](https://github.com/yyh-001/dsh-meme)　★115 · 4320/月 · v0.1.44
- `dsh-pet` — DSH Web UI 桌面宠物：25 个透明动画、屏幕漫游、点击反应与拖拽，附可复现的素材生成链。 　[仓库](https://github.com/PC2005-cloud/dsh-pet)　★883 · 23049/月 · v0.3.0
- `whale-girl` — 桌面宠物（QQ 宠物形态）：右下角悬浮、可拖拽/投喂/玩耍。 　[仓库](https://github.com/vlln/whale-girl)　★340 · 1946/月 · v0.1.0

## 推荐清单（前 50）

| # | npm 包名 | GitHub 仓库 | 分类 | 说明 | 形态 | 社区信号 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `dsh-plugin` | [dshplugin/dsh-plugin-hub](https://github.com/dshplugin/dsh-plugin-hub) | — | A community plugin marketplace for DeepSeek Harness, built to the official plugin spec — browse, se… | bundle, ui | ★151 · v1.4.11 · MIT |
| 2 | `dshmarket` | [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) | 插件市场与管理 | 在 DeepSeek Harness 设置页内浏览、搜索并安装社区插件，支持分类筛选、一键更新与停用，以及主题切换与配置备份。 | 目录收录 | ★5021 · 452852/月 · v1.66.6 · MIT |
| 3 | `@nanmicoder/dsh-agent-teams` | [NanmiCoder/dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams) | 工作流与自动化 | AgentTeams 多智能体团队。 | 目录收录 | ★1852 · 56432/月 · v0.1.22 · MIT |
| 4 | `dsh-context` | [bowenliang123/dsh-context](https://github.com/bowenliang123/dsh-context) | 用量与计费 | DSH 上下文洞察面板：Context 仪表盘 + /context命令 + Context 浏览器，查看 Context的分类组成、内容详情、演进趋势、压缩/注入事件、统计等一站式 Context… | 目录收录 | ★1580 · 114780/月 · v0.60.0 · Apache-2.0 |
| 5 | `dsh-find-plugin` | [awesome-dsh-plugin/dsh-find-plugin](https://github.com/awesome-dsh-plugin/dsh-find-plugin) | 插件市场与管理 | 会话内直接找插件：按关键词/分类搜索本精选 registry，返回描述与可直接执行的安装命令。 | 目录收录 | ★158 · 27424/月 · v0.4.0 · MIT |
| 6 | `@linxin666/dsh-client-ui-git-graph` | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web) | Git 与代码评审 | 输入框上方提供 Git 分支选择器，并把分支泳道与提交历史画成图谱，沿着时间线找到任意变更。 | 目录收录 | ★8188 · 156009/月 · v0.4.4 · Apache-2.0 |
| 7 | `@linxin666/dsh-client-ui-task-board` | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web) | UI 增强 | 侧边栏多列任务看板：卡片交给真实 DSH 智能体会话执行，支持 cron 定时（Host 侧到点执行，关浏览器也生效）。 | 目录收录 | ★8188 · 172427/月 · v0.4.4 · Apache-2.0 |
| 8 | `@liustack/modlens` | [liustack/modlens](https://github.com/liustack/modlens) | 视觉与多模态 | 为纯文本模型架起视觉桥梁：粘贴图片，输出结构化 JSON 证据（OCR、版面、语义）。 | 目录收录 | ★4076 · 86589/月 · v3.26.5 |
| 9 | `dsh-better-sidebar` | [omdsh-dev/dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | UI 增强 | 侧边栏完整工作台：内置文件渲染编辑、终端、Git 与子代理，支持三方插件注册新 Tab。 | 目录收录 | ★3903 · 261106/月 · v0.24.1 |
| 10 | `dsh-whale-widget` | [MeteorNOX/DeepSeek-Balance-Whale-Widget](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget) | UI 增强 | 右下角常驻的小鲸鱼挂件：余额、今日已用与每轮对话消耗（含峰谷价），余额预警与今日预算的泡泡内容都可编辑；泡泡点击序列模块化自定义，支持并列加权 A/B、随机台词与随机图片；内置 30+ 厂商模板（O… | 目录收录 | ★3535 · 68518/月 · v0.3.17 · MIT |
| 11 | `@deepseek-harness-tui/dsh-tui` | [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | UI 增强 | Claude Code 风格全屏终端 UI：像素鲸鱼顶栏、实时工作状态行、思考流式展开。 | 目录收录 | ★3822 · 37137/月 · v0.12.0 · MIT |
| 12 | `@linxin666/dsh-client-ui-skill-explorer` | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web/tree/main/packages/dsh-skill-explorer) | 技能包 | 技能中心：按来源分级浏览已加载的全部 skill，启用/禁用模型调用、创建新技能、删除进可恢复回收站。 | 目录收录 | ★8178 · 171221/月 · v0.4.4 |
| 13 | `@linxin666/dsh-ssh` | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web/tree/main/packages/dsh-ssh) | 远程与移动端 | SSH 远程运维面板：Web 终端、SFTP 传输、本地端口转发与一条命令并发集群执行，Agent 与面板共用同一份主机配置。 | 目录收录 | ★8178 · 138783/月 · v0.4.4 |
| 14 | `@michengai/dsh-codex-ui` | [MichengAI/dsh-codex-ui](https://github.com/MichengAI/dsh-codex-ui) | UI 增强 | 为 DeepSeek Harness 网页端重构 Codex 风格侧栏、工作区会话树、全局搜索和轮次导航。 | 目录收录 | ★102 · 172593/月 · v1.1.25 |
| 15 | `@xmanrui/dsh-im` | [xmanrui/dsh-im](https://github.com/xmanrui/dsh-im) | 通知与集成 | 通过二维码或机器人凭据将 IM 机器人接入 DeepSeek Harness（支持飞书、微信、钉钉、企业微信、QQ、Slack、Telegram、Discord 和 WhatsApp 共 9 种渠道… | 目录收录 | ★1552 · 51521/月 · v4.32.0 · MIT |
| 16 | `billion-context` | [ranxianglei/billion-context](https://github.com/ranxianglei/billion-context) | 会话与消息 | billion-context官方版：上下文压缩插件，兼顾小窗口(100k上下文足矣)省token(省5倍token)和超长会话(数月级别几十亿token单会话)。 | 目录收录 | ★384 · 322108/月 · v0.1.174 |
| 17 | `dsh-pocket` | [shaobeichen/dsh-pocket](https://github.com/shaobeichen/dsh-pocket) | 通知与集成 | 手机远程访问 DSH Web 界面：扫码即用局域网或公网（cloudflared 隧道）访问，实时同屏、移动端适配布局，带设置页管理。 | 目录收录 | ★1415 · 15377/月 · v2.10.6 |
| 18 | `dsh-univer-office` | [dream-num/dsh-univer-office](https://github.com/dream-num/dsh-univer-office) | 文档与渲染 | 为 DeepSeek Harness 打造一个真正的办公环境。Univer Office 插件将电子表格、文档、幻灯片、画布、多维表格等汇聚到同一个运行时——数据互联、修改经过校验、变更按版本管理，… | 目录收录 | ★442 · 64692/月 · v0.3.5 |
| 19 | `@liustack/modsearch` | [liustack/modsearch](https://github.com/liustack/modsearch) | 浏览器与网页 | 纯文本 agent 的联网搜索桥：搜索网页与 X，返回结构化 JSON 证据（search/fetch/引用）。 | 目录收录 | ★572 · 38517/月 · v5.10.5 |
| 20 | `dsh-dream-skin` | [RevolutionLA/dsh-dream-skin](https://github.com/RevolutionLA/dsh-dream-skin) | 主题与外观 | 一键换肤插件：8 套原创主题、背景壁纸（透明度/模糊）、强调色、主题包导入/导出+分享链接、收藏与随机，纯原生 token 系统接入。 | 目录收录 | ★195 · 26603/月 · v9.29.0 |
| 21 | `dsh-mnemon` | [omdsh-dev/dsh-mnemon](https://github.com/omdsh-dev/dsh-mnemon) | 记忆 | 由 Mnemon 驱动的 DeepSeek Harness（DSH）跨 Agent、本地优先的持久记忆插件。它可在支持 Mnemon 的 Agent 之间共享长期记忆，并提供运行时记忆、可检索项目档… | 目录收录 | ★423 · 37252/月 · v0.5.20 |
| 22 | `@noob-stupid/dsh-plugin-console` | [Noob-stupid/dsh-plugin-gating-hub](https://github.com/Noob-stupid/dsh-plugin-gating-hub) | 工具与能力 | DSH 框架升级安全与插件升级门控：升级前跑「会话格式契约预检」（把不兼容的插件与 agent 预设扫出来先适配）、升级失败自动回滚、把拖垮过启动的插件自动隔离；另有环境指纹与公开契约规则库持续守门… | 目录收录 | ★93 · 15444/月 · v0.5.32 · MIT |
| 23 | `@openviking/dsh-memory-plugin` | [volcengine/OpenViking](https://github.com/volcengine/OpenViking) | 记忆 | 面向 DeepSeek Harness 的 OpenViking 记忆与上下文插件：pre-step 自动召回与画像注入、会话捕获、`viking://` URI 防护，以及对接 OpenVikin… | 目录收录 | ★39000 · 26475/月 · v0.5.11 · AGPL-3.0 |
| 24 | `@tt-a1i/archify-dsh` | [tt-a1i/archify](https://github.com/tt-a1i/archify) | 文档与渲染 | 从仓库或系统描述生成经过校验的自包含交互式架构图、流程图、时序图、数据流图和生命周期图。 | 目录收录 | ★74418 · 17842/月 · v0.1.0 · MIT |
| 25 | `@wxg-prc-cpg/browser-skill-dsh-plugin` | [Tencent/BrowserSkill](https://github.com/Tencent/BrowserSkill) | 浏览器与网页 | BrowserSkill 的 DeepSeek Harness 浏览器自动化桥接插件，通过原生浏览器工具控制可见的 Chrome 和 Edge Agent Window，支持可访问性与 VOM 页面… | 目录收录 | ★7919 · 17098/月 · v0.3.2 · MIT |
| 26 | `dsh-plugin-guide` | [PerryLink/dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide) | 技能包 | DSH 插件开发知识库，作为按需加载的 agent 技能随 bundle 安装：官方约束、任务工作流、API 参考与社区踩坑，写插件时让 DSH 自己查。 | 目录收录 | ★43 · 5209/月 · v0.3.19 · Apache-2.0 |
| 27 | `dsh-deja` | [vshulcz/deja-vu](https://github.com/vshulcz/deja-vu/tree/main/extensions/dsh) | 记忆 | 读取本机上其他三十三个编程智能体已经写下的会话文件——Claude Code、Codex、Cursor、VS Code Copilot Chat、opencode、OpenClaw、Hermes、K… | 目录收录 | ★1093 · 3111/月 · v0.21.4 |
| 28 | `dsh-tongflow` | [tong-io/tongflow](https://github.com/tong-io/tongflow/tree/main/packages/dsh-tongflow) | 工作流与自动化 | 基于 TongFlow 的“片场”插件，用于图片、配音、音乐与视频制作：agent 为每个资产生成 TongFlow 工作流文件（.tongflow.json）并通过 TongFlow 插件执行，内… | 目录收录 | ★1034 · 1427/月 · v0.8.3 |
| 29 | `@cloudbase/dsh-plugin` | [tencentcloudbase/cloudbase-ai-toolkit](https://github.com/TencentCloudBase/CloudBase-AI-Toolkit/tree/main/dsh-plugin) | 工具与能力 | 把腾讯云 CloudBase 后端接入 DeepSeek Harness——在对话里搭好并部署全栈应用，查询结果渲染为表格卡片（分页、排序、导出 CSV），部署后可预览真实域名，并提供 CloudB… | 目录收录 | ★1128 · 915/月 · v0.2.0 |
| 30 | `dsh-cost-meter` | [Han-1413141/dsh-cost-meter](https://github.com/Han-1413141/dsh-cost-meter) | 用量与计费 | 会话与当日 API 费用统计、预算图框（已用%）、官方余额、历史看板，支持峰谷计价与官方价格一键同步。 | 目录收录 | ★349 · 82799/月 · v1.7.46 |
| 31 | `dsh-vision-router` | [ysr666/dsh-vision-router](https://github.com/ysr666/dsh-vision-router) | 视觉与多模态 | 为纯文本 Agent 提供视觉能力：内置免 Key 视觉链 + 像素级视觉工具（看图问答、定位、裁剪、像素对比、取色、OCR、矢量化、抠图、截图）；粘贴图片即可用。 | 目录收录 | ★1129 · 33633/月 · v2.2.8 |
| 32 | `dsh-plugins-store` | [ZASENJC/dsh-plugins-store](https://github.com/ZASENJC/dsh-plugins-store) | — | Native DSH browser integration for the DSH Plugin Store | bundle, ui | ★69 · v0.1.3 · MIT |
| 33 | `@a9i5k4/dsh-auto-memory` | [aik358/dsh-auto-memory](https://github.com/Aik358/dsh-auto-memory) | 记忆 | 主动联想记忆 + Astra 式上下文管理：自动唤回（固定边界注入，前缀缓存友好）/自动沉淀/技能固化/交接账本与 PLAN 白板跨窗口续命/水位感知（窗口自动适配当前模型）。本地 Markdown… | 目录收录 | ★88 · 12466/月 · v3.2.4 |
| 34 | `@anionex/dsh-computer-use` | [anionex/dsh-computer-use](https://github.com/Anionex/dsh-computer-use) | 工具与能力 | macOS 电脑控制：Accessibility 观测、过期状态拒绝、作用域权限与安全输入。 | 目录收录 | ★46 · 3163/月 · v0.3.2 |
| 35 | `@anionex/dsh-turn-rewind` | [anionex/dsh-turn-rewind](https://github.com/Anionex/dsh-turn-rewind) | 会话与消息 | 对话回退：基于持久 Change Ledger 回滚会话与工作区状态。 | 目录收录 | ★122 · 7207/月 · v0.3.8 |
| 36 | `@changfenhuang/dsh-annotation` | [omdsh-dev/dsh-annotation](https://github.com/omdsh-dev/dsh-annotation) | UI 增强 | 选中文字→批注→随消息发送，回复按批注逐条对照。 | 目录收录 | ★132 · 2950/月 · v1.4.10 |
| 37 | `@changfenhuang/dsh-genui` | [omdsh-dev/dsh-genui](https://github.com/omdsh-dev/dsh-genui) | UI 增强 | 助手回复内渲染交互式 UI 组件：布局、图表、表单、测验、mermaid、3D 场景与回传事件循环。 | 目录收录 | ★495 · 26766/月 · v0.11.3 |
| 38 | `@dhicoc/dsh-reverse-skill` | [dhicoc/dsh-reverse-skill](https://github.com/dhicoc/dsh-reverse-skill) | 技能包 | 完整 reverse-skill（85 个 SKILL.md）的 DeepSeek Harness 插件：逆向工程、授权渗透测试与安全研究的技能路由包。 | 目录收录 | ★177 · 3529/月 · v1.0.5 |
| 39 | `@dickpy/dsh-imagegen` | [dickpy/dsh-imagegen](https://github.com/dickpy/dsh-imagegen) | 视觉与多模态 | 面向 DSH Web GUI 的 AI 生图插件：通过可配置的 OpenAI 兼容端点（gpt-image-2 / gpt-image-1 / dall-e-3）实现文生图与图生图，提供 api_u… | 目录收录 | ★96 · 10553/月 · v1.6.6 |
| 40 | `@furongjun1999/dsh-memory` | [FuRongJun-1999/dsh-memory](https://github.com/FuRongJun-1999/dsh-memory) | AGI 架构探索 | 白箱AGI架构探索：元认知（自我认知循环）、持续学习（知识飞轮）、世界模型（条件空间+语义时空图）、自我改进（自举纪律）、零LLM白箱管线与可审计信任护栏。 | 目录收录 | ★286 · 18724/月 · v0.6.0 |
| 41 | `@huiliyi37/dsh-tianshu-tui` | [huiliyi37/dsh-tianshu-tui](https://github.com/huiliyi37/dsh-tianshu-tui) | UI 增强 | DeepSeek Harness 的终端 UI（TUI）。 | 目录收录 | ★284 · 2226/月 · v1.0.0-rc.1 |
| 42 | `@linxin666/dsh-remote-web-ui` | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web/tree/main/packages/dsh-remote-web-ui) | 远程与移动端 | 手机/PC 远程操控 dsh web 工作区：扫码配对、令牌门控通道、SSE 实时同步，提供移动端与完整桌面 GUI 两种远程形态。 | 目录收录 | ★8178 · 169702/月 · v0.4.4 |
| 43 | `@linxin666/dsh-web-all` | [zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web/tree/main/packages/dsh-web-all) | UI 增强 | DSH Web UI 插件与皮肤合集：任务看板、git 图、右侧面板、远程移动端 UI、桌宠、实时 token 统计与皮肤中心。 | 目录收录 | ★8178 · 127478/月 · v0.4.4 |
| 44 | `@michengai/dsh-agency-agents` | [michengai/dsh-agency-agents](https://github.com/MichengAI/dsh-agency-agents) | 技能包 | 增加可召唤的领域专家名单，专家以子代理运行，主会话保留任务和最终答复。 | 目录收录 | ★74 · 141209/月 · v1.0.7 |
| 45 | `@michengai/dsh-archive-manager` | [MichengAI/dsh-archive-manager](https://github.com/MichengAI/dsh-archive-manager) | 会话与消息 | 在设置里增加已归档会话页，可按工作区搜索、恢复和删除已归档会话。 | 目录收录 | ★88 · 167240/月 · v1.0.9 |
| 46 | `@michengai/dsh-skills-manager` | [MichengAI/dsh-skills-manager](https://github.com/MichengAI/dsh-skills-manager) | 开发与运行时 | 在设置里管理本地 DSH 技能，并只读查看公共 Agent 技能。 | 目录收录 | ★79 · 138017/月 · v1.1.7 |
| 47 | `@modusensus/dsh-mneme` | [slow-stack/mneme](https://github.com/slow-stack/mneme/tree/main/dsh-mneme) | 记忆 | 会做梦的记忆 — DeepSeek Harness 跨会话记忆插件：跨会话记住你与项目、深夜 autoDream 自动巩固记忆、冲突记忆先冻结待你裁决、全程可回放审计。默认离线：SQLite 配人工… | 目录收录 | ★132 · 11375/月 · v0.8.10 |
| 48 | `@mstar-harness/dsh` | [btspoony/mstar-harness](https://github.com/btspoony/mstar-harness/tree/main/packages/dsh) | 工作流与自动化 | 技能驱动的 harness/loop 工程化工作流插件。 | 目录收录 | ★62 · 4907/月 · v3.11.2 |
| 49 | `@nanmicoder/dsh-auto-mode` | [nanmicoder/dsh-auto-mode](https://github.com/NanmiCoder/dsh-auto-mode) | 安全与权限 | 在 Workspace Write 与 Full access 之间增加 Auto 权限档：日常操作留在官方 workspace-write 沙箱内，由当前会话模型复核升权与破坏性调用，精确的越界访… | 目录收录 | ★164 · 3377/月 · v0.2.0 |
| 50 | `@nonamelego/dsh-catppuccin` | [NoNameLeGo/dsh-catppuccin-theme](https://github.com/NoNameLeGo/dsh-catppuccin-theme) | 主题与外观 | DSH Web GUI 的 Catppuccin 主题插件：Latte、Frappé、Macchiato、Mocha 四套主题接入原生主题系统，一键切换并记住选择；另附可开关的玻璃质感皮肤，顶栏、侧… | 目录收录 | ★49 · 9806/月 · v0.5.8 |

## 分类精选

### UI 增强　<sub>752 个</sub>

- `@linxin666/dsh-client-ui-task-board` — 侧边栏多列任务看板：卡片交给真实 DSH 智能体会话执行，支持 cron 定时（Host 侧到点执行，关浏览器也生效）。 　[仓库](https://github.com/zhu1090093659/dsh-web)　★8188 · 172427/月 · v0.4.4 · Apache-2.0
- `dsh-better-sidebar` — 侧边栏完整工作台：内置文件渲染编辑、终端、Git 与子代理，支持三方插件注册新 Tab。 　[仓库](https://github.com/omdsh-dev/DSH-better-sidebar)　★3903 · 261106/月 · v0.24.1
- `dsh-whale-widget` — 右下角常驻的小鲸鱼挂件：余额、今日已用与每轮对话消耗（含峰谷价），余额预警与今日预算的泡泡内容都可编辑；泡泡点击序列模块化自定义，支持并列加权 A/B、随机台词与随机图片；内置 30+ 厂商模板（OpenAI / Op… 　[仓库](https://github.com/MeteorNOX/DeepSeek-Balance-Whale-Widget)　★3535 · 68518/月 · v0.3.17 · MIT
- `@deepseek-harness-tui/dsh-tui` — Claude Code 风格全屏终端 UI：像素鲸鱼顶栏、实时工作状态行、思考流式展开。 　[仓库](https://github.com/ccch1mneyyy/dsh-TUI)　★3822 · 37137/月 · v0.12.0 · MIT
- `@michengai/dsh-codex-ui` — 为 DeepSeek Harness 网页端重构 Codex 风格侧栏、工作区会话树、全局搜索和轮次导航。 　[仓库](https://github.com/MichengAI/dsh-codex-ui)　★102 · 172593/月 · v1.1.25
- `@changfenhuang/dsh-annotation` — 选中文字→批注→随消息发送，回复按批注逐条对照。 　[仓库](https://github.com/omdsh-dev/dsh-annotation)　★132 · 2950/月 · v1.4.10
- `@changfenhuang/dsh-genui` — 助手回复内渲染交互式 UI 组件：布局、图表、表单、测验、mermaid、3D 场景与回传事件循环。 　[仓库](https://github.com/omdsh-dev/dsh-genui)　★495 · 26766/月 · v0.11.3
- `@huiliyi37/dsh-tianshu-tui` — DeepSeek Harness 的终端 UI（TUI）。 　[仓库](https://github.com/huiliyi37/dsh-tianshu-tui)　★284 · 2226/月 · v1.0.0-rc.1

### 工具与能力　<sub>560 个</sub>

- `@noob-stupid/dsh-plugin-console` — DSH 框架升级安全与插件升级门控：升级前跑「会话格式契约预检」（把不兼容的插件与 agent 预设扫出来先适配）、升级失败自动回滚、把拖垮过启动的插件自动隔离；另有环境指纹与公开契约规则库持续守门。内置多源插件市场只… 　[仓库](https://github.com/Noob-stupid/dsh-plugin-gating-hub)　★93 · 15444/月 · v0.5.32 · MIT
- `@cloudbase/dsh-plugin` — 把腾讯云 CloudBase 后端接入 DeepSeek Harness——在对话里搭好并部署全栈应用，查询结果渲染为表格卡片（分页、排序、导出 CSV），部署后可预览真实域名，并提供 CloudBase MCP 工具… 　[仓库](https://github.com/TencentCloudBase/CloudBase-AI-Toolkit/tree/main/dsh-plugin)　★1128 · 915/月 · v0.2.0
- `@anionex/dsh-computer-use` — macOS 电脑控制：Accessibility 观测、过期状态拒绝、作用域权限与安全输入。 　[仓库](https://github.com/Anionex/dsh-computer-use)　★46 · 3163/月 · v0.3.2
- `@wxg-prc-cpg/dsh-weknora` — 把 WeKnora 知识库接入 dsh 的四个只读工具：列出知识库、混合检索原文片段、按顺序还原单篇文档，以及直接取用 WeKnora 自己带引用的 RAG 或 ReAct agent 回答（含可续聊的 session… 　[仓库](https://github.com/Tencent/WeKnora/tree/main/packages/dsh-weknora)　★31292 · 3582/月 · v0.1.0
- `dsh-data-quality` — DeepSeek Harness 的数据质量检查：数据画像、清洗与验证流水线，产出结构化报告。 　[仓库](https://github.com/PerryLink/dsh-data-quality)　★45 · 3453/月 · v0.3.15
- `dsh-deepread` — 五种模式精读图书与文章（快速/深度/知识地图/费曼/全书），输出观点—证据—数据报告、四档置信度、Mermaid/XMind 思维导图，支持批量对比、预算预检与后台任务进度透明，可导出 MD/MM/HTML。 　[仓库](https://github.com/xiehuan123/dsh-deepread)　★57 · 3150/月 · v1.0.1
- `dsh-fund-research` — 中国公募基金确定性研究报告：采集天天基金/东方财富公开数据，纯函数计算业绩拆解、持仓穿透、风格归因与经理画像，输出带逐数字可溯源快照附录的版本化报告。 　[仓库](https://github.com/PerryLink/dsh-fund-research)　★59 · 3710/月 · v0.4.16
- `dsh-remote` — 多机远程工作区：管理多台 SSH 主机，在原生「添加工作区」流程里选本机系统文件夹或远程目录，把远程工作区镜像成真实本地文件夹并用 rw_* 工具操作。选择器是居中弹窗，默认落在本机页签，远程路径自动预填 `/` 并逐… 　[仓库](https://github.com/flymysql/dsh-remote)　★108 · 7887/月 · v0.8.28

### 开发与运行时　<sub>302 个</sub>

- `@michengai/dsh-skills-manager` — 在设置里管理本地 DSH 技能，并只读查看公共 Agent 技能。 　[仓库](https://github.com/MichengAI/dsh-skills-manager)　★79 · 138017/月 · v1.1.7
- `@tnnevol/dsh-fnos` — 把 DeepSeek Harness 接进飞牛 fnOS：DSH 界面跑在 fnOS 应用框架里时通过 fnOS 浏览器 SDK 工作——DSH 设为跟随系统时读取并跟随 NAS 主题，在设置里列出和取消已授权的 NA… 　[仓库](https://github.com/tnnevol/fn-os-apps/tree/main/plugins/dsh-fnos-plugin)　★47 · 10304/月 · v0.1.1-rc.2.0
- `dsh-mcp-panel` — 官方 MCP 客户端（dsh-mcp-client）的只读运行时管理面板：/mcp 命令与设置页 MCP 页签展示连接状态、已注册工具、错误与重连计数，脱敏展示并提供启停 patch 建议。 　[仓库](https://github.com/PerryLink/dsh-mcp-panel)　★69 · 9086/月 · v0.6.19
- `dsh-skill-mcp-panel` — 在 DSH Web 设置中管理技能与 MCP 服务器：技能卡片热启停、工作区作用域、分组、批量迁移与拖拽导入，以及 stdio/HTTP MCP 增删改查、连接测试、密钥脱敏，并附带统一 dsh-panel 命令行。 　[仓库](https://github.com/Fishquito7/dsh-skill-mcp-panel)　★158 · 1795/月 · v2.1.3
- `dsh-undo-savepoint` — DSH 撤销/回退系统：配置变更自动存档，一键撤销/恢复/回退到任意版本，支持 WebUI 与离线 CLI/GUI 工具（DSH 启动失败也能救）。 　[仓库](https://github.com/lire1131/dsh-undo-savepoint)　★167 · 2324/月 · v0.4.9
- `dsh-win32` — 围绕官方持久 PowerShell 与 Workspace Write 方案检查和修复原生 Windows 上的 DeepSeek Harness，创建桌面快捷方式，并仅通过明确的 legacy 安装保留早期 Git … 　[仓库](https://github.com/sjh9714/dsh-win32)　★97 · 6477/月 · v0.17.14
- `@hyzyn/dsh-profile` — DSH Web GUI 的 Profile 管理卡片：可视化查看、创建（base / web / headless 三种模板）、复制、重命名与删除 ~/.dsh/profiles 下的 profile，支持逐 prof… 　[仓库](https://github.com/hyzyn/dsh-plugin-kit/tree/main/packages/profile)　★42 · 2758/月 · v0.2.3
- `dsh-my-guardian` — 插件治理：新装/更新插件先进候选区，启动完成后热挂载——成功自动转正，失败自动禁用，连续失败冻结，一键安全模式，侧边栏诊断面板（npm: `dsh-my-guardian`）。 　[仓库](https://github.com/baosfeng/my-dsh-plugins/tree/main/plugins/dsh-my-guardian)　★10 · 29615/月 · v0.4.4

### 会话与消息　<sub>285 个</sub>

- `billion-context` — billion-context官方版：上下文压缩插件，兼顾小窗口(100k上下文足矣)省token(省5倍token)和超长会话(数月级别几十亿token单会话)。 　[仓库](https://github.com/ranxianglei/billion-context)　★384 · 322108/月 · v0.1.174
- `@anionex/dsh-turn-rewind` — 对话回退：基于持久 Change Ledger 回滚会话与工作区状态。 　[仓库](https://github.com/Anionex/dsh-turn-rewind)　★122 · 7207/月 · v0.3.8
- `@michengai/dsh-archive-manager` — 在设置里增加已归档会话页，可按工作区搜索、恢复和删除已归档会话。 　[仓库](https://github.com/MichengAI/dsh-archive-manager)　★88 · 167240/月 · v1.0.9
- `dsh-chat-import` — 把 13 家 coding agent（Claude Code、Codex、ChatGPT、Cursor、Gemini、opencode 等）的完整对话历史导入为可续聊的 DeepSeek Harness 会话，并支持… 　[仓库](https://github.com/Nwflower/dsh-chat-import)　★207 · 18274/月 · v0.22.2
- `dsh-easyrewrite` — 在 dsh web 中内联编辑与撤回自己的消息——惰性、无痕，带版本翻页器与会话级草稿持久化。 　[仓库](https://github.com/Renzic-Stone/DSH-EasyRewrite)　★120 · 4844/月 · v2.6.0
- `dsh-message-edit` — 基于分支的消息编辑、reroll、重试与版本时间线。 　[仓库](https://github.com/Moeblack/dsh-message-edit)　★50 · 2253/月 · v0.2.3
- `dsh-plugin-bridge` — 通过可预览的五段式交接，将已有 DSH 会话迁移到另一个 Agent Preset；保留源会话，并可让目标会话暂停等待确认或立即继续。 　[仓库](https://github.com/Totoro-qaq/dsh-plugin-bridge)　★165 · 1813/月 · v0.3.11
- `dsh-rewind-plugin` — 同一会话窗口内的 in-place 对话回退（不 fork，Claude Code /rewind 语义）：每条消息的 ↶ 按钮把模型上下文回退到任意用户消息，可选用磁盘持久化的 before-backups 还原工作… 　[仓库](https://github.com/SiriLee/dsh-rewind)　★102 · 19082/月 · v0.15.0

### 工作流与自动化　<sub>262 个</sub>

- `@nanmicoder/dsh-agent-teams` — AgentTeams 多智能体团队。 　[仓库](https://github.com/NanmiCoder/dsh-agent-teams)　★1852 · 56432/月 · v0.1.22 · MIT
- `dsh-tongflow` — 基于 TongFlow 的“片场”插件，用于图片、配音、音乐与视频制作：agent 为每个资产生成 TongFlow 工作流文件（.tongflow.json）并通过 TongFlow 插件执行，内嵌工作流画布，按镜头… 　[仓库](https://github.com/tong-io/tongflow/tree/main/packages/dsh-tongflow)　★1034 · 1427/月 · v0.8.3
- `@mstar-harness/dsh` — 技能驱动的 harness/loop 工程化工作流插件。 　[仓库](https://github.com/btspoony/mstar-harness/tree/main/packages/dsh)　★62 · 4907/月 · v3.11.2
- `@zseven-w/dsh-crew` — 从 Claude Code / Codex 派发任务给 DSH Agent：原生子代理进度、按能力分层预设的宿主内工作会话，以及为纯文本 Harness 提供视觉与图像生成的多模态桥。 　[仓库](https://github.com/ZSeven-W/dsh-crew)　★153 · 1758/月 · v0.1.0-rc.11
- `dsh-doublecheck` — 工程纪律守门：动笔前审讯需求，红绿测试证据门，交付后对抗评审，并汇总交付报告与逐维度核对。 　[仓库](https://github.com/PerryLink/dsh-doublecheck)　★48 · 4436/月 · v0.9.17
- `dsh-lowtide` — lowtide（退潮）插件能够实现闲时自动批量跑任务——任务框架高度自定义，四种执行策略，L1–L3 半自动/全自动裁决，支持任务编辑与预检，Cordis 微内核集成，桌面网页端通用。 　[仓库](https://github.com/KelaoHu/dsh-lowtide/tree/main/packages/dsh-lowtide)　★170 · 2327/月 · v0.2.5
- `dsh-plugin-yolo` — 面向 DeepSeek Harness 的个人助手：从对话中整理跨会话事项与计划，通过提醒和可审计的助手看板持续跟进。 　[仓库](https://github.com/hanshanyike/dsh-yolo)　★55 · 1577/月 · v0.5.0
- `dsh-taskboard` — dsh 的任务看板：创建任务时可指定项目与模型，支持手动执行及定时执行；项目内新建会话会自动拉取该项目的待办任务，完成后移至待验收。 　[仓库](https://github.com/cloader/dsh-taskboard)　★56 · 7251/月 · v0.8.6

### 用量与计费　<sub>233 个</sub>

- `dsh-context` — DSH 上下文洞察面板：Context 仪表盘 + /context命令 + Context 浏览器，查看 Context的分类组成、内容详情、演进趋势、压缩/注入事件、统计等一站式 Context 全生命周期管理。 　[仓库](https://github.com/bowenliang123/dsh-context)　★1580 · 114780/月 · v0.60.0 · Apache-2.0
- `dsh-cost-meter` — 会话与当日 API 费用统计、预算图框（已用%）、官方余额、历史看板，支持峰谷计价与官方价格一键同步。 　[仓库](https://github.com/Han-1413141/dsh-cost-meter)　★349 · 82799/月 · v1.7.46
- `dsh-damage-pulse` — 在 DSH Web 界面追踪 DeepSeek Token 用量、单次与会话费用及账户余额，并显示缓存感知的扣费动画。 　[仓库](https://github.com/wssfk12138/dsh-damage-pulse)　★224 · 3861/月 · v4.2.0
- `dsh-token-pet` — DSH 悬浮桌面用量小宠物：用 12 个正式状态动作反馈请求、工具、上下文压缩、归档和提示词增强，展示实时上下文占用、跨会话终身用量账本、服务商/模型统计、小时趋势与近 7/30 日视图；支持深色/浅色主题切换；可选成… 　[仓库](https://github.com/Jimmy0123-ux/dsh-token-pet)　★56 · 2502/月 · v0.4.2
- `dsh-tokenledger` — 侧边栏用量面板：把 Token 归属到实际服务该请求的中转站，站点从已有的 provider 配置中读出，无需额外配置；含今日/本月/累计三窗口、按站点与模型下钻、一年活跃度热力图，以及 New API / Sub2A… 　[仓库](https://github.com/zh667/TokenLedger)　★202 · 1490/月 · v0.1.0
- `dsh-personal-center` — DeepSeek Harness 个人中心：跨会话用量统计、按模型成本估算、全局自定义指令、外观全局字号、数据驱动的桌面宠物（位图/矢量皮肤）与会话状态概览，纯本地离线运行。 　[仓库](https://github.com/PolinniZhong/dsh-personal-center)　★120 · 1276/月 · v1.1.2
- `dsh-token-usage-stats` — 仿 DeepSeek 官方 Token 统计，跨会话 Token 消耗、请求次数与峰谷分时费用统计看板。 　[仓库](https://github.com/jkStars/dsh-token-usage-stats)　★3 · 29776/月 · v0.3.14
- `meow-cachebilling` — 点开输入框旁的上下文圆环即见本轮账单：缓存命中/未命中/输出各花多少钱（¥），官方峰谷价与模型分价自动判定；非 DeepSeek 官方路由不显示。 　[仓库](https://github.com/Phant0Meow/dsh-meow-cachebilling)　★33 · 2241/月 · v0.7.4

### 模型与账号接入　<sub>213 个</sub>

- `@opencode2dsh/dsh-plugin` — 将 OpenCode Zen 免费模型接入 DeepSeek Harness，无需 API Key。 　[仓库](https://github.com/FishBottle7/opencode2dsh/tree/master/packages/plugin)　★96 · 3290/月 · v0.3.3
- `dsh-agy-link` — 将 Google Antigravity (agy CLI) 接入 DSH：无 API Key 使用 Gemini/Claude/GPT-OSS 订阅模型，支持流式对话、原生工具卡片、思考轮次注记及 Web 界面 Go… 　[仓库](https://github.com/amlyczz/dsh-agy-link)　★89 · 4731/月 · v0.4.40
- `dsh-connect-workbuddy` — 将本机登录的 WorkBuddy 模型接入 DSH，支持逐模型图片输入开关、账号切换，以及带每日签到的只读积分概览。 　[仓库](https://github.com/dingminhua/dsh-connect-workbuddy)　★48 · 6743/月 · v2.3.1
- `dsh-deepseek-web-login` — 新增 deepseek-web provider，把 chat.deepseek.com 网页端模型接入 DSH：浏览器登录抓取、PoW 请求签名、SSE 流式传输与基于提示词的工具调用。 　[仓库](https://github.com/cv-superding/dsh-deepseek-web-login)　★188 · 3493/月 · v0.6.6
- `dsh-plugin-subscriptions` — 把 ChatGPT（Codex）、Claude、Grok 订阅当作 DeepSeek Harness 的 LLM 提供方：设置页登录、模型目录、用量展示，以及 image_generate、video_generate… 　[仓库](https://github.com/V1ki/dsh-plugin-subscriptions)　★407 · 9783/月 · v0.9.6
- `dsh-workbuddy-connect` — 将 WorkBuddy 桌面 App 包含的模型自动接入 DeepSeek Harness，在 DSH 对话窗口里零配置使用。 　[仓库](https://github.com/corrinehu/dsh-workbuddy-connect)　★238 · 9254/月 · v0.6.5
- `@tnnevol/dsh-codebuddy` — 为 DeepSeek Harness 接入腾讯 CodeBuddy 模型：用浏览器 OAuth 登录替代 API Key，列出 CodeBuddy 模型目录及每个模型的上下文、输出、工具调用、推理与图片能力，支持多账号… 　[仓库](https://github.com/tnnevol/fn-os-apps/tree/main/plugins/dsh-codebuddy-plugin)　★47 · 1535/月 · v0.1.2-rc.1.2
- `@hytime/dsh-thinking-effort` — 为 DSH 自定义模型配置思考档位和子 agent 默认思考强度。 　[仓库](https://github.com/hytime/dsh-thinking-effort)　★37 · 7483/月 · v0.3.6

### 记忆　<sub>201 个</sub>

- `dsh-mnemon` — 由 Mnemon 驱动的 DeepSeek Harness（DSH）跨 Agent、本地优先的持久记忆插件。它可在支持 Mnemon 的 Agent 之间共享长期记忆，并提供运行时记忆、可检索项目档案、语义召回、知识图… 　[仓库](https://github.com/omdsh-dev/dsh-mnemon)　★423 · 37252/月 · v0.5.20
- `@openviking/dsh-memory-plugin` — 面向 DeepSeek Harness 的 OpenViking 记忆与上下文插件：pre-step 自动召回与画像注入、会话捕获、`viking://` URI 防护，以及对接 OpenViking 服务端的 rec… 　[仓库](https://github.com/volcengine/OpenViking)　★39000 · 26475/月 · v0.5.11 · AGPL-3.0
- `dsh-deja` — 读取本机上其他三十三个编程智能体已经写下的会话文件——Claude Code、Codex、Cursor、VS Code Copilot Chat、opencode、OpenClaw、Hermes、Kimi、Cline、… 　[仓库](https://github.com/vshulcz/deja-vu/tree/main/extensions/dsh)　★1093 · 3111/月 · v0.21.4
- `@a9i5k4/dsh-auto-memory` — 主动联想记忆 + Astra 式上下文管理：自动唤回（固定边界注入，前缀缓存友好）/自动沉淀/技能固化/交接账本与 PLAN 白板跨窗口续命/水位感知（窗口自动适配当前模型）。本地 Markdown 存储，模型无关，零… 　[仓库](https://github.com/Aik358/dsh-auto-memory)　★88 · 12466/月 · v3.2.4
- `@modusensus/dsh-mneme` — 会做梦的记忆 — DeepSeek Harness 跨会话记忆插件：跨会话记住你与项目、深夜 autoDream 自动巩固记忆、冲突记忆先冻结待你裁决、全程可回放审计。默认离线：SQLite 配人工可编辑的 Markd… 　[仓库](https://github.com/slow-stack/mneme/tree/main/dsh-mneme)　★132 · 11375/月 · v0.8.10
- `@vectorize-io/hindsight-coding-agents` — Hindsight：会学习的 Agent 长期记忆系统，自动召回/保存、知识页、深度反思与按仓库隔离的记忆银行。 　[仓库](https://github.com/vectorize-io/hindsight/tree/main/hindsight-integrations/coding-agents)　★42988 · 48565/月 · v0.8.0
- `@zilliz/memsearch-dsh` — 供 DSH 与其他编程 Agent 共享的 Markdown 记忆，支持自动捕获、步骤前上下文注入、搜索召回，以及通过审阅面板实现 memory-to-skill 自进化。 　[仓库](https://github.com/zilliztech/memsearch/tree/main/plugins/dsh)　★2682 · 1780/月 · v0.1.5
- `dsh-memento` — 有界、分层、带审批门、可审计的跨会话记忆：`ctx.memory` 服务 + 零依赖 SQLite 存储 + `memory` 工具与冻结快照注入，并预演 dsh-memory-protocol v1——适配器注册表与… 　[仓库](https://github.com/PerryLink/dsh-memento)　★126 · 4914/月 · v0.5.18

### 技能包　<sub>174 个</sub>

- `@linxin666/dsh-client-ui-skill-explorer` — 技能中心：按来源分级浏览已加载的全部 skill，启用/禁用模型调用、创建新技能、删除进可恢复回收站。 　[仓库](https://github.com/zhu1090093659/dsh-web/tree/main/packages/dsh-skill-explorer)　★8178 · 171221/月 · v0.4.4
- `dsh-plugin-guide` — DSH 插件开发知识库，作为按需加载的 agent 技能随 bundle 安装：官方约束、任务工作流、API 参考与社区踩坑，写插件时让 DSH 自己查。 　[仓库](https://github.com/PerryLink/dsh-plugin-guide)　★43 · 5209/月 · v0.3.19 · Apache-2.0
- `@dhicoc/dsh-reverse-skill` — 完整 reverse-skill（85 个 SKILL.md）的 DeepSeek Harness 插件：逆向工程、授权渗透测试与安全研究的技能路由包。 　[仓库](https://github.com/dhicoc/dsh-reverse-skill)　★177 · 3529/月 · v1.0.5
- `@michengai/dsh-agency-agents` — 增加可召唤的领域专家名单，专家以子代理运行，主会话保留任务和最终答复。 　[仓库](https://github.com/MichengAI/dsh-agency-agents)　★74 · 141209/月 · v1.0.7
- `dsh-mattpocock-skills-deck` — 安装即自带mattpocock/skills v1.2.3的25个工程与效率技能，无需手动装技能。300亿token打造。本插件在原始技能之上提供10倍的开发效率。主力支持GitHub issue；Markdown为预… 　[仓库](https://github.com/FeatherHunter/dsh-mattpocock-skills-deck)　★96 · 6829/月 · v1.7.33
- `gongwen-skill` — 中文公文全流程处理工具：GB/T 9704 格式检查、自动修复、内容修订（红色标注+删除线）、模板生成、Markdown 转公文、版头/版记/页码注入，覆盖通知/请示/报告/函/会议纪要等 24 类公文。 　[仓库](https://github.com/linhut/gongwen-skill)　★69 · 3908/月 · v2.14.0
- `dsh-run2skill` — 将 DSH 会话中明确表达的经验整理为可审核的原生 Skill 草稿，并仅在用户确认后保存。 　[仓库](https://github.com/qkycir-123/dsh-run2skill)　★109 · 1425/月 · v0.5.0-alpha.2
- `dsh-echocat-skill-panel` — 每轮对话报告本轮调用了哪些 skill（模型自动加载、用户输入 /name，或一个都没用），并管理本机 skill 目录：粘贴仓库、文件夹、SKILL.md 或 zip 地址即可安装，中文显示名写入该 skill 的 … 　[仓库](https://github.com/VDERR/dsh-echocat-skill-panel)　★196 · 802/月 · v5.1.3

### 通知与集成　<sub>165 个</sub>

- `@xmanrui/dsh-im` — 通过二维码或机器人凭据将 IM 机器人接入 DeepSeek Harness（支持飞书、微信、钉钉、企业微信、QQ、Slack、Telegram、Discord 和 WhatsApp 共 9 种渠道）。 　[仓库](https://github.com/xmanrui/dsh-im)　★1552 · 51521/月 · v4.32.0 · MIT
- `dsh-pocket` — 手机远程访问 DSH Web 界面：扫码即用局域网或公网（cloudflared 隧道）访问，实时同屏、移动端适配布局，带设置页管理。 　[仓库](https://github.com/shaobeichen/dsh-pocket)　★1415 · 15377/月 · v2.10.6
- `dsh-notifier` — DSH 通知与远程操作控制面：一个 `notify()` API 接入 28 个出站渠道，六条入站控制通道承载手机审批、提问与任务控制；提供 DSH 原生「通知与控制」UI、出站热生效、多 agent 路由，并保持零运… 　[仓库](https://github.com/THEWOLFWALKER/dsh-notifier)　★55 · 4752/月 · v0.13.1
- `dsh-lark-bot` — 把 DeepSeek Harness 装进飞书的桥接插件：扫码绑定 PersonalAgent、流式卡片、git worktree 项目工作区、scope 并行任务、多角色 Agent、跨会话通知、对话内模型/密钥管理… 　[仓库](https://github.com/PlutoKeating/dsh-lark-bot)　★41 · 2151/月 · v0.19.16
- `dsh-lark-link` — DeepSeek Harness 的高可靠飞书/Lark 桥接：扫码一键认证、卡片化命令与意图确认、at-least-once 零丢失出站队列、多媒体出入站、/doctor 会话日志 ZIP，并复用 DSH Web G… 　[仓库](https://github.com/amlyczz/dsh-lark-link)　★40 · 1675/月 · v0.5.5
- `@avernet-plugin/deepseek-harness-channel-bcn` — 通过 WebSocket V2 将 DeepSeek Harness 接入 Avernet Bot 协作网络，支持自动注册、Agent 会话隔离、工具调用事件和多 Bot 路由工具。 　[仓库](https://github.com/inclusionAI/Avernet/tree/dev/src/bcs/crates/plugins/deepseek-harness-channel-bcn)　★574 · 362/月 · v0.1.0
- `@dingyi222666/dsh-session-notification` — 会话完成等四种状态的通知响应，支持浏览器提示。 　[仓库](https://github.com/dingyi222666/dsh-session-notification)　★24 · 2854/月 · v0.2.0
- `@wingsky-1/dsh-notifier` — 任务事件通知中心：6 类事件（提问 / 审批 / 完成 / 子代理完成 / 错误 / 轮次完成），双通道（浏览器通知 + 宿主系统 toast）外加 Bark/Webhook 推送频道（ntfy、Gotify、自建网关… 　[仓库](https://github.com/wingsky-1/dsh-plugin-hub/tree/main/packages/dsh-notifier)　★23 · 3461/月 · v0.2.7

### 主题与外观　<sub>151 个</sub>

- `dsh-dream-skin` — 一键换肤插件：8 套原创主题、背景壁纸（透明度/模糊）、强调色、主题包导入/导出+分享链接、收藏与随机，纯原生 token 系统接入。 　[仓库](https://github.com/RevolutionLA/dsh-dream-skin)　★195 · 26603/月 · v9.29.0
- `@nonamelego/dsh-catppuccin` — DSH Web GUI 的 Catppuccin 主题插件：Latte、Frappé、Macchiato、Mocha 四套主题接入原生主题系统，一键切换并记住选择；另附可开关的玻璃质感皮肤，顶栏、侧边栏、输入框、统计行… 　[仓库](https://github.com/NoNameLeGo/dsh-catppuccin-theme)　★49 · 9806/月 · v0.5.8
- `@smalltailqwq/dsh-client-ui-skin-maid-atelier` — DSH Web 鲸鱼娘皮肤系列（深海女仆工坊 maid-atelier）。 　[仓库](https://github.com/Small-tailqwq/dsh-deep-whale/tree/main/maid-atelier)　★2288 · 11831/月 · v0.1.6
- `beauticode-dsh` — 为 DSH Web 设置本地图片与 MP4 视频背景：侧栏「背景」面板、可保存主题（含内置「画窗」）、声音开关、恢复上次背景，以及 /bg、/bg-theme、/bg-clear 命令。 　[仓库](https://github.com/starsstreaming/beautiCode/tree/main/integrations/deepseek-harness)　★83 · 7916/月 · v1.0.26
- `dsh-client-liang-intensity-skin` — 自适应推理等级滑块皮肤，将当前模型可用档位映射到 0–30 视觉强度，并同步人物、背景和界面配色。 　[仓库](https://github.com/kingOfSoySauce/dsh-liang-skin)　★225 · 4377/月 · v0.1.6
- `dsh-plugin-wallpaper-engine` — 前置要求：DeepSeek Harness 0.1.5-rc.1+（DSH Desktop ≥ 2.0.7）且 dsh-better-sidebar ≥ 0.19.0，安装或更新本插件前请先更新两者。把本机 Wallp… 　[仓库](https://github.com/elysia395/dsh-wallpaper-engine)　★397 · 22533/月 · v1.1.0
- `open-sea-skin` — 实时 WebGPU 海洋皮肤，可快捷调节波浪、日光、玻璃不透明度与自动昼夜循环。 　[仓库](https://github.com/d-dev0101/open-sea-skin)　★380 · 3064/月 · v1.2.3
- `dsh-bloom-theme` — Bloom 莫兰迪主题：十款变体（黛蓝 mist、朱砂 cinnabar、桃夭 petal、天青 ripple、竹青 sage、赭石 stone、青金 lapis、琥珀 amber、落霞 aurora、青莲 laven… 　[仓库](https://github.com/webkubor/dsh-bloom-theme)　★47 · 1311/月 · v0.16.0

### 安全与权限　<sub>146 个</sub>

- `@nanmicoder/dsh-auto-mode` — 在 Workspace Write 与 Full access 之间增加 Auto 权限档：日常操作留在官方 workspace-write 沙箱内，由当前会话模型复核升权与破坏性调用，精确的越界访问按次放行一次，意图… 　[仓库](https://github.com/NanmiCoder/dsh-auto-mode)　★164 · 3377/月 · v0.2.0
- `dsh-approval-gate` — DeepSeek Harness 自动审批门控：Flash 预判写入/命令是否不可回补，安全操作自动批准、危险操作转人工（fail-safe）。另含文件改动对比（unified diff）与一键撤销、按会话隔离的快照管… 　[仓库](https://github.com/moon09300731/dsh-approval-gate)　★82 · 5228/月 · v0.5.0
- `dsh-auto-review` — 审批链上的第二模型自动审查：只读审查子代理返回带理由的 allow/deny 结构化裁决，默认 fail-closed。 　[仓库](https://github.com/PerryLink/dsh-auto-review)　★218 · 5737/月 · v0.12.10
- `dsh-passwords` — 让 DeepSeek Harness 变成服务器级多租户平台：远程访问 + 自动 HTTPS、子用户权限与配额、沙盒强制、加密认证与审计日志。 　[仓库](https://github.com/slywalker2006/dsh-passwords)　★66 · 4981/月 · v2.7.6
- `dsh-permission-rules` — Claude Code 风格的声明式权限规则：按序 allow/deny/ask 的 YAML 规则，在 tools/pre-execute 瀑布上匹配工具名、参数、工作区路径与 agent 身份，带完整会话日志审计、… 　[仓库](https://github.com/PerryLink/dsh-permission-rules)　★117 · 7193/月 · v0.7.9
- `dsh-secure-audit` — DSH 只读安全合规插件：提示注入检测、中文 PII 脱敏、本机配置安全审计，输出脱敏且可复现的报告。 　[仓库](https://github.com/PensiveFei/dsh-secure-audit)　★85 · 1353/月 · v0.2.10
- `dsh-pentester` — 基于 PTES 的渗透测试插件，采用 Root-Orchestrator 架构，用于 DeepSeek Harness。 　[仓库](https://github.com/fb0sh/dsh-pentester)　★35 · 2472/月 · v4.1.0
- `dsh-defend` — 在 agent/pre-step、tools/pre-execute、tools/post-execute 三个接缝检测提示词注入、越狱与密钥泄露，按 allow/ask/block 分层拦截，附脱敏 defend/d… 　[仓库](https://github.com/PerryLink/dsh-defend)　★19 · 3600/月 · v0.3.16

## 安装一个插件

**方式一 · GUI（推荐）**：侧边栏 **Plugins** 页面 → **Add plugin** → 粘贴上面表格里的 npm 包名 → 确认安装。大多数插件装完刷新页面就生效，少数需要重启 DSH。

**方式二 · 命令行**：

```powershell
dsh plugin --profile desktop add <npm 包名>
# 例：
dsh plugin --profile desktop add dshmarket
```

**已经装过想升级**：`add` 不会覆盖已装版本，先 `remove` 再 `add`；或者装一个插件市场（如 `dshmarket`）用界面一键更新。

> 只给出 GitHub 仓库、没有 npm 包名的插件，需要在 Plugins 页面用 Git 地址或本地路径安装，而且可能要本地构建（pnpm 依赖安装脚本默认被拦截，需要你明确批准）。

## 同类工具

「找插件」这件事在本插件出现之前已经有人做了，诚实起见一并列出，你可以对比着用：

- `dshmarket` — 在 DeepSeek Harness 设置页内浏览、搜索并安装社区插件，支持分类筛选、一键更新与停用，以及主题切换与配置备份。 　[仓库](https://github.com/dsh-market/dsh-market)　★5021 · 452852/月 · v1.66.6 · MIT
- `dsh-plugin` — A community plugin marketplace for DeepSeek Harness, built to the official plugin spec — browse, search and install 10000+ human-… 　[仓库](https://github.com/dshplugin/dsh-plugin-hub)　★151 · v1.4.11 · MIT
- `dsh-find-plugin` — 会话内直接找插件：按关键词/分类搜索本精选 registry，返回描述与可直接执行的安装命令。 　[仓库](https://github.com/awesome-dsh-plugin/dsh-find-plugin)　★158 · 27424/月 · v0.4.0 · MIT
- [AdamPlatin123/dsh-plugin-radar](https://github.com/AdamPlatin123/dsh-plugin-radar) — GitHub 上按 `dsh-plugin` 主题做雷达式发现的项目。

和它们的区别：本插件是 **只读的检索与建议**，不代装、不改你的 profile；数据同时来自人工精选目录、GitHub 实时搜索和 npm 清单，因此既能给出稳定推荐，也能发现刚发布、还没被目录收录的插件。

## 风险与局限

- **列表 ≠ 审查。** 收录与描述来自社区目录，不代表任何安全背书。目录里的 `capabilities` 字段（如 `shell`、`fs-write`、`network`、`credentials`、`env`）是该插件已知需要的能力，看到就多想一眼。
- **第三方插件是别人的代码**，装上就在你的机器上以你的权限运行。装之前至少看一眼仓库。
- **分类与描述不是本插件写的**，来自目录；npm 搜到、目录还没收录的新包没有分类，描述也是英文原文。
- **数据有时差。** 目录每天更新，本插件默认 12 小时缓存一次。要最新结果就调一次 `dsh_plugin_finder` 的 `refresh`。
- **GitHub 未认证限额**约每分钟 10 次搜索、每小时 60 次核心请求；频繁刷新会触发限流，此时工具会原样报出 warning，而不是假装成功。

## 附录 A · 分类字典

| 分类 id | 中文 | English | 数量 |
| --- | --- | --- | --- |
| `ui` | UI 增强 | UI Enhancements | 752 |
| `tools` | 工具与能力 | Tools & Capabilities | 560 |
| `dev` | 开发与运行时 | Development & Runtime | 302 |
| `session` | 会话与消息 | Sessions & Messages | 285 |
| `workflow` | 工作流与自动化 | Workflow & Automation | 262 |
| `usage` | 用量与计费 | Usage & Billing | 233 |
| `model` | 模型与账号接入 | Models & Providers | 213 |
| `memory` | 记忆 | Memory | 201 |
| `skill` | 技能包 | Skills | 174 |
| `notify` | 通知与集成 | Notifications & Integrations | 165 |
| `theme` | 主题与外观 | Themes & Appearance | 151 |
| `security` | 安全与权限 | Security & Permissions | 146 |
| `fun` | 娱乐 | Just for Fun | 133 |
| `remote` | 远程与移动端 | Remote & Mobile | 131 |
| `vision` | 视觉与多模态 | Vision & Multimodal | 106 |
| `git` | Git 与代码评审 | Git & Code Review | 105 |
| `browser` | 浏览器与网页 | Browser & Web | 98 |
| `market` | 插件市场与管理 | Plugin Markets & Managers | 78 |
| `wsl` | WSL 与 Windows 互操作 | WSL & Windows Interop | 66 |
| `voice` | 语音与音频 | Voice & Audio | 63 |
| `docs` | 文档与渲染 | Docs & Rendering | 62 |
| `identity` | 身份与通信 | Identity & Communication | 23 |
| `agi` | AGI 架构探索 | AGI Architecture Exploration | 15 |

## 附录 B · 本插件的 Agent 工具

装上 `dsh-plugin-finder` 之后，可以直接在对话里让 agent 查：

```text
{ "action": "suggest", "query": "记忆", "limit": 10 }
{ "action": "suggest", "category": "vision", "installable": true }
{ "action": "search",  "query": "task board" }   // 额外实时查 GitHub + npm
{ "action": "refresh" }                            // 强制重建索引
{ "action": "stats" }
```

_本文档由 `dsh-plugin-finder/tools/report.mjs` 生成于 2026-09-30T05:11:35.531Z。_
