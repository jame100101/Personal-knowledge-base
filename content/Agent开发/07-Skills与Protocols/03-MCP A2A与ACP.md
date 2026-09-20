# MCP、A2A 与 ACP：三个不同互操作边界

面对几个协议缩写，先别急着记字段。先问连接的是谁：模型应用与工具服务，还是两个 Agent，或客户端与编码 Agent？明确通信双方和职责以后，再查对应版本的规范，会少很多混淆。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `MCP 2026-07-28; A2A 1.0; ACP docs verified 2026-08-24`
> - `source_type`: `official-spec`
> - `stability`: `fast-moving`

## 先用一个实际场景分清三种协议

协议就是双方约定怎样发消息、怎样解释消息。它不等于模型，也不替你执行所有业务逻辑。假设你在编辑器里让 Agent 修复一个工单：编辑器与 Agent 之间的会话、权限请求和修改展示，可以用 ACP；Agent 读取工单系统，可以用 MCP；如果还要把一项独立工作交给别的 Agent 服务，可以考虑 A2A。

MCP Server 暴露一个“查询工单”的工具时，需要声明工具名、参数和返回内容。模型提出调用请求，运行时检查参数与权限，客户端再发送协议消息。真正查数据库的是服务端代码，不是协议格式本身。接入之后，要分别测试正常返回、参数错误、超时和取消，而不是只测“连接成功”。

下面的 MCP 说明针对 `2026-07-28` revision。维护旧系统时先查看双方实际支持的规范和 SDK 版本；新规范描述的无状态请求设计，不代表所有已经部署的旧版 Server 自动改变了会话行为。A2A 和 ACP 也一样，需要单独核对支持范围。

## 1. 先按边界选协议

| 协议 | 主要互操作边界 | 发现/加载 | 典型生命周期 |
|---|---|---|---|
| MCP | 应用/Agent 与 tools、resources、prompts 等 context capabilities | capability discovery / list；SDK 与 extension 依版本 | request/response；按 2026-07-28 核心不再假定持久会话 |
| A2A | 独立、可能不透明的 Agent 系统之间 | Agent Card、interfaces、skills、security schemes | message、task、stream/push、artifact、cancel |
| ACP | 编辑器/客户端与 Coding Agent | 客户端启动或连接 agent，协商 capabilities | session、prompt、streamed updates、permission/UI interactions |

Skill、Tool、Prompt 是能力建模概念；MCP/A2A/ACP 是互操作协议。协议可承载或引用这些概念，但彼此不互相替代。

## 2. MCP 2026-07-28 的关键校正

当前规范以**无状态核心**为方向：每个请求自描述，旧式“Host 永久持有 Client session、Client 永久连接 Server”不再是通用前提。HTTP 请求可用 `Mcp-Method` / `Mcp-Name` 等头辅助路由；list 结果支持稳定排序与 cache hint；server-to-client 多轮交互转向 Multi Round-Trip Requests。Tasks、MCP Apps、Enterprise Managed Authorization 等属于 extensions，采用时需记录扩展版本与能力协商。

授权必须校验 issuer，远程部署仍需 TLS、client identity、resource/operation scope、redirect/SSRF 防护与最小权限。SDK API 不等于规范本身；TypeScript/Python/Go/C# Tier 1 SDK 已面向该 revision，Rust 支持状态需按采用时版本复查。

## 3. A2A 1.0

A2A 面向独立 Agent：Agent Card 描述 interfaces、capabilities、skills 与 security；Task 有状态、artifact 与更新；规范包含 JSON-RPC、gRPC、HTTP+JSON/REST bindings，并要求不同 binding 的功能语义等价。客户端发送版本信息并校验 capability；认证通常在协议交互外取得 credential，服务端仍逐操作授权。A2A 的“skill”是 Agent Card 能力描述，不应直接等同于本仓库的 SKILL.md 文件格式。

## 4. ACP

ACP 用 JSON-RPC 风格接口标准化 editor/client 与 coding agent 的交互，并尽量复用 MCP 类型。它关注 UX、session、流式内容、工具调用呈现、权限请求与终端/文件等客户端能力。其信任模型假定用户选择的客户端与 Agent 参与交互；具体执行仍需各实现的 sandbox 和 permission policy。

## 5. 生命周期、安全与版本

| 检查 | MCP | A2A | ACP |
|---|---|---|---|
| 身份 | client/server/resource server | agent/client + security scheme | local/remote client-agent trust |
| 版本 | spec revision + SDK + extensions | protocol version + bindings/extensions | protocol/schema + implementation |
| 主要风险 | confused deputy、SSRF、工具过权 | task 数据泄漏、伪造 Agent Card、push endpoint | 编辑器能力过权、终端/文件副作用 |
| 证据 | method/name、scope、result | task transition、artifact、signature | session update、permission decision、tool result |

## 6. 选择示例

- IDE 对接多个 Coding Agent：ACP；
- 一个 Agent 暴露数据库查询工具：MCP；
- 采购 Agent 把任务委派给外部物流 Agent：A2A；
- Coding Agent 通过 MCP 使用 issue tracker，并通过 ACP 在编辑器展示 patch：可组合使用。

## 7. 官方来源

- [MCP 2026-07-28 specification](https://modelcontextprotocol.io/specification/2026-07-28)
- [MCP 2026-07-28 release notes](https://blog.modelcontextprotocol.io/posts/2026-07-28/)
- [A2A latest specification](https://a2a-protocol.org/latest/specification/)
- [A2A v1.0 changes](https://a2a-protocol.org/latest/specification/whats-new-v1/)
- [ACP introduction](https://agentclientprotocol.com/get-started/introduction)
- [ACP architecture](https://agentclientprotocol.com/get-started/architecture)
