# 软件工程：收藏规则小练习

要求 Node.js 24，无需安装依赖。从仓库根目录运行：

```bash
node examples/software-engineering/demo.mjs
node --test examples/software-engineering/favorites.test.mjs
```

预期依次输出一条 article-1、一条 article-1、空数组，四项测试通过。

先读 `content/软件工程/05-测试与排错/01-从验收例子到自动化测试.md`，再改动输入观察结果。
这是使用合法字符串 ID 和布尔目标状态的内存模型，不是完整应用；不包含认证、授权、输入验证、数据库持久化、并发写入或网络。真实系统需另做集成和端到端检查。
