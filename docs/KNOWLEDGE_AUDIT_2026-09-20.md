# 知识库核查与发布记录：2026-09-20

## 范围与结论

全库 243 篇（Agent 91、Java 127、语言基础 25）完成文件、标题、链接、代码组和版本风险盘点；本次按证据修订 **46 篇**。具体清单见 `scripts/knowledge-audit-manifest.json`，发布基线为 `228a5821eb2c3f31e31575ea4b2b2fcb2bb7b4aa`。

这是一轮全库风险筛查和重点事实修订，不是“每个知识点都经过运行证明”的证书。未修改的条目仍明确记录为风险筛查；历史源码研究保留原快照和核验日期，新证据单独标明固定提交。未执行全部文章中的多语言片段、论文实验或各 Agent 的完整测试套件。

## 修正和补充

| 主题 | 处理 |
|---|---|
| 原书章节 | 对齐 `bojieli/ai-agent-book` 固定书稿的 10 章；评估链接改为第 7 章，上下文第 2 章，知识与记忆第 3 章 |
| Java 发布与框架兼容 | 核对 JDK 27 发布、结构化并发预览状态；保留 JDK 25 教学基线，分别注明 Boot、Cloud、Alibaba、Spring AI 支持范围 |
| Java 构造器 | 修正 `super(...)` 永远必须第一句的旧规则，说明 Java 25 灵活构造器体及早期构造限制 |
| 构建工具 | 分清 Toolchain 与 `--release`，避免把选择编译器误当作目标平台兼容检查 |
| Spring | singleton 明确到每容器每 Bean 定义；around advice 的 proceed 允许按语义零次、一次或多次 |
| 浏览器 | 修正 fetch 只在网络错误时拒绝、所有 DOM 事件都会冒泡的过度概括 |
| 分布式与运维 | 区分 Seata 各模式恢复责任；说明 NetworkPolicy 并非默认全部拒绝；SLO 不是定义上禁止 100% |
| Agent Runtime | 区分条件 Workflow 与模型选动作；只读工具仍需范围授权；压缩摘要不等于持久化 checkpoint；缓存策略按供应商接口解释 |
| 原书新增主题 | 补充事件队列、异步/并发/并行、取消与恢复、语音打断、机器人控制边界；补充演进评估集泄漏、奖励与信用分配 |
| 现代 Agent | 10 篇研究增加固定提交的增量核对；补充 Codex、Hermes 等源码导航，纠正 pi/Goose 仓库身份 |
| Grok Build | 继续读取新树 session 命令泵、工具批次、worktree 恢复与 scheduler actor；区分目录隔离与沙箱、文件锁与事务 |
| TypeScript | 核对版本说明，补充模块与 tsconfig 升级的解释；保留既有示例基线 |

各篇正文在相应段落提供官方来源，而不是统一挂一个无法追溯到结论的链接。新增解释优先用订单、构建任务、代码修复等场景，按“遇到什么问题—概念是什么—怎样使用—边界在哪里”展开，保留现有代码示例与图表。

## 证据文件

- `audit/content-inventory-2026-09-20.json`：243 篇的内容哈希、版本线索与审查范围；启发式标记不等于事实错误。
- `audit/book-source-map-2026-09-20.json`：原书 10 章固定 URL、SHA-256 和本站目录映射；书稿提交 `4dc4429d56ff9c5d7cc7dcbc971cfcd6a618d674`。
- `audit/source-review-2026-09-20.json`：10 个 Agent 的固定提交、阅读入口和覆盖边界。
- `audit/additional-source-evidence-2026-09-20.json`：本轮读取 Grok Build 新树实现的哈希。
- `audit/upstream-check-2026-09-20.json`：第一次远端检查的原始失败/变更结果，没有把网络异常算作成功。
- `audit/upstream-recheck-2026-09-20.json`：通过 GitHub API 重试 Codex、Claude Code、Aider、OpenCode 以及刷新 OpenClaw 的结果。

