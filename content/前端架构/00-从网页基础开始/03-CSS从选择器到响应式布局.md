# CSS 从选择器到响应式布局：让页面真正适合阅读

上一章写出了有标题、段落和表单的网页。它已经可以使用，只是浏览器的默认排版未必适合你的内容。CSS 的任务，是把内容排成读者容易理解、在不同屏幕上都能操作的页面。本章继续用普通 HTML，不需要 Vue 或 React。

## 1. CSS 写在哪里，浏览器怎样找到它

新建一个文件夹，放入 `index.html` 和 `style.css`。在 HTML 的 head 中加入：

```html
<link rel="stylesheet" href="./style.css">
```

这行代码要求浏览器加载同一目录的样式文件。也可以把 CSS 写在 HTML 的 style 元素里，或把少量声明写进元素的 style 属性；独立文件更容易复用。文件名和路径必须真的对应，单独创建 style.css 不会自动让 HTML 使用它。

先在 HTML 的 body 中放入以下内容。这是本章完整的练习区域：

```html
<main class="page">
  <h1>前端学习笔记</h1>
  <p class="intro">每天理解一个概念，比一次记住很多名词更有用。</p>
  <section class="cards" aria-label="学习主题">
    <article class="card">
      <h2>HTML</h2><p>给内容合适的结构和含义。</p>
      <a href="https://developer.mozilla.org/zh-CN/docs/Web/HTML">开始阅读</a>
    </article>
    <article class="card">
      <h2>CSS</h2><p>安排空间、文字和视觉层次。</p>
      <a href="https://developer.mozilla.org/zh-CN/docs/Web/CSS">开始阅读</a>
    </article>
    <article class="card">
      <h2>JavaScript</h2><p>表达计算规则，连接数据和交互。</p>
      <a href="https://developer.mozilla.org/zh-CN/docs/Web/JavaScript">开始阅读</a>
    </article>
  </section>
</main>
```

在 style.css 里写入下一节的规则，保存两个文件，刷新页面。若没有变化，先打开开发者工具的 Network 面板确认 style.css 成功加载，再检查选择器是否匹配。不要一开始就加 `!important`。

## 2. 读懂一条样式规则

```css
* { box-sizing: border-box; }
body {
  margin: 0;
  color: #243044;
  background: #f3f5f8;
  font-family: system-ui, sans-serif;
  line-height: 1.7;
}
.page { width: min(100% - 2rem, 64rem); margin: 2rem auto; }
.intro { color: #4b596d; }
.cards { display: grid; gap: 1rem; }
.card {
  min-width: 0;
  padding: 1.25rem;
  border: 1px solid #d3dbe5;
  border-radius: 0.75rem;
  background: white;
  overflow-wrap: anywhere;
}
.card h2 { margin-top: 0; }
.card a { color: #174ea6; text-underline-offset: 0.2em; }
a:focus-visible { outline: 3px solid #8b4b00; outline-offset: 4px; }
@media (min-width: 48rem) {
  .cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
```

`.card` 选择 class 列表中含 card 的元素，不是名叫 card 的 HTML 标签。`.card h2` 选择这些元素内部的 h2 后代。`a:focus-visible` 选择浏览器判断应显示焦点指示的链接状态，让键盘用户能看见自己操作到了哪里。

一条规则由选择器和声明块组成；每条声明是属性和值。浏览器遇到不支持的属性或无效的值，通常会忽略相应声明，不会像 JavaScript 抛异常那样停止所有后续样式。拼错 `background` 因此可能只是“没有效果”。

上面的 font-family 先选系统界面字体，没有合适字体时再使用无衬线字体族。line-height 使用无单位数值，表示相对当前字号的行高倍数。中文正文适当增大行高能改善阅读，但也需要结合实际字体和内容观察。

## 3. 为什么宽度 300px 的盒子可能占 344px

CSS 把通常参与布局的元素看作有内容区、内边距、边框、外边距的盒子。padding 是内容与边框之间的空间；margin 是盒子外部参与排布的间距。不要用连续空格代替布局间距。

```css
.demo {
  box-sizing: content-box;
  width: 300px;
  padding: 20px;
  border: 2px solid;
}
```

这个例子里，内容宽 300px，加两侧内边距 40px、边框 4px，边框盒宽 344px，还没有计算外边距。改成 `box-sizing: border-box`，width 会包含内容、padding 和 border，因此边框盒宽 300px，内容区相应缩小。这个计算针对上述普通盒子及给定条件，不要不加区别地套到所有布局场景。

