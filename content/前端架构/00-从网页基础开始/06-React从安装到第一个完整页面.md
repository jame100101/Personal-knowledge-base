# React 从安装到第一个完整页面：理解组件、JSX 和状态

这一章继续做相同的文章搜索。你可以直接从本章开始，不必先学会 Vue；前提是能看懂 HTML、函数、数组和事件。如果函数或 filter 还陌生，先回到 JavaScript 基础课做一遍原生实现。

本文使用 React 函数组件与 Hooks。仓库练习固定在 React 19.1.1，展示的是基础用法，不是关于所有历史版本或所有 React 框架的统一说明。

## 1. React 是什么，为什么常被叫作库

React 是构建用户界面的库，核心工作包括用组件描述界面、保存组件状态、协调状态变化后的显示。React 本身不会替所有项目规定路由、数据获取、目录层级或服务端部署方案；完整应用通常结合其他工具或框架。

Vue 通常称为框架，React 通常称为库，但这不是“Vue 能做网站，React 不能”的区别。二者都能成为复杂应用的界面基础，都需要 HTML 语义、CSS 和 JavaScript。选择时要看团队经验、应用需求和配套方案，不能只凭名称判断性能或规模上限。

React 也不是浏览器的一门新语言。JSX 是常用的语法扩展，通常由工具转换；最终浏览器执行 JavaScript，由 React DOM 等负责浏览器界面的渲染。

## 2. 从工程入口开始

运行仓库里的固定依赖练习：

```bash
cd examples/frontend
npm ci
npm run dev
```

打开终端地址中的基础课入口。若要创建独立练习工程，可以使用：

```bash
npm create vite@latest my-react-notes -- --template react
cd my-react-notes
npm install
npm run dev
```

