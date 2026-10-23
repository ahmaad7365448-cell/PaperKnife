/**
 * صفحة تغيير كلمة المرور
 */
import { useState } from 'react'
import { Lock, Eye, EyeOff, KeyRound, ArrowRight } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين!')
      return
    }
    if (password.length < 6) {
      toast.error('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      
      toast.success('تم تحديث كلمة المرور بنجاح! 🚀')
      navigate('/') // إعادة التوجيه للرئيسية بعد النجاح
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تغيير كلمة المرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-[80vh] flex items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-md">
        {/* زر العودة */}
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold"
        >
          <ArrowRight size={16} />
          عودة
        </button>

        {/* صندوق تغيير كلمة المرور */}
        <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          {/* تأثيرات إضاءة الخلفية */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20">
              <KeyRound size={28} strokeWidth={2} />
            </div>
            
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">تغيير كلمة المرور</h2>
            <p className="text-gray-400 font-medium mb-8 text-sm">
              قم بإدخال كلمة المرور الجديدة وتأكيدها لحماية حسابك.
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-5">
              {/* حقل كلمة المرور الجديدة */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-widest block">كلمة المرور الجديدة</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 pr-11 pl-12 text-white placeholder:text-gray-600 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* حقل تأكيد كلمة المرور */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-widest block">تأكيد كلمة المرور</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3.5 pr-11 pl-12 text-white placeholder:text-gray-600 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* زر الحفظ */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-rose-500/25 active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                {loading ? 'جاري التحديث...' : 'حفظ كلمة المرور'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}