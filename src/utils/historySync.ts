/**
 * PaperKnife - مزامنة السجل مع Supabase
 * تحفظ العمليات في السحابة لتراها على كل أجهزتك
 */

import { supabase } from '../supabaseClient'

export interface CloudHistoryEntry {
  id: string
  user_id: string
  tool_name: string
  file_name: string
  file_size: number
  status: string
  created_at: string
}

/**
 * 🎯 إضافة عملية جديدة للسحابة
 */
export async function syncActivityToCloud(entry: {
  tool: string
  name: string
  size: number
}): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // المستخدم غير مسجّل — لا نزامن
      return false
    }

    const { error } = await supabase.from('tool_history').insert([{
      user_id: user.id,
      tool_name: entry.tool,
      file_name: entry.name,
      file_size: entry.size || 0,
      status: 'completed',
    }])

    if (error) {
      console.warn('[historySync] sync failed:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[historySync] exception:', err)
    return false
  }
}

/**
 * 🎯 جلب السجل من السحابة
 */
export async function fetchCloudHistory(limit = 100): Promise<CloudHistoryEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('tool_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('[historySync] fetch failed:', error.message)
      return []
    }
    return (data || []) as CloudHistoryEntry[]
  } catch (err) {
    console.warn('[historySync] exception:', err)
    return []
  }
}

/**
 * 🎯 حذف عنصر واحد من السحابة
 */
export async function deleteCloudHistory(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('tool_history')
      .delete()
      .eq('id', id)

    if (error) {
      console.warn('[historySync] delete failed:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[historySync] exception:', err)
    return false
  }
}

/**
 * 🎯 حذف كل السجل من السحابة
 */
export async function clearCloudHistory(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { error } = await supabase
      .from('tool_history')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.warn('[historySync] clear failed:', error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn('[historySync] exception:', err)
    return false
  }
}