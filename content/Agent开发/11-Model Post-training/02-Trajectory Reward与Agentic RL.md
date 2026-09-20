# Trajectory、Reward、Environment 与 Agentic RL

最终答案只能说明结果，训练时还可能需要知道它经过了哪些动作、每步看到了什么。Trajectory 记录这条过程，Reward 则提供优化信号。下面重点讲信号怎样与动作关联，以及为什么高奖励不自动等于真实任务完成。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `fast-moving research area`
> - `source_type`: `primary-paper`
> - `stability`: `fast-moving`

## 数据单位

一条轨迹应说明它使用的任务与环境版本，再按步骤记录观察、模型决定、工具请求、实际结果、状态变化和成本。结尾保存停止原因与检查器结果。敏感凭据和用户标识需要移除；失败轨迹也可以用于分析，只是不能误标成成功示范。

## Reward 与 credit

- outcome reward：最终测试通过，信号清晰但稀疏；
- process reward：中间步骤质量，密集但可能引入 evaluator 偏差；
- constraint penalty：越权、超预算、无效调用；
- multi-objective：成功、成本、延迟、安全不能随意压成未经解释的单一分数。

信用分配要回答“哪些动作对结果有贡献”。长任务可以分段检查子目标，也可以比较去掉某一步后的结果。不过比较时要固定评测方法，否则得分变化可能只是检查方式变了。

## Production boundary

训练 environment 与生产 tool/runtime 存在 distribution shift。上线前用固定 Harness、真实 schema、permission gate、延迟与错误注入做回归；模型仍不拥有最终授权。

## 用一次代码修复理解训练信号

设想 Agent 接到一个失败测试，依次查看错误、读取函数、修改代码、重新运行测试。这个过程就是一条轨迹。最终测试通过可以产生 outcome reward，但它没有直接指出“读取函数”还是“某次编辑”贡献最大；把最终结果合理归因到前面的动作，就是信用分配问题。

中间步骤也可以评分，例如检查补丁是否触及相关函数、工具参数是否合法。这些 process reward 更频繁，却可能鼓励系统迎合检查器。若评分只看已公开的几个测试，模型可能删掉断言或硬编码样例，而不是修好需求。奖励函数是可被利用的优化目标，不是业务真相本身。

教学上可以先做一件简单的事：收集成功与失败轨迹，用独立的隐藏测试检查最终产物，再人工检查少量高分案例。不要把“加了奖励分数”称为已训练模型；只有训练程序利用这些信号更新参数，才涉及相应的模型优化。普通运行时给候选答案打分、选择最好的一个，仍可不改变模型参数。

真实 Agentic RL 还涉及采样策略、优化算法、环境复现和算力预算。不同论文对 reward 的定义并不相同，移植时要连环境与检查器一起核验。对照阅读：[原书第 10 章](https://github.com/bojieli/ai-agent-book/blob/4dc4429d56ff9c5d7cc7dcbc971cfcd6a618d674/book/chapter10.md)。
