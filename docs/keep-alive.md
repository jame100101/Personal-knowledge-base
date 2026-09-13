# 每日数据库健康检查

## 工作方式

- `.github/workflows/keep-alive.yml` 每天 UTC 03:17（台湾时间 11:17）执行一次，也支持 `workflow_dispatch`。
- 请求 `https://knowledge.damnatiox.com/api/health`，附带运行编号防止复用缓存。
- 接口用现有公开 Supabase 配置，通过 PostgREST 查询 `folders` 表的 `id`，最多一行。即使表为空也执行真实 SELECT。不修改数据，不使用 service role，不改变 RLS。
- 查询最多等待 10 秒；失败返回 HTTP 503。响应禁用浏览器和 CDN 缓存，不返回记录、密钥或数据库错误细节。
- Actions 请求最多等待 30 秒、不重试。网络错误、超时、非 200、非 JSON 或正文不同时包含 `status: ok` 和 `database: ok`，均以退出码 1 和 `::error::` 失败。

## 启用

1. 部署包含接口的版本到当前 Vercel 项目。沿用 `NUXT_PUBLIC_SUPABASE_URL` 和 `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`，无需新增密钥。
2. 将 workflow 提交到 GitHub 默认分支 `main`，确保仓库已启用 Actions。仅保存在本地不会产生定时任务。
3. 打开仓库 **Actions → Supabase daily health check → Run workflow**，选择 `main` 手动执行。

## 验证

```powershell
npm.cmd test -- tests/unit/health.test.ts
curl.exe -i "https://knowledge.damnatiox.com/api/health?verify=manual"
```

成功应返回 HTTP 200、`Cache-Control: no-store, max-age=0` 和 `{"status":"ok","database":"ok"}`。Actions 对应步骤应显示 `Supabase database query succeeded.`。

失败路径：在独立的本地开发进程中，将 Supabase URL 指向 `http://127.0.0.1:1`，保留非空公开 key，启动后请求本地 `/api/health`，应返回 503。不要为了测试修改生产环境变量。单元测试覆盖数据库 HTTP 错误、网络异常、超时异常、无效 JSON、错误响应结构和缺失配置。

GitHub 定时触发不是精确计时服务，高负载时可能延后；公开仓库连续 60 天没有活动时，定时 workflow 可能自动停用，需在 Actions 页面重新启用。参考：[GitHub 定时事件说明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)。此任务监测并访问数据库，不承诺替代 Supabase 的服务可用性保障。
