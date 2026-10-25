# P0–P7 Agent 工程项目阶梯

从一个小工具循环开始，逐步加入停止、检索、计划和恢复。阶段编号是安排练习的方法，不要求所有产品都配齐全部能力。每一级先证明它解决了当前问题，再继续下一步。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `2026 curriculum`
> - `source_type`: `engineering synthesis`
> - `stability`: `version-sensitive`

每一级只引入解决当前问题所需的组件；验收需要 trace 与失败 case，而非录屏。

| Level | Goal | Required Components | Non-goals | Acceptance Tests | Failure / Evidence |
|---|---|---|---|---|---|
| P0 Tool-calling Agent | 单轮选择一个只读工具 | model、schema、parser、mock tool | ReAct、memory、plan | 正确工具/参数；非法参数不执行 | raw/parsed event、result |
| P1 Minimal ReAct | 多轮 observation→action→final | state、tool result、max steps | planner、RAG | 两工具链路；可停止 | step trace、stop reason |
| P2 Minimum SWE Agent | 在小仓库定位、修改、测试 | file I/O、shell、diff、test | multi-agent、长期 memory | 给定 issue 的测试通过 | patch、command log、tests |
| P3 Reliable SWE Agent | 处理超时、失败、取消、重复动作 | validation、retry class、budget、cleanup | durable queue | 错误注入下状态一致 | failure taxonomy、no orphan process |
| P4 Agent Harness | 抽离 context/tool/runtime/policy/session | registries、context manifest、permission、trace | 自动进化 | provider/tool 可替换 | contract/component tests |
| P5 Coding Agent | 支持大型 repo 与交互式开发 | JIT retrieval、compaction、skills、ACP/MCP 可选 | 默认 multi-agent | 多文件任务、上下文压缩后继续 | manifest、citations、reviewable diff |
| P6 Durable Agent | 重启后继续长任务 | checkpoint、lease、idempotency、reconciliation | 跨域自治 | kill/restart/duplicate delivery | persisted state、recovery trace |
| P7 Production Agent | 以 SLO 运营并受控发布 | eval gate、security、cost、observability、runbook、rollback | 追求“全自主” | canary、回归、安全与故障演练 | dashboard、incident/runbook evidence |

## 逐级边界

- P0/P1 不需要 RAG、Memory、Plan、Skills 或 Multi-Agent。
- P2 的核心是 ACI、patch 与测试证据，不是聊天体验。
- P3 先解决可靠性，再在 P4 抽象 Harness。
- P5 只有能力目录变大时才引入 progressive disclosure。
- P6 的 durable state 不得只依赖对话历史。
- P7 的毕业标准是可运营、可审计、可回滚。

<!-- evidence-update:2026-10-25 -->

## 每升一级，只引入一个新问题

可以给整条路线固定一个“工单助手”：先回答一条工单，再加入只读工具；随后加入资料检索、跨会话偏好、审批和故障恢复。数据与任务尽量不变，才容易看出新增机制解决了什么问题。

每一级都保留上一版测试。加入记忆后，要检查是否串用户；加入子 Agent 后，要检查共享文件冲突；加入恢复后，要检查重复提交。不要为了凑齐架构名词，把所有机制一次放进最初版本。

当前框架的最小循环和持久执行能力可以作为参考，但本章的 P0–P7 是教学顺序，不是行业认证等级。最后交付的证据应是可复现的任务、失败案例和测试结果。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [Agents SDK：运行循环（固定提交）](https://github.com/openai/openai-agents-python/blob/0dc4cf152bff1f50bdc0e41f28808563406545b2/docs/running_agents.md)
- [Pydantic AI：持久执行（固定提交）](https://github.com/pydantic/pydantic-ai/blob/4ee11516b5be6b767654304ec8fe346b81369597/docs/durable_execution/overview.md)
