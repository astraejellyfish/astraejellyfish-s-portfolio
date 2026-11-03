import { StrictMode, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import VisitorCounter from '../src/components/VisitorCounter.jsx'
import { createVisitCounter } from '../src/visitorCounter/client.js'
import { getBrowserId } from '../src/visitorCounter/identity.js'

// This fixture is outside Vite's production entry and is never included in dist.
const parameters = new URLSearchParams(location.search)
if (parameters.has('blocked')) Object.defineProperty(window, 'indexedDB', { get() { throw new Error('Storage restricted') } })
const endpoint = parameters.has('unavailable') ? 'http://127.0.0.1:8789/unavailable' : 'http://127.0.0.1:8789'
const counter = createVisitCounter({ endpoint, activityInterval: 150 })
window.counter = counter
window.readBrowserId = () => getBrowserId()

export function Fixture() {
  const count = useSyncExternalStore(counter.subscribe, counter.getSnapshot, () => null)
  return <>
    <VisitorCounter count={count} />
    <button type="button" id="action">EXIT / STAY?</button>
    <output id="status">{count === null ? '----' : count}</output>
  </>
}

createRoot(document.getElementById('root')).render(<StrictMode><Fixture /></StrictMode>)
