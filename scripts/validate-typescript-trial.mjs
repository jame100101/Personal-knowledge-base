import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'

const root = path.resolve('content/语言基础/01-TypeScript语言基础')
const prefixes = ['01-', '02-', '03-', '08-']
const files = fs
  .readdirSync(root)
  .filter((name) => prefixes.some((prefix) => name.startsWith(prefix)))
const snippets = []
for (const file of files) {
  const markdown = fs.readFileSync(path.join(root, file), 'utf8')
  for (const [index, match] of [
    ...markdown.matchAll(/^```typescript\r?\n([\s\S]*?)^```/gm),
  ].entries()) {
    let code = match[1]
    if (code.includes('function parsePort('))
      code += `
for (const [input, expected] of [[" 8080 ", 8080], [443, 443], ["0001", 1]]) {
  if (parsePort(input) !== expected) throw new Error('parsePort valid input')
}
for (const input of [NaN, Infinity, null, '', '0', 0, 65536, 3.5, '1e3']) {
  let rejected = false
  try { parsePort(input) } catch { rejected = true }
  if (!rejected) throw new Error('parsePort invalid input')
}
`
    if (code.includes('function parseUser('))
      code += `
if (parseUser({ id: 'u-1' }).id !== 'u-1') throw new Error('parseUser valid input')
for (const input of [null, {}, { id: 123 }]) {
  let rejected = false
  try { parseUser(input) } catch { rejected = true }
  if (!rejected) throw new Error('parseUser invalid input')
}
`
    if (code.includes('function first<T>'))
      code += `
if (first<number>([]) !== undefined || first([95]) !== 95) throw new Error('first')
`
    if (code.includes('function format('))
      code += `
if (format(' Ada ') !== 'Ada' || format(3) !== '3.00' || typeof format(undefined) !== 'string') throw new Error('format')
`
    if (code.includes('const state = identity'))
      code += `
const literalCheck: "ready" = state
`
    if (code.includes('const command = tuple'))
      code += `
const tupleCheck: readonly ["git", "status"] = command
`
    snippets.push({
      file,
      index: index + 1,
      code: `${code}\nexport {}\n`,
      virtual: path.join(root, `trial-${snippets.length}.ts`),
    })
  }
}
const virtualFiles = new Map(snippets.map((item) => [item.virtual, item.code]))
virtualFiles.set(path.join(root, 'user.ts'), 'export interface User { id: string }')
const options = {
  strict: true,
  noUncheckedIndexedAccess: true,
  exactOptionalPropertyTypes: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  noEmit: true,
  types: ['node'],
  skipLibCheck: true,
}
const host = ts.createCompilerHost(options)
const originalRead = host.readFile.bind(host),
  originalExists = host.fileExists.bind(host)
host.readFile = (filename) =>
  virtualFiles.get(path.normalize(filename)) ?? originalRead(filename)
host.fileExists = (filename) =>
  virtualFiles.has(path.normalize(filename)) || originalExists(filename)
const program = ts.createProgram([...virtualFiles.keys()], options, host)
const diagnostics = ts.getPreEmitDiagnostics(program)
if (diagnostics.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => process.cwd(),
      getCanonicalFileName: (name) => name,
      getNewLine: () => '\n',
    }),
  )
  process.exit(1)
}
for (const item of snippets) {
  const output = ts.transpileModule(item.code, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText
  const logs = []
  vm.runInNewContext(
    output,
    {
      exports: {},
      console: { log: (...values) => logs.push(values) },
      process: { env: {} },
    },
    { timeout: 1000, filename: `${item.file}#${item.index}` },
  )
  await Promise.resolve()
}
console.log(
  JSON.stringify(
    {
      compiler: ts.version,
      articles: files.length,
      typechecked: snippets.length,
      executed: snippets.length,
      assertions:
        'parsePort, parseUser, first, format, literal inference, tuple inference',
    },
    null,
    2,
  ),
)
