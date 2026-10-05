// Teaching model only: no network, persistence or authorization.
export function setFavorite(ids, articleId, saved) {
  const next = new Set(ids)
  if (saved) next.add(articleId)
  else next.delete(articleId)
  return [...next]
}
