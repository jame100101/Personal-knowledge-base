# Agent Loop 推荐阅读

读循环实现之前，先想一个很小的任务：读取文件中的数字，再调用计算工具得到结果。只要能看清调用、结果回传和停止条件，就已经有了合适的起点。下面的资料用于逐步补上错误处理，而不是比谁的框架更复杂。

1. [ReAct](https://arxiv.org/abs/2210.03629)：理解 reasoning 与 acting 交错的基本范式。
2. [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)：学习原生工具调用、严格 schema 与多调用消息结构。
3. [Anthropic Tool Use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview)：关注 `tool_use` / `tool_result` 消息契约。
4. [Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling)：比较不同提供商的工具声明和响应格式。
5. [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)：观察 loop、handoff、guardrail、session 与 tracing 如何进入 SDK。

阅读后建议实现一个 50～150 行的最小 Agent，至少包含 calculator、read_file 两个工具，并为非法参数、超时、最大步数写测试。
