import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Moon as MoonIcon, Sun as SunIcon,
  Languages as LanguagesIcon,
  History as HistoryIcon, Upload as UploadIcon,
  ChevronDown as ChevronDownIcon,
  X as XIcon, Plus as PlusIcon,
  CheckCircle2 as CheckCircleIcon, Home as HomeIcon,
  Info as InfoIcon, ArrowLeft as ArrowLeftIcon,
  LayoutGrid as LayoutGridIcon, Settings as SettingsIcon,
  Heart as HeartIcon, User as UserIcon,
  LogOut as LogOutIcon, UserCircle2 as UserCircleIcon, Sparkles as SparklesIcon,
  MessageCircle, Send as SendIcon, Bug as BugIcon, Menu as MenuIcon
} from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Tool, ToolCategory, ViewMode } from '../types'
import { PaperKnifeLogo } from './Logo'
import { ActivityEntry, getRecentActivity } from '../utils/recentActivity'
import { useBackHandler } from '../utils/backHandler'
import { hapticImpact } from '../utils/haptics'
import { usePipeline } from '../utils/pipelineContext'
import { toast } from 'sonner'
import { useLanguage } from '../LanguageContext'
import { useAuth } from '../AuthContext'
import { getToolLabel } from '../utils/toolLabels'

interface LayoutProps {
  children: React.ReactNode
  theme: 'light' | 'dark'
  toggleTheme: () => void
  tools: Tool[]
  onFileDrop?: (files: FileList) => void
  viewMode: ViewMode
}

const categoryColors: Record<ToolCategory, { bg: string, text: string, hover: string, iconBg: string }> = {
  Edit: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-500', hover: 'hover:bg-rose-50 dark:hover:bg-rose-900/10', iconBg: 'bg-rose-100 dark:bg-rose-900/30' },
  Secure: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-500', hover: 'hover:bg-indigo-50 dark:hover:bg-indigo-900/10', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  Convert: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-500', hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/10', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  Optimize: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-500', hover: 'hover:bg-amber-50 dark:hover:bg-amber-900/10', iconBg: 'bg-amber-100 dark:bg-amber-900/30' }
}

const categoryLabelKey: Record<ToolCategory, 'categoryEdit' | 'categorySecure' | 'categoryConvert' | 'categoryOptimize'> = {
  Edit: 'categoryEdit',
  Secure: 'categorySecure',
  Convert: 'categoryConvert',
  Optimize: 'categoryOptimize',
}

