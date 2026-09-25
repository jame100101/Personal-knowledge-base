# Nuxt 与 Next.js：框架替你组织什么，什么仍要自己决定

Vue 和 React 主要帮助组织界面。做完整网站时，还需要路由、服务端入口、初始数据、错误页面和部署约定。Nuxt 与 Next.js 把这些能力组织成框架，但它们不会自动替你完成权限和业务设计。

## 先看正在阅读的这个项目

本知识库采用 Nuxt 3，`nuxt.config.ts` 配置 `srcDir: 'app/'`。因此页面在 `app/pages`，动态阅读入口是 `app/pages/knowledge/[...path].vue`，数据库访问封装在 composables 中，真实数据库连通检查位于 `app/server/api/health.get.ts`。目录位置是本项目配置结果，不能套用另一个版本教程的默认路径。

Nuxt 把路由文件、SSR 和客户端导航连接起来。需要服务端初始数据时，可以使用 useAsyncData/useFetch 等约定，让数据随页面传到客户端，减少 hydration 时重复请求。使用普通 fetch 并非错误，但缓存键、重复请求和状态同步需要自己处理。

## Nuxt 3 教学片段

以下片段假设练习项目存在返回文章对象的 `/api/articles/:id`，不是本知识库现有接口：

```vue
<script setup lang="ts">
const route = useRoute()
const articleId = computed(() => String(route.params.id))
const { data, pending, error, refresh } = await useFetch(
  () => `/api/articles/${encodeURIComponent(articleId.value)}`,
)
</script>

<template>
  <p v-if="pending">正在读取文章……</p>
  <div v-else-if="error">
    <p>文章加载失败。</p>
    <button @click="() => refresh()">重试</button>
  </div>
  <article v-else-if="data">{{ data }}</article>
</template>
```

响应式 URL 表达“文章 ID 变化时请求也变化”。示例用对象展示确认链路，正式页面应按接口类型渲染标题和正文。服务端取数函数应避免混入不相关副作用，不要在取文章时顺便发送通知。

## Next.js 的 Server / Client Components

App Router 中 Server Component 可以在服务端读取数据并组织界面，Client Component 使用状态、事件和浏览器能力。`'use client'` 标记客户端模块边界，导入依赖也会受边界影响。它不表示“首屏绝不在服务器预渲染”。

Server Component 与 SSR 不是同义词：前者描述组件执行和传输模型，后者描述 HTML 生成方式。不要把 Vue 的 setup 直接类比成 React Server Component。跨服务器与客户端边界传递的数据需要满足框架可序列化约定，不能把私密客户端对象随意传过去。

React 19 的 Actions、useActionState、useOptimistic 等能力可以组织异步表单体验，但使用普通异步 Action 与使用服务端函数不是一回事。无论入口叫 Route Handler、Server Function 还是 Supabase API，都要在可信侧验证身份、权限和输入；文件放在服务器目录并不会自动授权。

## BFF 为什么会出现

页面需要组合文章、作者和权限信息时，可以用面向前端的服务层聚合请求。这样减少浏览器协调成本，也能隔离私密上游凭据。但 BFF 会增加服务端维护职责。对于公开文章直接通过受 RLS 保护的 Supabase 查询，也可以是合理方案。

## 练习与参考

列出搜索页哪些信息可公开、哪些只能当前用户读取、哪些交互必须浏览器完成，再分别画 Nuxt 与 Next 的边界。先不写代码；只要把私钥放进 public 配置，就说明边界图已经有问题。

- [Nuxt 3：数据获取](https://nuxt.com/docs/3.x/getting-started/data-fetching)
- [Next.js：服务器与客户端组件](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [React：useActionState](https://react.dev/reference/react/useActionState)
