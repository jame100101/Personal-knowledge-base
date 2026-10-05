import test from 'node:test'
import assert from 'node:assert/strict'
import { setFavorite } from './favorites.mjs'

test('saving twice does not duplicate an article', () => {
  const once = setFavorite([], 'article-1', true)
  assert.deepEqual(setFavorite(once, 'article-1', true), ['article-1'])
})
test('removing one article preserves other favorites', () => {
  assert.deepEqual(setFavorite(['article-1', 'article-2'], 'article-1', false), [
    'article-2',
  ])
})
test('removing an absent article is harmless', () => {
  assert.deepEqual(setFavorite(['article-1'], 'missing', false), ['article-1'])
})
test('updating a list does not mutate its input or another independent list', () => {
  const first = ['article-1']
  const second = ['article-2']
  const result = setFavorite(first, 'article-3', true)
  assert.deepEqual(result, ['article-1', 'article-3'])
  assert.deepEqual(first, ['article-1'])
  assert.deepEqual(second, ['article-2'])
  assert.notEqual(result, first)
})
