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
