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
            background: `linear-gradient(90deg, transparent 0%, transparent 35%, ${error ? '#f43f5e' : '#fb7185'} 45%, #fff1f2 50%, ${error ? '#f43f5e' : '#fb7185'} 55%, transparent 65%, transparent 100%)`,
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
      toast.error(error.message?.includes('provider is not enabled') ? `${provider} غير مُفعَّل` : 'فشل الاتصال.')
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
        if (error) throw new Error(language === 'ar' ? 'بيانات غير صحيحة ❌' : 'Invalid credentials ❌')
        if (!data.session) throw new Error('Error creating session.')
        toast.success(language === 'ar' ? 'مرحباً بك مجدداً! 🎉' : 'Welcome back! 🎉')
        setTimeout(() => { navigate(from, { replace: true }) }, 600)
        return
      }

      const fullPhone = `${phoneCode}${phone.replace(/\s/g, '')}`
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: { data: { first_name: firstName.trim(), last_name: lastName.trim(), country: country, phone: fullPhone } }
      })

      if (authError) throw authError
      toast.success(language === 'ar' ? 'تم إنشاء الحساب بنجاح! 🎉' : 'Account created successfully! 🎉')
      if (authData.session) setTimeout(() => { navigate(from, { replace: true }) }, 600)
      else setMode('login')

    } catch (error: any) {
      toast.error(error.message || 'Error occurred')
    } finally { setLoading(false) }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setErrors({})
    if (newMode !== 'login') setPassword('')
  }

  const eyeLook = isFormFocused ? { x: -5.5, y: 2 } : { x: -3.5, y: 0.5 }
  const bodyTilt = isFormFocused ? -3 : 0

  const customStyles = `
    @keyframes lampIdleSway { 0%, 100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }
    @keyframes lampPushSwing { 0% { transform: rotate(-1.5deg); } 10% { transform: rotate(12deg); } 26% { transform: rotate(-10deg); } 100% { transform: rotate(0deg); } }
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
    @keyframes dustFloat { 0% { transform: translateY(0) translateX(0); opacity: 0; } 15% { opacity: 0.9; } 85% { opacity: 0.9; } 100% { transform: translateY(-260px) translateX(14px); opacity: 0; } }
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
    .lamp-wrapper.phase-flickering, .lamp-wrapper.phase-settled { transform: rotate(0deg); }

    .signin-btn {
      position: relative; overflow: hidden;
      background: linear-gradient(to right, #e11d48, #f43f5e, #fb7185, #f43f5e, #e11d48);
      background-size: 200% 100%;
      animation: btnLightMove 3.5s linear infinite, btnPulse 2.5s ease-in-out infinite;
    }
    .signin-btn::before {
      content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
      animation: btnLightMove 3s linear infinite; pointer-events: none;
    }
  `

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen w-full flex items-center justify-center bg-[#080808] p-4 relative overflow-hidden">
      <style>{customStyles}</style>

      {/* 🌐 زر تبديل اللغة */}
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

      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 60% 50% at 15% 20%, rgba(220,38,38,0.16) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 85% 80%, rgba(244,63,94,0.12) 0%, transparent 55%)`
      }} />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`, backgroundSize: '70px 70px'
      }} />

      <div className={`relative z-10 w-full ${isSignup ? 'max-w-5xl' : 'max-w-4xl'} bg-[#0d0d0d]/95 backdrop-blur-2xl rounded-[2.5rem] border border-rose-500/15 shadow-[0_0_100px_rgba(244,63,94,0.15)] overflow-hidden flex flex-col lg:flex-row transition-all duration-700`}>
        {/* LEFT PANEL */}
        <div className="hidden lg:flex w-[40%] relative flex-col items-center justify-center bg-gradient-to-b from-[#1a0808] to-[#0a0404] min-h-[680px] overflow-hidden">
          <div className="absolute top-0 z-40" style={{ left: '62%' }}>
            <div className="animate-cord-swing">
              <svg width="60" height="220" viewBox="0 0 60 220" className="overflow-visible">
                <line x1="30" y1="6" x2="30" y2={100 + pullY} stroke="#3f3f46" strokeWidth="2" />
                <circle cx="30" cy={108 + pullY} r="26" fill="rgba(0,0,0,0.001)" style={{ cursor: 'grab' }} onMouseDown={handlePullStart} onTouchStart={handlePullStart} />
                <circle cx="30" cy={108 + pullY} r="9" fill="#52525b" />
              </svg>
            </div>
          </div>
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className={`lamp-wrapper phase-${introPhase} pointer-events-auto`} style={{ transformOrigin: '130px 0px' }}>
              <svg width="180" height="270" viewBox="0 0 260 380" className="overflow-visible">
                <path d="M 118 90 L 142 90 L 218 205 Q 130 220 42 205 Z" fill="#3f3f46" stroke={actuallyOn ? '#fb7185' : '#3f3f46'} strokeWidth="1" />
                <ellipse cx="130" cy="205" rx="88" ry="9" fill="#0a0a0a" />
                <ellipse cx="130" cy="210" rx="13" ry="12" fill={actuallyOn ? '#fff1f2' : '#3f3f46'} className={actuallyOn ? 'animate-bulb' : ''} />
              </svg>
            </div>
          </div>

          <div className={`relative mt-auto mb-12 z-20 transition-all duration-700 ${actuallyOn ? '' : 'opacity-55 grayscale'}`}>
            <div className={`${actuallyOn ? 'animate-float' : ''}`}>
              <div className={`${actuallyOn ? 'animate-breathe' : ''}`} style={{ transform: `rotate(${bodyTilt}deg)` }}>
                <svg width="230" height="240" viewBox="0 0 230 240">
                  <circle cx="115" cy="120" r="108" fill="rgba(244,63,94,0.18)" />
                  <circle cx="115" cy="128" r="72" fill="#fecdd3" />
                  <circle cx="115" cy="132" r="55" fill="#1a0308" />
                  
                  <g className="animate-blink">
                    <ellipse cx="92" cy="122" rx="15" ry="17" fill="#ffffff" />
                    <circle cx="92" cy="123" r="9" fill="#38bdf8" />
                  </g>
                  <g className="animate-blink-r">
                    <ellipse cx="138" cy="122" rx="15" ry="17" fill="#ffffff" />
                    <circle cx="138" cy="123" r="9" fill="#38bdf8" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
          <p className="absolute bottom-8 text-[10px] text-rose-400/40 uppercase">{texts.secureFast}</p>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[60%] p-6 sm:p-10 flex flex-col justify-center">
          <div className="mb-8 text-left" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
              {isLogin ? (
                <>{texts.loginTitle.split(' ')[0]} <span className="text-rose-500">{texts.loginTitle.split(' ')[1] || ''}</span></>
              ) : (
                <>{texts.signupTitle.split(' ')[0]} <span className="text-rose-500">{texts.signupTitle.split(' ').slice(1).join(' ') || ''}</span></>
              )}
            </h1>
            <p className="text-xs text-zinc-500">{isLogin ? texts.loginSub : texts.signupSub}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4" onFocus={() => setIsFormFocused(true)} onBlur={() => setIsFormFocused(false)}>
            {isSignup && (
              <div className="space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">{texts.firstName}</label>
                    <div className="relative">
                      <span className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center text-zinc-500`}><User size={16} /></span>
                      <input type="text" value={firstName} onChange={(e) => { setFirstName(e.target.value); clearError('firstName') }} placeholder={language === 'ar' ? 'أحمد' : 'Ahmed'} className={`w-full bg-[#1a0a10] border rounded-xl py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all ${language === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} ${errors.firstName ? 'border-rose-500' : 'border-rose-500/20'}`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">{texts.lastName}</label>
                    <div className="relative">
                      <span className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center text-zinc-500`}><User size={16} /></span>
                      <input type="text" value={lastName} onChange={(e) => { setLastName(e.target.value); clearError('lastName') }} placeholder={language === 'ar' ? 'العشين' : 'Alshin'} className={`w-full bg-[#1a0a10] border rounded-xl py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all ${language === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} ${errors.lastName ? 'border-rose-500' : 'border-rose-500/20'}`} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">{texts.country}</label>
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className={`w-full bg-[#1a0a10] border border-rose-500/20 rounded-xl py-3 text-sm text-white focus:outline-none focus:border-rose-400 transition-all ${language === 'ar' ? 'pr-4 pl-4' : 'pl-4 pr-4'}`}>
                      {(language === 'ar' ? countriesAr : countries).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">{texts.phone}</label>
                    <div className="flex items-center bg-[#1a0a10] border border-rose-500/20 rounded-xl overflow-hidden" dir="ltr">
                      <div className="px-3 py-3 bg-rose-500/5 border-r border-rose-500/20"><span className="text-sm font-bold text-rose-300">{phoneCode}</span></div>
                      <input type="tel" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/[^\d]/g, '')); clearError('phone') }} placeholder="555 000 0000" className="flex-1 bg-transparent px-4 py-3 text-sm text-white focus:outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">{texts.email}</label>
              <GlowInput icon={<Mail size={16} />} type="email" value={email} onChange={(v) => { setEmail(v); clearError('email') }} placeholder="name@example.com" error={errors.email} dir={language === 'ar' ? 'rtl' : 'ltr'} />
            </div>

            <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider">{texts.password}</label>
                {isLogin && <button type="button" onClick={() => navigate('/reset-password')} className="text-[10px] font-bold text-rose-400 hover:underline">{texts.forgotPassword}</button>}
              </div>
              <GlowInput icon={<Lock size={16} />} type={showPassword ? 'text' : 'password'} value={password} onChange={(v) => { setPassword(v); clearError('password') }} placeholder="••••••••" error={errors.password} isPassword showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} dir={language === 'ar' ? 'rtl' : 'ltr'} />
            </div>

            <button type="submit" disabled={loading} className={`signin-btn w-full mt-6 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 group ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><span>{isLogin ? texts.btnSignin : texts.btnSignup}</span><ArrowRight size={18} className={`transition-transform ${language === 'ar' ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1 rotate-180'}`} /></>}
            </button>
          </form>

          <div className="flex items-center my-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <div className="flex-1 h-[1px] bg-rose-500/15"></div><span className="px-3 text-zinc-500 text-xs">{texts.or}</span><div className="flex-1 h-[1px] bg-rose-500/15"></div>
          </div>

          <div className="flex gap-3" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <button type="button" onClick={() => handleOAuth('google')} disabled={loading} className="flex-1 bg-[#1a0a10] border border-rose-500/20 rounded-xl py-2.5 flex items-center justify-center gap-2 text-white text-xs font-bold hover:border-rose-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Google
            </button>
            <button type="button" onClick={() => handleOAuth('facebook')} disabled={loading} className="flex-1 bg-[#1a0a10] border border-rose-500/20 rounded-xl py-2.5 flex items-center justify-center gap-2 text-white text-xs font-bold hover:border-rose-400">
              <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Facebook
            </button>
          </div>

          <p className="text-center text-[11px] text-zinc-500 mt-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {isLogin ? texts.noAccount : texts.haveAccount}
            <button type="button" onClick={() => switchMode(isLogin ? 'signup' : 'login')} className="text-rose-400 hover:underline font-bold">
              {isLogin ? texts.createAccount : texts.loginLink}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}