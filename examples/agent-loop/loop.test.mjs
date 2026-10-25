import test from 'node:test'
import assert from 'node:assert/strict'
import { runLoop } from './loop.mjs'

const call = (id = 'read-1', noteId = 'n1') => ({
  type: 'tool',
  id,
  name: 'read_note',
  input: { noteId },
})
const sequence =
  (...decisions) =>
  async () =>
    decisions.shift()
function fixture(overrides = {}) {
  let executions = 0
  const options = {
    goal: 'Read note n1',
    model: sequence(call(), { type: 'final', text: 'The note says hello.' }),
    authorize: async () => true,
    tools: new Map([
      [
        'read_note',
        {
          parse(input) {
            if (
              typeof input.noteId !== 'string' ||
              !/^n\d+$/.test(input.noteId) ||
              Object.keys(input).some((key) => key !== 'noteId')
            )
              throw Error('Bad note ID')
            return { noteId: input.noteId }
          },
          async execute() {
            executions++
            return 'hello'
          },
        },
      ],
    ]),
    ...overrides,
  }
  return { options, executions: () => executions }
}

test('tool output reaches the next model decision with the matching ID', async () => {
  const f = fixture()
  let turns = 0
  f.options.model = async (messages) => {
    if (++turns === 1) return call()
    assert.deepEqual(messages.at(-1), {
      role: 'tool',
      callId: 'read-1',
      result: { ok: true, value: 'hello' },
    })
    return { type: 'final', text: 'hello' }
  }
  assert.equal((await runLoop(f.options)).answer, 'hello')
  assert.equal(f.executions(), 1)
})

test('denied or malformed requests never reach the tool', async () => {
  for (const overrides of [
    { authorize: async () => false },
    { model: sequence(call('bad', 42), { type: 'final', text: 'Cannot read' }) },
  ]) {
    const f = fixture(overrides)
    const result = await runLoop(f.options)
    assert.equal(f.executions(), 0)
    assert.equal(result.messages.at(-1).result.ok, false)
  }
})

test('same call receipt is reused within a run, changed input is rejected', async () => {
  const f = fixture({ model: sequence(call(), call(), call('read-1', 'n2')) })
  assert.equal((await runLoop(f.options)).status, 'call_id_conflict')
  assert.equal(f.executions(), 1)
})

test('replayed results are not disclosed after permission is revoked', async () => {
  let approvals = 0
  const f = fixture({
    authorize: async () => ++approvals === 1,
    model: sequence(call(), call(), { type: 'final', text: 'Access revoked' }),
  })
  const result = await runLoop(f.options)
  assert.equal(result.messages.at(-1).result.error, 'permission_denied')
  assert.equal(f.executions(), 1)
})

test('an endless model cannot exceed the step budget', async () => {
  let decisions = 0
  const f = fixture({ maxSteps: 3, model: async () => call(String(++decisions)) })
  assert.equal((await runLoop(f.options)).status, 'budget_exhausted')
  assert.equal(decisions, 3)
})

test('cancellation during approval prevents the tool from starting', async () => {
  const controller = new AbortController()
  const f = fixture({
    signal: controller.signal,
    authorize: async () => {
      controller.abort()
      return true
    },
  })
  assert.equal((await runLoop(f.options)).status, 'cancelled')
  assert.equal(f.executions(), 0)
})

test('a stalled model releases the caller after its time budget', async () => {
  const f = fixture({ timeoutMs: 20, model: () => new Promise(() => {}) })
  assert.equal((await runLoop(f.options)).status, 'timed_out')
  assert.equal(f.executions(), 0)
})

test('a blocking callback cannot claim completion after the deadline', async () => {
  const f = fixture({
    timeoutMs: 10,
    model: () => {
      const stop = performance.now() + 25
      while (performance.now() < stop) {
        /* Deliberately blocks this toy runtime. */
      }
      return { type: 'final', text: 'too late' }
    },
  })
  assert.equal((await runLoop(f.options)).status, 'timed_out')
})

test('a tool timeout stops the loop without pretending the operation rolled back', async () => {
  const f = fixture({ timeoutMs: 20 })
  let started = false
  f.options.tools.get('read_note').execute = () => {
    started = true
    return new Promise(() => {})
  }
  const result = await runLoop(f.options)
  assert.equal(started, true)
  assert.equal(result.status, 'timed_out')
  assert.notEqual(result.messages.at(-1).role, 'tool')
})

test('tool errors become a bounded observation rather than leaking raw errors', async () => {
  const f = fixture()
  f.options.tools.get('read_note').execute = async () => {
    throw Error('private detail')
  }
  const result = await runLoop(f.options)
  assert.equal(result.messages.at(-1).result.error, 'tool_failed')
  assert.equal(JSON.stringify(result).includes('private detail'), false)
})
