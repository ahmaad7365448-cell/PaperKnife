import { supabase } from '../supabaseClient'

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
// 🟢 🎯 دالة الحفظ الذكية المباشرة بجدول tool_history في Supabase
// ==========================================================
export const logToolActivity = async (
  toolTitle: string,
  fileName?: string,
  fileSize?: number
) => {
  if (!toolTitle) return
  try {
    let userId: string | undefined = undefined
    try {
      const { data } = await supabase.auth.getSession()
      userId = data.session?.user?.id
    } catch {
      /* ignore auth fetch errors */
    }

    // 1️⃣ المحاولة الأولى: المسميات القياسية (tool_name / file_name / file_size)
    const primaryPayload: Record<string, any> = {
      tool_name: toolTitle,
      file_name: fileName || toolTitle,
      file_size: fileSize || 0,
    }
    if (userId) primaryPayload.user_id = userId

    const { error: err1 } = await supabase.from('tool_history').insert([primaryPayload])
    if (!err1) return

    // 2️⃣ المحاولة الثانية: مسميات بديلة (tool / name / size)
    const secondaryPayload: Record<string, any> = {
      tool: toolTitle,
      name: fileName || toolTitle,
      size: fileSize || 0,
    }
    if (userId) secondaryPayload.user_id = userId

    const { error: err2 } = await supabase.from('tool_history').insert([secondaryPayload])
    if (!err2) return

    // 3️⃣ المحاولة الثالثة: المسمى المختصر (tool / file_name)
    const fallbackPayload: Record<string, any> = {
      tool: toolTitle,
      file_name: fileName || toolTitle,
    }
    if (userId) fallbackPayload.user_id = userId

    try {
      await supabase.from('tool_history').insert([fallbackPayload])
    } catch {
      /* ignore fallback errors */
    }

  } catch (err) {
    // إخفاء أخطاء الاتصال لضمان استمرارية واجهة المستخدم
  }
}

// ==========================================================
// 🎯 إضافة نشاط (محلي IndexedDB + سحابي Supabase)
// ==========================================================
export const addActivity = async (entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
  try {
    const db = await openDB()
    const activity: ActivityEntry = {
      ...entry,
      buffer: entry.buffer && entry.buffer.byteLength > MAX_HISTORY_BUFFER_BYTES ? undefined : entry.buffer,
      id: Math.random().toString(36).substring(2, 11),
      timestamp: Date.now()
    }

    // 1️⃣ حفظ محلياً في IndexedDB
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).add(activity)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    })

    // 2️⃣ 🟢 إرسال كامل بيانات العملية لـ Supabase للظهور في لوحة التحكم
    await logToolActivity(activity.tool, activity.name, activity.size)

    // 3️⃣ 🎯 مزامنة المزامنة الحسابية (إن وُجدت)
    try {
      const { syncActivityToCloud } = await import('./historySync')
      const synced = await syncActivityToCloud({
        tool: activity.tool,
        name: activity.name,
        size: activity.size,
      })
      if (synced) {
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
      console.warn('[recentActivity] Cloud sync skipped:', err)
    }

    // تنظيف السجل المحلي حسب الحدود المحددة
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
    } catch { /* ignore */ }

    try { db.close() } catch { /* ignore */ }
  } catch (err) {
    console.error('[recentActivity] Error adding activity:', err)
  }
}

// ==========================================================
// 🎯 جلب النشاط (محلي فقط - للسجل الجانبي)
// ==========================================================
export const getRecentActivity = async (limit = 10): Promise<ActivityEntry[]> => {
  try {
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
  } catch {
    return []
  }
}

// ==========================================================
// 🎯 حذف الكل (محلي + سحابي)
// ==========================================================
export const clearActivity = async () => {
  try {
    const db = await openDB()
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).clear()
      tx.oncomplete = () => { try { db.close() } catch { /* ignore */ }; resolve() }
      tx.onerror = () => { try { db.close() } catch { /* ignore */ }; resolve() }
    })

    try {
      const { clearCloudHistory } = await import('./historySync')
      await clearCloudHistory()
    } catch { /* ignore */ }
  } catch { /* ignore */ }
}

// ==========================================================
// 🎯 حذف عنصر واحد (محلي + سحابي)
// ==========================================================
export const deleteActivity = async (id: string) => {
  try {
    const db = await openDB()

    const item = await new Promise<ActivityEntry | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(id)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => resolve(null)
    })

    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(id)
      tx.oncomplete = () => { try { db.close() } catch { /* ignore */ }; resolve() }
      tx.onerror = () => { try { db.close() } catch { /* ignore */ }; resolve() }
    })

    if (item?.cloudId) {
      try {
        const { deleteCloudHistory } = await import('./historySync')
        await deleteCloudHistory(item.cloudId)
      } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

export const updateActivityName = async (resultUrl: string, name: string): Promise<boolean> => {
  try {
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
  } catch {
    return false
  }
}

export const updateLastSeen = () => {
  localStorage.setItem('lastSeen', String(Date.now()))
}

export const getLastSeen = () => {
  return Number(localStorage.getItem('lastSeen') || '0')
}