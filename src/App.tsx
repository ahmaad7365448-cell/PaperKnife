/**
 * PaperKnife - السكين السويسرية لملفات PDF
 * حقوق النشر (C) 2026 potatameister
 */

import { useState, useEffect, Suspense } from 'react'
import {
  Layers, Scissors, Zap, Smartphone as SmartphoneIcon, Monitor as MonitorIcon, Lock, Unlock,
  RotateCw, Type, FileText, ArrowUpDown, PenTool,
  ImagePlus, FileImage,
  Wand2, FileType2, UserCircle, Brush, X, ChevronDown
} from 'lucide-react'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Toaster, toast } from 'sonner'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { Theme, ViewMode, Tool } from './types'
import Layout from './components/Layout'
import { PipelineProvider, usePipeline } from './utils/pipelineContext'
import { ViewModeProvider } from './utils/viewModeContext'
import { clearActivity, updateLastSeen, getLastSeen } from './utils/recentActivity'
import { useBackHandler, ensureBackListening, setBackFallback } from './utils/backHandler'
import ScrollToTop from './components/ScrollToTop'
import AuthPage from './components/AuthPage'
import ResetPasswordPage from './components/ResetPasswordPage'
import ProtectedRoute from './ProtectedRoute'

// 🌟 استيراد صفحة الهبوط الجديدة
import LandingPage from './pages/LandingPage'

// الواجهات الحيوية والأدوات
import WebView from './components/WebView'
import AndroidView from './components/AndroidView'
import AndroidToolsView from './components/AndroidToolsView'
import AndroidHistoryView from './components/AndroidHistoryView'
import About from './components/About'
import Thanks from './components/Thanks'
import SettingsView from './components/Settings'
import ProfilePage from './components/ProfilePage'
import HistoryPage from './components/HistoryPage'
import ContactPage from './components/ContactPage'
import PdfPreview from './components/PdfPreview'

import MergeTool from './components/tools/MergeTool'
import SplitTool from './components/tools/SplitTool'
import ProtectTool from './components/tools/ProtectTool'
import CompressTool from './components/tools/CompressTool'
import UnlockTool from './components/tools/UnlockTool'
import PdfToImageTool from './components/tools/PdfToImageTool'
import RotateTool from './components/tools/RotateTool'
import PdfToTextTool from './components/tools/PdfToTextTool'
import RearrangeTool from './components/tools/RearrangeTool'
import WatermarkTool from './components/tools/WatermarkTool'
import ImageToPdfTool from './components/tools/ImageToPdfTool'
import SignatureTool from './components/tools/SignatureTool'

import RemoveBackgroundTool from './components/tools/RemoveBackgroundTool'
import WordToPdfTool from './components/tools/WordToPdfTool'
import CvMakerTool from './components/tools/CvMakerTool'
import ImageEditorTool from './components/tools/ImageEditorTool'

