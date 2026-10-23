import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { toast } from 'sonner'
import { useAuth } from '../AuthContext'
import { 
  User, Mail, Globe, Phone, Save, X, Camera, 
  ShieldCheck, Calendar, FileText, Clock, Loader2, AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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

const phoneLengths: Record<string, number> = {
  'تركيا (Türkiye)': 10, 'المملكة العربية السعودية': 9, 'الإمارات العربية المتحدة': 9,
  'مصر': 10, 'الجزائر': 9, 'المغرب': 9, 'تونس': 8, 'العراق': 10,
  'الأردن': 9, 'سوريا': 9, 'لبنان': 8, 'فلسطين': 9, 'قطر': 8,
  'الكويت': 8, 'البحرين': 8, 'سلطنة عمان': 8, 'اليمن': 9,
  'السودان': 9, 'ليبيا': 9, 'موريتانيا': 8, 'الصومال': 9,
  'جيبوتي': 8, 'جزر القمر': 7, 'أخرى': 15
}

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState(countries[0])
  const [phoneCode, setPhoneCode] = useState(countryCodes[countries[0]])
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '')
      setLastName(profile.last_name || '')
      setCountry(profile.country || countries[0])
      
      if (profile.avatar_url) {
        setAvatarUrl(profile.avatar_url)
      }

      if (profile.phone) {
        const userPhone = profile.phone
        const code = Object.values(countryCodes).find(c => userPhone.startsWith(c))
        if (code) {
          setPhoneCode(code)
          setPhone(userPhone.replace(code, '').trim())
        } else {
          setPhone(userPhone)
        }
      }
    }

    if (user) {
      const meta = user.user_metadata || {}
      const fullName = meta.full_name || meta.name || ''

      if (!firstName && !lastName && fullName) {
        const parts = fullName.split(' ')
        setFirstName(meta.first_name || parts[0] || '')
        setLastName(meta.last_name || parts.slice(1).join(' ') || '')
      } else {
        if (!firstName && meta.first_name) setFirstName(meta.first_name)
        if (!lastName && meta.last_name) setLastName(meta.last_name)
      }

      const oauthAvatar = meta.avatar_url || meta.picture
      setAvatarUrl(prev => prev || profile?.avatar_url || oauthAvatar || null)
    }
  }, [profile, user])

  useEffect(() => { 
    setPhoneCode(countryCodes[country] || '+')
    const maxLength = phoneLengths[country] || 15
    if (phone.length > maxLength) {
      setPhone(phone.slice(0, maxLength))
    }
  }, [country])

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!user) throw new Error('يرجى تسجيل الدخول أولاً')
      if (!event.target.files || event.target.files.length === 0) return

      const file = event.target.files[0]
      if (file.size > 5 * 1024 * 1024) throw new Error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      let finalAvatarUrl = ''

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true, cacheControl: '3600' })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
        finalAvatarUrl = publicUrl
      } else {
        finalAvatarUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      }

      await supabase.auth.updateUser({
        data: { avatar_url: finalAvatarUrl }
      })

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          avatar_url: finalAvatarUrl,
          country: country,
          phone: phone.trim() ? `${phoneCode}${phone.replace(/\s/g, '')}` : null
        }, { onConflict: 'id' })

      if (updateError) console.error('Profiles DB notice:', updateError)

      setAvatarUrl(finalAvatarUrl)
      toast.success('تم تحديث الصورة الشخصية بنجاح! 📸')
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      toast.error('حدث خطأ أثناء رفع الصورة: ' + (error.message || 'حاول مرة أخرى'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearError = (field: string) => {
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const handleSave = async () => {
    if (!user) {
      toast.error('يرجى تسجيل الدخول أولاً')
      return
    }

    const newErrors: Record<string, string> = {}
    if (!firstName.trim()) newErrors.firstName = 'الاسم الأول مطلوب'
    if (!lastName.trim()) newErrors.lastName = 'الكنية مطلوبة'
    
    const maxLength = phoneLengths[country] || 15
    if (phone.trim() && phone.length !== maxLength) {
      newErrors.phone = `رقم الهاتف يجب أن يكون ${maxLength} أرقام`
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast.error('الرجاء إكمال الحقول المطلوبة بشكل صحيح! ⚠️')
      return
    }

    setLoading(true)
    try {
      const fullPhone = phone.trim() ? `${phoneCode}${phone.replace(/\s/g, '')}` : null
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: fullName,
          country: country,
          phone: fullPhone,
          avatar_url: avatarUrl
        }
      })

      if (authError) console.error('Auth update error:', authError)

      const { error: dbError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          country: country,
          phone: fullPhone,
          avatar_url: avatarUrl
        }, { 
          onConflict: 'id' 
        })

      if (dbError) {
        console.error('Profiles DB error:', dbError)
      }

      toast.success('تم حفظ التعديلات بنجاح! 🎉')
    } catch (error: any) {
      console.error('Save Error Details:', error)
      toast.error('حدث خطأ أثناء الحفظ: ' + (error.message || 'حاول مرة أخرى'), { duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  const getInitials = () => {
    if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase()
    if (firstName) return firstName[0].toUpperCase()
    if (user?.email) return user.email[0].toUpperCase()
    return '?'
  }

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* البطاقة العلوية */}
        <div className="bg-[#1a1a1d] rounded-[2rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-36 bg-gradient-to-r from-rose-600/30 via-purple-600/20 to-indigo-600/30"></div>
          
          <div className="relative z-10 flex flex-col items-center mt-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-[#1a1a1d] overflow-hidden shadow-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-4xl font-black relative ring-4 ring-white/5">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  getInitials()
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 size={32} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-1 right-1 p-3 bg-white text-black rounded-full hover:bg-rose-50 hover:text-rose-600 hover:scale-110 transition-all shadow-xl active:scale-95 disabled:opacity-50 border-2 border-[#1a1a1d] cursor-pointer"
                title="تغيير الصورة"
              >
                <Camera size={18} />
              </button>
              <input type="file" ref={fileInputRef} onChange={uploadAvatar} accept="image/*" className="hidden" />
            </div>

            <h1 className="text-2xl font-black mt-5 tracking-tight flex items-center gap-2">
              {firstName || 'مستخدم'} {lastName}
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-medium">{user?.email}</p>
            
            <div className="flex items-center gap-2 mt-4">
              <span className="flex items-center gap-1.5 bg-emerald-500/10 px-4 py-1.5 rounded-full text-xs font-bold text-emerald-400 border border-emerald-500/20 shadow-sm">
                <ShieldCheck size={14} />
                حساب موثق
              </span>
            </div>
          </div>
        </div>

        {/* إحصائيات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'ملفات معالجة', value: '0', icon: FileText, color: 'text-rose-400', bg: 'bg-rose-500/10' },
            { label: 'دقائق استخدام', value: '0', icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'آخر دخول', value: 'اليوم', icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'تاريخ الانضمام', value: 'أكتوبر ٢٠٢٦', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#1a1a1d] p-4 rounded-3xl border border-white/5 flex flex-col items-center text-center gap-2 hover:bg-white/[0.02] transition-colors">
              <div className={`p-3 ${stat.bg} ${stat.color} rounded-2xl`}>
                <stat.icon size={22} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold">{stat.label}</p>
                <p className="text-lg font-black">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* نموذج البيانات */}
        <div className="bg-[#1a1a1d] rounded-[2rem] p-6 md:p-8 border border-white/5 shadow-2xl">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-8 border-b border-white/10 pb-5">
            <User size={22} className="text-rose-500" />
            معلوماتك الشخصية
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">الاسم الأول <span className="text-rose-500">*</span></label>
              <div className="relative">
                <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); clearError('firstName') }}
                  className={`w-full bg-[#0f0f11] border rounded-xl py-3.5 pr-12 pl-4 text-sm focus:outline-none transition-all ${errors.firstName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-white/10 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20'}`}
                  placeholder="أدخل اسمك الأول"
                />
              </div>
              {errors.firstName && <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold"><AlertCircle size={12}/> {errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">الكنية <span className="text-rose-500">*</span></label>
              <div className="relative">
                <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); clearError('lastName') }}
                  className={`w-full bg-[#0f0f11] border rounded-xl py-3.5 pr-12 pl-4 text-sm focus:outline-none transition-all ${errors.lastName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-white/10 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20'}`}
                  placeholder="أدخل اسم العائلة"
                />
              </div>
              {errors.lastName && <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold"><AlertCircle size={12}/> {errors.lastName}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">البريد الإلكتروني</label>
              <div className="relative opacity-60">
                <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="email" 
                  value={user?.email || ''}
                  disabled
                  dir="ltr"
                  className="w-full bg-[#0f0f11] border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-sm text-left cursor-not-allowed select-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">الدولة</label>
              <div className="relative">
                <Globe size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <select 
                  value={country} 
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#0f0f11] border border-white/10 rounded-xl py-3.5 pr-12 pl-4 text-sm focus:outline-none focus:border-rose-500/50 transition-all cursor-pointer appearance-none"
                >
                  {countries.map((c) => <option key={c} value={c} className="bg-[#0f0f11] text-white">{c}</option>)}
                </select>
              </div>
            </div>

            {/* حقل الهاتف (اختياري) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">
                رقم الهاتف <span className="text-gray-600 text-[10px] font-normal">(اختياري)</span>
              </label>
              <div className={`flex items-center bg-[#0f0f11] border rounded-xl overflow-hidden transition-all ${errors.phone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-white/10 focus-within:border-rose-500/50 focus-within:ring-1 focus-within:ring-rose-500/20'}`} dir="ltr">
                <div className="flex items-center gap-1 px-3 py-3.5 bg-white/5 border-r border-white/10 select-none">
                  <Phone size={14} className="text-rose-400" />
                  <span className="text-sm font-bold text-rose-300 min-w-[42px] text-center">{phoneCode}</span>
                </div>
                <input 
                  type="tel" 
                  value={phone}
                  maxLength={phoneLengths[country] || 15}
                  onChange={(e) => { 
                    const val = e.target.value.replace(/\D/g, '').slice(0, phoneLengths[country] || 15);
                    setPhone(val); 
                    clearError('phone') 
                  }}
                  placeholder={`أدخل ${phoneLengths[country]} أرقام (اختياري)`}
                  className="flex-1 bg-transparent px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none" 
                />
              </div>
              {errors.phone && <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold"><AlertCircle size={12}/> {errors.phone}</p>}
            </div>
            
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button onClick={() => navigate('/')} className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <X size={18} /> إلغاء
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {loading ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}