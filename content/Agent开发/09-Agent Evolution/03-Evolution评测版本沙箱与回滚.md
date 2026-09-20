# Evolution 的 Evaluation、Version、Sandbox 与 Rollback

如果只写“升级到 v2”，出问题后很难知道究竟换了模型、提示词还是工具。演进实验需要记录整组配置，并在隔离环境中比较。下面说明怎样保存版本、设置评测和准备回滚。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `stable release-control patterns`
> - `source_type`: `software-delivery practice + agent evaluation`
> - `stability`: `stable-concept`

## 接受门

- 目标回归集显著改善；
- 关键安全/权限 case 零回退；
- 非目标能力、成本、p95 延迟在预算内；
- 候选生成与评估不存在数据泄漏；
- artifact 可重建、版本可定位、回滚经过演练。

## 版本向量

不要只记录“Agent v2”：至少记录 app commit、prompt/context policy、skill bundle、tool schema/runtime、model/version、dataset、environment image、evaluator。任何一项变化都可能改变结果。

## Sandbox 与 canary

先在隔离环境中限制文件、网络、进程、凭据以及 CPU、内存和运行时间。通过检查后，再用小范围流量与对照组比较。若出现越权、未预期的写操作，或错误率和成本超过阈值，应停止发布，恢复上一整组版本配置。

## 回滚不等于 Git revert

撤销代码提交以后，记忆和数据库结构可能已经改变，队列里也可能还有旧任务。还要检查 Skill 缓存、模型路由与已经发生的外部操作。发布前就应约定新旧版本如何兼容，以及正在执行的任务继续、停止还是迁移。

## 怎样判断“变好了”不是碰巧或记住了题目

假设旧 Skill 修复了 20 个工单中的 12 个，新版本修复了 14 个。先别急着发布：新增的两个成功案例，是否已经被用来指导新 Skill 的编写？如果是，这只能说明它适应了这些练习，不能证明它在没见过的任务上更好。

把开发时反复查看的任务与最终验收任务分开。前者用来发现问题和修改方案；后者保留到候选版本确定后再运行。一旦验收失败后又根据这批题目继续优化，这批数据也逐渐成了开发集，需要另留评估材料。评估集里还要保留旧版本擅长的任务，防止修好了 A 却破坏 B。

比较时记录同一环境、同一预算和检查器版本。模型输出有波动时，按预算重复运行并报告分布，而不是只挑一次最好结果。零回退是发布规则，不是有限测试已经证明未来绝不会出错。上线后仍靠小流量观察、可定位日志和回滚限制影响。

对照阅读：[AI Agents in Depth 第 8 章](https://github.com/bojieli/ai-agent-book/blob/4dc4429d56ff9c5d7cc7dcbc971cfcd6a618d674/book/chapter8.md)。
