# Trace、调试、失败恢复与 Validation

Agent 报告“任务失败”，还不够帮助排查。需要知道它看到了什么、选择了哪个动作、工具实际返回什么。Trace 把这些事件串起来；恢复与验证则利用记录判断从哪里继续，以及结果是否真的完成。

## 1. Trace 的最小字段

```python group=multi-ea046a61e0c3 label=Python
from dataclasses import dataclass, field
from typing import Any

@dataclass(frozen=True)
class TraceEvent:
    trace_id: str
    span_id: str
    thread_id: str
    run_id: str
    event_type: str
    started_at: str
    status: str
    attributes: dict[str, Any] = field(default_factory=dict)
    parent_span_id: str | None = None
    turn_id: str | None = None
    duration_ms: int | None = None
```

```rust group=multi-ea046a61e0c3 label=Rust
use std::collections::HashMap;
use serde_json::Value;

struct TraceEvent {
    trace_id: String,
    span_id: String,
    parent_span_id: Option<String>,
    thread_id: String,
    run_id: String,
    turn_id: Option<String>,
    event_type: String,
    started_at: String,
    duration_ms: Option<u64>,
    status: String,
    attributes: HashMap<String, Value>,
}
```

```javascript group=multi-ea046a61e0c3 label=JavaScript
/**
 * @typedef {{
 *   traceId: string,
 *   spanId: string,
 *   parentSpanId?: string,
 *   threadId: string,
 *   runId: string,
 *   turnId?: string,
 *   eventType: string,
 *   startedAt: string,
 *   durationMs?: number,
 *   status: string,
 *   attributes: Record<string, unknown>
 * }} TraceEvent
 */
```

```typescript group=multi-ea046a61e0c3 label=TypeScript
type TraceEvent = {
  traceId: string
  spanId: string
  parentSpanId?: string
  threadId: string
  runId: string
  turnId?: string
  eventType: string
  startedAt: string
  durationMs?: number
  status: string
  attributes: Record<string, unknown>
}
```

敏感值做脱敏或只存引用；大工具输出存对象存储，trace 只保留 hash 与定位。

## 2. 故障定位分层

- Prompt/Context：目标或约束缺失、摘要丢信息；
- Model：选择错误工具、格式漂移；
- Tool：参数、超时、外部依赖；
- Retrieval：召回或排序错误；
- State：并发覆盖、恢复不一致；
- Permission：策略误判或范围过宽；
- Validation：成功标准不完整；
- Product：用户目标本身定义错误。

分类能把“模型失败”拆成可行动的问题。

## 3. Replay

重放分两种：

- **Deterministic replay**：复用已记录模型响应和工具结果，验证状态机、UI、finalizer。
- **Live replay**：重新调用模型/工具，评估新版本行为。

Live replay 可能产生副作用，需要 mock、dry-run 或幂等环境。记录 prompt、model、temperature、tool schema 版本和代码 commit。

## 4. 恢复

检查点应在状态和副作用之间建立清楚顺序：

1. 记录 intent；
2. 执行带幂等键的动作；
3. 查询并验证结果；
4. 提交完成状态。

恢复时遇到 intent 未完成，先查询外部状态，不直接重复动作。

## 5. ValidationResult

```json
{
  "passed": false,
  "checks": [
    {
      "name": "unit-tests",
      "status": "failed",
      "evidence_ids": ["E17"],
      "message": "2 tests failed"
    }
  ],
  "missing": ["production health check"]
}
```

Validation 既可以是确定性测试，也可以是模型评审，但两者要区分。构建、schema、权限、文件存在性等优先使用确定性检查。

## 6. 可观测指标

- 任务成功率；
- 首次成功率；
- 每任务 turn/tool 数；
- 重试和循环率；
- tool error 分类；
- latency 分位数；
- token/金额；
- compaction 次数；
- 人工确认等待；
- 恢复成功率；
- 验证失败原因。

<!-- evidence-update:2026-10-25 -->

## 恢复一段会话时，先找结果未知的动作

最值得演练的情况不是“还没调用就断了”，而是外部服务已经创建工单、客户端却没收到响应。trace 里此时只能写结果未知，不能直接写失败；否则恢复逻辑容易再次创建。

LangGraph 的 interrupt 在恢复时会从所在节点开头重跑，因此暂停点之前的副作用也可能再次发生。可以把审批前的准备做成只读步骤，把实际提交放到批准后，并为提交保留业务幂等标识。

练习不需要真实服务：用一张内存表模拟工单，提交后故意抛出异常，再执行恢复。检查最后是否只存在一张工单。单机内存演示只能说明控制逻辑；跨进程场景还需要真实持久化和并发测试。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [LangGraph：interrupt 恢复时会重新执行节点](https://docs.langchain.com/oss/python/langgraph/interrupts)
- [Pydantic AI：持久执行与存储的区别（固定提交）](https://github.com/pydantic/pydantic-ai/blob/4ee11516b5be6b767654304ec8fe346b81369597/docs/durable_execution/overview.md)
