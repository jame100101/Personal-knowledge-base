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

<!-- evidence-update:2026-10-25 -->

## 给被删掉的材料也留一条记录

可以从三份材料练起：一条当前报错、一份已经过期的配置、一份当前配置。装配前先记下各自的文件路径和版本，再决定把哪些内容送给模型。过期配置可以不放，但记录中要写“被当前版本替代”，否则排查时只会看到它突然消失。

这里的 `trust` 是应用的分类标签，不会让文本天然安全。给网页标上 `untrusted` 后，仍然要让权限检查在工具执行前生效。也别把密钥装进 Manifest 或 trace；记录“使用了认证服务”通常已经足够，不需要记下认证秘密。

做一个小检查：只查看 Manifest，能否找到回答引用的文件和版本？再只查看发给模型的请求，确认它没有包含本地 context 中的数据库连接或密钥。这两项分别检查可追溯性和数据边界。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [OpenAI Agents SDK：本地 context 与模型 context（固定提交）](https://github.com/openai/openai-agents-python/blob/0dc4cf152bff1f50bdc0e41f28808563406545b2/docs/context.md)
- [OWASP：提示注入的分层防护](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html)
