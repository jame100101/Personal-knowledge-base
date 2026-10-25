# Java 后端工程学习路线（2026）

如果你已经能写几个 Java 类，下一步通常会有点迷茫：先学数据库，还是直接上 Spring Boot？这条路线按做出一个后端服务所需的顺序安排内容。先让程序正确读写数据，再处理多人同时访问、登录权限和上线运行；微服务放在后面，不作为入门门槛。

> **版本与资料依据**
>
> - `last_verified`: `2026-08-24`
> - `version_scope`: `JDK 25 LTS baseline; JDK 26 feature release; Spring Boot 4.x`
> - `source_type`: `official-spec + official-docs`
> - `stability`: `version-sensitive`

这条路线遵循：

```text
Java Fundamentals
      ↓
Build a Service
      ↓
Test & Secure It
      ↓
Design Its Architecture
      ↓
Add Infrastructure When Needed
      ↓
Scale to Distributed Systems
      ↓
Operate It in Production
```

## 主线

1. **Java 语言与核心 API**：先学语法、对象、异常与核心 API，再读泛型、集合及综合练习，随后学习反射、I/O 和 JDBC。首次遇到 SQL 可以先补关系型数据库入门。
2. **工程与 Internet/Linux**：构建、Git、Shell、Docker 基础，以及一次 HTTP 请求的完整路径。
3. **关系型数据库**：先 SQL 和数据约束，再学索引、事务、隔离与查询计划。
4. **Spring Framework → Spring Boot/Web → 数据访问/事务**：先分清 Spring 产品职责，再理解容器、请求处理和持久化。
5. **测试 → 安全 → 应用架构**：建立行为、身份和事务边界，以模块化单体作为核心毕业点。
6. **按需基础设施**：依次学习缓存/搜索、消息/事件、分布式/微服务；不要把装齐中间件作为入门目标。
7. **JVM 与并发 → 性能工程 → 云原生与可观测性**：有服务实践后，再深入运行时、线程、内存、诊断与生产运行。碰到相关问题时可提前查阅。
8. **项目阶梯 P0–P8**：用完整项目检验上述知识；P4 Secure Modular Monolith 是主线毕业点，后续是扩展与生产专项。
9. **可选专项**：按方向选读前端全栈、MongoDB、算法/设计模式和 Spring AI。
10. **开源架构研究**：固定 commit，区分已确认事实、推断与未知项。

目录按这条学习顺序展示；仓库历史文件编号保留，网页排序以课程配置为准。补充推荐阅读放在各阶段后面，遇到具体问题再查。

## 顺序约束

- Redis 和 Elasticsearch 不是数据库入门前置；MongoDB 不是所有 Java 后端项目必修。
- Spring Boot 是对 Spring 应用的自动配置、依赖管理和运行/运维体验，不是“Spring 的升级版”。
- 微服务是组织、部署、数据所有权与故障隔离的 trade-off，不是单体的高级形态。
- 虚拟线程主要降低高并发阻塞型任务的线程成本；不要把它表述为每个任务执行更快。
- OAuth 2.0 是授权框架；OIDC 在其上提供身份层；JWT 是令牌格式，不是登录系统。

## 学习闭环

每阶段都交付 `code + tests + architecture note + failure simulation + observability evidence`。版本相关事实集中在同级《Version Baseline 与 Compatibility Matrix》，概念文档只保留 `version_scope` 与复查日期。

<!-- evidence-update:2026-10-25 -->

## 第一周先交付一件能解释的事

先做一个“保存并查询读书笔记”的小程序。第一天让它接受标题并打印结果；第二天保存到文件，故意给它一个不存在的路径，观察错误；学到 SQL 后，把保存动作换成数据库事务；最后才通过 HTTP 接收请求。这是同一个需求逐步增加边界，不是每学一章就重写一个陌生项目。

每次只回答一个新问题：输入不合法怎么办？保存一半失败怎么办？两个人同时改怎么办？做到这一步，再引入测试、安全和模块划分就有了理由。版本选择请回到同级兼容表；例如 Boot 4.1.2 的 Java 支持范围已到 27，并不意味着 Cloud 的任意发行列车也支持这个组合。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [Spring Boot：系统要求](https://docs.spring.io/spring-boot/system-requirements.html)
- [Spring Cloud：项目与版本配套](https://spring.io/projects/spring-cloud/)
