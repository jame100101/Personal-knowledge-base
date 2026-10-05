// Offline SQL plan generator: never connects to or writes to a database.
// Input: a fresh folders/documents metadata snapshot from the target project.
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import { slugify } from '../app/utils/slug.ts'
import {
  rootOrder,
  folderOrder,
  documentOrder,
  displayName,
} from './learning-order.mjs'
const snapshotFile = process.argv[2]
assert(snapshotFile, 'Usage: node scripts/prepare-learning-release.mjs SNAPSHOT.json')
const snapshot = JSON.parse(await fs.readFile(snapshotFile, 'utf8'))
const output = '.tools/software-engineering'
await fs.mkdir(output, { recursive: true })
const byId = new Map(snapshot.folders.map((f) => [f.id, f]))
const chain = (id) => {
  const result = [],
    seen = new Set()
  while (id) {
    assert(!seen.has(id), 'Folder cycle')
    seen.add(id)
    const folder = byId.get(id)
    assert(folder, `Unknown folder ${id}`)
    result.unshift(folder)
    id = folder.parent_id
  }
  return result
}
const changes = []
for (const folder of snapshot.folders.filter((f) => f.is_visible)) {
  const parts = chain(folder.id)
  if (parts.some((f) => !f.is_visible)) continue
  const order =
    parts.length === 1
      ? rootOrder(folder.name)
      : folderOrder(
          parts[0].name,
          parts
            .slice(1)
            .map((f) => f.name)
            .join('/'),
          folder.sort_order,
        )
  if (order !== folder.sort_order)
    changes.push({
      table: 'folders',
      id: folder.id,
      name: parts.map((f) => f.name).join('/'),
      before: folder.sort_order,
      after: order,
    })
}
for (const doc of snapshot.documents.filter((d) => d.status === 'published')) {
  const parts = chain(doc.folder_id)
  if (!parts.length || parts.some((f) => !f.is_visible)) continue
  const order = documentOrder(
    parts[0].name,
    parts
      .slice(1)
      .map((f) => f.name)
      .join('/'),
    doc.original_filename || '',
    doc.sort_order,
  )
  if (order !== doc.sort_order)
    changes.push({
      table: 'documents',
      id: doc.id,
      name: [...parts.map((f) => f.name), doc.title].join('/'),
      before: doc.sort_order,
      after: order,
    })
}
const rootName = '软件工程'
assert(
  !snapshot.folders.some((f) => f.parent_id === null && f.name === rootName),
  'Module already exists; use its append-only importer to verify it',
)
const newFolders = [],
  docs = [],
  folderMap = new Map()
