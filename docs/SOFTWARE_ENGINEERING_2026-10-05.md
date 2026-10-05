# 软件工程课程与全库学习顺序（2026-10-05）

## 内容

新增「软件工程」18 篇、8 个阶段、约 3.2 万字符（含代码和链接）、3 张 Mermaid 图。正文中位篇幅约 1,700 字符，与原有后端课程相近。使用收藏功能贯穿需求、流程、设计、协作、测试、交付、安全和维护，先解释问题，再引出术语，每课提供练习及参考答案。

独立示例位于 `examples/software-engineering`，使用 Node.js 24 内置测试，无额外依赖。明确区分内存规则示例与真实服务端的认证、授权、持久化和并发处理，不把示例宣称为生产应用。

阅读并核对了 Git/Software Carpentry、Scrum Guide、敏捷宣言、Google Engineering Practices、Cucumber、C4、ADR、Node.js、PostgreSQL、Refactoring、SemVer、Google SRE 等原始资料。重点检查：增量与迭代、认证与授权、重复设置与切换、唯一约束与并发、覆盖率局限、部署与发布、代码回滚与数据恢复、重构与行为变更。30 个独立引用链接均返回 HTTP 200，见同目录 audit 下的资料记录。链接存活检查不等于事实正确性证明。

## 学习顺序

首页为：语言基础 → 软件工程 → 前端架构 → 后端知识 → Java开发 → Agent开发。前后端是可按方向选择的分支，不要求所有读者逐个修完。

- 统一文章和子目录的展示顺序，让学习路线先于章节、推荐资料在后。
- 前端先写 Vue/React 组件，再讨论组件架构与状态边界。
- 后端先学请求、数据与权限，再学架构、分布式和运行保障。
- Java 先完成基础服务，再深入 JVM 与性能；泛型放在集合前，Spring 产品边界放在具体机制前，项目练习先于可选专项。
- Agent 先完成可靠单 Agent 的验证与交付，再学习多 Agent、进化与后训练；工具基础先于 Browser Runtime 专项。
- 四篇既有学习路线的列表/图示同步调整；其他既有技术文章正文不改。

修改已有 38 个目录、64 篇文章的排序值，保留全部旧 ID、Slug、层级关系和 URL。规则集中在 `scripts/learning-order.mjs`，由已有导入器复用。源文件历史数字前缀保留，实际网站顺序以该配置生成的数据库排序为准。

## 发布与验证

数据库为已有知识库项目。先生成元数据快照、变更计划和排序恢复 SQL，再以一个事务新增 9 个目录、18 篇文章并修改排序。事务内对原有 94 个目录、298 篇文章比较除排序及更新时间以外的全部字段，不允许意外改动；发布后再次核对旧记录元数据和全部 18 篇新正文的摘要。四篇导学随后以旧正文 MD5 为条件单独更新，若线上正文不同即停止。

已有 Vercel 项目 `damnatiox-knowledge`，正式域名 https://knowledge.damnatiox.com 。通过本地源码上传进行生产部署，使用 Vercel 已保存的生产配置。没有下载整套生产秘密，没有修改数据库结构、权限或部署环境变量，首次部署时未推送 GitHub；后续按用户要求，将本次完整修改提交至 main 并推送，再核对对应生产部署。

已完成的检查：

- 18 篇课程的标题、分区、引用、Slug 与代码围栏检查；4 项示例测试。
- 主站 TypeScript、37 项 Vitest 通过；ESLint 无错误，12 条原有 Vue 样式警告。
- 本地生产构建及 Vercel 生产构建成功。
- 原有内容架构、代码语言组、前端课程和语言基础校验通过。
- 18 篇新文章及四篇导学线上 HTTP 200，正文导语、目录锚点、图表渲染通过，无浏览器运行异常；390/820/1280px 阅读布局通过。
- 首页、侧栏和课程页的学习顺序已做真实浏览器验收；前后端入口、原有搜索、主题、语言切换和响应式导航已回归。

最初的图标样式回归发现目录改为统一列表后缺少原有文件夹底色容器，已恢复该容器并修正手机窄屏箭头布局。连接器日志 API 返回权限错误后，改用现有 Vercel CLI 查询本次部署错误日志，查询窗口内没有错误记录；这不是长期可用性保证。未新增监控或 Drains。

已有依赖安装报告 23 项漏洞（8 moderate、15 high），本次没有改变依赖或锁文件，也没有进行破坏性自动升级。结构检查不代表对全部既有 298 篇文章进行了逐句事实重审；本次人工概念核对重点是新课程及修改的学习指引。

## 复验入口

```bash
npm run content:validate-software-engineering
npm run test:software-engineering
npm run typecheck
npm test
npm run lint
npm run build
```

线上文章浏览器复验沿用 `scripts/verify-editorial-browser.mjs`，发布清单保存在 Git 忽略的 `.tools/software-engineering/publication.json`；排序前后快照与恢复 SQL 同样保存在 `.tools`。连接器发布方式不需要获取管理员密码。常规后续追加发布可使用 `scripts/import-software-engineering.mjs` 的 dry-run/apply/verify 模式。

最终部署：`dpl_A8wNwwAQAVVuubTqEmAuxAiZxqZm`，production / READY，云端构建约 73 秒。20 项不同的线上浏览器回归用例通过（其中图标主题用例在修复后复验），Git 入门命令在独立临时仓库执行通过。
