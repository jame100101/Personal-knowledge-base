# 章节概览交付说明

## 覆盖范围

覆盖 `content/` 中全部 71 个章节目录（含六个主栏目和 Java 可选专项入口），对应 71 张概括图、71 份章节文档和一个总索引。原有 314 篇文章正文、路径、课程顺序及首页插图保持不变。

网站在章节目录及该目录第一篇文章的开头展示概括图、通俗导读和可放大的 Mermaid 学习路线。Java 可选专项使用并列分支，其他章节的箭头表示建议学习顺序，而不是运行时架构或必须采用的技术组合。

- 章节元数据：`app/data/chapter-overviews.json`
- 图片：`app/public/images/chapter-overviews/`
- 文档入口：[全部章节](chapters/README.md)
- 图片提示词：[提示词集](chapters/image-prompts.json)，由 `scripts/chapter-image-prompts.mjs` 生成

图片使用内置 imagegen 工具生成，采用统一蓝白技术插画风格。原图为 1672 × 941 像素，接近 16:9；网页在 16:9 容器中完整展示，可点击查看原图。每图只保留 4～7 个核心模块，正文与可编辑流程图承担详细说明。

## 内容与维护

概览根据现有章节文章标题、课程导读和学习顺序提炼，不替代原文中的适用条件和实践说明。网站目录完整路径与元数据 `key` 对应；增加或重命名章节时应同步更新元数据及图片。

```sh
node scripts/build-chapter-overviews.mjs
node scripts/chapter-image-prompts.mjs > docs/chapters/image-prompts.json
node scripts/validate-chapter-overviews.mjs
```

## 验证

- 71 个源目录与概览一一对应，无重复或缺失。
- 71 张图片文件、尺寸、章节模块数量、文档图片及阅读链接检查通过。
- 正式站公开的 71 个目录名称与网站概览匹配，无遗漏。
- 六个主栏目桌面与手机宽度页面检查通过，无浏览器错误或横向溢出。
- 原有 37 项单元/组件/安全测试通过。
- 原有 20 项浏览器回归通过；新增 5 项章节图片、顺序/分支流程、放大查看及首篇文章行为回归通过。
- 类型检查、生产构建通过；Lint 无错误，保留原有 12 项警告。

验证只读取公开内容，没有同步或修改数据库记录。
