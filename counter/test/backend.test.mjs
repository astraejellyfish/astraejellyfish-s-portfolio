import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile, mkdir, mkdtemp } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { Miniflare } from 'miniflare'

const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8')
const script = `${source}
export class TestVisitCounter extends VisitCounter {
  async fetch() {
    return Response.json({
      sessions: this.ctx.storage.sql.exec('SELECT * FROM sessions').toArray(),
      total: this.ctx.storage.sql.exec('SELECT CAST(visits AS TEXT) AS count FROM totals').one().count,
      columns: this.ctx.storage.sql.exec('PRAGMA table_info(sessions)').toArray().map(column => column.name),
    });
  }
}`
const origin = 'https://astraee.studio'
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

function runtime(options = {}) {
  return new Miniflare({
    modules: true, script, compatibilityDate: '2026-07-01',
    durableObjects: { VISITS: { className: 'TestVisitCounter', useSQLite: true } },
    bindings: { ALLOWED_ORIGINS: origin, SESSION_TIMEOUT_MS: '1800000', ...options.bindings },
    ...(options.persist ? { durableObjectsPersist: options.persist } : {}),
  })
}

function send(mf, id, path = '/visit', extra = {}, headers = {}) {
  return mf.dispatchFetch(`https://counter.example${path}`, {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ browserId: id, ...extra }),
  })
}

async function check(mf, id, path = '/visit', extra) {
  const response = await send(mf, id, path, extra)
  assert.equal(response.status, 200, await response.clone().text())
  return response.json()
}

async function inspect(mf) {
  const namespace = await mf.getDurableObjectNamespace('VISITS')
  return (await namespace.getByName('astraee.studio').fetch('https://internal.test/inspect')).json()
}

test('30-minute sessions, refresh/new-tab deduplication, and concurrent increments', async t => {
  const mf = runtime()
  t.after(() => mf.dispose())
  const id = crypto.randomUUID()
  const before = Date.now()
  const firstResponse = await send(mf, id)
  assert.equal(firstResponse.status, 200)
  assert.equal(firstResponse.headers.get('Access-Control-Allow-Origin'), origin)
  assert.equal(firstResponse.headers.get('Access-Control-Allow-Credentials'), null)
  assert.equal(firstResponse.headers.get('Cache-Control'), 'no-store')
  const first = await firstResponse.json()
  assert.equal(first.count, '1')
  assert.equal(first.counted, true)
  assert.equal(first.active, true)
  assert.ok(first.expiresAt >= before + 1800000 && first.expiresAt <= Date.now() + 1800000)
  const duplicates = await Promise.all(Array.from({ length: 30 }, () => check(mf, id)))
  assert.ok(duplicates.every(result => result.count === '1' && result.counted === false))
  const fresh = crypto.randomUUID()
  const simultaneous = await Promise.all(Array.from({ length: 40 }, () => check(mf, fresh)))
  assert.equal(simultaneous.filter(result => result.counted).length, 1)
  assert.ok(simultaneous.every(result => result.count === '2'))
  const visitors = await Promise.all(Array.from({ length: 25 }, () => check(mf, crypto.randomUUID())))
  assert.ok(visitors.every(result => result.counted))
  assert.equal((await check(mf, id)).count, '27', 'No lost increments across different browsers')
  const state = await inspect(mf)
  assert.deepEqual(state.columns, ['browser_hash', 'expires_at'])
  assert.ok(state.sessions.every(row => /^[0-9a-f]{64}$/.test(row.browser_hash)))
  assert.ok(!JSON.stringify(state).includes(id), 'Raw browser ID is not stored')
})

