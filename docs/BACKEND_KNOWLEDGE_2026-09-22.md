# 后端知识模块交付记录（2026-09-22）

## 范围

新增与 Agent开发、Java开发、语言基础同级的「后端知识」，共 22 篇文章、7 个分区、10 张 Mermaid 图。推荐阅读是根目录第一篇文档，不额外套文件夹。

- 请求与接口基础：请求链路、HTTP、API 契约、错误响应、分页、幂等、线程与异步。
- 常见后端架构：分层与 MVC、模块化单体、六边形与 Clean、DDD、微服务与 SOA、事件驱动、CQRS、Event Sourcing、Serverless、BFF、Web-Queue-Worker。
- 数据与存储：关系模型、约束、事务隔离、索引与查询计划、迁移、缓存、搜索、对象存储。
- 分布式与可靠性：消息确认、Outbox、消费去重、CAP、Saga、超时、重试、限流、熔断、隔离。
- 身份权限与安全：认证、授权、多租户、会话、JWT、输入边界。
- 部署与可观测性：日志、指标、追踪、SLO、配置、迁移、备份、发布与回滚。
- 项目实战与选型：订单核心实现、故障实验、容量估算、架构决策记录。

文章使用订单场景说明「是什么、解决什么问题、怎么用、哪里不适用」。跨语言原理放在本模块，Spring/JVM 等细节仍由现有 Java 模块承接。

## 来源与代码验证边界

每篇文末有原始资料链接，优先使用 IETF、PostgreSQL、Python、Microsoft、AWS、Google SRE、OWASP、RabbitMQ 等官方文档和架构作者的原文。56 个外部参考链接在本次检查时均返回 HTTP 200，结果见 `docs/audit/backend-source-links-2026-09-22.json`。链接可访问不等于内容正确；还逐项核对了幂等、事务、CQRS、Outbox、Saga、CAP 等容易混淆的语义。

SQL 教学以 PostgreSQL 18 为参照；可运行订单核心使用 Python 标准库 SQLite，并明确区分两者的锁与隔离实现。PostgreSQL SQL、Kubernetes 配置属于教学示例，未在完整生产集群演练。订单核心不包含真实支付、外部邮件或消息代理；本地投递去重测试不代表外部副作用恰好发生一次。

已完成：

- Python 17 项测试：含内容结构、JSON/Python 语法、HTTP 示例、并发库存、重复请求、事务回滚、消费去重。
- 教程 TypeScript 示例 strict 编译。
- 网站 Vitest 35 项测试、Nuxt 类型检查与生产构建。
- 原有公开页面 Playwright 17 项回归测试，以及新增模块首页入口、7 个分区、推荐阅读排序的 1 项测试。
- 新增 22 篇线上正文、完整目录及 10 张图的浏览器检查；390/820/1280px 阅读布局检查。
- Supabase 22 篇正文逐篇与本地比对一致。

## 发布方式

`scripts/import-backend-knowledge.mjs` 默认只检查计划。显式 `--apply` 才插入新记录；已有记录出现正文差异会停止，而不是覆盖。发布前保存本地备份，发布后核对原有全部记录保持不变。

```bash
node scripts/import-backend-knowledge.mjs
node scripts/import-backend-knowledge.mjs --apply
node scripts/import-backend-knowledge.mjs --verify
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests/backend -v
node scripts/verify-editorial-browser.mjs --publication .tools/backend/publication.json --all --check-diagrams
```

写入需要通过环境变量提供现有管理员登录信息；凭据不写进脚本。此次新增 8 个目录记录（根目录加 7 个分区）和 22 篇文章，发布前已有的 77 个目录与 245 篇文档保持不变。参考资料中的一处失效链接已用带更新时间条件的单篇更新修正，再次验证全文一致。

网站已有动态目录功能直接展示新模块，本次未修改应用页面、样式、身份权限或数据库 schema。主分支推送后沿用现有 Vercel Git 部署，并检查 Production 状态与真实数据库健康接口。
