<script setup>
import { computed, ref } from 'vue'

const articles = [
  { id: 'html', title: 'HTML 页面结构' },
  { id: 'vue', title: 'Vue 响应式入门' },
  { id: 'react', title: 'React 状态入门' },
]
const query = ref('')
const input = ref(null)
const visibleArticles = computed(() => {
  const word = query.value.trim().toLowerCase()
  return articles.filter(article =>
    article.title.toLowerCase().includes(word)
  )
})
function clearSearch() {
  query.value = ''
  input.value?.focus()
}
</script>

<template>
  <main class="page">
    <h1>文章搜索</h1>
    <label for="query">搜索标题</label>
    <input id="query" ref="input" v-model="query" type="search" autocomplete="off">
    <button type="button" @click="clearSearch">清空</button>
    <p role="status">找到 {{ visibleArticles.length }} 篇文章</p>
    <ul>
      <li v-for="article in visibleArticles" :key="article.id">
        {{ article.title }}
      </li>
    </ul>
    <p v-if="visibleArticles.length === 0">没有匹配的文章，换一个词试试。</p>
  </main>
</template>

<style scoped>
.page { font: 1rem/1.7 system-ui; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; }
input, button { font: inherit; padding: .5rem; }
input { max-width: 100%; box-sizing: border-box; }
</style>
