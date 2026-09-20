# Seata、Sentinel 与 SkyWalking 实战边界

事务没完成、请求量过大、故障原因不明，是三类不同的问题。Seata、Sentinel 和 SkyWalking 分别提供相关能力，彼此不能替代。下面把它们放进实际调用过程，看接入之后还需要自己处理哪些事。

这三个组件分别聚焦分布式事务、流量治理与可观测性。它们解决的是不同问题：事务一致性、过载保护和运行证据不能相互替代。

## 1. 学习目标

- 比较 Seata AT/TCC/Saga/XA
- 理解 Sentinel 资源、规则和降级
- 理解 SkyWalking 探针、后端与存储链路

## 2. 核心概念

### 1. Seata 模式选择

AT 通过数据源代理、undo log 和全局锁协调关系数据库；TCC 要求业务实现 Try/Confirm/Cancel；Saga 用一系列本地事务与补偿处理长流程；XA 依赖数据库 XA 能力。

**这里容易混淆的是：** 这些模式不是同一种补偿协议。AT 重点看本地事务、undo log 与全局锁；XA 看资源管理器的分支事务；Saga 看每一步业务补偿；TCC 则由业务实现 Try、Confirm、Cancel。空回滚和悬挂尤其是 TCC 设计中的典型问题，不应不加区分地套在全部模式上。

举例说，Cancel 到达时 Try 尚未完成，就要避免随后到达的 Try 又把资源预留起来；重复 Confirm 或 Cancel 也不应重复变更余额。这就是 TCC 为什么需要幂等、空回滚和防悬挂处理。不同模式都要考虑失败恢复，但恢复依据与责任人不同。参见 [Seata TCC](https://seata.apache.org/docs/user/mode/tcc/)。

### 2. Sentinel 流量治理

Sentinel 把调用路径或业务操作定义为资源，按 QPS、并发线程、关联/链路等规则限流，并基于慢调用或异常熔断。规则应通过控制面持久化并灰度发布。

**这里容易混淆的是：** 限流阈值需由容量测试和 SLO 得出；复制示例数值会造成误拒绝或过载。

### 3. SkyWalking 可观测链路

探针采集 trace/metric/profile 数据，OAP 聚合分析并写入存储，UI 用于查询。服务名、实例名、采样、保留期和敏感数据策略需统一。

**这里容易混淆的是：** 追踪展示调用相关性，不自动证明根因；仍要结合日志、指标、变更和代码。

### 4. 组合使用

trace 可识别慢依赖，容量证据形成 Sentinel 规则；事务链路用 trace 关联 Seata XID；规则变更和事务补偿都写审计与业务指标。

**这里容易混淆的是：** 观测组件失效不应阻塞主业务；治理控制面也需要降级策略。

## 3. 运行链路

```mermaid
flowchart LR
  A["入口请求"] --> B["Sentinel资源与规则"]
  B --> C["业务服务"]
  C --> D["Seata全局事务/本地事务"]
  D --> E["数据库A"]
  D --> F["数据库B"]
  G["SkyWalking Java 探针"] -. "Trace/Metrics" .-> B
  G -.-> C
  G --> H["OAP与存储"]
```

## 4. 最小示例

```java
try (Entry entry = SphU.entry("order.create")) {
  return orderService.create(command);
} catch (BlockException blocked) {
  throw new TooManyRequestsException("系统繁忙，请稍后重试");
}
```

## 5. 练习与验证

1. 对 AT 模式制造二阶段失败并观察补偿
2. 用阶梯压测确定 Sentinel 阈值
3. 从 trace 定位一次慢 SQL 并用数据库证据交叉验证

## 6. 常见误区

- 把分布式事务当成本地事务无成本放大
- 熔断后的 fallback 返回伪造成功
- 采集全部 trace 却未估算存储与敏感字段

## 7. 掌握检查

事务失败、流量过载和排查慢请求，分别应先使用哪一类能力？为什么单个组件解决不了全部问题？

先不看答案，用本章示例解释一遍；再改变一个输入或配置，检查实际结果是否符合你的判断。

## 参考资料

- [Seata Documentation](https://seata.apache.org/docs/)
- [Sentinel Documentation](https://sentinelguard.io/en-us/docs/introduction.html)
- [Apache SkyWalking](https://skywalking.apache.org/docs/)