async function scan(relative, parent) {
  const basename = relative ? path.basename(relative) : rootName
  const name = displayName(basename)
  const folder = {
    id: randomUUID(),
    parent_id: parent?.id || null,
    name,
    slug: slugify(name),
    description: '从收藏功能出发，循序学习需求、设计、协作、测试、交付与维护',
    icon: 'Folder',
    sort_order: relative ? Number(basename.match(/^\d+/)[0]) * 10 : rootOrder(rootName),
    is_visible: true,
  }
  newFolders.push(folder)
  folderMap.set(relative, folder)
  for (const entry of (
    await fs.readdir(path.join('content', rootName, relative), { withFileTypes: true })
  ).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join('content', rootName, relative, entry.name)
    if (entry.isDirectory()) {
      await scan(path.join(relative, entry.name), folder)
      continue
    }
    if (!entry.name.endsWith('.md')) continue
    const content = await fs.readFile(file, 'utf8')
    const title = content.match(/^# (.+)$/m)?.[1]
    assert(title, `Missing title: ${file}`)
    const intro = content.split(/\n\s*\n/)[1]
    const excerpt = intro.replace(/[*`]/g, '').slice(0, 220)
    docs.push({
      file,
      intro,
      parent: relative,
      row: {
        id: randomUUID(),
        folder_id: folder.id,
        title,
        slug: slugify(title),
        content,
        original_filename: entry.name,
        status: 'published',
        sort_order: documentOrder(
          rootName,
          relative,
          entry.name,
          Number(entry.name.match(/^\d+/)[0]) * 10,
        ),
        tags: [rootName, '软件工程入门', name],
        description: excerpt,
        excerpt,
        reading_time: Math.ceil(content.replace(/\s/g, '').length / 500),
        file_size_bytes: Buffer.byteLength(content),
        published_at: new Date().toISOString(),
      },
    })
  }
}
await scan('', null)
assert.equal(docs.length, 18)
const quote = (s) => "'" + String(s).replaceAll("'", "''") + "'"
const sqlValue = (v) =>
  v === null
    ? 'NULL'
    : Array.isArray(v)
      ? `ARRAY[${v.map(quote).join(',')}]::text[]`
      : typeof v === 'string'
        ? quote(v)
        : String(v)
const insert = (table, row) =>
  `INSERT INTO public.${table} (${Object.keys(row).join(',')}) VALUES (${Object.values(row).map(sqlValue).join(',')});`
const sql = [
  'BEGIN;',
  'LOCK TABLE public.folders, public.documents IN SHARE ROW EXCLUSIVE MODE;',
  "CREATE TEMP TABLE learning_before_folders ON COMMIT DROP AS SELECT id, to_jsonb(f) - 'sort_order' - 'updated_at' AS value FROM public.folders f;",
  "CREATE TEMP TABLE learning_before_documents ON COMMIT DROP AS SELECT id, to_jsonb(d) - 'sort_order' - 'updated_at' AS value FROM public.documents d;",
  `DO $guard$ BEGIN IF EXISTS (SELECT 1 FROM public.folders WHERE parent_id IS NULL AND (name = ${quote(rootName)} OR slug = ${quote(newFolders[0].slug)})) THEN RAISE EXCEPTION 'Software engineering module already exists'; END IF; END $guard$;`,
]
for (const c of changes)
  sql.push(
    `DO $guard$ BEGIN UPDATE public.${c.table} SET sort_order = ${c.after} WHERE id = ${quote(c.id)}::uuid AND sort_order = ${c.before}; IF NOT FOUND THEN RAISE EXCEPTION 'Order changed since snapshot: ${c.id}'; END IF; END $guard$;`,
  )
for (const f of newFolders) sql.push(insert('folders', f))
for (const d of docs) sql.push(insert('documents', d.row))
for (const table of ['folders', 'documents'])
  sql.push(
    `DO $guard$ BEGIN IF EXISTS (SELECT 1 FROM learning_before_${table} b LEFT JOIN public.${table} r ON r.id=b.id WHERE (to_jsonb(r) - 'sort_order' - 'updated_at') IS DISTINCT FROM b.value) THEN RAISE EXCEPTION 'Pre-existing ${table} changed beyond order'; END IF; END $guard$;`,
  )
sql.push('COMMIT;')
await fs.writeFile(`${output}/release.sql`, sql.join('\n'))
await fs.writeFile(`${output}/order-changes.json`, JSON.stringify(changes, null, 2))
await fs.writeFile(
  `${output}/restore-order.sql`,
  [
    'BEGIN;',
    ...changes.map(
      (c) =>
        `UPDATE public.${c.table} SET sort_order=${c.before} WHERE id=${quote(c.id)}::uuid AND sort_order=${c.after};`,
    ),
    'COMMIT;',
  ].join('\n'),
)
const publication = docs.map((d) => {
  const folderSlugs = []
  let key = d.parent
  for (;;) {
    folderSlugs.unshift(folderMap.get(key).slug)
    if (!key) break
    key = path.dirname(key)
    if (key === '.') key = ''
  }
  return {
    file: d.file,
    id: d.row.id,
    intro: d.intro,
    title: d.row.title,
    md5: createHash('md5').update(d.row.content).digest('hex'),
    url: `https://knowledge.damnatiox.com/knowledge/${folderSlugs.join('/')}/${d.row.slug}`,
  }
})
await fs.writeFile(`${output}/publication.json`, JSON.stringify(publication, null, 2))
console.log(
  JSON.stringify(
    {
      newFolders: newFolders.length,
      newDocuments: docs.length,
      reorderedFolders: changes.filter((c) => c.table === 'folders').length,
      reorderedDocuments: changes.filter((c) => c.table === 'documents').length,
      output,
    },
    null,
    2,
  ),
)
