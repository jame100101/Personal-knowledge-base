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
