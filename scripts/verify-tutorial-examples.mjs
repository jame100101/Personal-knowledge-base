import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'

const temp = path.resolve('.tools/tutorial-checks')
await fs.mkdir(temp, { recursive: true })
async function article(folder, prefix) {
  const file = (await fs.readdir(folder)).find((name) => name.startsWith(prefix))
  assert(file, prefix)
  return fs.readFile(path.join(folder, file), 'utf8')
}
function blocks(text, language) {
  return [
    ...text.matchAll(
      new RegExp('```' + language + '[^\\n]*\\n([\\s\\S]*?)\\n```', 'g'),
    ),
  ].map((m) => m[1])
}
async function moduleOf(source, suffix = '') {
  const compiled = ts.transpileModule(source + '\n' + suffix, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
  return import(
    `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
  )
}
const language = 'content/语言基础/01-TypeScript语言基础'
const clientSource = blocks(await article(language, '17-'), 'typescript')
  .slice(0, 5)
  .join('\n')
const client = await moduleOf(clientSource)
assert.throws(() => client.loadConfig({ API_BASE_URL: 'https://example.com/v1/' }))
assert.throws(() => client.loadConfig({ API_BASE_URL: 'file:///tmp/' }))
for (const value of ['0', '-1', 'NaN', '2147483648', '1.5']) {
  assert.throws(() =>
    client.loadConfig({ API_BASE_URL: 'https://example.com', API_TIMEOUT_MS: value }),
  )
}
assert.equal(client.loadConfig({ API_BASE_URL: 'https://example.com' }).timeoutMs, 5000)
const raw = { id: 'u-1', name: 'Ada', roles: ['reader'] }
const parsed = client.parseUser(raw)
raw.roles.push('admin')
assert.deepEqual(parsed.roles, ['reader'])
assert.throws(() => client.parseUser({ ...raw, roles: [1] }))
const userClient = new client.UserClient(
  client.loadConfig({ API_BASE_URL: 'https://example.com' }),
)
for (const id of ['', '.', '..', 'a/b', 'x'.repeat(65)]) {
  assert.equal((await userClient.find(id)).error.kind, 'invalid-data')
}
const originalFetch = globalThis.fetch
const url = new URL('https://example.test/users/u-1')
async function requestWith(implementation, signal = new AbortController().signal) {
  globalThis.fetch = implementation
  return client.getJson(url, client.parseUser, signal)
}
try {
  assert.equal(
    (await requestWith(async () => new Response(JSON.stringify(raw)))).ok,
    true,
  )
  assert.equal(
    (await requestWith(async () => new Response('not json'))).error.kind,
    'invalid-data',
  )
  assert.equal(
    (await requestWith(async () => new Response('{}'))).error.kind,
    'invalid-data',
  )
  assert.equal(
    (await requestWith(async () => new Response('not found', { status: 404 }))).error
      .kind,
    'http',
  )
  assert.equal(
    (
      await requestWith(async () => {
        throw new TypeError('offline')
      })
    ).error.kind,
    'network',
  )
  assert.equal(
    (
      await requestWith(
        async () =>
          new Response(
            new ReadableStream({
              start(controller) {
                controller.error(new TypeError('stream disconnected'))
              },
            }),
          ),
      )
    ).error.kind,
    'network',
  )
  const cancelled = AbortSignal.abort()
  assert.equal(
    (
      await requestWith(async () => {
        throw cancelled.reason
      }, cancelled)
    ).error.kind,
    'cancelled',
  )
} finally {
  globalThis.fetch = originalFetch
}
const accountSource = blocks(await article(language, '09-'), 'typescript').find(
  (code) => code.includes('class Account'),
)
const { Account } = await moduleOf(accountSource, 'export { Account }')
for (const initial of [-1, NaN, Infinity, 0.5])
  assert.throws(() => new Account('a', initial))
const account = new Account('a', Number.MAX_SAFE_INTEGER)
assert.throws(() => account.deposit(1))
assert.throws(() => account.deposit(0.5))
const ageSource = blocks(await article(language, '14-'), 'typescript').find((code) =>
  code.includes('function parseAge'),
)
const { parseAge } = await moduleOf(ageSource, 'export { parseAge }')
for (const value of ['', ' ', '0x10', '1e2', '-1', '1.5', '9007199254740992'])
  assert.equal(parseAge(value).ok, false, value)
assert.deepEqual(parseAge(' 18 '), { ok: true, value: 18 })
const chooseSource = blocks(await article(language, '11-'), 'typescript').find((code) =>
  code.includes('function choose<'),
)
const busSource = blocks(await article(language, '12-'), 'typescript').find((code) =>
  code.includes('class EventBus'),
)
const typeTests = `${chooseSource}\n${busSource}
// @ts-expect-error An empty tuple cannot provide a first item.
choose([])
// @ts-expect-error The fallback cannot expand the choice domain.
choose(['red', 'green'] as const, 'blue')
const bus = new EventBus<Events>()
bus.emit('user:created', {id: 'u-1'})
// @ts-expect-error Literal event names must match their payload.
bus.emit('order:paid', {id: 'u-1'})
const key: keyof Events = Math.random() < 0.5 ? 'user:created' : 'order:paid'
// @ts-expect-error A union key cannot safely accept only one branch's payload.
bus.emit(key, {id: 'u-1'})
export {}
`
await fs.writeFile(path.join(temp, 'types.ts'), typeTests)
await fs.writeFile(path.join(temp, 'client.ts'), clientSource)
execFileSync(
  process.execPath,
  [
    'node_modules/typescript/bin/tsc',
    '--noEmit',
    '--strict',
    '--target',
    'ES2022',
    '--module',
    'ESNext',
    '--skipLibCheck',
    '--types',
    'node',
    path.join(temp, 'types.ts'),
    path.join(temp, 'client.ts'),
  ],
  { stdio: 'pipe' },
)
console.log(
  'TypeScript: actual tutorial snippets passed type rejection and runtime boundary checks',
)

const foundation = 'content/前端架构/00-从网页基础开始'
for (const [prefix, languageName, index, file] of [
  ['04-', 'html', 0, 'native.html'],
  ['05-', 'vue', 0, 'App.vue'],
  ['06-', 'jsx', 1, 'App.jsx'],
  ['06-', 'css', 0, 'style.css'],
]) {
  const code = blocks(await article(foundation, prefix), languageName)[index]
  assert.equal(
    (await fs.readFile(`examples/frontend/foundations/${file}`, 'utf8')).trim(),
    code.trim(),
    `Article and runnable file differ: ${file}`,
  )
}
console.log(
  'Frontend: article examples match all four runnable foundation files exactly',
)
const javaDir = 'content/Java开发/01-Java语言与核心API'
const java = process.env.TUTORIAL_JAVA || 'java'
for (const [prefix, className, expected] of [
  ['03-', 'AccountDemo', ['700', '余额不足', '700']],
  ['04-', 'PolymorphismDemo', ['2500', '1500']],
  [
    '06-',
    'ApiDemo',
    ['3.33', '0.01', 'false', 'true', '2026-01-15T17:00+08:00[Asia/Shanghai]'],
  ],
]) {
  const code = blocks(await article(javaDir, prefix), 'java').find((code) =>
    code.includes(`public class ${className}`),
  )
  const file = path.join(temp, `${className}.java`)
  await fs.writeFile(file, code)
  assert.deepEqual(
    execFileSync(java, [file], { encoding: 'utf8' }).trim().split(/\r?\n/),
    expected,
  )
}
console.log(
  'Java: three complete article programs ran successfully on the configured JDK',
)
