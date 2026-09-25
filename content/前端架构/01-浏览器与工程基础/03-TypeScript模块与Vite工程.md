# TypeScript、模块与 Vite：源码怎样变成可以发布的页面

把 `.tsx` 或 `.vue` 文件丢给浏览器，通常不能直接运行。开发服务器帮你转换源码，生产构建把依赖和资源组织成可部署产物。理解这一层，才不会把“开发环境能打开”误认为已经能上线。

## 四件容易混在一起的事

包管理器下载依赖并记录版本；TypeScript 检查类型；Vite 等工具转换、组织模块和资源；Vue、React 在运行时处理界面。转译成功不必然意味着类型检查通过，因此 CI 中应明确运行类型检查，而不是只相信页面热更新没有报错。

本课程的独立实验可从 Vite 模板起步：

```bash
npm create vite@latest vue-lab -- --template vue-ts
npm create vite@latest react-lab -- --template react-ts
```

这是创建新练习目录的命令，不应在已有知识库根目录重复执行。安装前查看当前模板要求的 Node 版本，创建后提交锁文件。团队和 CI 用锁文件安装，可以减少“我这里好好的”这种版本偏差。`latest` 是上手入口，不是长期可复现版本声明。

## 类型描述的是承诺，网络数据还需要验收

```typescript
export type Article = { id: string; title: string }

export function parseArticle(value: unknown): Article {
  if (typeof value !== 'object' || value === null) throw new Error('文章响应不是对象')
  const row = value as Record<string, unknown>
  if (typeof row.id !== 'string' || typeof row.title !== 'string')
    throw new Error('文章响应缺少 id 或 title')
  return { id: row.id, title: row.title }
}
```

`response.json() as Article` 只让编译器相信你，不会把错误的数据变正确。接口边界用手动检查或运行时 schema，内部函数再享受类型推断。泛型写得再漂亮，也替代不了网络边界的实际检查。

## 模块边界与环境变量

`import type` 用来表达只需要类型。不要让前端模块导入包含私密配置的服务端文件；“最终没调用那个函数”不是可靠的保密方案。Vite 的客户端环境变量、Nuxt 的 public runtime config 都应视为访客可读。

开发热更新保留部分运行状态，可能掩盖初始化问题。修改路由、环境配置或模块级状态后，至少完整刷新一次。发布前用生产构建验证，开发服务器与生产资源路径、压缩和分包行为并不完全相同。

## 练习：一次真实的边界错误

让模拟接口返回 `{ id: 7, title: null }`。先使用类型断言，再使用解析函数，观察错误分别出现在哪里。合理结果是边界处显示可理解的加载失败，而不是读到文章页内部才因 `title.trim()` 崩溃。

## 继续阅读

- [Vite：入门与版本要求](https://vite.dev/guide/)
- [Vite：环境变量](https://vite.dev/guide/env-and-mode)
- [TypeScript：日常类型](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
