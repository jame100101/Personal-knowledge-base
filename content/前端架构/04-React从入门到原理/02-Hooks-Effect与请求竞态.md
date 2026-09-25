# React Hooks 与 Effect：把外部系统同步好

很多初学者把 useEffect 当成“组件里需要执行代码的地方”。结果筛选、提交、状态复制全挤在里面，依赖数组越补越乱。先问一句：这件事真的是在同步外部系统吗？

## 计算、事件、同步分开想

根据 query 筛选本地文章，可以直接计算；用户点保存，放在事件处理函数；页面需要随 articleId 保持一条外部订阅，才需要考虑 Effect。这样分类不是为了减少 Hook 数量，而是让行为的触发原因看得见。

常规 Hooks 应在组件或自定义 Hook 顶层调用，不能放到条件、循环或普通回调中。React 依赖稳定的调用顺序关联状态；React 19 的 `use` 有不同调用规则，不要把它的例外推给 useState/useEffect。

## 一个会忽略旧结果的 Hook

下面片段假设接口返回字符串数组，用于客户端搜索练习。生产应用可用路由 loader 或查询库组织获取与缓存。

```tsx
import { useEffect, useState } from 'react'

type Result = { items: string[]; loading: boolean; error: string }
export function useSearch(query: string): Result {
  const [state, setState] = useState<Result>({ items: [], loading: false, error: '' })
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    setState({ items: [], loading: Boolean(query.trim()), error: '' })
    if (query.trim()) {
      async function load() {
        try {
          const response = await fetch(`/api/articles?q=${encodeURIComponent(query)}`, {
            signal: controller.signal,
          })
          if (!response.ok) throw new Error('搜索失败，请重试')
          const items: unknown = await response.json()
          if (!Array.isArray(items) || !items.every((x) => typeof x === 'string'))
            throw new Error('搜索结果格式不正确')
          if (active) setState({ items, loading: false, error: '' })
        } catch (cause) {
          if (active)
            setState({
              items: [],
              loading: false,
              error: cause instanceof Error ? cause.message : '搜索失败',
            })
        }
      }
      void load()
    }
    return () => {
      active = false
      controller.abort()
    }
  }, [query])
  return state
}
```

依赖变化时先清理旧 Effect，再建立新的同步过程；卸载也会清理。这里保留了教学用的手动请求状态，尚未实现缓存、防抖、重试和 SSR 数据复用。Effect 执行前也可能短暂保留上一轮状态，严格要求搜索结果与查询原子对应时，可给结果附上 query 身份并在渲染时校验，或交给成熟查询层管理。

## 依赖数组是描述，不是调度开关

Effect 中用到的响应式值应按规则列入依赖。漏写 query，Effect 就无法按新查询重新同步；每次渲染新建对象又作为依赖，则可能引发频繁执行。先改变代码结构，例如把只在 Effect 使用的对象放到其中，再判断是否需要稳定引用。不要为了“只跑一次”关闭 lint。

StrictMode 在开发环境会额外检查，包括 Effect 的建立与清理。看到重复连接先检查清理是否完整，而不是立即移除 StrictMode。支付或发布等由用户明确触发的动作，不应靠挂载 Effect 偷偷执行。

## 练习与参考

给接口增加可控延迟，确认先发晚回的请求不会覆盖新结果。卸载搜索组件再观察网络和日志。预期没有失效请求提交状态，也没有重复残留订阅。

- [React：useEffect](https://react.dev/reference/react/useEffect)
- [React：You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [React：Hooks 规则](https://react.dev/reference/rules/rules-of-hooks)
