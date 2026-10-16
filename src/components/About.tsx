/**
 * PaperKnife - About / من نحن
 * Bilingual: يتغير حسب اللغة المختارة
 */

import { useState } from 'react'
import {
  Heart as HeartIcon,
  Code as CodeIcon,
  Cpu as CpuIcon,
  Github as GHIcon,
  Shield as ShieldIcon,
  ChevronDown as ChevronDownIcon,
  ExternalLink as ExternalLinkIcon,
  ChevronRight as ChevronRightIcon,
  HardDrive as DiskIcon,
  EyeOff as PrivacyIcon
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import { NativeToolLayout } from './tools/shared/NativeToolLayout'
import { PaperKnifeLogo } from './Logo'
import { ViewMode } from '../types'
import { useLanguage } from '../LanguageContext'

// ==================== المحتوى حسب اللغة ====================
const CONTENT = {
  ar: {
    heroTitle: ['أدوات PDF لا', 'تتصل بالخارج أبداً.'],
    heroDesc: 'ادمج، اضغط، وقّع، واحمِ ملفات PDF مباشرة في متصفحك. مجاناً، بدون حسابات، بدون إعلانات — ملفاتك لا تغادر هذا التبويب.',
    browseTools: 'استكشف الأدوات',
    support: 'ادعمنا',
    version: 'v1.1.0 • يعمل بدون إنترنت • AGPL v3',

    whatYouCanDo: 'ماذا يمكنك أن تفعل.',
    allTools: 'كل الأدوات',
    howItWorks: 'كيف يعمل.',
    privateByDesign: 'خصوصية بالتصميم.',
    builtWithOpenSource: 'مبني على المصادر المفتوحة.',
    builtWithDesc: 'يستند PaperKnife إلى هذه المكتبات المجانية. شكراً لكل من يبنيها ويصونها.',

    keepItFree: 'أبقِه مجانياً.',
    keepItFreeDesc: 'PaperKnife يموّل نفسه بنفسه. دعمك يبقيه مجانياً وخاصاً للجميع.',
    hallOfFame: 'لوحة الشرف',
    sourceCode: 'الكود المصدري',

    popularTools: [
      { title: 'دمج PDF', desc: 'اجمع الملفات في مستند واحد.', path: '/merge' },
      { title: 'ضغط PDF', desc: 'قلّل الحجم مع الحفاظ على الجودة.', path: '/compress' },
      { title: 'تقسيم PDF', desc: 'استخرج الصفحات التي تحتاجها.', path: '/split' },
      { title: 'حماية PDF', desc: 'اقفل ملفاتك بكلمة مرور.', path: '/protect' },
      { title: 'التوقيع', desc: 'ارسم أو ارفع توقيعك الإلكتروني.', path: '/signature' },
      { title: 'علامة مائية', desc: 'أضف نصاً على كل الصفحات.', path: '/watermark' },
    ],
    steps: [
      { n: '01', title: 'اختر الأداة', desc: 'حدّد ما تريد فعله. لا حساب، لا تثبيت، لا غرفة انتظار.' },
      { n: '02', title: 'أفلت ملفك', desc: 'يفتح مباشرة في متصفحك. لا شيء يُرفع — راقب تبويب الشبكة إن أردت التأكد.' },
      { n: '03', title: 'حمّل النتيجة', desc: 'تتم المعالجة في الحال وتُحفظ مباشرة على جهازك.' },
    ],
    privacyCards: [
      { icon: CpuIcon, title: 'يعمل على جهازك', desc: 'كل أداة تُنفَّذ محلياً. لا شيء يُرفع إلى أي مكان، أبداً.' },
      { icon: PrivacyIcon, title: 'الملفات في الذاكرة', desc: 'تبقى مستنداتك في الذاكرة المؤقتة (RAM). إغلاق التبويب يمسحها.' },
      { icon: DiskIcon, title: 'تنظيف البيانات الوصفية', desc: 'أزل التفاصيل المُعرِّفة مثل المُنتِج والمُنشئ وسجل التعديلات.' },
      { icon: CodeIcon, title: 'مفتوح المصدر', desc: 'مفتوح المصدر 100% تحت رخصة GNU AGPL v3. يمكن لأي شخص تدقيق الكود.' },
    ],
    specItems: [
      { title: 'يعمل على جهازك', icon: CpuIcon, text: 'كل أداة تعمل محلياً على هاتفك. لا شيء يُرفع إلى أي مكان، أبداً.' },
      { title: 'الملفات في الذاكرة', icon: PrivacyIcon, text: 'تبقى مستنداتك في الذاكرة المؤقتة (RAM) أثناء العمل. إغلاق التطبيق يمسحها.' },
      { title: 'تنظيف البيانات الوصفية', icon: DiskIcon, text: 'أداة البيانات الوصفية تزيل التفاصيل المُعرِّفة مثل المُنتِج والمُنشئ وسجل التعديلات من ملفاتك.' },
      { title: 'مفتوح المصدر', icon: CodeIcon, text: 'PaperKnife مفتوح المصدر 100% تحت رخصة GNU AGPL v3. يمكن لأي شخص قراءة الكود وتدقيقه.' },
      { title: 'بدون سيرفرات', icon: ShieldIcon, text: 'لا يوجد خادم، لا قاعدة بيانات، لا سحابة. التطبيق يعمل بدون إنترنت بالكامل.' },
    ],
    librariesHeader: 'كيف نتعامل مع ملفاتك',
    librariesTitle: 'المكتبات مفتوحة المصدر',
    appTagline: 'أدوات PDF تعمل بالكامل على هاتفك. ملفاتك لا تغادر يديك أبداً.',
    appVersionLabel: 'v1.1.0 • مجاني وخاص',
    keepItFreeShort: 'أبقِه مجانياً',
    keepItFreeShortDesc: 'PaperKnife يموّل نفسه بنفسه. دعمك يبقيه مجانياً للجميع.',
    sourceCodeLicense: 'رخصة AGPL v3',
    supporters: 'الداعمون',
    handmade: 'صُنع بحُب بواسطة potatameister',
  },
  en: {
    heroTitle: ['PDF tools that', 'never phone home.'],
    heroDesc: 'Merge, compress, sign, and protect PDFs right in your browser. Free, no accounts, no ads — your files never leave this tab.',
    browseTools: 'Browse Tools',
    support: 'Support',
    version: 'v1.1.0 • Works offline • AGPL v3',

    whatYouCanDo: 'What you can do.',
    allTools: 'All tools',
    howItWorks: 'How it works.',
    privateByDesign: 'Private by construction.',
    builtWithOpenSource: 'Built with open source.',
    builtWithDesc: 'PaperKnife stands on these free libraries. Thank you to everyone who builds and maintains them.',

    keepItFree: 'Keep it free.',
    keepItFreeDesc: 'PaperKnife is self-funded. Your support keeps it free and private for everyone.',
    hallOfFame: 'Hall of Fame',
    sourceCode: 'Source Code',

    popularTools: [
      { title: 'Merge PDFs', desc: 'Combine files into one document.', path: '/merge' },
      { title: 'Compress', desc: 'Shrink file size, keep quality.', path: '/compress' },
      { title: 'Split', desc: 'Extract the pages you need.', path: '/split' },
      { title: 'Protect', desc: 'Lock files with a password.', path: '/protect' },
      { title: 'Sign', desc: 'Draw or upload your signature.', path: '/signature' },
      { title: 'Watermark', desc: 'Stamp text across pages.', path: '/watermark' },
    ],
    steps: [
      { n: '01', title: 'Pick a tool', desc: 'Choose what you want to do. No account, no install, no waiting room.' },
      { n: '02', title: 'Drop your file', desc: 'It opens right in your browser. Nothing uploads — watch your network tab if you doubt it.' },
      { n: '03', title: 'Download the result', desc: 'Processed on the spot, saved straight to your device.' },
    ],
    privacyCards: [
      { icon: CpuIcon, title: 'Runs on your device', desc: 'Every tool executes locally. Nothing is uploaded anywhere, ever.' },
      { icon: PrivacyIcon, title: 'Files live in memory', desc: 'Documents stay in temporary memory (RAM). Closing the tab wipes them.' },
      { icon: DiskIcon, title: 'Metadata cleaning', desc: 'Strip identifying details like Producer, Creator, and editing history.' },
      { icon: CodeIcon, title: 'Open source', desc: '100% open source under GNU AGPL v3. Anyone can audit the code.' },
    ],
    specItems: [
      { title: 'Runs on your device', icon: CpuIcon, text: 'Every tool runs locally on your phone. Nothing is uploaded anywhere, ever.' },
      { title: 'Files live in memory', icon: PrivacyIcon, text: 'Your documents stay in temporary memory (RAM) while you work. Closing the app wipes them.' },
      { title: 'Metadata cleaning', icon: DiskIcon, text: 'The metadata tool removes identifying details like Producer, Creator, and editing history from your files.' },
      { title: 'Open source', icon: CodeIcon, text: 'PaperKnife is 100% open source under the GNU AGPL v3 license. Anyone can read and audit the code.' },
      { title: 'No servers', icon: ShieldIcon, text: 'There is no backend, no database, and no cloud. The app works fully offline.' },
    ],
    librariesHeader: 'How your files are handled',
    librariesTitle: 'Open-source libraries',
    appTagline: 'PDF tools that run entirely on your phone. Your files never leave your hands.',
    appVersionLabel: 'v1.1.0 • Free and private',
    keepItFreeShort: 'Keep it free',
    keepItFreeShortDesc: 'PaperKnife is self-funded. Your support keeps it free for everyone.',
    sourceCodeLicense: 'AGPL v3 License',
    supporters: 'Supporters',
    handmade: 'Handcrafted by potatameister',
  }
}

// ==================== المكتبات (ثابت) ====================
const libraries = [
  { name: 'pdf-lib', url: 'https://github.com/Hopding/pdf-lib', descAr: 'قراءة وتعديل وكتابة ملفات PDF محلياً.', descEn: 'Reads, edits, and writes PDF files locally.' },
  { name: 'PDF.js', url: 'https://github.com/mozilla/pdf.js', descAr: 'عرض صفحات PDF على الشاشة.', descEn: 'Renders PDF pages on screen.' },
  { name: 'Tesseract.js', url: 'https://github.com/naptha/tesseract.js', descAr: 'قراءة النص من الصفحات الممسوحة ضوئياً بدون إنترنت.', descEn: 'Reads text from scanned pages, offline.' },
  { name: 'JSZip', url: 'https://github.com/Stuk/jszip', descAr: 'تجميع الملفات المُصدَّرة في أرشيف ZIP.', descEn: 'Bundles exported files into ZIP archives.' },
  { name: 'Lucide', url: 'https://github.com/lucide-icons/lucide', descAr: 'الأيقونات المستخدمة في كل أنحاء التطبيق.', descEn: 'The icons used throughout the app.' },
  { name: 'Capacitor', url: 'https://github.com/ionic-team/capacitor', descAr: 'الجسر بين تطبيق الويب وأندرويد.', descEn: 'Bridge between the web app and Android.' },
]

// ==================== مكونات مساعدة ====================
const SpecItem = ({ title, icon: Icon, children, defaultOpen = false, isRTL }: { title: string, icon: any, children: React.ReactNode, defaultOpen?: boolean, isRTL: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 dark:border-zinc-800 last:border-0 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full py-6 flex items-center justify-between ${isRTL ? 'text-right' : 'text-left'} group transition-all`}
      >
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isOpen ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-gray-50 dark:bg-zinc-900 text-gray-400 group-hover:text-rose-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/10'}`}>
            <Icon size={20} strokeWidth={2.5} />
          </div>
          <h4 className="font-black text-xs md:text-sm uppercase tracking-[0.2em] text-gray-900 dark:text-white transition-colors">{title}</h4>
        </div>
        <div className={`p-2 rounded-full transition-all ${isOpen ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'text-gray-300'}`}>
          <ChevronDownIcon size={18} className={`transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div className={`pb-8 ${isRTL ? 'pl-6 pr-16' : 'pr-6 pl-16'} text-sm md:text-base text-gray-500 dark:text-zinc-400 font-medium leading-relaxed animate-in slide-in-from-top-4 duration-500`}>
          {children}
        </div>
      )}
    </div>
  )
}

const LibraryList = ({ compact = false, language }: { compact?: boolean, language: 'ar' | 'en' }) => (
  <div className={`grid grid-cols-1 ${compact ? '' : 'md:grid-cols-2'} gap-3`}>
    {libraries.map((lib) => (
      <a
        key={lib.name}
        href={lib.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-rose-500 transition-all shadow-sm flex items-center gap-4"
      >
        <div className="w-10 h-10 bg-gray-50 dark:bg-black rounded-xl flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors text-gray-400 shrink-0 border border-transparent dark:border-white/5">
          <GHIcon size={18} />
        </div>
        <div className={`flex-1 min-w-0 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
          <h4 className="font-black text-xs tracking-widest uppercase dark:text-white" dir="ltr">{lib.name}</h4>
          <p className="text-[11px] text-gray-500 dark:text-zinc-500 font-medium truncate">
            {language === 'ar' ? lib.descAr : lib.descEn}
          </p>
        </div>
        <ExternalLinkIcon size={14} className="text-gray-300 group-hover:text-rose-500 transition-all shrink-0" />
      </a>
    ))}
  </div>
)

