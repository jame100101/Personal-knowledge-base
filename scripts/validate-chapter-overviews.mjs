import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
const chapters = JSON.parse(fs.readFileSync('app/data/chapter-overviews.json', 'utf8'))
const directories = []
function walk(dir) {
  directories.push(dir)
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) walk(path.join(dir, entry.name))
  }
}
for (const entry of fs.readdirSync('content', { withFileTypes: true })) {
  if (entry.isDirectory()) walk(path.join('content', entry.name))
}
assert.deepEqual(chapters.map((c) => c.sourceDirectory).sort(), directories.sort())
assert.equal(new Set(chapters.map((c) => c.id)).size, chapters.length)
assert.equal(new Set(chapters.map((c) => c.key)).size, chapters.length)
const missing = []
for (const c of chapters) {
  assert(c.modules.length >= 4 && c.modules.length <= 7)
  assert.equal(new Set(c.modules).size, c.modules.length)
  const file = `docs/chapters/${c.id}.md`
  const doc = fs.readFileSync(file, 'utf8')
  assert(doc.includes('```mermaid'))
  for (const match of doc.matchAll(/\]\(<?([^\n)>]+)>?\)/g)) {
    const href = match[1]
    if (
      !href.startsWith('http') &&
      !fs.existsSync(path.resolve(path.dirname(file), href))
    )
      missing.push(`${c.id}: ${href}`)
  }
  const image = `app/public${c.image}`
  if (!fs.existsSync(image)) continue
  const bytes = fs.readFileSync(image)
  assert.equal(bytes.toString('hex', 0, 8), '89504e470d0a1a0a')
  const width = bytes.readUInt32BE(16),
    height = bytes.readUInt32BE(20)
  assert(width >= 1280 && Math.abs(width / height - 16 / 9) < 0.01)
}
assert.deepEqual(missing, [], 'Missing chapter assets or links')
console.log(
  `Validated ${chapters.length} chapters: coverage, modules, links, Mermaid sources and image dimensions.`,
)
