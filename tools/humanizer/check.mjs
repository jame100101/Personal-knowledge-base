import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({ html: true })
const sorted = (items) => [...items].sort()

// Parse Markdown instead of searching code examples for Chinese style markers.
export function inspect(source) {
  const lines = source.split('\n')
  const protectedParts = {
    blocks: [],
    inlineCode: [],
    links: [],
    headings: [],
    tables: [],
    quotes: [],
    html: [],
    frontmatter: [],
    numbers: [],
  }
  const front = source.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)?.[0]
  if (front) protectedParts.frontmatter.push(front)
  const input = front
    ? front.replace(/[^\n]/g, ' ') + source.slice(front.length)
    : source
  const tokens = markdown.parse(input, {})
  const prose = []
  let tableDepth = 0,
    quoteDepth = 0,
    heading = false
  const raw = (token) => lines.slice(token.map[0], token.map[1]).join('\n')
  for (const token of tokens) {
    if (token.type === 'fence' || token.type === 'code_block')
      protectedParts.blocks.push(raw(token))
    if (token.type === 'table_open') {
      tableDepth++
      protectedParts.tables.push(raw(token))
    }
    if (token.type === 'table_close') tableDepth--
    if (token.type === 'blockquote_open') {
      if (!quoteDepth) protectedParts.quotes.push(raw(token))
      quoteDepth++
    }
    if (token.type === 'blockquote_close') quoteDepth--
    if (token.type === 'heading_open') {
      heading = true
      protectedParts.headings.push(raw(token))
    }
    if (token.type === 'heading_close') heading = false
    if (token.type === 'html_block') protectedParts.html.push(token.content)
    if (token.type !== 'inline') continue
    const text = []
    const visit = (children) => {
      for (const child of children || []) {
        if (child.type === 'code_inline') protectedParts.inlineCode.push(child.content)
        if (child.type === 'link_open')
          protectedParts.links.push([
            'link',
            child.attrGet('href'),
            child.attrGet('title'),
          ])
        if (child.type === 'image')
          protectedParts.links.push([
            'image',
            child.attrGet('src'),
            child.attrGet('title'),
            child.content,
          ])
        if (child.type === 'html_inline') protectedParts.html.push(child.content)
        if (child.type === 'text') text.push(child.content)
        if (child.type === 'softbreak' || child.type === 'hardbreak') text.push('\n')
        if (child.children) visit(child.children)
      }
    }
    visit(token.children)
    const visible = text.join('')
    protectedParts.numbers.push(...(visible.match(/\d+(?:[./:%-]\d+)*/g) || []))
    if (!tableDepth && !quoteDepth && !heading)
      prose.push({ line: token.map[0] + 1, text: visible })
  }
  // Order of headings, blocks and table rows is significant; inline terms may move within prose.
  protectedParts.inlineCode = sorted(protectedParts.inlineCode)
  protectedParts.numbers = sorted(protectedParts.numbers)
  protectedParts.links = sorted(
    protectedParts.links.map((link) => JSON.stringify(link)),
  )
  return { protectedParts, prose }
}

export function compareProtected(before, after) {
  const old = inspect(before).protectedParts,
    current = inspect(after).protectedParts
  return Object.keys(old).filter(
    (key) => JSON.stringify(old[key]) !== JSON.stringify(current[key]),
  )
}

export function styleFindings(source) {
  const { prose } = inspect(source)
  const findings = []
  const repetitive = prose.filter(({ text }) => text.startsWith('这里容易混淆的是：'))
  if (repetitive.length > 1)
    for (const { line } of repetitive)
      findings.push({
        line,
        rule: 'repeated-lead',
        suggestion: '同一提示语反复出现；可直接说明限制，保留后面的事实和否定。',
      })
  for (const { line, text } of prose) {
    if (/(赋能|开启新篇章|革命性变化|希望这对你有帮助|希望对您有帮助)/.test(text))
      findings.push({
        line,
        rule: 'stock-phrase',
        suggestion: '核对是否有具体含义；引用或确有用途的表达可以保留。',
      })
    if (
      text
        .split(/[。！？\n]/)
        .some((sentence) => (sentence.match(/[\p{Script=Han}]/gu) || []).length > 160)
    )
      findings.push({
        line,
        rule: 'long-sentence',
        suggestion: '检查主语、条件和动作是否太多；按逻辑拆句，不删限定条件。',
      })
    const terms = new Set(text.match(/[A-Za-z][A-Za-z_-]{2,}/g) || [])
    if (terms.size >= 8 && (text.match(/[\p{Script=Han}]/gu) || []).length < 60)
      findings.push({
        line,
        rule: 'term-list',
        suggestion: '检查是否只是术语清单；正文可补充各项作用，索引和选型清单可保留。',
      })
  }
  return findings
}

async function main() {
  const args = process.argv.slice(2)
  const value = (name) => {
    const i = args.indexOf(name)
    if (i < 0) return undefined
    if (!args[i + 1] || args[i + 1].startsWith('--'))
      throw Error(`Missing ${name} value`)
    return args[i + 1]
  }
  const base = value('--base'),
    output = value('--json'),
    verify = args.includes('--verify')
  for (let i = 0; i < args.length; i++) {
    if (['--base', '--json'].includes(args[i])) {
      i++
      continue
    }
    if (args[i] !== '--verify') throw Error(`Unknown argument: ${args[i]}`)
  }
  if (verify && !base)
    throw Error(
      'Provide --base <reviewed Git commit> for protected-content verification',
    )
  const revision = base
    ? execFileSync(
        'git',
        ['rev-parse', '--verify', '--end-of-options', `${base}^{commit}`],
        { encoding: 'utf8' },
      ).trim()
    : undefined
  const files = execFileSync('git', ['ls-files', '-z', '--', 'content'], {
    encoding: 'utf8',
  })
    .split('\0')
    .filter((file) => file.endsWith('.md'))
  const articles = []
  for (const file of files) {
    const source = await fs.readFile(file, 'utf8')
    const before = revision
      ? execFileSync('git', ['show', `${revision}:${file}`], {
          encoding: 'utf8',
          maxBuffer: 8 * 1024 * 1024,
        })
      : undefined
    articles.push({
      file,
      changed: before === undefined ? null : before !== source,
      findings: styleFindings(source),
      protectedChanges: before === undefined ? null : compareProtected(before, source),
    })
  }
  const report = {
    base: revision,
    scanned: articles.length,
    changed: articles.filter((a) => a.changed).length,
    findings: articles.reduce((n, a) => n + a.findings.length, 0),
    protectionFailures: articles.filter((a) => a.protectedChanges?.length).length,
    note: 'Style findings are review hints, not an AI score. Protected-content checks do not prove semantic equivalence.',
    articles,
  }
  if (output) {
    await fs.mkdir(path.dirname(output), { recursive: true })
    await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n')
  }
  console.log(
    JSON.stringify(
      {
        scanned: report.scanned,
        changed: report.changed,
        findings: report.findings,
        protectionFailures: report.protectionFailures,
        report: output,
      },
      null,
      2,
    ),
  )
  if (!output)
    for (const a of articles) {
      for (const f of a.findings)
        console.log(`${a.file}:${f.line} [${f.rule}] ${f.suggestion}`)
      if (a.protectedChanges?.length)
        console.error(
          `${a.file}: protected content changed: ${a.protectedChanges.join(', ')}`,
        )
    }
  if (verify && report.protectionFailures) process.exitCode = 1
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  await main()
