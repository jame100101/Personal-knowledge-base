# Reducer、Context 与自定义 Hook：把复杂交互写清楚

编辑文章时有草稿、保存中、成功、失败。若用四个互不约束的布尔值，可能出现“保存中且保存成功且保存失败”的荒唐组合。复杂状态首先需要模型，其次才是选择哪个库。

## 用状态表达合法组合

```typescript
export type SaveState =
  | { status: 'editing'; draft: string }
  | { status: 'saving'; draft: string }
  | { status: 'failed'; draft: string; error: string }
  | { status: 'saved'; draft: string }

export type Action =
  | { type: 'change'; value: string }
  | { type: 'submit' }
  | { type: 'success' }
  | { type: 'failure'; message: string }

export function reducer(state: SaveState, action: Action): SaveState {
  switch (action.type) {
    case 'change':
      return state.status === 'saving'
        ? state
        : { status: 'editing', draft: action.value }
    case 'submit':
      return state.status === 'saving'
        ? state
        : { status: 'saving', draft: state.draft }
    case 'success':
      return state.status === 'saving' ? { status: 'saved', draft: state.draft } : state
    case 'failure':
      return state.status === 'saving'
        ? { status: 'failed', draft: state.draft, error: action.message }
        : state
  }
}
```

这个教学模型规定保存期间不允许继续编辑。UI 也应禁用对应输入，并用事件处理函数调用接口再 dispatch 成功或失败。reducer 只算下一状态，不执行网络请求。若产品允许保存期间继续输入，就要增加提交版本和草稿版本，不能直接沿用这个简化模型。

## Context 解决传递，不自动解决所有性能问题

Context 让子树中的组件读取共同上下文，适合主题、语言或稳定服务。Provider 的 value 变化会通知读取该上下文的消费者。把高频输入、大列表、主题和用户全装进一个大对象，可能造成不必要的更新。

先拆清职责，再根据测量考虑分离 Context、稳定 value 或选择外部 store。useReducer 与 Context 可以组合，但不是所有应用都必须这样做。Redux、Zustand 等方案各有适用场景，最重要的是状态范围和更新路径可解释。

## 自定义 Hook 不会自动共享状态

`useDraft()` 内部调用 useState，每个调用通常各有一份草稿。它复用的是行为代码。要共享数据，需要共同父级、Context 或外部 store 等明确来源。Vue composable 的函数内局部状态也有类似的实例归属问题，但其执行机制不能与 React Hook 机械等同。

返回稳定且聚焦的接口，例如 `{ draft, change, save, status }`，比暴露十几个底层 setter 更能保护业务规则。别写一个 `useEverything` 把路由、登录、通知、编辑器和请求全塞进去。

## 练习与参考

给 reducer 写三条行为测试：保存中忽略输入，失败保留草稿，失败后可以重新提交。再讨论“旧保存请求晚到”的情况：本例不允许并发保存，但真实应用若放开并发，必须用请求或版本身份过滤旧响应。

- [React：用 reducer 提取状态逻辑](https://react.dev/learn/extracting-state-logic-into-a-reducer)
- [React：Context](https://react.dev/learn/passing-data-deeply-with-context)
- [React：自定义 Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
