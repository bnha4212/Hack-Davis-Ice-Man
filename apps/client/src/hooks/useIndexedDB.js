const DB_NAME = 'iceman'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('pins')) db.createObjectStore('pins', { keyPath: 'id', autoIncrement: true })
      if (!db.objectStoreNames.contains('rights')) db.createObjectStore('rights', { keyPath: 'id' })
    }

    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

export async function savePins(pins) {
  const db = await openDB()
  const tx = db.transaction('pins', 'readwrite')
  const store = tx.objectStore('pins')
  store.clear()
  pins.forEach((pin) => store.add(pin))
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve
    tx.onerror = (e) => reject(e.target.error)
  })
}

export async function getPins() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pins', 'readonly')
    const req = tx.objectStore('pins').getAll()
    req.onsuccess = (e) => resolve(e.target.result)
    req.onerror = (e) => reject(e.target.error)
  })
}

export async function saveRights(text) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rights', 'readwrite')
    tx.objectStore('rights').put({ id: 'main', text })
    tx.oncomplete = resolve
    tx.onerror = (e) => reject(e.target.error)
  })
}

export async function getRights() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rights', 'readonly')
    const req = tx.objectStore('rights').get('main')
    req.onsuccess = (e) => resolve(e.target.result?.text ?? null)
    req.onerror = (e) => reject(e.target.error)
  })
}
