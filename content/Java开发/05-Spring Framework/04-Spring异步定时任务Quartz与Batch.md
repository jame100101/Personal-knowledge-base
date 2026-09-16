# Spring 异步、任务调度、Quartz 与 Spring Batch

发邮件可以放到后台，报表可能需要每天生成，批量导入还可能要中断后继续。这几类任务看起来都“不立即返回结果”，却需要不同的机制。先分清需求，再选择异步方法、定时任务、Quartz 或 Batch。

后台任务需要明确触发方式、并发模型、幂等、持久状态、重试和可观测性。`@Async`、`@Scheduled`、Quartz 与 Spring Batch 分别解决不同复杂度，不应混为一个“定时器”。

## 1. 学习目标

- 理解线程池和上下文传播
- 掌握固定频率、固定延迟和 cron
- 理解 Quartz 持久触发与集群协调
- 理解 Batch 的 Job/Step/Reader/Processor/Writer 与重启

## 2. 核心概念

### 1. 异步执行

`@Async` 通过代理把方法提交给 Executor。需要设置有界队列、线程数、拒绝策略、异常处理与关闭等待，并明确安全上下文、MDC 和事务不会自然跨线程。

**这里容易混淆的是：** 异步返回并不等于任务可靠持久化；进程崩溃时内存队列任务可能丢失。

### 2. 轻量调度

`@Scheduled` 适合单应用内可重入任务。fixedDelay 从上次完成后计时，fixedRate 按计划频率触发，cron 按日历表达并应明确时区。

**这里容易混淆的是：** 多实例部署会各自触发；需用分布式锁、单独调度实例或外部调度器协调。

### 3. Quartz

Quartz 将 Job 与 Trigger 分离，可持久化触发状态，支持 misfire 策略和数据库集群。Job 应无状态或显式管理并发，业务动作仍要幂等。

**这里容易混淆的是：** 调度器保证触发管理，不自动保证外部业务只执行一次。

### 4. Spring Batch

Batch 将批处理拆成 Job 和 Step；chunk 模式按块读、处理、写并提交，元数据记录执行状态以支持重启。大文件/大表需流式读取、稳定游标和失败跳过策略。

**这里容易混淆的是：** skip/retry 必须限定异常和上限；盲目跳过会静默丢失业务数据。

## 3. 运行链路

```mermaid
flowchart LR
  A["Trigger"] --> B["Job/Task"]
  B --> C["读取检查点"]
  C --> D["Reader"]
  D --> E["Processor"]
  E --> F["Writer"]
  F --> G["提交块与更新检查点"]
  G --> H{"还有数据?"}
  H -->|是| D
  H -->|否| I["完成与指标"]
```

## 4. 最小示例

```java
@Bean
Job importOrders(JobRepository jobs, Step importStep) {
  return new JobBuilder("importOrders", jobs)
      .start(importStep)
      .build();
}

@Bean
Step importStep(JobRepository jobs, PlatformTransactionManager tx,
    ItemReader<OrderRow> reader, ItemWriter<OrderRow> writer) {
  return new StepBuilder("importOrders.csv", jobs)
      .<OrderRow, OrderRow>chunk(200, tx)
      .reader(reader)
      .processor(row -> row.validated())
      .writer(writer)
      .build();
}
```

## 5. 练习与验证

1. 比较 fixedRate/fixedDelay 在慢任务下的时间线
2. 让批任务在第三个 chunk 失败并验证重启点
3. 为多实例 Quartz 任务验证幂等

## 6. 常见误区

- 用无界线程池掩盖背压
- 在定时任务中长时间占据数据库事务
- 每次重启都使用相同 JobParameters 导致实例冲突

## 7. 掌握检查

日报定时生成和大量数据分批导入，为什么未必适合同一种任务机制？分别说明失败后怎样继续。

先不看答案，用本章示例解释一遍；再改变一个输入或配置，检查实际结果是否符合你的判断。

## 参考资料

- [Spring Task Execution and Scheduling](https://docs.spring.io/spring-framework/reference/integration/scheduling.html)
- [Quartz Documentation](https://www.quartz-scheduler.org/documentation/)
- [Spring Batch Reference](https://docs.spring.io/spring-batch/reference/)
