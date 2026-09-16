# Model Post-training：Agent 工程的可选高级轨道

Agent 表现不好，不一定需要训练新模型。先检查它是否拿到了正确材料、工具是否正常、完成条件是否明确。确认存在稳定的模型能力缺口后，再进入后训练；这一章是可选进阶，不是开发 Agent 的前提。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `2026 post-training concepts`
> - `source_type`: `primary-paper + official-research`
> - `stability`: `version-sensitive`

## 1. 先区分两条改进路径

| Harness Improvement | Model Improvement |
|---|---|
| context selection、tools、permissions、retry、validator、workflow | 改变模型参数或专门适配器 |
| 迭代快、可解释、容易回滚 | 需要数据、训练算力、模型评测与部署 |
| 适合工具错误、状态与控制问题 | 适合稳定重复的模型能力缺口 |

构建 Agent 并不要求训练模型。多数早期失败应先定位是否由缺失 context、schema、runtime、permission、validation 或预算造成。

## 2. 方法

- SFT：从高质量输入—目标轨迹学习行为；
- Preference optimization：从偏好对/排序优化输出选择；
- RL / Agentic RL：在环境交互中根据 reward 优化策略；
- Tool-use training：训练 tool selection、argument、result interpretation；
- Trajectory data：包含 observation/action/result/credit，而不只是最终答案。

## 3. 难点

奖励指标可能被钻空子：模型得到了高分，却没有完成真正的任务。任务很长时，还难以判断哪一步动作对最终结果有贡献，这就是信用分配问题。环境变化会增加结果波动，旧轨迹里的工具格式也可能已经过时。

因此训练、验证与隐藏评测应分开保存，最后还要把模型放回真实 Harness 测试。训练效果变好，不会自动修好工具权限或运行时错误。
