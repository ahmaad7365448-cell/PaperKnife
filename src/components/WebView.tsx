/**
 * PaperKnife - لوحة الويب الاحترافية (خلفية مذهلة + بطاقات صلبة)
 */

import { useState, useMemo } from 'react'
import {
  Search as SearchIcon,
  ChevronRight as ChevronRightIcon,
  Sparkles as SparklesIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Tool, ToolCategory } from '../types'
import { useLanguage } from '../LanguageContext'
import { getToolLabel } from '../utils/toolLabels'

// ==========================================================
// 🎨 ألوان الفئات
// ==========================================================
const categoryColors: Record<ToolCategory, {
  bg: string
  text: string
  border: string
  glow: string
  gradient: string
}> = {
  Edit: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-500',
    border: 'border-rose-500/20',
    glow: 'shadow-rose-500/5',
    gradient: 'from-rose-500/5 via-transparent to-transparent',
  },
  Secure: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-500',
    border: 'border-indigo-500/20',
    glow: 'shadow-indigo-500/5',
    gradient: 'from-indigo-500/5 via-transparent to-transparent',
  },
  Convert: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/5',
    gradient: 'from-emerald-500/5 via-transparent to-transparent',
  },
  Optimize: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/5',
    gradient: 'from-amber-500/5 via-transparent to-transparent',
  },
}

const categoryLabels: Record<'ar' | 'en', Record<ToolCategory | 'All', string>> = {
  ar: { All: 'الكل', Edit: 'تعديل', Secure: 'حماية', Convert: 'تحويل', Optimize: 'تحسين' },
  en: { All: 'All', Edit: 'Edit', Secure: 'Secure', Convert: 'Convert', Optimize: 'Optimize' },
}

