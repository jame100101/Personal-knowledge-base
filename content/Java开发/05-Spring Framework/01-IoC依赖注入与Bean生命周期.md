# Spring IoC、依赖注入与 Bean 生命周期

结账服务需要查询订单，也需要调用支付接口。把这些依赖交给构造器，既能清楚看到它需要什么，也方便测试时换成替代实现。Spring 容器负责把这样的对象连接起来，下面就从这个过程理解 IoC。

IoC 容器创建对象图、解析依赖并管理生命周期。依赖注入的目的不是减少 `new`，而是让依赖显式、可替换和可测试。

## 先从两个普通 Java 对象开始

假设 `OrderService` 要调用 `OrderRepository` 保存订单。最直接的写法是在服务里 `new OrderRepository()`，但这样服务自己决定使用哪个实现，测试时也不容易换成测试用的实现。

依赖注入就是把创建与使用分开：服务通过构造器接收 repository，调用者负责把合适的对象传进来。Spring 的容器帮你创建这些对象、连接依赖并管理生命周期；被它管理的对象称为 Bean。IoC（控制反转）说的是创建和组织对象的控制权不再全部写在业务类内部，不是说业务逻辑交给框架自动生成。

先学构造器注入，再理解扫描和自动装配。遇到“找不到 Bean”，检查对象有没有注册、扫描范围是否覆盖、条件是否满足；遇到多个候选，则检查你真正想选哪个，而不是随手加一个注解把错误压下去。单例 Bean 表示容器默认复用该实例，并不自动让其中的可变字段线程安全。

## 1. 本文覆盖范围

- ApplicationContext、BeanDefinition 与组件扫描
- 构造器/setter/字段注入、Qualifier/Primary
- Bean scope、生命周期、代理与循环依赖
- 配置属性、资源、事件与验证

## 2. 核心知识详解

### 1. 容器与 BeanDefinition

ApplicationContext 读取 Java 配置、组件扫描或 XML，形成 BeanDefinition，实例化单例并处理后置器。容器还提供事件、资源、国际化和类型转换。

- 组件扫描限定业务包，避免扫描整个 classpath。
- @Configuration/@Bean 适合第三方类型和显式装配。
- 启动失败应定位 Bean 创建链和根 cause，而非盲目加注解。

**这里容易混淆的是：** Spring 的 singleton 是“每个容器、每个 Bean 定义共享一个实例”，不是“同一个类在容器里只能有一个对象”。同一类可以有两个不同的 Bean 定义。它也不等于 JVM 全局单例，不会自动获得线程安全。参见 [Bean Scopes](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)。

### 2. 依赖注入选择

构造器注入保证必需依赖在创建时完整，字段可 final，并便于普通单元测试。setter 适合真正可选或可重配置依赖；字段注入隐藏依赖且难以脱离容器。

- 单构造器通常无需 @Autowired。
- 多个同类型实现用语义接口、@Qualifier、@Primary/@Fallback 明确。
- 依赖过多提示类职责过重，应拆分而非继续堆构造参数。

**这里容易混淆的是：** Optional 注入不应掩盖配置错误；关键能力缺失应在启动阶段失败。

### 3. Scope、生命周期与销毁

singleton、prototype、request、session 等 scope 决定实例边界。初始化经过构造、属性注入、Aware、BeanPostProcessor、初始化回调；销毁回调只对容器管理且可追踪的生命周期生效。

- 外部资源 bean 实现关闭回调并在优雅停机时释放。
- prototype 注入 singleton 时要通过 Provider/ObjectProvider 获取新实例。
- request/session 数据不进入 singleton 可变字段。

**这里容易混淆的是：** 容器通常不管理 prototype Bean 的完整销毁生命周期，使用者承担清理。

### 4. 循环依赖与代理

构造器循环依赖无法建立完整对象图，应通过职责拆分、领域事件或中介服务消除。代理 Bean 可能使运行时类型与原类不同，影响 final 方法、equals 和 self-invocation。

- 不以 `@Lazy` 作为长期循环依赖修复。
- 按接口依赖降低实现耦合。
- 调试时检查 bean 实际类型和 advisor。

**这里容易混淆的是：** 容器能在部分 setter/字段场景“绕过”循环并不证明设计正确，且与代理/版本组合可能失败。

## 3. 工程链路

```mermaid
flowchart LR
  A["配置/扫描"] --> B["BeanDefinition"]
  B --> C["实例化"]
  C --> D["依赖注入"]
  D --> E["BeanPostProcessor/代理"]
  E --> F["初始化完成"]
  F --> G["销毁回调"]
```

## 4. 最小可运行示例

先看构造器：结账服务在创建时就必须拿到订单仓库和支付接口。代码省略了业务方法、接口定义与 import，重点是依赖怎样进入对象。写单元测试时，可以直接传入测试替身，而不启动 Spring 容器。

```java
@Service
final class CheckoutService {
  private final OrderRepository orders;
  private final PaymentPort payments;

  CheckoutService(OrderRepository orders, PaymentPort payments) {
    this.orders = orders;
    this.payments = payments;
  }
}
```

## 5. 实践与验证

1. 把字段注入服务重构为构造器注入并写无 Spring 单元测试。
2. 制造循环依赖，再通过职责拆分消除。
3. 记录一个代理 Bean 从定义到销毁的生命周期回调顺序。

## 6. 掌握检查

- [ ] 能解释 ApplicationContext 与 BeanDefinition。
- [ ] 能选择构造器、setter 和 Provider。
- [ ] 能区分 Bean scope 与线程安全。
- [ ] 能识别代理类型和生命周期边界。

## 参考资料

- [Spring IoC Container](https://docs.spring.io/spring-framework/reference/core/beans.html)
- [Bean Scopes](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)
- [Annotation Configuration](https://docs.spring.io/spring-framework/reference/core/beans/annotation-config.html)
