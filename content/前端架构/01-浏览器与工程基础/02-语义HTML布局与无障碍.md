# 语义 HTML、CSS 与无障碍：先把页面做成能用的东西

一个看起来像按钮的 div，可能无法通过键盘聚焦，也没有按钮的语义。视觉上很完整的页面，换一种操作方式就寸步难行。组件库不能替我们决定这些基本行为。

## 先选元素，再加样式

跳转到文章用链接，执行收藏动作使用 button；搜索框需要明确标签，文章正文用 main、article 和有层级的标题。不要为了字体大小把 h3 换成 h1，文字大小交给 CSS。屏幕阅读器和文章目录都依赖结构。

```html
<form role="search">
  <label for="article-query">搜索文章</label>
  <input id="article-query" name="q" type="search" />
  <button type="submit">搜索</button>
</form>
<p role="status" aria-live="polite">找到 6 篇文章</p>
```

这个表单仍需接入搜索逻辑，但键盘提交和标签关系已经有了基础。placeholder 会在输入后消失，不能代替标签。状态区域适合播报结果数量，不要每输入一个字就播报整篇文章。

## 布局从内容出发

知识库通常是目录、正文、页内大纲三列。大屏适合并排，小屏应优先保留正文，把目录收进可操作的入口。CSS Grid 适合整体分区，Flexbox 适合一行按钮排列；它们可以一起使用。

```css
.reading-layout {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 1.5rem;
}
.article {
  min-width: 0;
  overflow-wrap: anywhere;
}
.article pre {
  overflow-x: auto;
}
@media (max-width: 48rem) {
  .reading-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

`minmax(0, 1fr)` 和 `min-width: 0` 处理的是内容最小宽度约束。很长的代码行可能撑开整个网格，不能只在外层写 `width: 100%` 就指望它自动收缩。代码块内部滚动是合理行为，整张页面被横向撑开则通常不是。

## 弹窗与焦点也属于功能

打开搜索弹窗后把焦点移到搜索框，Escape 关闭，关闭后还给触发按钮。模态弹窗要处理焦点约束、背景不可交互和可访问名称。能用成熟组件或原生 dialog 的地方先评估现有实现，不要只画一个半透明背景就算完成。

不要移除焦点轮廓却不给替代样式；不要只靠红色表达错误，补一段文字说明。动画应尊重减少动态效果的偏好。暗色模式也需要检查文字、边框和禁用态的对比度。

## 练习与验收

不用鼠标完成“打开搜索—输入—打开结果—返回—关闭弹窗”。把浏览器放大到 200%，确认主要功能仍能访问。这个练习的答案不是一张漂亮截图，而是一条完整、不中断的操作路径。

## 继续阅读

- [MDN：HTML 与无障碍](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/HTML)
- [MDN：CSS Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout)
- [WAI：Dialog 模式](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
