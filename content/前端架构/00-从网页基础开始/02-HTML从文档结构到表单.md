# HTML 从文档结构到表单：亲手写出第一张网页

这一章只解决一件事：你能自己建立一个 HTML 文件，知道每一部分的含义，并做出标题、文章列表、链接和搜索表单。先不用框架。看见完整的输入和输出，比先记十几个术语更重要。

## 1. 建立文件并看到结果

新建一个文件夹，在里面建立 `index.html`。文件必须保存为普通文本，编码使用 UTF-8。不要让编辑器悄悄把它保存为 `index.html.txt`。把下面内容复制进去，保存后用浏览器打开：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>我的学习笔记</title>
  </head>
  <body>
    <header>
      <h1>我的学习笔记</h1>
      <p>记录我真正弄明白的知识。</p>
    </header>
    <main>
      <section aria-labelledby="articles-heading">
        <h2 id="articles-heading">最近阅读</h2>
        <ul>
          <li><a href="https://developer.mozilla.org/zh-CN/">学习 HTML</a></li>
          <li><a href="https://cn.vuejs.org/">认识 Vue</a></li>
        </ul>
      </section>
    </main>
    <footer><p>持续整理，随时修正。</p></footer>
  </body>
</html>
```

你应看到一个大标题、一段介绍和两个链接。浏览器标签上的文字来自 title，页面里看见的大标题来自 h1。两者用途不同，不要把它们当成同一个东西。

双击文件得到的通常是 `file://` 地址，适合这一章的静态练习。后面使用模块脚本或请求本地 JSON 时，应通过本地 HTTP 开发服务器访问，因为浏览器对文件来源有不同的限制。

## 2. 按层解释文档

doctype 帮助浏览器采用标准模式；html 是文档根元素，lang 告诉浏览器及辅助技术主要语言；head 放元信息、样式引用等；body 放主要可呈现内容。charset 声明字符编码，viewport 告诉移动端怎样建立视口，不是给所有设备强制设置一个固定像素宽度。

header、main、footer 表达不同区域的语义。它们不会自动变成好看的三段布局，外观仍由 CSS 决定。section 表示有主题的分区，一般应有合适标题；只是为了包一层做样式时，普通 div 可能更合适。

HTML 语义帮助浏览器、辅助技术、搜索工具和维护者理解内容。它不是额外装饰，也不保证用了几个语义标签就已经实现完整无障碍。

## 3. 元素、标签、属性和 DOM

`<a href="...">学习 HTML</a>` 是一个元素的写法：开始标签指定元素和属性，中间是内容，结束标签表示范围。href 是属性，不是 CSS 样式。`class="card"` 可用于把多个元素归为同一组，`id="search"` 则应在文档中唯一。

浏览器解析 HTML 后会建立 DOM，也就是可供程序访问的文档树。源代码中的标签文字和内存里的 DOM 节点不是同一个东西。浏览器会纠正部分无效嵌套，所以“查看源代码”和开发工具的 Elements 看到的结构有时不同。

例如，不要把一个完整的 div 放进 p 里再依赖浏览器猜你的意图；p 是段落，并不是任意内容的大容器。正确嵌套能避免后续样式、脚本和 hydration 产生难懂问题。

## 4. 常用元素怎样选

| 想表达什么 | 常用元素 | 容易混淆的点 |
| --- | --- | --- |
| 标题层级 | h1 到 h6 | 根据内容层级选择，不根据字体大小选择 |
| 普通段落 | p | 换行和段落不是同一件事 |
| 无顺序 / 有顺序列表 | ul / ol 与 li | 列表项放在 li 中 |
| 跳转到另一个位置 | a | href 给出目的地 |
| 执行当前界面动作 | button | 明确 type，避免意外提交 |
| 有强烈重要性的文字 | strong | 不是所有粗体都必须使用 strong |
| 图片 | img | alt 取决于图片用途，装饰图常用空 alt |
| 数据表格 | table 等 | 不用表格硬拼整个页面布局 |

链接用来导航，按钮用来执行动作。用 div 加点击事件模拟按钮，会额外承担键盘、焦点和语义等责任。优先使用原生元素通常更简单。

