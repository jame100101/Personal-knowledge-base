# HTML、CSS、JavaScript、Vue、React 到底是什么：先把关系讲清楚

如果你心里有这样的问题——“已经有 HTML 和 CSS 了，为什么还需要 Vue 或 React？它们是不是另一种写网页的语言？”——这一章就从这里开始。先不安装任何东西，也不要求你认识“组件”“响应式”这些词。我们沿着一个收藏按钮，把网页怎样工作解释清楚。

## 1. 你在浏览器里看到的页面，是怎样来的

打开一篇文章时，浏览器会取得描述页面的资源，解析它们，再把结果显示在屏幕上。这些资源可以来自服务器，也可以来自你电脑上的文件。对普通网页而言，最基础的三类技术是 HTML、CSS 和 JavaScript。

**HTML 是标记语言**。它用元素描述内容的结构和含义，例如“这里是标题”“这里是一段正文”“这里是一个可以提交的表单”。HTML 本身不是用来写任意计算算法的通用编程语言，但它并不只是摆文字：链接可以导航，表单可以提交，原生控件也自带交互行为。

**CSS 是样式表语言**。它描述这些内容怎样呈现，例如字体、颜色、间距、布局，以及不同屏幕宽度下怎样排列。CSS 也能做动画和一些状态相关的视觉变化，不能简单理解为“只负责改颜色”。

**JavaScript 是编程语言**。浏览器提供 DOM、事件、网络请求等 API，让 JavaScript 可以读取或修改页面、响应操作、获取数据。JavaScript 也能在 Node.js 等环境中运行，但那些环境提供的 API 和浏览器不完全一样。

这三个概念不是三个互相替代的工具。它们是在描述同一个页面的不同方面。

## 2. 先只用 HTML，看看你已经能做什么

```html
<article>
  <h1>我的第一篇学习笔记</h1>
  <p>今天认识 HTML、CSS 和 JavaScript。</p>
  <a href="https://developer.mozilla.org/zh-CN/">阅读 MDN 文档</a>
  <button type="button">收藏</button>
</article>
```

`article` 包住一份相对独立的内容；`h1` 是标题；`p` 是段落；`a` 的 href 指定链接目的地；button 提供可聚焦、可点击的按钮语义。即使没有 CSS，这些内容仍能显示，链接仍能跳转，按钮也有浏览器默认样式。

但这个“收藏”按钮还没有实现收藏规则。浏览器知道它是按钮，却不知道你的产品里“收藏文章”意味着什么。要把用户点击和应用的数据变化连接起来，还需要行为逻辑。

请留意 `type="button"`：button 在表单里省略 type 时可能执行提交。明确类型可以避免以后把它放进表单后，收藏一次却意外提交整张表单。

## 3. 加上 CSS，结构不变，外观变了

```css
article {
  max-width: 40rem;
  margin: 2rem auto;
  padding: 1.5rem;
  border: 1px solid #d0d7de;
  border-radius: 0.75rem;
}
button {
  padding: 0.5rem 1rem;
  color: white;
  background: #246c50;
  border: 0;
  border-radius: 0.4rem;
}
```

`article`、`button` 是选择器，表示规则作用于哪些元素；花括号里是“属性: 值”。`max-width` 限制最大宽度，margin 设置外边距，padding 设置内边距。`rem` 以根元素字体大小为参照，具体换算由页面样式决定，不是永远固定为 16 像素。

现在卡片有了边框，按钮变成绿色，但收藏还是没有业务行为。改变视觉外观不会自动建立数据规则。

## 4. 加上 JavaScript，按钮才知道怎样改变状态

为了让脚本找到按钮，给它一个唯一 id：

```html
<button id="favorite" type="button" aria-pressed="false">收藏</button>
<script>
  const button = document.querySelector('#favorite')
  let saved = false

  button.addEventListener('click', () => {
    saved = !saved
    button.textContent = saved ? '已收藏' : '收藏'
    button.setAttribute('aria-pressed', String(saved))
  })
</script>
```

