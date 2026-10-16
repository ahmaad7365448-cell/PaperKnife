/**
 * PaperKnife - واجهة الجوال الموحّدة
 * نفس هوية الويب + تحسينات للمس
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search as SearchIcon,
  Sparkles as SparklesIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Upload as UploadIcon,
  LayoutGrid as LayoutGridIcon,
  ChevronRight as ChevronRightIcon,
  Heart as HeartIcon,
  Github as GHIcon,
  FileText as FileTextIcon,
  ClipboardList as ClipboardListIcon,
} from 'lucide-react'
import { getRecentActivity, ActivityEntry } from '../utils/recentActivity'
import { PaperKnifeLogo } from './Logo'
import { Tool, ToolCategory } from '../types'

interface AndroidViewProps {
  tools: Tool[]
  theme: 'light' | 'dark'
  toggleTheme: () => void
  onFileSelect?: (file: File) => void
}

// ألوان الفئات — نفس WebView
const categoryColors: Record<ToolCategory, { bg: string; text: string }> = {
  Edit: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-500' },
  Secure: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-500' },
  Convert: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-500' },
  Optimize: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-500' },
}

const categoryLabels: Record<ToolCategory | 'All', string> = {
  All: 'الكل',
  Edit: 'تعديل',
  Secure: 'حماية',
  Convert: 'تحويل',
  Optimize: 'تحسين',
}

export default function AndroidView({ tools, theme, toggleTheme, onFileSelect }: AndroidViewProps) {
  const navigate = useNavigate()
  const [history, setHistory] = useState<ActivityEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'All'>('All')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getRecentActivity(3).then(setHistory)
  }, [])

  const categories: (ToolCategory | 'All')[] = ['All', 'Edit', 'Secure', 'Convert', 'Optimize']

  // فلترة الأدوات
  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      const matchesSearch =
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === 'All' || tool.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [tools, searchQuery, activeCategory])

  // أدوات مختصرة للـ Quick Access (أول 4)
  const quickTools = useMemo(() => tools.slice(0, 4), [tools])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onFileSelect) onFileSelect(file)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] dark:bg-black transition-colors pb-28">

      {/* ===== Hidden File Input ===== */}
      <input
        type="file"
        accept=".pdf"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ===== Sticky Header ===== */}
      <header className="px-4 pt-safe pb-3 sticky top-0 z-50 bg-[#FAFAFA]/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-100 dark:border-zinc-900">
        <div className="flex items-center justify-between h-14">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 active:opacity-70 transition-opacity"
          >
            <PaperKnifeLogo size={24} iconColor="#F43F5E" partColor="currentColor" />
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tighter text-gray-900 dark:text-white leading-none">
                  PaperKnife
                </span>
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              </div>
              <span className="text-[7px] font-black text-rose-500 uppercase tracking-[0.2em] mt-0.5">
                محرّك آمن
              </span>
            </div>
          </button>

          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-900 text-gray-500 dark:text-gray-400 active:bg-gray-200 dark:active:bg-zinc-800 transition-colors"
          >
            {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6 flex-1 overflow-y-auto scrollbar-hide">

        {/* ===== 🌟 Hero Section ===== */}
        <section className="text-center pt-2 pb-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full text-[9px] font-black uppercase tracking-[0.15em] mb-4 border border-rose-100 dark:border-rose-900/30">
            <SparklesIcon size={11} />
            محرّك PDF احترافي
          </div>
          <h1 className="text-3xl font-black tracking-tighter dark:text-white leading-tight mb-3">
            توقّف عن رفع <br />
            <span className="text-rose-500">خصوصيتك.</span>
          </h1>
          <p className="text-[11px] text-gray-500 dark:text-zinc-500 font-bold max-w-xs mx-auto leading-relaxed">
            ملفاتك لا تترك جهازك — كل المعالجة محلية 100%
          </p>
        </section>

        {/* ===== 🔍 Search Bar ===== */}
        <section className="relative">
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400">
            <SearchIcon size={18} />
          </div>
          <input
            type="text"
            placeholder="ابحث عن أداة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-[1.75rem] py-4 pr-12 pl-4 shadow-sm focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all font-bold text-sm dark:text-white text-right"
          />
        </section>

        {/* ===== 🚀 Upload CTA (يصغّر عندما يبحث المستخدم) ===== */}
        {!searchQuery && activeCategory === 'All' && (
          <section>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gradient-to-br from-rose-500 to-rose-600 rounded-[2rem] p-5 text-right relative overflow-hidden shadow-xl shadow-rose-500/25 active:scale-[0.98] transition-all group"
            >
              {/* توهج خلفي */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                  <UploadIcon size={24} strokeWidth={2.5} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-white leading-none mb-1.5">
                    ارفع ملف PDF
                  </h3>
                  <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
                    اضغط لاختيار ملف من جهازك
                  </p>
                </div>
                <div className="w-8 h-8 bg-white/15 rounded-full flex items-center justify-center shrink-0">
                  <ChevronRightIcon size={16} className="text-white rotate-180" />
                </div>
              </div>
            </button>
          </section>
        )}

        {/* ===== 📋 آخر النشاط ===== */}
        {!searchQuery && activeCategory === 'All' && history.length > 0 && (
          <section>
            <div className="flex items-center justify-between px-1 mb-3">
              <div className="flex items-center gap-2">
                <ClipboardListIcon size={13} className="text-gray-400" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                  آخر النشاط
                </h3>
              </div>
              <button
                onClick={() => navigate('/history')}
                className="text-[10px] font-black uppercase text-rose-500 tracking-wider active:opacity-70"
              >
                عرض الكل
              </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-[1.75rem] border border-gray-100 dark:border-white/5 shadow-sm divide-y divide-gray-50 dark:divide-white/5 overflow-hidden">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate('/history')}
                  className="w-full p-3.5 flex items-center gap-3 active:bg-gray-50 dark:active:bg-white/5 transition-colors text-right"
                >
                  <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                    <FileTextIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-gray-900 dark:text-white leading-tight mb-1">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-rose-500 font-black uppercase tracking-tight">
                        {item.tool}
                      </span>
                      <span className="text-gray-300 dark:text-zinc-700">•</span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
                        {(item.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <ChevronRightIcon size={14} className="text-gray-300 rotate-180" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ===== 🏷️ Category Pills ===== */}
        <section>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] transition-all border ${
                  activeCategory === cat
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-black border-transparent shadow-md'
                    : 'bg-white dark:bg-zinc-900 text-gray-400 border-gray-100 dark:border-white/5'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </section>

        {/* ===== 🎴 الأدوات Grid ===== */}
        <section>
          <div className="flex items-center justify-between px-1 mb-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
              {activeCategory === 'All' ? 'كل الأدوات' : categoryLabels[activeCategory]}
            </h3>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              {filteredTools.length} أداة
            </span>
          </div>

          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredTools.map((tool) => {
                const Icon = tool.icon
                const colors = categoryColors[tool.category]
                return (
                  <button
                    key={tool.title}
                    onClick={() => tool.path && navigate(tool.path)}
                    className="p-4 bg-white dark:bg-zinc-900 rounded-[1.75rem] border border-gray-100 dark:border-white/5 flex flex-col items-start text-right shadow-sm active:scale-[0.97] active:bg-gray-50 dark:active:bg-white/5] transition-all relative overflow-hidden group"
                  >
                    {/* أيقونة */}
                    <div className={`w-11 h-11 ${colors.bg} ${colors.text} rounded-2xl flex items-center justify-center mb-3 group-active:scale-110 transition-transform`}>
                      <Icon size={20} strokeWidth={2.5} />
                    </div>

                    {/* العنوان */}
                    <span className="text-[13px] font-black text-gray-900 dark:text-white leading-tight mb-1.5 line-clamp-2 min-h-[32px">
                      {tool.title}
                    </span>

                    {/* الوصف */}
                    <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 leading-relaxed line-clamp-2">
                      {tool.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            /* ===== حالة فارغة ===== */
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <SearchIcon size={26} />
              </div>
              <h3 className="text-lg font-black dark:text-white mb-1.5">لا توجد نتائج</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-5">
                جرّب كلمة مفتاحية أخرى
              </p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('All') }}
                className="text-rose-500 font-black uppercase tracking-widest text-[11px] active:opacity-70"
              >
                إعادة تعيين
              </button>
            </div>
          )}
        </section>

        {/* ===== 🎯 Quick Access ===== */}
        {!searchQuery && activeCategory === 'All' && (
          <section>
            <button
              onClick={() => navigate('/android-tools')}
              className="w-full p-5 bg-zinc-900 dark:bg-zinc-100 rounded-[2rem] flex items-center justify-between shadow-lg active:scale-[0.98] transition-all relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 p-4 opacity-5 pointer-events-none text-rose-500">
                <LayoutGridIcon size={100} />
              </div>

              <div className="flex items-center gap-4 relative z-10">
                <div className="w-11 h-11 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30">
                  <LayoutGridIcon size={20} strokeWidth={2.5} className="text-white" />
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-white dark:text-black block leading-none mb-1">
                    كل الأدوات
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    {tools.length} محرّك متاح
                  </span>
                </div>
              </div>

              <div className="w-8 h-8 bg-white/10 dark:bg-black/10 rounded-full flex items-center justify-center relative z-10">
                <ChevronRightIcon size={16} className="text-white dark:text-black rotate-180" />
              </div>
            </button>
          </section>
        )}

        {/* ===== ❤️ Support ===== */}
        {!searchQuery && activeCategory === 'All' && (
          <section>
            <a
              href="https://potatameister.github.io/support"
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 bg-white dark:bg-zinc-900 rounded-[2rem] flex items-center gap-4 shadow-sm border border-gray-100 dark:border-white/5 active:scale-[0.99] transition-all relative overflow-hidden"
            >
              <div className="w-11 h-11 bg-rose-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <HeartIcon size={20} className="text-rose-500" fill="currentColor" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-black text-gray-900 dark:text-white block leading-none mb-1">
                  ادعم PaperKnife
                </span>
                <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                  ساهم في تطوير المشروع
                </span>
              </div>
              <div className="w-8 h-8 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center shrink-0">
                <GHIcon size={16} className="text-gray-500 dark:text-zinc-400" />
              </div>
            </a>
          </section>
        )}

        {/* ===== Footer ===== */}
        <div className="flex flex-col items-center gap-2 py-8 opacity-30">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] dark:text-white text-center">
            PaperKnife v1.1.0
          </p>
        </div>

      </main>
    </div>
  )
}