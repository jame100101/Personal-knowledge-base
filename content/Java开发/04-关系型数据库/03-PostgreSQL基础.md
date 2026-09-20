# PostgreSQL 基础：类型、索引、MVCC、执行计划与选型

学过 SQL 之后，可以通过 PostgreSQL 进一步练习建表、约束和事务。不要只寻找与 MySQL 相似的命令；也要留意它自己的类型和执行行为。下面按从写入到查询的过程，介绍最常用的部分。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `PostgreSQL concepts; verify server version for syntax`
> - `source_type`: `PostgreSQL official documentation`
> - `stability`: `version-sensitive`

这里继续使用关系模型学习。文档型数据库的建模方式另放在 MongoDB 专题中，避免在 SQL 基础还不熟时同时混入另一套取舍。

## 从两个人同时修改订单理解隔离

事务把一组数据库操作放在一起，隔离级别规定它与其他并发事务怎样互相影响。MVCC 会保留行版本，帮助查询按相应规则读取数据；它不是“从此没有锁”，写入、约束和显式加锁仍有各自的协调机制。

PostgreSQL 默认是 Read Committed。可以打开两个数据库会话做实验：A 开始事务并查询一条订单，B 修改并提交，再让 A 执行第二次查询。默认隔离下，A 的两条查询可能看到不同的已提交结果。不要把“同一个事务”直接理解成“所有语句永远共用同一个快照”。规则见[官方事务隔离说明](https://www.postgresql.org/docs/current/transaction-iso.html)。

学会观察之后，再选择业务需要的保证。例如扣减库存不能只靠先查余额再写回旧值；需要设计带条件的更新或适当的锁，并检查实际更新行数。约束、隔离与应用逻辑共同维护业务规则，单独提高隔离级别不等于问题全部解决。

## 核心知识

- 先建立表与约束：主键标识记录，外键表达引用，唯一约束限制重复，CHECK 检查每行必须满足的条件。schema 则用于组织数据库对象；
- 丰富类型与明确转换；JSONB 用于局部半结构数据，不替代关系建模；
- B-tree 默认索引及 GIN/GiST/BRIN 的不同访问模型；
- 再理解 MVCC：事务按隔离级别观察相应的数据快照；旧行版本还需要清理，VACUUM 与这项维护有关；
- `EXPLAIN (ANALYZE, BUFFERS)` 结合真实执行时间与 I/O，注意它会实际执行语句；
- 连接会占用数据库资源，因此应用通常通过连接池复用。池越大不一定越快，还可能让更多查询同时争抢 CPU、内存和锁。

```sql
CREATE TABLE orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id bigint NOT NULL,
  status text NOT NULL CHECK (status IN ('NEW','PAID','CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_customer_created ON orders(customer_id, created_at DESC);
```

复合索引顺序依据过滤、排序与基数，不靠“所有列都建索引”。事务边界由业务不变量决定；长事务会延长旧版本可见性并增加维护成本。

## MySQL 与 PostgreSQL 的学习方式

掌握共同关系模型与事务后，再比较 SQL dialect、索引、隔离默认值、JSON、复制、运维和生态。不要用单一 benchmark 评选“更快”，也不要在 ORM 层假定两者完全可互换。
