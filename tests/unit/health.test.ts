import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import handler from '../../app/server/api/health.get'

const mocks = vi.hoisted(() => ({
  config: vi.fn(),
  header: vi.fn(),
  status: vi.fn(),
}))
vi.mock('h3', () => ({
  defineEventHandler: (handler: unknown) => handler,
  setResponseHeader: mocks.header,
  setResponseStatus: mocks.status,
}))

describe('database health endpoint', () => {
  const request = vi.fn()
  const event = {} as Parameters<typeof handler>[0]
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', request)
    vi.stubGlobal('useRuntimeConfig', mocks.config)
    mocks.config.mockReturnValue({
      public: {
        supabaseUrl: 'https://fixture.supabase.co',
        supabasePublishableKey: 'public-fixture-key',
      },
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('executes a fresh bounded database read on every request, including empty tables', async () => {
    request.mockResolvedValue({ ok: true, json: async () => [] })
    expect(await handler(event)).toEqual({ status: 'ok', database: 'ok' })
    await handler(event)
    expect(request).toHaveBeenCalledTimes(2)
    const [url, options] = request.mock.calls[0]!
    expect(url.href).toBe(
      'https://fixture.supabase.co/rest/v1/folders?select=id&limit=1',
    )
    expect(options.cache).toBe('no-store')
    expect(options.headers.apikey).toBe('public-fixture-key')
    expect(options.signal).toBeDefined()
    expect(mocks.header).toHaveBeenCalledWith(
      event,
      'Vercel-CDN-Cache-Control',
      'no-store',
    )
    expect(mocks.status).not.toHaveBeenCalled()
  })

  it.each(['http', 'network', 'timeout', 'json', 'shape', 'config'])(
    'returns 503 for %s failure without exposing details',
    async (failure) => {
      request.mockResolvedValue({ ok: true, json: async () => [] })
      if (failure === 'http') request.mockResolvedValue({ ok: false })
      if (failure === 'network' || failure === 'timeout')
        request.mockRejectedValue(new Error('private detail'))
      if (failure === 'json')
        request.mockResolvedValue({
          ok: true,
          json: async () => {
            throw new Error('private detail')
          },
        })
      if (failure === 'shape')
        request.mockResolvedValue({ ok: true, json: async () => ({}) })
      if (failure === 'config') mocks.config.mockReturnValue({ public: {} })
      expect(await handler(event)).toEqual({ status: 'error', database: 'unavailable' })
      expect(mocks.status).toHaveBeenCalledWith(event, 503)
      if (failure === 'config') expect(request).not.toHaveBeenCalled()
    },
  )
})
