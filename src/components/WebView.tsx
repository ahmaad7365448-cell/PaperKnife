import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tool } from '../types'
import { 
  Search, Sparkles, ChevronDown, Layers, FileText, 
  ShieldCheck, Zap, Palette, ArrowRight, Bot, Focus, Wand2
} from 'lucide-react'
import { useLanguage } from '../LanguageContext'

export default function WebView({ tools = [] }: { tools?: Tool[] }) {
  const { t, language } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getSectionTitle = () => {
    if (searchQuery.trim() !== '') return language === 'ar' ? 'نتائج البحث' : 'Search Results'
    if (activeCategory !== 'All') return activeCategory
    return language === 'ar' ? '🔥 الأدوات الأكثر طلباً' : '🔥 Most Popular Tools'
  }

  const filteredTools = useMemo(() => {
    const safeTools = Array.isArray(tools) ? tools : []

    if (searchQuery.trim() !== '') {
      return safeTools.filter(tool => 
        (tool.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tool.desc || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tool.titleEn || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (activeCategory !== 'All') {
      return safeTools.filter(t => t.category === activeCategory)
    }

    const defaultPaths = ['/merge', '/remove-bg']
    const matches = safeTools.filter(t => defaultPaths.includes(t.path || ''))
    
    if (matches.length > 0) return matches
    return safeTools.filter(t => t.path !== '/cv-maker').slice(0, 2)
  }, [tools, searchQuery, activeCategory])

  const customStyles = `
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob {
      animation: blob 10s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
    }
    .animation-delay-2000 { animation-delay: 2s; }
    .animation-delay-4000 { animation-delay: 4s; }
    
    .glass-panel {
      background: rgba(24, 24, 27, 0.65);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 30px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
    }

    .custom-scroll::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: rgba(244, 63, 94, 0.4);
      border-radius: 10px;
    }
  `

  const safeToolsList = Array.isArray(tools) ? tools : []

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <style>{customStyles}</style>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000" />
      </div>
      
      <div className="relative z-10 pt-16 pb-12 mb-8 max-w-6xl mx-auto px-6">
        
        <div className="flex items-center justify-between w-full mb-8">
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
              className="h-14 glass-panel rounded-2xl flex items-center justify-between px-6 text-white hover:border-rose-500/50 transition-all group gap-3 font-bold text-sm shadow-xl"
            >
              <div className="flex items-center gap-2.5">
                <Layers size={20} className="text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="tracking-wide">{language === 'ar' ? 'كل الأدوات' : 'All Tools'}</span>
              </div>
              <ChevronDown size={18} className={`text-zinc-400 transition-transform duration-300 ${isCategoryMenuOpen ? 'rotate-180 text-rose-400' : ''}`} />
            </button>

            {isCategoryMenuOpen && (
              <div className={`absolute top-[115%] ${language === 'ar' ? 'right-0' : 'left-0'} w-80 glass-panel rounded-3xl p-3 z-50 shadow-[0_20px_60px_rgba(0,0,0,0.9)] border border-white/10 flex flex-col gap-2`}>
                <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                  <span className="text-xs font-black text-rose-400 uppercase tracking-wider">
                    {language === 'ar' ? `جميع الأدوات (${safeToolsList.length})` : `All Tools (${safeToolsList.length})`}
                  </span>
                  <Sparkles size={14} className="text-rose-400" />
                </div>

                <div className="max-h-80 overflow-y-auto custom-scroll space-y-1 pr-1">
                  {safeToolsList.map((t) => {
                    const Icon = t.icon || Layers
                    const toolTitle = language === 'ar' ? t.title : (t.titleEn || t.title)
                    const toolDesc = language === 'ar' ? t.desc : (t.descEn || t.desc)
                    return (
                      <button
                        key={t.title || t.path}
                        onClick={() => {
                          if (t.path) {
                            navigate(t.path)
                            setIsCategoryMenuOpen(false)
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 ${language === 'ar' ? 'text-right' : 'text-left'} transition-colors group`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.bg || 'bg-rose-500/10'}`}>
                          <Icon size={18} className={t.color || 'text-rose-400'} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate">{toolTitle}</div>
                          <div className="text-[11px] text-zinc-400 truncate">{toolDesc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-rose-400 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
            <Bot size={16} className="animate-pulse text-indigo-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-l from-rose-400 to-indigo-400">
              {language === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : 'Powered by AI'}
            </span>
          </div>

          <div className="w-36 hidden md:block"></div>
        </div>

        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white via-zinc-200 to-zinc-500 tracking-tight mb-6 leading-tight">
            {language === 'ar' ? 'الجيل الجديد من' : 'The Next Generation of'} <br className="md:hidden" />
            <span className="text-rose-500 drop-shadow-[0_0_40px_rgba(244,63,94,0.4)]">
              {language === 'ar' ? 'أدوات الأعمال.' : 'Business Tools.'}
            </span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            {language === 'ar' 
              ? 'منصة سحابية متطورة تدمج بين قوة معالجة ملفات PDF، وذكاء توليد السير الذاتية، وسحر التعديل البصري في مساحة عمل واحدة.'
              : 'A powerful cloud platform combining PDF processing, intelligent CV generation, and visual editing in one workspace.'}
          </p>
        </div>

        <div className="max-w-3xl mx-auto relative w-full">
          <div className={`absolute inset-y-0 ${language === 'ar' ? 'right-0 pr-6' : 'left-0 pl-6'} flex items-center pointer-events-none`}>
            <Search size={22} className="text-zinc-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (activeCategory !== 'All') setActiveCategory('All')
            }}
            placeholder={language === 'ar' ? 'عن ماذا تبحث؟ (مثال: دمج، سيرة ذاتية، باركود...)' : 'What are you looking for? (e.g. merge, CV, barcode...)'}
            className={`w-full h-16 glass-panel rounded-2xl ${language === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50 transition-all font-medium text-lg`}
          />
        </div>

      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 mb-28">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-1.5 h-6 bg-gradient-to-b from-rose-400 to-indigo-500 rounded-full" />
          <h2 className="text-xl font-black text-white tracking-tight">{getSectionTitle()}</h2>
        </div>

        {filteredTools.length > 0 ? (
          <div className={`grid grid-cols-1 md:grid-cols-2 ${filteredTools.length > 2 ? 'lg:grid-cols-3' : 'max-w-4xl mx-auto'} gap-6`}>
            {filteredTools.map((tool, index) => {
              const Icon = tool.icon || Layers
              const isAITool = tool.path === '/cv-maker'
              const toolTitle = language === 'ar' ? tool.title : (tool.titleEn || tool.title)
              const toolDesc = language === 'ar' ? tool.desc : (tool.descEn || tool.desc)

              return (
                <div 
                  key={tool.title} 
                  onClick={() => tool.path && navigate(tool.path)}
                  className="group relative glass-panel rounded-3xl p-6 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] hover:border-rose-500/30 overflow-hidden"
                >
                  <div className={`absolute ${language === 'ar' ? '-right-12' : '-left-12'} -top-12 w-40 h-40 ${(tool.bg || '').replace('/20', '/15')} blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                  
                  {isAITool && (
                    <div className={`absolute top-0 ${language === 'ar' ? 'left-6' : 'right-6'} px-3 py-1 bg-gradient-to-r from-indigo-500/20 to-rose-500/20 border border-white/10 rounded-b-xl backdrop-blur-md flex items-center gap-1.5`}>
                      <Sparkles size={12} className="text-indigo-400" />
                      <span className="text-[10px] font-black text-white tracking-wider uppercase">AI Agent</span>
                    </div>
                  )}

                  <div className="relative z-10 flex items-start gap-5 mt-2">
                    <div className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${tool.bg || 'bg-rose-500/10'} border border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                      <Icon size={28} className={tool.color || 'text-rose-500'} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white mb-2 group-hover:text-rose-400 transition-colors">{toolTitle}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed font-medium">{toolDesc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24 glass-panel rounded-3xl border-dashed">
            <Search size={48} className="mx-auto text-zinc-600 mb-5 animate-bounce" />
            <p className="text-2xl text-zinc-400 font-black">{language === 'ar' ? 'لم يتم العثور على أداة' : 'No tools found'}</p>
          </div>
        )}
      </div>
    </div>
  )
}