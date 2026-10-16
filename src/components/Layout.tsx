import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Download as DownloadIcon, Moon as MoonIcon, Sun as SunIcon,
  Languages as LanguagesIcon,
  History as HistoryIcon, Upload as UploadIcon,
  ChevronRight as ChevronRightIcon, ChevronDown as ChevronDownIcon,
  X as XIcon, Plus as PlusIcon, Trash2 as Trash2Icon,
  CheckCircle2 as CheckCircleIcon, Home as HomeIcon,
  Info as InfoIcon, ArrowLeft as ArrowLeftIcon,
  LayoutGrid as LayoutGridIcon, Settings as SettingsIcon,
  Github as GHIcon, Heart as HeartIcon, User as UserIcon,
  LogOut as LogOutIcon, UserCircle2 as UserCircleIcon, Sparkles as SparklesIcon,
  MessageCircle,
} from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { Theme, Tool, ToolCategory, ViewMode } from '../types'
import { PaperKnifeLogo } from './Logo'
import { ActivityEntry, getRecentActivity, clearActivity } from '../utils/recentActivity'
import { useBackHandler } from '../utils/backHandler'
import { hapticImpact } from '../utils/haptics'
import { usePipeline } from '../utils/pipelineContext'
import { toast } from 'sonner'
import { useLanguage } from '../LanguageContext'
import { useAuth } from '../AuthContext'
import { getToolLabel } from '../utils/toolLabels'

interface LayoutProps {
  children: React.ReactNode
  theme: Theme
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
  const [showFabMore, setShowFabMore] = useState(false)
  const { setPipelineFile } = usePipeline()
  const { user, profile, signOut } = useAuth()

  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

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
    setShowFabMore(false)
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
        className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-white/5 active:bg-gray-50 dark:active:bg-zinc-800 active:scale-95 transition-all shadow-sm group"
      >
        <div className={'p-2 rounded-xl ' + tool.bg + ' ' + tool.color + ' group-active:scale-110 transition-transform'}>
          <tool.icon size={18} strokeWidth={2.5} />
        </div>
        <span className="text-xs font-bold text-gray-900 dark:text-zinc-200">{label.title}</span>
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

  // 🎨 لون الأداة الحالية للعلامة المائية
  const activeToolColors = activeTool ? categoryColors[activeTool.category] : null

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col text-gray-900 dark:text-zinc-100 transition-colors duration-300 relative">

      {isDragging && (
        <div className="fixed inset-0 z-[200] bg-rose-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-zinc-900 p-12 rounded-[3rem] shadow-2xl border-4 border-dashed border-rose-500 animate-in zoom-in duration-300">
            <UploadIcon size={64} className="text-rose-500 animate-bounce" />
            <p className="mt-4 font-black uppercase tracking-widest text-rose-500 text-center text-sm">{t('dropFileToStart')}</p>
          </div>
        </div>
      )}

