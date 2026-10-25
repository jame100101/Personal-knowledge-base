# Tool Registry、Permission Gate、Session Store 与 Compaction

工具列表、用户权限、会话状态和历史压缩常出现在同一个运行过程中，却各有职责。先用一次读取文件的调用把它们连起来，再看分别怎样管理，能避免把所有状态都塞进一个不断增长的对象。

## 1. Tool Registry

Registry 管理工具元数据、版本、handler 和 capability。它需要支持：

- 名称冲突检测；
- 按会话、角色、平台选择可见工具；
- provider schema 转换；
- 工具搜索与延迟加载；
- 禁用或降级不可用工具；
- 版本和 deprecation；
- 统一 metrics 与 hooks。

Registry 决定“系统拥有什么”，Router 决定“本轮暴露什么”。

## 2. Permission Gate

Permission Gate 应位于工具解析之后、handler 之前。输入使用规范化参数，输出包含 allow/deny/ask、规则 ID、范围和过期时间。确认结果只覆盖精确动作，不能模糊扩展到未来所有参数。

## 3. Session Store

推荐层级：

```text
Thread: 用户可持续对话
  Run: 一次目标执行
    Turn: 一次模型决策
      ToolCall / ToolResult
```

存储：

- 当前目标和状态；
- 消息与摘要版本；
- tool call/result；
- EvidenceItem；
- 权限确认；
- checkpoint；
- usage、成本和错误。

并发更新使用乐观锁、版本号或事务，避免子任务覆盖主任务状态。

## 4. Context Compaction

Compaction 是给后续模型请求整理一份更短的工作上下文。它应保留能继续工作的信息，但**摘要本身不等于持久化 checkpoint**：进程崩溃后要可靠恢复，还需要单独保存任务状态、工具调用 ID、已发生的副作用以及产物位置。

可以这样记：摘要回答“接下来的人需要知道什么”，checkpoint 回答“程序究竟执行到哪里，哪些动作已经发生”。把两者混成一段自然语言，会使重启后的系统误重复执行工具。压缩上下文时至少保留：

- 当前目标和成功标准；
- 已完成/未完成任务；
- 关键决策及理由；
- 已产生的副作用；
- 失败尝试与禁止重复动作；
- 证据 ID 和外部存储定位；
- 当前权限与预算。

## 5. 组合不变量

- Registry 暴露的工具必须经过 Permission Gate；
- Permission 决策与实际执行参数一致；
- ToolResult 在 session 提交后才对后续 turn 可见；
- Compaction 不丢失未决确认和 tool call 配对；
- 恢复后先核对外部状态，再继续；
- Trace 能关联 thread/run/turn/call。

## 6. 测试

- 工具热加载时会话是否使用正确版本；
- Permission 确认后参数被修改是否重新确认；
- 并发 tool result 是否丢失；
- Compaction 前后成功条件是否一致；
- 崩溃恢复是否重复写操作；
- 旧 trace 能否用对应 schema 解码。

<!-- evidence-update:2026-10-25 -->

## 工具列表变了，旧审批还能不能用

工具目录只是“现在有哪些能力”的清单。假设 `read_ticket` 原来只读标题，后来升级为同时导出附件，即使名字没变，数据访问范围也变了。运行时需要重新判断实际参数、身份和资源，不能把发现了工具等同于已经授权。

Agents SDK 的能力可见性回调决定工具是否向本轮开放，但文档明确提醒：这不能授权模型后来选择的具体参数。审批状态也可能随 RunState 恢复；换一份 context 对象，不代表旧审批已经清空。

练习可以用同名的两个假工具，分别只读和读写。恢复旧会话时先检查工具版本与权限，再决定继续、要求新授权还是停止。把决定写成可观察事件，后面才有办法解释一次意外动作。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [OpenAI Agents SDK：本地 context 与模型 context（固定提交）](https://github.com/openai/openai-agents-python/blob/0dc4cf152bff1f50bdc0e41f28808563406545b2/docs/context.md)
- [OpenAI Agents SDK：审批与恢复（固定提交）](https://github.com/openai/openai-agents-python/blob/0dc4cf152bff1f50bdc0e41f28808563406545b2/docs/human_in_the_loop.md)
