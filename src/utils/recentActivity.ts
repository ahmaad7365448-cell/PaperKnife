export interface ActivityEntry {
  id: string
  name: string
  tool: string
  timestamp: number
  size: number
  resultUrl?: string
  buffer?: Uint8Array
  /** 🎯 ID في السحابة (إن وُجد) */
  cloudId?: string
  /** 🎯 هل تمت مزامنته؟ */
  synced?: boolean
}

// Cap per-entry persisted bytes so history can't balloon IndexedDB
export const MAX_HISTORY_BUFFER_BYTES = 25 * 1024 * 1024

const DB_NAME = 'PaperKnifeDB'
const STORE_NAME = 'activity'
const DB_VERSION = 1

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ==========================================================
// 🎯 إضافة نشاط (محلي + سحابي)
// ==========================================================
export const addActivity = async (entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
  const db = await openDB()
  const activity: ActivityEntry = {
    ...entry,
    buffer: entry.buffer && entry.buffer.byteLength > MAX_HISTORY_BUFFER_BYTES ? undefined : entry.buffer,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  }

  // 1️⃣ حفظ محلياً
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).add(activity)
    tx.oncomplete = () => resolve()
    tx.onerror = () => resolve()
  })

  // 2️⃣ 🎯 مزامنة مع السحابة (لا يعطّل العملية إذا فشل)
  try {
    const { syncActivityToCloud } = await import('./historySync')
    const synced = await syncActivityToCloud({
      tool: activity.tool,
      name: activity.name,
      size: activity.size,
    })
    if (synced) {
      // تحديث الحقل synced في IndexedDB
      try {
        const activityWithSync = { ...activity, synced: true }
        await new Promise<void>((resolve) => {
          const tx = db.transaction(STORE_NAME, 'readwrite')
          tx.objectStore(STORE_NAME).put(activityWithSync)
          tx.oncomplete = () => resolve()
          tx.onerror = () => resolve()
        })
      } catch { /* ignore */ }
    }
  } catch (err) {
    console.warn('[recentActivity] Cloud sync failed (ignored):', err)
  }

  // Cleanup: respect user setting (separate tx, no race)
  try {
    const limitSetting = localStorage.getItem('historyLimit')
    const limit = limitSetting === '999' ? 999999 : parseInt(limitSetting || '10')

    const all = await new Promise<ActivityEntry[]>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => resolve(req.result as ActivityEntry[])
      req.onerror = () => resolve([])
    })
    if (all.length > limit) {
      const sorted = all.sort((a, b) => b.timestamp - a.timestamp)
      const oldest = sorted.slice(limit)
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        oldest.forEach(o => store.delete(o.id))
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      })
    }
  } catch { /* ignore cleanup errors */ }
  try { db.close() } catch { /* ignore */ }
}

// ==========================================================
// 🎯 جلب النشاط (محلي فقط - للسجل الجانبي)
// ==========================================================
export const getRecentActivity = async (limit = 10): Promise<ActivityEntry[]> => {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)

  return new Promise((resolve) => {
    const request = store.getAll()
    request.onsuccess = () => {
      const results = request.result as ActivityEntry[]
      try { db.close() } catch { /* ignore */ }
      resolve(results.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit))
    }
    request.onerror = () => {
      try { db.close() } catch { /* ignore */ }
      resolve([])
    }
  })
}

// ==========================================================
// 🎯 حذف الكل (محلي + سحابي)
// ==========================================================
export const clearActivity = async () => {
  // 1️⃣ محلي
  const db = await openDB()
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    tx.oncomplete = () => { try { db.close() } catch { /* ignore */ }; resolve() }
    tx.onerror = () => { try { db.close() } catch { /* ignore */ }; resolve() }
  })

  // 2️⃣ 🎯 سحابي
  try {
    const { clearCloudHistory } = await import('./historySync')
    await clearCloudHistory()
  } catch (err) {
    console.warn('[recentActivity] Cloud clear failed (ignored):', err)
  }
}

// ==========================================================
// 🎯 حذف عنصر واحد (محلي + سحابي)
// ==========================================================
export const deleteActivity = async (id: string) => {
  const db = await openDB()

  // احصل على العنصر أولاً لمعرفة cloudId
  const item = await new Promise<ActivityEntry | null>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(id)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => resolve(null)
  })

  // 1️⃣ حذف محلي
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => { try { db.close() } catch { /* ignore */ }; resolve() }
    tx.onerror = () => { try { db.close() } catch { /* ignore */ }; resolve() }
  })

  // 2️⃣ 🎯 حذف من السحابة (إن وُجد cloudId)
  if (item?.cloudId) {
    try {
      const { deleteCloudHistory } = await import('./historySync')
      await deleteCloudHistory(item.cloudId)
    } catch (err) {
      console.warn('[recentActivity] Cloud delete failed (ignored):', err)
    }
  }
}

// ==========================================================
// باقي الدوال (بدون تغيير)
// ==========================================================
export const updateActivityName = async (resultUrl: string, name: string): Promise<boolean> => {
  const db = await openDB()
  try {
    const all = await new Promise<ActivityEntry[]>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).getAll()
      req.onsuccess = () => resolve(req.result as ActivityEntry[])
      req.onerror = () => resolve([])
    })
    const match = all.find(a => a.resultUrl === resultUrl)
    if (!match) return false
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put({ ...match, name })
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })
    return true
  } finally {
    try { db.close() } catch { /* ignore */ }
  }
}

export const updateLastSeen = () => {
  localStorage.setItem('lastSeen', String(Date.now()))
}

export const getLastSeen = () => {
  return Number(localStorage.getItem('lastSeen') || '0')
}