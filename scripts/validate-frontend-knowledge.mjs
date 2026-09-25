import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import MarkdownIt from 'markdown-it'
import { slugify } from '../app/utils/slug.ts'
const root = 'content/前端架构'
const markdown = new MarkdownIt()
const records = []
async function scan(directory) {
  const slugs = new Set()
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await scan(file)
      continue
    }
    if (!entry.name.endsWith('.md')) continue
    const source = await fs.readFile(file, 'utf8')
    const titles = [...source.matchAll(/^# (.+)$/gm)]
    assert.equal(titles.length, 1, `Expected one title: ${file}`)
    const slug = slugify(titles[0][1])
    assert(!slugs.has(slug), `Duplicate sibling slug: ${file}`)
    slugs.add(slug)
    assert.equal(
      (source.match(/^```/gm) || []).length % 2,
      0,
      `Unclosed fence: ${file}`,
    )
    const tokens = markdown.parse(source, {})
    const links = [...source.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map(
      (match) => match[1],
    )
    assert(links.length >= 2, `Missing sources: ${file}`)
    assert(
      tokens.some((token) => token.type === 'heading_open' && token.tag === 'h2'),
      `Missing sections: ${file}`,
    )
    assert(!/TODO|待补充|lorem ipsum/i.test(source), `Unfinished content: ${file}`)
    records.push({
      file,
      title: titles[0][1],
      characters: source.length,
      links,
      diagrams: tokens.filter(
        (token) => token.type === 'fence' && token.info === 'mermaid',
      ).length,
    })
  }
}
await scan(root)
assert.equal(records.length, 25, 'Unexpected curriculum article count')
await fs.mkdir('.tools/frontend', { recursive: true })
await fs.writeFile('.tools/frontend/inventory.json', JSON.stringify(records, null, 2))
console.log(
  JSON.stringify(
    {
      articles: records.length,
      characters: records.reduce((n, r) => n + r.characters, 0),
      sources: new Set(records.flatMap((r) => r.links)).size,
      diagrams: records.reduce((n, r) => n + r.diagrams, 0),
    },
    null,
    2,
  ),
)
