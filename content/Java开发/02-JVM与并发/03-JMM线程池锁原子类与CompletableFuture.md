# JMM、线程池、锁、原子类与 CompletableFuture

多线程程序中，一个线程写了值，另一个线程何时能看到，不能只凭源码的先后顺序判断。JMM 解释这些约束，锁和原子类帮助我们满足它们。下面再看线程池和 CompletableFuture 怎样组织任务，而不是替代这些规则。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `Java 25`
> - `source_type`: `JLS/JDK API`
> - `stability`: `stable-concept`

## 1. JMM 基础

JMM 规定线程间读取允许观察到哪些写入。常用 happens-before：程序顺序、同一 monitor 的 unlock→后续 lock、同一 volatile 变量的 write→后续 read、thread start/join、传递性。数据竞争是多个线程访问同一变量且至少一个写、缺少足够同步。

```java
final class Sequence {
  private final java.util.concurrent.atomic.AtomicLong value = new java.util.concurrent.atomic.AtomicLong();
  long next() { return value.incrementAndGet(); }
}
```

原子类适合单变量原子更新；多个不变量通常仍需锁、不可变快照或事务。`volatile int count; count++` 仍是读—改—写复合操作。

## 2. Executor 与 backpressure

线程池配置不仅是线程数，还包含 queue、rejection、task ownership、timeout、cancellation 和 shutdown。无界队列把过载转化为延迟与内存增长；调用方需要并发上限或背压。

```java
try (var executor = java.util.concurrent.Executors.newVirtualThreadPerTaskExecutor()) {
    var future = executor.submit(() -> blockingCall());
    System.out.println(future.get());
}
```

`ExecutorService` 在现代 JDK 中可用 try-with-resources 关闭；业务仍需 deadline 和中断协作。虚拟线程 executor 不意味着下游数据库连接无限，应由连接池/信号量限制稀缺资源。

## 3. CompletableFuture

它表达 completion graph，不自动提供结构化生命周期。明确选择 `thenApply`/`thenCompose`、同步/Async executor、exceptionally/handle；为外部调用设置 timeout；避免在 common pool 内执行长阻塞任务。

## 4. Failure modes

线程泄漏、锁顺序死锁、忘记恢复 interrupt、共享可变状态、线程池饥饿、future 异常无人观察、取消未传播。使用 bounded load test、JFR、thread dump 与故障注入验证。

<!-- evidence-update:2026-10-25 -->

## 把“可见”与“不可分割”分开验证

假设 `count` 初始为 0。线程甲读到 0，线程乙也读到 0，随后两者都写回 1。两次加一最后只增加一次。即使字段有 `volatile`，也没有把“读、加、写”合成一个动作。可以使用原子类的 `incrementAndGet()`，或让整个修改过程持有同一把锁。若规则跨两个字段，只改其中一个字段为原子类还不够。

再做一组异步练习：让一个 `CompletableFuture` 在 100 毫秒后超时，底层任务却继续等待 1 秒。观察到“调用方收到超时”不等于“底层工作停止”。`orTimeout` 改变 Future 的完成结果；对外部 I/O，还要配置对应客户端的超时和取消。普通 `CompletableFuture.cancel(true)` 也不靠中断控制其计算。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [JLS 25 §17.4.5：线程之间的先后保证](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.4.5)
- [CompletableFuture：执行器、取消与超时语义](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/CompletableFuture.html)
