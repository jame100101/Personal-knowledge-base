# 先用假模型跑明白 Agent Loop

这份练习使用 Node.js 22.12+ 的内置能力，没有 API Key、网络调用或真实文件写入。模型由一个按顺序返回结果的函数代替；先检查运行规则，再接入真实模型。

在仓库根目录运行：

```bash
node --test examples/agent-loop/loop.test.mjs
```

先读第一个测试：模型请求读取 n1 → 运行时检查参数与权限 → 工具返回 hello → 下一轮模型收到带调用 ID 的结果。然后依次观察参数错误、权限拒绝、重复调用、权限撤销、取消、超时与步数耗尽。

可以暂时删掉执行工具前的权限判断，运行测试，观察拒绝用例失败；恢复代码后再继续。不要拿真实写入工具做这个实验。

## 这份代码的边界

- 每轮只有一个工具调用，使用自定义教学消息格式。它不是任何厂商 SDK 的协议适配器，也没有实现 JSON Schema 全套规则。
- `complete` 只表示模型给出最终文本，不表示答案事实已经核验。
- 超时让调用方停止等待，并传递取消信号。工具必须协作取消；已经提交的外部副作用不会回滚，同线程阻塞代码也不能被计时器强制终止。
- 回执只保存在当前进程的一次运行内，以精确序列化输入识别同一调用。它不能解决进程崩溃后重放，更不是业务层的“恰好一次”。生产写入需要持久化状态、业务幂等键及冲突处理。
- 工具是受信任的进程内代码，返回可结构化克隆的数据。此例没有沙箱、跨租户存储、并发调度、输出字节限制或跨进程恢复。

## 机制依据

本实现与练习是本项目的教学设计，不是下面项目的代码摘抄。2026-10-25 查阅：

- [OpenAI Agents SDK：工具执行与审批](https://openai.github.io/openai-agents-python/human_in_the_loop/)
- [LangGraph：中断后的恢复与副作用重放](https://docs.langchain.com/oss/python/langgraph/interrupts)
- [Node.js：AbortController 与 AbortSignal](https://nodejs.org/api/globals.html#class-abortcontroller)
