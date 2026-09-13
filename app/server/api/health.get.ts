import { defineEventHandler, setResponseHeader, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  // Each probe must reach the database, not a browser/CDN cache.
  setResponseHeader(event, 'Cache-Control', 'no-store, max-age=0')
  setResponseHeader(event, 'CDN-Cache-Control', 'no-store')
  setResponseHeader(event, 'Vercel-CDN-Cache-Control', 'no-store')

  try {
    const { supabaseUrl, supabasePublishableKey } = useRuntimeConfig(event).public
    if (!supabaseUrl || !supabasePublishableKey)
      throw new Error('Missing configuration')

    // Read one public folder ID through PostgREST (RLS remains in force).
    // An empty table is healthy too; the SELECT still executes in Postgres.
    const url = new URL('/rest/v1/folders', supabaseUrl)
    url.searchParams.set('select', 'id')
    url.searchParams.set('limit', '1')
    const response = await fetch(url, {
      headers: { apikey: supabasePublishableKey, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error('Database request failed')
    const rows: unknown = await response.json()
    if (!Array.isArray(rows)) throw new Error('Unexpected database response')

    return { status: 'ok', database: 'ok' }
  } catch {
    // Never expose database responses, configuration or credentials publicly.
    setResponseStatus(event, 503)
    return { status: 'error', database: 'unavailable' }
  }
})
