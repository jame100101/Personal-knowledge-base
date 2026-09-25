# TypeScript 与 Python：渐进类型、运行时注解与异步模型

如果你给 Python 函数写过类型提示，TypeScript 的参数标注会很容易上手。接下来要留意的不是冒号怎么写，而是类型检查器和运行时各做什么。下面从对象、空值、泛型和异步代码比较，避免把一种语言的习惯直接带到另一种里。

给 Python 函数加上注解，不会自动让解释器拒绝所有类型不符的参数；通常还要运行外部检查器。TypeScript 也需要区分检查与执行，但注解在产物中的处理方式并不与 Python 相同，不能只凭两边都有标注就认为机制一致。

## 1. 类型检查阶段

```typescript
function area(radius: number): number {
  return Math.PI * radius ** 2
}
```

```python
def area(radius: float) -> float:
    return 3.141592653589793 * radius ** 2
```

- TypeScript 标注通常从 JavaScript emit 中擦除。
- Python 注解通常可通过 `__annotations__`、`typing.get_type_hints` 等在运行时读取，但解释器默认不据此拒绝调用。
- Python 的具体静态规则由标准 typing specification 与检查器实现共同落地；不同检查器严格度可能不同。

## 2. 结构化类型

TypeScript 默认以结构兼容为核心；Python 可用 `Protocol` 显式表达静态结构接口：

```python
from typing import Protocol

class Closable(Protocol):
    def close(self) -> None: ...

def shutdown(resource: Closable) -> None:
    resource.close()
```

`@runtime_checkable` 只能在运行时做有限的成员存在检查，不会完整验证方法签名，因此也不是 schema 验证器。

## 3. 空值与联合

```typescript
type User = { name: string }
function nameOf(user: User | undefined): string {
  return user?.name ?? "anonymous"
}
```

```python
from dataclasses import dataclass

@dataclass
class User:
    name: str

def name_of(user: User | None) -> str:
    return user.name if user is not None else "anonymous"
```

二者检查器都能对分支收窄，但 Python 运行时本身不会因漏检 `None` 在调用前阻止程序。

## 4. 泛型

```typescript
function first<T>(items: readonly T[]): T | undefined {
  return items[0]
}
```

```python
from collections.abc import Sequence
from typing import TypeVar

T = TypeVar("T")

def first(items: Sequence[T]) -> T | None:
    return items[0] if items else None
```

TS 泛型有 `keyof`、条件类型与映射类型等对象形状计算；Python typing 有 Protocol、TypeVar、ParamSpec、TypeVarTuple、Literal 等，但设计和检查器能力不与 TS 一一对应。

## 5. 对象、数据类与运行时验证

Python `dataclass` 会生成真实运行时代码（构造器、比较等）；TypeScript `interface` 只存在于检查阶段。两边都需要额外验证外部 JSON：Python 可手写或使用验证库，TypeScript 同样如此。

## 6. 异步与并发

- TypeScript 的 `async` 返回 Promise，通常运行在 JS host 事件循环。
- Python `async def` 返回 coroutine object，需由 asyncio 等事件循环调度。
- Python 还有线程和多进程；CPython 的 GIL 影响 Python 字节码并行，但 I/O、扩展模块和不同实现需要分别分析。
- 两边的取消传播、TaskGroup/Promise 组合和异常聚合语义不同，迁移时不能机械替换 `await`。

## 7. TypeScript 有而 Python 通常没有的部分

- 直接建模 JavaScript 属性键：`keyof`、索引访问、模板字面量类型。
- `.d.ts` 为任意 JS 库描述模块和全局形状。
- 编译配置与 ECMAScript emit/模块解析深度结合。
- 可辨识联合在对象字面量 API 中高度普遍。

## 8. Python 有而 TypeScript 没有的部分

- 注解对象通常在运行时可检查/反射，装饰器可直接读取。
- 元类、描述符、`__getattr__`、运算符协议等 Python 数据模型机制。
- 同一语言标准库覆盖文件、进程、数据处理等广泛服务端能力；TS 本身依赖具体 JS host。
- 上下文管理器 `with` 与 Python 异常/迭代协议生态。

## 9. “动态”并非“不安全”的结论

Python 可通过测试、运行时验证、严格检查器和清晰边界构建可靠系统；TypeScript 也可被 `any`、断言和错误声明破坏。可靠性取决于工具与工程纪律，不只取决于语言标签。

参考：[Python typing](https://docs.python.org/3/library/typing.html)、[Python Data Model](https://docs.python.org/3/reference/datamodel.html)、[TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)。

## 版本边界：GIL 不是所有 Python 实现的定律

讨论 GIL 应注明 CPython 构建方式与版本。支持 free-threaded 的构建可以在适当条件下禁用 GIL，扩展模块兼容性也影响实际行为，不能把 Python 永远无法多线程并行当作语言结论。有无 GIL 都要按同步规则设计共享状态的复合操作。参见 [Python free-threading 文档](https://docs.python.org/3/howto/free-threading-python.html)。