按顺序读这段代码：先找到按钮，创建一个叫 saved 的变量记录是否收藏，再注册点击处理函数。用户点击时，`!saved` 把真假翻转；`textContent` 改文字；`aria-pressed` 告诉辅助技术这是一个有按下状态的切换按钮。

脚本放在按钮之后，因此执行查询时按钮已经被解析。这个例子只把收藏保存在内存中，刷新就重置；没有数据库，也没有向其他设备同步。要持久化，必须另外设计存储和读取过程。

到这里，你已经用原生技术完成了一个交互功能。**没有 Vue 或 React，照样可以开发网页和复杂应用。** 是否引入框架，取决于组织代码和维护复杂度的需要。

## 5. 当一个按钮变成一百个按钮，困难在哪里

假设每篇文章都有收藏按钮，页面顶部还有“收藏数量”，侧栏有“只看收藏”，登录后还要从服务器恢复收藏。一次点击不再只改按钮文字，而要让多个位置一起保持一致。

你当然可以继续使用 JavaScript 手动完成：找到相应卡片，更新按钮，重新计算数量，刷新筛选结果，再处理接口失败。真正难的是确保每个状态变化都同步到正确的界面，而且不要漏掉错误、取消、切换用户等路径。

Vue 和 React 主要帮助我们更有秩序地处理这种界面复杂度。它们提供组件化、状态与界面之间的更新模型，以及相关开发生态。不是浏览器新增了两种网页语言，而是我们在 JavaScript 的基础上使用框架或库。

## 6. Vue 是什么

**Vue 是用于构建用户界面的 JavaScript 框架。** 常见写法是一个 `.vue` 单文件组件，把模板、逻辑和样式放在一起。组件可以理解为“一个有明确输入、显示内容和交互行为的界面单元”，例如文章卡片、搜索框、编辑表单。

在 Vue 中，你可以声明“按钮显示什么由 saved 决定”，当响应式状态变化时，Vue 安排相应界面更新。你不需要在每个分支里手动查找按钮并替换文字。

```vue
<script setup>
import { ref } from 'vue'
const saved = ref(false)
</script>

<template>
  <button type="button" :aria-pressed="saved" @click="saved = !saved">
    {{ saved ? '已收藏' : '收藏' }}
  </button>
</template>
```

这是 Vue 单文件组件，不是可以直接双击运行的完整 HTML。一般需要项目工具先处理它。`ref(false)` 创建可追踪状态；`{{ ... }}` 在模板中插入表达式结果；`@click` 注册点击行为；`:aria-pressed` 把属性和状态连接起来。后面的 Vue 教程会逐行讲这些写法。

Vue 也可以通过浏览器脚本引入，给已有 HTML 增加局部交互；并不是使用 Vue 就必须把整站重写。单文件组件只是最常见的工程写法之一。

## 7. React 是什么

**React 是用于构建用户界面的 JavaScript 库。** React 项目通常把组件写成函数，用 JSX 描述界面。JSX 是一种 JavaScript 语法扩展，写起来像标签，但它不是一个独立的 HTML 文件，也不是浏览器天然理解的新标记语言。

```jsx
import { useState } from 'react'

export default function FavoriteButton() {
  const [saved, setSaved] = useState(false)
  return (
    <button type="button" aria-pressed={saved}
      onClick={() => setSaved(previous => !previous)}>
      {saved ? '已收藏' : '收藏'}
    </button>
  )
}
```

`useState(false)` 给组件一份状态和请求更新它的函数。点击时调用 setSaved；React 之后重新计算相关界面并提交需要的变化。JSX 中的花括号表示进入 JavaScript 表达式。

React 自己没有规定完整应用必须使用哪一种路由、数据库或目录结构。实际项目会选择 React Router、Next.js 等配套方案，或者采用适合自己的组织方式。把它叫“库”并不表示它只能做小页面；把 Vue 叫“框架”也不表示它包办数据库和所有后端工作。

## 8. 它们与 HTML + CSS 的区别，到底应该怎样比较

