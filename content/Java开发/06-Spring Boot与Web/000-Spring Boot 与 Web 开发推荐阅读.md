# Spring Boot 与 Web 开发推荐阅读

快速开始文档适合帮你启动项目，参考文档则用来解释自动配置和 Web 行为。建议边做一个小接口边阅读：每加一项依赖或配置，都观察它改变了什么，别一次把所有 starter 装进去。

Spring Boot 负责约定、自动配置、依赖管理、可执行应用和生产能力；Web 层仍建立在 HTTP、Servlet 或 Reactive 语义上。

## 官方资料优先顺序

- [Spring Boot 4.1 Reference](https://docs.spring.io/spring-boot/reference/)
- [Spring MVC Reference](https://docs.spring.io/spring-framework/reference/web/webmvc.html)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/reference/actuator/)
- [Jakarta Servlet Specification](https://jakarta.ee/specifications/servlet/)

## 阅读方法

先选择本阶段正在练习的一项功能，按官方快速开始做通。随后带着实际遇到的问题查参考手册：参数默认值是什么，出错时返回什么，哪些行为随版本变化？把查到的结果写进测试或运行记录。升级时再看迁移说明，不必每次从文档第一页重新读起。
