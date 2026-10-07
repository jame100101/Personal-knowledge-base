import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  rootSequence,
  rootOrder,
  folderOrder,
  documentOrder,
} from './learning-order.mjs'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const catalog = JSON.parse(
  await fs.readFile(path.join(root, 'app/data/chapter-overviews.json'), 'utf8'),
)
const bySource = new Map(catalog.map((c) => [c.sourceDirectory, c]))
const fallbackOrder = (name) => Number(name.match(/^\d+/)?.[0] || 100) * 10
function chapterOrder(c) {
  const [, area, ...parts] = c.sourceDirectory.split('/')
  return parts.length
    ? folderOrder(area, parts.join('/'), fallbackOrder(parts.at(-1)))
    : rootOrder(area)
}
function flow(c) {
  const nodes = c.modules.map(
    (label, i) => `  N${i + 1}["${String(i + 1).padStart(2, '0')} ${label}"]`,
  )
  if (c.mode === 'choices')
    return `flowchart LR\n  C["按项目需要选择"]\n${nodes.join('\n')}\n${c.modules.map((_, i) => `  C --> N${i + 1}`).join('\n')}`
  return `flowchart LR\n${nodes.join('\n')}\n  ${c.modules.map((_, i) => `N${i + 1}`).join(' --> ')}`
}
await fs.mkdir(path.join(root, 'docs/chapters'), { recursive: true })
for (const c of catalog) {
  const [, area, ...parts] = c.sourceDirectory.split('/')
  const entries = []
  for (const item of await fs.readdir(path.join(root, c.sourceDirectory), {
    withFileTypes: true,
  })) {
    const source = `${c.sourceDirectory}/${item.name}`
    if (item.isDirectory() && bySource.has(source)) {
      const child = bySource.get(source)
      entries.push({
        title: child.title,
        href: `${child.id}.md`,
        order: chapterOrder(child),
        type: '章节',
      })
    } else if (item.isFile() && item.name.endsWith('.md')) {
      const text = await fs.readFile(path.join(root, source), 'utf8')
      entries.push({
        title: text.match(/^# (.+)$/m)?.[1] || item.name,
        href: '../../' + source,
        order: documentOrder(
          area,
          parts.join('/'),
          item.name,
          fallbackOrder(item.name),
        ),
        type: '文章',
      })
    }
  }
  entries.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, 'zh-CN'))
  const alt = `${c.title}概览：${c.modules.join('、')}`
  const doc = `# ${c.title}\n\n![${alt}](../../app/public${c.image})\n\n${c.summary}\n\n## 学习路线\n\n\`\`\`mermaid\n${flow(c)}\n\`\`\`\n\n${c.mode === 'choices' ? '各分支是按需选择的方向，不表示必须依次完成。' : '箭头表示本章概念的推荐学习顺序，不表示实际系统只允许单向运行。框架与方案对照中的选项可以按项目需要选择。'}\n\n## 本章核心模块\n\n${c.modules.map((m, i) => `${i + 1}. **${m}**`).join('\n')}\n\n## 按课程顺序阅读\n\n${entries.map((e, i) => `${i + 1}. [${e.title}](<${e.href}>) · ${e.type}`).join('\n')}\n\n[返回全部章节](README.md)\n`
  await fs.writeFile(path.join(root, 'docs/chapters', c.id + '.md'), doc)
}
const lines = [
  '# 章节概览与学习路线',
  '',
  '按现有课程结构组织的 71 个章节入口。每章提供概览图、可编辑的 Mermaid 学习路线及原文阅读链接；排序沿用课程配置，不按图片文件名重新排列。',
  '',
]
for (const area of rootSequence) {
  const rootChapter = catalog.find((c) => c.sourceDirectory === `content/${area}`)
  lines.push(`## ${area}`, '', `[本栏目总览](${rootChapter.id}.md)`, '')
  const append = (parent) => {
    const children = catalog
      .filter((c) => path.posix.dirname(c.sourceDirectory) === parent)
      .sort((a, b) => chapterOrder(a) - chapterOrder(b))
    for (const c of children) {
      const level = c.sourceDirectory.split('/').length - 3
      lines.push(`${'  '.repeat(level)}- [${c.title}](${c.id}.md)`)
      append(c.sourceDirectory)
    }
  }
  append(`content/${area}`)
  lines.push('')
}
await fs.writeFile(path.join(root, 'docs/chapters/README.md'), lines.join('\n'))
console.log(`Generated ${catalog.length} chapter documents and one index`)
