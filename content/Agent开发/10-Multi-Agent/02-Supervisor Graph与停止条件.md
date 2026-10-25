# Supervisor、Graph 与停止条件

多个 Worker 同时工作时，总要有人知道哪些结果已经齐了、哪些任务还在等待。Supervisor 或任务图可以承担这种协调，但仍要规定何时结束。下面把局部任务与全局状态分开讨论。

## 1. Supervisor 模式

Supervisor 保存全局任务图和共享证据，Worker 只处理局部任务：

```text
Supervisor
  -> Planner
  -> Worker A ─┐
  -> Worker B ─┼-> Aggregator -> Reviewer -> Supervisor
  -> Worker C ─┘
```

Supervisor 不是另一个无边界聊天 Agent。它应有确定性职责：分派、检查依赖、限制并发、验证输出、解决冲突、更新状态和终止。

## 2. Graph 编排

把工作流表示为带状态的图：

- 节点：Agent、工具、验证器或人工确认；
- 边：条件转移；
- 状态：共享或分区数据；
- checkpoint：可恢复执行点；
- reducer：并发结果合并规则。

Graph 适合可控编排；模型只在需要判断的节点决策，确定性节点处理验证和路由。

## 3. 停止条件

每个任务和整个系统都要有：

- 完成条件；
- 最大迭代；
- deadline 与预算；
- 无进展阈值；
- reviewer 最大返工次数；
- 冲突升级策略；
- 人工确认状态；
- 取消传播。

例如 writer-reviewer 循环最多两轮；之后输出剩余问题，而不是无限润色。

## 4. 并发与合并

- 只读研究可并行；
- 同一文件写入使用分区、worktree 或串行合并；
- 共享状态采用版本和 reducer；
- 结果必须包含 task ID 与基线版本；
- 合并后重新运行全局验证；
- 子任务取消要向工具请求传播。

## 5. 失败传播

Worker 失败不必让全局任务立即失败。Supervisor 根据任务关键性决定：

- 同参数重试；
- 换 Worker 或工具；
- 缩小任务；
- 使用部分结果；
- 标记阻塞；
- 终止依赖节点。

失败记录需要保留已尝试策略，防止其他 Worker 重复同样路径。

## 6. 测试

- Worker 永久挂起；
- 两个 Worker 同时修改同一资源；
- Reviewer 每次提出新范围；
- 子任务结果 schema 错误；
- Supervisor 重启；
- 用户取消；
- 某分支部分成功；
- Graph 出现环。

<!-- evidence-update:2026-10-25 -->

## 等待、失败和完成要有不同的出口

设三个 Worker 中有一个需要用户补充信息。此时它不是成功，也不是应该立即重试的失败；协调者需要保留“等待输入”的状态，并决定其他独立任务能否继续。

可以先用普通函数模拟 Worker，分别返回完成、等待和失败，再画出每种结果走向哪里。LangGraph 的工作流示例展示了条件路由，interrupt 则提供等待外部输入的机制。恢复时注意节点会重跑，审批前不要放不可重复的写操作。

练习给全局设置一个统一预算，并让某个 Worker 永远返回“还要再检查”。协调者最终应交代已完成部分和未完成原因，而不是为了等所有结果无限循环。最大轮数是本项目的策略，需要由任务成本决定。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [LangGraph：工作流与 Agent 模式](https://docs.langchain.com/oss/python/langgraph/workflows-agents)
- [LangGraph：中断与恢复](https://docs.langchain.com/oss/python/langgraph/interrupts)
