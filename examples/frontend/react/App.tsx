import { useState } from 'react'
import { initialArticles, filterArticles, toggleFavorite } from '../shared/model'
export default function App() {
  const [query, setQuery] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [articles, setArticles] = useState(() =>
    initialArticles.map((article) => ({ ...article })),
  )
  const visible = filterArticles(articles, query, favoritesOnly)
  return (
    <main>
      <a href="/vue.html">打开 Vue 对照版</a>
      <h1>React · 文章搜索练习</h1>
      <p>数据只保存在当前页面，刷新后会恢复。</p>
      <label htmlFor="query">搜索文章</label>
      <input
        id="query"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <label className="check">
        <input
          type="checkbox"
          checked={favoritesOnly}
          onChange={(event) => setFavoritesOnly(event.target.checked)}
        />
        只看收藏
      </label>
      <p role="status">找到 {visible.length} 篇文章</p>
      <ul>
        {visible.map((article) => (
          <li key={article.id}>
            <span>{article.title}</span>
            <button
              aria-label={`收藏 ${article.title}`}
              aria-pressed={article.favorite}
              onClick={() =>
                setArticles((previous) => toggleFavorite(previous, article.id))
              }
            >
              {article.favorite ? '已收藏' : '收藏'}
            </button>
          </li>
        ))}
      </ul>
      {visible.length === 0 && <p>没有匹配的文章，换个词试试。</p>}
    </main>
  )
}
