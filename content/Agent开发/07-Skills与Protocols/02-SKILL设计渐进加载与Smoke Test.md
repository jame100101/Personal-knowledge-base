# SKILL.md 设计、渐进加载与 Smoke Test

写 Skill 时，使用者首先需要知道它适合什么任务，而不是立即读完所有细节。先给出清楚的用途和入口，再按需加载步骤与脚本。最后用一个小测试确认它能被正确发现和使用。

## 1. 建议目录

```text
release-note-writer/
  SKILL.md
  scripts/
    collect-changes.ts
  templates/
    release-note.md
  examples/
    sample-output.md
  tests/
    smoke-cases.json
```

## 2. SKILL.md 内容

```yaml
---
name: release-note-writer
description: Generate verified release notes from git history and linked issues.
---
```

正文包含：

- 触发条件与不适用场景；
- 输入和前置条件；
- 分步流程；
- 使用哪些脚本/模板；
- 失败和回退；
- 验收标准；
- 最小输出格式。

Description 要便于发现，但不要堆所有实现细节。

## 3. Progressive Disclosure

三层加载：

1. **元数据层**：名称和简短描述始终可检索；
2. **说明层**：任务匹配后加载 SKILL.md；
3. **资源层**：执行到对应步骤时再读取脚本、模板和示例。

这样减少 token，同时避免把不相关脚本注入每个任务。

## 4. 脚本与模板

- 重复、确定性操作放脚本；
- 输出结构放模板；
- 复杂边界放示例；
- 脚本参数要有 help 和校验；
- 不把密钥写入 Skill；
- 资源路径相对 Skill 根目录；
- 标注运行时与依赖版本。

## 5. 验收标准

好的标准可执行：

- 版本范围来自真实 tag；
- 每条 breaking change 有来源；
- 链接可访问；
- 模板所有必填段已生成；
- 输出通过 Markdown lint；
- 没有未替换占位符。

“写得专业”太主观，应拆成可检查 rubric。

## 6. Smoke Test

准备小型 fixture：

```json
{
  "input": { "from": "v1.0.0", "to": "v1.1.0" },
  "expected": {
    "sections": ["Features", "Fixes", "Breaking Changes"],
    "sourceCoverage": 1.0,
    "unresolvedPlaceholders": 0
  }
}
```

比较无 Skill 与有 Skill 的成功率、步骤、成本和错误类型。Skill 只有在任务指标改善时才算有效。

<!-- evidence-update:2026-10-25 -->

## 先测会不会误触发，再测写得好不好

为上面的发布 Skill 加三条测试：要生成发布说明、只想解释一条提交、明确要求不要发布。第一条应加载步骤；后两条不应因为出现了“提交”这个词就启动整套流程。

规范要求 `SKILL.md` 的 frontmatter 包含 `name` 和 `description`；正文、脚本和资源各有用途。这里的 `templates/`、`examples/`、`tests/` 是本教程的目录选择，不是规范要求每个 Skill 都必须创建这些文件夹。

再把一个引用文件暂时改名，检查执行者能否说明缺少哪份材料并停在对应步骤。一个只在资料齐全时通过的 smoke test，还不足以说明 Skill 能可靠用于日常维护。

### 本节的核验依据

2026-10-25 查阅。下面的链接支持本节的机制说明；练习场景和选型建议是本教程的教学设计。

- [Agent Skills 格式规范](https://agentskills.io/specification)
