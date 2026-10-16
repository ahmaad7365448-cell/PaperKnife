import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { toast } from 'sonner'
import {
  Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2,
  Loader2, KeyRound, Shield
} from 'lucide-react'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 🔍 التحقق من وجود جلسة صالحة (من رابط الاستعادة)
  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setHasSession(!!session)
      } catch (err) {
        console.error('Session check error:', err)
        setHasSession(false)
      } finally {
        setChecking(false)
      }
    }
    const timer = setTimeout(check, 600)
    return () => clearTimeout(timer)
  }, [])

  const validate = () => {
    const err: Record<string, string> = {}
    if (!password) err.password = 'كلمة المرور مطلوبة'
    else if (password.length < 6) err.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    if (password !== confirmPassword) err.confirmPassword = 'كلمتا المرور غير متطابقتين'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setDone(true)
      toast.success('تم تحديث كلمة المرور بنجاح! 🎉')
      setTimeout(() => { navigate('/', { replace: true }) }, 2500)
    } catch (err: any) {
      console.error('Reset error:', err)
      const msg = err.message || 'فشل تحديث كلمة المرور'
      if (msg.includes('should be at least')) {
        toast.error('كلمة المرور قصيرة جداً (6 أحرف على الأقل)')
      } else if (msg.includes('same as the old')) {
        toast.error('كلمة المرور الجديدة مطابقة للقديمة')
      } else if (msg.includes('session')) {
        toast.error('انتهت صلاحية الرابط. اطلب رابطاً جديداً.')
      } else {
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  // ===== شاشة التحميل =====
  if (checking) {
    return (
      <div dir="rtl" className="min-h-screen w-full flex items-center justify-center bg-[#080808]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="text-rose-500 animate-spin" />
          <p className="text-zinc-500 text-xs font-bold">جارٍ التحقق من الرابط...</p>
        </div>
      </div>
    )
  }

  // ===== لا يوجد جلسة =====
  if (!hasSession) {
    return (
      <div dir="rtl" className="min-h-screen w-full flex items-center justify-center bg-[#080808] p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(244,63,94,0.15) 0%, transparent 60%)`
        }} />
        <div className="relative z-10 max-w-md w-full bg-[#111111]/95 backdrop-blur-2xl rounded-[2rem] border border-rose-500/20 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle size={32} className="text-rose-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">الرابط غير صالح</h2>
          <p className="text-xs text-zinc-500 leading-relaxed mb-6">
            الرابط منتهي الصلاحية أو غير صحيح. الرابط صالح لمدة ساعة واحدة فقط.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
          >
            <ArrowRight size={16} className="rotate-180" />
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    )
  }

  // ===== النجاح =====
  if (done) {
    return (
      <div dir="rtl" className="min-h-screen w-full flex items-center justify-center bg-[#080808] p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(16,185,129,0.15) 0%, transparent 60%)`
        }} />
        <div className="relative z-10 max-w-md w-full bg-[#111111]/95 backdrop-blur-2xl rounded-[2rem] border border-emerald-500/20 p-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">تم بنجاح! 🎉</h2>
          <p className="text-sm text-zinc-500 leading-relaxed mb-4">
            تم تحديث كلمة المرور الخاصة بحسابك
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold">
            <Loader2 size={14} className="animate-spin" />
            جارٍ تحويلك للموقع...
          </div>
        </div>
      </div>
    )
  }

  // ===== النموذج =====
  return (
    <div dir="rtl" className="min-h-screen w-full flex items-center justify-center bg-[#080808] p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 60% 50% at 15% 20%, rgba(220,38,38,0.16) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 85% 80%, rgba(244,63,94,0.12) 0%, transparent 55%)
        `
      }} />

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
        `,
        backgroundSize: '70px 70px'
      }} />

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-rose-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-[#0d0d0d]/95 backdrop-blur-2xl rounded-[2.5rem] border border-rose-500/15 shadow-[0_0_100px_rgba(244,63,94,0.15)] overflow-hidden p-6 sm:p-10 animate-in fade-in zoom-in duration-500">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-4">
            <Shield size={28} className="text-rose-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            كلمة مرور <span className="text-rose-500">جديدة</span>
          </h1>
          <p className="text-xs text-zinc-500">
            اختر كلمة مرور قوية لحسابك
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">
              كلمة المرور الجديدة
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors(p => { const n = { ...p }; delete n.password; return n }) }}
                placeholder="••••••••"
                dir="ltr"
                autoFocus
                className={`w-full bg-[#1a0a10] border rounded-xl px-4 py-3 pr-11 pl-11 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all text-left ${
                  errors.password
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-rose-500/20 focus:border-rose-400 focus:shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500 hover:text-rose-400 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold">
                <AlertCircle size={12} />{errors.password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">
              تأكيد كلمة المرور
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500">
                <Lock size={16} />
              </span>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors(p => { const n = { ...p }; delete n.confirmPassword; return n }) }}
                placeholder="••••••••"
                dir="ltr"
                className={`w-full bg-[#1a0a10] border rounded-xl px-4 py-3 pr-11 pl-11 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all text-left ${
                  errors.confirmPassword
                    ? 'border-rose-500 ring-2 ring-rose-500/20'
                    : 'border-rose-500/20 focus:border-rose-400 focus:shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500 hover:text-rose-400 transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold">
                <AlertCircle size={12} />{errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <KeyRound size={12} />
              نصائح لكلمة مرور قوية
            </p>
            <ul className="text-[10px] text-zinc-500 space-y-1 leading-relaxed">
              <li>• 6 أحرف على الأقل</li>
              <li>• مزيج من حروف كبيرة وصغيرة وأرقام</li>
              <li>• تجنّب الكلمات الشائعة أو المعلومات الشخصية</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 hover:from-rose-500 hover:via-rose-400 hover:to-rose-300 text-white font-black py-4 rounded-xl shadow-[0_0_25px_rgba(244,63,94,0.5)] hover:shadow-[0_0_40px_rgba(244,63,94,0.8)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer tracking-wider mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>جارٍ الحفظ...</span>
              </>
            ) : (
              <>
                <Shield size={16} />
                <span>حفظ كلمة المرور الجديدة</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full text-center text-[11px] font-bold text-zinc-500 hover:text-rose-400 transition-colors py-2"
          >
            إلغاء والعودة لتسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  )
}