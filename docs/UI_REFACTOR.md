# Damnatiox Knowledge UI/UX 增量重构

## 范围与保护基线（2026-10-05）

- 起点 `1270e58a1c599323c077fafffae88078c9443cfe`，工作区干净；独立分支 `codex/ui-ux-refactor`。本轮不推送主分支、不部署生产。
- Node 24.21.0；锁定实际 Nuxt 3.21.9、Vue 3.5.40、TypeScript 5.9 系列。保留 CSS 与 `--kb-*` 体系。
- README、REQUIREMENTS、配置和现有测试已读取；项目目录无 AGENTS.md。
- 原图 `app/public/images/knowledge-home-line-art.png` SHA-256：`51532f73bf8b07873f30793ce8591531304924e077a81a1ccac15db42e5b5f45`。访问路径、背景定位/尺寸、透明度/滤镜/混合模式与 forced-colors 规则均作为保护项。
- 路由：`/`、`/knowledge/[...path]`、`/admin/login`、`/admin`、`/admin/documents/new`、`/admin/documents/[id]`；`/admin/folders` 与 `/admin/documents` 为现有重定向。另覆盖 404。
- 演示：127.0.0.1:3002，显式清空两个公开 Supabase 配置，开发内存模式；写入测试仅限此模式。未更改数据库 Schema、RLS、Storage Policy、认证架构或在线内容。
- 基线：37 Vitest 通过；typecheck 通过；lint 0 错误、12 条原有格式警告。npm audit 原有 23 项（8 moderate、15 high），本轮不扩大为依赖主版本升级。

## 来源与实际使用

