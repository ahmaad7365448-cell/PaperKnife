import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../AuthContext'
import { toast } from 'sonner'
import {
  User, Mail, Phone, Globe, Calendar, Lock, Eye, EyeOff,
  Save, Loader2, LogOut, Shield, Award, TrendingUp,
  AlertCircle, CheckCircle2, ArrowRight, X, KeyRound,
  MapPin, Clock, FileText, Sparkles
} from 'lucide-react'

const countries = [
  'تركيا (Türkiye)', 'المملكة العربية السعودية', 'الإمارات العربية المتحدة', 'مصر',
  'الجزائر', 'المغرب', 'تونس', 'العراق', 'الأردن', 'سوريا', 'لبنان', 'فلسطين',
  'قطر', 'الكويت', 'البحرين', 'سلطنة عمان', 'اليمن', 'السودان', 'ليبيا',
  'موريتانيا', 'الصومال', 'جيبوتي', 'جزر القمر', 'أخرى'
]

const countryCodes: Record<string, string> = {
  'تركيا (Türkiye)': '+90', 'المملكة العربية السعودية': '+966', 'الإمارات العربية المتحدة': '+971',
  'مصر': '+20', 'الجزائر': '+213', 'المغرب': '+212', 'تونس': '+216', 'العراق': '+964',
  'الأردن': '+962', 'سوريا': '+963', 'لبنان': '+961', 'فلسطين': '+970', 'قطر': '+974',
  'الكويت': '+965', 'البحرين': '+973', 'سلطنة عمان': '+968', 'اليمن': '+967',
  'السودان': '+249', 'ليبيا': '+218', 'موريتانيا': '+222', 'الصومال': '+252',
  'جيبوتي': '+253', 'جزر القمر': '+269', 'أخرى': '+',
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile, signOut, refreshProfile } = useAuth()

  // ===== حالات التعديل =====
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState(countries[0])
  const [phone, setPhone] = useState('')
  const [phoneCode, setPhoneCode] = useState('+90')
  const [birthDate, setBirthDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ===== حالة تغيير كلمة المرور =====
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // ===== إحصائيات =====
  const [stats, setStats] = useState({ files: 0, tools: 0 })

  // ===== تحميل البيانات الأولية =====
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setCountry(profile.country || countries[0])
      setBirthDate(profile.birth_date || '')
      const fullPhone = profile.phone || ''
      // استخراج كود الدولة
      let foundCode = '+90'
      let foundNumber = fullPhone
      for (const [c, code] of Object.entries(countryCodes)) {
        if (fullPhone.startsWith(code)) {
          foundCode = code
          foundNumber = fullPhone.slice(code.length)
          break
        }
      }
      setPhoneCode(foundCode)
      setPhone(foundNumber)
    }
  }, [profile])

  // ===== إحصائيات النشاط =====
  useEffect(() => {
    import('../utils/recentActivity').then(({ getRecentActivity }) => {
      getRecentActivity().then((activity) => {
        setStats({
          files: activity.length,
          tools: new Set(activity.map(a => a.tool)).size,
        })
      })
    })
  }, [])

  // ===== الأحرف الأولى =====
  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return (profile.first_name[0] + profile.last_name[0]).toUpperCase()
    }
    if (profile?.first_name) return profile.first_name[0].toUpperCase()
    if (user?.email) return user.email[0].toUpperCase()
    return '?'
  }

  const getDisplayName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`
    }
    if (profile?.first_name) return profile.first_name
    if (user?.email) return user.email.split('@')[0]
    return 'مستخدم'
  }

  // ===== حفظ التعديلات =====
  const handleSave = async () => {
    const newErrors: Record<string, string> = {}
    if (!firstName.trim()) newErrors.firstName = 'الاسم مطلوب'
    if (!lastName.trim()) newErrors.lastName = 'الكنية مطلوبة'
    if (!phone.trim()) newErrors.phone = 'رقم الهاتف مطلوب'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('الرجاء تصحيح الأخطاء')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          country,
          phone: `${phoneCode}${phone.replace(/\s/g, '')}`,
          birth_date: birthDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id)

      if (error) throw error

      await refreshProfile()
      toast.success('تم حفظ التعديلات بنجاح ✨')
      setIsEditing(false)
      setErrors({})
    } catch (err: any) {
      console.error(err)
      toast.error('فشل حفظ التعديلات: ' + (err.message || 'خطأ غير معروف'))
    } finally {
      setSaving(false)
    }
  }

  // ===== إلغاء التعديل =====
  const handleCancel = () => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setCountry(profile.country || countries[0])
      setBirthDate(profile.birth_date || '')
      const fullPhone = profile.phone || ''
      let foundCode = '+90'
      let foundNumber = fullPhone
      for (const [c, code] of Object.entries(countryCodes)) {
        if (fullPhone.startsWith(code)) {
          foundCode = code
          foundNumber = fullPhone.slice(code.length)
          break
        }
      }
      setPhoneCode(foundCode)
      setPhone(foundNumber)
    }
    setErrors({})
    setIsEditing(false)
  }

  // ===== تغيير كلمة المرور =====
  const handlePasswordChange = async () => {
    setPasswordError('')
    if (newPassword.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين')
      return
    }

    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      toast.success('تم تغيير كلمة المرور بنجاح 🔐')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordSection(false)
    } catch (err: any) {
      console.error(err)
      setPasswordError(err.message || 'فشل تغيير كلمة المرور')
    } finally {
      setPasswordLoading(false)
    }
  }

  // ===== تسجيل الخروج =====
  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('تم تسجيل الخروج بنجاح 👋')
      navigate('/login')
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الخروج')
    }
  }

  // ===== حساب تاريخ التسجيل =====
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return '—'
    }
  }

  const memberSince = user?.created_at ? formatDate(user.created_at) : '—'
  const lastSignIn = user?.last_sign_in_at ? formatDate(user.last_sign_in_at) : '—'

  return (
    <div dir="rtl" className="min-h-screen bg-[#080808] relative overflow-hidden">

      {/* ===== 🌌 الخلفية ===== */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 60% 50% at 15% 20%, rgba(220,38,38,0.15) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 85% 80%, rgba(244,63,94,0.1) 0%, transparent 55%),
          radial-gradient(ellipse 40% 40% at 85% 15%, rgba(190,24,93,0.08) 0%, transparent 60%)
        `
      }} />

      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
        `,
        backgroundSize: '70px 70px'
      }} />

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-rose-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* ===== المحتوى ===== */}
      <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 lg:p-10">

        {/* رأس الصفحة */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
            الملف <span className="text-rose-500">الشخصي</span>
          </h1>
          <p className="text-xs text-zinc-500 font-medium">إدارة بياناتك وإعداداتك الشخصية</p>
        </div>

        {/* ===== 🎭 البطاقة الرئيسية ===== */}
        <div className="bg-[#111111]/95 backdrop-blur-2xl rounded-[2rem] border border-rose-500/15 shadow-[0_0_80px_rgba(244,63,94,0.08)] overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* رأس البطاقة */}
          <div className="relative p-6 sm:p-8 bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent border-b border-rose-500/10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

              {/* الأفاتار */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600 flex items-center justify-center text-white font-black text-4xl sm:text-5xl shadow-2xl shadow-rose-500/40 ring-4 ring-rose-500/20">
                  {getInitials()}
                </div>
                {/* شارة التحقق */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-[#111111] flex items-center justify-center shadow-lg">
                  <CheckCircle2 size={14} className="text-white" strokeWidth={3} />
                </div>
              </div>

              {/* الاسم والبريد */}
              <div className="flex-1 text-center sm:text-right min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-white truncate">
                    {getDisplayName()}
                  </h2>
                  <Sparkles size={18} className="text-rose-400 shrink-0" />
                </div>
                <p className="text-sm text-zinc-400 truncate mb-3">{user?.email}</p>

                {/* شارات */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                    <Shield size={10} />
                    حساب مُوثق
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-wider">
                    <Award size={10} />
                    عضو نشط
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* إحصائيات */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-x-reverse divide-rose-500/10 border-b border-rose-500/10">
            <StatCard
              icon={<FileText size={18} />}
              label="ملفات معالجة"
              value={stats.files.toString()}
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              label="أدوات مستخدمة"
              value={stats.tools.toString()}
            />
            <StatCard
              icon={<Clock size={18} />}
              label="آخر دخول"
              value={lastSignIn !== '—' ? lastSignIn.split(',')[0] : '—'}
            />
            <StatCard
              icon={<Calendar size={18} />}
              label="عضو منذ"
              value={memberSince !== '—' ? memberSince.split(',')[0] : '—'}
            />
          </div>

          {/* ===== نموذج البيانات ===== */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <User size={18} className="text-rose-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm uppercase tracking-wider">بياناتي</h3>
                  <p className="text-[10px] text-zinc-500 font-medium">معلوماتك الشخصية</p>
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all active:scale-95"
                >
                  <Save size={14} />
                  تعديل
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field
                icon={<User size={16} />}
                label="الاسم"
                value={firstName}
                onChange={setFirstName}
                editing={isEditing}
                error={errors.firstName}
                placeholder="أحمد"
              />
              <Field
                icon={<User size={16} />}
                label="الكنية"
                value={lastName}
                onChange={setLastName}
                editing={isEditing}
                error={errors.lastName}
                placeholder="العشين"
              />

              {/* البريد (دائماً معطل) */}
              <div>
                <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-[#0d0d0d] border border-zinc-800 rounded-xl px-4 py-3 pr-11 text-sm text-zinc-500 cursor-not-allowed"
                  />
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock size={12} className="text-zinc-600" />
                  </span>
                </div>
                <p className="text-[10px] text-zinc-600 mt-1.5">لا يمكن تغيير البريد الإلكتروني</p>
              </div>

              {/* الدولة */}
              <div>
                <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">
                  الدولة
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 pointer-events-none">
                    <Globe size={16} />
                  </span>
                  {isEditing ? (
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-[#1a0a10] border border-rose-500/20 rounded-xl px-4 py-3 pr-11 text-sm text-white focus:outline-none focus:border-rose-400 transition-all cursor-pointer appearance-none"
                    >
                      {countries.map((c) => (
                        <option key={c} value={c} className="bg-[#1a0a10] text-white">{c}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={country}
                      disabled
                      className="w-full bg-[#0d0d0d] border border-zinc-800 rounded-xl px-4 py-3 pr-11 text-sm text-white cursor-not-allowed"
                    />
                  )}
                </div>
              </div>

              {/* الهاتف */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">
                  رقم الهاتف
                </label>
                <div className={`flex items-center bg-[#0d0d0d] border rounded-xl overflow-hidden ${
                  isEditing ? 'border-rose-500/20 focus-within:border-rose-400' : 'border-zinc-800'
                }`} dir="ltr">
                  <div className={`flex items-center gap-1 px-3 py-3 border-r ${
                    isEditing ? 'bg-rose-500/5 border-rose-500/20' : 'bg-zinc-900 border-zinc-800'
                  }`}>
                    <Phone size={14} className={isEditing ? 'text-rose-400' : 'text-zinc-500'} />
                    <span className={`text-sm font-bold min-w-[42px] text-center ${isEditing ? 'text-rose-300' : 'text-zinc-500'}`}>
                      {phoneCode}
                    </span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                    disabled={!isEditing}
                    placeholder="555 000 0000"
                    className={`flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none ${
                      isEditing ? 'text-white placeholder-zinc-600' : 'text-zinc-500 cursor-not-allowed'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold">
                    <AlertCircle size={12} /> {errors.phone}
                  </p>
                )}
              </div>

              {/* تاريخ الميلاد */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">
                  تاريخ الميلاد
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500">
                    <Calendar size={16} />
                  </span>
                  <input
                    type={isEditing ? 'date' : 'text'}
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    disabled={!isEditing}
                    className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none transition-all ${
                      isEditing
                        ? 'bg-[#1a0a10] border-rose-500/20 text-white focus:border-rose-400'
                        : 'bg-[#0d0d0d] border-zinc-800 text-white cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* أزرار الحفظ / الإلغاء */}
            {isEditing && (
              <div className="flex gap-3 mt-8 pt-6 border-t border-rose-500/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black py-3 rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Save size={16} />
                      <span>حفظ التعديلات</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <X size={16} />
                  إلغاء
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===== 🔐 قسم الأمان ===== */}
        <div className="bg-[#111111]/95 backdrop-blur-2xl rounded-[2rem] border border-rose-500/15 shadow-[0_0_80px_rgba(244,63,94,0.08)] overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="w-full p-6 flex items-center justify-between hover:bg-rose-500/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <Shield size={18} className="text-rose-400" />
              </div>
              <div className="text-right">
                <h3 className="font-black text-white text-sm uppercase tracking-wider">الأمان</h3>
                <p className="text-[10px] text-zinc-500 font-medium">كلمة المرور والحماية</p>
              </div>
            </div>
            <ArrowRight
              size={18}
              className={`text-zinc-500 group-hover:text-rose-400 transition-all ${
                showPasswordSection ? 'rotate-90' : 'rotate-180'
              }`}
            />
          </button>

          {showPasswordSection && (
            <div className="px-6 pb-6 sm:px-8 sm:pb-8 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-rose-500/10 pt-6">
              <div className="flex items-center gap-2 mb-5">
                <KeyRound size={16} className="text-rose-400" />
                <h4 className="font-black text-white text-xs uppercase tracking-wider">تغيير كلمة المرور</h4>
              </div>

              <div className="space-y-4 max-w-xl">
                {/* كلمة المرور الجديدة */}
                <div>
                  <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1a0a10] border border-rose-500/20 rounded-xl px-4 py-3 pr-11 pl-11 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-rose-400 focus:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* تأكيد كلمة المرور */}
                <div>
                  <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#1a0a10] border border-rose-500/20 rounded-xl px-4 py-3 pr-11 pl-11 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-rose-400 focus:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500 hover:text-rose-400 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-bold bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                    <AlertCircle size={14} />
                    {passwordError}
                  </p>
                )}

                <button
                  onClick={handlePasswordChange}
                  disabled={passwordLoading || !newPassword || !confirmPassword}
                  className="w-full sm:w-auto px-6 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black py-3 rounded-xl shadow-lg shadow-rose-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Shield size={16} />
                      <span>تحديث كلمة المرور</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== 🚪 منطقة الخطر ===== */}
        <div className="bg-[#111111]/95 backdrop-blur-2xl rounded-[2rem] border border-rose-500/20 shadow-[0_0_80px_rgba(244,63,94,0.08)] overflow-hidden p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-white text-sm uppercase tracking-wider mb-1">تسجيل الخروج</h3>
              <p className="text-[11px] text-zinc-500">سيتم إغلاق جلستك الحالية على هذا الجهاز</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all active:scale-95 shrink-0"
            >
              <LogOut size={16} />
              تسجيل الخروج
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ===== مكون البطاقة الإحصائية =====
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-5 hover:bg-rose-500/5 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-rose-400">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{label}</span>
      </div>
      <p className="text-2xl font-black text-white truncate">{value}</p>
    </div>
  )
}

// ===== مكون حقل قابل للتعديل =====
function Field({
  icon, label, value, onChange, editing, error, placeholder, type = 'text'
}: {
  icon: React.ReactNode
  label: string
  value: string
  onChange: (v: string) => void
  editing: boolean
  error?: string
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">
        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 pointer-events-none">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!editing}
          placeholder={placeholder}
          className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none transition-all ${
            error
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-[#1a0a10] text-white'
              : editing
                ? 'bg-[#1a0a10] border-rose-500/20 text-white placeholder-zinc-600 focus:border-rose-400 focus:shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                : 'bg-[#0d0d0d] border-zinc-800 text-white cursor-not-allowed'
          }`}
        />
      </div>
      {error && (
        <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  )
}