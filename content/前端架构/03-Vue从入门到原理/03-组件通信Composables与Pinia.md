# Vue 组件通信、Composables 与 Pinia：共享到哪一层才合适

两个组件都要搜索，不代表它们应该共用同一份关键词。两个页面都要知道当前主题，则可能确实需要同一个状态。复用逻辑和共享数据，是两件经常被混淆的事。

## 组件之间先把话说明白

父组件通过 props 传入文章，子组件通过 emits 表达“想收藏”。props 是单向数据流的入口，不要在子组件中直接改父级传入的对象字段。即便技术上能改深层属性，也会让修改来源不清楚。

Slot 用于让父组件提供某个区域的内容；provide/inject 适合跨层传递树范围内的依赖，例如表单上下文。后者减少逐层转交，但依赖也变隐蔽了，应提供稳定的类型和明确的修改入口。

## Composable 复用的是有状态逻辑

下面可保存为 `useArticleFilter.ts`。两个调用各有自己的 query，但可以接收同一份文章来源：

```typescript
import { computed, ref, type Ref } from 'vue'

type Article = { id: string; title: string }
export function useArticleFilter(articles: Ref<Article[]>) {
  const query = ref('')
  const filtered = computed(() => {
    const word = query.value.trim().toLocaleLowerCase()
    return articles.value.filter((item) =>
      item.title.toLocaleLowerCase().includes(word),
    )
  })
  return { query, filtered }
}
```

如果把 `query` 移到函数外，它就变成模块级共享值。客户端看起来省事，SSR 时却可能跨请求共享用户数据。共享的生命周期必须设计清楚，不能只是为了少传一个参数就移到模块顶层。

## 什么时候引入 Pinia

当多个页面共同修改收藏、购物车或编辑工作区，且需要一致的更新入口和调试能力时，可以考虑 Pinia。store 中的 state 是原始状态，getters 是派生结果，actions 表达业务操作。不要把所有 input 的输入都搬进去。

在安装并注册 Pinia 的 Vue 应用中，`storeToRefs(store)` 可以提取保持响应式的 state/getters；直接 `const { count } = store` 可能失去你期待的更新关系。action 通常可以直接取出调用。Nuxt 应通过相应模块和请求范围机制集成，别自己造跨用户的全局单例。

## 不要把服务端状态也粗暴塞进去

文章列表有缓存时效、分页、权限范围和更新后的失效问题。Pinia 可以承载它，但这些规则仍要自己处理。查询库擅长服务端状态；store 更适合客户端工作区状态。选工具前先说明“谁是权威来源”，答案常常比库名有用。

## 练习与参考

在页面放两个独立搜索框，都调用这个 composable。第一个输入 Vue，第二个应保持空白。然后设计共享收藏：两份搜索结果里的同一文章收藏状态应一致。解释为什么前一个要独立，后一个要共享。

- [Vue：Composables](https://vuejs.org/guide/reusability/composables.html)
- [Vue：Provide / Inject](https://vuejs.org/guide/components/provide-inject.html)
- [Pinia：核心概念](https://pinia.vuejs.org/core-concepts/)
