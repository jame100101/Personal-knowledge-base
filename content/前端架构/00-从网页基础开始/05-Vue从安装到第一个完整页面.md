# Vue 从安装到第一个完整页面：把数据和界面接起来

前面用原生 JavaScript 做搜索时，我们手动创建 li、替换列表、更新数量和空状态。现在仍做相同功能，换成 Vue。这样你能看见差别来自哪里，不用同时理解一个新业务和一个新框架。

本文使用 Vue 3 的组合式 API、单文件组件和 script setup。Vue 2、选项式 API 的文章可能长得不同，阅读时先确认写法。本知识库的练习依赖固定在 Vue 3.5.22，方便复现；这不代表它永远是最新版本。

## 1. Vue 是什么，装进项目的是什么

Vue 是用于构建用户界面的 JavaScript 框架。它提供组件、模板、响应式状态等机制。你仍然要懂 HTML 的语义、CSS 的布局和 JavaScript 的计算，Vue 帮你组织这些工作，并根据数据变化更新界面。

安装 vue 包，得到的是编译和运行界面所需的一组库；安装 Vite，得到开发服务器和构建工具；安装 Node.js，让这些开发工具能在你的电脑上运行。部署之后，浏览器并不是在你的电脑上远程运行 npm。

“渐进式”意味着可以按需要采用 Vue 的能力。简单页面可以只在一部分区域使用它；完整应用可以加路由和状态库。不是所有 Vue 页面一开始就必须安装 Vue Router、Pinia 或 Nuxt。

## 2. 先启动已经准备好的练习工程

本仓库有固定依赖的练习。在终端进入仓库后执行：

```bash
cd examples/frontend
npm ci
npm run dev
```

终端会给出本地地址，打开其中的“基础课”入口。这里 npm ci 根据 lockfile 安装依赖，npm run dev 执行 package.json 中定义的开发命令。启动失败时，先读终端最先出现的错误，不要连续重复安装。

如果要自己新建独立工程，也可以使用 Vite 的创建器：

```bash
npm create vite@latest my-vue-notes -- --template vue
cd my-vue-notes
npm install
npm run dev
```

