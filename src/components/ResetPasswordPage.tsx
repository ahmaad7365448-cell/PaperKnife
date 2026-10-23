import { useState } from 'react'
import { Mail, KeyRound, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export default function ResetPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('يرجى إدخال البريد الإلكتروني أولاً')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
      
      toast.success('تم إرسال رمز التحقق (8 أرقام) إلى بريدك! 📧')
      setStep(2)
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ، تأكد من صحة البريد الإلكتروني')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || !newPassword) {
      toast.error('يرجى إدخال الرمز وكلمة المرور الجديدة')
      return
    }
    if (newPassword.length < 6) {
      toast.error('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل')
      return
    }

    setLoading(true)
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery'
      })
      if (verifyError) throw verifyError

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (updateError) throw updateError

      toast.success('تم تغيير كلمة المرور بنجاح! 🚀')
      navigate('/login')
    } catch (error: any) {
      toast.error('الرمز غير صحيح أو منتهي الصلاحية')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-[80vh] flex items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-md">
        <button 
          onClick={() => step === 2 ? setStep(1) : navigate('/login')}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold"
        >
          <ArrowRight size={16} />
          عودة
        </button>

        <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 text-center mb-8">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20 shadow-lg shadow-rose-500/10">
              {step === 1 ? <KeyRound size={28} /> : <ShieldCheck size={32} />}
            </div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
              {step === 1 ? 'استعادة كلمة المرور' : 'إنشاء كلمة مرور جديدة'}
            </h2>
            <p className="text-gray-400 font-medium text-sm">
              {step === 1 
                ? 'أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق مكون من 8 أرقام.' 
                : `أدخل الرمز الذي أرسلناه إلى ${email}`}
            </p>
          </div>

          {/* النموذج الأول: طلب الرمز */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  autoComplete="email"
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all font-medium text-left"
                  placeholder="name@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-rose-500/25 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
              </button>
            </form>
          )}

          {/* النموذج الثاني: إدخال الرمز وتغيير الكلمة */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndUpdate} autoComplete="off" className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase block text-right">رمز التحقق (8 أرقام)</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={8}
                  dir="ltr"
                  autoComplete="one-time-code" // منع ملء اسم المستخدم التلقائي
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 px-4 text-white text-center tracking-[0.5em] font-black text-xl focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase block text-right">كلمة المرور الجديدة</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    dir="ltr"
                    autoComplete="new-password" // منع جلب كلمة المرور القديمة من المتصفح
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-white focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all font-medium text-left"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {loading ? 'جاري التحقق...' : 'تأكيد وتغيير كلمة المرور'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}