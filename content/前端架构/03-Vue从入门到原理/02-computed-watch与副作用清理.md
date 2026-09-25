# computed、watch 与清理：别让旧请求覆盖新结果

你先搜索 Vue，马上又搜索 React。React 的结果先回来，Vue 的结果晚一点回来，页面却变成了 Vue。这不是搜索算法错了，而是两个请求完成顺序与输入顺序不同。

## 先分清计算和副作用

从文章数组计算数量，使用 computed；关键词变化后请求网络数据，使用 watch 或合适的数据获取方案。computed 的 getter 应保持纯计算，别在里面发送请求或修改其他状态。否则“读取一个值”就偷偷触发行为，排错会很费劲。

watch 明确指定观察来源；watchEffect 在同步执行期间收集依赖，异步函数第一次 await 之后才读到的依赖不会自动被这一轮收集。需要精确控制搜索条件时，watch 往往更直观。

## 一个带清理的搜索片段

以下代码放在 Vue 3 组件的 setup 中。`/api/articles?q=...` 是教学接口，约定返回标题字符串数组；实际接口需要按契约调整解析。

```typescript
import { ref, watch } from 'vue'

const query = ref('')
const results = ref<string[]>([])
const loading = ref(false)
const error = ref('')

watch(query, async (value, _previous, onCleanup) => {
  const controller = new AbortController()
  let active = true
  onCleanup(() => {
    active = false
    controller.abort()
  })
  results.value = []
  error.value = ''
  loading.value = false
  if (!value.trim()) return
  loading.value = true
  try {
    const response = await fetch(
      `/api/articles?q=${encodeURIComponent(value.trim())}`,
      { signal: controller.signal },
    )
    if (!response.ok) throw new Error('搜索失败，请重试')
    const data: unknown = await response.json()
    if (!Array.isArray(data) || !data.every((x) => typeof x === 'string'))
      throw new Error('搜索结果格式不正确')
    if (active) results.value = data
  } catch (cause) {
    if (active) error.value = cause instanceof Error ? cause.message : '搜索失败'
  } finally {
    if (active) loading.value = false
  }
})
```

abort 尽量停止无用网络工作，active 防止已经失效的流程提交结果。注意 finally 也要检查，否则旧请求可能把新请求的 loading 提前关掉。取消并不意味着服务端一定没执行，写操作不能把 abort 当成回滚。

## 清理要和副作用成对

监听事件要移除，计时器要清除，订阅要取消。同步在 setup 中建立的 watcher 会随组件卸载停止；如果在异步回调里才创建 watcher，就需要确认它的归属并主动停止。Vue 3.5 的 `onWatcherCleanup` 必须在同步阶段注册，本例使用回调参数 `onCleanup`，同样在 await 前注册，意图更清楚。

更新状态后立刻读取 DOM，可能读到更新前的画面。确实需要操作更新后的 DOM 时考虑 `nextTick`，或恰当使用 `flush: 'post'`。不要用一个随意的 100ms 定时器赌更新完成。

## 练习与参考

让 Vue 请求延迟 800ms、React 请求延迟 100ms，快速切换关键词。最终必须留下 React 的结果，加载指示也不能被旧请求关闭。再测试清空关键词和组件卸载。

- [Vue：Watchers 与清理时机](https://vuejs.org/guide/essentials/watchers.html)
- [Vue：Computed](https://vuejs.org/guide/essentials/computed.html)
- [MDN：AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
