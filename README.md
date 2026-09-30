# dsh-plugin-finder · 插件发现

直接发现 GitHub 上带 **`dsh-plugin` topic** 的公开仓库，提供侧边栏「插件发现」页面和 Agent 工具 `dsh_plugin_finder`。

## 发现规则

- 唯一仓库来源：GitHub REST 搜索 `topic:dsh-plugin fork:true`。包含 fork、已归档仓库与没有根目录 `package.json` 的仓库。
- 每页 100 条；超过 GitHub 单次搜索 1,000 条限制时，按创建时间递归分片。没有默认仓库数量上限。
- GitHub 限流、网络失败、取消或响应不完整时，明确标记扫描未完成，保存已找到的仓库和下一个分片/页码。点击「扫描 / 继续扫描」或调用 refresh 继续。
- 分类按仓库名称、描述和 topics 推断；topic 表示作者标记，不等于经过安装验证。
- 根目录 manifest 仅补充 bundle/UI 标记。未读取、monorepo 或没有 bundle 声明的仓库仍然展示，其安装标识需要到仓库 README 确认。
- npm/国内 npmmirror 只补充已发现仓库的发布信息，不用于搜出额外仓库。只有已发布包的 repository 与当前仓库匹配，才显示为已验证 npm 包；同名 fork 保持独立。
- 不使用 awesome-dsh-plugin，不携带旧目录快照；旧版缓存自动忽略。离线只显示新引擎保存的缓存，首次离线列表为空。

## 国内镜像

直连 GitHub 优先；网络、HTTP 或数据校验失败后尝试 GH-Proxy 国内加速通道。镜像代理 GitHub 的公开 Search API 和 raw 文件，**不是独立的社区目录**。默认前缀：

```
https://gh-proxy.com/
https://gh-proxy.org/
```

镜像需要实际支持 `https://api.github.com/search/repositories`；只支持下载 release 的代理不能替代搜索。返回网页、错误 JSON 或缺少 topics 的响应会被拒绝，并回退其他通道。第三方镜像的可用性、缓存延迟及限制取决于服务方。

GitHub Token 只从 Host 环境的 `GITHUB_TOKEN` / `GH_TOKEN` 读取，仅发送到 GitHub 官方 API，不发给镜像，也不发到浏览器。官方带 Token 的请求不跟随重定向。

## 使用

从 GitHub 安装到 Web profile：

```powershell
dsh plugin --profile web add "https://github.com/HarrisXiu/dsh-plugin-finder"
```

桌面端可以在 Plugins → Add plugin 粘贴上述仓库 URL；本地开发时粘贴插件目录的绝对路径。profile 按实际宿主选择。升级 Host 代码后**重启 DSH**，再刷新窗口。页面和 Agent 共用 Host 引擎、缓存与扫描任务；页面每两秒读取扫描进度，关闭页面不会丢失后台扫描。

```json
{ "action": "refresh" }
{ "action": "suggest", "query": "memory", "limit": 15 }
{ "action": "search", "query": "task board" }
{ "action": "stats" }
{ "action": "diagnose" }
{ "action": "suggest", "offline": true }
```

`installable: true` 筛选根目录 manifest 已声明 `dsh.bundle.patch` 的仓库。此字段确认声明，不承诺插件安装或运行成功。部分仓库采用 monorepo，需要按 README 指定子包。

第一次全量扫描可能持续数分钟至数十分钟。默认请求间隔：未带 Token 6.5 秒，带 Token 2.1 秒。API 索引不是静态快照，扫描期间的仓库变动和 GitHub 未索引的仓库可能影响结果；扫描状态表示已枚举本次可返回的分片和页，不能保证包含私有或尚未索引的仓库。

## 配置

profile 的 `cordis.patch.yml`：

```yaml
- id: plugin-finder
  name: dsh-plugin-finder
  config:
    enabled: true
    cacheTtlMinutes: 720
    githubMirrors:
      - https://gh-proxy.com/
      - https://gh-proxy.org/
    repoLimit: 25          # 每轮补充多少个尚未读取的根 manifest，不限制发现仓库数量
    manifestLimit: 25      # 每轮最多验证多少个 npm 包
    # maxSearchRequests: 100  # 可选请求预算，达到后保存断点，下一轮继续
```

`githubMirrors: []` 仅直连。默认缓存：`$DSH_HOME/plugin-finder/cache.json`。Token 不配置在 YAML 中。

## 开发与验证

```powershell
npm run build
npm test
npm run test:live                 # 有限请求的真实源冒烟检查
node tools/livecheck.mjs --all    # 完整扫描，可能耗时数分钟
node tools/report.mjs             # 从新格式直接发现缓存生成列表文档
```

离线回归覆盖分片、分页、限流断点续扫、取消、严格 topic 过滤、同名 fork、npm 仓库关联、旧缓存隔离、镜像回退、Token 隔离、Host HTTP 路由与浏览器数据加载。真实 DSH 窗口里的视觉效果需在加载后检查。

MIT

## 参考与验证范围

[GitHub Search API](https://docs.github.com/en/rest/search/search) 说明分页上限、搜索限流与 incomplete_results；[GH-Proxy 使用文档](https://gh-proxy.com/docs/github-accelerator) 说明公开 GitHub API 的代理方式。

已通过离线分页/分片/续扫回归、Host 激活及浏览器加载流程检查。真实源冒烟已验证 GitHub 搜索和 raw manifest 读取；此检查使用有限请求预算，收集了 102 个不同仓库，不是一次完整的全库枚举。GH-Proxy 的 `gh-proxy.com` Search API 通道已通过真实请求验证（返回 100 条结果）；镜像错误与回退在隔离测试中验证。其他镜像及实际通道可用性仍需要按所在网络检查。尚未验证真实 DSH 窗口中的视觉呈现。
