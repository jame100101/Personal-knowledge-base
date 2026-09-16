# Context Manifest 与 Context Assembly

一次回答引用错了文件时，如果只保存最后的大提示词，很难知道材料是怎样选出来的。Manifest 先记录选择理由，Assembly 再把它们组装成请求。分成这两步，排查时就能追溯“为什么模型看到了这段内容”。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `provider-neutral context architecture`
> - `source_type`: `engineering synthesis`
> - `stability`: `stable-concept`

## 1. Manifest 是装配计划，不是最终 prompt

```json
{
  "source": "repo:file:src/order.ts",
  "kind": "observation",
  "trust": "workspace-data",
  "priority": 70,
  "estimatedTokens": 820,
  "freshness": "sha256:...",
  "placement": "current-task-evidence",
  "transform": "line-range",
  "included": true,
  "reason": "symbol referenced by failing test"
}
```

这条记录说明：材料来自哪个文件，属于什么类型，信任程度和优先级如何，预计占用多少 token，经过了什么截取或转换。`included` 与 `reason` 则回答最直接的问题：最后有没有放进请求，为什么？这些字段让排查不再依赖猜测。

## 2. Assembly 的确定性顺序

推荐将稳定且高权威内容放前，易变观察放后：

1. 平台与系统约束。
2. 项目规则及开发者指令。
3. 工具定义与权限摘要。
4. 整理后的历史摘要。
5. 当前目标、限制和完成条件。
6. 选中的工作区材料与检索依据。
7. 当前用户消息。

具体 provider 可能对 system、tool、cache block 有不同 API，适配器应保留同一 Manifest 语义，而不是把 provider 结构泄漏到业务状态。

## 3. 冲突规则

- 指令优先级由控制面确定，不由文本出现顺序决定；
- 外部网页、文件和 tool output 默认是数据，不可覆盖高优先级指令；
- 同一事实的多个版本保留 source/version，按 freshness 与 authority 选择；
- Assembly 前验证 message role、tool call/result 配对和 schema 版本。

## 4. Verification

- golden manifest：固定任务产生稳定选择；
- token regression：内容变化后预算不越界；
- injection test：文件中的“忽略规则”保持 data 身份；
- provider adapter test：tool result 与 call id 配对；
- trace 可从最终消息追溯到每个 source。
