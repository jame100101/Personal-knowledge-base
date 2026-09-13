import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

process.loadEnvFile('.env.local')
const apply = process.argv.includes('--apply')
const root = 'content/语言基础/01-TypeScript语言基础'
const files = (await fs.readdir(root)).filter((name) =>
  ['01-', '02-', '03-', '08-'].some((prefix) => name.startsWith(prefix)),
)
const db = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL,
  process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const normalize = (text) => text.replace(/\r\n/g, '\n').trim()
const { data: folders, error: folderError } = await db
  .from('folders')
  .select('id,parent_id,name,slug')
if (folderError) throw folderError
const rootFolder = folders.find(
  (folder) => folder.name === '语言基础' && folder.parent_id === null,
)
const folder = folders.find(
  (folder) =>
    folder.name === 'TypeScript语言基础' && folder.parent_id === rootFolder?.id,
)
if (!folder) throw new Error('TypeScript folder not found')
const { data: rows, error } = await db
  .from('documents')
  .select('*')
  .eq('folder_id', folder.id)
  .eq('status', 'published')
if (error) throw error
const planned = []
for (const filename of files) {
  const candidates = rows.filter((row) => row.original_filename === filename)
  if (candidates.length !== 1)
    throw new Error(`Expected exactly one document: ${filename}`)
  const row = candidates[0]
  const relative = `${root}/${filename}`
  const content = await fs.readFile(relative, 'utf8')
  const previous = execFileSync(
    'git',
    ['show', `${process.env.TRIAL_BASE_REF || 'HEAD'}:${relative}`],
    { encoding: 'utf8' },
  )
  if (
    normalize(row.content) !== normalize(previous) &&
    normalize(row.content) !== normalize(content)
  )
    throw new Error(`Remote edits need review before publishing: ${filename}`)
  if (row.title !== content.match(/^# (.+)$/m)?.[1])
    throw new Error(`Title changed: ${filename}`)
  planned.push({ row, content, filename })
}
if (apply) {
  const { error: authError } = await db.auth.signInWithPassword({
    email: process.env.AGENT_SEED_ADMIN_EMAIL,
    password: process.env.AGENT_SEED_ADMIN_PASSWORD,
  })
  if (authError) throw authError
  try {
    await fs.mkdir('.tools/content-backups', { recursive: true })
    const backup = path.join(
      '.tools/content-backups',
      `typescript-trial-backup-${Date.now()}.json`,
    )
    await fs.writeFile(
      backup,
      JSON.stringify(
        planned.map((item) => item.row),
        null,
        2,
      ),
    )
    for (const { row, content, filename } of planned) {
      if (normalize(row.content) === normalize(content)) continue
      const excerpt = content
        .replace(/^# .+\r?\n/, '')
        .split(/^## /m)[0]
        .replace(/[*`]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220)
      const { data: saved, error: updateError } = await db
        .from('documents')
        .update({
          content,
          description: excerpt,
          excerpt,
          reading_time: Math.max(
            1,
            Math.ceil(content.replace(/\s+/g, '').length / 500),
          ),
          file_size_bytes: Buffer.byteLength(content, 'utf8'),
        })
        .eq('id', row.id)
        .eq('updated_at', row.updated_at)
        .select('id,slug,title,sort_order,folder_id,content')
        .single()
      if (updateError) throw updateError
      if (
        saved.content !== content ||
        saved.slug !== row.slug ||
        saved.folder_id !== row.folder_id ||
        saved.sort_order !== row.sort_order
      )
        throw new Error(`Verification failed: ${filename}`)
    }
    console.log(`Backup: ${backup}`)
  } finally {
    await db.auth.signOut({ scope: 'local' })
  }
}
console.log(
  JSON.stringify(
    {
      mode: apply ? 'published' : 'dry-run',
      articles: planned.map(({ row, filename }) => ({
        filename,
        id: row.id,
        url: `https://knowledge.damnatiox.com/knowledge/${rootFolder.slug}/${folder.slug}/${row.slug}`,
      })),
    },
    null,
    2,
  ),
)
