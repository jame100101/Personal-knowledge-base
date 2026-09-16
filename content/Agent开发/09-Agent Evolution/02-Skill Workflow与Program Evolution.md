# Skill、Workflow 与 Program Evolution

一个成功任务里的步骤，未必可以原样复制到所有任务。提炼成 Skill、修改 Workflow 或生成代码之前，先去掉偶然条件，并写清适用范围。下面按这三类改动说明怎样提出候选、验证和撤回。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `fast-moving research patterns`
> - `source_type`: `primary-paper + official-repository`
> - `stability`: `fast-moving`

## 候选更新包

提出候选更新时，除了改动本身，还应附上原因、支持它的运行记录、所需权限、测试、预期改善的指标和回滚方式。可以把它理解为一份待评审的变更，而不是直接覆盖线上内容。

### Skill

从重复成功轨迹提取步骤时，先去除 secret、临时路径和单任务偶然条件；写入 version、capability、preconditions、side effects 与 smoke tests。Skill discovery 指标要测是否在正确任务加载，而不只是内容正确。

### Workflow

候选可修改 node、transition、retry、approval 或 compensation。使用模型生成候选时，workflow engine 仍只接受通过 schema 和静态检查的版本。比较 dead-end、平均步骤、恢复率和人工接管率。

### Program

自动生成代码也要走正常交付流程：在独立分支或工作区修改，运行测试、Lint 与类型检查，审查依赖和改动范围，再由负责人评审并小范围发布。候选代码不应直接拿到生产凭据。

## 参考实现的阅读方式

Hermes Agent、OpenClaw 及 Darwin Skill、EvoSkill、Agent Lightning 等方向可用于发现机制，但先确认具体项目版本、论文与代码是否仍维护。把其 confirmed implementation、论文 proposal 与本仓库 inference 分栏记录，项目介绍中的目标不等于已经测得的效果。
