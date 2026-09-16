# MongoDB 文档模型与选型（可选）

把相关数据放进一个文档，读取时可能很方便，但独立增长的数据也可能让文档越来越难维护。学习 MongoDB 时，先列出实际读写操作，再选择嵌入或引用，而不是把关系表原样换成 JSON。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `MongoDB concepts; verify server/driver versions`
> - `source_type`: `MongoDB official docs`
> - `stability`: `version-sensitive`

MongoDB 适合以文档聚合读取/写入、schema 演进与水平扩展需求明确的场景。建模从访问模式出发：一起读取且生命周期一致的数据可嵌入；独立增长、共享或高基数关系考虑引用。

必须学习 `_id`、document size、index、compound index、aggregation pipeline、transactions、read/write concern、replica set、sharding 与 schema validation。它不是“无 schema”，而是 schema 约束位置更灵活。

选择前比较关系一致性、join/analytics、更新模式、团队运维与数据迁移；不要因 JSON 方便就替换关系数据库。
