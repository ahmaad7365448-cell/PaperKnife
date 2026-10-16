import { createClient } from '@supabase/supabase-js'

// دعم الاحتمالين لتسمية مفتاح Supabase لمنع أخطاء الفقدان
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  import.meta.env.VITE_SUPABASE_ANON_KEY
) as string

// فحص الرابط الفعلي في المتصفح للتأكد من قراءته بشكل صحيح
console.log("🔗 Active Supabase URL:", supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('مفاتيح Supabase مفقودة! تأكد من وجود VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في ملف .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'paperknife-auth'
  }
})