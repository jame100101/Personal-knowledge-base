export type Article = { id: string; title: string; favorite: boolean }
export const initialArticles: Article[] = [
  { id: 'vue', title: 'Vue 响应式入门', favorite: false },
  { id: 'react', title: 'React 状态入门', favorite: true },
]
export function filterArticles(
  articles: readonly Article[],
  query: string,
  favoritesOnly = false,
): Article[] {
  const word = query.trim().toLocaleLowerCase()
  return articles.filter(
    (article) =>
      article.title.toLocaleLowerCase().includes(word) &&
      (!favoritesOnly || article.favorite),
  )
}
export function toggleFavorite(articles: readonly Article[], id: string): Article[] {
  return articles.map((article) =>
    article.id === id ? { ...article, favorite: !article.favorite } : article,
  )
}

// Aborting saves work when supported; the generation check also rejects late completions.
export function createLatestRequest<T>() {
  let generation = 0
  let controller: AbortController | undefined
  return {
    async run(
      load: (signal: AbortSignal) => Promise<T>,
      commit: (value: T) => void,
      fail: (error: unknown) => void,
    ) {
      const current = ++generation
      controller?.abort()
      controller = new AbortController()
      try {
        const value = await load(controller.signal)
        if (current === generation) commit(value)
      } catch (error) {
        if (current === generation) fail(error)
      }
    },
    cancel() {
      generation++
      controller?.abort()
    },
  }
}
