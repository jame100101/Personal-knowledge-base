# Damnatiox Knowledge 界面规范

这是知识工作台，不是营销站。保留深墨灰、荧光绿强调、原主页线稿、Lucide 图标、Nuxt/Vue 与原有 CSS。视觉实现以 `app/assets/css/theme.css` 的 `--kb-*` 为唯一共享令牌入口。

## 层级与布局

- 首页：品牌标题 → 搜索 → 真实统计 → 学习分类 → 最近文章/热门标签。统计去重标签总数独立于前十热门标签。
- 阅读：知识树、可控正文宽度、目录三栏；1180px 以下收起知识树、目录成为顶部折叠；不动画正文段落。
- 后台：294px 侧栏由 `--kb-admin-sidebar-width` 统一声明；760px 以下抽屉。编辑器 980px 以下切换编辑/预览，同一个 textarea 和预览实例保持挂载。
- 文章和目录仍按已有混合学习顺序；没有迁移内容、改变 ID 或路由。
- 全站使用系统中文/拉丁字体，不加载外部字体。正文 17px/1.85，手机 16px/1.85；UI 14px，辅助文字 12px。标题中文不用负字距，数字使用 tabular-nums。输入控件在窄屏至少 16px。

## 表面与反馈

`--kb-bg` 是页面，`--kb-surface` 是结构面板，`--kb-surface-secondary` 是次级控件，`--kb-surface-hover` 是行悬停；`--kb-selected-bg/border` 明确选中。危险/成功/警告用对应语义颜色且同时有文字或图标。`--kb-code-text` 专供深代码背景，浅色主题中也不可换成浅色主题的深灰辅助字。

原图 CSS `home-stage::before` 和三个 home-art 令牌完全保留，不新增全屏效果层。卡片局部 spotlight 仅卡片自身伪元素、pointer-events:none，不在全站挂指针监听，不增加常驻 RAF。原有半透明卡片表面保持原图可见。

小按钮按下 1px 位移，行只改变底色，不缩放文字。键盘 focus-visible 为 2px `--kb-focus`，forced-colors 使用系统 Highlight。主要移动控件目标 44px；密集树按钮在不重叠的布局内扩展。

## 动效

| 角色           | 令牌/时长                       | 实现                                                    |
| -------------- | ------------------------------- | ------------------------------------------------------- |
| 按压           | `--kb-duration-press` 100ms     | CSS，小按钮 1px                                         |
| 颜色/边框/选中 | `--kb-duration-fast` 150ms      | CSS 指定属性                                            |
| dialog         | 进入 200ms、退出 140ms，8px/4px | motion-v `useAnimate`；新意图停止旧动画，操作不等待动画 |
| 抽屉/侧栏      | `--kb-duration-panel` 240ms     | CSS transform；桌面内容 margin 同步                     |
| 页面外部标题   | 200ms，首页 300ms，6px          | 仅初次进入、普通动态模式；核心内容默认可见              |
| 树/菜单        | 短促透明度/箭头                 | 不重放整个知识树，不拉伸正文                            |

reduced-motion：CSS 限时规则加 motion-v `useReducedMotion` 双层处理，取消位移、缩放、追光，保留静态选中和焦点。无全局 transition:all / will-change / 滚动劫持。

## 弹层与键盘

`UiDialog` 统一原生 dialog、top layer、Esc、Tab 约束、焦点恢复、可打断 motion-v 进退。`lockBodyScroll` 按持有者计数，避免子弹层关闭就解锁背景；`useDrawer` 只在没有上层 native dialog 时响应 Esc/Tab。后台文件夹表单与未保存确认复用相同结构。

搜索采用 dialog 内搜索输入 + 原生导航链接；ArrowUp/Down 改活动行，Enter 从输入打开，Tab 可直接访问链接，稳定 status 区宣布活动标题/位置。组合输入期间不处理 Enter。关键词仅 Vue 文本片段高亮，不用 v-html。菜单自身负责键盘与焦点，不在父级偷偷分派 KeyboardEvent。

## 真实状态

请求 loading/disabled 跟随 Promise；错误保留输入并提供重试；复制只在 Clipboard 成功后提示成功。编辑器本地 dirty 基于已保存快照，路由守卫统一确认、刷新由 beforeunload 保护；预览可以延后 180ms，源文本和保存值始终实时。图片上传未实现时显示禁用控件与可读原因。

数据一致性、角色变化缓存等既有风险不包装成界面成功，记录在 `docs/UI_REFACTOR.md`，不绕过线上鉴权。

主题切换使用两帧的 `data-theme-changing` 抑制整页颜色/背景/边框过渡，只保留 opacity/transform；完成后移除标记，卸载清理 RAF。移动目录跳转会将键盘焦点交给目标标题。
