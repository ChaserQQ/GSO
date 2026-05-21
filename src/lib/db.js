import { openDB } from 'idb'

const DB_NAME = 'gso-db'
const VERSION = 2

export async function getDB() {
  return openDB(DB_NAME, VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains('requests'))
        db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true })
      if (!db.objectStoreNames.contains('airports'))
        db.createObjectStore('airports', { keyPath: 'code' })
      if (!db.objectStoreNames.contains('patterns'))
        db.createObjectStore('patterns', { keyPath: 'id', autoIncrement: true })
      if (!db.objectStoreNames.contains('meta'))
        db.createObjectStore('meta')
    }
  })
}

export async function getAll(store) {
  const db = await getDB()
  return db.getAll(store)
}
export async function getOne(store, key) {
  const db = await getDB()
  return db.get(store, key)
}
export async function putOne(store, value) {
  const db = await getDB()
  return db.put(store, value)
}
export async function delOne(store, key) {
  const db = await getDB()
  return db.delete(store, key)
}
export async function clearStore(store) {
  const db = await getDB()
  return db.clear(store)
}

export async function exportAll() {
  const db = await getDB()
  const out = {}
  for (const name of ['requests','airports','patterns']) {
    out[name] = await db.getAll(name)
  }
  out.exportedAt = new Date().toISOString()
  return out
}

export async function importAll(data) {
  const db = await getDB()
  for (const name of ['requests','airports','patterns']) {
    if (!Array.isArray(data[name])) continue
    const tx = db.transaction(name, 'readwrite')
    for (const row of data[name]) {
      // 기존 키와 충돌 시 덮어쓰기
      await tx.store.put(row)
    }
    await tx.done
  }
}
