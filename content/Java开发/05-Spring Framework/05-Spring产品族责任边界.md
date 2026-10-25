# Spring Framework、Boot、MVC、Data 与 Cloud 的责任边界

Spring Framework、Boot 和 Cloud 经常一起出现，却不是三个可以互相替代的框架。可以先问：谁创建对象，谁提供自动配置，谁处理分布式协作？下面按这个分工阅读，再核对版本兼容关系。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `Spring Framework 7 / Spring Boot 4 lines`
> - `source_type`: `Spring official reference`
> - `stability`: `version-sensitive`

| 项目 | 主要责任 | 不是 |
|---|---|---|
| Spring Framework | IoC/DI、AOP、transactions、events、resource、validation、web foundation | 自动选择所有应用依赖 |
| Spring Boot | opinionated auto-configuration、starter/BOM、external config、embedded runtime、Actuator | Spring Framework 的“升级版” |
| Spring MVC | Servlet 栈的 HTTP request/handler/response 模型 | reactive runtime |
| Spring Data | repository abstractions 与不同数据技术集成 | 单一 ORM 或数据库 |
| Spring Cloud | 分布式系统常见模式的项目集合与 release train | 微服务必需品 |

Boot 会查看类路径、配置属性和各项条件，再决定是否创建默认 Bean。你提供自己的 Bean 后，某些默认配置会因为条件不再满足而退出。想弄清原因，可以查看 `ConditionEvaluationReport`，而不是反复试加注解。

Cloud 项目还要核对发行列车与 Boot 的兼容矩阵。BOM 帮助管理一组依赖版本，但把它改成“最新”并不能保证所有组件已经配套。

<!-- evidence-update:2026-10-25 -->

## 用一条请求辨认每个项目的工作

以“查询一条笔记”为例：Framework 创建并装配服务对象；MVC 找到处理 HTTP 请求的方法；数据访问组件把查询交给数据库；Boot 根据依赖和条件安排常用配置。这几件事可以协作，却不属于同一个责任。

练习：先运行一个最小 Web 项目，再加入数据库依赖，比较自动配置报告。若配置没有生效，先找条件为什么不满足，而不是多加几个注解。Cloud 则在需要服务发现、配置管理等分布式能力时再研究，先查它与 Boot 的配套范围。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [Spring Framework：项目总览](https://docs.spring.io/spring-framework/reference/overview.html)
- [Spring Cloud：项目与版本配套](https://spring.io/projects/spring-cloud/)