| 来源                                                                                                                                                         | 使用位置 / 实现                                                      | 依赖与降级                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Taste redesign-existing-projects](https://github.com/Leonxlnx/taste-skill/blob/main/skills/redesign-skill/SKILL.md)                                         | 主设计审查，先检查再增量修改                                         | 读取实际 Skill；保留品牌/图片/侧栏/原生滚动，用户边界优先于泛用字体替换和装饰建议                                                                                        |
| [Better Interface](https://github.com/jakubkrehel/skills/tree/main/skills/better-interface)                                                                  | accessibility / layout / writing / typography / colors / ui 六项审查 | 全部实际可用并读取，源文件保存在 /private/tmp/kb-interface-skills；只做审查，不另设视觉主导                                                                              |
| [Motion for Vue](https://motion.dev/docs/vue) / [reduced motion](https://motion.dev/docs/vue-use-reduced-motion)                                             | UiDialog 局部面板进退                                                | motion-v 2.5.2，MIT，Vue >=3；使用 Vue API 显式导入，无需自动导入 Nuxt module；降低动态效果时 JS 位移归零。其上游包包含 framer-motion 作为内部依赖，应用不使用 React API |
| [Vue Bits SpotlightCard](https://github.com/DavidHDev/vue-bits/blob/main/src/content/Components/SpotlightCard/SpotlightCard.vue)                             | 首页卡片局部边缘聚光的交互思路                                       | 原源含 Tailwind、MIT + Commons Clause；不复制组件、不加该依赖，独立 Vue/CSS 实现，触屏/reduced motion 禁用追踪                                                           |
| [Animate UI](https://animate-ui.com/docs)、[Aceternity](https://ui.aceternity.com/components)、[Magic UI](https://magicui.design/docs/components/magic-card) | 核验按钮、侧栏、卡片边缘反馈参考                                     | React 实现未安装/复制；使用现有 Vue 与单一 motion-v 引擎                                                                                                                 |
| [Reka dialog](https://reka-ui.com/docs/components/dialog)                                                                                                    | 弹层语义参考                                                         | 采用原生 dialog 的模态、Esc、焦点约束，未增加组件库                                                                                                                      |

## 现存数据风险（独立于界面验收）

隔离 mock 执行现有 composable，8 项风险断言通过；可复现脚本见 `docs/ui-refactor/evidence/risk-audit.cjs.txt`。不是生产后端测试。

1. 退出只清 auth，含草稿 knowledge 缓存可被公共 load 复用；并发 load 会直接早退。客户端会话问题，未证实服务端 RLS 泄露。建议独立修复缓存失效/请求代数与等待语义。
2. saveDocument 先写正文再上传；上传失败可能留下已创建行。Storage 指针写入错误未检查；无新文件时旧源文件不跟随正文，导入后编辑仍上传最初 File。需要明确源文件语义、部分成功返回值和补偿策略。
3. 单文档 Storage 删除错误未检查；先删源文件后删记录可能部分成功。批量删除/排序不具跨步骤原子性；不得以 UI 成功代替事务保证。
4. 写后 load 失败被吞掉，调用方仍可能正常返回；保存时继续输入也有 dirty 状态错判风险。本轮编辑器将保存过程锁定到真实请求，后端一致性另立任务。

这些问题不通过修改生产权限、数据或 Schema 绕过；最终验收保留限制，不笼统声明生产就绪。

## 已落实的改造

- `theme.css` 合并重复令牌和同范围重复规则；共享焦点、按压、状态、动效时长、字体角色与后台宽度。`app.vue` 主题翻转暂时抑制全页颜色过渡，两帧后恢复，并清理 RAF；主题图标仍有局部过渡。
- 首页重新组织标题、搜索、统计、分类、最近文章、标签；去重标签总数与前十展示分开，标签传入真实条件。原图和三个渲染令牌保持原值。
- `UiDialog`、`useSearch`、`useDrawer`、`scroll-lock` 取代分散弹层/伪造快捷键/互相覆盖的滚动锁。搜索支持活动项、方向键、Enter、IME、防焦点逃逸、快速开关与有效触发器恢复；WebKit 指针点击也能正确恢复焦点。
- 树保留混合学习顺序和展开偏好，首次访问后保留子节点；修复展开初值造成的 hydration 不一致。文章 tag、面包屑、正文层级、复制状态和图表弹层统一；移动目录跳转聚焦实际标题。
- 后台抽屉、菜单、表单统一；移动操作菜单改为行内展开，避免被滚动容器裁掉，保留键盘操作。文档名称导航改为链接。危险动作文字始终清楚可辨。
- 编辑器复用同一 textarea/预览实例；预览延后 180ms，源文本不延后。补充标签关联、校验聚焦、真实忙碌锁、导入类型/体积/多文件限制、未保存站内确认和刷新保护；保存栏随真实布局且考虑安全区。图片能力未实现时显示禁用与原因。
- 新增公共提示、编辑控制和 aria 文案进入简体/English/繁体词条。原有后台管理操作中的中文文案未扩展为一次完整翻译工程。

## 截图与真实录屏

同一开发演示数据（17 个目录、3 篇文章）、同一机器，桌面 1440×1000、移动 390×844，deviceScaleFactor=1。截图在网络空闲、字体就绪后采集。不是生产内容截图；原图可见性通过深浅截图人工核对。

| 代表页面   | 改造前                                                       | 改造后                                                     |
| ---------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| 首页／深色 | [before](ui-refactor/evidence/before/1440-dark-home.png)     | [after](ui-refactor/evidence/after/1440-dark-home.png)     |
| 首页／浅色 | [before](ui-refactor/evidence/before/1440-light-home.png)    | [after](ui-refactor/evidence/after/1440-light-home.png)    |
| 阅读／深色 | [before](ui-refactor/evidence/before/1440-dark-reading.png)  | [after](ui-refactor/evidence/after/1440-dark-reading.png)  |
| 阅读／浅色 | [before](ui-refactor/evidence/before/1440-light-reading.png) | [after](ui-refactor/evidence/after/1440-light-reading.png) |
| 搜索／深色 | [before](ui-refactor/evidence/before/1440-dark-search.png)   | [after](ui-refactor/evidence/after/1440-dark-search.png)   |
| 搜索／浅色 | [before](ui-refactor/evidence/before/1440-light-search.png)  | [after](ui-refactor/evidence/after/1440-light-search.png)  |
| 编辑／深色 | [before](ui-refactor/evidence/before/1440-dark-editor.png)   | [after](ui-refactor/evidence/after/1440-dark-editor.png)   |
| 编辑／浅色 | [before](ui-refactor/evidence/before/1440-light-editor.png)  | [after](ui-refactor/evidence/after/1440-light-editor.png)  |
| 移动首页   | [before](ui-refactor/evidence/before/390-dark-home.png)      | [after](ui-refactor/evidence/after/390-dark-home.png)      |
| 移动阅读   | [before](ui-refactor/evidence/before/390-dark-reading.png)   | [after](ui-refactor/evidence/after/390-dark-reading.png)   |
| 移动编辑   | [before](ui-refactor/evidence/before/390-dark-editor.png)    | [after](ui-refactor/evidence/after/390-dark-editor.png)    |

[真实交互录屏，30.56 秒](ui-refactor/evidence/after/interactions.webm) · [移动部分特写](ui-refactor/evidence/after/interactions-mobile.webm) · [操作时间线](ui-refactor/evidence/after/interactions-timeline.json)。含局部聚光、按钮按压、键盘搜索、#chunking 条件搜索、目录与侧栏收展、主题、移动抽屉、编辑/预览。移动特写来自同一真实录屏的裁切。

图片结束 SHA-256 与起点完全相同：`51532f73bf8b07873f30793ce8591531304924e077a81a1ccac15db42e5b5f45`，见 [校验记录](ui-refactor/evidence/image-integrity.json)。图文件、路径、背景尺寸/定位、三个 art 令牌未改；forced-colors 规则仍存在。

## 检查结果与复现

本地开发服务显式取消后端配置：

```sh
NUXT_PUBLIC_SUPABASE_URL='' NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='' npm run dev -- --host 127.0.0.1 --port 3002
```

| 实际执行                                                                                 | 结果                                                                                                       |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                                                           | 0 错误、12 条原有 void-element 自闭合格式警告；未改忽略项/关闭规则                                         |
| `npm run typecheck`                                                                      | 通过                                                                                                       |
| `npm test`                                                                               | 8 文件、37 测试通过；包含组件和安全测试。happy-dom 的 KaTeX quirks-mode 提示为既有测试环境提示             |
| `npx playwright test --config playwright.ui.config.ts`                                   | 28/28 通过，Chromium 与 WebKit 各 14 项                                                                    |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 npx playwright test tests/e2e/public.spec.ts` | 15 通过、2 既有条件跳过；demo 缺 TypeScript 课程和生产深层目录文章                                         |
| `npm run build`                                                                          | 相同 Vercel preset，在独立临时源码副本生产构建通过，未部署；保留上游大 chunk 提示                          |
| 36 个响应式场景                                                                          | 360/390/768/1024/1280/1440 × 深/浅 × 首页/阅读/编辑；横向溢出 0，关键控件可见                              |
| Better Interface 六域审查                                                                | 两个 HIGH（移动菜单裁切、搜索焦点不可见）和两个 MEDIUM（主题全页颜色过渡、移动目录焦点丢失）修复并复测通过 |

运行 Playwright 时使用本机已有 Chromium 可执行文件（`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`），测试工具为 Playwright 1.62.0，WebKit 为安装的 Playwright WebKit 26.5。未关闭浏览器检查或绕过开发错误遮罩。所有写入测试先断言 `.demo-strip` 存在，仅在当前内存演示中创建内容。

实际覆盖路由：`/`、`/knowledge/java-backend`、`/knowledge/java-backend/spring`、`/knowledge/java-backend/spring/spring-boot`、`/knowledge/java-backend/spring/spring-boot/spring-boot-introduction`、搜索进入 `/knowledge/rag/chunking/document-chunking-basics`，以及 `/admin`、`/admin/login`、`/admin/documents/new?folder=f-java`、保存后动态文档 ID、`/knowledge/this-route-does-not-exist`。演示路径来自仓库现有数据，未为截图改数据源。

新增验收涵盖 Ctrl/Command+K、连续开关、Tab/Shift+Tab、IME composition、正文搜索、长查询、标签、无结果/清空、多层滚动锁、三种语言/reduced-motion、SSR 禁 JS 正文、校验、主题/面板保留输入、保存后不误拦截、站内/后退/刷新取消保护、错误文件/多文件、120 节长文最新输入与预览、表格/任务/KaTeX/Mermaid、复制成功/失败、图表焦点和移动章节焦点。Chromium 取消刷新后 reload waiter 会保持等待，测试将该等待限定 3 秒，再断言原文仍保留；没有放宽内容断言。

日志：[lint](ui-refactor/evidence/lint.txt)、[Vitest](ui-refactor/evidence/unit.txt)、[双浏览器](ui-refactor/evidence/ui-tests-final.txt)、[原公开回归](ui-refactor/evidence/public-tests-final.txt)、[build](ui-refactor/evidence/build.txt)。[响应式矩阵](ui-refactor/evidence/after/responsive.json)、[六域审查](ui-refactor/evidence/interface-review.md)、[对比度样本](ui-refactor/evidence/contrast-audit.json)。

## 性能观察（不宣称线上 INP 改善）

同一 Node/Nuxt、生产 Vercel preset，对全部客户端 JS chunks 分别 gzip（不是单页首屏）：

| 指标             | 起点      | 本轮      |
| ---------------- | --------- | --------- |
| JS chunk 数量    | 90        | 92        |
| JS 原始字节      | 5,515,651 | 5,593,858 |
| JS gzip 字节合计 | 1,679,693 | 1,709,044 |

增加 29,351 gzip 字节（约 28.7 KiB），包含 motion-v 与新增逻辑；保留单一 Vue 动画引擎，没有引入全屏特效库。原有 Mermaid 等大 chunk 未在 UI 任务中改写。[before](ui-refactor/evidence/before/bundle.json) / [after](ui-refactor/evidence/after/bundle.json)。

开发服务器同尺寸 11 场景中，桌面阅读 CLS 从约 0.000145 到 0.000182，移动三个代表场景均 0；最终无 console/page error、失败请求或横向溢出。桌面深色首页资源数 216→235，资源传输合计 13,740,777→14,599,942 B；这些包含 Vite 开发模块与原图，受开发模块预编译/缓存影响，不当作生产请求预算或性能提升。[before metrics](ui-refactor/evidence/before/metrics.json) / [after metrics](ui-refactor/evidence/after/metrics.json)。

匿名只读访问当前生产 `https://knowledge.damnatiox.com`：314 篇公开文章、71 个可见目录、0 草稿；正文 1,092,476 字符/1,782,145 UTF-8 B，HTML 解压 2,351,316 B，传输 828,508 B，另 36 个资源传输 2,507,180 B。单次无节流冷访问 TTFB 944 ms、DCL 6265 ms。查询至第二 rAF 25–159 ms，不是纯过滤时间、更不是线上 INP。现有 `select('*')` 没有 range/分页，正文都在 SSR 状态中；当前匿名可见 314 不证明数据库全量或将来超过后端返回上限时仍覆盖完整。目录树目前无需凭空引入虚拟化；建议独立评估首屏轻量元数据、正文按需加载和保留全文能力的搜索接口/索引，明确分页和排序后再实现。[完整只读测量](ui-refactor/evidence/production-readonly-performance.json)。生产仍是起点代码，本轮未部署，因此该测量不是重构后的线上成绩。

## 风险复现、限制与回退

从仓库根目录可执行 `node < docs/ui-refactor/evidence/risk-audit.cjs.txt`。该脚本仅用 mock 执行未改动的 useKnowledge/useAuth，不接真实网络。八项结果见 [记录](ui-refactor/evidence/data-risk-results.txt)。

- 草稿缓存：先 `load(false,true)`，再 signOut，再公共 `load()`；旧草稿仍在客户端且没有新查询。最小后续方案是退出/角色变化清缓存并隔离请求代数，服务器权限是否正确需独立后端测试。
- 并发读取：挂起首次公开 load，期间请求 includeDrafts，后者提前返回且不重试。建议共享/串行等待中的 Promise，按所需权限范围确认完成。
- 源文档：编辑有旧 storage path 的文档但不传新文件，正文变而源文件不变；导入后编辑仍持有最初 File。需先确定“原始附件”还是“最新 Markdown”的产品语义。
- 部分成功：分别模拟上传失败、storage 指针更新失败、写后刷新失败、排序第二步失败、删存储后删行失败，可看到已写数据库/已删文件和用户收到的失败/成功不一致。后续需结构化部分成功结果、错误检查与幂等恢复；这次没有改动后端/存储函数。

未验证：真实账户登录/退出/角色变化、生产 Realtime 推送、后端断网后重试、真实 Storage 保存/删除、物理 Safari/iOS 软键盘/安全区、系统 200% 缩放、真实屏幕阅读器和操作系统输入法。IME 使用浏览器 composition 事件，WebKit 自动化不能替代所有 Safari 设备；CSS/dvh/安全区和 16px 字号只是实现与模拟检查，不是实机认证。已有 backend/frontend/software-engineering 专项 E2E 依赖生产课程数据，本轮未用 demo 冒充执行通过。对比度为代表样本，未宣称原图任意位置或全部渐变组合均测完。原有依赖 audit 风险未借 UI 重构升级主版本。

回退：所有本轮代码、设计规范与证据集中在 `codex/ui-ux-refactor` 的本地提交，主分支保持 `1270e58` 起点。工作区干净时切回原分支即可恢复旧界面；若以后合并，可 revert 本轮提交，不需数据库回滚。没有生产部署、内容同步、迁移、种子或在线内容写入。

## 后续授权生产发布（2026-10-05）

用户在本轮本地交付后明确要求“推送部署”，因此此前“不推送/不部署”的范围限制已被该后续授权更新。应用提交 `1e55c0f` 已推送到 GitHub 的 `main` 与 `codex/ui-ux-refactor`。Git 集成自动触发生产部署 `dpl_5ne4kffAVXy6o7WVD1QrBwmtW5Yz`，READY，云端构建 81 秒，正式域名 https://knowledge.damnatiox.com 。

生产只读回归运行 20 项：19 项首次通过；原有通用文本定位器误命中折叠树中包含“知识库”的隐藏文章摘要。已将它限定到面包屑的精确链接，保留可见性断言，目标用例复验通过（19 + 1，共 20 项）。未修改产品逻辑来迁就测试。另验证新标签条件搜索、ArrowDown 活动项、关闭后焦点恢复；HTTP200、非 demo、浏览器运行异常 0，线上原图 SHA-256 与保护基线一致。

本次部署最近 10 分钟错误级日志查询无记录；这是查询窗口的观测，不代表长期无错误。本次未新增监控或 Drains。未执行认证后的生产写入、内容同步或数据库变更，前述数据风险仍保留。

证据：[部署状态](ui-refactor/evidence/deploy-production.txt)、[20 项首轮记录](ui-refactor/evidence/production-tests.txt)、[定位修正复验](ui-refactor/evidence/production-route-retest.txt)、[新交互与原图校验](ui-refactor/evidence/production-smoke.json)、[错误日志查询](ui-refactor/evidence/production-errors.txt)。