export default function Layout({ children, theme, toggleTheme, tools, onFileDrop, viewMode }: LayoutProps) {
  const { t, isRTL, language, toggleLanguage } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [isDragging, setIsDragging] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showFabMenu, setShowFabMenu] = useState(false)
  const [showMobileDrawer, setShowMobileDrawer] = useState(false)
  const { setPipelineFile } = usePipeline()
  const { user, profile, signOut } = useAuth()

  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Chat Widget State
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<{role: 'user'|'bot', text: string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatMessages.length === 0) {
      setChatMessages([{role: 'bot', text: t('chatWelcome')}])
    }
  }, [t, chatMessages.length])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!chatInput.trim()) return
    const userMsg = chatInput.trim()
    setChatMessages(prev => [...prev, {role: 'user', text: userMsg}])
    setChatInput('')
    setIsTyping(true)

    try {
      const response = await fetch('https://stool-apostle-postcard.ngrok-free.dev/webhook/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId: user?.email || 'guest' })
      })
      const data = await response.json()
      setChatMessages(prev => [...prev, {role: 'bot', text: data.reply || t('done')}])
      setIsTyping(false)
    } catch {
      setChatMessages(prev => [...prev, {role: 'bot', text: t('errorNetwork')}])
      setIsTyping(false)
    }
  }

  const getAvatarUrl = () => {
    return profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null
  }

  const getUserInitials = () => {
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
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name
    if (user?.email) return user.email.split('@')[0]
    return t('userLabel')
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success(t('signOutSuccess') + ' 👋')
      setShowUserMenu(false)
      navigate('/login')
    } catch {
      toast.error(t('signOutError'))
    }
  }

  const pickFileForTool = (tool: Tool) => {
    if (!tool.implemented || !tool.path) return
    setShowFabMenu(false)
    setShowMobileDrawer(false)
    hapticImpact()
    const input = document.createElement('input')
    input.type = 'file'
    const isImageTool = tool.path === '/image-to-pdf'
    input.accept = isImageTool ? 'image/*' : '.pdf'
    input.multiple = isImageTool
    input.onchange = async () => {
      const files = (input as HTMLInputElement).files
      if (!files || files.length === 0) return
      try {
        if (isImageTool) { onFileDrop?.(files); return }
        const file = files[0]
        toast.loading(`${t('importingFile')} ${file.name}...`, { id: 'fab-load' })
        const buffer = await file.arrayBuffer()
        setPipelineFile({ buffer: new Uint8Array(buffer), name: file.name, type: file.type || 'application/pdf' })
        navigate(tool.path as string)
        toast.success(`${t('openedIn')} ${getToolLabel(tool, language).title}`, { id: 'fab-load' })
      } catch {
        toast.error(t('unknownError'))
      }
    }
    input.click()
  }

  const fabToolRow = (tool: Tool) => {
    const label = getToolLabel(tool, language)
    return (
      <button
        key={tool.title}
        onClick={() => pickFileForTool(tool)}
        className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-white/5 active:bg-gray-50 dark:active:bg-zinc-800 active:scale-95 transition-all shadow-sm group cursor-pointer w-full text-right"
      >
        <div className={'p-2 rounded-xl ' + tool.bg + ' ' + tool.color + ' group-active:scale-110 transition-transform shrink-0'}>
          <tool.icon size={18} strokeWidth={2.5} />
        </div>
        <span className="text-xs font-bold text-gray-900 dark:text-zinc-200 truncate">{label.title}</span>
      </button>
    )
  }

  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isNative = Capacitor.isNativePlatform()
  const showMobileNav = isNative || viewMode === 'android'

  useBackHandler(showFabMenu, () => setShowFabMenu(false))
  useBackHandler(showHistory && !showFabMenu, () => setShowHistory(false))

  useEffect(() => { if (showHistory) { getRecentActivity().then(setActivity) } }, [showHistory])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsDropdownOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); if (onFileDrop) setIsDragging(true) }
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) setIsDragging(false)
    }
    const handleDrop = (e: DragEvent) => {
      e.preventDefault(); setIsDragging(false)
      if (onFileDrop && e.dataTransfer?.files) onFileDrop(e.dataTransfer.files)
    }
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)
    return () => {
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
    }
  }, [onFileDrop])

  const activeTool = tools.find(t => {
    const pathPart = t.title.split(' ')[0].toLowerCase()
    return location.pathname.includes('/' + pathPart)
  })

  const isHome = location.pathname === '/'
  const isMainView = isHome || location.pathname.endsWith('/android-tools') || location.pathname.endsWith('/android-history') || location.pathname.endsWith('/settings')
  const shouldShowNav = showMobileNav && isMainView && !activeTool

  const activeToolLabel = activeTool ? getToolLabel(activeTool, language).title : t('toolLabel')

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/tools')
    }
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col text-gray-900 dark:text-zinc-100 transition-colors duration-300 relative overflow-x-hidden">

      {isDragging && (
        <div className="fixed inset-0 z-[200] bg-rose-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-[3rem] shadow-2xl border-4 border-dashed border-rose-500 animate-in zoom-in duration-300">
            <UploadIcon size={64} className="text-rose-500 animate-bounce" />
            <p className="mt-4 font-black uppercase tracking-widest text-rose-500 text-center text-sm">{t('dropFileToStart')}</p>
          </div>
        </div>
      )}

      {/* الهيدر المحسّن بالكامل ليناسب الهواتف والشاشات الكبيرة */}
      <header className="flex items-center justify-between px-3 sm:px-6 md:px-8 h-16 md:h-20 border-b border-gray-100 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-[100] w-full">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          
          {/* زر القائمة الجانبية (الثلاث خطوط) للهواتف والشاشات الصغيرة */}
          <button 
            onClick={() => { hapticImpact(); setShowMobileDrawer(true); }}
            className="p-2 -ml-1 sm:hidden hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-xl transition-colors text-gray-700 dark:text-zinc-200 shrink-0 cursor-pointer"
            title="القائمة"
          >
            <MenuIcon size={22} />
          </button>

          {!isHome && (
            <button 
              onClick={handleBackNavigation} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-xl transition-colors text-gray-500 hover:text-rose-500 shrink-0 cursor-pointer"
              title={t('backOneStep')}
            >
              <ArrowLeftIcon size={18} className={isRTL ? '' : 'rotate-180'} />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0 cursor-pointer">
            <PaperKnifeLogo size={26} iconColor="#F43F5E" />
            <span className="font-black tracking-tighter text-base sm:text-lg md:text-xl dark:text-white truncate">{t('appName')}</span>
          </Link>
          
          <div className="h-5 w-[1px] bg-gray-200 dark:bg-zinc-800 mx-1 shrink-0 hidden sm:block" />
          
          {/* قائمة اختيار الأدوات المنسدلة للشاشات */}
          <div className="relative min-w-0 hidden sm:block" ref={dropdownRef}>
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all font-black text-xs md:text-sm uppercase tracking-wider min-w-0 cursor-pointer ' + (isDropdownOpen ? 'bg-rose-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900')}>
              <span className="truncate max-w-[120px] md:max-w-none">{isHome ? t('allTools') : activeToolLabel}</span>
              <ChevronDownIcon size={14} className={'transition-transform duration-300 shrink-0 ' + (isDropdownOpen ? 'rotate-180' : '')} />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-3 w-72 md:w-80 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2rem] shadow-2xl py-4 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 max-h-[80vh] overflow-y-auto scrollbar-hide z-[110]">
                {Object.entries(tools.filter(t => t.implemented).reduce((acc, tool) => { if (!acc[tool.category]) acc[tool.category] = []; acc[tool.category].push(tool); return acc }, {} as Record<string, Tool[]>)).map(([category, categoryTools]) => {
                  const colors = categoryColors[category as ToolCategory]
                  return (
                    <div key={category} className="mb-4">
                      <div className="px-6 py-2">
                        <span className={'text-[10px] font-black uppercase tracking-[0.2em] ' + colors.text + ' opacity-60'}>
                          {t(categoryLabelKey[category as ToolCategory])}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-1 px-2">
                        {categoryTools.map((tool, i) => {
                          const Icon = tool.icon; const isActive = activeTool?.title === tool.title && !isHome
                          const label = getToolLabel(tool, language)
                          return (
                            <button key={i} onClick={() => { navigate(tool.path || '/'); setIsDropdownOpen(false); }} className={'flex items-center gap-4 p-3 rounded-2xl transition-all text-right group cursor-pointer ' + (isActive ? colors.bg + ' ' + colors.text : 'hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400')}>
                              <div className={'p-2 rounded-lg transition-colors shrink-0 ' + (isActive ? 'bg-white dark:bg-zinc-800' : colors.iconBg + ' ' + colors.text + ' opacity-70 group-hover:opacity-100')}><Icon size={18} /></div>
                              <div className="flex-1 min-w-0 text-right">
                                <p className="text-xs font-black uppercase tracking-tight">{label.title}</p>
                                <p className="text-[10px] opacity-60 truncate">{label.desc}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* الأزرار العلوية للشاشات الكبيرة والهواتف */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="relative" ref={userMenuRef}>
            {!user ? (
              <Link
                to="/login"
                className="p-2 sm:px-3.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 shadow-sm cursor-pointer"
              >
                <UserIcon size={16} />
                <span className="hidden sm:inline">{t('signIn')}</span>
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`flex items-center gap-1.5 p-1 sm:pr-3 rounded-xl transition-all border cursor-pointer ${
                    showUserMenu
                      ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30'
                      : 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 text-rose-500'
                  }`}
                  title={getDisplayName()}
                >
                  <div className={`w-7 h-7 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center font-black text-xs overflow-hidden transition-all ${
                    showUserMenu ? 'bg-white text-rose-500' : 'bg-rose-500 text-white'
                  }`}>
                    {getAvatarUrl() ? (
                      <img src={getAvatarUrl()!} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      getUserInitials()
                    )}
                  </div>
                  <span className="hidden md:inline text-xs font-black tracking-wide max-w-[100px] truncate">
                    {getDisplayName()}
                  </span>
                  <ChevronDownIcon
                    size={14}
                    className={`hidden md:block transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`}
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute top-full left-0 md:left-auto md:right-0 mt-3 w-72 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 z-[200]">
                    <div className="p-5 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-b border-gray-100 dark:border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-rose-500/30 shrink-0 overflow-hidden border border-white/20">
                          {getAvatarUrl() ? (
                            <img src={getAvatarUrl()!} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            getUserInitials()
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <p className="font-black text-sm text-gray-900 dark:text-white truncate">{getDisplayName()}</p>
                            <SparklesIcon size={12} className="text-rose-500 shrink-0" />
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 justify-end">
                            <span className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-500">
                              <CheckCircleIcon size={10} /> {t('verifiedAccount')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button onClick={() => { navigate('/profile'); setShowUserMenu(false) }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-gray-700 dark:text-zinc-300 group cursor-pointer">
                        <UserCircleIcon size={16} className="text-rose-500" />
                        <span className="text-xs font-bold">{t('myProfile')}</span>
                      </button>
                      <button onClick={() => { navigate('/history'); setShowUserMenu(false) }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-gray-700 dark:text-zinc-300 group cursor-pointer">
                        <HistoryIcon size={16} className="text-rose-500" />
                        <span className="text-xs font-bold">{t('historyLabel')}</span>
                      </button>
                      <div className="my-1.5 mx-4 h-[1px] bg-gray-100 dark:bg-zinc-800" />
                      <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-rose-500 cursor-pointer">
                        <LogOutIcon size={16} />
                        <span className="text-xs font-bold">{t('signOut')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <Link to="/contact" className={'p-2 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer hidden sm:flex ' + (location.pathname.includes('contact') ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-900')}>
            <MessageCircle size={18} />
          </Link>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all group cursor-pointer"
            title={language === 'ar' ? t('switchToEnglish') : t('switchToArabic')}
          >
            <LanguagesIcon size={15} className="text-gray-400 group-hover:text-rose-500 transition-colors" />
            <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-rose-500 transition-colors">
              {language === 'ar' ? 'AR' : 'EN'}
            </span>
          </button>

          <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer" title={theme === 'light' ? t('darkMode') : t('lightMode')}>
            {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
          </button>
        </div>
      </header>

      {/* قائمة الجوال الجانبية (Drawer) عند الضغط على الثلاث خطوط */}
      {showMobileDrawer && (
        <div className="fixed inset-0 z-[250] flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowMobileDrawer(false)} />
          <div className="relative w-80 max-w-[85vw] bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <PaperKnifeLogo size={28} iconColor="#F43F5E" />
                <span className="font-black text-lg dark:text-white">{t('appName')}</span>
              </div>
              <button onClick={() => setShowMobileDrawer(false)} className="p-2 rounded-full bg-gray-100 dark:bg-zinc-900 text-gray-500 cursor-pointer">
                <XIcon size={18} />
              </button>
            </div>

            <div className="py-6 space-y-6 flex-1">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">{t('allTools')}</p>
                <div className="space-y-1.5">
                  {tools.filter(t => t.implemented).map((tool, idx) => {
                    const label = getToolLabel(tool, language)
                    const Icon = tool.icon
                    return (
                      <button
                        key={idx}
                        onClick={() => { navigate(tool.path || '/files'); setShowMobileDrawer(false); }}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-rose-50 dark:hover:bg-zinc-900 text-right text-gray-700 dark:text-zinc-200 transition-all cursor-pointer"
                      >
                        <div className={`p-2 rounded-xl ${tool.bg} ${tool.color} shrink-0`}>
                          <Icon size={18} />
                        </div>
                        <span className="text-xs font-bold truncate">{label.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                <Link to="/about" onClick={() => setShowMobileDrawer(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-xs font-bold text-gray-700 dark:text-zinc-300">
                  <InfoIcon size={18} className="text-rose-500" />
                  <span>{t('about')}</span>
                </Link>
                <Link to="/contact" onClick={() => setShowMobileDrawer(false)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-xs font-bold text-gray-700 dark:text-zinc-300">
                  <MessageCircle size={18} className="text-rose-500" />
                  <span>{t('contact')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className={'flex-1 min-w-0 relative ' + (shouldShowNav ? 'pb-32' : '')}>
        <div className="relative z-10 w-full max-w-full">
          {children}
        </div>
      </main>

      {!showMobileNav && (
        <footer className="border-t border-gray-100 dark:border-white/5 mt-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md relative z-20">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-12">
            <div className="grid grid-cols-2 md:grid-cols-12 gap-8 mb-12">
              <div className="col-span-2 md:col-span-6 space-y-4">
                <Link to="/" className="flex items-center gap-2.5 text-gray-900 dark:text-white group w-fit cursor-pointer">
                  <PaperKnifeLogo size={22} iconColor="#F43F5E" partColor="currentColor" />
                  <span className="font-bold tracking-tight text-lg group-hover:text-rose-500 transition-colors">{t('appName')}</span>
                </Link>
                <p className="text-gray-500 dark:text-zinc-500 text-xs leading-relaxed max-w-sm">{t('tagline')}</p>
              </div>
              <div className="col-span-1 md:col-span-3">
                <h4 className="font-bold text-[10px] uppercase tracking-widest text-gray-900 dark:text-white mb-4">{t('protocol')}</h4>
                <ul className="space-y-2.5 text-xs text-gray-500 dark:text-zinc-500">
                  <li><Link to="/about" className="hover:text-rose-500 transition-colors cursor-pointer">{t('about')}</Link></li>
                  <li><Link to="/contact" className="hover:text-rose-500 transition-colors cursor-pointer">{t('contact')}</Link></li>
                  <li><a href="https://potatameister.github.io/privacy/paperknife" target="_blank" rel="noopener noreferrer" className="hover:text-rose-500 transition-colors cursor-pointer">{t('privacyPolicy')}</a></li>
                  <li><Link to="/terms" className="hover:text-rose-500 transition-colors cursor-pointer">{t('termsOfUse')}</Link></li>
                </ul>
              </div>
              <div className="col-span-1 md:col-span-3">
                <h4 className="font-bold text-[10px] uppercase tracking-widest text-gray-900 dark:text-white mb-4">{t('ecosystem')}</h4>
                <ul className="space-y-2.5 text-xs text-gray-500 dark:text-zinc-500">
                  <li>
                    <Link to="/contact" className="inline-flex items-center gap-2 hover:text-rose-500 transition-colors cursor-pointer">
                      {t('supportUs')} <HeartIcon size={12} className="text-rose-500 animate-pulse shrink-0" />
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="inline-flex items-center gap-2 hover:text-rose-500 transition-colors cursor-pointer">
                      {t('reportBug')} <BugIcon size={12} className="text-amber-500 shrink-0" />
                    </Link>
                  </li>
                  <li><Link to="/thanks" className="hover:text-rose-500 transition-colors cursor-pointer">{t('hallOfFame')}</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-gray-400 dark:text-zinc-600 font-medium">
              <p>©️ 2026 {t('appName')}. {t('rights')}.</p>
            </div>
          </div>
        </footer>
      )}

      {shouldShowNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-800 flex items-end justify-between px-6 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <button onClick={() => navigate('/')} className={'flex flex-col items-center gap-1.5 flex-1 transition-all cursor-pointer ' + (location.pathname === '/' ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-600')}>
            <HomeIcon size={24} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{t('home')}</span>
          </button>
          <button onClick={() => navigate('/android-tools')} className={'flex flex-col items-center gap-1.5 flex-1 transition-all cursor-pointer ' + (location.pathname === '/android-tools' ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-600')}>
            <LayoutGridIcon size={24} strokeWidth={location.pathname === '/android-tools' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{t('tools')}</span>
          </button>
          <div className="relative -top-8">
            {showFabMenu && (
              <div className="fixed inset-x-0 bottom-0 z-[110] flex justify-center pointer-events-none">
                <div className="w-full max-w-md max-h-[62vh] overflow-y-auto scrollbar-hide rounded-t-[2.5rem] bg-[#FAFAFA] dark:bg-zinc-950 shadow-2xl border-t border-x border-gray-100 dark:border-white/10 p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] space-y-4 animate-in slide-in-from-bottom-full duration-500 ease-out pointer-events-auto">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500">{t('quickActions')}</p>
                    <button onClick={() => { hapticImpact(); setShowFabMenu(false); }} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-900 text-gray-400 active:scale-90 transition-all cursor-pointer">
                      <XIcon size={18} />
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-3 ml-1">{t('essentials')}</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {tools.filter(t => t.implemented && t.path).slice(0, 4).map(fabToolRow)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showFabMenu && <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[105] animate-in fade-in duration-300" onClick={() => setShowFabMenu(false)} />}
            <button onClick={() => { hapticImpact(); setShowFabMenu(!showFabMenu) }} className={'w-14 h-14 bg-rose-500 text-white rounded-2xl shadow-xl shadow-rose-500/40 flex items-center justify-center active:scale-90 transition-all ring-4 ring-white dark:ring-black z-[110] relative cursor-pointer ' + (showFabMenu ? 'opacity-0 pointer-events-none scale-50' : 'opacity-100 scale-100')}>
              <PlusIcon size={32} strokeWidth={3} />
            </button>
          </div>
          <button onClick={() => navigate('/android-history')} className={'flex flex-col items-center gap-1.5 flex-1 transition-all cursor-pointer ' + (location.pathname === '/android-history' ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-600')}>
            <HistoryIcon size={24} strokeWidth={location.pathname === '/android-history' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{t('historyLabel')}</span>
          </button>
          <Link to="/settings" className={'flex flex-col items-center gap-1.5 flex-1 transition-all no-underline cursor-pointer ' + (location.pathname.includes('settings') ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-600')}>
            <SettingsIcon size={24} strokeWidth={location.pathname.includes('settings') ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{t('settingsLabel')}</span>
          </Link>
        </nav>
      )}

      {/* شات المساعد الذكي */}
      <div className={`fixed ${isRTL ? 'left-4' : 'right-4'} ${shouldShowNav ? 'bottom-24' : 'bottom-6'} z-[200] flex flex-col items-end pointer-events-none`}>
        <div className={`mb-4 w-[350px] max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom ${isRTL ? 'origin-bottom-left' : 'origin-bottom-right'} ${isChatOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-0 opacity-0 pointer-events-none'}`}>
          <div className="bg-rose-500 p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <SparklesIcon size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">{t('smartSupport')}</h3>
                <p className="text-[10px] text-rose-100">{t('poweredByGemini')}</p>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer">
              <XIcon size={18} />
            </button>
          </div>
          <div className="h-[350px] overflow-y-auto p-4 bg-gray-50 dark:bg-zinc-950 space-y-4">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[80%] p-3 text-sm ${msg.role === 'user' ? 'bg-rose-500 text-white rounded-2xl rounded-tr-sm' : 'bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-800 dark:text-zinc-200 rounded-2xl rounded-tl-sm'}`}>
                    {msg.text}
                 </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                 <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-3 rounded-2xl rounded-tl-sm flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                 </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex gap-2">
             <input 
               type="text"
               value={chatInput}
               onChange={e => setChatInput(e.target.value)}
               placeholder={t('typeYourMessage')}
               className="flex-1 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-rose-500 text-gray-900 dark:text-zinc-100"
             />
             <button type="submit" disabled={!chatInput.trim() || isTyping} className="bg-rose-500 text-white p-2.5 rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-colors flex items-center justify-center cursor-pointer">
                <SendIcon size={18} className={isRTL ? 'rotate-180' : ''} />
             </button>
          </form>
        </div>
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-rose-500 text-white rounded-full shadow-lg shadow-rose-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer pointer-events-auto"
        >
           {isChatOpen ? <XIcon size={24} /> : <MessageCircle size={24} />}
        </button>
      </div>

      {showHistory && (<div onClick={() => setShowHistory(false)} className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-[140]" />)}
    </div>
  )
}