| 你想解决的问题 | HTML / CSS | JavaScript | Vue / React |
| --- | --- | --- | --- |
| 表达一篇文章、一个链接、一个表单 | HTML 提供结构与语义 | 可读取或创建这些节点 | 用组件描述这些结构 |
| 改颜色、间距、响应式布局 | CSS 直接负责 | 可按需要切换 class 等 | 仍使用 CSS 或相关样式方案 |
| 点击后计算、请求接口、更新数据 | HTML/CSS 有部分原生行为，但不足以表达任意业务逻辑 | 直接使用语言和浏览器 API 实现 | 在 JavaScript 基础上组织状态与界面更新 |
| 多处界面随同一数据变化 | 需要设计更新方法 | 可以手动管理 DOM 和数据 | 提供声明式更新与组件模型 |
| 保存到数据库、验证用户权限 | 不能只靠页面完成 | 调用可信服务端接口 | 同样需要服务端或数据库权限机制 |

因此，合理的比较不是“HTML/CSS 和 Vue/React 哪个更好”，而是“这个界面用原生 JavaScript 管理，还是引入 Vue/React 帮助组织”。使用任何一种方案都需要理解 HTML、CSS 和 JavaScript。

“Vue 是 HTML 写法、React 是 JavaScript 写法”也只是粗略印象。Vue 模板里有 JavaScript 表达式，Vue 也支持 JSX；React JSX 最终也会描述网页元素和组件。不要把表面语法当成所有架构差异。

## 9. 源码、构建结果和浏览器画面是三层不同的东西

你写的 `.vue`、`.tsx`、TypeScript 可能经过工具转换，形成 JavaScript、CSS 和 HTML 等资源。浏览器加载资源，执行运行时代码，形成实际 DOM，再结合 CSS 布局绘制。服务器渲染时，还可能先生成 HTML 再由客户端接管交互。

所以“用了 React 以后不需要 HTML”不准确；“浏览器直接运行 `.vue` 文件”也通常不准确。你少写了手工维护 DOM 的代码，不等于底层网页结构消失了。

Vite 是帮助开发与构建项目的工具，Node.js 是常见的工具运行环境。它们又是另一个层面：一个网页的用户不需要安装 Node.js 才能浏览网站，但开发者往往会用 Node.js 运行构建工具。

## 10. 什么情况下先不用框架

只有几段静态介绍、少量交互的网页，可以先用 HTML/CSS 和少量 JavaScript。这样概念负担小，也更容易看清浏览器行为。有复杂状态、多页面协作、复用组件或团队约定时，再评估框架会更自然。

不要为了展示“现代技术栈”给一页简历装上十几个库。也不要因为一个按钮原生写法很短，就认定大型编辑器完全不需要框架。评价要对应实际功能规模和维护方式。

## 11. 检查自己有没有理解

1. 改按钮圆角主要找哪里？答案：CSS。
2. 让点击收藏后发送保存请求主要找哪里？答案：JavaScript 行为逻辑；使用框架时通常放在组件事件或功能层。
3. 用了 Vue 能不能省掉 CSS 学习？答案：不能，样式和布局问题仍然存在。
4. React 能不能直接替代数据库？答案：不能，它的职责是界面；持久化需要其他系统。
5. `.vue` 文件为什么不能随便当 `.html` 打开？答案：单文件组件语法通常要经过编译处理，不是标准 HTML 文档。
6. 没有 JavaScript 的网页是否完全没有交互？答案：不是，链接、表单、details 等有原生行为；只是不能表达任意应用逻辑。

如果第六题与你原来的认识不一样，记住这种学习方法：每遇到一句“只能”“一定”“完全不需要”，都找一个具体场景验证它的边界。

## 参考与后续学习

本章示例为教学原创。接下来依次阅读 HTML、CSS、JavaScript 基础操作，再进入 Vue、React 实操，不需要先背所有架构名词。

- [MDN：HTML 的基本语法](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax)
- [MDN：什么是 CSS](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/What_is_CSS)
- [MDN：什么是 JavaScript](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_is_JavaScript)
- [Vue：介绍与不同使用方式](https://vuejs.org/guide/introduction.html)
- [React：Quick Start](https://react.dev/learn)
