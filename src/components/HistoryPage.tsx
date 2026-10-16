import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Search, Trash2, Download, FileText, X, Calendar, HardDrive,
  TrendingUp, Clock, Sparkles, Filter, ChevronDown, CheckCircle2,
  History as HistoryIcon, FileArchive, Layers, AlertCircle, RefreshCw,
  Cloud, CloudOff, Loader2
} from 'lucide-react'
import {
  ActivityEntry,
  getRecentActivity,
  clearActivity,
  deleteActivity
} from '../utils/recentActivity'
import { fetchCloudHistory, CloudHistoryEntry } from '../utils/historySync'
import { useAuth } from '../AuthContext'
import { useLanguage } from '../LanguageContext'

// دالة تنسيق حجم الملف
const formatSize = (bytes: number) => {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// دالة تنسيق التاريخ
const formatDate = (timestamp: number, language: 'ar' | 'en') => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  const texts = {
    ar: { now: 'الآن', minAgo: 'منذ', min: 'دقيقة', hour: 'ساعة', day: 'يوم' },
    en: { now: 'Just now', minAgo: '', min: 'min ago', hour: 'h ago', day: 'd ago' }
  }[language]

  if (diffMin < 1) return texts.now
  if (diffMin < 60) return language === 'ar' ? `${texts.minAgo} ${diffMin} ${texts.min}` : `${diffMin} ${texts.min}`
  if (diffHour < 24) return language === 'ar' ? `${texts.minAgo} ${diffHour} ${texts.hour}` : `${diffHour} ${texts.hour}`
  if (diffDay < 7) return language === 'ar' ? `${texts.minAgo} ${diffDay} ${texts.day}` : `${diffDay} ${texts.day}`

  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ===== دمج السجلين =====
interface MergedEntry {
  id: string
  name: string
  tool: string
  timestamp: number
  size: number
  source: 'local' | 'cloud'
  hasFile: boolean
  buffer?: Uint8Array
  resultUrl?: string
  cloudId?: string
}

function mergeHistories(local: ActivityEntry[], cloud: CloudHistoryEntry[]): MergedEntry[] {
  const merged: MergedEntry[] = []
  const seenKeys = new Set<string>()

  // أولاً المحلي (له الأولوية لأنه يحتوي على الملف الفعلي)
  local.forEach(item => {
    const key = `${item.tool}__${item.name}__${Math.floor(item.timestamp / 60000)}`
    seenKeys.add(key)
    merged.push({
      id: item.id,
      name: item.name,
      tool: item.tool,
      timestamp: item.timestamp,
      size: item.size,
      source: 'local',
      hasFile: !!(item.buffer || item.resultUrl),
      buffer: item.buffer,
      resultUrl: item.resultUrl,
      cloudId: item.cloudId,
    })
  })

  // ثم السحابي (فقط ما ليس موجوداً محلياً)
  cloud.forEach(item => {
    const ts = new Date(item.created_at).getTime()
    const key = `${item.tool_name}__${item.file_name}__${Math.floor(ts / 60000)}`
    if (seenKeys.has(key)) return
    seenKeys.add(key)

    merged.push({
      id: `cloud-${item.id}`,
      name: item.file_name,
      tool: item.tool_name,
      timestamp: ts,
      size: item.file_size,
      source: 'cloud',
      hasFile: false,
      cloudId: item.id,
    })
  })

  return merged.sort((a, b) => b.timestamp - a.timestamp)
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { language, isRTL } = useLanguage()

  const [localActivity, setLocalActivity] = useState<ActivityEntry[]>([])
  const [cloudActivity, setCloudActivity] = useState<CloudHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [cloudLoading, setCloudLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [toolFilter, setToolFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  // نصوص الصفحة حسب اللغة
  const texts = {
    ar: {
      title: 'سجل', titleAccent: 'العمليات',
      subtitle: (n: number) => n > 0 ? `${n} عملية محفوظة` : 'لا توجد عمليات بعد',
      refresh: 'تحديث', clearAll: 'حذف الكل',
      statTotal: 'إجمالي العمليات', statTools: 'أدوات مستخدمة',
      statSize: 'حجم معالج', statToday: 'اليوم',
      searchPlaceholder: 'ابحث بالاسم أو الأداة...',
      allTools: 'كل الأدوات', all: 'الكل',
      headerTools: 'كل الأدوات',
      toolsCount: (n: number) => `${n} أداة`,
      emptyTitle: 'لا توجد عمليات بعد',
      emptyDesc: 'ابدأ باستخدام إحدى الأدوات، وستظهر كل عملياتك هنا تلقائياً.',
      emptyBtn: 'استكشف الأدوات',
      noResults: 'لا توجد نتائج',
      noResultsDesc: 'جرّب تغيير كلمة البحث أو الفلتر',
      clearFilters: 'مسح الفلاتر',
      downloadAgain: 'إعادة التحميل',
      delete: 'حذف',
      cloudOnly: 'سحابي', localOnly: 'جهازك',
      noFile: 'الملف غير متوفر محلياً',
      note: 'ملاحظة:',
      noteText: 'السجل محفوظ على جهازك و(إن كنت مسجلاً) يُزامَن مع حسابك — خصوصيتك كاملة 🔒',
      confirmClear: 'هل أنت متأكد من حذف كل السجل؟ لا يمكن التراجع.',
      clearedSuccess: 'تم حذف كل السجل',
      clearFailed: 'فشل الحذف',
      deleteSuccess: 'تم حذف العنصر',
      deleteFailed: 'فشل الحذف',
      loadFailed: 'فشل تحميل السجل',
      downloadStarted: 'بدأ التحميل 📥',
      noFileDownload: 'الملف غير متوفر للتحميل',
      downloadFailed: 'فشل تحميل الملف',
      loadingText: 'جارٍ تحميل السجل...',
    },
    en: {
      title: 'History', titleAccent: 'of operations',
      subtitle: (n: number) => n > 0 ? `${n} saved operations` : 'No operations yet',
      refresh: 'Refresh', clearAll: 'Clear all',
      statTotal: 'Total operations', statTools: 'Tools used',
      statSize: 'Total size', statToday: 'Today',
      searchPlaceholder: 'Search by name or tool...',
      allTools: 'All tools', all: 'All',
      headerTools: 'All tools',
      toolsCount: (n: number) => `${n} tools`,
      emptyTitle: 'No operations yet',
      emptyDesc: 'Start using a tool, and all your operations will appear here automatically.',
      emptyBtn: 'Explore tools',
      noResults: 'No results',
      noResultsDesc: 'Try changing your search or filter',
      clearFilters: 'Clear filters',
      downloadAgain: 'Download again',
      delete: 'Delete',
      cloudOnly: 'Cloud', localOnly: 'Device',
      noFile: 'File not available locally',
      note: 'Note:',
      noteText: 'History is saved on your device and (if signed in) synced with your account — your privacy is complete 🔒',
      confirmClear: 'Are you sure you want to delete all history? This cannot be undone.',
      clearedSuccess: 'All history cleared',
      clearFailed: 'Failed to clear',
      deleteSuccess: 'Item deleted',
      deleteFailed: 'Failed to delete',
      loadFailed: 'Failed to load history',
      downloadStarted: 'Download started 📥',
      noFileDownload: 'File not available for download',
      downloadFailed: 'Failed to download',
      loadingText: 'Loading history...',
    }
  }[language]

  // ===== تحميل البيانات =====
  const loadActivity = async () => {
    setLoading(true)
    try {
      const localData = await getRecentActivity(999)
      setLocalActivity(localData)
    } catch (err) {
      console.error(err)
      toast.error(texts.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  const loadCloud = async () => {
    if (!user) {
      setCloudActivity([])
      return
    }
    setCloudLoading(true)
    try {
      const cloudData = await fetchCloudHistory(200)
      setCloudActivity(cloudData)
    } catch (err) {
      console.warn('Cloud load failed:', err)
    } finally {
      setCloudLoading(false)
    }
  }

  useEffect(() => {
    loadActivity()
    loadCloud()
  }, [user?.id])

  // ===== دمج =====
  const merged = useMemo(() => mergeHistories(localActivity, cloudActivity), [localActivity, cloudActivity])

  // ===== الأدوات الفريدة =====
  const uniqueTools = useMemo(() => {
    const set = new Set(merged.map(a => a.tool))
    return Array.from(set).sort()
  }, [merged])

  // ===== إحصائيات =====
  const stats = useMemo(() => {
    const totalSize = merged.reduce((sum, a) => sum + (a.size || 0), 0)
    const uniqueTools = new Set(merged.map(a => a.tool)).size
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCount = merged.filter(a => a.timestamp >= today.getTime()).length

    return { total: merged.length, totalSize, uniqueTools, todayCount }
  }, [merged])

  // ===== الفلترة =====
  const filteredActivity = useMemo(() => {
    return merged.filter(item => {
      const matchSearch = searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tool.toLowerCase().includes(searchQuery.toLowerCase())
      const matchTool = toolFilter === 'all' || item.tool === toolFilter
      return matchSearch && matchTool
    })
  }, [merged, searchQuery, toolFilter])

  // ===== إعادة التحميل =====
  const handleDownload = async (item: MergedEntry) => {
    try {
      if (!item.hasFile) {
        toast.error(texts.noFileDownload)
        return
      }
      const { downloadFile } = await import('../utils/pdfHelpers')
      const data = item.buffer || item.resultUrl
      if (!data) {
        toast.error(texts.noFileDownload)
        return
      }
      await downloadFile(
        data,
        item.name,
        item.name.endsWith('.zip') ? 'application/zip' : 'application/pdf'
      )
      toast.success(texts.downloadStarted)
    } catch (err) {
      console.error(err)
      toast.error(texts.downloadFailed)
    }
  }

  // ===== حذف عنصر =====
  const handleDelete = async (item: MergedEntry) => {
    setDeletingId(item.id)
    try {
      if (item.source === 'local') {
        await deleteActivity(item.id)
        setLocalActivity(prev => prev.filter(a => a.id !== item.id))
        // إن كان في السحابة أيضاً — حدّث القائمة السحابية
        if (item.cloudId) {
          setCloudActivity(prev => prev.filter(a => a.id !== item.cloudId))
        }
      } else if (item.source === 'cloud' && item.cloudId) {
        const { deleteCloudHistory } = await import('../utils/historySync')
        await deleteCloudHistory(item.cloudId)
        setCloudActivity(prev => prev.filter(a => a.id !== item.cloudId))
      }
      toast.success(texts.deleteSuccess)
    } catch {
      toast.error(texts.deleteFailed)
    } finally {
      setDeletingId(null)
    }
  }

  // ===== حذف الكل =====
  const handleClearAll = async () => {
    if (!window.confirm(texts.confirmClear)) return
    setClearing(true)
    try {
      await clearActivity()
      setLocalActivity([])
      setCloudActivity([])
      toast.success(texts.clearedSuccess)
    } catch {
      toast.error(texts.clearFailed)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#080808] relative overflow-hidden">

      {/* 🌌 الخلفية */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 60% 50% at 15% 20%, rgba(220,38,38,0.15) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 85% 80%, rgba(244,63,94,0.1) 0%, transparent 55%)
        `
      }} />

      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
        `,
        backgroundSize: '70px 70px'
      }} />

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-rose-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* ===== المحتوى ===== */}
      <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 lg:p-10">

        {/* رأس الصفحة */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
              {texts.title} <span className="text-rose-500">{texts.titleAccent}</span>
            </h1>
            <p className="text-xs text-zinc-500 font-medium flex items-center gap-2">
              {user && <Cloud size={12} className="text-emerald-400" />}
              {!user && <CloudOff size={12} className="text-zinc-600" />}
              {texts.subtitle(stats.total)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { loadActivity(); loadCloud() }}
              disabled={loading || cloudLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={14} className={(loading || cloudLoading) ? 'animate-spin' : ''} />
              {texts.refresh}
            </button>
            {merged.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
              >
                <Trash2 size={14} />
                {texts.clearAll}
              </button>
            )}
          </div>
        </div>

        {/* ===== 📊 الإحصائيات ===== */}
        {merged.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StatCard icon={<Layers size={18} />} label={texts.statTotal} value={stats.total.toString()} />
            <StatCard icon={<TrendingUp size={18} />} label={texts.statTools} value={stats.uniqueTools.toString()} />
            <StatCard icon={<HardDrive size={18} />} label={texts.statSize} value={formatSize(stats.totalSize)} />
            <StatCard icon={<Clock size={18} />} label={texts.statToday} value={stats.todayCount.toString()} />
          </div>
        )}

        {/* ===== 🔍 البحث والفلتر ===== */}
        {merged.length > 0 && (
          <div className="bg-[#111111]/95 backdrop-blur-2xl rounded-[2rem] border border-rose-500/15 p-4 sm:p-5 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className={`absolute inset-y-0 ${isRTL ? 'right-4' : 'left-4'} my-auto text-zinc-500 pointer-events-none`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={texts.searchPlaceholder}
                  className={`w-full bg-[#1a0a10] border border-rose-500/20 rounded-xl px-4 py-3 ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-rose-400 focus:shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute inset-y-0 ${isRTL ? 'left-3' : 'right-3'} my-auto text-zinc-500 hover:text-rose-400 transition-colors`}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-between gap-2 px-5 py-3 rounded-xl border transition-all min-w-[160px] ${
                  toolFilter !== 'all' || showFilters
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-[#1a0a10] border-rose-500/20 text-zinc-400 hover:text-white hover:border-rose-400/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Filter size={14} />
                  <span className="text-xs font-black uppercase tracking-wider">
                    {toolFilter === 'all' ? texts.allTools : toolFilter}
                  </span>
                </div>
                <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showFilters && (
              <div className="mt-3 pt-3 border-t border-rose-500/10 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setToolFilter('all'); setShowFilters(false) }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                      toolFilter === 'all'
                        ? 'bg-rose-500 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    {texts.all} ({merged.length})
                  </button>
                  {uniqueTools.map(tool => {
                    const count = merged.filter(a => a.tool === tool).length
                    return (
                      <button
                        key={tool}
                        onClick={() => { setToolFilter(tool); setShowFilters(false) }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                          toolFilter === tool
                            ? 'bg-rose-500 text-white'
                            : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                        }`}
                      >
                        {tool} ({count})
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== 📋 القائمة ===== */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-xs font-bold">{texts.loadingText}</p>
          </div>
        ) : merged.length === 0 ? (
          <div className="bg-[#111111]/95 backdrop-blur-2xl rounded-[2rem] border border-rose-500/15 p-12 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-rose-500/10 flex items-center justify-center">
              <HistoryIcon size={36} className="text-rose-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">{texts.emptyTitle}</h3>
            <p className="text-xs text-zinc-500 mb-6 max-w-md mx-auto">{texts.emptyDesc}</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-500/30 active:scale-95 transition-all"
            >
              <Sparkles size={16} />
              {texts.emptyBtn}
            </button>
          </div>
        ) : filteredActivity.length === 0 ? (
          <div className="bg-[#111111]/95 backdrop-blur-2xl rounded-[2rem] border border-rose-500/15 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-zinc-900 flex items-center justify-center">
              <Search size={28} className="text-zinc-600" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">{texts.noResults}</h3>
            <p className="text-xs text-zinc-500 mb-5">{texts.noResultsDesc}</p>
            <button
              onClick={() => { setSearchQuery(''); setToolFilter('all') }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 text-rose-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all"
            >
              <X size={14} />
              {texts.clearFilters}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivity.map((item, idx) => (
              <div
                key={item.id}
                className="bg-[#111111]/95 backdrop-blur-2xl rounded-2xl border border-rose-500/15 hover:border-rose-500/30 p-4 sm:p-5 transition-all group animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
              >
                <div className="flex items-center gap-4">
                  {/* أيقونة */}
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 group-hover:bg-rose-500/20 transition-colors relative">
                    {item.name.endsWith('.zip') ? (
                      <FileArchive size={20} className="text-rose-400" />
                    ) : (
                      <FileText size={20} className="text-rose-400" />
                    )}
                    {/* شارة المصدر */}
                    <div className={`absolute -top-1 ${isRTL ? '-right-1' : '-left-1'} w-4 h-4 rounded-full flex items-center justify-center ${
                      item.source === 'cloud' ? 'bg-indigo-500' : 'bg-emerald-500'
                    } border-2 border-[#111111]`}>
                      {item.source === 'cloud' ? (
                        <Cloud size={8} className="text-white" />
                      ) : (
                        <CheckCircle2 size={8} className="text-white" />
                      )}
                    </div>
                  </div>

                  {/* المعلومات */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm text-white truncate">{item.name}</h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-500 font-bold">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {item.tool}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <HardDrive size={10} />
                        {formatSize(item.size)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={10} />
                        {formatDate(item.timestamp, language)}
                      </span>
                    </div>
                  </div>

                  {/* الأزرار */}
                  <div className="flex items-center gap-1 shrink-0">
                    {item.hasFile ? (
                      <button
                        onClick={() => handleDownload(item)}
                        className="p-2.5 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title={texts.downloadAgain}
                      >
                        <Download size={16} />
                      </button>
                    ) : (
                      <div
                        className="p-2.5 rounded-xl text-zinc-700 cursor-not-allowed"
                        title={texts.noFile}
                      >
                        <CloudOff size={16} />
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                      className="p-2.5 rounded-xl text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all disabled:opacity-50"
                      title={texts.delete}
                    >
                      {deletingId === item.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== ملاحظة ===== */}
        {merged.length > 0 && (
          <div className="mt-8 flex items-start gap-3 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-zinc-500 leading-relaxed">
              <span className="font-bold text-zinc-300">{texts.note}</span>{' '}
              {texts.noteText}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ===== مكون البطاقة الإحصائية =====
function StatCard({
  icon, label, value
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-[#111111]/95 backdrop-blur-2xl rounded-2xl border border-rose-500/15 p-4 hover:border-rose-500/30 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
          {icon}
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{label}</span>
      </div>
      <p className="text-2xl font-black text-white truncate">{value}</p>
    </div>
  )
}