// ==================== نسخة الويب ====================
const AboutWeb = () => {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()
  const c = CONTENT[language]

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#FAFAFA] dark:bg-black text-gray-900 dark:text-zinc-100 selection:bg-rose-500 selection:text-white pb-24">

      {/* Hero */}
      <section className="relative pt-24 pb-16 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.07),transparent_60%)] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-[1.75rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center justify-center mx-auto mb-6">
            <PaperKnifeLogo size={40} iconColor="#F43F5E" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter dark:text-white mb-4 leading-[0.95]">
            {c.heroTitle[0]}<br />{c.heroTitle[1]}
          </h1>
          <p className="text-lg md:text-xl text-gray-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium mb-8">
            {c.heroDesc}
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <button onClick={() => navigate('/')} className="px-8 py-3.5 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-xl shadow-rose-500/20">
              {c.browseTools}
            </button>
            <a href="https://potatameister.github.io/support" target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 text-gray-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-sm flex items-center gap-2">
              <HeartIcon size={14} className="text-rose-500" fill="currentColor" /> {c.support}
            </a>
          </div>
          <p className="inline-block text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-zinc-900 rounded-full px-4 py-1.5">{c.version}</p>
        </div>
      </section>

      {/* Tool showcase */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tighter dark:text-white leading-[1.1]">
            {c.whatYouCanDo}
          </h2>
          <button onClick={() => navigate('/')} className="hidden sm:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors">
            {c.allTools} <ChevronRightIcon size={12} className={isRTL ? 'rotate-180' : ''} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {c.popularTools.map((tool) => (
            <button
              key={tool.title}
              onClick={() => navigate(tool.path)}
              className={`group p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 hover:border-rose-500 transition-all shadow-sm ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <h3 className="font-black text-base dark:text-white mb-1 group-hover:text-rose-500 transition-colors">{tool.title}</h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">{tool.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <h2 className="text-3xl font-black tracking-tighter dark:text-white leading-[1.1] mb-8">
          {c.howItWorks}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {c.steps.map((step) => (
            <div key={step.n} className={`p-6 bg-zinc-950 dark:bg-white rounded-[2rem] text-white dark:text-black ${isRTL ? 'text-right' : 'text-left'}`}>
              <p className="text-[11px] font-black tracking-[0.3em] text-rose-500 mb-4" dir="ltr">{step.n}</p>
              <h3 className="font-black text-lg mb-2">{step.title}</h3>
              <p className="text-sm font-medium text-zinc-400 dark:text-zinc-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy cards */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <h2 className="text-3xl font-black tracking-tighter dark:text-white leading-[1.1] mb-8">
          {c.privateByDesign}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {c.privacyCards.map((card) => (
            <div key={card.title} className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm flex gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center shrink-0">
                <card.icon size={20} strokeWidth={2.5} />
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h3 className="font-black text-sm dark:text-white mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Libraries */}
      <section className="max-w-6xl mx-auto px-6 mb-20">
        <h2 className="text-3xl font-black tracking-tighter dark:text-white leading-[1.1] mb-3">
          {c.builtWithOpenSource}
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium mb-8 max-w-xl">
          {c.builtWithDesc}
        </p>
        <LibraryList language={language} />
      </section>

      {/* Support banner */}
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div className={`bg-rose-500 text-white rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden shadow-xl shadow-rose-500/20 ${isRTL ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center shrink-0 backdrop-blur-md border border-white/20">
            <HeartIcon size={32} fill="currentColor" />
          </div>
          <div className={`flex-1 relative z-10 ${isRTL ? 'text-center md:text-right' : 'text-center md:text-left'}`}>
            <h3 className="text-3xl font-black tracking-tighter mb-3 leading-tight">{c.keepItFree}</h3>
            <p className="text-rose-100 font-medium text-base mb-6 max-w-xl leading-relaxed">
              {c.keepItFreeDesc}
            </p>
            <div className={`flex flex-wrap gap-3 ${isRTL ? 'justify-center md:justify-start' : 'justify-center md:justify-start'}`}>
              <a href="https://potatameister.github.io/support" target="_blank" rel="noopener noreferrer" className="px-8 py-3.5 bg-white text-rose-600 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-lg flex items-center gap-2">
                <HeartIcon size={14} fill="currentColor" /> {c.support}
              </a>
              <button onClick={() => navigate('/thanks')} className="px-8 py-3.5 bg-rose-600 text-white border border-rose-400/50 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-700 transition-colors">
                {c.hallOfFame}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer links */}
      <section className="max-w-4xl mx-auto px-6 text-center border-t border-gray-100 dark:border-zinc-900 pt-16">
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors group">
            <GHIcon size={16} /> {c.sourceCode} <ExternalLinkIcon size={12} className="opacity-40 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>
          <button onClick={() => navigate('/thanks')} className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors group">
            {c.hallOfFame} <ChevronRightIcon size={12} className={`opacity-40 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className="opacity-20 hover:opacity-50 transition-opacity duration-700">
          <PaperKnifeLogo size={32} iconColor="#F43F5E" className="mx-auto mb-4" />
          <p className="text-[9px] font-black uppercase tracking-[0.6em] text-gray-400">potatameister</p>
        </div>
      </section>

    </div>
  )
}

// ==================== نسخة أندرويد ====================
const AboutAPK = () => {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()
  const c = CONTENT[language]

  return (
    <NativeToolLayout title={language === 'ar' ? 'من نحن' : 'About'} description="PaperKnife" actions={null}>
      <div className="px-4 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-4">

        {/* App identity */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 border border-gray-100 dark:border-white/5 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-black rounded-[1.5rem] flex items-center justify-center shadow-inner mb-4">
            <PaperKnifeLogo size={40} iconColor="#F43F5E" />
          </div>
          <h2 className="text-2xl font-black tracking-tighter dark:text-white leading-none mb-1" dir="ltr">PaperKnife</h2>
          <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">{c.appVersionLabel}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium leading-relaxed mt-3 max-w-xs">
            {c.appTagline}
          </p>
        </div>

        {/* Support */}
        <div className="bg-rose-500 text-white rounded-[2rem] p-6 relative overflow-hidden shadow-xl shadow-rose-500/20">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <HeartIcon size={100} fill="currentColor" />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-black uppercase tracking-tight mb-2">{c.keepItFreeShort}</h3>
            <p className="text-sm font-medium text-rose-100 leading-relaxed mb-6">
              {c.keepItFreeShortDesc}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <a href="https://potatameister.github.io/support" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 bg-white text-rose-600 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-sm active:scale-95 transition-transform">
                {c.support}
              </a>
              <button onClick={() => navigate('/thanks')} className="flex items-center justify-center gap-2 py-3 bg-rose-600 text-white border border-rose-400/50 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-transform">
                {c.hallOfFame}
              </button>
            </div>
          </div>
        </div>

        {/* How files handled */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-2 border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-50 dark:border-white/5">
            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>{c.librariesHeader}</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/5 px-2">
            {c.specItems.map((item, i) => (
              <SpecItem key={i} title={item.title} icon={item.icon} isRTL={isRTL}>
                {item.text}
              </SpecItem>
            ))}
          </div>
        </div>

        {/* Libraries */}
        <div>
          <h3 className={`px-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>{c.librariesTitle}</h3>
          <LibraryList compact language={language} />
        </div>

        {/* Action tiles */}
        <div className="grid grid-cols-1 gap-2 pt-2">
          <a href="https://github.com/potatameister/PaperKnife" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-[2rem] active:scale-[0.98] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-black rounded-xl flex items-center justify-center">
                <GHIcon size={20} className="text-black dark:text-white" />
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h4 className="font-bold text-sm dark:text-white">{c.sourceCode}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{c.sourceCodeLicense}</p>
              </div>
            </div>
            <ExternalLinkIcon size={16} className="text-gray-300" />
          </a>

          <button onClick={() => navigate('/thanks')} className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-[2rem] active:scale-[0.98] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center">
                <HeartIcon size={20} className="text-rose-500" fill="currentColor" />
              </div>
              <div className={isRTL ? 'text-right' : 'text-left'}>
                <h4 className="font-bold text-sm dark:text-white">{c.hallOfFame}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{c.supporters}</p>
              </div>
            </div>
            <ChevronRightIcon size={16} className={`text-gray-300 ${isRTL ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <p className="text-[8px] font-black uppercase text-center text-gray-400 tracking-[0.5em] pt-8 pb-4">{c.handmade}</p>
      </div>
    </NativeToolLayout>
  )
}

// ==================== الراوتر الرئيسي ====================
export default function About({ viewMode }: { viewMode?: ViewMode }) {
  const isAndroid = viewMode === 'android' || (viewMode === undefined && Capacitor.isNativePlatform())
  return isAndroid ? <AboutAPK /> : <AboutWeb />
}