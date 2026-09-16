# PostgreSQL 基础：类型、索引、MVCC、执行计划与选型

学过 SQL 之后，可以通过 PostgreSQL 进一步练习建表、约束和事务。不要只寻找与 MySQL 相似的命令；也要留意它自己的类型和执行行为。下面按从写入到查询的过程，介绍最常用的部分。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `PostgreSQL concepts; verify server version for syntax`
> - `source_type`: `PostgreSQL official documentation`
> - `stability`: `version-sensitive`

这里继续使用关系模型学习。文档型数据库的建模方式另放在 MongoDB 专题中，避免在 SQL 基础还不熟时同时混入另一套取舍。

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