OpenClaw 后续检查固定到 `044f78eeae1a17af03ef07415641a98ead48830d`；其架构入口和 agent-loop 文档与此前读取版本逐字一致。这不表示两个提交之间所有实现文件都无变化。

参考了用户指定的 [awesome-agent-skills](https://github.com/heilcheng/awesome-agent-skills) 索引与 doc-coauthoring 的资料收集、结构修订、读者问题检查方法。未安装整个第三方集合，也未执行上游脚本。

## 本地验证

- Vitest：8 个文件、35 项测试通过，包含全库目录完整性。
- Python 审查工具：10 项测试通过（含网络失败、空响应和无效 SHA）。
- 全库结构：243 个唯一标题、199 张 Mermaid 图、21 个相对链接，0 错误。
- Agent 代码组：59 组、236 个编程代码块；各组 Python/Rust/JavaScript/TypeScript 保留，137 个 text 块跳过。
- TypeScript：25 篇、133 个示例、66 个官方链接，检查通过。
- Typecheck 与 Nuxt 生产构建通过；本轮修改的发布与浏览器脚本 ESLint 通过。
- 46 篇原有的 261 个围栏代码/图表块保持不变；这是保全检查，不是示例全部运行成功。
- 测试环境原有 KaTeX quirks-mode 提示和构建体积提示不视为内容核验结果。

## 发布方式与复验命令

发布工具增加可选 `--manifest`，默认旧流程保持不变。先比较线上正文与固定 Git 基线，发现后台改动就停止；写入前保存备份，更新时匹配 `updated_at`，并核对 id、标题、slug、文件夹、排序均未改变。此次不使用全量重新导入。

```bash
python3 scripts/audit-knowledge.py --output .tools/knowledge-audit/inventory.json
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests/content -v
python3 scripts/check-knowledge-upstreams.py --output .tools/knowledge-audit/remote-heads.json
node scripts/publish-editorial-pass.mjs --manifest scripts/knowledge-audit-manifest.json
node scripts/publish-editorial-pass.mjs --manifest scripts/knowledge-audit-manifest.json --verify
node scripts/verify-editorial-browser.mjs --all
```

Windows 使用已安装的 Python/Node。`--apply` 需要通过临时环境提供管理员邮箱与密码；不应将凭据写入提交。浏览器测试可用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定本机 Chrome。

上游检查退出 0 表示记录来源的 HEAD 一致，1 表示获取失败，2 表示有变化待复核。源码更新提示不是自动批准覆盖正文。

## 保留的审查边界

- 全库盘点不等于全部段落均逐句复核；明细中保留真实审查范围。
- 原书语音、机器人、演进与训练主题增加概念解释，未宣称复现设备实验或训练结果。
- 各 Agent 的旧深度分析仍是带日期的历史快照，新的静态核对没有自动为旧文所有实现细节背书。
- 工作区已有的应用代码、测试和 TS 文档行尾差异保持原样，不混入本次提交。

## 线上正文发布与验收

- Supabase 选择性发布 46 篇，写入前备份到忽略目录 `.tools/content-backups/`；随后 `--verify` 检查 46 篇全部一致、待更新 0。
- 线上目录核对：Agent 91、Java 127、语言基础 25；无缺失、无额外文档、无推荐阅读排序异常。
- 浏览器逐篇验收 46 篇：HTTP 200、正文开头匹配、全部 h2–h6 与目录顺序一致、无页面脚本错误；390/820/1280px 无横向溢出。
- 现有线上 Playwright 17 项通过，覆盖动态路由、搜索、主题、图表按钮、多语言、目录及 390/768/820/1024/1180px 响应式布局。
- `/api/health` 返回 HTTP 200、`status=ok`、`database=ok`。
- 上述是推送前正文与现有应用的验收；新的 Git 提交对应 Vercel 构建状态还需在推送后独立核对，不以本段替代部署证据。
