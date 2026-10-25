// Teaching runtime: one tool call per model response, no network or provider SDK.
function waitFor(operation, signal) {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason)
    signal.addEventListener('abort', abort, { once: true })
    Promise.resolve()
      .then(() => {
        signal.throwIfAborted()
        return operation(signal)
      })
      .then(resolve, reject)
      .finally(() => signal.removeEventListener('abort', abort))
  })
}

export async function runLoop({
  goal,
  model,
  tools,
  authorize,
  maxSteps = 6,
  timeoutMs = 2000,
  signal: externalSignal,
}) {
  if (
    !Number.isInteger(maxSteps) ||
    maxSteps < 1 ||
    maxSteps > 100 ||
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1 ||
    timeoutMs > 60_000
  )
    throw new Error('Invalid run budget')
  if (
    typeof goal !== 'string' ||
    typeof model !== 'function' ||
    !(tools instanceof Map) ||
    typeof authorize !== 'function'
  )
    throw new Error('Invalid run configuration')

  const deadline = performance.now() + timeoutMs
  const timerController = new AbortController()
  const timer = setTimeout(
    () => timerController.abort(new Error('Time budget exhausted')),
    timeoutMs,
  )
  const signal = externalSignal
    ? AbortSignal.any([externalSignal, timerController.signal])
    : timerController.signal
  const messages = [{ role: 'user', content: goal }]
  const receipts = new Map()
  const finish = (status, extra = {}) => ({ status, messages, ...extra })
  const checkBudget = () => {
    if (performance.now() >= deadline && !timerController.signal.aborted)
      timerController.abort(new Error('Time budget exhausted'))
    signal.throwIfAborted()
  }
  try {
    for (let step = 0; step < maxSteps; step++) {
      checkBudget()
      const decision = await waitFor((s) => model(structuredClone(messages), s), signal)
      checkBudget()
      if (!decision || typeof decision !== 'object') return finish('invalid_response')
      if (decision.type === 'final' && typeof decision.text === 'string')
        return finish('complete', { answer: decision.text })
      if (
        decision.type !== 'tool' ||
        typeof decision.id !== 'string' ||
        !decision.id ||
        typeof decision.name !== 'string' ||
        !decision.input ||
        typeof decision.input !== 'object' ||
        Array.isArray(decision.input)
      )
        return finish('invalid_response')

      // This toy protocol compares exact serialized input, not semantic equivalence.
      const fingerprint = JSON.stringify([decision.name, decision.input])
      const previous = receipts.get(decision.id)
      if (previous && previous.fingerprint !== fingerprint)
        return finish('call_id_conflict')
      messages.push({ role: 'assistant', call: structuredClone(decision) })
      const tool = tools.get(decision.name)
      let result
      if (!tool) result = { ok: false, error: 'unknown_tool' }
      else {
        let input
        try {
          input = tool.parse(decision.input)
        } catch {
          result = { ok: false, error: 'invalid_arguments' }
        }
        if (!result) {
          const allowed = await waitFor(
            (s) => authorize(decision.name, input, s),
            signal,
          )
          checkBudget()
          if (allowed !== true) result = { ok: false, error: 'permission_denied' }
          else if (previous) result = previous.result
          else {
            try {
              result = {
                ok: true,
                value: await waitFor((s) => tool.execute(input, s), signal),
              }
            } catch {
              signal.throwIfAborted()
              // Do not expose raw errors, credentials or tool internals to the model.
              result = { ok: false, error: 'tool_failed' }
            }
          }
        }
      }
      checkBudget()
      receipts.set(decision.id, { fingerprint, result: structuredClone(result) })
      messages.push({
        role: 'tool',
        callId: decision.id,
        result: structuredClone(result),
      })
    }
    return finish('budget_exhausted')
  } catch (error) {
    if (externalSignal?.aborted) return finish('cancelled')
    if (timerController.signal.aborted) return finish('timed_out')
    throw error
  } finally {
    clearTimeout(timer)
  }
}
