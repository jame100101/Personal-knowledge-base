# P0–P8 Java 后端项目阶梯

P0 到 P8 是逐步增加难度的练习，不是每个项目都必须走完的流水线。先做到模块清楚、数据正确、测试可重复，再决定是否继续微服务或云原生。阶段编号帮助安排进度，不代表架构越复杂越优秀。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `2026 curriculum; JDK 25 baseline`
> - `source_type`: `engineering synthesis`
> - `stability`: `version-sensitive`

| Level | Goal / Technology | Non-goals | Acceptance / Tests | Observability / Security / Failure |
|---|---|---|---|---|
| P0 Java CLI | 核心语法/API、文件任务 | Spring/DB | unit tests、可执行包 | structured error、坏输入 |
| P1 JDBC Service | SQL/schema/transaction/JDBC | ORM/cache | real DB integration、migration | query timing、rollback/deadlock case |
| P2 Boot REST | MVC、validation、error、config | auth/microservice | API tests/OpenAPI | request id、timeout、invalid payload |
| P3 Tested Persistence | MyBatis 或 JPA、Testcontainers | 多 ORM 炫技 | N+1/locking/batch tests | DB metrics、concurrent update |
| P4 Secure Modular Monolith | Security、feature modules、transaction、outbox | microservices | module verification、authz、contract | audit、duplicate event、secret policy |
| P5 Event-driven App | Kafka/Rabbit/Rocket 选一、idempotent consumer | 三 MQ 全学 | duplicate/order/DLQ tests | lag、retry、poison event |
| P6 Distributed Service | service/data boundary、gateway、resilience | 为拆而拆 | contract/partial-failure tests | trace、timeout、circuit、saga |
| P7 Cloud-native Production | container/K8s/CI-CD/OTel/SLO | 只写 YAML | canary/rollback/load/DR | dashboard、runbook、incident |
| P8 Optional Spring AI | ChatClient/tool/RAG/MCP 选需 | 训练模型 | eval、structured validation | prompt/tool trace、injection/permission |

P4 是核心毕业点：即使项目不进入微服务，也应具备清晰模块、测试、安全、事务、可观察事件与运维证据。

每级 Deliverables：source、README、ADR、schema/migration、tests、CI、failure report、trace/metrics screenshot 或 machine-readable artifact。下一级只能在上一层验收通过后引入。

<!-- evidence-update:2026-10-25 -->

## 同一个笔记应用，分阶段增加责任

可以把项目统一成一个笔记服务：P0 从文件读取；P1 用事务保存；P2 提供查询接口；P3 测并发修改；P4 检查“甲不能修改乙的笔记”，并验证模块依赖。做到 P4 后，已经有一个完整的后端练习成果。

只有出现具体需求才继续：异步生成导出文件时研究消息，多个独立团队维护功能时研究服务拆分。每一级保留一个失败演示，例如无权限修改应被拒绝、重复请求不能重复创建。P0–P8 是本教程的课程安排，不是 Spring 官方认证等级。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [Spring Boot：测试支持的职责与模块](https://docs.spring.io/spring-boot/reference/testing/index.html)
- [Spring Modulith：模块验证规则](https://docs.spring.io/spring-modulith/reference/verification.html)
