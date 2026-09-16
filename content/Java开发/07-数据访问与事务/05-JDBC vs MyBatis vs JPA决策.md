# JDBC vs MyBatis vs JPA：按问题选择数据访问方式

如果正在为项目选择数据访问方式，不妨先看几个实际需求：查询有多复杂，是否需要管理对象关系，团队是否愿意直接维护 SQL？下面比较 JDBC、MyBatis 和 JPA 的取舍，而不是按抽象层越高越好来排序。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `Spring 7 / Boot 4 ecosystem`
> - `source_type`: `official-docs + engineering synthesis`
> - `stability`: `version-sensitive`

| 维度 | JDBC / JdbcClient | MyBatis | JPA/Hibernate |
|---|---|---|---|
| 控制 | SQL 与 mapping 显式 | SQL 显式、mapping 辅助 | entity/unit-of-work 抽象 |
| 适合 | 简单服务、批量、精确 SQL | SQL 复杂、团队偏 SQL | 聚合生命周期、关系映射、领域模型 |
| 主要成本 | 样板与 mapping | 动态 SQL/mapper 维护 | persistence context、fetch、N+1、映射复杂度 |
| 性能认知 | 仍取决于 SQL/DB/网络 | 同左 | 需要理解 flush、fetch plan、batch |
| 测试 | repository integration test | mapper + real DB | mapping/query + real DB |

## JDBC 最小安全示例

```java
String sql = "select id, name from customer where email = ?";
return jdbcClient.sql(sql)
    .param(email)
    .query(CustomerRow.class)
    .optional();
```

参数绑定处理值，表名/排序字段等 SQL identifier 需要 allowlist，不能直接拼接用户输入。

## 决策顺序

先选一条有代表性的业务，例如创建订单并查询订单明细，把从接口到数据库的整条路径做出来。记录查询复杂度、批量处理、锁和数据库特性的要求，再用集成测试与执行计划比较方案。团队经验和后续迁移成本也应算进去。

不同模块可以采用不同方式，但要约定谁管理事务和对象状态。不要让同一组业务对象同时由几套抽象修改，却没有清楚的协调规则。

## 共同生产边界

不论选择哪种框架，都要安排连接池、事务超时和数据库迁移。查询方面检查分页、批处理与 N+1；并发修改时选择合适的乐观锁或悲观锁。最后用 SQL 日志和真实数据库测试核对实际行为，Testcontainers 可以帮助准备测试依赖。
