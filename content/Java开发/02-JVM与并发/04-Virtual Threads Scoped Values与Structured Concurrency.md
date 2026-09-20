# Virtual Threads、Scoped Values 与 Structured Concurrency

虚拟线程适合用来理解一个新问题：大量任务在等待 I/O 时，怎样降低线程带来的负担？它不负责让计算本身变快。读这一章时，把“同时等多少任务”与“同时算多少任务”分开，再看上下文传递和子任务管理。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `Virtual Threads stable since Java 21; Scoped Values final in JDK 25; Structured Concurrency sixth preview in JDK 26`
> - `source_type`: `OpenJDK JEP`
> - `stability`: `version-sensitive`

## 从一次页面请求理解三者的用处

假设一个页面要同时加载用户资料和订单。虚拟线程回答的是“这些任务等待网络时，怎样少占用昂贵的平台线程”；Scoped Values 回答的是“这一段调用链怎样读到同一个请求编号”；结构化并发回答的是“资料查询失败以后，订单查询由谁等待、取消和收尾”。它们处理的是三件事，并不是三个不同名字的线程池。

使用虚拟线程时，一个任务一个虚拟线程通常比自己维护虚拟线程池更合适，但数据库连接数量仍有限。若只有 20 个连接，创建一万个虚拟线程也不会让数据库同时处理一万个查询。需要结合连接池、超时和并发上限控制实际负载。

结构化并发的价值在于让“任务已经结束”有明确含义：返回父任务结果之前，处理好子任务的完成和失败。取消是协作行为，外部操作还要支持中断或超时；发出取消信号，不等于数据库写入已回滚。

**版本补充（2026-09-20）：**[JDK 27](https://openjdk.org/projects/jdk/27/)中的 Structured Concurrency 是 [JEP 533 第七次预览](https://openjdk.org/jeps/533)。下面继续保留 JDK 26 第六次预览示例，不宣称它已按 27 编译验证；稳定生产代码与预览实验要分开构建。

## 1. 四种不同概念

| 概念 | 抽象 | 解决的问题 |
|---|---|---|
| Platform thread | OS 调度线程的 Java 表示 | 通用并发执行 |
| Virtual thread | JVM 调度的轻量 Thread | 大量阻塞型任务的 thread-per-task 成本 |
| Async programming | 以 future/callback 表达稍后完成 | 避免调用线程等待、组合完成事件 |
| Reactive programming | stream + non-blocking + demand/backpressure | 端到端异步数据流和资源控制 |

Virtual Thread 不保证单个请求更快；收益来自能以同步风格承载更多并发阻塞任务。CPU-bound 工作仍受核心数约束。监测连接池、外部 API 和锁等真实瓶颈。

## 2. Scoped Values（JDK 25）

用于在有界调用期间共享不可变/只读式上下文，尤其适合 request identity 或 trace context。它不是全局变量，也不替代显式业务参数。

```java
static final ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();

ScopedValue.where(REQUEST_ID, "req-42").run(() -> service());
```

共享对象本身若可变，仍需同步。不要将 secret 或大型对象无界传播。

## 3. Structured Concurrency（JDK 26 Sixth Preview）

其目标是让父任务与子任务生命周期形成词法结构，统一 join、失败与取消。由于是 Preview，示例需使用 `--enable-preview`，API 可在后续版本继续变化。

```java
// JDK 26 preview：以当期 JEP/API 为准
try (var scope = StructuredTaskScope.open()) {
    var user = scope.fork(this::loadUser);
    var order = scope.fork(this::loadOrder);
    scope.join();
    return new Result(user.get(), order.get());
}
```

## 4. 验证

模拟一个子任务失败、deadline、父任务取消与 scoped binding；确认兄弟任务处理、异常传播、资源关闭和 thread dump/JFR 可观察性。生产基线若禁用 preview，使用稳定 Executor/Future 设计并把迁移封装在边界内。
