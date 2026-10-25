# Evaluation 闭环、Trace 与发布门

一次评测结束后，真正有用的不是只留一个总分，而是知道哪些任务退步、为什么退步，以及是否应该发布。下面把数据集、执行记录、检查器和发布条件连起来，让每次改动都有可比较的结果。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `stable evaluation architecture`
> - `source_type`: `engineering synthesis`
> - `stability`: `stable-concept`

## 最小数据模型

- Dataset：带版本的 case 集合；
- Task：goal、initial state、constraints、allowed actions；
- Environment：可重置的 repo/browser/API/sandbox；
- Trace：model/tool/control 事件与 artifact；
- Validator：确定性检查优先，judge 补充开放质量；
- Metrics：success、reliability、cost、latency、security；
- Run：代码、prompt、model、tool schema、dataset、environment 的完整版本组合。

```mermaid
flowchart LR
  D[Versioned Dataset] --> R[Run]
  R --> T[Trace + Artifacts]
  T --> V[Validators/Judges]
  V --> M[Metrics + Failure Taxonomy]
  M --> G{{Regression Gate}}
  G -->|pass| P[Release]
  G -->|fail| F[Investigate]
```

## A/B 与回归

比较两版系统时，让同一个用例从相同初始状态出发，使用相同预算。模型存在随机性时需要重复运行，并报告结果波动；最好逐个配对比较，而不只看总平均。

发布条件可以包括：关键任务没有退步，所测权限用例没有违规，延迟和成本在约定范围内，已知问题没有复发。这里的“没有违规”指测试覆盖范围内的结果，不是对所有未来输入的保证。

## Trace 不是越多越好

Trace 事件需有 `trace_id/span_id/event_type/timestamp/attempt/tool_call_id/state_before/state_after/evidence_ref`。敏感 prompt、secret 和用户数据按字段脱敏与 retention policy 管理。可观测性用于定位，不应成为新的数据泄漏面。

<!-- evidence-update:2026-10-25 -->

## 不要让平均分藏住最贵的一次失败

假设新版在 20 个练习任务中多答对了两个，却把一次“只预览”的操作直接提交了。总成功数上升，不意味着这次版本适合发布。可以先把权限边界、核心任务和体验指标分开看，再决定哪些失败必须阻止上线。

把旧版与新版放在相同初始环境中逐题比较，并保存每题的检查结果。代码修复可以借鉴 SWE-bench 的方式，用实际补丁和测试验收；开放问答则需要额外检查证据支持度。不能让系统自己说“任务成功”就记一分。

再选三道失败题手动看 trace：一次工具故障、一次材料不足、一次答案不合要求。把改动对准真正原因，再复跑这些题和未参与修复的保留题。这里的 20 个任务是教学规模，不能据此宣称已经覆盖真实生产分布。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [SWE-bench：评测输入、环境与结果](https://www.swebench.com/SWE-bench/guides/evaluation/)
- [OpenTelemetry：GenAI Agent span 语义约定](https://github.com/open-telemetry/semantic-conventions-genai/blob/main/docs/gen-ai/gen-ai-agent-spans.md)
