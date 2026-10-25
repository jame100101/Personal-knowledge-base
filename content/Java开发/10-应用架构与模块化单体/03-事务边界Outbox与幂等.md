# Transaction Boundary、Outbox 与 Idempotency

保存订单成功后，发送消息失败了怎么办？数据库与消息系统之间的这个间隙，是 Outbox 要处理的问题。下面先看业务记录与待发消息怎样一起保存，再解释为什么后续发送和消费仍然需要处理重复。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `stable distributed data patterns`
> - `source_type`: `primary-pattern literature + engineering synthesis`
> - `stability`: `stable-concept`

## 问题

数据库提交与 broker publish 是两个系统，普通代码无法让二者天然原子。Transactional outbox 在同一数据库事务写业务记录和 outbox row，独立 relay 发布；consumer 仍可能收到重复消息，因此必须幂等。

```sql
BEGIN;
INSERT INTO orders(id, status) VALUES (:id, 'CREATED');
INSERT INTO outbox(event_id, aggregate_id, event_type, payload)
VALUES (:eventId, :id, 'OrderCreated', :json);
COMMIT;
```

Idempotency key 需要定义 scope、request fingerprint、result retention、并发竞争和过期策略。只在 controller 查一次 key 存在竞态；应使用 unique constraint/transaction 让“首次创建”原子。

## Failure simulation

在 commit 后 publish 前 kill 进程、重复 relay、consumer 处理后 ack 前崩溃、乱序和 poison message。验收要求最终状态正确、重复不产生二次副作用、trace 可从业务 ID 关联 event ID。

<!-- evidence-update:2026-10-25 -->

## 沿着一次崩溃看 Outbox 的作用

把订单保存和待发事件放进同一个数据库事务后，提交前失败会一起回滚；提交后进程退出，待发事件仍可由后续发布程序找到。这解决的是“业务保存了，却没有留下待通知记录”的间隙。

它没有消灭重复：发布程序可能已经把消息发出去，却没记下发送成功。恢复后再发一次，消费者会收到相同事件 ID。因此去重记录与数据库业务修改应处在同一事务边界；若副作用是外部邮件或支付，还需要对方的幂等契约或状态核对。练习中分别在这两个位置中断，检查数据，不只检查日志。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [Debezium：Outbox Event Router 的事件 ID 与分区键](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html)
