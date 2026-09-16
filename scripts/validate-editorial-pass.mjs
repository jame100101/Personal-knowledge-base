import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { execFileSync } from 'node:child_process'

const manifest = JSON.parse(
  await fs.readFile('scripts/editorial-pass-manifest.json', 'utf8'),
)
const normalize = (s) => s.replace(/\r\n/g, '\n')
const previous = (file) =>
  normalize(
    execFileSync('git', ['show', `${manifest.base}:${file}`], {
      encoding: 'utf8',
      maxBuffer: 8 * 1024 * 1024,
    }),
  )
const blocks = (s) =>
  [...s.matchAll(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/gm)].map((m) => m[0])
const prose = (s) => s.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*$/gm, '')
const headings = (s) => prose(s).match(/^#{1,6} .+$/gm) || []
const links = (s) => [...s.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1])
const corrections = new Set(manifest.codeCorrections.map((r) => r.path))
let preservedBlocks = 0
for (const { path: file } of manifest.articles) {
  const old = previous(file)
  const current = normalize(await fs.readFile(file, 'utf8'))
  assert.deepEqual(headings(current), headings(old), `${file}: headings/TOC changed`)
  for (const link of links(old))
    assert(links(current).includes(link), `${file}: removed link ${link}`)
  const before = blocks(old)
  const after = blocks(current)
  assert.equal(after.length, before.length, `${file}: code block count changed`)
  const expected = before.map((block) => {
    if (!corrections.has(file)) return block
    if (file.includes('MySQL-InnoDB'))
      return block.replace('FETCH FIRST 20 ROWS ONLY;', 'LIMIT 20;')
    if (file.includes('Spring集成-Testcontainers'))
      return block.replace(
        'r.add("spring.datasource.url", postgres::getJdbcUrl);',
        'r.add("spring.datasource.url", postgres::getJdbcUrl);\n    r.add("spring.datasource.username", postgres::getUsername);\n    r.add("spring.datasource.password", postgres::getPassword);',
      )
    if (file.includes('Elasticsearch搜索'))
      return block.replace(
        '"sort": [{"score": "desc"}, {"_id": "asc"}]',
        '"sort": [{"_score": "desc"}]',
      )
    throw new Error(`Unspecified code correction: ${file}`)
  })
  assert.deepEqual(after, expected, `${file}: unreviewed code/diagram change`)
  preservedBlocks += before.length
  for (const key of ['last_verified', 'version_scope', 'source_type', 'stability']) {
    const expression = new RegExp('^> - `' + key + '`:.+$', 'gm')
    assert.deepEqual(
      current.match(expression),
      old.match(expression),
      `${file}: source metadata changed`,
    )
  }
  assert(!current.includes('能不用术语堆砌'), `${file}: generic checklist remains`)
  assert(
    !current.includes('下面的示例只保留关键路径。把它放入对应版本'),
    `${file}: generic example instructions remain`,
  )
  assert(!current.includes('\uFFFD'), `${file}: damaged encoding`)
}
for (const file of manifest.unchangedTrialFiles) {
  assert.equal(
    normalize(await fs.readFile(file, 'utf8')),
    previous(file),
    `${file}: trial changed`,
  )
}
console.log(
  JSON.stringify(
    {
      reviewed: manifest.reviewed,
      edited: manifest.articles.length,
      checkedCodeAndDiagramBlocks: preservedBlocks,
      codeCorrections: corrections.size,
      previousTrialPreserved: manifest.unchangedTrialFiles.length,
    },
    null,
    2,
  ),
)
