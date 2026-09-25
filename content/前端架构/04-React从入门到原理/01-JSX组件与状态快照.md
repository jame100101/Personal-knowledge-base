# React 入门：JSX、组件和状态快照

从 Vue 转到 React 时，最值得先调整的不是模板语法，而是对一次渲染的理解。React 会再次调用组件函数，计算这一轮界面；这一轮里拿到的 state 和事件处理函数，都有自己的时间位置。

## 同一个搜索需求换一种写法

下面是完整组件，可替换 Vite React TypeScript 项目的 `src/App.tsx`：

```tsx
import { useState } from 'react'

const articles = [
  { id: 'vue', title: 'Vue 响应式入门' },
  { id: 'react', title: 'React 状态入门' },
]

export default function App() {
  const [query, setQuery] = useState('')
  const word = query.trim().toLocaleLowerCase()
  const visibleArticles = articles.filter((article) =>
    article.title.toLocaleLowerCase().includes(word),
  )
  return (
    <main>
      <label htmlFor="query">搜索文章</label>
      <input
        id="query"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <p role="status">找到 {visibleArticles.length} 篇文章</p>
      <ul>
        {visibleArticles.map((article) => (
          <li key={article.id}>{article.title}</li>
        ))}
      </ul>
      {visibleArticles.length === 0 && <p>没有匹配的文章，换个词试试。</p>}
    </main>
  )
}
```

JSX 是 JavaScript 的语法扩展，花括号里写表达式。组件名首字母大写，原生元素用小写。筛选列表是本轮计算出来的结果，不需要额外 state，更不需要 Effect 把它抄进另一个 state。

## 为什么 set 后读到的还是旧值

假设本轮 count 是 0，事件中执行 `setCount(count + 1)`，不会把当前函数里的 count 改成 1；它请求之后的渲染使用新状态。在同一个事件里连续写三次，三个表达式都可能是在请求设成 1。

```tsx
// 放在拥有 count / setCount 的组件事件处理函数里
setCount((previous) => previous + 1)
setCount((previous) => previous + 1)
setCount((previous) => previous + 1)
```

这种更新函数让后一个更新基于队列中的前一个结果，最终增加 3。更新函数应保持纯净，别在里面发送请求；开发检查可能重复调用纯计算来暴露问题。

## 闭包不是 React 发明的陷阱

定时器中的函数会捕获创建它那轮渲染的变量。如果你希望“提交时发送当时的草稿”，这通常正是想要的行为；如果你想持续读取最新状态，就需要重新设计同步方式，不能简单把所有值都塞进 ref 绕开状态模型。

对象和数组状态应通过新值更新。例如收藏用 map 返回更新后的记录，不要原地修改数组再传回相同引用。共享旧对象还可能改坏先前渲染保留的快照，使排查更困难。

## 练习与参考

给计数器分别写“连续设三次 count + 1”和“连续三次函数式更新”，先预测再点击。随后给搜索框添加清空按钮，确认结果自然恢复，不需要手动同步另一份结果数组。

- [React：State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)
- [React：更新队列](https://react.dev/learn/queueing-a-series-of-state-updates)
- [Full Stack Open：React 入门](https://fullstackopen.com/en/part1/introduction_to_react/)

## 用三轮渲染理解“快照”

第一次调用组件时 query 是空字符串，visibleArticles 包含全部记录；用户输入 v 后，事件处理器请求 query 变为 v；下一轮组件调用拿到 v，再重新计算筛选结果。前一轮创建的函数仍关联那一轮变量，这就是普通 JavaScript 闭包与 React 更新模型共同产生的行为。

试着在事件中先打印 query，再 setQuery('vue')，最后又打印 query。两次打印可能都是该轮旧值，这不证明 React 没工作。应观察下一轮渲染或最终界面，而不是期待 setter 改写已存在的 const 绑定。

同一事件中三次 setCount(count+1) 在这里请求相同目标值；函数式更新则把计算排进队列，依次获得前一个结果。更新函数必须纯净，因为 React 可能在开发检查中再次调用它。发送邮件、扣款或发布文章绝不能藏在这个计算函数里。

给对象 state 更新时，复制的是需要变化的路径。比如文章列表用 map，目标文章返回 `{...article, favorite: !article.favorite}`，其他文章保持原引用。它既避免改写旧快照，也保留未变化数据的身份，不需要每次 JSON 序列化整个状态树。
