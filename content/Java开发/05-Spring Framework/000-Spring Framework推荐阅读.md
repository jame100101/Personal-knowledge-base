# Spring Framework推荐阅读

读 Spring 文档时，建议先围绕一个对象的生命周期展开：怎样定义、怎样注入依赖、何时初始化和关闭。弄清这条线，再读 AOP 和事务，后面的抽象会有落点。

Spring 的核心是 IoC 容器、代理式 AOP、一致的数据访问/事务抽象和 Web 编程模型。

## 官方资料优先顺序

- [Spring Framework Reference](https://docs.spring.io/spring-framework/reference/)
- [Spring Core Technologies](https://docs.spring.io/spring-framework/reference/core.html)
- [Spring Transaction Management](https://docs.spring.io/spring-framework/reference/data-access/transaction.html)
- [Spring Testing](https://docs.spring.io/spring-framework/reference/testing.html)

## 阅读方法

先选择本阶段正在练习的一项功能，按官方快速开始做通。随后带着实际遇到的问题查参考手册：参数默认值是什么，出错时返回什么，哪些行为随版本变化？把查到的结果写进测试或运行记录。升级时再看迁移说明，不必每次从文档第一页重新读起。
