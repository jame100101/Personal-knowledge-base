# JavaScript、事件、数据与 DOM：亲手做出文章搜索

HTML 和 CSS 让页面有了内容和外观。现在加入一个要求：在搜索框里输入 vue，只显示相关笔记，旁边的数量也要随之变化。这需要读取输入、计算结果、更新页面。先用原生 JavaScript 做一遍，你才容易看懂 Vue 和 React 到底接手了哪些工作。

## 1. 先把语言和运行环境分开

JavaScript 提供变量、函数、数组、对象、条件和循环等表达计算的能力。document、DOM 节点、点击事件、fetch 则由浏览器环境提供。Node.js 也运行 JavaScript，但普通 Node 进程没有浏览器页面的 document。

所以“这段是 JavaScript”并不能保证它能在所有环境原样运行。浏览器脚本可以调用 document.querySelector；一个普通 Node 脚本直接这样写通常会报 document 未定义。相反，Node 文件系统 API 也不是浏览器页面随意读取用户硬盘的能力。

## 2. 准备一个不用安装依赖的完整页面

新建 `search.html`，把这一整段保存进去，再用浏览器打开。数据就在文件里，因此不需要服务器。之后涉及模块导入和网络请求的练习，会另外说明启动方式。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>原生 JavaScript 文章搜索</title>
  <style>
    body { font: 1rem/1.7 system-ui; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; }
    input, button { font: inherit; padding: .5rem; }
    input { max-width: 100%; box-sizing: border-box; }
    button:focus-visible, input:focus-visible { outline: 3px solid #a65200; }
  </style>
</head>
<body>
  <main>
    <h1>文章搜索</h1>
    <label for="query">搜索标题</label>
    <input id="query" type="search" autocomplete="off">
    <button id="clear" type="button">清空</button>
    <p id="count" role="status"></p>
    <ul id="results"></ul>
    <p id="empty" hidden>没有匹配的文章，换一个词试试。</p>
  </main>
  <script>
    const articles = [
      { id: 'html', title: 'HTML 页面结构' },
      { id: 'vue', title: 'Vue 响应式入门' },
      { id: 'react', title: 'React 状态入门' },
    ]
    const input = document.querySelector('#query')
    const clearButton = document.querySelector('#clear')
    const results = document.querySelector('#results')
    const count = document.querySelector('#count')
    const empty = document.querySelector('#empty')
    let query = ''

    function render() {
      const word = query.trim().toLowerCase()
      const visible = articles.filter(article =>
        article.title.toLowerCase().includes(word)
      )
      const items = visible.map(article => {
        const li = document.createElement('li')
        li.textContent = article.title
        return li
      })
      results.replaceChildren(...items)
      count.textContent = `找到 ${visible.length} 篇文章`
      empty.hidden = visible.length !== 0
    }

    input.addEventListener('input', event => {
      query = event.target.value
      render()
    })
    clearButton.addEventListener('click', () => {
      query = ''
      input.value = ''
      render()
      input.focus()
    })
    render()
  </script>
</body>
</html>
```

初次打开应显示 3 篇文章；输入 `VUE` 后只显示 Vue 那篇；输入不存在的词时显示 0 篇和空状态说明；点击清空恢复 3 篇，并把焦点放回搜索框。如果结果不同，先看控制台有没有红色异常，再核对元素 id 与选择器。

## 3. 变量、对象和数组各存了什么

`articles` 是数组，表示一个有顺序的集合。数组中每一项是对象，id 标识文章，title 保存标题。`article.title` 读取一项的标题。id 和标题分开，是因为标题以后可能修改，文章身份不应随之变化。

`const` 表示变量绑定不能重新赋值，不是对象被冻结。因此 `const articles = []` 后仍可以调用 articles.push；只是不能把 articles 重新赋值为另一个数组。`let query` 允许重新赋值，因为输入会变化。

这里的 `query` 是应用状态：它记录此刻用户的筛选条件。搜索结果是根据原始文章和 query 算出来的派生值，没有必要再维护一份“真实结果状态”。否则输入改了但忘记改结果，两个副本就会不同步。

## 4. 按数据流读懂 render

render 只是我们起的函数名，普通 JavaScript 不会因为这个名字而自动调用它。函数声明先描述步骤，后面的 render() 才执行步骤。

第一步，用 trim 去掉输入首尾空白，再统一为小写。这不是完整的多语言搜索方案，只是当前练习采用的匹配规则。第二步，filter 遍历原数组，保留测试函数返回 true 的项，产生新数组。includes 判断一个字符串是否包含另一个字符串；空字符串被任何字符串包含，因此清空搜索会显示全部文章。

箭头函数 `article => ...` 接收当前项并计算结果。filter 不会因为名字像“过滤器”就自动去请求后端，它只处理已有的内存数据。也不要误把 map 当成 filter：map 为每项计算输出，通常不改变项数；filter 决定保留哪些项。

第三步，map 为每篇匹配文章创建 li。document.createElement 创建 DOM 元素，textContent 把标题作为文字填进去。用户输入或接口标题可能含 `<` 等字符，用 textContent 不会把它们当作 HTML 执行。随意改成拼接 innerHTML 会改变安全边界。

第四步，展开语法 `...items` 把节点数组作为多个参数传给 replaceChildren，用这些节点替换原来全部子节点。最后更新数量和空状态。hidden 是 DOM 的布尔属性，设为 true 表示隐藏该元素。这个例子没有额外样式覆盖 hidden 的显示效果。

## 5. 事件为什么要“先注册，后执行”

addEventListener 把一个函数登记为事件发生时调用的处理器。它不会在登记时立刻替你输入一个搜索词。此后用户编辑输入框，浏览器发出 input 事件，处理函数读取当时输入值，再调用 render。

输入框的 input 事件通常随用户编辑触发；change 的触发时机依控件而异，文本输入通常在提交更改或失去焦点等时机发生。要做随输入变化的筛选，这里选 input。

为什么把 script 放在 body 末尾？因为脚本执行时，前面的元素已经被解析，querySelector 能找到它们。如果把普通脚本移到 head 且没有延迟执行安排，可能还没建立输入框就去查询，得到 null，再调用 addEventListener 就会失败。外部脚本可以使用 defer，模块脚本也有相应延迟执行语义；async 则不能保证和文档解析按这种顺序配合。

清空按钮还做了 input.value = ''，因为修改普通 query 变量不会让浏览器猜出哪个输入框应该跟着改变。这个“数据变了，要手动把相关 DOM 都同步好”的责任，正是后面框架课程要接过来的部分。

## 6. 再加网络请求，问题为什么变多了

页面请求真实文章时，可以这样写一个读取函数。这里假设你自己的服务器提供 `/api/articles`；前面的独立 HTML 文件没有这个接口，不能把下面片段当成已经完成的后端。

```js
async function loadArticles(signal) {
  const response = await fetch('/api/articles', { signal })
  if (!response.ok) throw new Error(`请求失败：${response.status}`)
  const data = await response.json()
  if (!Array.isArray(data) || !data.every(item =>
    item !== null && typeof item === 'object' &&
    typeof item.id === 'string' && typeof item.title === 'string'
  )) {
    throw new Error('接口返回的数据格式不符合预期')
  }
  return data
}
```

fetch 返回 Promise，表示一个将来完成或失败的操作。await 让当前 async 函数等待该结果，不会把整个浏览器主线程按同步睡眠方式锁住。HTTP 404、500 通常仍会得到 Response，因此要检查 ok；网络错误、取消等才可能让 fetch 本身拒绝。

JSON 能成功解析也不表示结构正确。接口可能返回 `{message: '出错了'}`，所以要校验数据形状。TypeScript 类型声明也不能代替这个运行时检查。

再想一步：用户先搜 vue，立刻改搜 react，旧请求却最后返回。若直接用最后到达的结果覆盖页面，输入是 react，列表可能却显示 vue。后续 Vue watch 与 React Effect 章节会用取消和请求有效性检查解决这个问题；“用了框架”本身不会消除网络竞态。

## 7. 原生实现的优点和代价

这个页面很小，原生实现清楚而且没有框架依赖，不需要为了显得专业立刻重写。它也暴露了真实工作量：输入值、文章节点、计数、空状态分别由你同步。再加入收藏、分页、删除、加载状态后，要确保每条操作路径都更新正确位置。

Vue 与 React 提供组件和声明式界面模型，让我们更多地表达“给定这些数据，页面应当怎样”，由框架协调更新。它们会带来额外规则、运行时代码和工程工具；收益是否值得，取决于界面的复杂度和维护需要。

## 8. 练习与答案

把 articles 增加第四项，标题写 `Vue 组件通信`。输入 vue 后应得到 2 篇。这说明显示数量和列表都从同一个 visible 计算，没必要把数量手动改成 4。

故意删除输入处理器里的 render()。你会看到输入框能打字，query 在处理器里也被赋值，但列表不变。普通变量没有自动连接 DOM，原因就在这里。

把一个标题写成 `<strong>学习笔记</strong>`。正确结果是页面显示这些符号和文字，不是加粗。这验证我们是在呈现文字，而不是信任数据为 HTML。

最后尝试加“只看包含 Vue 的文章”复选框。参考思路是新增一个布尔状态，与 query 一起用于 filter，监听复选框的 change 更新该状态，再统一调用 render。不要另外写一条只更新数量的路径。

- [MDN：JavaScript 指南](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [MDN：DOM 脚本入门](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/DOM_scripting)
- [MDN：Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter)
- [MDN：事件介绍](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Events)
- [MDN：Fetch 使用方法](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)
