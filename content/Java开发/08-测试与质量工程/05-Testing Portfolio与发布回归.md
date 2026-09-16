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
