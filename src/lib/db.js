import { openDB } from 'idb'

const DB_NAME = 'gso-db'
const DB_VERSION = 2

export const db = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      const reqStore = db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true })
      reqStore.createIndex('bookingId', 'bookingId')
      reqStore.createIndex('depDate', 'depDate')
      reqStore.createIndex('status', 'status')
      reqStore.createIndex('pattern', 'pattern')

      db.createObjectStore('airports', { keyPath: 'code' })
      db.createObjectStore('adms', { keyPath: 'id', autoIncrement: true })
      db.createObjectStore('meta', { keyPath: 'key' })
    }
    if (oldVersion < 2) {
      db.createObjectStore('patterns', { keyPath: 'id', autoIncrement: true })
    }
  }
})

// Generic
export async function all(store) {
  return (await db).getAll(store)
}
export async function get(store, key) {
  return (await db).get(store, key)
}
export async function put(store, value) {
  return (await db).put(store, value)
}
export async function del(store, key) {
  return (await db).delete(store, key)
}
export async function clear(store) {
  return (await db).clear(store)
}

// Export/Import
export async function exportAll() {
  const d = await db
  const data = {}
  for (const name of ['requests', 'airports', 'adms', 'patterns', 'meta']) {
    if (d.objectStoreNames.contains(name)) {
      data[name] = await d.getAll(name)
    }
  }
  return { exportedAt: new Date().toISOString(), version: DB_VERSION, data }
}

export async function importAll(payload, { merge = true } = {}) {
  const d = await db
  const data = payload.data || payload
  for (const name of ['airports', 'patterns', 'requests', 'adms', 'meta']) {
    if (!data[name]) continue
    const tx = d.transaction(name, 'readwrite')
    if (!merge) await tx.store.clear()
    for (const item of data[name]) {
      await tx.store.put(item)
    }
    await tx.done
  }
}
