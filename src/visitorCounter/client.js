import { getBrowserId } from './identity.js'

export function getCounterSettings({ enabled, production, origin, endpoint }) {
  if (enabled !== 'true' || !production || origin !== 'https://astraee.studio') return null
  try {
    const url = new URL(endpoint)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null
    if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return null
    return { endpoint: url.origin }
  } catch { return null }
}

export function createVisitCounter({ endpoint, browser = window, identify = () => getBrowserId(browser), activityInterval = 60000 }) {
  const listeners = new Set()
  const clock = () => browser.performance.now()
  let snapshot = null
  let started = false
  let disposed = false
  let active = false
  let identity
  let queue = Promise.resolve()
  let pendingVisit = null
  let activityTimer = null
  let lastActivity = -Infinity
  let lastSent = -Infinity
  let lastEntry = -Infinity
  let abortRequest

  function publish(value) {
    if (disposed || snapshot === value) return
    snapshot = value
    for (const listener of listeners) listener()
  }

  function identifyOnce() {
    if (!identity) identity = Promise.resolve().then(identify).catch(error => { identity = null; throw error })
    return identity
  }

  function enqueue(path) {
    const task = queue.then(async () => {
      if (disposed) return null
      let timeout
      try {
        const browserId = await identifyOnce()
        if (disposed) return null
        const age = path === '/activity' ? Math.max(0, Math.floor(clock() - lastActivity)) : 0
        if (age > 300000) return null // A suspended/background timer is not new activity.
        const controller = new AbortController()
        abortRequest = controller
        timeout = browser.setTimeout(() => controller.abort(), 5000)
        lastSent = clock()
        const response = await browser.fetch(`${endpoint}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ browserId, ...(path === '/activity' ? { activityAgeMs: age } : {}) }),
          credentials: 'omit',
          referrerPolicy: 'no-referrer',
          cache: 'no-store',
          keepalive: true,
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('Counter unavailable')
        const data = await response.json()
        if (!data || typeof data.count !== 'string' || !/^(0|[1-9]\d*)$/.test(data.count) || typeof data.active !== 'boolean') {
          throw new Error('Invalid counter response')
        }
        active = data.active
        publish(data.count)
        return data
      } catch {
        active = false
        publish(null)
        return null
      } finally {
        browser.clearTimeout(timeout)
        abortRequest = null
      }
    })
    queue = task.then(() => undefined)
    return task
  }

  function checkVisit() {
    if (disposed) return Promise.resolve(null)
    if (!pendingVisit) {
      lastEntry = clock()
      pendingVisit = enqueue('/visit').finally(() => { pendingVisit = null })
    }
    return pendingVisit
  }

  function flushActivity() {
    if (activityTimer !== null) browser.clearTimeout(activityTimer)
    activityTimer = null
    if (!active || !Number.isFinite(lastActivity)) return Promise.resolve(null)
    return enqueue('/activity')
  }

  function onActivity(event) {
    if (!event.isTrusted || browser.document.hidden || !active) return
    lastActivity = clock()
    if (activityTimer === null) {
      activityTimer = browser.setTimeout(flushActivity, Math.max(0, activityInterval - (clock() - lastSent)))
    }
  }

  function onReturn() {
    if (!browser.document.hidden && clock() - lastEntry >= 1000) void checkVisit()
  }

  function onVisibility() {
    if (browser.document.hidden) {
      if (activityTimer !== null) void flushActivity()
    } else onReturn()
  }

  function onPageShow(event) { if (event.persisted) onReturn() }
  function onPageHide() { if (activityTimer !== null) void flushActivity() }

  function start() {
    if (started || disposed) return pendingVisit || Promise.resolve(null)
    started = true
    browser.addEventListener('focus', onReturn)
    browser.addEventListener('pageshow', onPageShow)
    browser.addEventListener('pagehide', onPageHide)
    browser.document.addEventListener('visibilitychange', onVisibility)
    for (const type of ['pointerdown', 'pointermove', 'keydown', 'scroll']) {
      browser.document.addEventListener(type, onActivity, { passive: true })
    }
    return checkVisit()
  }

  function dispose() {
    disposed = true
    if (activityTimer !== null) browser.clearTimeout(activityTimer)
    abortRequest?.abort()
    browser.removeEventListener('focus', onReturn)
    browser.removeEventListener('pageshow', onPageShow)
    browser.removeEventListener('pagehide', onPageHide)
    browser.document.removeEventListener('visibilitychange', onVisibility)
    for (const type of ['pointerdown', 'pointermove', 'keydown', 'scroll']) browser.document.removeEventListener(type, onActivity)
    listeners.clear()
  }

  return {
    start, checkVisit, flushActivity, dispose,
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      void start()
      return () => listeners.delete(listener)
    },
  }
}
