# Spring AI 工程实现总览（可选）

已有 Spring 项目想接入模型时，可以先完成一次普通请求，再按需要加入结构化结果、工具或检索。Spring AI 提供这些集成入口；Agent 是否循环、如何停止、如何验证，仍然需要应用自己设计。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `Spring AI 2.0 line; repository fd3fd6ec700340b90c3d516be57c6e6c87dd7df1`
> - `source_type`: `Spring official reference + official-repository`
> - `stability`: `fast-moving`

Spring AI 为 Java/Spring 应用提供 Model API、`ChatClient`、structured output、tool calling、chat memory、RAG、vector store、MCP 与 observability 集成。它是实现层，不替代 Agent 原理。

## 分层

- Model API/ChatClient：provider-neutral 调用与 fluent orchestration；
- Structured Output：把模型文本映射到 schema，仍需业务校验；
- Tool Calling：声明工具并处理 invocation，真实副作用仍由应用 permission/runtime 管理；
- Memory：会话消息管理，不自动等于长期用户记忆；
- RAG/Vector Store：检索与 advisor pipeline；需要 citation、ACL、freshness；
- MCP：按官方当前 spec 与 Spring AI 当前模块版本核对 client/server 能力；
- Observability：记录 model/tool latency、tokens 与 trace，保护 prompt/secret/PII。

```java
record Answer(String summary, java.util.List<String> sources) {}

Answer answer = chatClient.prompt()
    .user(question)
    .call()
    .entity(Answer.class);
```

反序列化成功只证明结构匹配；source 存在性、权限、业务不变量仍需 deterministic validation。

## Cross-reference

Agent 原理请阅读 `Agent开发 / 02-Agent Loop`、`03-Context Engineering`、`04-Tools与Runtime`、`05-Knowledge与Memory` 与 `06-Agent Harness`。本模块只讨论 Java/Spring AI 的实现映射，避免复制理论。

<!-- evidence-update:2026-10-25 -->

## 先验证结构，再验证答案

当前查阅的 Spring AI Getting Started 展示 2.0.2，2.0.x 支持 Boot 4.0.x 与 4.1.x。按 BOM 选择配套版本后，先运行一次没有工具的模型调用，再增加结构化返回，不要同时引入检索、记忆和工具循环，让错误难以定位。

对上面的 Answer 做两道检查：第一道检查字段能否解析；第二道检查 sources 中的标识是否真实存在、当前用户能否读取、是否支持 summary 中的说法。故意给模型一段含虚构来源的输入，确认程序不会因为 Java record 构造成功就把答案标成已核实。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [Spring AI：版本配套与入门](https://docs.spring.io/spring-ai/reference/getting-started.html)
- [Spring AI：结构化输出的保证范围](https://docs.spring.io/spring-ai/reference/api/structured-output-converter.html)
