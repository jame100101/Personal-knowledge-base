# 全库教程可读性整理（2026-09-16）

## 范围

检查范围为现有 243 篇 Markdown：Agent 91 篇、Java 127 篇、语言基础 25 篇。本轮修改 239 篇；保留前一轮完成的 4 篇 TypeScript 教程。

这是可读性整理，不把措辞修改当作重新完成了一次源码或版本审计。各文章原有的 `last_verified`、源码快照及事实/推断区分保持不变，也不虚构作者经历。

## 修改内容

- 为各篇补充与主题相关的具体问题和阅读入口，减少直接以术语表开篇的情况。
- 重写 38 篇中的重点正文解释，主要涉及 TypeScript、Agent 上下文/评测/演进，以及 Java 数据访问、测试和性能。
- 把 45 处重复的代码说明改成针对当前片段的阅读说明：运行条件、关注的行为、片段省略的部分及验证方法。
- 把 14 组通用自测清单改成章节相关的问题，合并重复的阅读建议，清除历史整理过程的说明。
- 保留原文章标题、全部层级标题、参考链接和代码分组选项。网站样式、背景和管理功能不在本次修改范围内。

顺带修正了三个明确的示例问题，并在文章中添加官方依据：MySQL 分页使用 `LIMIT`；Testcontainers 补齐数据库用户名与密码配置；Elasticsearch 使用 `_score`，移除直接按 `_id` 排序。

## 验证与发布

```powershell
node scripts/validate-editorial-pass.mjs
node scripts/validate-content-architecture.mjs
node scripts/validate-language-foundations.mjs
node scripts/validate-code-language-groups.mjs
node scripts/validate-typescript-trial.mjs
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

专项校验比较修改前后标题、链接、版本字段及 853 个代码/流程图块；仅允许上述三个代码修正。这是防止润色误改技术内容的检查，不等于执行了全部教学示例。TypeScript 试改章节另有 32 个片段的编译与运行检查。

网站正文来自 Supabase，因此 Git 部署之外还需要内容同步：

```powershell
node scripts/publish-editorial-pass.mjs          # 只检查，默认不写入
node scripts/publish-editorial-pass.mjs --apply  # 备份并发布
node scripts/publish-editorial-pass.mjs --verify # 重新读取，核对云端正文
node scripts/verify-content-import.mjs          # 核对全部模块与文档
```

发布使用现有 `.env.local` 的公开连接配置及进程环境中的管理员凭据；凭据不保存在脚本或仓库中。发布前逐篇比较 Git 基线与云端正文，发现未经核对的差异就停止。写入时再比较 `updated_at`，保留 ID、slug、文件夹和排序。备份放在忽略目录 `.tools/content-backups/`；中断后可以重新执行，已同步文章会跳过。

OpenClaw 云端残留一句“五个项目”，Git 基线已更新为“当前对比样本”。已检查该单行差异，按精确内容哈希记录允许的旧版本；其他差异仍会阻止发布。

逐篇修改范围与基线提交见 `scripts/editorial-pass-manifest.json`。推送后由现有 Git–Vercel 集成部署，再检查部署状态、线上正文、目录与手机/平板宽度。
