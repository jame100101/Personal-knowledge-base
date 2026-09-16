# Agent Harness 推荐阅读

阅读 Harness 源码时，选一次具体任务作为线索会更容易：谁接收输入，谁调用模型，谁执行工具，最后谁判断完成？沿这条路径查文件和测试，比先看完整模块图更容易建立理解。

- [Claude Code Overview](https://docs.anthropic.com/en/docs/claude-code/overview)：从产品行为观察工具、权限、hooks、subagents 与 MCP。
- [OpenAI Codex](https://github.com/openai/codex)：研究开源 coding agent 的 CLI、sandbox、approval 与执行闭环。
- [learn-claude-code](https://github.com/shareAI-lab/learn-claude-code)：从零复刻 Claude Code-like Harness。
- [claw0](https://github.com/shareAI-lab/claw0)：从 loop 走到 session、channel、gateway、memory、delivery、resilience 和 concurrency。
- [LangGraph](https://github.com/langchain-ai/langgraph)：状态图、持久化、可恢复执行和可控编排。
- [OpenClaw](https://github.com/openclaw/openclaw)：长运行、本地优先、skills、gateway 与 context engine。
- [Hermes Agent](https://github.com/NousResearch/hermes-agent)：自托管、长期记忆、toolsets、skills 和消息网关。

阅读方法：固定一个 commit，追踪一次真实任务的入口、loop、registry、permission、session、compaction、trace 与 finalizer，公开功能可以说明使用方式，但不足以证明未公开的内部实现。