// ==========================================================
// 🎴 بطاقة الأداة — صلبة وواضحة
// ==========================================================
const ToolCard = ({
  tool,
  onClick,
  language,
  index,
}: {
  tool: Tool
  onClick?: () => void
  language: 'ar' | 'en'
  index: number
}) => {
  const colors = categoryColors[tool.category]
  const { title, desc } = getToolLabel(tool, language)
  const Icon = tool.icon

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col p-6 rounded-[2rem] bg-zinc-900/85 backdrop-blur-2xl border border-zinc-800 hover:border-rose-500/60 transition-all duration-500 text-right hover:shadow-2xl hover:shadow-rose-500/20 hover:-translate-y-2 overflow-hidden animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

      {/* 🎨 أيقونة عملاقة شفافة */}
      <div className={`absolute -left-8 -bottom-8 pointer-events-none transition-all duration-700 ${colors.text} opacity-[0.08] group-hover:opacity-[0.18] group-hover:scale-110 group-hover:-rotate-12`}>
        <Icon size={200} strokeWidth={0.8} />
      </div>

      <div className={`absolute top-0 right-0 w-32 h-32 ${colors.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

      <div className={`relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${colors.bg} ${colors.text} group-hover:bg-rose-500 group-hover:text-white transition-all duration-500 shadow-sm`}>
        <Icon size={26} strokeWidth={2} />
      </div>

      <h3 className="relative z-10 font-black text-white mb-2 text-lg tracking-tight group-hover:text-rose-500 transition-colors leading-tight">
        {title}
      </h3>
      <p className="relative z-10 text-sm text-zinc-400 font-medium leading-relaxed line-clamp-2">
        {desc}
      </p>

      <div className="absolute top-6 left-6 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-rose-500 z-10">
        <ChevronRightIcon size={20} className="rotate-180" />
      </div>
    </button>
  )
}

// ==========================================================
// 🌌 خلفية الموقع الكاملة
// ==========================================================
const PageBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-[#08080a] via-[#0a0a0d] to-[#0d0810]" />

      <div
        className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[140%] h-[80%] opacity-40"
        style={{
          background: `radial-gradient(ellipse at center, 
            rgba(244,63,94,0.25) 0%, 
            rgba(244,63,94,0.10) 25%, 
            rgba(139,92,246,0.08) 50%, 
            transparent 75%)`,
          filter: 'blur(40px)',
        }}
      />

      <div
        className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[60%] opacity-30"
        style={{
          background: `radial-gradient(ellipse at center,
            rgba(139,92,246,0.20) 0%,
            rgba(99,102,241,0.10) 40%,
            transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      <div
        className="absolute -bottom-1/4 -left-1/4 w-[60%] h-[50%] opacity-20"
        style={{
          background: `radial-gradient(ellipse at center,
            rgba(16,185,129,0.18) 0%,
            transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
        }}
      />

      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="lines-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="80" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lines-pattern)" />
      </svg>

      <div className="absolute top-[15%] left-[8%] opacity-[0.08] animate-[float_14s_ease-in-out_infinite]">
        <svg width="60" height="75" viewBox="0 0 60 75" fill="none" stroke="currentColor" className="text-rose-400" strokeWidth="1.5">
          <path d="M 8 8 L 40 8 L 52 20 L 52 67 L 8 67 Z" />
          <path d="M 40 8 L 40 20 L 52 20" />
          <line x1="15" y1="30" x2="45" y2="30" />
          <line x1="15" y1="40" x2="45" y2="40" />
          <line x1="15" y1="50" x2="35" y2="50" />
        </svg>
      </div>

      <div className="absolute top-[55%] right-[6%] opacity-[0.07] animate-[float_18s_ease-in-out_infinite_reverse]">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" className="text-indigo-400" strokeWidth="1.5">
          <circle cx="40" cy="40" r="30" />
          <circle cx="40" cy="40" r="20" strokeDasharray="4 4" />
          <path d="M 40 10 L 40 40 L 60 55" />
        </svg>
      </div>

      <div className="absolute bottom-[15%] left-[12%] opacity-[0.06] animate-[float_16s_ease-in-out_infinite]">
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" stroke="currentColor" className="text-emerald-400" strokeWidth="1.5">
          <path d="M 10 35 Q 35 10 60 35 Q 35 60 10 35 Z" />
          <circle cx="35" cy="35" r="5" fill="currentColor" opacity="0.5" />
        </svg>
      </div>

      <div className="absolute top-[25%] right-[12%] opacity-[0.05] animate-[float_20s_ease-in-out_infinite_reverse]">
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" stroke="currentColor" className="text-amber-400" strokeWidth="1.5">
          <rect x="10" y="10" width="30" height="30" rx="4" transform="rotate(15 25 25)" />
        </svg>
      </div>

      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

      <div
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}

// ==========================================================
// 🌐 WebView الرئيسي
// ==========================================================
export default function WebView({ tools }: { tools: Tool[] }) {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'All'>('All')

  const categories: (ToolCategory | 'All')[] = ['All', 'Edit', 'Secure', 'Convert', 'Optimize']
  const labels = categoryLabels[language]

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const { title, desc } = getToolLabel(tool, language)
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           desc.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === 'All' || tool.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [tools, searchQuery, activeCategory, language])

  const heroTexts = {
    ar: {
      badge: 'محرّك PDF احترافي',
      title1: 'توقّف عن رفع',
      title2: 'خصوصيتك.',
      searchPlaceholder: 'ابحث عن الأدوات (مثل: دمج، ضغط، حماية...)',
      activeTools: 'أداة نشطة',
      emptyTitle: 'لا توجد أدوات مطابقة.',
      emptyDesc: 'حاول البحث بكلمة مفتاحية أخرى أو امسح الفلاتر.',
      reset: 'إعادة تعيين اللوحة',
      stat1: 'أداة مجانية',
      stat2: 'خصوصية 100%',
      stat3: 'بدون تسجيل',
    },
    en: {
      badge: 'Professional PDF Engine',
      title1: 'Stop uploading',
      title2: 'your privacy.',
      searchPlaceholder: 'Search tools (e.g., merge, compress, protect...)',
      activeTools: 'active tools',
      emptyTitle: 'No matching tools.',
      emptyDesc: 'Try another keyword or clear the filters.',
      reset: 'Reset panel',
      stat1: 'Free tools',
      stat2: '100% Private',
      stat3: 'No signup',
    }
  }[language]

  const isRTL = language === 'ar'

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen relative">
      <PageBackground />

      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-rose-500/30 backdrop-blur-md shadow-lg shadow-rose-500/10">
            <SparklesIcon size={14} /> {heroTexts.badge}
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-8 leading-[0.95]">
            {heroTexts.title1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600">
              {heroTexts.title2}
            </span>
          </h1>

          <div className="max-w-2xl mx-auto relative group mt-12">
            <div className={`absolute inset-y-0 ${isRTL ? 'right-6' : 'left-6'} flex items-center pointer-events-none text-gray-500 group-focus-within:text-rose-400 transition-colors`}>
              <SearchIcon size={22} />
            </div>
            <input
              type="text"
              placeholder={heroTexts.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-[2rem] py-6 ${isRTL ? 'pr-16 pl-8 text-right' : 'pl-16 pr-8 text-left'} shadow-2xl shadow-black/50 focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-bold text-xl text-white placeholder:text-gray-500`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
              {heroTexts.stat1}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
              {heroTexts.stat2}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-600" />
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
              {heroTexts.stat3}
            </span>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 pb-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-12">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border backdrop-blur-md ${
                      activeCategory === cat
                        ? 'bg-white text-black border-transparent shadow-lg shadow-white/10'
                        : 'bg-zinc-900/70 text-gray-400 border-white/10 hover:border-rose-500/50 hover:text-white'
                    }`}
                  >
                    {labels[cat]}
                  </button>
                ))}
              </div>
              <p className="hidden md:block text-[10px] font-black text-gray-500 uppercase tracking-widest">
                {filteredTools.length} {heroTexts.activeTools}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool, idx) => (
                <ToolCard
                  key={tool.title}
                  tool={tool}
                  language={language}
                  index={idx}
                  onClick={() => navigate(tool.path || '/')}
                />
              ))}
            </div>

            {filteredTools.length === 0 && (
              <div className="py-32 text-center">
                <div className="w-20 h-20 bg-zinc-900/70 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-6 text-gray-500 border border-white/10">
                  <SearchIcon size={32} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{heroTexts.emptyTitle}</h3>
                <p className="text-gray-400 font-medium">{heroTexts.emptyDesc}</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('All') }}
                  className="mt-8 text-rose-400 font-black uppercase tracking-widest text-xs hover:underline underline-offset-8"
                >
                  {heroTexts.reset}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(5deg); }
        }
      `}</style>
    </div>
  )
}