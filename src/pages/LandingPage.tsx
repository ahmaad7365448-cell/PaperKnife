import React from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Shield, Zap, Layers, PenTool, Lock, ArrowLeft,
  CheckCircle2, Sparkles, Image as ImageIcon, Scissors,
  FileOutput, FileSearch, Fingerprint, ChevronLeft, Heart, Languages as LanguagesIcon
} from 'lucide-react'
import { useLanguage } from '../LanguageContext'

export default function LandingPage() {
  const { t, isRTL, language, toggleLanguage } = useLanguage()

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#050505] text-white font-sans selection:bg-rose-500 selection:text-white overflow-hidden relative">
      
      {/* تأثيرات الإضاءة الخلفية */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/20 rounded-full mix-blend-screen filter blur-[120px] opacity-70 animate-blob"></div>
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full mix-blend-screen filter blur-[120px] opacity-70 animate-blob animation-delay-2000"></div>

      {/* شريط التنقل العلوي */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/65 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={scrollToTop}>
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30">
              <FileText size={22} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              {t('appName')}
            </span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-gray-400">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors duration-300">{t('navFeatures')}</button>
            <button onClick={() => scrollToSection('security')} className="hover:text-white transition-colors duration-300">{t('navPrivacy')}</button>
            <button onClick={() => scrollToSection('how')} className="hover:text-white transition-colors duration-300">{t('navHow')}</button>
          </div>

          <div className="flex items-center gap-3">
            {/* 🌐 زر تبديل اللغة المضاف */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 bg-white/5 hover:border-rose-500 hover:bg-rose-500/10 transition-all group cursor-pointer"
              title={language === 'ar' ? t('switchToEnglish') : t('switchToArabic')}
            >
              <LanguagesIcon size={16} className="text-gray-400 group-hover:text-rose-400 transition-colors" />
              <span className="text-xs font-black uppercase tracking-wider text-gray-300 group-hover:text-white transition-colors">
                {language === 'ar' ? 'AR' : 'EN'}
              </span>
            </button>

            <Link to="/tools" className="bg-white text-black px-6 py-2.5 rounded-full font-black text-sm hover:bg-gray-200 hover:scale-105 transition-all duration-300 flex items-center gap-2">
              {t('tryToolsFree')} <ArrowLeft size={16} className={isRTL ? '' : 'rotate-180'} />
            </Link>
          </div>
        </div>
      </nav>

      {/* القسم الترحيبي (Hero Section) */}
      <section className="pt-44 pb-32 px-6 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-gray-300 mb-8 backdrop-blur-md">
            <Sparkles size={16} className="text-rose-400" />
            {t('heroBadge')}
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] mb-8 tracking-tight">
            {t('heroTitlePart1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-400 to-rose-500">{t('heroTitlePart2')}</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            {t('heroDesc')}
            <br className="hidden md:block" />
            <span className="text-white font-bold">{t('heroDescHighlight')}</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link to="/tools" className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all duration-300 active:scale-95 shadow-[0_0_40px_-10px_rgba(225,29,72,0.5)] flex items-center justify-center gap-3 group">
              {t('startWorkingNow')}
              <ArrowLeft size={20} className={`group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'} transition-transform`} />
            </Link>
            <button onClick={() => scrollToSection('features')} className="w-full sm:w-auto bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 text-center flex items-center justify-center gap-2">
              {t('exploreFeatures')}
            </button>
          </div>

          <div className="mt-16 flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-sm font-bold text-gray-500">
            <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-rose-500" /> {t('localProcessing')}</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-rose-500" /> {t('noSignupRequired')}</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-rose-500" /> {t('completelyFree')}</div>
          </div>
        </div>
      </section>

      {/* قسم المميزات */}
      <section id="features" className="py-24 px-6 relative z-10 border-t border-white/5 bg-[#070707]/50 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6">{t('featuresTitle')}</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">{t('featuresDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-10 rounded-[2.5rem]">
              <Layers size={40} className="text-rose-500 mb-8" />
              <h3 className="text-3xl font-black mb-4">{t('featureSmartMerge')}</h3>
              <p className="text-gray-400 text-lg leading-relaxed max-w-lg">{t('featureSmartMergeDesc')}</p>
            </div>
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-10 rounded-[2.5rem]">
              <Zap size={40} className="text-emerald-400 mb-8" />
              <h3 className="text-2xl font-black mb-4">{t('featureInstantCompress')}</h3>
              <p className="text-gray-400 leading-relaxed">{t('featureInstantCompressDesc')}</p>
            </div>
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-10 rounded-[2.5rem]">
              <Shield size={40} className="text-blue-400 mb-8" />
              <h3 className="text-2xl font-black mb-4">{t('featureProtectEncrypt')}</h3>
              <p className="text-gray-400 leading-relaxed">{t('featureProtectEncryptDesc')}</p>
            </div>
            <div className="md:col-span-2 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-10 rounded-[2.5rem]">
              <PenTool size={40} className="text-amber-400 mb-8" />
              <h3 className="text-3xl font-black mb-4">{t('featureProSignature')}</h3>
              <p className="text-gray-400 text-lg leading-relaxed max-w-lg">{t('featureProSignatureDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* التذييل */}
      <footer className="border-t border-white/10 py-12 text-center text-gray-500 text-sm relative z-10 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 font-black text-lg text-white">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            {t('appName')}
          </div>
          <p className="font-medium">© {new Date().getFullYear()} {t('appName')}. {t('rights')}.</p>
          <div className="flex flex-wrap justify-center gap-6 font-bold">
            <Link to="/privacy" className="hover:text-white transition-colors">{t('privacyPolicy')}</Link>
            <Link to="/terms" className="hover:text-white transition-colors">{t('termsOfUse')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}