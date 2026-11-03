import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createVisitCounter, getCounterSettings } from '../../src/visitorCounter/client.js'

class Events {
  listeners = new Map()
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type).add(listener)
  }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener) }
  emit(type, event = {}) { for (const listener of this.listeners.get(type) || []) listener(event) }
}

function browser() {
  const runtime = new Events()
  const requests = []
  runtime.document = Object.assign(new Events(), { hidden: false })
  runtime.performance = { now: () => performance.now() }
  runtime.setTimeout = setTimeout
  runtime.clearTimeout = clearTimeout
  runtime.fetch = async (url, options) => {
    requests.push({ url, options })
    return Response.json({ count: '42', counted: false, active: true, expiresAt: Date.now() + 1800000 })
  }
  return { runtime, requests }
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const endpoint = 'https://counter.example'

test('production settings exclude dev, previews, localhost, disabled and invalid configuration', () => {
  const good = { enabled: 'true', production: true, origin: 'https://astraee.studio', endpoint }
  assert.deepEqual(getCounterSettings(good), { endpoint })
  for (const override of [
    { enabled: 'false' }, { production: false }, { origin: 'http://localhost:5173' },
    { origin: 'https://preview.example' }, { endpoint: '' }, { endpoint: 'http://counter.example' },
    { endpoint: 'https://user:secret@counter.example' }, { endpoint: 'https://counter.example?key=secret' },
    { endpoint: 'https://127.0.0.1' },
  ]) assert.equal(getCounterSettings({ ...good, ...override }), null)
})

test('Strict Mode subscriptions and concurrent entry checks share one request and ID', async t => {
  const { runtime, requests } = browser()
  let identities = 0
  const id = crypto.randomUUID()
  const counter = createVisitCounter({ endpoint, browser: runtime, identify: async () => { identities++; return id } })
  t.after(() => counter.dispose())
  const unsubscribe = counter.subscribe(() => {})
  unsubscribe()
  counter.subscribe(() => {})
  const results = await Promise.all(Array.from({ length: 20 }, () => counter.checkVisit()))
  assert.equal(requests.length, 1)
  assert.equal(identities, 1)
  assert.ok(results.every(result => result.count === '42'))
  assert.equal(counter.getSnapshot(), '42')
  assert.equal(JSON.parse(requests[0].options.body).browserId, id)
  assert.equal(requests[0].options.credentials, 'omit')
  assert.equal(requests[0].options.referrerPolicy, 'no-referrer')
})

test('only real visible activity touches a session; idle timers and welcome clicks never start visits', async t => {
  const { runtime, requests } = browser()
  const counter = createVisitCounter({ endpoint, browser: runtime, identify: async () => crypto.randomUUID(), activityInterval: 15 })
  t.after(() => counter.dispose())
  await counter.start()
  await pause(30)
  assert.equal(requests.length, 1, 'Idle page has no heartbeat')
  runtime.document.emit('pointerdown', { isTrusted: false })
  runtime.document.hidden = true
  runtime.document.emit('scroll', { isTrusted: true })
  await pause(25)
  assert.equal(requests.length, 1)
  runtime.document.hidden = false
  for (let index = 0; index < 30; index++) runtime.document.emit('pointerdown', { isTrusted: true })
  await pause(25)
  assert.equal(requests.length, 2)
  assert.ok(requests[1].url.endsWith('/activity'))
  assert.ok(JSON.parse(requests[1].options.body).activityAgeMs >= 0)
  assert.equal(requests.filter(request => request.url.endsWith('/visit')).length, 1)
  await pause(35)
  assert.equal(requests.length, 2, 'Activity sends no recurring heartbeat')
})

test('returning to a tab checks the visit; DOM focus and normal activity do not', async t => {
  const { runtime, requests } = browser()
  let clock = 0
  runtime.performance.now = () => clock
  const counter = createVisitCounter({ endpoint, browser: runtime, identify: async () => crypto.randomUUID() })
  t.after(() => counter.dispose())
  await counter.start()
  runtime.emit('focus')
  await pause(10)
  assert.equal(requests.length, 1, 'Initial focus is coalesced')
  clock = 1800001
  runtime.document.emit('visibilitychange')
  runtime.emit('focus')
  await counter.checkVisit()
  assert.equal(requests.length, 2, 'Visibility and focus share one check')
  runtime.document.emit('focusin', { isTrusted: true })
  runtime.document.emit('pointerdown', { isTrusted: true })
  assert.equal(requests.filter(request => request.url.endsWith('/visit')).length, 2)
})

test('storage refusal never invents an ephemeral per-tab identity or sends an increment', async t => {
  const { runtime, requests } = browser()
  const counter = createVisitCounter({ endpoint, browser: runtime, identify: async () => { throw new Error('Storage denied') } })
  t.after(() => counter.dispose())
  assert.equal(await counter.start(), null)
  assert.equal(counter.getSnapshot(), null)
  assert.equal(requests.length, 0)
})

test('network failures, rejected responses and recovery retain the browser identity', async t => {
  const { runtime, requests } = browser()
  const id = crypto.randomUUID()
  let identities = 0
  const counter = createVisitCounter({ endpoint, browser: runtime, identify: async () => { identities++; return id } })
  t.after(() => counter.dispose())
  await counter.start()
  runtime.fetch = async () => { throw new Error('Offline') }
  assert.equal(await counter.checkVisit(), null)
  assert.equal(counter.getSnapshot(), null, 'Unavailable display, not cached/fabricated total')
  runtime.fetch = async () => Response.json({ count: 'made up', active: true })
  assert.equal(await counter.checkVisit(), null)
  runtime.fetch = async (url, options) => {
    requests.push({ url, options })
    return Response.json({ count: '43', active: true })
  }
  await counter.checkVisit()
  assert.equal(counter.getSnapshot(), '43')
  assert.equal(identities, 1)
  assert.ok(requests.every(request => JSON.parse(request.options.body).browserId === id))
})
