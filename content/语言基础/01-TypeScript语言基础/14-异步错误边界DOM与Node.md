# 异步、错误边界、DOM 与 Node.js 类型

一个函数返回 `Promise<User>`，只说明成功时会拿到什么，并没有说明等多久、失败怎么办。异步程序的这些行为仍要自己设计。下面把类型写法放回浏览器和 Node 的实际执行过程，看看请求、取消和错误是怎样传递的。

类型系统能描述 Promise 成功后的值，实际任务怎样被安排则取决于 JavaScript 事件循环和宿主 API。浏览器与 Node 提供的能力并不完全一样。因此读例子时，也要留意请求由谁发起、由谁取消，失败是否有人处理。

## 1. Promise 与 async/await

```typescript
type User = { id: string; name: string }

async function loadUser(id: string, signal: AbortSignal): Promise<User> {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}`, { signal })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return parseUser(await response.json())
}
```

`async` 函数总返回 `Promise`。`response.json()` 的静态类型无法证明数据符合 `User`，所以仍需 `parseUser`。

## 2. 并发、串行与结果类型

```typescript
const [user, permissions] = await Promise.all([
  loadUser("u-1", signal),
  loadPermissions("u-1", signal),
])
```

互不依赖的任务可并发；有依赖或需要限流时不要盲目 `Promise.all`。批量任务需要收集全部结果可用 `Promise.allSettled`，并显式处理 `fulfilled/rejected` 可辨识联合。

## 3. 错误变量是 unknown

```typescript
function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

try {
  await doWork()
} catch (error: unknown) {
  console.error(errorMessage(error))
}
```

JavaScript 允许抛出任意值，不能假设 `catch` 一定得到 `Error`。

## 4. 取消与超时

```typescript
async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await operation(controller.signal)
  } finally {
    clearTimeout(timer)
  }
}
```

超时包装只有在底层操作尊重 `AbortSignal` 时才能真正取消资源；单纯 `Promise.race` 只是停止等待，后台任务可能继续运行。

## 5. DOM 类型与空值

```typescript
const form = document.querySelector("#signup")
if (!(form instanceof HTMLFormElement)) throw new Error("#signup must be a form")

form.addEventListener("submit", (event: SubmitEvent) => {
  event.preventDefault()
  const data = new FormData(form)
  const email = data.get("email")
  if (typeof email !== "string") return
  console.log(email)
})
```

querySelector 的泛型参数不能证明实际元素类型。这里在同一文档环境用 instanceof 同时排除 null 与错误元素；跨窗口 DOM 还要考虑构造器所属的 realm。DOM 事件对象和 EventTarget 较宽，必要时验证 currentTarget 或封装绑定函数。

## 6. Node.js 类型与平台版本

```typescript
import { readFile } from "node:fs/promises"

async function readJson(path: string): Promise<unknown> {
  const text = await readFile(path, "utf8")
  return JSON.parse(text) as unknown
}
```

`@types/node` 版本应与目标 Node 能力匹配，但声明存在不代表部署运行时真的支持对应 API。引擎约束、CI 版本矩阵与生产镜像应一起校验。

## 7. Result 模型与异常

可预期业务失败可用可辨识联合，真正异常仍抛出：

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }

type ValidationError = { field: string; message: string }

function parseAge(value: string): Result<number, ValidationError> {
  const normalized = value.trim()
  const age = Number(normalized)
  if (!/^(0|[1-9]\d*)$/.test(normalized) || !Number.isSafeInteger(age)) {
    return { ok: false, error: { field: "age", message: "invalid age" } }
  }
  return { ok: true, value: age }
}
```

TypeScript 没有 Java 风格受检异常，函数签名不会强制列出所有 `throw`。

parseAge 这里约定无符号十进制整数，可有首尾空白；不接受空串、指数或十六进制形式。否则 Number("") 会得到 0，漏填就被误认成零岁。业务若有年龄上限，再单独增加范围条件。

前面的 withTimeout 只在时间到达后发出取消信号。若 operation 忽略 signal，包装器仍可能迟迟不返回；它不是强制终止任意函数的执行器。Promise.all 中一个任务拒绝也不会自动取消其他任务，停止等待和释放资源必须分别设计。

## 8. 异步检查清单

- 每个 Promise 是否被 `await`、返回或显式处理？
- 独立任务是否并发，依赖任务是否保持顺序？
- 是否有超时、取消与资源清理？
- 外部响应是否从 `unknown` 解析？
- 日志是否保留原因链、请求 ID 和必要上下文？
- 重试是否仅用于可重试错误，并有幂等性与退避？

参考：[MDN Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)、[Type Declarations](https://www.typescriptlang.org/docs/handbook/2/type-declarations.html)。
