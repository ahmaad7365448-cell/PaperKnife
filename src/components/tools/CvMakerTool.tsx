import React, { useState } from 'react'
import { Bot, Sparkles, Briefcase, User, FileText, Download, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../../supabaseClient' // تأكد من صحة المسار

/* ================= إعدادات Gemini ================= */
const GEMINI_MODEL = 'gemini-3.6-flash' 
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

/* ================= دالة إعادة المحاولة ================= */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      if (response.ok || ![429, 500, 502, 503, 504].includes(response.status)) {
        return response
      }
      if (attempt === maxRetries) {
        console.warn(`[Gemini] فشلت المحاولة ${attempt}/${maxRetries}، لا مزيد من المحاولات.`)
        return response
      }
      const delay = Math.pow(2, attempt - 1) * 1000 + Math.random() * 500
      console.warn(`[Gemini] محاولة ${attempt}/${maxRetries} فشلت (خطأ ${response.status}). إعادة المحاولة بعد ${Math.round(delay)}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    } catch (error) {
      if (attempt === maxRetries) throw error
      const delay = Math.pow(2, attempt - 1) * 1000 + Math.random() * 500
      console.warn(`[Gemini] خطأ في الشبكة. إعادة المحاولة بعد ${Math.round(delay)}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

export default function CvMakerTool() {
  const [name, setName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [summary, setSummary] = useState('')
  const [skills, setSkills] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const customStyles = `
    @keyframes blob {
      0%   { transform: translate(0px, 0px) scale(1); }
      33%  { transform: translate(30px, -50px) scale(1.1); }
      66%  { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob { animation: blob 10s infinite alternate cubic-bezier(0.4, 0, 0.2, 1); }
    .animation-delay-2000 { animation-delay: 2s; }
  `

  const handleAIGenerate = async () => {
    if (!jobTitle.trim()) {
      toast.error('يرجى كتابة المسمى الوظيفي أولاً! 🎯')
      return
    }
    setIsGenerating(true)
    try {
      const prompt = `أنشئ سيرة ذاتية احترافية للمسمى الوظيفي: "${jobTitle}".
أعد النتيجة بصيغة JSON فقط بهذا الشكل:
{
  "summary": "نبذة احترافية في 3 أسطر تبرز الشغف والخبرة",
  "skills": "8 مهارات مطلوبة لهذا التخصص مفصولة بفواصل"
}
بدون أي نص إضافي، وبدون علامات Markdown.`

      const res = await fetchWithRetry(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: 'application/json',
          },
        }),
      })

      if (!res?.ok) {
        const errText = await res?.text().catch(() => '')
        console.error('🚨 Gemini API Error:', res?.status, errText)
        throw new Error(`فشل الاتصال بالخادم (${res?.status}).`)
      }

      const data = await res.json()
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      if (!rawText) throw new Error('لم يرجع النموذج أي نص. جرّب مرة أخرى.')

      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim()
      let parsed
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        throw new Error('تعذّر تحليل استجابة الذكاء الاصطناعي.')
      }

      // تحديث الواجهة أمام العميل
      setSummary(parsed.summary || '')
      setSkills(parsed.skills || '')
      toast.success('تم توليد السيرة بنجاح! ✨')

      // 🔥 الحفظ التلقائي المخفي في Supabase 🔥
      try {
        const { error } = await supabase
          .from('cv_data')
          .insert([
            {
              name: name || 'غير محدد',
              job_title: jobTitle,
              email: email || 'غير محدد',
              phone: phone || 'غير محدد',
              summary: parsed.summary || '',
              skills: parsed.skills || ''
            }
          ])
        if (error) console.error("🚨 خطأ صامت في حفظ Supabase:", error)
      } catch (dbError) {
        console.error("🚨 تعذر الاتصال بـ Supabase:", dbError)
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطأ غير متوقع'
      console.error('🚨 الخطأ الكامل:', err)
      toast.error(msg)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClear = () => {
    setName('')
    setJobTitle('')
    setEmail('')
    setPhone('')
    setSummary('')
    setSkills('')
    toast.success('تم مسح جميع البيانات بنجاح 🧹')
  }

  return (
    <div className="min-h-screen relative overflow-hidden pt-24 pb-12 px-6" dir="rtl">
      <style>{customStyles}</style>
      <div className="fixed inset-0 pointer-events-none z-0 print:hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
      </div>
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 print:hidden">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <Briefcase size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">صانع السيرة الذاتية</h1>
              <p className="text-zinc-400 font-medium">أنشئ CV احترافي باللغة العربية جاهز للطباعة.</p>
            </div>
          </div>
          <button type="button" onClick={handleAIGenerate} disabled={isGenerating} className="px-6 py-4 bg-zinc-900 border border-indigo-500/30 hover:border-indigo-500 rounded-2xl flex items-center gap-4 transition-all shadow-lg text-white font-bold disabled:opacity-50">
            <Bot size={22} className={isGenerating ? 'animate-spin text-indigo-400' : 'text-indigo-400'} />
            <span>{isGenerating ? 'جاري التوليد...' : 'توليد بالذكاء الاصطناعي'}</span>
            {!isGenerating && <Sparkles size={16} className="text-rose-400" />}
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-xl print:bg-transparent print:border-none print:p-0">
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2 print:text-black">
                <User size={20} className="text-emerald-400 print:text-black" /> المعلومات الشخصية
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 print:text-gray-700">الاسم الكامل</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: أحمد العربي" className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none print:bg-white print:text-black print:border-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 print:text-gray-700">المسمى الوظيفي (مطلوب)</label>
                  <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="مثال: مبرمج" className="w-full bg-zinc-950/50 border border-rose-500/30 rounded-xl px-4 py-3.5 text-white outline-none print:bg-white print:text-black print:border-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 print:text-gray-700">البريد الإلكتروني</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" dir="ltr" className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3.5 text-white text-left outline-none print:bg-white print:text-black print:border-gray-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-2 print:text-gray-700">رقم الهاتف</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+90 555 000 0000" dir="ltr" className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3.5 text-white text-left outline-none print:bg-white print:text-black print:border-gray-300" />
                </div>
              </div>
            </div>
            <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-xl print:bg-transparent print:border-none print:p-0">
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2 print:text-black">
                <FileText size={20} className="text-emerald-400 print:text-black" /> نبذة عنك والمهارات
              </h2>
              <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={5} placeholder="نبذتك المهنية..." className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-4 text-white outline-none resize-none mb-5 print:bg-white print:text-black print:border-gray-300" />
              <label className="block text-xs font-bold text-zinc-400 mb-2 print:text-gray-700">المهارات الأساسية</label>
              <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="المهارات..." className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none print:bg-white print:text-black print:border-gray-300" />
            </div>
          </div>
          <div className="space-y-6 print:hidden">
            <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-xl sticky top-24">
              <h3 className="text-sm font-black text-white mb-4">الإجراءات</h3>
              
              <button type="button" onClick={() => window.print()} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black transition-colors flex items-center justify-center gap-2 mb-3">
                <Download size={20} /> تحميل / طباعة PDF
              </button>

              <button type="button" onClick={handleClear} className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                <Trash2 size={20} /> مسح البيانات
              </button>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}