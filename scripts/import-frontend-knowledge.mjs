// Append-only publication for the new module. Existing nonidentical rows stop the run.
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { slugify } from '../app/utils/slug.ts'

for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}
const apply = process.argv.includes('--apply')
const verify = process.argv.includes('--verify')
assert(!(apply && verify), 'Choose --apply or --verify')
const rootName = '前端架构'
const rootPath = `content/${rootName}`
const folderSpecs = [{ key: '', parent: null, name: rootName, order: 1000 }]
const documents = []
const display = (name) => name.replace(/^\d{2,3}-/, '').replace(/\.md$/, '')
const order = (name) =>
  name.startsWith('000-') ? -10 : Number(name.match(/^\d+/)?.[0] || 100) * 10
const normalize = (text) => text.replace(/\r\n/g, '\n').trim()
async function scan(key) {
  for (const entry of (
    await fs.readdir(path.join(rootPath, key), { withFileTypes: true })
  ).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = key ? `${key}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      folderSpecs.push({
        key: relative,
        parent: key,
        name: display(entry.name),
        order: order(entry.name),
      })
      await scan(relative)
    } else if (entry.name.endsWith('.md')) {
      const file = `${rootPath}/${relative}`
      const content = await fs.readFile(file, 'utf8')
      const title = content.match(/^# (.+)$/m)?.[1]
      assert(title, `Missing title: ${file}`)
      documents.push({
        file,
        parent: key,
        filename: entry.name,
        content,
        title,
        order: order(entry.name),
        slug: slugify(title),
      })
    }
  }
}
await scan('')
assert(documents.length > 0)
const db = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL,
  process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
)
async function all(table) {
  const rows = []
  for (let start = 0; ; start += 500) {
    const { data, error } = await db
      .from(table)
      .select('*')
      .order('id')
      .range(start, start + 499)
    if (error) throw error
    rows.push(...data)
    if (data.length < 500) return rows
  }
}
const digest = (row) => createHash('sha256').update(JSON.stringify(row)).digest('hex')
let signedIn = false
try {
  if (apply) {
    assert(
      process.env.AGENT_SEED_ADMIN_EMAIL && process.env.AGENT_SEED_ADMIN_PASSWORD,
      'Missing publication credentials',
    )
    const { error } = await db.auth.signInWithPassword({
      email: process.env.AGENT_SEED_ADMIN_EMAIL,
      password: process.env.AGENT_SEED_ADMIN_PASSWORD,
    })
    if (error) throw error
    signedIn = true
  }
  const [folders, rows] = await Promise.all([all('folders'), all('documents')])
  const folderMap = new Map()
  const missingFolders = []
  for (const spec of folderSpecs) {
    const parentId = spec.parent === null ? null : folderMap.get(spec.parent)?.id
    const matches =
      parentId === undefined
        ? []
        : folders.filter(
            (r) =>
              r.parent_id === parentId &&
              (r.slug === slugify(spec.name) || r.name === spec.name),
          )
    assert(matches.length <= 1, `Ambiguous folder: ${spec.key}`)
    if (matches.length) {
      const row = matches[0]
      assert(
        row.name === spec.name && row.slug === slugify(spec.name) && row.is_visible,
        `Folder differs: ${spec.key}`,
      )
      folderMap.set(spec.key, row)
    } else missingFolders.push(spec)
  }
  const docMap = new Map()
  const missingDocs = []
  for (const spec of documents) {
    const parentId = folderMap.get(spec.parent)?.id
    const matches = parentId
      ? rows.filter(
          (r) =>
            r.folder_id === parentId &&
            (r.slug === spec.slug ||
              r.original_filename === spec.filename ||
              r.title === spec.title),
        )
      : []
    assert(matches.length <= 1, `Ambiguous document: ${spec.file}`)
    if (matches.length) {
      const row = matches[0]
      assert(
        row.title === spec.title &&
          row.slug === spec.slug &&
          row.status === 'published' &&
          row.original_filename === spec.filename &&
          row.sort_order === spec.order &&
          normalize(row.content) === normalize(spec.content),
        `Remote edit requires review: ${spec.file}`,
      )
      docMap.set(spec.file, row)
    } else missingDocs.push(spec)
  }
  if (verify)
    assert(
      missingFolders.length + missingDocs.length === 0,
      'Module is not fully published',
    )
  if (apply) {
    await fs.mkdir('.tools/content-backups', { recursive: true })
    const backup = `.tools/content-backups/frontend-${Date.now()}.json`
    await fs.writeFile(backup, JSON.stringify({ folders, documents: rows }, null, 2))
    console.log(`Backup: ${backup}`)
    for (const spec of missingFolders) {
      const parentId = spec.parent === null ? null : folderMap.get(spec.parent)?.id
      assert(parentId !== undefined, `Missing parent: ${spec.key}`)
      const { data, error } = await db
        .from('folders')
        .insert({
          parent_id: parentId,
          name: spec.name,
          slug: slugify(spec.name),
          description: '从浏览器与组件学到 Vue、React、路由、状态、渲染、安全和交付',
          icon: 'Folder',
          sort_order: spec.order,
          is_visible: true,
        })
        .select()
        .single()
      if (error) throw error
      folderMap.set(spec.key, data)
    }
    for (const spec of missingDocs) {
      const excerpt = spec.content
        .split(/\n\s*\n/)[1]
        .replace(/[*`]/g, '')
        .slice(0, 220)
      const { data, error } = await db
        .from('documents')
        .insert({
          folder_id: folderMap.get(spec.parent).id,
          title: spec.title,
          slug: spec.slug,
          content: spec.content,
          original_filename: spec.filename,
          status: 'published',
          sort_order: spec.order,
          tags: [
            rootName,
            'Vue与React',
            display(spec.parent.split('/').at(-1) || '学习路线'),
          ],
          description: excerpt,
          excerpt,
          reading_time: Math.max(
            1,
            Math.ceil(spec.content.replace(/\s/g, '').length / 500),
          ),
          file_size_bytes: Buffer.byteLength(spec.content),
          published_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (error) throw error
      assert(data.content === spec.content)
      docMap.set(spec.file, data)
    }
    // Compare every pre-existing row, not just the other roots' document counts.
    const [afterFolders, afterDocs] = await Promise.all([
      all('folders'),
      all('documents'),
    ])
    for (const [before, after] of [
      [folders, afterFolders],
      [rows, afterDocs],
    ]) {
      const byId = new Map(after.map((row) => [row.id, row]))
      for (const row of before)
        assert.equal(
          digest(byId.get(row.id)),
          digest(row),
          `Pre-existing row changed: ${row.id}`,
        )
    }
    console.log(
      `Preserved ${folders.length} existing folders and ${rows.length} existing documents`,
    )
  }
  if (docMap.size === documents.length) {
    const records = documents.map((spec) => {
      const chain = []
      let key = spec.parent
      while (key !== null) {
        chain.unshift(folderMap.get(key).slug)
        key = folderSpecs.find((folder) => folder.key === key).parent
      }
      const row = docMap.get(spec.file)
      return {
        file: spec.file,
        id: row.id,
        intro: spec.content.split(/\n\s*\n/)[1],
        url: `https://knowledge.damnatiox.com/knowledge/${chain.join('/')}/${row.slug}`,
      }
    })
    await fs.mkdir('.tools/frontend', { recursive: true })
    await fs.writeFile(
      '.tools/frontend/publication.json',
      JSON.stringify(records, null, 2),
    )
  }
  console.log(
    JSON.stringify(
      {
        mode: apply ? 'published' : verify ? 'verified' : 'dry-run',
        folders: folderSpecs.length,
        documents: documents.length,
        missingFolders: missingFolders.length,
        missingDocuments: missingDocs.length,
      },
      null,
      2,
    ),
  )
} finally {
  if (signedIn) await db.auth.signOut({ scope: 'local' })
}
