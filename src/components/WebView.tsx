import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tool } from '../types'
import { 
  Search, Sparkles, ChevronDown, Layers, FileText, 
  ShieldCheck, Zap, Palette, ArrowRight, Bot, Focus, Wand2
} from 'lucide-react'

// التصنيفات المتاحة
const CATEGORIES = [
  { id: 'All', label: 'كل التصنيفات', icon: Layers },
  { id: 'Edit', label: 'تعديل وتنسيق PDF', icon: FileText },
  { id: 'Convert', label: 'تحويل الملفات والباركود', icon: Zap },
  { id: 'Secure', label: 'الحماية والتشفير', icon: ShieldCheck },
  { id: 'Optimize', label: 'تحسين وضغط', icon: Zap },
  { id: 'Creative', label: 'إبداع وتصميم', icon: Palette },
]

export default function WebView({ tools = [] }: { tools?: Tool[] }) {
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

  // دالة تحديد عنوان القسم بدون أي أخطاء
  const getSectionTitle = () => {
    if (searchQuery.trim() !== '') return 'نتائج البحث'
    if (activeCategory !== 'All') return CATEGORIES.find(c => c.id === activeCategory)?.label || 'الأدوات'
    return '🔥 الأدوات الأكثر طلباً'
  }

  // فلترة الأدوات (دمج PDF + إزالة خلفية الصور لمنع تكرار السيرة الذاتية)
  const filteredTools = useMemo(() => {
    const safeTools = Array.isArray(tools) ? tools : []

    if (searchQuery.trim() !== '') {
      return safeTools.filter(tool => 
        (tool.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tool.desc || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (activeCategory !== 'All') {
      return safeTools.filter(t => t.category === activeCategory)
    }

    // عرض عملين فقط بالواجهة الافتراضية
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
    <div className="min-h-screen pb-24 relative overflow-hidden" dir="rtl">
      <style>{customStyles}</style>

      {/* 🌌 الخلفية المتحركة */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000" />
        
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>
      
      {/* 🌟 القسم العلوي */}
      <div className="relative z-10 pt-16 pb-12 mb-8 max-w-6xl mx-auto px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* الشريط العلوي: زر كل الأدوات في أقصى اليمين */}
        <div className="flex items-center justify-between w-full mb-8">
          
          {/* 📍 زر "كل الأدوات" والقائمة المنسدلة لجميع الأعمال */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
              className="h-14 glass-panel rounded-2xl flex items-center justify-between px-6 text-white hover:border-rose-500/50 transition-all group gap-3 font-bold text-sm shadow-xl"
            >
              <div className="flex items-center gap-2.5">
                <Layers size={20} className="text-rose-500 group-hover:scale-110 transition-transform" />
                <span className="tracking-wide">كل الأدوات</span>
              </div>
              <ChevronDown size={18} className={`text-zinc-400 transition-transform duration-300 ${isCategoryMenuOpen ? 'rotate-180 text-rose-400' : ''}`} />
            </button>

            {/* القائمة العمودية المنسدلة لجميع الأعمال */}
            {isCategoryMenuOpen && (
              <div className="absolute top-[115%] right-0 w-80 glass-panel rounded-3xl p-3 z-50 shadow-[0_20px_60px_rgba(0,0,0,0.9)] border border-white/10 animate-in fade-in zoom-in-95 duration-200 origin-top-right flex flex-col gap-2">
                
                <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                  <span className="text-xs font-black text-rose-400 uppercase tracking-wider">جميع الأدوات ({safeToolsList.length})</span>
                  <Sparkles size={14} className="text-rose-400" />
                </div>

                <div className="max-h-80 overflow-y-auto custom-scroll space-y-1 pr-1">
                  {safeToolsList.map((t) => {
                    const Icon = t.icon || Layers
                    return (
                      <button
                        key={t.title || t.path}
                        onClick={() => {
                          if (t.path) {
                            navigate(t.path)
                            setIsCategoryMenuOpen(false)
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-right transition-colors group"
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.bg || 'bg-rose-500/10'}`}>
                          <Icon size={18} className={t.color || 'text-rose-400'} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate">{t.title}</div>
                          <div className="text-[11px] text-zinc-400 truncate">{t.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>

              </div>
            )}
          </div>

          {/* شارة الذكاء الاصطناعي في المنتصف */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-rose-400 text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-2xl hover:bg-white/10 transition-colors cursor-default">
            <Bot size={16} className="animate-pulse text-indigo-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-l from-rose-400 to-indigo-400">مدعوم بالذكاء الاصطناعي</span>
          </div>

          <div className="w-36 hidden md:block"></div>
        </div>

        {/* العناوين والوصف */}
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white via-zinc-200 to-zinc-500 tracking-tight mb-6 leading-tight">
            الجيل الجديد من <br className="md:hidden" />
            <span className="text-rose-500 drop-shadow-[0_0_40px_rgba(244,63,94,0.4)]">أدوات الأعمال.</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            منصة سحابية متطورة تدمج بين قوة معالجة ملفات PDF، وذكاء توليد السير الذاتية، وسحر التعديل البصري في مساحة عمل واحدة.
          </p>
        </div>

        {/* 🔍 شريط البحث المنفرد */}
        <div className="max-w-3xl mx-auto relative w-full">
          <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
            <Search size={22} className="text-zinc-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              if (activeCategory !== 'All') setActiveCategory('All')
            }}
            placeholder="عن ماذا تبحث؟ (مثال: دمج، سيرة ذاتية، باركود...)"
            className="w-full h-16 glass-panel rounded-2xl pr-14 pl-6 text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20 transition-all font-medium text-lg"
          />
        </div>

      </div>

      {/* 🧰 شبكة الأدوات الفعالة */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 mb-28">
        <div className="mb-8 flex items-center gap-3 animate-in fade-in duration-1000 delay-300">
          <div className="w-1.5 h-6 bg-gradient-to-b from-rose-400 to-indigo-500 rounded-full" />
          <h2 className="text-xl font-black text-white tracking-tight">{getSectionTitle()}</h2>
        </div>

        {filteredTools.length > 0 ? (
          <div className={`grid grid-cols-1 md:grid-cols-2 ${filteredTools.length > 2 ? 'lg:grid-cols-3' : 'max-w-4xl mx-auto'} gap-6`}>
            {filteredTools.map((tool, index) => {
              const Icon = tool.icon || Layers
              const isAITool = tool.path === '/cv-maker'

              return (
                <div 
                  key={tool.title} 
                  onClick={() => tool.path && navigate(tool.path)}
                  className="group relative glass-panel rounded-3xl p-6 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] hover:border-rose-500/30 overflow-hidden animate-in fade-in slide-in-from-bottom-8"
                  style={{ animationFillMode: 'both', animationDelay: `${index * 100}ms` }}
                >
                  <div className={`absolute -right-12 -top-12 w-40 h-40 ${(tool.bg || '').replace('/20', '/15')} blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                  
                  {isAITool && (
                    <div className="absolute top-0 left-6 px-3 py-1 bg-gradient-to-r from-indigo-500/20 to-rose-500/20 border border-white/10 rounded-b-xl backdrop-blur-md flex items-center gap-1.5">
                      <Sparkles size={12} className="text-indigo-400" />
                      <span className="text-[10px] font-black text-white tracking-wider uppercase">AI Agent</span>
                    </div>
                  )}

                  <div className="relative z-10 flex items-start gap-5 mt-2">
                    <div className={`shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center ${tool.bg || 'bg-rose-500/10'} border border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                      <Icon size={28} className={tool.color || 'text-rose-500'} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white mb-2 group-hover:text-rose-400 transition-colors">{tool.title}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed font-medium">{tool.desc}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24 glass-panel rounded-3xl border-dashed">
            <Search size={48} className="mx-auto text-zinc-600 mb-5 animate-bounce" />
            <p className="text-2xl text-zinc-400 font-black">لم يتم العثور على أداة</p>
            <p className="text-zinc-500 mt-2">جرب البحث بكلمات أخرى</p>
          </div>
        )}
      </div>

      {/* 🖼️ معرض الإمكانيات والأعمال */}
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-6 mb-12">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500 tracking-tight text-center">
            تكنولوجيا تغير قواعد اللعبة
          </h2>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 🧠 1. توليد السيرة بالذكاء الاصطناعي */}
          <div 
            onClick={() => navigate('/cv-maker')}
            className="lg:col-span-2 group relative h-80 rounded-[2.5rem] overflow-hidden cursor-pointer bg-zinc-900 border border-white/10 hover:border-indigo-500/50 transition-all duration-500 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-zinc-900 to-zinc-900 z-0" />
            
            <div className="relative z-10 p-10 h-full flex flex-col justify-center w-full lg:w-2/3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-6 w-fit">
                <Bot size={14} /> بناء تلقائي بالذكاء الاصطناعي
              </div>
              <h3 className="text-3xl lg:text-4xl font-black text-white mb-4 tracking-tight leading-tight">
                سيرتك الذاتية تُكتب <span className="text-indigo-400">بنفسها.</span>
              </h3>
              <p className="text-zinc-400 mb-8 font-medium leading-relaxed">
                دع الذكاء الاصطناعي يحلل بياناتك، يصيغ مهاراتك، ويبني لك سيرة ذاتية احترافية تتخطى أنظمة الفرز (ATS) في ثوانٍ.
              </p>
              <div className="flex items-center gap-2 text-white font-bold text-sm group-hover:gap-4 transition-all">
                جرب السحر الآن <ArrowRight size={16} className="rotate-180 text-indigo-400" />
              </div>
            </div>

            <div className="absolute left-0 top-0 w-1/3 h-full hidden lg:flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity duration-700">
               <div className="relative w-48 h-64 bg-zinc-950/80 border border-indigo-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(79,70,229,0.3)] transform rotate-6 group-hover:rotate-0 transition-transform duration-700">
                  <div className="w-full h-4 bg-indigo-500/20 rounded mb-4 animate-pulse" />
                  <div className="w-3/4 h-3 bg-zinc-800 rounded mb-2" />
                  <div className="w-full h-3 bg-zinc-800 rounded mb-6" />
                  <div className="w-5/6 h-3 bg-zinc-800 rounded mb-2" />
                  <div className="w-4/6 h-3 bg-zinc-800 rounded mb-2" />
                  
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-400 shadow-[0_0_10px_#818cf8] animate-[bounce_3s_infinite]" />
               </div>
            </div>
          </div>

          {/* 👁️ 2. استخراج النصوص الذكي (OCR) */}
          <div 
            onClick={() => navigate('/pdf-to-text')}
            className="group relative h-80 rounded-[2.5rem] overflow-hidden cursor-pointer bg-zinc-900 border border-white/10 hover:border-emerald-500/50 transition-all duration-500 shadow-2xl"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/20 to-zinc-900 z-0" />
            
            <div className="relative z-10 p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform duration-500 rotate-12 group-hover:rotate-0">
                <Focus size={40} className="text-emerald-400" />
                <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-3xl animate-[ping_3s_infinite]" />
              </div>
              <h3 className="text-2xl font-black text-white mb-3">عيون تقرأ الصور</h3>
              <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                استخرج النصوص والكلمات من أي صورة أو مستند PDF ممسوح ضوئياً بدقة فائقة وبدعم كامل للغة العربية.
              </p>
            </div>
          </div>

          {/* ✨ 3. السحر البصري لإزالة الخلفية */}
          <div 
            onClick={() => navigate('/remove-bg')}
            className="lg:col-span-3 group relative h-72 rounded-[2.5rem] overflow-hidden cursor-pointer bg-zinc-900 border border-white/10 hover:border-rose-500/50 transition-all duration-500 shadow-2xl flex flex-col md:flex-row items-center"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-rose-600/20 via-zinc-900 to-zinc-900 z-0" />
            
            <div className="relative z-10 p-10 flex-1">
              <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center backdrop-blur-md border border-rose-500/30 mb-6">
                <Wand2 size={28} />
              </div>
              <h3 className="text-3xl font-black text-white mb-4">قص احترافي بلمسة زر</h3>
              <p className="text-zinc-400 font-medium mb-6 max-w-lg text-lg">
                لا حاجة للفوتوشوب بعد الآن. افصل المنتجات والأشخاص عن خلفياتهم المعقدة بشفافية مذهلة وحواف دقيقة لتصاميمك ومتاجرك.
              </p>
            </div>

            <div className="relative z-10 w-full md:w-1/3 h-full hidden md:flex items-center justify-center pr-10">
               <div className="relative w-48 h-48 rounded-full border-4 border-white/10 overflow-hidden group-hover:border-rose-500/50 transition-colors duration-500">
                  <div className="absolute inset-0 opacity-50 bg-[radial-gradient(#2d2d3f_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div className="absolute inset-y-0 right-0 w-1/2 bg-zinc-700 transition-all duration-700 group-hover:w-0" />
                  <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-rose-500 shadow-[0_0_15px_#f43f5e] group-hover:left-full transition-all duration-700" />
               </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}