# Agent Benchmark Map：测量对象、环境、信号与限制

不同榜单测量的任务不同，分数不适合脱离环境直接比较。先确定自己的 Agent 要完成什么、允许做什么，再选择有参考价值的基准。本页是查找入口，不是按榜单顺序推荐产品。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `benchmark definitions verified 2026-08-24`
> - `source_type`: `official-benchmark + primary-paper`
> - `stability`: `version-sensitive`

| Benchmark | What It Measures | Environment | Success Signal | 主要限制 | 适合 |
|---|---|---|---|---|---|
| SWE-bench | 对真实 issue 修改仓库 | 固定 repo/container/test patch | 相关测试通过 | 数据污染、版本/容器成本、通过不代表补丁质量完整 | SWE/Coding Agent |
| Terminal-Bench | 在终端环境完成长任务 | 容器/终端与验证脚本 | deterministic task verifier | 任务覆盖与环境镜像影响外推 | shell/computer-use Agent |
| GAIA | 需要推理、检索与工具的现实问题 | web/file/tool 组合 | final answer exact/judged | web 漂移、答案型任务不等于生产副作用 | general assistant Agent |
| OSWorld | GUI 操作系统任务 | 可重置桌面 VM、视觉/无障碍状态 | task-specific state checker | UI 漂移、执行慢、可重复性成本高 | computer-use Agent |
| WebArena | 真实风格网站中的端到端任务 | 自托管网站与浏览器 | URL/DOM/backend state evaluator | 站点集合有限、视觉与浏览器差异 | web Agent |
| tau-bench | 对话式 tool-agent 与 policy 执行 | 用户模拟器、工具、领域 policy | task success + policy compliance | 模拟用户/领域分布与真实流量不同 | customer-service/tool Agent |

## 使用原则

1. Benchmark 分数不是产品成功率；先映射到真实任务、权限和失败成本。
2. 固定 benchmark commit、数据版本、环境镜像、模型、sampling、tool schema 和最大预算。
3. 同时报告 success、cost、latency、steps、invalid actions、policy violations，并给置信区间。
4. 对可确定任务优先 deterministic validator；LLM judge 记录 rubric、模型版本、顺序偏差和人工抽检。
5. 防止测试集进入 prompt、memory 或检索库；区分开发集、回归集和隐藏集。

## 产品评测映射

先为产品定义 `Task + Environment + Initial State + Allowed Actions + Success State + Budget`，再选择 benchmark 作外部对照。生产回归应保留真实脱敏失败 case，而不是只追逐公开榜单。

<!-- evidence-update:2026-10-25 -->

## 先核对基准版本，再谈分数

现在查 Terminal-Bench，应从 Harbor 体系和带标签的数据集版本入手，不能把不断变化的 `latest` 当作可重复的实验条件。OSWorld 也有 OSWorld-Verified 的修订，旧结果和新结果要先核对任务与环境版本。

tau-bench 与 tau2-bench 不是同一个实验名称；报告结果时写出具体仓库、任务集和评测器。GAIA 数据集有访问与再分发条件，也不应为方便抓取而复制隐藏测试答案到公开知识库。

可以自己做一份实验登记表：任务集版本、环境镜像、Agent 提交、模型标识、预算、运行次数、成功判断。先用基准提供的已知解检查环境能否正常运行，再测自己的 Agent。否则环境安装失败会被误算成模型能力不足。

SWE-bench 的结果也要区分“评测程序跑完了”和“补丁解决了问题”。本页只给使用入口，不提供未经复现的榜单名次或成功率。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [Terminal-Bench：当前仓库与 Harbor 运行入口](https://github.com/harbor-framework/terminal-bench)
- [OSWorld：Verified 修订说明](https://github.com/xlang-ai/OSWorld)
- [tau2-bench：官方任务与评测实现](https://github.com/sierra-research/tau2-bench)
- [GAIA：官方数据卡与使用条件](https://huggingface.co/datasets/gaia-benchmark/GAIA)
- [WebArena：官方环境与评测](https://github.com/web-arena-x/webarena)
- [SWE-bench：评测输入、环境与结果](https://www.swebench.com/SWE-bench/guides/evaluation/)
