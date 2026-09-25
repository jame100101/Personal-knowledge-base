# Vue / React 文章搜索练习

独立教学项目，两种框架使用相同数据、样式与验收场景。Node 22.12+。

```bash
npm ci
npm run dev
```

打开终端地址的 `/vue.html` 与 `/react.html`，搜索、清空、筛选收藏并切换收藏状态。

```bash
npm test
npm run typecheck
npm run build
```

`shared/model.ts` 包含纯过滤逻辑及独立的请求竞态模型。UI 使用本地数据，不发网络请求、不持久化收藏、不连接生产数据库。请求模型测试不等同于完整网络搜索 UI 测试。课程中带 `/api/articles` 的代码属于接口教学片段，需要自行实现相应服务。

从知识库仓库根目录可以运行浏览器验收（先启动本示例服务）：

```bash
node scripts/verify-frontend-lab.mjs
```