      {!showMobileNav && (
        <header className="flex items-center justify-between px-4 md:px-8 h-16 md:h-20 border-b border-gray-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-[100]">
          <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
            {!isHome && (
              <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-xl transition-colors text-gray-500 hover:text-rose-500 shrink-0">
                <ArrowLeftIcon size={20} className={isRTL ? '' : 'rotate-180'} />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
              <PaperKnifeLogo size={Capacitor.isNativePlatform() ? 24 : 28} iconColor="#F43F5E" />
              <span className="font-black tracking-tighter text-lg md:text-xl dark:text-white hidden xs:block">{t('appName')}</span>
            </Link>
            <div className="h-6 w-[1px] bg-gray-200 dark:bg-zinc-800 mx-1 md:mx-2 shrink-0" />
            <div className="relative min-w-0" ref={dropdownRef}>
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={'flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-xl transition-all font-black text-[10px] md:text-sm uppercase tracking-widest min-w-0 ' + (isDropdownOpen ? 'bg-rose-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900')}>
                <span className="truncate">{isHome ? t('allTools') : activeToolLabel}</span>
                <ChevronDownIcon size={14} className={'transition-transform duration-300 shrink-0 ' + (isDropdownOpen ? 'rotate-180' : '')} />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-3 w-72 md:w-80 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2rem] shadow-2xl py-4 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 max-h-[80vh] overflow-y-auto scrollbar-hide">
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
                              <button key={i} onClick={() => { navigate(tool.path || '/'); setIsDropdownOpen(false); }} className={'flex items-center gap-4 p-3 rounded-2xl transition-all text-right group ' + (isActive ? colors.bg + ' ' + colors.text : 'hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400')}>
                                <div className={'p-2 rounded-lg transition-colors ' + (isActive ? 'bg-white dark:bg-zinc-800' : colors.iconBg + ' ' + colors.text + ' opacity-70 group-hover:opacity-100')}><Icon size={18} /></div>
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

          <div className="flex items-center gap-1 md:gap-3 shrink-0">
            <div className="relative" ref={userMenuRef}>
              {!user ? (
                <Link
                  to="/login"
                  className="p-2 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 shadow-sm"
                >
                  <UserIcon size={16} />
                  <span className="hidden sm:block">{t('signIn')}</span>
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center gap-2 p-1 md:pr-3 rounded-xl transition-all border ${
                      showUserMenu
                        ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30'
                        : 'border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/15 text-rose-500'
                    }`}
                    title={getDisplayName()}
                  >
                    <div className={`w-8 h-8 md:w-7 md:h-7 rounded-lg flex items-center justify-center font-black text-xs transition-all ${
                      showUserMenu ? 'bg-white text-rose-500' : 'bg-rose-500 text-white'
                    }`}>
                      {getUserInitials()}
                    </div>
                    <span className="hidden md:block text-xs font-black uppercase tracking-widest max-w-[90px] truncate">
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
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-rose-500/30 shrink-0">
                            {getUserInitials()}
                          </div>
                          <div className="min-w-0 flex-1 text-right">
                            <p className="font-black text-sm text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                              {getDisplayName()}
                              <SparklesIcon size={12} className="text-rose-500 shrink-0" />
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-zinc-500 truncate mt-0.5" dir="ltr">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        <button
                          onClick={() => { navigate('/profile'); setShowUserMenu(false) }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-gray-700 dark:text-zinc-300 group"
                        >
                          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                            <UserCircleIcon size={16} />
                          </div>
                          <span className="text-xs font-bold">{t('myProfile')}</span>
                        </button>

                        <button
                          onClick={() => { navigate('/history'); setShowUserMenu(false) }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-gray-700 dark:text-zinc-300 group"
                        >
                          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                            <HistoryIcon size={16} />
                          </div>
                          <span className="text-xs font-bold">{t('historyLabel')}</span>
                        </button>

                        <div className="my-2 mx-4 h-[1px] bg-gray-100 dark:bg-zinc-800" />

                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-rose-500 group"
                        >
                          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                            <LogOutIcon size={16} />
                          </div>
                          <span className="text-xs font-bold">{t('signOut')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <Link to="/contact" className={'p-2 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ' + (location.pathname.includes('contact') ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-900')}>
              <MessageCircle size={18} />
              <span className="hidden lg:block">{t('contact')}</span>
            </Link>
            <Link to="/about" className={'p-2 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ' + (location.pathname.includes('about') ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-900')}>
              <InfoIcon size={18} />
              <span className="hidden lg:block">{t('about')}</span>
            </Link>

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all group"
              title={language === 'ar' ? t('switchToEnglish') : t('switchToArabic')}
            >
              <LanguagesIcon size={16} className="text-gray-400 group-hover:text-rose-500 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-rose-500 transition-colors">
                {language === 'ar' ? 'AR' : 'EN'}
              </span>
            </button>

            <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-rose-500 transition-colors" title={theme === 'light' ? t('darkMode') : t('lightMode')}>
              {theme === 'light' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
            </button>

            <button onClick={() => setShowHistory(true)} className={'p-2 transition-colors relative ' + (showHistory ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500')}>
              <HistoryIcon size={20} />
              {activity.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-black" />}
            </button>
          </div>
        </header>
      )}

      <main className={'flex-1 min-w-0 relative ' + (shouldShowNav ? 'pb-32' : '')}>

        {/* 🎨 العلامة المائية العملاقة للأداة الحالية */}
        {activeTool && activeToolColors && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className={`absolute -top-32 -right-32 ${activeToolColors.text} opacity-[0.04]`}>
              <activeTool.icon size={700} strokeWidth={0.4} />
            </div>
            <div className={`absolute -bottom-40 -left-32 ${activeToolColors.text} opacity-[0.03] rotate-12`}>
              <activeTool.icon size={600} strokeWidth={0.4} />
            </div>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full opacity-40"
              style={{
                background: activeTool.category === 'Edit'
                  ? 'radial-gradient(circle, rgba(244,63,94,0.12) 0%, transparent 70%)'
                  : activeTool.category === 'Secure'
                  ? 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)'
                  : activeTool.category === 'Convert'
                  ? 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
                filter: 'blur(100px)',
              }}
            />
          </div>
        )}

        <div className="relative z-10">
          {children}
        </div>
      </main>

      {!showMobileNav && (
        <footer className="border-t border-gray-100 dark:border-white/5 mt-20 bg-white/60 dark:bg-black/60 backdrop-blur-md relative z-10">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-10 md:py-12">
            <div className="grid grid-cols-2 md:grid-cols-12 gap-8 mb-12">
              <div className="col-span-2 md:col-span-6 space-y-4">
                <Link to="/" className="flex items-center gap-2.5 text-gray-900 dark:text-white group w-fit">
                  <PaperKnifeLogo size={22} iconColor="#F43F5E" partColor="currentColor" />
                  <span className="font-bold tracking-tight text-lg group-hover:text-rose-500 transition-colors">{t('appName')}</span>
                </Link>
                <p className="text-gray-500 dark:text-zinc-500 text-xs leading-relaxed max-w-sm">{t('tagline')}</p>
              </div>
              <div className="col-span-1 md:col-span-3">
                <h4 className="font-bold text-[10px] uppercase tracking-widest text-gray-900 dark:text-white mb-4">{t('protocol')}</h4>
                <ul className="space-y-2.5 text-xs text-gray-500 dark:text-zinc-500">
                  <li><Link to="/about" className="hover:text-rose-500 transition-colors">{t('about')}</Link></li>
                  <li><Link to="/contact" className="hover:text-rose-500 transition-colors">{t('contact')}</Link></li>
                  <li><a href="https://potatameister.github.io/privacy/paperknife" target="_blank" rel="noopener noreferrer" className="hover:text-rose-500 transition-colors">{t('privacyPolicy')}</a></li>
                  <li><Link to="/license" className="hover:text-rose-500 transition-colors">{t('license')}</Link></li>
                </ul>
              </div>
              <div className="col-span-1 md:col-span-3">
                <h4 className="font-bold text-[10px] uppercase tracking-widest text-gray-900 dark:text-white mb-4">{t('ecosystem')}</h4>
                <ul className="space-y-2.5 text-xs text-gray-500 dark:text-zinc-500">
                  <li>
                    <a href="mailto:potatameister@proton.me?subject=Support%20PaperKnife" className="flex items-center gap-2 hover:text-rose-500 transition-colors">
                      {t('supportUs')} <HeartIcon size={10} className="text-rose-500" />
                    </a>
                  </li>
                  <li>
                    <a href="mailto:potatameister@proton.me?subject=Bug%20Report%20-%20PaperKnife" className="hover:text-rose-500 transition-colors">
                      {t('reportBug')}
                    </a>
                  </li>
                  <li><Link to="/thanks" className="hover:text-rose-500 transition-colors">{t('hallOfFame')}</Link></li>
                </ul>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-gray-400 dark:text-zinc-600 font-medium">
              <p>©️ 2026 {t('appName')}. {t('rights')}.</p>
              <div className="flex gap-6 items-center">
                <a href="mailto:potatameister@proton.me" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      )}

      {shouldShowNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-800 flex items-end justify-between px-6 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <button onClick={() => navigate('/')} className={'flex flex-col items-center gap-1.5 flex-1 transition-all ' + (location.pathname === '/' ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-600')}>
            <HomeIcon size={24} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{t('home')}</span>
          </button>
          <button onClick={() => navigate('/android-tools')} className={'flex flex-col items-center gap-1.5 flex-1 transition-all ' + (location.pathname === '/android-tools' ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-600')}>
            <LayoutGridIcon size={24} strokeWidth={location.pathname === '/android-tools' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{t('tools')}</span>
          </button>
          <div className="relative -top-8">
            {showFabMenu && (
              <div className="fixed inset-x-0 bottom-0 z-[110] flex justify-center pointer-events-none">
                <div className="w-full max-w-md max-h-[62vh] overflow-y-auto scrollbar-hide rounded-t-[2.5rem] bg-[#FAFAFA] dark:bg-zinc-950 shadow-2xl border-t border-x border-gray-100 dark:border-white/10 p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] space-y-4 animate-in slide-in-from-bottom-full duration-500 ease-out pointer-events-auto">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-zinc-500">{t('quickActions')}</p>
                    <button onClick={() => { hapticImpact(); setShowFabMenu(false); setShowFabMore(false) }} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-900 text-gray-400 active:scale-90 transition-all">
                      <XIcon size={18} />
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-3 ml-1">{t('essentials')}</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {tools.filter(t => t.implemented && t.path).slice(0, 4).map(fabToolRow)}
                    </div>
                  </div>
                  <div>
                    <button onClick={() => { hapticImpact(); setShowFabMore(!showFabMore) }} className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-rose-500 transition-colors shadow-sm">
                      <span>{t('allTools')}</span>
                      <ChevronDownIcon size={14} className={'transition-transform duration-300 ' + (showFabMore ? 'rotate-180' : '')} />
                    </button>
                    {showFabMore && (
                      <div className="grid grid-cols-2 gap-2.5 mt-3 animate-in slide-in-from-top-2 duration-300 pb-2">
                        {tools.filter(t => t.implemented && t.path).slice(4).map(fabToolRow)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {showFabMenu && <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[105] animate-in fade-in duration-300" onClick={() => setShowFabMenu(false)} />}
            <button onClick={() => { hapticImpact(); setShowFabMenu(!showFabMenu) }} className={'w-14 h-14 bg-rose-500 text-white rounded-2xl shadow-xl shadow-rose-500/40 flex items-center justify-center active:scale-90 transition-all ring-4 ring-white dark:ring-black z-[110] relative ' + (showFabMenu ? 'opacity-0 pointer-events-none scale-50' : 'opacity-100 scale-100')}>
              <PlusIcon size={32} strokeWidth={3} />
            </button>
          </div>
          <button onClick={() => navigate('/android-history')} className={'flex flex-col items-center gap-1.5 flex-1 transition-all ' + (location.pathname === '/android-history' ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-600')}>
            <HistoryIcon size={24} strokeWidth={location.pathname === '/android-history' ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{t('historyLabel')}</span>
          </button>
          <Link to="/settings" className={'flex flex-col items-center gap-1.5 flex-1 transition-all no-underline ' + (location.pathname.includes('settings') ? 'text-rose-500' : 'text-gray-400 dark:text-zinc-600')}>
            <SettingsIcon size={24} strokeWidth={location.pathname.includes('settings') ? 2.5 : 2} />
            <span className="text-[10px] font-bold">{t('settingsLabel')}</span>
          </Link>
        </nav>
      )}

      <aside className={'fixed top-0 ' + (isRTL ? 'right-0 border-l' : 'left-0 border-r') + ' h-screen w-full sm:w-80 bg-white dark:bg-zinc-950 border-gray-100 dark:border-zinc-800 z-[150] shadow-2xl transition-transform duration-500 ease-out transform ' + (showHistory ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full'))}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <HistoryIcon className="text-rose-500" size={24} />
              <h2 className="text-xl font-black dark:text-white">{t('activity')}</h2>
            </div>
            <div className="flex items-center gap-2">
              {activity.length > 0 && (
                <button onClick={async () => { await clearActivity(); setActivity([]); }} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-gray-400 hover:text-rose-500 rounded-xl transition-colors">
                  <Trash2Icon size={18} />
                </button>
              )}
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                <ChevronRightIcon size={20} className={'text-gray-400 ' + (isRTL ? '' : 'rotate-180')} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
            {activity.length === 0 ? (
              <div className="text-center py-20 opacity-40"><p className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('noRecentFiles')}</p></div>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg flex items-center justify-center"><CheckCircleIcon size={16} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate dark:text-white">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{item.tool}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-gray-400 font-bold">
                    <span>{new Date(item.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
                    {(item.buffer || item.resultUrl) && (
                      <button onClick={async () => { try { const { downloadFile } = await import('../utils/pdfHelpers'); await downloadFile(item.buffer || item.resultUrl!, item.name, item.name.endsWith('.zip') ? 'application/zip' : 'application/pdf') } catch {} }} className="text-rose-500 hover:underline flex items-center gap-1">
                        <DownloadIcon size={10} /> {t('downloadAgain')}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
      {showHistory && (<div onClick={() => setShowHistory(false)} className="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm z-[140]" />)}
    </div>
  )
}