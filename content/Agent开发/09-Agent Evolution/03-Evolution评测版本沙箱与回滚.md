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