test('activity extends active sessions but cannot create or resurrect visits', async t => {
  const mf = runtime({ bindings: { SESSION_TIMEOUT_MS: '1200' } })
  t.after(() => mf.dispose())
  const id = crypto.randomUUID()
  assert.deepEqual(await check(mf, id, '/activity'), { count: '0', counted: false, active: false, expiresAt: null })
  const first = await check(mf, id)
  await pause(700)
  const touch = await check(mf, id, '/activity')
  assert.equal(touch.counted, false)
  assert.ok(touch.expiresAt > first.expiresAt)
  const outOfOrder = await check(mf, id, '/activity', { activityAgeMs: 600 })
  assert.ok(outOfOrder.expiresAt >= touch.expiresAt, 'Delayed activity never shortens expiry')
  await pause(700)
  assert.equal((await check(mf, id)).counted, false, 'Renewed session survives original expiry')
  await pause(1350)
  const expiredTouch = await check(mf, id, '/activity')
  assert.equal(expiredTouch.count, '1')
  assert.equal(expiredTouch.active, false)
  assert.equal(expiredTouch.counted, false, 'Even activity after expiry cannot count a visit')
  const returning = await Promise.all(Array.from({ length: 20 }, () => check(mf, id)))
  assert.equal(returning.filter(result => result.counted).length, 1)
  assert.ok(returning.every(result => result.count === '2'))
})

test('expired identifiers are removed by an alarm without deleting the total', async t => {
  const mf = runtime({ bindings: { SESSION_TIMEOUT_MS: '150' } })
  t.after(() => mf.dispose())
  await check(mf, crypto.randomUUID())
  await pause(1700)
  const state = await inspect(mf)
  assert.deepEqual(state.sessions, [])
  assert.equal(state.total, '1')
})

test('total persists through local Cloudflare runtime restarts', async () => {
  const directory = fileURLToPath(new URL('../.wrangler/', import.meta.url))
  await mkdir(directory, { recursive: true })
  const persist = await mkdtemp(join(directory, 'persistence-test-'))
  const id = crypto.randomUUID()
  let mf = runtime({ persist })
  try { assert.equal((await check(mf, id)).count, '1') } finally { await mf.dispose() }
  mf = runtime({ persist })
  try {
    assert.equal((await check(mf, id)).count, '1')
    assert.equal((await check(mf, crypto.randomUUID())).count, '2')
  } finally { await mf.dispose() }
})

test('production CORS, methods, body validation, and service errors', async t => {
  const mf = runtime()
  t.after(() => mf.dispose())
  const id = crypto.randomUUID()
  for (const badOrigin of ['http://localhost:5173', 'https://preview.example', 'https://evil.example']) {
    const denied = await send(mf, id, '/visit', {}, { Origin: badOrigin })
    assert.equal(denied.status, 403)
    assert.equal(denied.headers.get('Access-Control-Allow-Origin'), null)
  }
  const options = await mf.dispatchFetch('https://counter.example/visit', { method: 'OPTIONS', headers: { Origin: origin } })
  assert.equal(options.status, 204)
  assert.equal(options.headers.get('Access-Control-Allow-Origin'), origin)
  assert.equal((await mf.dispatchFetch('https://counter.example/visit', { headers: { Origin: origin } })).status, 405)
  assert.equal((await send(mf, id, '/unknown')).status, 404)
  assert.equal((await send(mf, id, '/visit', {}, { 'Content-Type': 'text/plain' })).status, 415)
  assert.equal((await send(mf, 'bad-id')).status, 400)
  assert.equal((await send(mf, id, '/activity', { activityAgeMs: -1 })).status, 400)
  assert.equal((await send(mf, id, '/activity', { activityAgeMs: 300001 })).status, 400)
  const invalidJson = await mf.dispatchFetch('https://counter.example/visit', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{' })
  assert.equal(invalidJson.status, 400)
  assert.equal((await send(mf, id, '/visit', { padding: 'x'.repeat(1500) })).status, 413)
  assert.equal((await check(mf, id)).count, '1', 'Rejected requests never incremented')
  const unavailable = new Miniflare({ modules: true, script: source, compatibilityDate: '2026-07-01', bindings: { ALLOWED_ORIGINS: origin } })
  t.after(() => unavailable.dispose())
  const failure = await send(unavailable, id)
  assert.equal(failure.status, 503)
  assert.deepEqual(await failure.json(), { error: 'Counter unavailable' })
  assert.equal(failure.headers.get('Access-Control-Allow-Origin'), origin)
})