这条命令使用执行时的创建器版本，生成目录和 Node 版本要求可能随时间变化，先核对 [Vite 入门文档](https://vite.dev/guide/)。本文代码使用普通 JavaScript，目的是先把界面模型讲清；后面的进阶课程再加入 TypeScript。

## 3. 认识入口，不要只记“替换 App.vue”

通常 index.html 中有 `<div id="app"></div>`，它是挂载容器。src/main.js 导入根组件，再让 Vue 管理这个容器：

```js
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

createApp 创建应用实例；App 是根组件；mount 根据选择器找到容器。组件可以理解为一个可组合的界面单元：它描述数据、行为和显示结果，也可以接收父级传来的输入。一个应用可以先只有一个组件，再随着需求拆分。

`.vue` 不是浏览器原生支持的文件格式。开发服务器及构建插件会把单文件组件转换成浏览器能执行的代码。不要把未经处理的 App.vue 拖进浏览器，期待它自己变成应用。

## 4. 把完整代码放进 App.vue

下面代码可替换刚创建工程的 src/App.vue。仓库的基础课也提供同一版本。

```vue
<script setup>
import { computed, ref } from 'vue'

const articles = [
  { id: 'html', title: 'HTML 页面结构' },
  { id: 'vue', title: 'Vue 响应式入门' },
  { id: 'react', title: 'React 状态入门' },
]
const query = ref('')
const input = ref(null)
const visibleArticles = computed(() => {
  const word = query.value.trim().toLowerCase()
  return articles.filter(article =>
    article.title.toLowerCase().includes(word)
  )
})
function clearSearch() {
  query.value = ''
  input.value?.focus()
}
</script>

<template>
  <main class="page">
    <h1>文章搜索</h1>
    <label for="query">搜索标题</label>
    <input id="query" ref="input" v-model="query" type="search" autocomplete="off">
    <button type="button" @click="clearSearch">清空</button>
    <p role="status">找到 {{ visibleArticles.length }} 篇文章</p>
    <ul>
      <li v-for="article in visibleArticles" :key="article.id">
        {{ article.title }}
      </li>
    </ul>
    <p v-if="visibleArticles.length === 0">没有匹配的文章，换一个词试试。</p>
  </main>
</template>

<style scoped>
.page { font: 1rem/1.7 system-ui; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; }
input, button { font: inherit; padding: .5rem; }
input { max-width: 100%; box-sizing: border-box; }
</style>
```

保存后应看到 3 篇文章，输入 vue 剩 1 篇，输入不存在的词显示空状态，清空恢复全部。若使用 Vite 默认模板，它可能还在 main.js 中导入全局 style.css；可移除模板自带的视觉规则，避免它们影响本章排版。不能因为组件里有 scoped，就断言全局样式完全不再影响它。

## 5. 按执行过程解释每一部分

script setup 中声明的顶层变量和函数可以在模板中使用。它的组件设置逻辑在每个组件实例创建时执行；不能把它想象成 React 那样每轮更新重新调用的整个组件函数。若页面有两个独立搜索组件，它们各自创建 query，互不共享搜索词。

ref('') 创建一个响应式引用，初始值为空字符串。脚本里用 query.value 读写值；模板里顶层 ref 会解包，因此写 query 就够了。框架可以追踪相应的读取和修改，安排依赖这些状态的界面更新。单纯 `let query = ''` 不会因为名字出现在模板里就自动获得同样的更新机制。

articles 是普通数组，因为本例不修改文章源数据；query 是需要变化的状态。computed 根据 query 算出 visibleArticles。它会追踪执行时读取的响应式依赖，并缓存计算结果，相关依赖变化后才需要重新计算。普通 articles 若被外部直接修改，不会仅因 computed 读取它就变成响应式；以后需要动态增删文章，可以把它也放进 ref，再通过 `.value` 更新。

模板中的双花括号插入文字，Vue 会做相应转义。`:key` 是 v-bind:key 的缩写，表示使用表达式 article.id，而不是字符串“article.id”。key 帮助 Vue 在列表变化时匹配条目身份，它不是为了让 DOM 上显示一个 key 属性。

v-for 对列表重复生成结构，v-if 控制内容是否存在。这里用列表长度同时决定数量和空状态，避免维护两个可能不同步的布尔变量。

## 6. v-model 到底替你省了什么

对于本章这种文本输入，v-model 可以理解为把输入的 value 和输入事件处理连接起来。概念上类似：

```vue
<input :value="query" @input="query = $event.target.value">
```

这段放在模板中，因此赋值目标 query 会按相应模板规则更新 ref。文本输入、复选框、单选框、select 的 v-model 使用的属性和事件细节不同；中文输入法组合事件也有处理，不能把上面这一行当成所有控件的逐字实现。

“双向绑定”说的是界面输入和状态之间的这条同步关系，不是所有变量都能随便互相修改。父子组件之间仍应明确数据归属和事件方向。也不是一写 v-model，就把数据存进数据库；本例刷新页面仍会回到初始状态。

清空时只需修改 query，模板里的输入值和列表会跟着更新，不再手动设置每个 DOM 节点。input ref 用于拿到原生输入元素并调用 focus；DOM 引用可能在挂载前或卸载后为空，所以用了可选链。聚焦是需要操作真实元素的事情，与列表数据的声明式显示并不冲突。

## 7. 接着拆一个组件，理解 props 与事件

当一行文章需要显示标题、收藏按钮等多个地方都会复用的内容，可以建 ArticleRow.vue。下面是独立的父子通信练习，不是直接拼进上面的搜索代码就自动完成收藏持久化。

```vue
<!-- ArticleRow.vue -->
<script setup>
defineProps({ title: { type: String, required: true } })
const emit = defineEmits(['favorite'])
</script>
<template>
  <li>
    {{ title }}
    <button type="button" @click="emit('favorite')">收藏</button>
  </li>
</template>
```

父组件导入它，在列表中使用 `<ArticleRow :title="article.title" @favorite="handleFavorite(article.id)" />`。父组件负责提供 handleFavorite，并决定怎样更新自己的收藏状态。props 是父组件交给子组件的输入；事件是子组件报告用户意图的一种方式。子组件知道“有人点了收藏”，不一定要知道后端数据库怎么设计。

不要为了拆分而把每个 span 都单独建文件。优先考虑独立职责、复用需要、复杂度和测试边界。一个几十行的小页面留在一个组件里，常常更容易读。

## 8. 经常卡住的几个地方

页面完全空白：先检查 main.js 是否导入正确组件，mount 的选择器与 HTML id 是否一致，再看终端编译错误和浏览器控制台。

状态改了但界面没变：检查是否用了响应式状态，脚本里是否忘了 `.value`，是否把 reactive 的原始值属性解构成普通变量。不要用定时器反复刷新页面掩盖状态设计问题。

样式“串到别处”：scoped 通常通过编译后添加属性选择器限制匹配，不是 Shadow DOM，也不会阻止 CSS 继承。父组件仍可能影响子组件根元素的布局，第三方组件内部结构还有另外的边界。

刷新后搜索词没了：本例状态保存在内存，刷新会重新创建应用。希望可分享筛选条件时考虑 URL 参数，希望跨会话保存偏好时考虑适当的持久化；先讲清楚需求再选存放位置。

## 9. 练习和自检答案

给列表加入 Vue 第二篇文章，确认输入 vue 得到 2 篇；把 query 的初始值改为 react，确认一打开就是 React 结果。这验证界面从状态计算，而不是靠用户先触发一次事件才能正确。

添加“仅显示 Vue”复选框。答案思路是 `const onlyVue = ref(false)`，复选框 v-model 连接它，computed 中组合两个筛选条件。不要再加一个 watch 负责复制 computed 已能计算出的结果。

为什么点击清空没有写 replaceChildren？因为模板已描述列表应如何由 visibleArticles 生成，更新协调交给 Vue。为什么仍需要 CSS？因为 Vue 的数据更新模型没有替你定义排版和颜色。

- [Vue：介绍](https://vuejs.org/guide/introduction.html)
- [Vue：单文件组件](https://vuejs.org/guide/scaling-up/sfc.html)
- [Vue：响应式基础](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Vue：计算属性](https://vuejs.org/guide/essentials/computed.html)
- [Vue：表单绑定](https://vuejs.org/guide/essentials/forms.html)
- [Vue：模板引用](https://vuejs.org/guide/essentials/template-refs.html)
- [Vue：Props](https://vuejs.org/guide/components/props.html)
