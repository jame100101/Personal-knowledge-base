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
