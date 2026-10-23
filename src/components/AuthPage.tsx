import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { toast } from 'sonner'
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Globe, Phone, AlertCircle, Languages as LanguagesIcon } from 'lucide-react'
import { useLanguage } from '../LanguageContext'

const countries = [
  'Turkey (Türkiye)', 'Saudi Arabia', 'United Arab Emirates', 'Egypt',
  'Algeria', 'Morocco', 'Tunisia', 'Iraq', 'Jordan', 'Syria', 'Lebanon', 'Palestine',
  'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Yemen', 'Sudan', 'Libya',
  'Mauritania', 'Somalia', 'Djibouti', 'Comoros', 'Other'
]

const countriesAr = [
  'تركيا (Türkiye)', 'المملكة العربية السعودية', 'الإمارات العربية المتحدة', 'مصر',
  'الجزائر', 'المغرب', 'تونس', 'العراق', 'الأردن', 'سوريا', 'لبنان', 'فلسطين',
  'قطر', 'الكويت', 'البحرين', 'سلطنة عمان', 'اليمن', 'السودان', 'ليبيا',
  'موريتانيا', 'الصومال', 'جيبوتي', 'جزر القمر', 'أخرى'
]

const countryCodes: Record<string, string> = {
  'Turkey (Türkiye)': '+90', 'Saudi Arabia': '+966', 'United Arab Emirates': '+971',
  'Egypt': '+20', 'Algeria': '+213', 'Morocco': '+212', 'Tunisia': '+216', 'Iraq': '+964',
  'Jordan': '+962', 'Syria': '+963', 'Lebanon': '+961', 'Palestine': '+970', 'Qatar': '+974',
  'Kuwait': '+965', 'Bahrain': '+973', 'Oman': '+968', 'Yemen': '+967',
  'Sudan': '+249', 'Libya': '+218', 'Mauritania': '+222', 'Somalia': '+252',
  'Djibouti': '+253', 'Comoros': '+269', 'Other': '+',
}

const countryCodesAr: Record<string, string> = {
  'تركيا (Türkiye)': '+90', 'المملكة العربية السعودية': '+966', 'الإمارات العربية المتحدة': '+971',
  'مصر': '+20', 'الجزائر': '+213', 'المغرب': '+212', 'تونس': '+216', 'العراق': '+964',
  'الأردن': '+962', 'سوريا': '+963', 'لبنان': '+961', 'فلسطين': '+970', 'قطر': '+974',
  'الكويت': '+965', 'البحرين': '+973', 'سلطنة عمان': '+968', 'اليمن': '+967',
  'السودان': '+249', 'ليبيا': '+218', 'موريتانيا': '+222', 'الصومال': '+252',
  'جيبوتي': '+253', 'جزر القمر': '+269', 'أخرى': '+',
}

type IntroPhase = 'idle' | 'pushed' | 'flickering' | 'settled'
type AuthMode = 'login' | 'signup'

