# JVM 与并发：从运行时到生产诊断

服务变慢或内存不断上涨时，猜一个 JVM 参数通常不是好的起点。先保留运行条件，再收集线程、内存和 GC 的信息。本节给出学习顺序，让后面的诊断工具都有一个具体要回答的问题。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `JDK 25 baseline; JDK 26 feature awareness`
> - `source_type`: `JVMS + OpenJDK JEP + JDK docs`
> - `stability`: `version-sensitive`

```mermaid
flowchart LR
  A[Class/Bytecode] --> B[Class Loading]
  B --> C[Runtime Data Areas]
  C --> D[Interpreter/JIT]
  C --> E[GC]
  F[JMM] --> G[Threads/Locks/Atomics]
  G --> H[Executors/Futures]
  H --> I[Virtual Threads]
  C --> J[JFR/jcmd/jstack/Heap dump]
```

## 学习问题

1. Java source 如何成为 class file，class loader 的 identity 为何包含 loader？
2. heap、thread stack、metaspace、code cache 各保存什么，OOM/StackOverflow 如何区分？
3. JIT 依据 profile 优化后为何可能 deoptimize？
4. GC 的 pause、throughput、latency 与 allocation rate 如何共同分析？
5. JMM 的 happens-before 如何约束可见性与排序？`volatile` 为什么不自动让复合操作原子？
6. platform thread、virtual thread、async API、reactive stream 分别是什么抽象？
7. 出现 CPU、停顿、死锁、内存增长时，选择 JFR、jcmd、jstack、heap dump 的依据是什么？

## 生产原则

先测量再调参。保留 JVM/JDK/container/GC flags、负载、warm-up、JFR 和 GC log。不要从一次 heap dump 推断长期趋势，也不要在未理解 workload 时复制“最佳 JVM 参数”。
