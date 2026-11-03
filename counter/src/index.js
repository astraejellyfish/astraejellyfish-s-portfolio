import { DurableObject } from 'cloudflare:workers'

const BROWSER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_ACTIVITY_AGE_MS = 5 * 60 * 1000

function response(body, status, origin) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Vary': 'Origin',
      'X-Content-Type-Options': 'nosniff',
      ...(origin ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '600',
      } : {}),
    },
  })
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin')
    const allowed = (env.ALLOWED_ORIGINS || 'https://astraee.studio').split(',')
    if (!origin || !allowed.includes(origin)) return response({ error: 'Origin not allowed' }, 403)
    const path = new URL(request.url).pathname
    if (!['/visit', '/activity'].includes(path)) return response({ error: 'Not found' }, 404, origin)
    if (request.method === 'OPTIONS') return response(null, 204, origin)
    if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405, origin)
    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
      return response({ error: 'JSON required' }, 415, origin)
    }
    try {
      // Limit the stream itself: Content-Length alone is not a trustworthy limit.
      const reader = request.body?.getReader()
      if (!reader) return response({ error: 'Invalid body' }, 400, origin)
      const chunks = []
      let length = 0
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        length += value.byteLength
        if (length > 1024) {
          await reader.cancel()
          return response({ error: 'Body too large' }, 413, origin)
        }
        chunks.push(value)
      }
      const bytes = new Uint8Array(length)
      let offset = 0
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
      const data = JSON.parse(new TextDecoder().decode(bytes))
      if (!data || typeof data.browserId !== 'string' || !BROWSER_ID.test(data.browserId)) {
        return response({ error: 'Invalid browser identifier' }, 400, origin)
      }
      const age = path === '/activity' ? (data.activityAgeMs ?? 0) : 0
      if (!Number.isSafeInteger(age) || age < 0 || age > MAX_ACTIVITY_AGE_MS) {
        return response({ error: 'Invalid activity age' }, 400, origin)
      }
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data.browserId.toLowerCase()))
      const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
      const result = await env.VISITS.getByName('astraee.studio').checkSession(hash, path === '/visit', age)
      return response(result, 200, origin)
    } catch (error) {
      return response({ error: error instanceof SyntaxError ? 'Invalid JSON' : 'Counter unavailable' }, error instanceof SyntaxError ? 400 : 503, origin)
    }
  },
}

export class VisitCounter extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env)
    this.timeout = Number(env.SESSION_TIMEOUT_MS || 1800000)
    if (!Number.isSafeInteger(this.timeout) || this.timeout < 100 || this.timeout > 1800000) throw new Error('Invalid session timeout')
    ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS totals (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        visits INTEGER NOT NULL CHECK (typeof(visits) = 'integer' AND visits >= 0)
      );
      INSERT OR IGNORE INTO totals (id, visits) VALUES (1, 0);
      CREATE TABLE IF NOT EXISTS sessions (browser_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    `)
  }

  async checkSession(hash, canCreate, activityAgeMs = 0) {
    const now = Date.now()
    // No await inside this transaction: the check, increment, and renewal commit together.
    const result = this.ctx.storage.transactionSync(() => {
      const previous = this.ctx.storage.sql.exec('SELECT expires_at FROM sessions WHERE browser_hash = ?', hash).toArray()[0]
      const active = Boolean(previous && previous.expires_at > now)
      const counted = !active && canCreate
      let expiresAt = null
      if (counted) this.ctx.storage.sql.exec('UPDATE totals SET visits = visits + 1 WHERE id = 1')
      if (active || canCreate) {
        expiresAt = Math.max(active ? previous.expires_at : 0, now - activityAgeMs + this.timeout)
        this.ctx.storage.sql.exec(
          'INSERT INTO sessions (browser_hash, expires_at) VALUES (?, ?) ON CONFLICT(browser_hash) DO UPDATE SET expires_at = excluded.expires_at',
          hash, expiresAt,
        )
      }
      const { count } = this.ctx.storage.sql.exec('SELECT CAST(visits AS TEXT) AS count FROM totals WHERE id = 1').one()
      return { count, counted, active: active || canCreate, expiresAt }
    })
    await this.scheduleCleanup()
    return result
  }

  async scheduleCleanup() {
    const { next } = this.ctx.storage.sql.exec('SELECT MIN(expires_at) AS next FROM sessions').one()
    if (next === null) await this.ctx.storage.deleteAlarm()
    else await this.ctx.storage.setAlarm(Math.max(Date.now() + 1000, next))
  }

  async alarm() {
    this.ctx.storage.sql.exec('DELETE FROM sessions WHERE expires_at <= ?', Date.now())
    await this.scheduleCleanup()
  }
}
