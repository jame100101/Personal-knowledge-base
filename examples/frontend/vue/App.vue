<script setup lang="ts">
import { computed, ref } from 'vue'
import { initialArticles, filterArticles, toggleFavorite } from '../shared/model'
const query = ref('')
const favoritesOnly = ref(false)
const articles = ref(initialArticles.map((article) => ({ ...article })))
const visible = computed(() =>
  filterArticles(articles.value, query.value, favoritesOnly.value),
)
</script>
<template>
  <main>
    <a href="/react.html">打开 React 对照版</a>
    <h1>Vue · 文章搜索练习</h1>
    <p>数据只保存在当前页面，刷新后会恢复。</p>
    <label for="query">搜索文章</label>
    <input id="query" v-model="query" type="search" >
    <label class="check"
      ><input v-model="favoritesOnly" type="checkbox" >只看收藏</label
    >
    <p role="status">找到 {{ visible.length }} 篇文章</p>
    <ul>
      <li v-for="article in visible" :key="article.id">
        <span>{{ article.title }}</span>
        <button
          :aria-label="`收藏 ${article.title}`"
          :aria-pressed="article.favorite"
          @click="articles = toggleFavorite(articles, article.id)"
        >
          {{ article.favorite ? '已收藏' : '收藏' }}
        </button>
      </li>
    </ul>
    <p v-if="visible.length === 0">没有匹配的文章，换个词试试。</p>
  </main>
</template>