img、input、meta 等是空元素，没有子内容，也不写配对结束标签。在 HTML 中 `<input>` 与 `<input />` 常见，但这个斜线不会让任意普通元素变成 XML 式自闭合。React JSX 则有自己的语法要求，后面会单独讲。

## 5. 写一个真正有语义的搜索表单

把这段放到 main 内：

```html
<form action="/search" method="get">
  <label for="query">搜索文章</label>
  <input id="query" name="q" type="search" placeholder="例如：Vue">
  <button type="submit">搜索</button>
</form>
```

label 的 for 对应 input 的 id，点击标签可以聚焦输入框。name 决定表单提交时字段叫什么。用户输入 Vue 后提交，浏览器会尝试导航到类似 `/search?q=Vue` 的地址；具体编码由浏览器完成。

这里尚未提供 `/search` 服务端路由，因此这个例子说明的是原生提交机制，不承诺你的静态文件已经能返回搜索结果。后面接入 JavaScript 时，我们会拦截提交，在当前页面完成筛选。

placeholder 是提示，不应代替 label，因为输入后它就消失了。没有 name 的输入虽然能打字，但通常不会作为对应字段出现在原生表单提交的数据中。

## 6. 属性值不一定按日常语言理解

```html
<button type="button" disabled>正在保存</button>
```

disabled 是布尔属性，它的出现表示禁用。写 `disabled="false"` 并不意味着启用，因为该属性仍然存在。要启用，应移除这个布尔属性，或通过 DOM 属性设置 `button.disabled = false`。

aria-pressed 等 ARIA 属性又不是相同规则，需要使用它定义的字符串状态。不要凭属性名字像布尔值，就把所有属性都按 disabled 的规则处理。

HTML 的 required、minlength 等能提供原生约束验证，但不能替代服务端验证。别人可以直接构造请求，绕开你的页面。

## 7. 路径与字符怎么处理

`href="notes.html"` 是相对当前文档位置的路径；`href="/notes"` 从当前站点根路径出发；完整 `https://...` 则指定外部地址。部署在子路径时，这些区别会影响资源能否找到。

要在正文显示小于号，可以使用 `&lt;`；要把示例标签显示为文字，而不是让浏览器当标签解析，可把转义后的代码放在 pre/code 中。pre 保留空白排版，code 表示代码语义，它们不会自动给代码加语法高亮。

普通 HTML 中多次空格和换行常被折叠显示；不要用十几个空格调整位置，布局交给 CSS。内容中的真实空白需求应按具体元素和 white-space 样式处理。

## 8. 用开发工具验证自己的理解

在浏览器中打开开发工具，定位 h1，临时把文字改掉。页面会变化，但磁盘上的 index.html 没被修改；刷新后恢复。这说明你改的是当前 DOM。再修改本地文件并保存，刷新才会持久显示新内容。

给链接加一个错误路径并点击，观察地址变化。再删去 label 的 for，点击标签测试焦点是否仍按预期工作。不要只看“页面有没有红色报错”，浏览器对很多 HTML 错误会容错，但可用性已经变差。

## 9. 练习和参考答案

练习一：加一个“学习计划”有序列表，列出 HTML、CSS、JavaScript。参考做法是 ol 中包含三个 li，而不是在三个 p 前手写数字。

练习二：给图片写替代文本。若图片传递“课程关系图”的信息，alt 应简要表达其目的，并在正文提供复杂图的完整解释；若只是装饰花纹，空 alt 可避免辅助技术反复播报无用信息。

练习三：把提交按钮放到一个表单里，但希望它只切换收藏。参考答案是使用 `type="button"` 并另写行为，不应依赖表单提交的默认动作。

## 继续阅读

- [WHATWG：HTML 元素](https://html.spec.whatwg.org/multipage/semantics.html)
- [MDN：文档与网站结构](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Structuring_documents)
- [MDN：表单](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Your_first_form)
- [MDN：布尔属性](https://developer.mozilla.org/en-US/docs/Glossary/Boolean/HTML)
