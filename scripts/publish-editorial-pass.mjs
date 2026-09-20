import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

process.loadEnvFile('.env.local')
const apply = process.argv.includes('--apply')
const verifyOnly = process.argv.includes('--verify')
if (apply && verifyOnly) throw new Error('Choose either --apply or --verify')
if (
  apply &&
  (!process.env.AGENT_SEED_ADMIN_EMAIL || !process.env.AGENT_SEED_ADMIN_PASSWORD)
) {
  throw new Error(
    'Publishing requires AGENT_SEED_ADMIN_EMAIL and AGENT_SEED_ADMIN_PASSWORD',
  )
}
const manifestFlag = process.argv.indexOf('--manifest')
const manifestPath =
  manifestFlag < 0
    ? 'scripts/editorial-pass-manifest.json'
    : process.argv[manifestFlag + 1]
if (!manifestPath || manifestPath.startsWith('--'))
  throw new Error('Missing --manifest path')
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
if (!/^[a-f0-9]{40}$/.test(manifest.base) || !Array.isArray(manifest.articles)) {
  throw new Error('Invalid publication manifest')
}
const uniquePaths = new Set(manifest.articles.map((article) => article.path))
if (uniquePaths.size !== manifest.articles.length)
  throw new Error('Duplicate manifest paths')
for (const file of uniquePaths) {
  if (
    typeof file !== 'string' ||
    !file.startsWith('content/') ||
    file.includes('..') ||
    !file.endsWith('.md')
  ) {
    throw new Error('Invalid article path')
  }
}
const normalize = (s) => s.replace(/\r\n/g, '\n').trim()
const db = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL,
  process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const { data: folders, error: folderError } = await db
  .from('folders')
  .select('id,parent_id,name,slug')
if (folderError) throw folderError
const rows = []
for (let start = 0; ; start += 500) {
  const { data, error } = await db
    .from('documents')
    .select('*')
    .eq('status', 'published')
    .order('id')
    .range(start, start + 499)
  if (error) throw error
  rows.push(...data)
  if (data.length < 500) break
}
function folderChain(id) {
  const chain = []
  const seen = new Set()
  while (id) {
    if (seen.has(id)) throw new Error('Folder cycle')
    seen.add(id)
    const folder = folders.find((f) => f.id === id)
    if (!folder) throw new Error(`Missing folder: ${id}`)
    chain.unshift(folder)
    id = folder.parent_id
  }
  return chain
}
const planned = []
const issues = []
for (const { path: file } of manifest.articles) {
  const content = await fs.readFile(file, 'utf8')
  const title = content.match(/^# (.+)$/m)?.[1]
  const matches = rows.filter(
    (row) => row.title === title && row.original_filename === path.basename(file),
  )
  if (matches.length !== 1) {
    issues.push(`Expected one published document: ${file} (${matches.length})`)
    continue
  }
  const row = matches[0]
  const chain = folderChain(row.folder_id)
  if (chain[0]?.name !== file.split('/')[1]) {
    issues.push(`Wrong root: ${file}`)
    continue
  }
  const baseline = execFileSync('git', ['show', `${manifest.base}:${file}`], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  })
  const same = normalize(row.content) === normalize(content)
  const reviewedHash = manifest.reviewedRemoteBaselines?.find(
    (entry) => entry.path === file,
  )?.sha256
  const reviewed =
    reviewedHash &&
    createHash('sha256').update(normalize(row.content)).digest('hex') === reviewedHash
  if (
    !same &&
    (verifyOnly || (!reviewed && normalize(row.content) !== normalize(baseline)))
  ) {
    issues.push(`Remote content needs review: ${file}`)
    continue
  }
  planned.push({
    row,
    content,
    file,
    same,
    url: `https://knowledge.damnatiox.com/knowledge/${chain.map((f) => f.slug).join('/')}/${row.slug}`,
  })
}
// All documents are checked before the first write; a remote edit is never overwritten.
if (issues.length) throw new Error(issues.join('\n'))
if (apply) {
  const { error } = await db.auth.signInWithPassword({
    email: process.env.AGENT_SEED_ADMIN_EMAIL,
    password: process.env.AGENT_SEED_ADMIN_PASSWORD,
  })
  if (error) throw error
  try {
    await fs.mkdir('.tools/content-backups', { recursive: true })
    const backup = `.tools/content-backups/editorial-${Date.now()}.json`
    await fs.writeFile(
      backup,
      JSON.stringify(
        planned.map(({ row }) => row),
        null,
        2,
      ),
    )
    console.log(`Backup: ${backup}`)
    let count = 0
    for (const { row, content, same } of planned) {
      if (same) continue
      const excerpt = content
        .split(/\r?\n\s*\r?\n/)[1]
        .replace(/[*`]/g, '')
        .trim()
        .slice(0, 220)
      const { data: saved, error: updateError } = await db
        .from('documents')
        .update({
          content,
          excerpt,
          description: excerpt,
          reading_time: Math.max(
            1,
            Math.ceil(content.replace(/\s+/g, '').length / 500),
          ),
          file_size_bytes: Buffer.byteLength(content),
        })
        .eq('id', row.id)
        .eq('updated_at', row.updated_at)
        .select('id,title,slug,folder_id,sort_order,content')
        .single()
      if (updateError) throw updateError
      for (const key of ['id', 'title', 'slug', 'folder_id', 'sort_order'])
        if (saved[key] !== row[key]) throw new Error(`Identity changed: ${key}`)
      if (saved.content !== content)
        throw new Error(`Content verification failed: ${row.id}`)
      if (++count % 25 === 0) console.log(`Published ${count} articles`)
    }
  } finally {
    await db.auth.signOut({ scope: 'local' })
  }
}
await fs.mkdir('.tools', { recursive: true })
await fs.writeFile(
  '.tools/editorial-publication.json',
  JSON.stringify(
    planned.map(({ file, row, url, content }) => ({
      file,
      id: row.id,
      url,
      intro: content.split(/\r?\n\s*\r?\n/)[1],
    })),
    null,
    2,
  ),
)
console.log(
  JSON.stringify(
    {
      mode: apply ? 'published' : verifyOnly ? 'verified' : 'dry-run',
      checked: planned.length,
      pendingAtStart: planned.filter((p) => !p.same).length,
    },
    null,
    2,
  ),
)
