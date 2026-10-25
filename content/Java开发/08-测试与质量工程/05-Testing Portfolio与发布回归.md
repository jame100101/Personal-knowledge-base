# Testing Portfolio：行为边界、回归与发布证据

测试并不是越多越好，也不必严格凑出一个金字塔形状。更实际的做法是列出发布后最怕出错的几条路径，再安排反馈速度和成本合适的测试。下面把这组选择整理成可持续运行的回归方案。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `JUnit / Spring Test / Testcontainers concepts`
> - `source_type`: `official-docs + engineering synthesis`
> - `stability`: `version-sensitive`

可以按要发现的问题组织这组测试：

- 单元测试检查纯业务规则，失败时容易定位到小范围。
- 切片测试只加载 MVC 或 JPA 等相关部分，避免每次启动全部上下文。
- 集成测试检查真实的依赖装配、数据库或消息系统协作。
- API 与契约测试检查调用双方是否仍然兼容。
- 端到端测试从用户入口验证少量重要路径。
- 回归、性能和安全测试补充发布前需要满足的条件。

```java
@Test
void duplicateRequestReturnsOriginalOrder() {
    var first = service.create("idem-42", command);
    var second = service.create("idem-42", command);
    assertEquals(first.id(), second.id());
    assertEquals(1, repository.count());
}
```

覆盖率只表示哪些代码被执行，不表示断言质量、边界覆盖或 mutation resistance。关键是测试目标、初始状态、行为、外部副作用和可复现失败证据。

<!-- evidence-update:2026-10-25 -->

## 把串行成功推进到并发失败

前面的重复请求测试只覆盖“第一次结束以后再发第二次”。再加一个用例：两个请求同时带相同业务编号到达，观察最终仍只有一条订单；随后用相同编号带不同金额，要求明确拒绝冲突，不能静默返回旧订单。

先用单元测试覆盖“金额不合法”，再用真实数据库集成测试覆盖唯一约束和事务竞争，最后留一条从 HTTP 入口创建订单的测试。这样每个测试都有独立目的。不能用内存集合的成功结果，证明目标数据库的事务和并发行为。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [Spring Boot：测试支持的职责与模块](https://docs.spring.io/spring-boot/reference/testing/index.html)
- [Debezium：Outbox Event Router 的事件 ID 与分区键](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html)