latest 是执行时的创建器版本，不是本文锁定的教学版本；遇到 Node 版本要求时核对 [Vite 官方说明](https://vite.dev/guide/)。Vite 适合这里的小型客户端学习实验；真实产品是否需要带路由和服务端能力的框架，应单独判断。

常见入口是 index.html 中的 `<div id="root"></div>`，以及 src/main.jsx：

```jsx
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const container = document.getElementById('root')
if (!container) throw new Error('页面缺少 root 容器')
createRoot(container).render(<App />)
```

React 与 React DOM 职责有关联但不完全相同；这里使用面向浏览器 DOM 的入口。createRoot 创建用于管理容器内容的 root，render 请求显示 App。服务端已经生成的 React HTML 需要考虑 hydrateRoot 等流程，不应不加区别地套用这个纯客户端入口。

## 3. 一份完整的 App.jsx

将下面代码放入 src/App.jsx。仓库基础课也提供同一份代码。

```jsx
import { useRef, useState } from 'react'
import './style.css'

const articles = [
  { id: 'html', title: 'HTML 页面结构' },
  { id: 'vue', title: 'Vue 响应式入门' },
  { id: 'react', title: 'React 状态入门' },
]

export default function App() {
  const [query, setQuery] = useState('')
  const input = useRef(null)
  const word = query.trim().toLowerCase()
  const visibleArticles = articles.filter(article =>
    article.title.toLowerCase().includes(word)
  )

  function clearSearch() {
    setQuery('')
    input.current?.focus()
  }

  return (
    <main className="page">
      <h1>文章搜索</h1>
      <label htmlFor="query">搜索标题</label>
      <input
        id="query" ref={input} type="search" autoComplete="off"
        value={query} onChange={event => setQuery(event.target.value)}
      />
      <button type="button" onClick={clearSearch}>清空</button>
      <p role="status">找到 {visibleArticles.length} 篇文章</p>
      <ul>
        {visibleArticles.map(article => (
          <li key={article.id}>{article.title}</li>
        ))}
      </ul>
      {visibleArticles.length === 0 && <p>没有匹配的文章，换一个词试试。</p>}
    </main>
  )
}
```

同目录创建 style.css：

```css
body { margin: 0; }
.page { font: 1rem/1.7 system-ui; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; }
input, button { font: inherit; padding: .5rem; }
input { max-width: 100%; box-sizing: border-box; }
```

如果使用 Vite 模板，检查 main.jsx 是否还导入带默认深色背景或居中规则的 index.css；可移除演示模板样式。预期行为与原生、Vue 版本相同：初始 3 条，输入 VUE 变成 1 条，无匹配时 0 条，清空恢复并聚焦输入框。

## 4. 组件函数不是一段只执行一次的初始化脚本

App 是一个组件函数。React 调用它，得到这轮要显示的界面描述。状态变化、父组件更新等情况可能导致 React 再次调用组件；调用组件函数不等于把所有 DOM 全部销毁重建。

函数里的局部变量每次调用都会重新产生，所以 `let query = ''` 并不能承担 React 状态：修改它既不通知 React，也不会自动在下一轮保留。useState 为组件提供跨渲染保存的数据和更新方法。

`const [query, setQuery] = useState('')` 使用数组解构：query 是本轮状态值，setQuery 用来请求更新，空字符串是初始值。你可以改变变量名，但必须理解这两个位置的不同职责。

调用 setQuery 后，当前事件函数里已有的 query 不会被原地替换。React 会处理更新，并在之后的渲染给组件相应的新值。因此状态常被解释为一轮渲染的快照。不要紧接着 setQuery 就读旧闭包中的 query，误以为更新失败。

## 5. JSX 看起来像 HTML，为什么又不是 HTML

JSX 把界面结构写进 JavaScript 表达式里。标签使用类似 HTML 的形式，但有自己的语法规则：标签要正确闭合，相邻顶层节点通常要由共同父节点或 Fragment 包起来，className 和 htmlFor 使用 React DOM 对应属性名。

花括号允许插入表达式，如 `{article.title}`。表达式能计算出值；if 语句不能直接写成 `{if (...) ...}`。可以在 return 前用 if 决定返回内容，也可以在 JSX 中用条件表达式、逻辑与等。

本例 map 将文章对象转换为一组 li 界面描述，没有手动 createElement。key 为同级列表项提供稳定身份。key 不会作为普通 props 自动传给子组件；需要业务 id 时应另外传 `id={article.id}`。可重排或删除的列表，不要为了省事总用数组下标。

React 会把普通字符串子节点作为文本呈现。不要为了显示接口里的标题而改用 dangerouslySetInnerHTML；那会进入需要另行处理的 HTML 注入边界。

## 6. 输入框为什么同时有 value 和 onChange

value={query} 表示输入内容由 React 状态控制；onChange 收到用户编辑后，读取新值并调用 setQuery。新状态参与下一轮渲染，输入框、数量和列表共同反映它。这通常叫受控输入。

只传 value 却没有相应更新处理，用户可能发现输入无法正常编辑，因为每次显示仍由旧状态决定。只传 defaultValue 则是另一种思路：它设置初始值，后续当前输入主要由 DOM 自己保存。两种方式各有用途，不要在同一个输入的生命周期里无意切换受控和非受控状态。

onClick={clearSearch} 传的是函数，让 React 在点击时调用。写成 onClick={clearSearch()} 则会在计算 JSX 时立即调用它，把返回值当处理器，这会导致错误行为，甚至触发更新循环。

useRef 保存一个在渲染间稳定的可变容器。这里 React 将真实输入节点放入 input.current，方便清空时聚焦。更改 ref.current 本身不会请求重新渲染，所以不能把页面上要显示的搜索词只放在 ref 里，然后期待界面自动刷新。

## 7. 为什么没有 useEffect 和 useMemo

列表由 query 和固定 articles 直接算出，这是一段普通计算。每次需要渲染时算一次即可。用 Effect 再把结果复制进另一份 state，会增加一次同步过程，也增加数据不一致的可能。

Effect 适合把组件与外部系统同步，例如建立连接、订阅浏览器事件；请求也需要配合正确的生命周期和竞态处理。它不是“凡是状态变化后要做的事都放进去”的万能容器。

useMemo 是性能优化工具之一，不是计算变量的必需语法。三个文章标题的筛选通常没有缓存的必要。先测出实际昂贵的工作，再判断是否值得优化；不能用是否写了 useMemo 判断代码是否专业。

常用 useState、useRef、useEffect 等 Hooks 要在函数组件或自定义 Hook 的顶层调用，不能放在会改变调用顺序的条件或循环里。React 的 use API 有特殊规则，不能据此放宽这些常用 Hooks 的约束。

## 8. 拆组件时怎样传入数据和报告操作

下面是另一个独立的小例子：

```jsx
function ArticleRow({ title, onFavorite }) {
  return (
    <li>
      {title}
      <button type="button" onClick={onFavorite}>收藏</button>
    </li>
  )
}
```

父组件使用 `<ArticleRow title={article.title} onFavorite={() => handleFavorite(article.id)} />`，并实现自己的 handleFavorite。props 是传给组件的输入，可以包含字符串、对象，也可以包含函数。父级拥有收藏状态，子级通过回调把操作交给父级。

如果收藏数据是数组状态，使用 map 产生更新后的数组和需要变化的对象。直接修改旧对象再把相同数组引用传回，既可能让 React跳过期待中的更新，也会破坏旧渲染所看到的数据快照。不同条目不需要全部复制，关键是保持没有变化的对象不被偷偷修改。

## 9. 自己解释一次更新，才算学会

按顺序说出来：用户输入 → onChange 执行 → setQuery 请求更新 → React 用新状态调用组件 → filter 得到结果 → React 协调提交需要的 DOM 变化。这个过程没有要求你手动同步计数和列表。

练习一：把初始状态改成 `useState('react')`。页面首次显示应只有 React 那篇，输入框也应显示 react。若只是列表改变，检查输入是否真的绑定 value。

练习二：加一个显示 query.length 的段落。无需增加 state，也无需 Effect。它是当前 query 的派生值。

练习三：在事件里连续两次执行 `setCount(count + 1)` 为什么不可靠地表示加二？同一轮读取的 count 没变，两个表达式算出的目标值相同。需要基于前一次更新结果累计时用 `setCount(n => n + 1)` 两次，更新函数保持纯净。

练习四：为什么这章仍有 HTML 标签和 CSS？React 组织的是界面和数据更新，不替代浏览器的内容语义及布局体系。能写 JSX，不等于已经学会无障碍 HTML 和 CSS 布局。

- [React：你的第一个组件](https://react.dev/learn/your-first-component)
- [React：使用 JSX 编写标签](https://react.dev/learn/writing-markup-with-jsx)
- [React：组件的记忆](https://react.dev/learn/state-a-components-memory)
- [React：状态快照](https://react.dev/learn/state-as-a-snapshot)
- [React：响应事件](https://react.dev/learn/responding-to-events)
- [React：input](https://react.dev/reference/react-dom/components/input)
- [React：你可能不需要 Effect](https://react.dev/learn/you-might-not-need-an-effect)
