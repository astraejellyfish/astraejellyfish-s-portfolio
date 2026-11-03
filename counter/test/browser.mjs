import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { Miniflare } from 'miniflare'

const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8')
const origin = 'http://127.0.0.1:5175'
const mf = new Miniflare({
  modules: true, script: source, compatibilityDate: '2026-07-01', host: '127.0.0.1', port: 8789,
  durableObjects: { VISITS: { className: 'VisitCounter', useSQLite: true } },
  bindings: { ALLOWED_ORIGINS: origin, SESSION_TIMEOUT_MS: '5000' },
})
await mf.ready
const executable = process.env.BROWSER_BIN || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const profile = fileURLToPath(new URL(`../.wrangler/browser-${Date.now()}/`, import.meta.url))
const browser = spawn(executable, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding', '--remote-debugging-port=9346', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' })
const pause = duration => new Promise(resolve => setTimeout(resolve, duration))
let socket
try {
  let version
  for (let attempt = 0; attempt < 60; attempt++) {
    try { version = await (await fetch('http://127.0.0.1:9346/json/version')).json(); break } catch { await pause(200) }
  }
  assert.ok(version, 'Browser started')
  socket = new WebSocket(version.webSocketDebuggerUrl)
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
  let id = 0
  const pending = new Map()
  const loaded = new Map()
  const failures = []
  const visits = []
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.method === 'Page.loadEventFired') loaded.get(message.sessionId)?.()
    if (message.method === 'Runtime.exceptionThrown') failures.push(message.params.exceptionDetails.text)
    if (message.method === 'Network.requestWillBeSent' && message.params.request.url.startsWith('http://127.0.0.1:8789')) {
      visits.push({ session: message.sessionId, url: message.params.request.url, method: message.params.request.method })
    }
    if (!message.id) return
    const request = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) request.reject(message.error)
    else request.resolve(message.result)
  })
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const requestId = ++id
    pending.set(requestId, { resolve, reject })
    socket.send(JSON.stringify({ id: requestId, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
  async function page() {
    const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
    for (const method of ['Page.enable', 'Runtime.enable', 'Network.enable']) await send(method, {}, sessionId)
    const evaluate = async expression => {
      const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }, sessionId)
      if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text)
      return response.result.value
    }
    const wait = expression => evaluate(`new Promise((resolve,reject)=>{const begin=performance.now();function check(){if(${expression})resolve(true);else if(performance.now()-begin>12000)reject(new Error('UI timeout'));else setTimeout(check,25)}check()})`)
    const navigate = async path => {
      const completion = new Promise(resolve => loaded.set(sessionId, resolve))
      await send('Page.navigate', { url: `${origin}${path}` }, sessionId)
      await completion
      loaded.delete(sessionId)
      await wait(`!!document.querySelector('#status') || !!document.querySelector('.welcome-screen')`)
    }
    return { sessionId, targetId, evaluate, wait, navigate }
  }
  const first = await page()
  const second = await page()
  await Promise.all([first.navigate('/tests/visitor-counter.html'), second.navigate('/tests/visitor-counter.html')])
  await Promise.all([first.wait(`document.querySelector('#status').textContent==='1'`), second.wait(`document.querySelector('#status').textContent==='1'`)])
  const identifiers = await Promise.all([first.evaluate('window.readBrowserId()'), second.evaluate('window.readBrowserId()')])
  assert.equal(identifiers[0], identifiers[1], 'Concurrent tabs create one browser identifier')
  assert.equal(await first.evaluate('document.querySelector(".counter-digits").textContent'), '0001')
  assert.equal(visits.filter(request => request.session === first.sessionId && request.url.endsWith('/visit') && request.method === 'POST').length, 1, 'Strict Mode sends one initial visit check')
  await first.navigate('/tests/visitor-counter.html')
  await first.wait(`document.querySelector('#status').textContent==='1'`)
  assert.equal(await first.evaluate('window.readBrowserId()'), identifiers[0], 'Reload retains identifier')
  await first.evaluate('window.counter.checkVisit();window.counter.checkVisit();undefined')
  await first.wait(`document.querySelector('#status').textContent==='1'`)
  console.log('PASS: real IndexedDB race across concurrent tabs, one initial Strict Mode request, reload deduplication, shared browser ID, zero padding')

  await send('Page.bringToFront', {}, first.sessionId)
  await pause(5400)
  const beforeAction = visits.filter(request => request.url.endsWith('/visit') && request.method === 'POST').length
  const point = await first.evaluate(`(()=>{const rect=document.querySelector('#action').getBoundingClientRect();return {x:rect.x+rect.width/2,y:rect.y+rect.height/2}})()`)
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point }, first.sessionId)
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point }, first.sessionId)
  await pause(350)
  assert.equal(await first.evaluate('document.querySelector("#status").textContent'), '1', 'Interaction cannot create a new visit after expiry')
  assert.equal(visits.filter(request => request.url.endsWith('/visit') && request.method === 'POST').length, beforeAction)
  await send('Page.bringToFront', {}, second.sessionId)
  await second.wait(`document.querySelector('#status').textContent==='2'`)
  await second.navigate('/tests/visitor-counter.html')
  await second.wait(`document.querySelector('#status').textContent==='2'`)
  console.log('PASS: inactivity expiry, expired-session interaction never increments, returning to a tab starts exactly one new visit, refresh remains deduplicated')

  const blocked = await page()
  await blocked.navigate('/tests/visitor-counter.html?blocked=1')
  await pause(300)
  assert.equal(await blocked.evaluate('document.querySelector(".counter-digits").textContent'), '----')
  assert.equal(visits.filter(request => request.session === blocked.sessionId).length, 0, 'Blocked storage sends no count request')
  const unavailable = await page()
  await unavailable.navigate('/tests/visitor-counter.html?unavailable=1')
  await pause(300)
  assert.equal(await unavailable.evaluate('document.querySelector(".counter-digits").textContent'), '----')

  const application = await page()
  await application.navigate('/')
  assert.equal(await application.evaluate('document.querySelector(".counter-digits").textContent'), '----', 'Ordinary localhost application is disabled')
  await application.evaluate('document.querySelector(".welcome-exit").click()')
  await application.wait(`document.querySelector('.welcome-exit span').textContent==='STAY?'`)
  await application.evaluate('document.querySelector(".welcome-exit").click()')
  await application.wait(`document.querySelector('.welcome-exit span').textContent==='EXIT'`)
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }, application.sessionId)
  await application.evaluate('document.querySelector(".welcome-start").click()')
  await application.wait(`!document.querySelector('.welcome-screen')`)
  await application.evaluate('document.querySelector(".portfolio-title").click()')
  await application.wait(`!!document.querySelector('.welcome-screen')`)
  assert.equal(visits.filter(request => request.session === application.sessionId).length, 0, 'Local app and all welcome interactions never contact a counter')
  assert.deepEqual(failures, [], 'No browser runtime exceptions')
  console.log('PASS: blocked-storage and service-error fallback, original app controls, localhost exclusion, no runtime errors')
  await send('Browser.close')
} finally {
  socket?.close()
  browser.kill()
  await mf.dispose()
}