开头的 `*` 规则让所有元素使用 border-box；它不自动选中伪元素。以后使用 `::before`、`::after` 时，可以加上 `*, *::before, *::after`。这不是规定所有项目都必须如此，而是让练习里的尺寸更容易推算。

`width: min(100% - 2rem, 64rem)` 在父容器宽度减去 2rem 与 64rem 中取较小值。左右自动外边距使块级容器居中。小屏保留边缘留白，大屏避免正文无限变宽。rem 相对根元素字号；CSS px 是 CSS 像素，不等于所有设备上的一个物理像素。

## 4. 样式冲突时，不是永远“后写的赢”

先看一个刻意缩小条件的实验：同一作者样式表、没有层、没有 important、没有动画或过渡，也没有作用域规则参与。

```css
.intro { color: green; }
p { color: purple; }
```

带 intro 类的 p 会使用 green，因为类选择器的优先级高于元素选择器。若再写一条 `.intro { color: blue; }`，两条 intro 规则优先级相同，后面的 blue 才会胜出。选择器优先级按不同类别逐项比较，不能把它理解成任意数量低级选择器最终能凑出一个 ID 的“普通十进制分数”。

真正的层叠还会考虑声明来源、重要性、层的顺序等，之后才轮到选择器优先级；`@scope` 还可能引入作用域接近度比较。`!important` 也不是脱离整个层叠规则的绝对最高级。入门时先把条件写清，再用浏览器 Styles 面板看哪条声明被划掉、哪条生效，比背一个不完整的口诀可靠。

继承是另一个过程。body 的 color 常会被后代继承，width 和 margin 通常不会。直接为子元素指定的普通 color 可以覆盖继承来的 color，即使父元素的选择器更“强”；父子不是在同一个元素上竞争那条声明。

## 5. Flex 和 Grid 分别适合怎样的问题

普通文档流已经能完成很多布局：段落自然换行、块级内容上下排列。只有当你需要明确安排子项关系时，再使用布局工具。

Flex 适合沿一个主方向安排项目，例如工具栏里的搜索框和按钮。Grid 适合同时管理行列，例如这章的文章卡片。两者都能做更多事情，这个区分是选起点的经验，不是功能限制。

```css
.toolbar { display: flex; gap: 0.75rem; align-items: center; }
.toolbar input { flex: 1; min-width: 0; }
```

display:flex 写在父元素上，直接子元素成为 flex 项。flex:1 让输入框参与分配剩余空间，min-width:0 允许它在需要时缩到固有最小宽度以下。否则长内容可能让工具栏撑出屏幕。

本章 Grid 在小屏没有显式设置多列，卡片顺序竖排；到 48rem 后建立三个等分列。minmax(0,1fr) 将列的最小值设为 0，降低长内容的固有宽度把列撑开的风险；内容自身是否溢出仍要另行处理，所以卡片还用了 overflow-wrap。

## 6. 响应式不是把电脑页面整体缩小

HTML 的 head 应有 `<meta name="viewport" content="width=device-width, initial-scale=1">`。它让移动浏览器使用适合设备的布局视口设置。不要为了让页面看起来“整齐”而禁止用户缩放。

把窗口从 1000px 拖到 390px，观察三列变成一列。断点应来自内容放不下的时刻，而不是声称所有手机都对应某个固定宽度。浏览器缩放、用户字号、横屏、翻译后的长文案都会影响布局。

再把一个标题改成很长的英文串，试试 200% 缩放，用 Tab 逐个访问链接。能看见焦点、能读完文字、没有遮挡，比“截图里刚好放得下”更接近真正可用。

## 7. 练习与参考答案

练习一：给所有卡片加阴影，但让第二张卡片使用浅黄色背景。可以给第二个 article 加 `class="card highlighted"`，新增 `.highlighted { background: #fff8df; }`。背景样式直接匹配元素；不用复制整套 card 规则。

练习二：把三列改成两列。只需把 repeat 的第一个参数改为 2。三张卡片会按文档顺序占据第一行两格和第二行第一格，DOM 阅读顺序仍是 HTML、CSS、JavaScript。

练习三：删除 style.css 的链接。页面应恢复默认外观，标题层级和链接仍然存在。这能帮助你区分内容结构与视觉呈现。

练习四：为什么 `.page { color: red }` 不一定让所有链接变红？因为链接可能有浏览器或作者直接指定的 color；继承只在适用的情况下补上值，不会压过子元素已有的声明。

延伸阅读时，先对照自己的文件实验，再读规则：

- [MDN：盒模型](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model)
- [MDN：处理样式冲突](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Handling_conflicts)
- [MDN：CSS 层叠](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade)
- [MDN：Flexbox](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox)
- [MDN：Grid](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Grids)