function GlowInput({
  icon, type = 'text', value, onChange, placeholder, error,
  isPassword, showPassword, onTogglePassword, dir
}: {
  icon: React.ReactNode
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  error?: string
  isPassword?: boolean
  showPassword?: boolean
  onTogglePassword?: () => void
  dir?: 'ltr' | 'rtl'
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div>
      <div className="relative rounded-xl p-[1.5px] overflow-hidden">
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `linear-gradient(90deg, 
              transparent 0%, transparent 35%,
              ${error ? '#f43f5e' : '#fb7185'} 45%,
              #fff1f2 50%,
              ${error ? '#f43f5e' : '#fb7185'} 55%,
              transparent 65%, transparent 100%
            )`,
            backgroundSize: '200% 100%',
            animation: 'borderSweep 5s linear infinite',
            opacity: focused || error ? 1 : 0.85,
            transition: 'opacity 0.3s ease',
          }}
        />
        <div className="relative rounded-[10px] bg-[#1a0a10] flex items-center overflow-hidden" dir={dir}>
          <span className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center transition-colors ${focused ? 'text-rose-400' : 'text-zinc-500'}`}>
            {icon}
          </span>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            className={`w-full bg-transparent py-3 text-sm text-white placeholder-zinc-600 focus:outline-none ${
              dir === 'rtl' ? (isPassword ? 'pr-11 pl-11' : 'pr-11 pl-4') : (isPassword ? 'pl-11 pr-11' : 'pl-11 pr-4')
            }`}
          />
          {isPassword && onTogglePassword && (
            <button
              type="button"
              onClick={onTogglePassword}
              className={`absolute inset-y-0 ${dir === 'rtl' ? 'left-0 pl-4' : 'right-0 pr-4'} flex items-center text-zinc-500 hover:text-rose-400 transition-colors`}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold">
          <AlertCircle size={12} />{error}
        </p>
      )}
    </div>
  )
}

export default function AuthPage() {
  const { language, toggleLanguage, isRTL } = useLanguage()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState(language === 'ar' ? countriesAr[0] : countries[0])
  const [phone, setPhone] = useState('')
  const [phoneCode, setPhoneCode] = useState(language === 'ar' ? countryCodesAr[countriesAr[0]] : countryCodes[countries[0]])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isIlluminated, setIsIlluminated] = useState(true)
  const [isFormFocused, setIsFormFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [introPhase, setIntroPhase] = useState<IntroPhase>('idle')
  const [lampOn, setLampOn] = useState(false)
  const flickerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [pullY, setPullY] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const pullStartRef = useRef(0)

  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/'

  const isLogin = mode === 'login'
  const isSignup = mode === 'signup'
  
  // النصوص بحسب اللغة
  const texts = {
    loginTitle: language === 'ar' ? 'Welcome Back.' : 'Welcome Back.',
    signupTitle: language === 'ar' ? 'ابدأ رحلتك.' : 'Start Your Journey.',
    loginSub: language === 'ar' ? 'اسحب الحبل لإضاءة طريقك' : 'Pull the cord to light your way',
    signupSub: language === 'ar' ? 'أنشئ حسابك للبدء باستخدام الأدوات' : 'Create your account to start using the tools',
    firstName: language === 'ar' ? 'الاسم' : 'First Name',
    lastName: language === 'ar' ? 'الكنية' : 'Last Name',
    country: language === 'ar' ? 'الدولة' : 'Country',
    phone: language === 'ar' ? 'رقم الهاتف' : 'Phone Number',
    email: language === 'ar' ? 'البريد الإلكتروني' : 'Email Address',
    password: language === 'ar' ? 'كلمة المرور' : 'Password',
    forgotPassword: language === 'ar' ? 'هل نسيت كلمة المرور؟' : 'Forgot Password?',
    btnSignin: language === 'ar' ? 'تسجيل الدخول' : 'SIGN IN',
    btnSignup: language === 'ar' ? 'ابدأ رحلتك ✨' : 'SIGN UP ✨',
    or: language === 'ar' ? 'أو' : 'OR',
    noAccount: language === 'ar' ? 'ليس لديك حساب؟ ' : 'Don\'t have an account? ',
    haveAccount: language === 'ar' ? 'لديك حساب بالفعل؟ ' : 'Already have an account? ',
    createAccount: language === 'ar' ? 'أنشئ حساباً جديداً' : 'Create a new account',
    loginLink: language === 'ar' ? 'سجّل الدخول' : 'Log In',
    secureFast: language === 'ar' ? 'Secure • Fast • Reliable' : 'Secure • Fast • Reliable'
  }

  useEffect(() => { 
    setPhoneCode(language === 'ar' ? (countryCodesAr[country] || '+') : (countryCodes[country] || '+')) 
  }, [country, language])

  // 🎬 المشهد الافتتاحي
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setIntroPhase('pushed'), 2000))
    timers.push(setTimeout(() => {
      setIntroPhase('flickering')
      const start = Date.now()
      const doFlicker = () => {
        if (Date.now() - start > 1400) {
          setLampOn(true)
          setIntroPhase('settled')
          setIsIlluminated(true)
          return
        }
        setLampOn(p => !p)
        flickerTimerRef.current = setTimeout(doFlicker, 100 + Math.random() * 180)
      }
      doFlicker()
    }, 5000))
    return () => {
      timers.forEach(t => clearTimeout(t))
      if (flickerTimerRef.current) clearTimeout(flickerTimerRef.current)
    }
  }, [])

  const actuallyOn = introPhase === 'settled' ? isIlluminated : lampOn

  const triggerPullFlicker = () => {
    if (flickerTimerRef.current) clearTimeout(flickerTimerRef.current)

    if (introPhase === 'settled' && isIlluminated) {
      setIsIlluminated(false)
      setLampOn(false)
      return
    }

    const sequence = [false, true, false, true, false, true]
    let idx = 0

    setIntroPhase('flickering')
    const doNext = () => {
      if (idx >= sequence.length) {
        setLampOn(true)
        setIntroPhase('settled')
        setIsIlluminated(true)
        return
      }
      setLampOn(sequence[idx])
      idx++
      flickerTimerRef.current = setTimeout(doNext, 90 + Math.random() * 70)
    }
    doNext()
  }

  // 🖱️ سحب الحبل
  useEffect(() => {
    if (!isPulling) return

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const point = 'touches' in e ? e.touches[0] : e
      const delta = point.clientY - pullStartRef.current
      setPullY(Math.max(0, Math.min(90, delta)))
    }

    const handleUp = () => {
      setIsPulling(false)
      setPullY(prev => {
        if (prev > 25) triggerPullFlicker()
        return 0
      })
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove)
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [isPulling, introPhase, isIlluminated])

  const handlePullStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const point = 'touches' in e ? e.touches[0] : (e as React.MouseEvent)
    pullStartRef.current = point.clientY
    setIsPulling(true)
  }

  const clearError = (field: string) => {
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    const errEmailReq = language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required'
    const errEmailInv = language === 'ar' ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address'
    const errPassReq = language === 'ar' ? 'كلمة المرور مطلوبة' : 'Password is required'
    const errFirstReq = language === 'ar' ? 'الرجاء إدخال الاسم' : 'First name is required'
    const errLastReq = language === 'ar' ? 'الرجاء إدخال الكنية' : 'Last name is required'
    const errPhoneReq = language === 'ar' ? 'الرجاء إدخال رقم الهاتف' : 'Phone number is required'

    if (!email.trim()) newErrors.email = errEmailReq
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = errEmailInv

    if (!password.trim()) newErrors.password = errPassReq
    
    if (isSignup) {
      if (!firstName.trim()) newErrors.firstName = errFirstReq
      if (!lastName.trim()) newErrors.lastName = errLastReq
      if (!phone.trim()) newErrors.phone = errPhoneReq
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: provider === 'google' ? { access_type: 'offline' } : undefined,
        },
      })
      if (error) throw error
    } catch (error: any) {
      console.error(`${provider} OAuth error:`, error)
      toast.error(
        error.message?.includes('provider is not enabled')
          ? `${provider === 'google' ? 'Google' : 'Facebook'} غير مُفعَّل`
          : 'فشل الاتصال. حاول مرة أخرى.'
      )
      setLoading(false)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) { 
      toast.error(language === 'ar' ? 'الرجاء تصحيح الأخطاء' : 'Please fix the errors')
      return 
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()

    setLoading(true)
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword })
        if (error) {
          if (error.message.includes('Invalid login credentials')) throw new Error(language === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة ❌' : 'Invalid email or password ❌')
          if (error.message.includes('Email not confirmed')) throw new Error(language === 'ar' ? 'يجب تأكيد بريدك الإلكتروني أولاً 📧' : 'Please confirm your email first 📧')
          throw error
        }
        if (!data.session) throw new Error('لم يتم إنشاء جلسة. حاول مجدداً.')
        toast.success(language === 'ar' ? 'مرحباً بك مجدداً! 🎉' : 'Welcome back! 🎉')
        setTimeout(() => { navigate(from, { replace: true }) }, 600)
        return
      }

      const fullPhone = `${phoneCode}${phone.replace(/\s/g, '')}`

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            country: country,
            phone: fullPhone,
          }
        }
      })
      if (authError) {
        if (authError.message.includes('rate limit') || authError.status === 429) throw new Error(language === 'ar' ? 'تم إرسال طلبات كثيرة. يرجى الانتظار 15 دقيقة.' : 'Too many requests. Please wait 15 minutes.')
        if (authError.message.includes('already registered')) throw new Error(language === 'ar' ? 'هذا البريد مسجل مسبقاً. جرب تسجيل الدخول 📧' : 'Email already registered. Try logging in 📧')
        if (authError.message.includes('Password should be at least')) throw new Error(language === 'ar' ? 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)' : 'Password must be at least 6 characters')
        throw authError
      }
      if (!authData.session) {
        toast.success(language === 'ar' ? 'تم إنشاء حسابك! تحقق من بريدك 📧' : 'Account created! Check your email 📧')
        setMode('login')
        return
      }
      toast.success(language === 'ar' ? 'تم إنشاء حسابك بنجاح! 🎉' : 'Account created successfully! 🎉')
      setTimeout(() => { navigate(from, { replace: true }) }, 600)

    } catch (error: any) {
      console.error('Auth error:', error)
      toast.error(error.message || 'Error occurred')
    } finally { setLoading(false) }
  }

  const eyeLook = isFormFocused ? { x: -5.5, y: 2 } : { x: -3.5, y: 0.5 }
  const bodyTilt = isFormFocused ? -3 : 0

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setErrors({})
    if (newMode !== 'login') setPassword('')
  }

  const customStyles = `
    @keyframes lampIdleSway { 0%, 100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }
    @keyframes lampPushSwing {
      0%   { transform: rotate(-1.5deg); }
      10%  { transform: rotate(12deg); }
      26%  { transform: rotate(-10deg); }
      42%  { transform: rotate(7deg); }
      58%  { transform: rotate(-4deg); }
      74%  { transform: rotate(2deg); }
      88%  { transform: rotate(-1deg); }
      100% { transform: rotate(0deg); }
    }
    @keyframes borderSweep { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    @keyframes btnLightMove { 0% { background-position: 200% 50%; } 100% { background-position: -200% 50%; } }
    @keyframes btnPulse { 0%, 100% { box-shadow: 0 0 25px rgba(244,63,94,0.5); } 50% { box-shadow: 0 0 45px rgba(244,63,94,0.9); } }
    @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-8px) rotate(-1deg); } }
    @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.025); } }
    @keyframes blink { 0%, 93%, 100% { transform: scaleY(1); } 97% { transform: scaleY(0.06); } }
    @keyframes lightRay { 0%, 100% { opacity: 0.65; transform: translateX(-50%) scaleY(1); } 50% { opacity: 0.95; transform: translateX(-50%) scaleY(1.04); } }
    @keyframes beamPulse { 0%, 100% { opacity: 0.65; } 50% { opacity: 1; } }
    @keyframes glowPulseRose { 0%, 100% { filter: drop-shadow(0 0 30px rgba(244,63,94,0.55)); } 50% { filter: drop-shadow(0 0 65px rgba(244,63,94,0.95)); } }
    @keyframes bulbBlink { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.9; transform: scale(0.96); } }
    @keyframes dustFloat {
      0% { transform: translateY(0) translateX(0); opacity: 0; }
      15% { opacity: 0.9; } 85% { opacity: 0.9; }
      100% { transform: translateY(-260px) translateX(14px); opacity: 0; }
    }
    @keyframes bgRotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes musicNote { 0% { transform: translateY(0) scale(0.6); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-40px) scale(1.1); opacity: 0; } }
    @keyframes sparkle { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.3); } }
    @keyframes eyeBlueGlow { 0%, 100% { filter: drop-shadow(0 0 8px rgba(56,189,248,0.7)); } 50% { filter: drop-shadow(0 0 20px rgba(56,189,248,1)); } }
    @keyframes cordSwing { 0%, 100% { transform: rotate(-0.8deg); } 50% { transform: rotate(0.8deg); } }

    .animate-float { animation: float 4.5s ease-in-out infinite; }
    .animate-breathe { animation: breathe 3.2s ease-in-out infinite; transform-origin: center; }
    .animate-blink { transform-origin: 92px 108px; animation: blink 4.5s ease-in-out infinite; }
    .animate-blink-r { transform-origin: 128px 108px; animation: blink 4.5s ease-in-out infinite; }
    .animate-light-ray { animation: lightRay 5s ease-in-out infinite; }
    .animate-beam-pulse { animation: beamPulse 4s ease-in-out infinite; }
    .animate-glow { animation: glowPulseRose 3.5s ease-in-out infinite; }
    .animate-bulb { animation: bulbBlink 2.5s ease-in-out infinite; }
    .animate-bg-rotate { animation: bgRotate 80s linear infinite; }
    .animate-sparkle { animation: sparkle 2.5s ease-in-out infinite; }
    .animate-eye-blue { animation: eyeBlueGlow 2.5s ease-in-out infinite; }
    .animate-cord-swing { animation: cordSwing 4s ease-in-out infinite; transform-origin: 30px 3px; }

    .lamp-wrapper { transform-origin: 130px 0px; will-change: transform; }
    .lamp-wrapper.phase-idle { animation: lampIdleSway 4.5s ease-in-out infinite; }
    .lamp-wrapper.phase-pushed { animation: lampPushSwing 3.5s cubic-bezier(0.45, 0, 0.55, 1) forwards; }
    .lamp-wrapper.phase-flickering,
    .lamp-wrapper.phase-settled { transform: rotate(0deg); }

    .signin-btn {
      position: relative;
      overflow: hidden;
      background: linear-gradient(to right, #e11d48, #f43f5e, #fb7185, #f43f5e, #e11d48);
      background-size: 200% 100%;
      animation: btnLightMove 3.5s linear infinite, btnPulse 2.5s ease-in-out infinite;
    }
    .signin-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
      animation: btnLightMove 3s linear infinite;
      pointer-events: none;
    }
  `

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen w-full flex items-center justify-center bg-[#080808] p-4 relative overflow-hidden">
      <style>{customStyles}</style>

      {/* 🌐 زر تبديل اللغة أعلى الصفحة */}
      <div className={`absolute top-6 ${language === 'ar' ? 'right-6' : 'left-6'} z-50`}>
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:border-rose-500 hover:bg-rose-500/10 transition-all group cursor-pointer"
        >
          <LanguagesIcon size={16} className="text-zinc-400 group-hover:text-rose-400 transition-colors" />
          <span className="text-xs font-black uppercase tracking-wider text-zinc-300 group-hover:text-white transition-colors">
            {language === 'ar' ? 'English' : 'العربية'}
          </span>
        </button>
      </div>

      {/* 🌌 الخلفية */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 60% 50% at 15% 20%, rgba(220,38,38,0.16) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 85% 80%, rgba(244,63,94,0.12) 0%, transparent 55%),
          radial-gradient(ellipse 40% 40% at 85% 15%, rgba(190,24,93,0.1) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 10% 85%, rgba(220,38,38,0.1) 0%, transparent 60%)
        `
      }} />

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
        `,
        backgroundSize: '70px 70px'
      }} />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] opacity-[0.055] animate-bg-rotate pointer-events-none">
        <svg viewBox="0 0 200 200" fill="none" stroke="#f43f5e" strokeWidth="0.5">
          <circle cx="100" cy="100" r="95" />
          <circle cx="100" cy="100" r="80" strokeDasharray="2 4" />
          <circle cx="100" cy="100" r="65" />
          <circle cx="100" cy="100" r="50" strokeDasharray="1 3" />
          <circle cx="100" cy="100" r="35" />
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i * 15) * Math.PI / 180
            return <line key={i} x1={100 + 35 * Math.cos(a)} y1={100 + 35 * Math.sin(a)} x2={100 + 95 * Math.cos(a)} y2={100 + 95 * Math.sin(a)} />
          })}
        </svg>
      </div>

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-rose-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* البطاقة */}
      <div className={`relative z-10 w-full ${isSignup ? 'max-w-5xl' : 'max-w-4xl'} bg-[#0d0d0d]/95 backdrop-blur-2xl rounded-[2.5rem] border border-rose-500/15 shadow-[0_0_100px_rgba(244,63,94,0.15),0_0_40px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col lg:flex-row transition-all duration-700`}>

        {/* ============ LEFT PANEL ============ */}
        <div className={`hidden lg:flex w-[40%] relative flex-col items-center justify-center bg-gradient-to-b from-[#1a0808] to-[#0a0404] min-h-[680px] overflow-hidden`}>
          <div className="absolute inset-0 opacity-[0.05]" style={{
            backgroundImage: 'radial-gradient(circle at 50% 100%, rgba(244,63,94,0.9) 0%, transparent 70%)'
          }} />

          {/* 🪢 حبل السحب */}
          <div className="absolute top-0 z-40" style={{ left: '62%' }}>
            <div className="animate-cord-swing">
              <svg width="60" height="220" viewBox="0 0 60 220" className="overflow-visible">
                <defs>
                  <linearGradient id="cordBall" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#18181b" />
                    <stop offset="40%" stopColor="#52525b" />
                    <stop offset="60%" stopColor="#a1a1aa" />
                    <stop offset="100%" stopColor="#27272a" />
                  </linearGradient>
                </defs>

                <circle cx="30" cy="3" r="3.5" fill="#18181b" stroke="#52525b" strokeWidth="0.8" style={{ pointerEvents: 'none' }} />
                <circle cx="30" cy="3" r="1.5" fill="#a1a1aa" opacity="0.6" style={{ pointerEvents: 'none' }} />

                <line x1="30" y1="6" x2="30" y2={100 + pullY} stroke="#3f3f46" strokeWidth="2" style={{ pointerEvents: 'none' }} />
                <line x1="30.5" y1="6" x2="30.5" y2={100 + pullY} stroke="#0a0a0a" strokeWidth="0.5" opacity="0.5" style={{ pointerEvents: 'none' }} />

                <circle
                  cx="30"
                  cy={108 + pullY}
                  r="26"
                  fill="rgba(0,0,0,0.001)"
                  style={{ cursor: 'grab', touchAction: 'none', userSelect: 'none', pointerEvents: 'all' }}
                  onMouseDown={handlePullStart}
                  onTouchStart={handlePullStart}
                />

                <circle cx="30" cy={108 + pullY} r="9" fill="url(#cordBall)" stroke="#0a0a0a" strokeWidth="0.8" style={{ pointerEvents: 'none' }} />
                <circle cx="30" cy={108 + pullY} r="4.5" fill="#a1a1aa" opacity="0.85" style={{ pointerEvents: 'none' }} />
                <circle cx="28" cy={106 + pullY} r="1.8" fill="#ffffff" opacity="0.9" style={{ pointerEvents: 'none' }} />
              </svg>
            </div>
          </div>

          {/* 💡 المصباح */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className={`lamp-wrapper phase-${introPhase} pointer-events-auto`} style={{ transformOrigin: '130px 0px' }}>
              <svg width="180" height="270" viewBox="0 0 260 380" className="overflow-visible">
                <defs>
                  <linearGradient id="shadeMetal" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3f3f46" />
                    <stop offset="20%" stopColor="#52525b" />
                    <stop offset="50%" stopColor="#71717a" />
                    <stop offset="80%" stopColor="#52525b" />
                    <stop offset="100%" stopColor="#27272a" />
                  </linearGradient>
                  <linearGradient id="shadeShine2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                    <stop offset="15%" stopColor="rgba(255,255,255,0.22)" />
                    <stop offset="35%" stopColor="rgba(255,255,255,0.05)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </linearGradient>
                  <linearGradient id="shadeInner" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0a0a0a" />
                    <stop offset="100%" stopColor="#18181b" />
                  </linearGradient>
                  <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fff" stopOpacity={actuallyOn ? '1' : '0'} />
                    <stop offset="20%" stopColor="#fff1f2" stopOpacity={actuallyOn ? '0.9' : '0'} />
                    <stop offset="50%" stopColor="#fda4af" stopOpacity={actuallyOn ? '0.5' : '0'} />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="connMetal" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#18181b" />
                    <stop offset="40%" stopColor="#52525b" />
                    <stop offset="60%" stopColor="#71717a" />
                    <stop offset="100%" stopColor="#18181b" />
                  </linearGradient>
                </defs>

                <line x1="130" y1="0" x2="130" y2="68" stroke="#27272a" strokeWidth="2" />
                <line x1="130.5" y1="0" x2="130.5" y2="68" stroke="#0a0a0a" strokeWidth="0.5" opacity="0.5" />

                <rect x="118" y="62" width="24" height="30" rx="2" fill="url(#connMetal)" stroke="#0a0a0a" strokeWidth="0.5" />
                <line x1="118" y1="72" x2="142" y2="72" stroke="#0a0a0a" strokeWidth="0.6" opacity="0.5" />
                <line x1="118" y1="82" x2="142" y2="82" stroke="#0a0a0a" strokeWidth="0.6" opacity="0.5" />
                <ellipse cx="130" cy="62" rx="12" ry="2" fill="#0a0a0a" />

                <path
                  d="M 118 90 L 142 90 L 218 205 Q 130 220 42 205 Z"
                  fill="url(#shadeMetal)"
                  stroke={actuallyOn ? '#fb7185' : '#3f3f46'}
                  strokeWidth="1"
                />

                <path d="M 122 90 L 132 90 L 90 205 L 60 205 Z" fill="url(#shadeShine2)" />

                <ellipse cx="130" cy="205" rx="88" ry="9" fill="url(#shadeInner)" />
                <ellipse cx="130" cy="205" rx="88" ry="9" fill="none" stroke="#52525b" strokeWidth="1.5" />
                <ellipse cx="130" cy="206" rx="85" ry="7" fill="#0a0a0a" />

                <ellipse cx="130" cy="207" rx="20" ry="4" fill={actuallyOn ? '#881337' : '#18181b'} />
                <ellipse cx="130" cy="210" rx="13" ry="12" fill={actuallyOn ? '#fff1f2' : '#3f3f46'} className={actuallyOn ? 'animate-bulb' : ''} />
                {actuallyOn && <ellipse cx="130" cy="210" rx="13" ry="12" fill="#fecdd3" opacity="0.7" />}
                {actuallyOn && <circle cx="130" cy="209" r="5" fill="#ffffff" />}

                {actuallyOn && <circle cx="130" cy="210" r="90" fill="url(#bulbGlow)" />}

                {actuallyOn && (
                  <>
                    <circle cx="80" cy="200" r="1.5" fill="#fecdd3" opacity="0.9" className="animate-sparkle" />
                    <circle cx="180" cy="195" r="1.5" fill="#fecdd3" opacity="0.9" className="animate-sparkle" style={{ animationDelay: '0.8s' }} />
                    <circle cx="130" cy="240" r="1.5" fill="#fecdd3" opacity="0.7" className="animate-sparkle" style={{ animationDelay: '1.5s' }} />
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* أشعة الضوء */}
          {actuallyOn && (
            <>
              <div className="absolute top-[180px] left-1/2 -translate-x-1/2 w-[220px] h-[100px] bg-rose-400/25 blur-3xl rounded-full animate-beam-pulse pointer-events-none"></div>
              <div className="absolute top-[200px] left-1/2 -translate-x-1/2 w-[340px] h-[400px] animate-light-ray pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(251,113,133,0.45) 0%, rgba(244,63,94,0.15) 60%, transparent 100%)',
                  clipPath: 'polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)',
                  filter: 'blur(16px)'
                }} />
              <div className="absolute top-[200px] left-1/2 -translate-x-1/2 w-[260px] h-[380px] animate-beam-pulse pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(254,205,211,0.5) 0%, rgba(251,113,133,0.2) 55%, transparent 100%)',
                  clipPath: 'polygon(47% 0%, 53% 0%, 100% 100%, 0% 100%)',
                  filter: 'blur(7px)'
                }} />
              <div className="absolute top-[200px] left-1/2 -translate-x-1/2 w-[160px] h-[350px] animate-beam-pulse pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, rgba(255,241,242,0.65) 0%, rgba(254,205,211,0.3) 50%, transparent 100%)',
                  clipPath: 'polygon(48% 0%, 52% 0%, 100% 100%, 0% 100%)',
                  filter: 'blur(4px)'
                }} />

              {Array.from({ length: 20 }).map((_, i) => {
                const left = 40 + ((i * 7) % 22)
                const top = 40 + ((i * 11) % 30)
                const size = 1.5 + (i % 3) * 0.7
                const duration = 4.5 + (i % 4) * 1
                const delay = (i * 0.4) % 4
                return (
                  <div key={i} className="absolute rounded-full pointer-events-none"
                    style={{
                      left: `${left}%`, top: `${top}%`,
                      width: `${size}px`, height: `${size}px`,
                      background: '#fecdd3',
                      boxShadow: '0 0 10px rgba(251,113,133,1), 0 0 4px rgba(255,241,242,1)',
                      animation: `dustFloat ${duration}s linear infinite`,
                      animationDelay: `${delay}s`,
                    }} />
                )
              })}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[340px] h-[100px] bg-rose-500/15 blur-3xl rounded-full pointer-events-none"></div>
            </>
          )}

          {/* 🤖 الروبوت */}
          <div className={`relative mt-auto mb-12 z-20 transition-all duration-700 ${actuallyOn ? '' : 'opacity-55 grayscale'}`}>
            <div className={`${actuallyOn ? 'animate-float' : ''}`}>
              <div className={`${actuallyOn ? 'animate-breathe' : ''}`}
                style={{ transform: `rotate(${bodyTilt}deg)`, transition: 'transform 0.6s ease' }}>
                <svg width="230" height="240" viewBox="0 0 230 240" xmlns="http://www.w3.org/2000/svg"
                  className={actuallyOn ? 'animate-glow' : ''}>
                  <defs>
                    <radialGradient id="headBody" cx="50%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#fff7f9" />
                      <stop offset="40%" stopColor="#fecdd3" />
                      <stop offset="75%" stopColor="#fda4af" />
                      <stop offset="100%" stopColor="#be123c" />
                    </radialGradient>
                    <linearGradient id="roseGold" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#fecdd3" />
                      <stop offset="35%" stopColor="#fb7185" />
                      <stop offset="70%" stopColor="#e11d48" />
                      <stop offset="100%" stopColor="#881337" />
                    </linearGradient>
                    <radialGradient id="faceVelvet" cx="50%" cy="45%" r="60%">
                      <stop offset="0%" stopColor="#2a0510" />
                      <stop offset="60%" stopColor="#1a0308" />
                      <stop offset="100%" stopColor="#0a0204" />
                    </radialGradient>
                    <radialGradient id="robotHalo" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity="0.45" />
                      <stop offset="55%" stopColor="#f43f5e" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="irisBlue" cx="50%" cy="45%" r="60%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="25%" stopColor="#bae6fd" />
                      <stop offset="55%" stopColor="#38bdf8" />
                      <stop offset="85%" stopColor="#0284c7" />
                      <stop offset="100%" stopColor="#0c4a6e" />
                    </radialGradient>
                    <radialGradient id="eyeWhite" cx="50%" cy="40%" r="60%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#f0f9ff" />
                    </radialGradient>
                    <linearGradient id="headphoneBand" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="50%" stopColor="#9f1239" />
                      <stop offset="100%" stopColor="#4c0519" />
                    </linearGradient>
                    <linearGradient id="cupGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#fda4af" />
                      <stop offset="45%" stopColor="#9f1239" />
                      <stop offset="100%" stopColor="#4c0519" />
                    </linearGradient>
                    <linearGradient id="crownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#fff1f2" />
                      <stop offset="50%" stopColor="#fda4af" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                  </defs>

                  <circle cx="115" cy="120" r="108" fill="url(#robotHalo)" />

                  <g>
                    <line x1="115" y1="42" x2="115" y2="22" stroke="#fb7185" strokeWidth="2" strokeLinecap="round" />
                    <g transform="translate(115, 16)">
                      <path d="M 0 -8 L 2 -2 L 8 0 L 2 2 L 0 8 L -2 2 L -8 0 L -2 -2 Z"
                        fill="url(#crownGrad)" opacity={actuallyOn ? '1' : '0.4'} />
                    </g>
                    {actuallyOn && (
                      <circle cx="115" cy="16" r="10" fill="#fb7185" opacity="0.3" className="animate-pulse" />
                    )}
                  </g>

                  <path d="M 38 100 Q 115 15 192 100" stroke="url(#headphoneBand)" strokeWidth="11" fill="none" strokeLinecap="round" />
                  <path d="M 38 100 Q 115 22 192 100" stroke="#fda4af" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.55" />

                  <ellipse cx="32" cy="125" rx="19" ry="28" fill="url(#cupGrad)" stroke="#fb7185" strokeWidth="1.3" />
                  <ellipse cx="32" cy="125" rx="12" ry="20" fill="#1a0308" />
                  <ellipse cx="32" cy="125" rx="12" ry="20" fill="none" stroke="#fb7185" strokeWidth="0.7" opacity="0.7" />
                  <circle cx="32" cy="125" r="3.5" fill={actuallyOn ? '#fb7185' : '#3f3f46'} className={actuallyOn ? 'animate-pulse' : ''} />

                  <ellipse cx="198" cy="125" rx="19" ry="28" fill="url(#cupGrad)" stroke="#fb7185" strokeWidth="1.3" />
                  <ellipse cx="198" cy="125" rx="12" ry="20" fill="#1a0308" />
                  <ellipse cx="198" cy="125" rx="12" ry="20" fill="none" stroke="#fb7185" strokeWidth="0.7" opacity="0.7" />
                  <circle cx="198" cy="125" r="3.5" fill={actuallyOn ? '#fb7185' : '#3f3f46'} className={actuallyOn ? 'animate-pulse' : ''} />

                  <circle cx="115" cy="128" r="72" fill="url(#headBody)" stroke="#fda4af" strokeWidth="1" />
                  <ellipse cx="90" cy="82" rx="32" ry="14" fill="#ffffff" opacity="0.55" />
                  <circle cx="115" cy="128" r="65" fill="none" stroke="url(#roseGold)" strokeWidth="2.5" opacity={actuallyOn ? '1' : '0.5'} />
                  <circle cx="115" cy="132" r="55" fill="url(#faceVelvet)" />

                  <path d="M 75 105 Q 95 88 125 92" stroke="#fda4af" strokeWidth="1.8" fill="none" opacity="0.25" strokeLinecap="round" />

                  <g className="animate-blink">
                    <path d="M 76 108 Q 92 100 108 108" stroke="#4c0519" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                    <path d="M 75 112 L 71 109" stroke="#4c0519" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M 109 112 L 113 109" stroke="#4c0519" strokeWidth="1.8" strokeLinecap="round" />
                    <ellipse cx="92" cy="122" rx="15" ry="17" fill="url(#eyeWhite)" />
                    <ellipse cx="92" cy="122" rx="15" ry="17" fill="none" stroke="#fb7185" strokeWidth="0.8" opacity="0.6" />
                    <g className={actuallyOn ? 'animate-eye-blue' : ''}
                       style={{ transform: `translate(${eyeLook.x}px, ${eyeLook.y}px)`, transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                      <circle cx="92" cy="123" r="9" fill="url(#irisBlue)" />
                      <circle cx="92" cy="123" r="4.5" fill="#0c2a4a" />
                      <circle cx="94.8" cy="119" r="2.8" fill="#ffffff" />
                      <circle cx="88.5" cy="119.5" r="1.3" fill="#ffffff" opacity="0.9" />
                      <circle cx="92" cy="127.5" r="1" fill="#ffffff" opacity="0.65" />
                    </g>
                  </g>

                  <g className="animate-blink-r">
                    <path d="M 122 108 Q 138 100 154 108" stroke="#4c0519" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                    <path d="M 121 112 L 117 109" stroke="#4c0519" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M 155 112 L 159 109" stroke="#4c0519" strokeWidth="1.8" strokeLinecap="round" />
                    <ellipse cx="138" cy="122" rx="15" ry="17" fill="url(#eyeWhite)" />
                    <ellipse cx="138" cy="122" rx="15" ry="17" fill="none" stroke="#fb7185" strokeWidth="0.8" opacity="0.6" />
                    <g className={actuallyOn ? 'animate-eye-blue' : ''}
                       style={{ transform: `translate(${eyeLook.x}px, ${eyeLook.y}px)`, transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                      <circle cx="138" cy="123" r="9" fill="url(#irisBlue)" />
                      <circle cx="138" cy="123" r="4.5" fill="#0c2a4a" />
                      <circle cx="140.8" cy="119" r="2.8" fill="#ffffff" />
                      <circle cx="134.5" cy="119.5" r="1.3" fill="#ffffff" opacity="0.9" />
                      <circle cx="138" cy="127.5" r="1" fill="#ffffff" opacity="0.65" />
                    </g>
                  </g>

                  <path d="M 78 98 Q 92 90 105 98" stroke="#fda4af" strokeWidth="2.3" fill="none" strokeLinecap="round" opacity="0.9" />
                  <path d="M 125 98 Q 138 90 152 98" stroke="#fda4af" strokeWidth="2.3" fill="none" strokeLinecap="round" opacity="0.9" />

                  <path d="M 92 152 Q 115 172 138 152" stroke="#fda4af" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path d="M 96 155 Q 115 168 134 155" stroke="#fb7185" strokeWidth="1" fill="none" opacity="0.7" />

                  <ellipse cx="78" cy="145" rx="9" ry="5.5" fill="#fb7185" opacity="0.42" />
                  <ellipse cx="152" cy="145" rx="9" ry="5.5" fill="#fb7185" opacity="0.42" />

                  <circle cx="60" cy="95" r="2.2" fill="#fda4af" stroke="#4c0519" strokeWidth="0.5" />
                  <circle cx="170" cy="95" r="2.2" fill="#fda4af" stroke="#4c0519" strokeWidth="0.5" />
                  <circle cx="60" cy="165" r="2.2" fill="#fda4af" stroke="#4c0519" strokeWidth="0.5" />
                  <circle cx="170" cy="165" r="2.2" fill="#fda4af" stroke="#4c0519" strokeWidth="0.5" />

                  {actuallyOn && (
                    <>
                      <g style={{ animation: 'musicNote 2.6s ease-out infinite' }}>
                        <text x="205" y="90" fill="#fb7185" fontSize="16" fontWeight="bold">♪</text>
                      </g>
                      <g style={{ animation: 'musicNote 2.6s ease-out infinite', animationDelay: '0.9s' }}>
                        <text x="10" y="95" fill="#fda4af" fontSize="13" fontWeight="bold">♫</text>
                      </g>
                      <g style={{ animation: 'musicNote 2.6s ease-out infinite', animationDelay: '1.6s' }}>
                        <text x="210" y="75" fill="#fecdd3" fontSize="12" fontWeight="bold">♪</text>
                      </g>
                    </>
                  )}

                  {actuallyOn && (
                    <>
                      <circle cx="25" cy="70" r="1.5" fill="#fecdd3" opacity="0.85" className="animate-sparkle" />
                      <circle cx="205" cy="65" r="1.5" fill="#fecdd3" opacity="0.85" className="animate-sparkle" style={{ animationDelay: '1s' }} />
                      <circle cx="18" cy="195" r="1.2" fill="#fda4af" opacity="0.75" className="animate-sparkle" style={{ animationDelay: '1.8s' }} />
                      <circle cx="212" cy="190" r="1.2" fill="#fda4af" opacity="0.75" className="animate-sparkle" style={{ animationDelay: '0.5s' }} />
                    </>
                  )}
                </svg>
              </div>
            </div>
          </div>

          <p className="absolute bottom-8 text-[10px] text-rose-400/40 font-medium tracking-widest uppercase">{texts.secureFast}</p>
        </div>

        {/* ============ RIGHT PANEL: FORM ============ */}
        <div className="w-full lg:w-[60%] p-6 sm:p-10 flex flex-col justify-center">
          <div className="mb-8 text-left" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
              {isLogin ? (
                <>{texts.loginTitle.split(' ')[0]} <span className="text-rose-500">{texts.loginTitle.split(' ')[1] || ''}</span></>
              ) : (
                <>{texts.signupTitle.split(' ')[0]} <span className="text-rose-500">{texts.signupTitle.split(' ').slice(1).join(' ') || ''}</span></>
              )}
            </h1>
            <p className="text-xs text-zinc-500">
              {isLogin ? texts.loginSub : texts.signupSub}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4"
            onFocus={() => setIsFormFocused(true)}
            onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFormFocused(false) }}
          >
            {isSignup && (
              <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">{texts.firstName}</label>
                    <div className="relative">
                      <span className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center text-zinc-500`}><User size={16} /></span>
                      <input type="text" value={firstName}
                        onChange={(e) => { setFirstName(e.target.value); clearError('firstName') }}
                        placeholder={language === 'ar' ? 'أحمد' : 'Ahmed'}
                        className={`w-full bg-[#1a0a10] border rounded-xl py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all ${
                          language === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'
                        } ${
                          errors.firstName ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-rose-500/20 focus:border-rose-400'
                        }`} />
                    </div>
                    {errors.firstName && <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold"><AlertCircle size={12} />{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">{texts.lastName}</label>
                    <div className="relative">
                      <span className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center text-zinc-500`}><User size={16} /></span>
                      <input type="text" value={lastName}
                        onChange={(e) => { setLastName(e.target.value); clearError('lastName') }}
                        placeholder={language === 'ar' ? 'العشين' : 'Alshin'}
                        className={`w-full bg-[#1a0a10] border rounded-xl py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all ${
                          language === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'
                        } ${
                          errors.lastName ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-rose-500/20 focus:border-rose-400'
                        }`} />
                    </div>
                    {errors.lastName && <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold"><AlertCircle size={12} />{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">{texts.country}</label>
                    <div className="relative">
                      <span className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center text-zinc-500 pointer-events-none`}><Globe size={16} /></span>
                      <select value={country} onChange={(e) => setCountry(e.target.value)}
                        className={`w-full bg-[#1a0a10] border border-rose-500/20 rounded-xl py-3 text-sm text-white focus:outline-none focus:border-rose-400 transition-all cursor-pointer appearance-none ${
                          language === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'
                        }`}>
                        {(language === 'ar' ? countriesAr : countries).map((c) => <option key={c} value={c} className="bg-[#1a0a10] text-white">{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">{texts.phone}</label>
                    <div className={`flex items-center bg-[#1a0a10] border rounded-xl overflow-hidden transition-all ${
                      errors.phone ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-rose-500/20 focus-within:border-rose-400'
                    }`} dir="ltr">
                      <div className="flex items-center gap-1 px-3 py-3 bg-rose-500/5 border-r border-rose-500/20">
                        <Phone size={14} className="text-rose-400" />
                        <span className="text-sm font-bold text-rose-300 min-w-[42px] text-center">{phoneCode}</span>
                      </div>
                      <input type="tel" value={phone}
                        onChange={(e) => { const val = e.target.value.replace(/[^\d\s]/g, ''); setPhone(val); clearError('phone') }}
                        placeholder="555 000 0000"
                        className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none" />
                    </div>
                    {errors.phone && <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold"><AlertCircle size={12} />{errors.phone}</p>}
                  </div>
                </div>
              </div>
            )}

            <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">{texts.email}</label>
              <GlowInput
                icon={<Mail size={16} />}
                type="email"
                value={email}
                onChange={(v) => { setEmail(v); clearError('email') }}
                placeholder="name@example.com"
                error={errors.email}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider">{texts.password}</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => navigate('/reset-password')}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:underline transition-colors uppercase tracking-wider"
                  >
                    {texts.forgotPassword}
                  </button>
                )}
              </div>
              <GlowInput
                icon={<Lock size={16} />}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(v) => { setPassword(v); clearError('password') }}
                placeholder="••••••••"
                error={errors.password}
                isPassword
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            <button type="submit" disabled={loading}
              className={`signin-btn w-full mt-6 text-white font-black py-4 rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer tracking-wider ${
                language === 'ar' ? 'flex-row-reverse' : 'flex-row'
              }`}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isLogin ? texts.btnSignin : texts.btnSignup}</span>
                  <ArrowRight size={18} className={`transition-transform ${language === 'ar' ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1 rotate-180'}`} />
                </>
              )}
            </button>
          </form>

          {/* الفاصل + السوشيال */}
          <div className="flex items-center my-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex-1 h-[1px] bg-rose-500/15"></div>
            <span className="px-3 text-zinc-500 text-xs">{texts.or}</span>
            <div className="flex-1 h-[1px] bg-rose-500/15"></div>
          </div>

          <div className="flex gap-3" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* 🎯 زر Google */}
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={loading}
              className="flex-1 bg-[#1a0a10] border border-rose-500/20 rounded-xl py-2.5 flex items-center justify-center gap-2 text-white text-xs font-bold hover:border-rose-400 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>

            {/* 🎯 زر Facebook */}
            <button
              type="button"
              onClick={() => handleOAuth('facebook')}
              disabled={loading}
              className="flex-1 bg-[#1a0a10] border border-rose-500/20 rounded-xl py-2.5 flex items-center justify-center gap-2 text-white text-xs font-bold hover:border-rose-400 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          <p className="text-center text-[11px] text-zinc-500 mt-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {isLogin ? texts.noAccount : texts.haveAccount}
            <button type="button" onClick={() => switchMode(isLogin ? 'signup' : 'login')}
              className="text-rose-400 hover:underline font-bold cursor-pointer">
              {isLogin ? texts.createAccount : texts.loginLink}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}