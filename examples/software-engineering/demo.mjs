import { setFavorite } from './favorites.mjs'
let favorites = []
favorites = setFavorite(favorites, 'article-1', true)
console.log('保存后：', favorites)
favorites = setFavorite(favorites, 'article-1', true)
console.log('重复保存后：', favorites)
favorites = setFavorite(favorites, 'article-1', false)
console.log('取消后：', favorites)
