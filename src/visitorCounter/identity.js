const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// A read/write IndexedDB transaction serializes first-time ID creation across tabs.
// Only this random ID is stored locally; the visit total and expiry stay on the server.
export function getBrowserId(browser = window) {
  return new Promise((resolve, reject) => {
    let database
    let settled = false
    const timeout = browser.setTimeout(() => finish(new Error('Browser storage unavailable')), 2500)
    function finish(error, value) {
      if (settled) return
      settled = true
      browser.clearTimeout(timeout)
      database?.close()
      if (error) reject(error)
      else resolve(value)
    }
    try {
      if (!browser.indexedDB || !browser.crypto?.randomUUID) throw new Error('Browser storage unavailable')
      const request = browser.indexedDB.open('astraee-visit-counter', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('identity')
      request.onerror = () => finish(new Error('Browser storage unavailable'))
      request.onblocked = () => finish(new Error('Browser storage blocked'))
      request.onsuccess = () => {
        database = request.result
        if (settled) { database.close(); return }
        database.onversionchange = () => database.close()
        try {
          const transaction = database.transaction('identity', 'readwrite')
          const store = transaction.objectStore('identity')
          const read = store.get('browser-id')
          let id
          read.onsuccess = () => {
            try {
              id = typeof read.result === 'string' && ID.test(read.result) ? read.result : browser.crypto.randomUUID()
              if (id !== read.result) store.put(id, 'browser-id')
            } catch { transaction.abort() }
          }
          transaction.oncomplete = () => finish(null, id)
          transaction.onerror = transaction.onabort = () => finish(new Error('Browser storage unavailable'))
        } catch { finish(new Error('Browser storage unavailable')) }
      }
    } catch { finish(new Error('Browser storage unavailable')) }
  })
}
