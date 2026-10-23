import { useState, useRef, useEffect } from 'react'
import { Image as ImageIcon, Lock, Loader2, ArrowRight, X, Download, Share2, Sparkles, Check, FileCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'

import { getPdfMetaData, loadPdfDocument, unlockPdf, shareFile } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import { NativeToolLayout } from './shared/NativeToolLayout'

type ImageFormat = 'jpg' | 'png'
type OutputMode = 'zip' | 'separate'
type PdfData = { file: File, thumbnail?: string, pageCount: number, isLocked: boolean, pdfDoc?: any, password?: string }
type ImageResult = { name: string, url: string, size: number, buffer: Uint8Array }

const DPI_OPTIONS = [
  { dpi: 72, scale: 1.0, label: 'مسودة (72 DPI)', desc: 'حجم خفيف' },
  { dpi: 150, scale: 2.0, label: 'قياسي (150 DPI)', desc: 'جودة متوازنة' },
  { dpi: 300, scale: 300 / 72, label: 'طباعة (300 DPI)', desc: 'دقة فائقة' },
] as const

export default function PdfToImageTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile, setPipelineFile } = usePipeline()
  const [pdfData, setPdfData] = useState<PdfData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [isSinglePageDirect, setIsSinglePageDirect] = useState(false)
  const [format, setFormat] = useState<ImageFormat>('jpg')
  const [dpi, setDpi] = useState<number>(150)
  const [outputMode, setOutputMode] = useState<OutputMode>('zip')
  const [imageResults, setImageResults] = useState<ImageResult[]>([])
  const [customFileName, setCustomFileName] = useState('paperknife-images')
  const [unlockPassword, setUnlockPassword] = useState('')
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      if (pipelined.type && pipelined.type !== 'application/pdf') {
        toast.error('الملف المُمرر ليس مستند PDF ولا يمكن معالجته هنا.')
        return
      }
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFile(file)
    }
  }, [])

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setIsProcessing(true)
    const result = await unlockPdf(pdfData.file, unlockPassword)
    if (result.success) {
      setPdfData({ ...pdfData, isLocked: false, pageCount: result.pageCount, pdfDoc: result.pdfDoc, thumbnail: result.thumbnail, password: unlockPassword })
      setCustomFileName(`${pdfData.file.name.replace(/\.pdf$/i, '')}-صور`)
      toast.success('تم فك حماية المستند بنجاح!')
    } else { 
      toast.error(`كلمة المرور غير صحيحة للملف "${pdfData.file.name}".`) 
    }
    setIsProcessing(false)
  }

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('الرجاء اختيار مستند PDF صالح')
      return
    }
    setIsProcessing(true)
    try {
      const meta = await getPdfMetaData(file)
      if (meta.isLocked) { 
        setPdfData({ file, pageCount: 0, isLocked: true }) 
      } else {
        const pdfDoc = await loadPdfDocument(file)
        setPdfData({ file, pageCount: meta.pageCount, isLocked: false, pdfDoc, thumbnail: meta.thumbnail })
        setCustomFileName(`${file.name.replace(/\.pdf$/i, '')}-صور`)
      }
    } catch (err) { 
      console.error(err)
      toast.error('تعذر فتح مستند PDF المرفق') 
    } finally { 
      setIsProcessing(false)
      setDownloadUrl(null)
      setImageResults([])
      setIsSinglePageDirect(false)
    }
    
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startOver = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    imageResults.forEach(r => URL.revokeObjectURL(r.url))
    setDownloadUrl(null)
    setImageResults([])
    setProgress(0)
    setPdfData(null)
    setIsProcessing(false)
    setIsSinglePageDirect(false)
  }

  const convertToImages = async () => {
    if (!pdfData || !pdfData.pdfDoc) return
    setIsProcessing(true)
    setProgress(0)
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const opt = DPI_OPTIONS.find(o => o.dpi === dpi) ?? DPI_OPTIONS[1]
      const mime = format === 'png' ? 'image/png' : 'image/jpeg'

      const renderOne = async (i: number): Promise<{ name: string, blob: Blob }> => {
        const page = await pdfData.pdfDoc.getPage(i)
        const viewport = page.getViewport({ scale: opt.scale })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) throw new Error('تعذر تجهيز مساحة الرندر')
        canvas.height = viewport.height
        canvas.width = viewport.width
        await page.render({ canvasContext: context, viewport }).promise
        try { page.cleanup() } catch { /* ignore */ }
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, mime, 0.92))
        canvas.width = 0
        canvas.height = 0
        if (!blob) throw new Error(`فشل استخراج الصفحة رقم ${i}`)
        const padNum = i.toString().padStart(Math.max(2, pdfData.pageCount.toString().length), '0')
        return { name: `${customFileName}-${padNum}.${format}`, blob }
      }

      // 🎯 تحويل مباشر للصورة إذا كان المستند صفحة واحدة (تجنباً لملفات ZIP)
      if (pdfData.pageCount === 1) {
        const { blob } = await renderOne(1)
        const singleName = `${customFileName}.${format}`
        const url = URL.createObjectURL(blob)
        const buffer = new Uint8Array(await blob.arrayBuffer())

        setDownloadUrl(url)
        setIsSinglePageDirect(true)

        setPipelineFile({
          buffer,
          name: singleName,
          type: mime
        })

        addActivity({ 
          name: singleName, 
          tool: 'PDF to Image', 
          size: blob.size, 
          resultUrl: url, 
          buffer 
        })
        toast.success('تم تحويل الصفحة إلى صورة بنجاح!')
      } else if (outputMode === 'zip') {
        // 📦 تجميع جميع الصفحات داخل أرشيف ZIP
        const { default: JSZip } = await import('jszip')
        const zip = new JSZip()

        for (let i = 1; i <= pdfData.pageCount; i++) {
          const { name, blob } = await renderOne(i)
          zip.file(name, new Uint8Array(await blob.arrayBuffer()))
          setProgress(Math.round((i / pdfData.pageCount) * 100))
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(zipBlob)
        setDownloadUrl(url)
        setIsSinglePageDirect(false)

        const zipBuffer = new Uint8Array(await zipBlob.arrayBuffer())
        setPipelineFile({
          buffer: zipBuffer,
          name: `${customFileName}.zip`,
          type: 'application/zip'
        })

        addActivity({ 
          name: `${customFileName}.zip`, 
          tool: 'PDF to Image', 
          size: zipBlob.size, 
          resultUrl: url, 
          buffer: zipBuffer 
        })
        toast.success('تم تحويل وجمع كافة الصفحات بنجاح!')
      } else {
        // 🖼️ استخراج صور منفصلة لكل صفحة
        const results: ImageResult[] = []
        for (let i = 1; i <= pdfData.pageCount; i++) {
          const { name, blob } = await renderOne(i)
          const buffer = new Uint8Array(await blob.arrayBuffer())
          results.push({ name, url: URL.createObjectURL(blob), size: blob.size, buffer })
          setProgress(Math.round((i / pdfData.pageCount) * 100))
        }
        setImageResults(results)
        setIsSinglePageDirect(false)

        results.forEach(r => addActivity({ 
          name: r.name, 
          tool: 'PDF to Image', 
          size: r.size, 
          resultUrl: r.url, 
          buffer: r.buffer 
        }))
        toast.success('تم استخراج جميع الصور بنجاح!')
      }
    } catch (error: any) { 
      toast.error(`حدث خطأ أثناء معالجة المستند: ${error.message || 'خطأ غير معروف'}`) 
    } finally { 
      setIsProcessing(false) 
    }
  }

  const shareImage = async (r: ImageResult) => {
    try {
      await shareFile(r.buffer, r.name, format === 'png' ? 'image/png' : 'image/jpeg')
    } catch { 
      toast.error(`تعذرت مشاركة الصورة "${r.name}".`) 
    }
  }

  const ActionButton = () => (
    <button 
      onClick={convertToImages} 
      disabled={isProcessing} 
      className={`w-full bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-rose-500/25 ${isNative ? 'py-4 rounded-2xl text-sm' : 'p-6 rounded-3xl text-xl'}`}
    >
      {isProcessing ? (
        <><Loader2 className="animate-spin" size={22} /> جاري تحويل الصفحات {progress}%</>
      ) : (
        <><Sparkles size={22} /> تحويل إلى صور الآن <ArrowRight size={20} className="rotate-180" /></>
      )}
    </button>
  )

  const hasResults = !!downloadUrl || imageResults.length > 0

  return (
    <NativeToolLayout 
      title="تحويل PDF إلى صور" 
      description="حول صفحات المستند بدقة فائقة وبسرعة عالية إلى صور احترافية." 
      actions={pdfData && !pdfData.isLocked && !hasResults && <ActionButton />}
    >
      <input type="file" accept=".pdf,application/pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      
      {!pdfData ? (
        <div 
          onClick={() => !isProcessing && fileInputRef.current?.click()} 
          className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group"
          dir="rtl"
        >
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <ImageIcon size={32} />
          </div>
          <h3 className="text-xl font-bold dark:text-white mb-2">اختر مستند PDF</h3>
          <p className="text-sm text-gray-400">اضغط هنا لتحديد المستند واستخراج صوره</p>
        </div>
      ) : pdfData.isLocked ? (
        <div className="max-w-md mx-auto" dir="rtl">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 text-center shadow-2xl relative">
            <button onClick={startOver} className="absolute top-6 left-6 p-2 text-gray-400 hover:text-rose-500 transition-colors" title="إلغاء">
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 dark:text-white">المستند محمي بكلمة مرور</h3>
            <p className="text-xs text-gray-400 mb-4">{pdfData.file.name}</p>
            <input 
              type="password" 
              value={unlockPassword} 
              onChange={(e) => setUnlockPassword(e.target.value)} 
              placeholder="أدخل كلمة المرور..." 
              className="w-full bg-gray-50 dark:bg-black rounded-xl px-5 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-center mb-4 dark:text-white transition-all" 
            />
            <button 
              onClick={handleUnlock} 
              disabled={!unlockPassword || isProcessing} 
              className="w-full bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
            >
              فك حماية المستند
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
          
          {/* بطاقة المستند المرفق */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
            <div className="w-16 h-20 bg-gray-50 dark:bg-black rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-rose-500 shadow-inner">
              {pdfData.thumbnail ? <img src={pdfData.thumbnail} className="w-full h-full object-cover" alt="معاينة الملف" /> : <ImageIcon size={22} />}
            </div>
            <div className="flex-1 min-w-0 text-right">
              <h3 className="font-bold text-sm truncate dark:text-white mb-1">{pdfData.file.name}</h3>
              <p className="text-[11px] text-gray-400 font-black uppercase tracking-wider">{pdfData.pageCount} {pdfData.pageCount === 1 ? 'صفحة واحدة' : 'صفحات'} • {(pdfData.file.size / (1024*1024)).toFixed(2)} ميجابايت</p>
            </div>
            <button onClick={startOver} className="p-2 text-gray-400 hover:text-rose-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800" title="إغلاق وإلغاء الملف">
              <X size={20} />
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-8 shadow-xl">
            {!hasResults ? (
              <>
                {/* دقة الجودة DPI */}
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-4 tracking-widest px-1">جودة ودقة الصور (DPI)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {DPI_OPTIONS.map(o => (
                      <button 
                        key={o.dpi} 
                        type="button"
                        onClick={() => setDpi(o.dpi)} 
                        className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-1 ${dpi === o.dpi ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10 shadow-md scale-102' : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-zinc-800'}`}
                      >
                        <span className={`font-black text-sm ${dpi === o.dpi ? 'text-rose-500' : 'text-gray-600 dark:text-zinc-300'}`}>{o.dpi} DPI</span>
                        <span className={`font-bold text-[10px] ${dpi === o.dpi ? 'text-rose-500' : 'text-gray-400'}`}>{o.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* خيار الحفظ للمستندات متعددة الصفحات */}
                {pdfData.pageCount > 1 && (
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-4 tracking-widest px-1">طريقة حفظ الصور</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['zip', 'separate'] as const).map(m => (
                        <button 
                          key={m} 
                          type="button"
                          onClick={() => setOutputMode(m)} 
                          className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center ${outputMode === m ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10 shadow-md scale-102' : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-zinc-800'}`}
                        >
                          <span className={`font-black text-xs ${outputMode === m ? 'text-rose-500' : 'text-gray-600 dark:text-zinc-300'}`}>
                            {m === 'zip' ? 'ملف مضغوط موحد (ZIP)' : 'صور منفصلة لكل صفحة'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* صيغة الصور */}
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-4 tracking-widest px-1">صيغة الصور المخرجة</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['jpg', 'png'] as const).map(fmt => (
                      <button 
                        key={fmt} 
                        type="button"
                        onClick={() => setFormat(fmt)} 
                        className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center ${format === fmt ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10 shadow-md scale-102' : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-zinc-800'}`}
                      >
                        <span className={`font-black uppercase text-xs ${format === fmt ? 'text-rose-500' : 'text-gray-600 dark:text-zinc-300'}`}>{fmt.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* اسم الملف */}
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-3 tracking-widest px-1">اسم الملف عند التصدير</label>
                  <input 
                    type="text" 
                    value={customFileName} 
                    onChange={(e) => setCustomFileName(e.target.value)} 
                    className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-gray-200 dark:border-zinc-800 focus:border-rose-500 outline-none font-bold text-sm dark:text-white transition-all text-right" 
                  />
                </div>
              </>
            ) : downloadUrl ? (
              <SuccessState 
                message="تم تحويل المستند إلى صور بنجاح!" 
                downloadUrl={downloadUrl} 
                fileName={isSinglePageDirect ? `${customFileName}.${format}` : `${customFileName}.zip`} 
                onStartOver={startOver} 
                showPreview={isSinglePageDirect} 
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-black uppercase text-gray-400 tracking-widest">
                    تم استخراج {imageResults.length} صور • بدقة {dpi} DPI ({format.toUpperCase()})
                  </p>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {imageResults.map(r => (
                    <div key={r.name} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-black/40 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-rose-500/30 transition-all">
                      <img src={r.url} alt={r.name} className="w-12 h-16 object-cover rounded-xl shrink-0 bg-white shadow-sm border border-gray-200 dark:border-zinc-800" />
                      <div className="flex-1 min-w-0 text-right">
                        <p className="font-bold text-xs truncate dark:text-white mb-1">{r.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{(r.size / 1024).toFixed(0)} كيلوبايت</p>
                      </div>
                      {isNative ? (
                        <button onClick={() => shareImage(r)} className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md shadow-rose-500/20 active:scale-95 transition-all" title={`مشاركة ${r.name}`} aria-label={`مشاركة ${r.name}`}>
                          <Share2 size={16} />
                        </button>
                      ) : (
                        <a href={r.url} download={r.name} className="p-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-1 text-xs font-bold" title={`تحميل ${r.name}`} aria-label={`تحميل ${r.name}`}>
                          <Download size={16} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={startOver} className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-black hover:opacity-90 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">
                  بدء جلسة تحويل جديدة
                </button>
              </div>
            )}
            
            <button 
              type="button"
              onClick={startOver} 
              className="w-full py-3 bg-gray-100 dark:bg-zinc-800/80 hover:bg-rose-500 hover:text-white text-gray-500 dark:text-gray-300 font-bold rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 dark:border-zinc-700 hover:border-rose-500 cursor-pointer shadow-sm active:scale-98 mt-2"
            >
              <X size={16} />
              <span>إغلاق الملف الحالي</span>
            </button>

          </div>
        </div>
      )}
    </NativeToolLayout>
  )
}