const tools: Tool[] = [
  { title: 'دمج PDF', titleEn: 'Merge PDF', desc: 'اجمع عدة ملفات PDF في مستند واحد.', descEn: 'Combine files into one document.', icon: Layers, implemented: true, path: '/merge', category: 'Edit', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  { title: 'تقسيم PDF', titleEn: 'Split PDF', desc: 'استخرج صفحات أو نطاقات محددة بصريًا.', descEn: 'Extract specific pages or ranges.', icon: Scissors, implemented: true, path: '/split', category: 'Edit', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { title: 'ضغط PDF', titleEn: 'Compress PDF', desc: 'قلّل حجم ملفك لسهولة المشاركة.', descEn: 'Shrink file size, keep quality.', icon: Zap, implemented: true, path: '/compress', category: 'Optimize', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { title: 'حماية PDF', titleEn: 'Protect PDF', desc: 'احمِ مستنداتك بتشفير قوي.', descEn: 'Lock files with a password.', icon: Lock, implemented: true, path: '/protect', category: 'Secure', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { title: 'إزالة حماية PDF', titleEn: 'Unlock PDF', desc: 'أزل كلمات المرور من ملفاتك المحمية.', descEn: 'Remove password protection.', icon: Unlock, implemented: true, path: '/unlock', category: 'Secure', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  { title: 'تدوير PDF', titleEn: 'Rotate PDF', desc: 'صحّح اتجاه الصفحات بشكل دائم.', descEn: 'Fix page orientation permanently.', icon: RotateCw, implemented: true, path: '/rotate-pdf', category: 'Edit', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { title: 'إعادة ترتيب PDF', titleEn: 'Rearrange PDF', desc: 'اسحب وأفلت الصفحات لإعادة ترتيبها.', descEn: 'Drag and drop pages to reorder.', icon: ArrowUpDown, implemented: true, path: '/rearrange-pdf', category: 'Edit', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { title: 'علامة مائية', titleEn: 'Watermark', desc: 'أضف نصًا مخصصًا للعلامة التجارية أو الحماية.', descEn: 'Add custom text for branding or protection.', icon: Type, implemented: true, path: '/watermark', category: 'Edit', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { title: 'التوقيع', titleEn: 'Sign PDF', desc: 'أضف توقيعك الإلكتروني إلى أي مستند.', descEn: 'Add your electronic signature to any document.', icon: PenTool, implemented: true, path: '/signature', category: 'Edit', color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/20' },
  { title: 'PDF إلى صورة', titleEn: 'PDF to Image', desc: 'حوّل صفحات المستند إلى صور عالية الجودة.', descEn: 'Convert PDF pages to high-quality images.', icon: FileImage, implemented: true, path: '/pdf-to-image', category: 'Convert', color: 'text-lime-500', bg: 'bg-lime-50 dark:bg-lime-900/20' },
  { title: 'صورة إلى PDF', titleEn: 'Image to PDF', desc: 'حوّل JPG وPNG وWebP إلى PDF احترافي.', descEn: 'Convert JPG, PNG, WebP to professional PDF.', icon: ImagePlus, implemented: true, path: '/image-to-pdf', category: 'Convert', color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  { title: 'PDF إلى نص', titleEn: 'PDF to Text', desc: 'استخرج النص العادي من مستندات PDF.', descEn: 'Extract plain text from PDF documents.', icon: FileText, implemented: true, path: '/pdf-to-text', category: 'Convert', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },

  { title: 'إزالة خلفية الصور', titleEn: 'Remove Background', desc: 'أزل خلفية أي صورة بضغطة زر — مثالي للبائعين على إنستغرام.', descEn: 'Remove image background with one click — ideal for Instagram sellers.', icon: Wand2, implemented: true, path: '/remove-bg', category: 'Convert', color: 'text-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20' },
  { title: 'تحويل Word ↔️ PDF', titleEn: 'Word ↔️ PDF', desc: 'حوّل مستندات Word إلى PDF والعكس بسهولة.', descEn: 'Convert Word documents to PDF and back.', icon: FileType2, implemented: true, path: '/word-to-pdf', category: 'Convert', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { title: 'صانع السيرة الذاتية', titleEn: 'CV Maker', desc: 'أنشئ سيرة ذاتية احترافية بالعربي جاهزة للطباعة.', descEn: 'Create a professional Arabic CV ready to print.', icon: UserCircle, implemented: true, path: '/cv-maker', category: 'Convert', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { title: 'محرر الصور الاحترافي', titleEn: 'Image Editor', desc: 'عدّل الألوان، ارفع الدقة، وأزل أي عنصر من صورتك.', descEn: 'Adjust colors, upscale, and remove elements from your photo.', icon: Brush, implemented: true, path: '/image-editor', category: 'Edit', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
]

export const IS_OCR_DISABLED = import.meta.env.VITE_DISABLE_OCR === 'true'
export const activeTools = IS_OCR_DISABLED ? tools.filter(t => t.path !== '/pdf-to-text') : tools
export const PRIVACY_URL = 'https://potatameister.github.io/privacy/paperknife'

function PrivacyRedirect() {
  useEffect(() => { window.location.replace(PRIVACY_URL) }, [])
  return null
}

function QuickDropModal({ file, onClear, onBack }: { file: File, onClear: () => void, onBack?: () => void }) {
  const navigate = useNavigate()
  const { setPipelineFile } = usePipeline()
  const essentials = activeTools.slice(0, 4)

  const handleAction = async (path: string, title: string) => {
    toast.loading(`جارٍ استيراد ${file.name}...`, { id: 'quick-load' })
    try {
      const buffer = await file.arrayBuffer()
      setPipelineFile({
        buffer: new Uint8Array(buffer),
        name: file.name,
        type: file.type || 'application/pdf'
      })
      onClear()
      navigate(path)
      toast.success(`تم الفتح في ${title}`, { id: 'quick-load' })
    } catch {
      toast.error('فشل معالجة الملف', { id: 'quick-load' })
    }
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#FAFAFA] dark:bg-zinc-950 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border-t border-x border-white/10 sm:border animate-in slide-in-from-bottom-full duration-500 ease-out">
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {onBack && (
                <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-rose-500 transition-colors">
                  <ChevronDown className="rotate-90" size={20} />
                </button>
              )}
              <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <FileText size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black dark:text-white truncate max-w-[200px] leading-none mb-1">{file.name}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            </div>
            <button onClick={onClear} className="p-2 bg-gray-100 dark:bg-zinc-900 rounded-full text-gray-400 hover:text-rose-500 transition-colors"><X size={18} /></button>
          </div>
        </div>
        <div className="px-6 pb-6 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
          <div>
            <h4 className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-3 ml-1">الأساسيات</h4>
            <div className="grid grid-cols-2 gap-2.5">
              {essentials.map(tool => (
                <button
                  key={tool.title}
                  onClick={() => tool.path && handleAction(tool.path, tool.title)}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-white/5 active:bg-gray-50 dark:active:bg-zinc-800 active:scale-95 transition-all shadow-sm group"
                >
                  <div className={`p-2 rounded-xl ${tool.bg} ${tool.color} group-active:scale-110 transition-transform`}>
                    <tool.icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-zinc-200">{tool.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppContent({ theme, toggleTheme, setTheme, viewMode, setViewMode }: {
  theme: Theme,
  toggleTheme: () => void,
  setTheme: (t: Theme) => void,
  viewMode: ViewMode,
  setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { setPipelineFiles } = usePipeline()
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [showQuickDrop, setShowQuickDrop] = useState(false)

  useBackHandler(showQuickDrop, () => setShowQuickDrop(false))
  useEffect(() => {
    ensureBackListening()
    setBackFallback(() => {
      if (location.pathname !== '/') navigate(-1)
      else CapApp.exitApp().catch(() => {})
    })
    return () => setBackFallback(null)
  }, [location.pathname, navigate])

  useEffect(() => {
    const isAutoWipeEnabled = localStorage.getItem('autoWipe') === 'true'
    const timerMinutes = parseInt(localStorage.getItem('autoWipeTimer') || '15')
    const lastSeen = getLastSeen()
    const now = Date.now()

    if (isAutoWipeEnabled) {
      const elapsedMinutes = (now - lastSeen) / (1000 * 60)
      if (timerMinutes === 0 || (lastSeen > 0 && elapsedMinutes >= timerMinutes)) {
        clearActivity().then(() => {
          import('./utils/workspacePersistence').then(m => m.clearAllWorkspaces()).catch(() => {})
        })
      }
    }
    updateLastSeen()
    const interval = setInterval(updateLastSeen, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleGlobalDrop = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    const allImages = fileArray.every(f => f.type.startsWith('image/'))
    if (allImages) {
      setPipelineFiles(fileArray)
      navigate('/image-to-pdf')
      toast.success(`تم استيراد ${fileArray.length} صور`)
      return
    }

    const file = fileArray.find(f => f.type === 'application/pdf')
    if (!file) {
      toast.error('الرجاء اختيار ملف PDF أو صور.')
      return
    }
    setDroppedFile(file)
    setShowQuickDrop(false)
  }

  const LoadingSpinner = () => (
    <div className="h-full w-full flex items-center justify-center bg-[#FAFAFA] dark:bg-black min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  const resolvedTheme = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme

  return (
    <>
      <Toaster position="top-center" expand={true} richColors duration={2000} />

      {droppedFile && (
        <PdfPreview
          file={droppedFile}
          onClose={() => { setDroppedFile(null); setShowQuickDrop(false) }}
          onProcess={() => setShowQuickDrop(true)}
        />
      )}

      {droppedFile && showQuickDrop && (
        <QuickDropModal
          file={droppedFile}
          onClear={() => { setDroppedFile(null); setShowQuickDrop(false) }}
          onBack={() => setShowQuickDrop(false)}
        />
      )}

      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* 🌐 الصفحة الرئيسية الجديدة (متاحة للجميع) */}
          <Route path="/" element={<LandingPage />} />
          
          {/* 🌐 صفحات عامة (بدون حماية) */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* 🔒 كل صفحات الموقع محمية وتحتوي على التصميم الداخلي (Layout) */}
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout theme={resolvedTheme} toggleTheme={toggleTheme} tools={activeTools} onFileDrop={handleGlobalDrop} viewMode={viewMode}>
                <Routes>
                  {/* لوحة تحكم الأدوات الآن على مسار /tools */}
                  <Route path="/tools" element={
                    viewMode === 'web' ? (
                      <WebView tools={activeTools} />
                    ) : (
                      <AndroidView
                        tools={activeTools}
                        toggleTheme={toggleTheme}
                        theme={resolvedTheme}
                        onFileSelect={(file) => handleGlobalDrop([file] as any)}
                      />
                    )
                  } />
                  <Route path="/android-tools" element={<AndroidToolsView tools={activeTools} />} />
                  <Route path="/android-history" element={<AndroidHistoryView />} />
                  
                  {/* الأدوات الداخلية */}
                  <Route path="/merge" element={<MergeTool />} />
                  <Route path="/split" element={<SplitTool />} />
                  <Route path="/protect" element={<ProtectTool />} />
                  <Route path="/unlock" element={<UnlockTool />} />
                  <Route path="/compress" element={<CompressTool />} />
                  <Route path="/pdf-to-image" element={<PdfToImageTool />} />
                  <Route path="/rotate-pdf" element={<RotateTool />} />
                  {!IS_OCR_DISABLED && <Route path="/pdf-to-text" element={<PdfToTextTool />} />}
                  <Route path="/rearrange-pdf" element={<RearrangeTool />} />
                  <Route path="/watermark" element={<WatermarkTool />} />
                  <Route path="/image-to-pdf" element={<ImageToPdfTool />} />
                  <Route path="/signature" element={<SignatureTool />} />

                  <Route path="/remove-bg" element={<RemoveBackgroundTool />} />
                  <Route path="/word-to-pdf" element={<WordToPdfTool />} />
                  <Route path="/cv-maker" element={<CvMakerTool />} />
                  <Route path="/image-editor" element={<ImageEditorTool />} />

                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/contact" element={<ContactPage />} />

                  <Route path="/about" element={<About viewMode={viewMode} />} />
                  <Route path="/privacy" element={<PrivacyRedirect />} />
                  <Route path="/settings" element={<SettingsView theme={theme} setTheme={setTheme} />} />
                  <Route path="/thanks" element={<Thanks />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>

      {import.meta.env.DEV && (
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col gap-2">
          <button
            onClick={() => setViewMode(prev => prev === 'web' ? 'android' : 'web')}
            className="bg-gray-900 dark:bg-zinc-800 text-white p-4 rounded-3xl shadow-2xl hover:bg-rose-500 transition-all duration-300 flex items-center gap-3 border border-white/10 group active:scale-95"
            title="تبديل وضع الحرباء"
          >
            {viewMode === 'web' ? <SmartphoneIcon size={20} /> : <MonitorIcon size={20} />}
            <span className="text-xs font-black uppercase tracking-tighter">{viewMode}</span>
          </button>
        </div>
      )}
    </>
  )
}

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return Capacitor.isNativePlatform() ? 'android' : 'web'
  })
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme
      if (savedTheme) return savedTheme
    }
    return 'system'
  })

  const toggleTheme = () => { setTheme(prev => prev === 'light' ? 'dark' : 'light') }

  useEffect(() => {
    const root = window.document.documentElement
    const applyTheme = (t: Theme) => {
      let resolvedTheme = t
      if (t === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      if (resolvedTheme === 'dark') {
        root.classList.add('dark')
        root.style.colorScheme = 'dark'
      } else {
        root.classList.remove('dark')
        root.style.colorScheme = 'light'
      }
    }
    applyTheme(theme)
    localStorage.setItem('theme', theme)
    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => applyTheme('system')
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }
  }, [theme])

  return (
    <HashRouter>
      <ScrollToTop />
      <ViewModeProvider viewMode={viewMode} setViewMode={setViewMode}>
        <PipelineProvider>
          <AppContent
            theme={theme}
            toggleTheme={toggleTheme}
            setTheme={setTheme}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </PipelineProvider>
      </ViewModeProvider>
    </HashRouter>
  )
}

export default App