import { useSyncExternalStore } from 'react'
import { createVisitCounter, getCounterSettings } from '../visitorCounter/client.js'

const documentKey = Symbol.for('astraee.session-visitor-counter.v1')

function getCounter() {
  const settings = getCounterSettings({
    enabled: import.meta.env.VITE_VISITOR_COUNTER_ENABLED,
    endpoint: import.meta.env.VITE_VISITOR_COUNTER_URL,
    production: import.meta.env.PROD,
    origin: window.location.origin,
  })
  if (!settings) return null
  // Survives Strict Mode, welcome remounts, and hot module replacement.
  if (window[documentKey]?.endpoint !== settings.endpoint) {
    window[documentKey]?.counter.dispose()
    window[documentKey] = { endpoint: settings.endpoint, counter: createVisitCounter(settings) }
  }
  return window[documentKey].counter
}

const subscribe = listener => getCounter()?.subscribe(listener) || (() => {})
const getSnapshot = () => getCounter()?.getSnapshot() ?? null

export default function useVisitorCount() {
  return useSyncExternalStore(subscribe, getSnapshot, () => null)
}
