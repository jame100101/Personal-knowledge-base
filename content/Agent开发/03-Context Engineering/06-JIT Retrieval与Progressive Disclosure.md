# JIT Retrieval 与 Progressive Disclosure

查一本手册时，我们通常先看目录，再翻需要的章节；不必每次从第一页读到最后。按需检索和渐进加载采用类似思路。下面区分“需要时找材料”与“先看摘要再加载详情”，并讨论漏掉重要信息时怎样发现。

> **版本与资料依据**
> - `last_verified`: `2026-08-24`
> - `version_scope`: `stable retrieval patterns`
> - `source_type`: `engineering synthesis`
> - `stability`: `stable-concept`

**JIT Retrieval** 在产生具体信息需求后再检索；**Progressive Disclosure** 先暴露能力摘要或目录，再按选择加载细节。二者都减少“把整个仓库、所有 Skill、全部历史塞进 prompt”的噪声。

## 最小流程

1. 先登记可用资料的摘要与位置，供系统发现。
2. 当模型或程序明确需要某项信息时，形成检索问题。
3. 检查是否有权访问，以及允许搜索的范围和预算。
4. 先查看候选，再读取最相关的细节。
5. 保存查询、结果、引用及取舍理由，方便回查。
6. 任务转到别处后，可以不再携带旧材料，但保留运行记录中的引用。

## 适用边界

- 适合大型代码库、技能库、文档库和远程工具目录；
- 小型固定 prompt 的额外检索延迟可能大于收益；
- 检索召回不足时，progressive loading 会“看不见”关键资料，需 fallback search；
- 结果仍是 data，需做 injection/trust 处理；
- retrieval query 可能泄漏敏感目标，需最小化与审计。

## 验证

建立 information-need 数据集，测 recall@k、最终任务成功率、加载 token、检索轮次与延迟；不要只优化向量相似度。
