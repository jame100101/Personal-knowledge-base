import { useRef, useState } from 'react'
import './style.css'

const articles = [
  { id: 'html', title: 'HTML 页面结构' },
  { id: 'vue', title: 'Vue 响应式入门' },
  { id: 'react', title: 'React 状态入门' },
]

export default function App() {
  const [query, setQuery] = useState('')
  const input = useRef(null)
  const word = query.trim().toLowerCase()
  const visibleArticles = articles.filter(article =>
    article.title.toLowerCase().includes(word)
  )

  function clearSearch() {
    setQuery('')
    input.current?.focus()
  }

  return (
    <main className="page">
      <h1>文章搜索</h1>
      <label htmlFor="query">搜索标题</label>
      <input
        id="query" ref={input} type="search" autoComplete="off"
        value={query} onChange={event => setQuery(event.target.value)}
      />
      <button type="button" onClick={clearSearch}>清空</button>
      <p role="status">找到 {visibleArticles.length} 篇文章</p>
      <ul>
        {visibleArticles.map(article => (
          <li key={article.id}>{article.title}</li>
        ))}
      </ul>
      {visibleArticles.length === 0 && <p>没有匹配的文章，换一个词试试。</p>}
    </main>
  )
}
