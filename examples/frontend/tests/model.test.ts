import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  filterArticles,
  initialArticles,
  toggleFavorite,
  createLatestRequest,
} from '../shared/model.ts'
test('normalizes query and preserves input data', () => {
  assert.deepEqual(
    filterArticles(initialArticles, '  REACT ').map((x) => x.id),
    ['react'],
  )
  assert.equal(filterArticles(initialArticles, '不存在').length, 0)
  assert.equal(filterArticles(initialArticles, '').length, 2)
  assert.equal(initialArticles.length, 2)
})
test('favorites compose with query; toggling does not mutate snapshots', () => {
  const updated = toggleFavorite(initialArticles, 'vue')
  assert.equal(filterArticles(updated, '', true).length, 2)
  assert.equal(initialArticles[0].favorite, false)
  assert.equal(filterArticles(updated, 'vue', true).length, 1)
  assert.equal(filterArticles(toggleFavorite(updated, 'react'), '', true).length, 1)
})
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
test('old success cannot overwrite a newer response even if loader ignores abort', async () => {
  const latest = createLatestRequest<string>()
  const old = deferred<string>()
  const seen: string[] = []
  let oldSignal: AbortSignal | undefined
  const pending = latest.run(
    (signal) => {
      oldSignal = signal
      return old.promise
    },
    (value) => seen.push(value),
    () => assert.fail(),
  )
  await latest.run(
    async () => 'React',
    (value) => seen.push(value),
    () => assert.fail(),
  )
  old.resolve('Vue')
  await pending
  assert.equal(oldSignal?.aborted, true)
  assert.deepEqual(seen, ['React'])
})
test('obsolete errors and cancelled work never update the UI; current errors do', async () => {
  const latest = createLatestRequest<string>()
  const old = deferred<string>()
  const seen: string[] = []
  const pending = latest.run(
    () => old.promise,
    () => assert.fail(),
    () => assert.fail(),
  )
  latest.cancel()
  old.reject(new Error('old'))
  await pending
  await latest.run(
    async () => {
      throw new Error('current')
    },
    () => assert.fail(),
    (error) => seen.push((error as Error).message),
  )
  assert.deepEqual(seen, ['current'])
})
