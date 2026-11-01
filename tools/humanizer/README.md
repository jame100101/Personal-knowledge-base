# 知识库中文编辑工具

这里保存本项目采用的中文 humanizer 参考规则、来源快照和检查工具。目标是让技术教程更好读：读者看得懂问题，知道每一步在做什么，也能回到代码和来源核对。

`upstream/` 是选定文件的原始快照，保留 MIT 许可证，不是完整的可安装插件包。主要采用 [op7418/Humanizer-zh](https://github.com/op7418/Humanizer-zh) 的事实与文件保护规则；参考 [ai-zixun/humanizer-zh](https://github.com/ai-zixun/humanizer-zh) 对文章连贯性、翻译腔和重复结构的检查，以及 [syw2039/humanizer-zh](https://github.com/syw2039/humanizer-zh) 对技术文体与限定条件的保护。固定提交、检索日期和文件 SHA-256 见 [sources.json](sources.json)。原文件中的其他相对引用请在对应上游提交查看。

本项目的使用方式见 [中文教学写作约定](../../docs/WRITING_GUIDE_ZH.md)。这些参考规则不作为代码执行，也不自动覆盖项目约定。没有接入付费模型、外部改写服务或运行时改写；文章在 Git 中编辑、核对后再发布，读者看到的是已经审阅的正文。

## 使用

```bash
# 扫描整个课程，给出带文件和行号的编辑线索；不会改写文件
npm run content:style

# 编辑前先记下当前提交，编辑后核对受保护内容
# BASE_COMMIT 替换成编辑前的 Git 提交
npm run content:style:verify -- --base BASE_COMMIT

# 保存报告，避免在终端输出大量线索
npm run content:style:verify -- --base BASE_COMMIT --json .tools/style-review.json

# 验证检查工具自身的保护行为
npm run test:humanizer
```

检查覆盖当前 Git 已跟踪的 `content/**/*.md`。新文章先加入暂存区才会被扫描；它不在基线提交中时，保护校验会失败，需要先单独审阅新增文章，不能假装它通过了前后对照。新增文章、技术纠错、改标题或改代码，应作为另一次明确的内容变更处理。

## 能检查什么

- Markdown 代码块（含 Mermaid、缩进代码）、行内代码、链接目标、图片、标题、表格、引用块、HTML 与 frontmatter 的变化。
- 正文中数字的增删或变化；相同数字的含义和对应关系仍需人工核对。
- 重复起句、部分套话、过长句子，以及中文解释较少的密集英文术语。代码、表格和引用不参与风格提示。

风格提示不会让命令失败，也没有“AI 味分数”。术语索引可以保留术语列表，真实对比可以保留“不是……而是……”。只有 `--verify` 发现受保护内容变化时返回失败。工具不会自行删除词语或发布文章。

检查通过也不能证明原意完全不变。“可能减少耗时”改成“一定减少耗时”，即使代码、数字和链接都没动，仍然改错了。每次提交前必须逐段检查条件、否定、责任主体、先后关系与确定程度。测试中特意保留了这个不能由结构校验发现的例子。
