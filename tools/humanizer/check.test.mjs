import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compareProtected, styleFindings } from './check.mjs'

test('prose edits preserve code, headings, tables, citations and factual numbers', () => {
  const before =
    '# 读取缓存\n\n这里容易混淆的是：缓存最多保存 20 项，调用 `get()` 查询。\n\n```js\nconst n = 20\n```\n\n|参数|值|\n|---|---|\n|ttl|30|\n\n[说明][docs]\n\n[docs]: https://example.com/v1 "Docs"\n'
  const after = before.replace(
    '这里容易混淆的是：缓存最多保存 20 项，调用 `get()` 查询。',
    '调用 `get()` 查询缓存。缓存最多保存 20 项。',
  )
  assert.deepEqual(compareProtected(before, after), [])
  for (const [old, replacement, key] of [
    ['const n = 20', 'const n = 30', 'blocks'],
    ['ttl|30', 'ttl|40', 'tables'],
    ['example.com/v1', 'example.com/v2', 'links'],
    ['# 读取缓存', '# 缓存读取', 'headings'],
    ['最多保存 20', '最多保存 21', 'numbers'],
    ['`get()`', '`delete()`', 'inlineCode'],
  ]) {
    assert(
      compareProtected(before, before.replace(old, replacement)).includes(key),
      key,
    )
  }
})
test('frontmatter, blockquotes and HTML anchors cannot be changed by a prose pass', () => {
  const original =
    '---\ntitle: 原标题\n---\n\n> 仅在缓存开启时可能有效。\n\n<a id="stable"></a>\n\n正文。'
  for (const [old, replacement, key] of [
    ['原标题', '新标题', 'frontmatter'],
    ['可能', '一定', 'quotes'],
    ['stable', 'new', 'html'],
  ])
    assert(compareProtected(original, original.replace(old, replacement)).includes(key))
})
test('style hints ignore fenced and indented code, inline code, quoted data and tables', () => {
  const code = '赋能 开启新篇章'
  const source = [
    '~~~txt',
    code,
    '~~~',
    '',
    '    ' + code,
    '',
    '`' + code + '`',
    '',
    '> ' + code,
    '',
    '|术语|说明|',
    '|---|---|',
    '|' + code + '|示例|',
    '',
  ].join('\n')
  assert.deepEqual(styleFindings(source), [])
  assert.deepEqual(compareProtected(source, source.replace('~~~txt', '~~~js')), [
    'blocks',
  ])
})
test('repeated scaffolding is a hint; legitimate technical contrasts and feedback loops are kept', () => {
  assert.equal(
    styleFindings('这里容易混淆的是：甲。\n\n这里容易混淆的是：乙。').filter(
      (f) => f.rule === 'repeated-lead',
    ).length,
    2,
  )
  assert.deepEqual(
    styleFindings('错误发生在保存阶段，而不是上传阶段。控制器使用闭环反馈。'),
    [],
  )
})
test('a qualifier change needs human review even when structural checks pass', () => {
  assert.deepEqual(
    compareProtected('缓存可能减少读取时间。', '缓存一定减少读取时间。'),
    [],
  )
})
