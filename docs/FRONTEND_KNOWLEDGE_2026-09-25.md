# 前端架构课程交付记录（2026-09-25）

新增与后端知识同级的「前端架构」：25 篇、7 个分区、6 张 Mermaid 图，正文约 4.3 万字符（含代码与链接）。包括学习路线、推荐阅读、浏览器与工程、组件边界、Vue 3、React、路由与数据缓存、SSR/Nuxt/Next、安全、测试、性能、部署和双框架实战。

文章围绕知识库搜索、阅读与编辑场景原创组织，提供常见错误、边界说明和练习。85 个不同的外部来源链接已检查可访问；结果见 `docs/audit/frontend-source-links-2026-09-25.json`。链接存活与概念正确是两种检查：另阅读并核对了 Vue 响应式与清理、React 快照与 Effect、Nuxt 3 数据获取、Server/Client Components、查询缓存等关键原始文档。未复制开源教程全文。

## 独立示例

`examples/frontend` 是独立 Vite 练习，两种框架共用模型和样式。锁定 Vue 3.5.22、React 19.1.1 等依赖用于复现，不宣称它们是最新版本。提供搜索、空结果、收藏筛选与收藏切换；仅使用本地数据，不含生产登录、API、持久化或 SSR。

示例从主站 TypeScript 检查中排除，用自己的 vue-tsc 配置同时检查 Vue/React，避免将 Vue 的 JSX 规则施加到 React。主站继续使用 Nuxt/Vue，不引入 React 运行时依赖。

## 已验证

- 25 篇结构、来源、同级 slug 唯一性、代码围栏闭合检查。
- 85/85 外部来源 HTTP 200；部分链接有官方重定向，已记录最终地址。
- 6 张 Mermaid 图语法解析通过；不将解析等同于浏览器渲染。
- 示例 4 项模型测试：查询归一、不可变收藏更新、旧成功响应过滤、取消及过期错误过滤。
- 示例类型检查、生产构建通过。
- Vue 与 React 浏览器行为验收均通过：搜索、清空、无结果、收藏筛选、切换收藏，390/1280px 无整页横向溢出，无页面运行异常。
- 主站 Nuxt 类型检查、35 项 Vitest、生产构建通过。
- ESLint 无错误，保留原有 12 条 Vue 样式警告；本次示例无新增警告。
- Supabase 只读发布预检查通过：计划新增 8 个文件夹、25 篇文档，无已有同名内容冲突。

## 发布状态与边界

本次准备的 `scripts/import-frontend-knowledge.mjs` 沿用已有后端模块的追加式发布机制：默认 dry-run，`--apply` 才写入，已有不一致内容停止；保存本地备份，写入后校验全部既有记录未变化，`--verify` 逐篇核对线上正文。凭据与备份不进入 Git。

已使用现有管理员身份新增 8 个目录、25 篇已发布文章，发布后确认原有 85 个目录与 267 篇文章逐条保持不变。管理员凭据仅用于本次进程登录，未写入文件或 Git。生产数据库 25 篇正文与本地逐篇一致；25 个线上阅读页面均为 HTTP 200，大纲锚点完整，6 张 Mermaid 图成功渲染，无浏览器运行异常；390/820/1280px 阅读布局通过。Vercel 生产部署由本次主分支推送及部署检查完成。

```bash
npm run content:validate-frontend
npm run content:import-frontend
npm run content:import-frontend -- --apply
npm run content:verify-frontend
node scripts/verify-editorial-browser.mjs --publication .tools/frontend/publication.json --all --check-diagrams
```

示例浏览器验收从仓库根目录运行 `node scripts/verify-frontend-lab.mjs`，需先启动 `examples/frontend`，可用 `FRONTEND_LAB_URL` 指定地址。测试浏览器可通过项目 Playwright 安装；`PLAYWRIGHT_BROWSERS_PATH` 或 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 可指定已有测试浏览器。
