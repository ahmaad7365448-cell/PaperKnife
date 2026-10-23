import { useState, useRef, useEffect } from 'react'
import { Loader2, Copy, FileText, Lock, Check, Download, Zap, ScanSearch, ArrowRight, X, Sparkles, AlignRight, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'

import { getPdfMetaData, loadPdfDocument, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import { NativeToolLayout } from './shared/NativeToolLayout'

type PdfToTextData = { file: File, pageCount: number, isLocked: boolean, pdfDoc?: any, password?: string }
type ExtractionMode = 'text' | 'ocr'

export default function PdfToTextTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const [pdfData, setPdfData] = useState<PdfToTextData | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('text')
  const [unlockPassword, setUnlockPassword] = useState('')
  const [customFileName, setCustomFileName] = useState('paperknife-extracted')
  const [copied, setCopied] = useState(false)
  const [hasNoTextDetected, setHasNoTextDetected] = useState(false)
  const isNative = Capacitor.isNativePlatform()

  const isOcrDisabled = import.meta.env.VITE_DISABLE_OCR === 'true'

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFile(file)
    }
  }, [])

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setIsProcessing(true)
    try {
      const result = await unlockPdf(pdfData.file, unlockPassword)
      if (result.success) { 
        setPdfData({ ...pdfData, isLocked: false, pageCount: result.pageCount, pdfDoc: result.pdfDoc, password: unlockPassword }) 
        toast.success('تم فك حماية المستند بنجاح!')
      } else { 
        toast.error(`كلمة المرور غير صحيحة للملف "${pdfData.file.name}".`) 
      }
    } catch {
      toast.error('حدث خطأ أثناء فك الحماية.')
    } finally {
      setIsProcessing(false)
    }
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
        setPdfData({ file, pageCount: meta.pageCount, isLocked: false, pdfDoc }) 
        setCustomFileName(`${file.name.replace(/\.pdf$/i, '')}-نص`)
      }
      setExtractedText('')
      setHasNoTextDetected(false)
    } catch (err) { 
      console.error(err)
      toast.error('تعذر فتح مستند PDF المرفق') 
    } finally { 
      setIsProcessing(false) 
    }
  }

  // 🎯 استخراج ذكي مع ترتيب إحداثيات النصوص
  const executeTextExtraction = async (mode: ExtractionMode) => {
    if (!pdfData || !pdfData.pdfDoc) return
    setIsProcessing(true)
    setProgress(0)
    setExtractedText('')
    setHasNoTextDetected(false)

    try {
      let result = ''
      let totalWordsFound = 0

      if (mode === 'text') {
        for (let i = 1; i <= pdfData.pageCount; i++) {
          const page = await pdfData.pdfDoc.getPage(i)
          const textContent = await page.getTextContent()

          // 🟢 ترتيب النصوص حسب الموضع المكاني (من الأعلى لأسفل ومن اليمين لليسار)
          const items = (textContent.items as any[]).sort((a, b) => {
            const yDiff = Math.abs(b.transform[5] - a.transform[5])
            if (yDiff > 6) return b.transform[5] - a.transform[5] // سطر جديد
            return a.transform[4] - b.transform[4] // ترتيب أفقياً
          })

          const pageText = items.map(item => item.str).join(' ').replace(/\s+/g, ' ').trim()
          
          if (pageText) {
            totalWordsFound += pageText.split(/\s+/).length
            result += `--- الصفحة ${i} ---\n${pageText}\n\n`
          } else {
            result += `--- الصفحة ${i} ---\n[لا يوجد نص برمجي مباشر - هذه الصفحة مصورة]\n\n`
          }

          setProgress(Math.round((i / pdfData.pageCount) * 100))
        }

        if (totalWordsFound < 5) {
          setHasNoTextDetected(true)
          toast.warning('المستند مصور بدون نص مباشر، يُفضل استخدام القارئ الضوئي OCR')
        } else {
          toast.success('تم مسح النص بنجاح!')
        }

      } else {
        // 🔍 القارئ الضوئي OCR
        let currentPageIndex = 1
        const tessModule = await import('tesseract.js')
        const Tesseract = tessModule.default || tessModule
        
        const worker = await Tesseract.createWorker('ara+eng', 1, { 
          workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v5/dist/worker.min.js',
          corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5/tesseract-core.wasm.js',
          logger: (m: any) => { 
            if (m.status === 'recognizing text') { 
              const base = ((currentPageIndex - 1) / pdfData.pageCount) * 100 
              setProgress(Math.round(base + (m.progress * (100 / pdfData.pageCount)))) 
            } 
          }
        })

        for (let i = 1; i <= pdfData.pageCount; i++) {
          currentPageIndex = i
          const page = await pdfData.pdfDoc.getPage(i)
          const viewport = page.getViewport({ scale: 2.0 })
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) continue
          canvas.height = viewport.height
          canvas.width = viewport.width
          await page.render({ canvasContext: ctx, viewport }).promise
          
          const { data: { text } } = await worker.recognize(canvas)
          result += `--- الصفحة ${i} (معالجة ضوئية OCR) ---\n${text.trim() || '[لم يتم العثور على نص واضح]'}\n\n`
          
          canvas.width = 0
          canvas.height = 0
        }
        await worker.terminate()
        toast.success('تمت المعالجة الضوئية بنجاح!')
      }

      setExtractedText(result)
    } catch (err: any) {
      console.error(err)
      toast.error(`حدث خطأ أثناء استخراج النص: ${err.message || 'خطأ غير معروف'}`)
    } finally { 
      setIsProcessing(false) 
    }
  }

  const handleStartExtraction = () => executeTextExtraction(extractionMode)

  const handleDownload = async () => {
    if (!extractedText) return
    try {
      const bom = '\uFEFF'
      const blob = new Blob([bom + extractedText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${customFileName}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      addActivity({
        name: `${customFileName}.txt`,
        tool: 'PDF to Text',
        size: blob.size,
        resultUrl: url,
        buffer: new Uint8Array(await blob.arrayBuffer())
      })

      toast.success('تم حفظ وتحميل الملف النصي بنجاح!')
    } catch (err) {
      console.error(err)
      toast.error('تعذر تنزيل الملف النصي')
    }
  }

  const handleCopy = () => {
    if (!extractedText) return
    navigator.clipboard.writeText(extractedText)
    setCopied(true)
    toast.success('تم نسخ النص إلى الحافظة!')
    setTimeout(() => setCopied(false), 2000)
  }

  const ActionButton = () => (
    <button 
      onClick={handleStartExtraction} 
      disabled={isProcessing} 
      className={`w-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20 ${isNative ? 'py-4 rounded-2xl text-sm' : 'p-6 rounded-3xl text-xl'}`}
    >
      {isProcessing ? (
        <><Loader2 className="animate-spin" size={22} /> جاري الاستخراج {progress}%</>
      ) : (
        <><Sparkles size={22} /> استخراج النص الآن <ArrowRight size={20} className="rotate-180" /></>
      )}
    </button>
  )

  const wordCount = extractedText ? extractedText.trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = extractedText.length

  return (
    <NativeToolLayout 
      title="استخراج النص من PDF" 
      description="استخرج النصوص والكلمات من مستنداتك وسرّع قراءتها ومعالجتها." 
      actions={pdfData && !pdfData.isLocked && !extractedText && <ActionButton />}
    >
      <input type="file" accept=".pdf,application/pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      
      {!pdfData ? (
        <div 
          onClick={() => !isProcessing && fileInputRef.current?.click()} 
          className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group"
          dir="rtl"
        >
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <FileText size={32} />
          </div>
          <h3 className="text-xl font-bold dark:text-white mb-2">اختر مستند PDF</h3>
          <p className="text-sm text-gray-400">اضغط لرفع المستند واستخراج النصوص منه</p>
        </div>
      ) : pdfData.isLocked ? (
        <div className="max-w-md mx-auto" dir="rtl">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 text-center shadow-2xl relative">
            <button onClick={() => setPdfData(null)} className="absolute top-6 left-6 p-2 text-gray-400 hover:text-rose-500 transition-colors" title="إلغاء">
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
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
            <div className="w-16 h-20 bg-gray-50 dark:bg-black rounded-xl border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-rose-500 shadow-inner">
              <FileText size={28} />
            </div>
            <div className="flex-1 min-w-0 text-right">
              <h3 className="font-bold text-sm truncate dark:text-white mb-1">{pdfData.file.name}</h3>
              <p className="text-[11px] text-gray-400 uppercase font-black">{pdfData.pageCount} صفحة • {(pdfData.file.size / (1024*1024)).toFixed(2)} ميجابايت</p>
            </div>
            <button onClick={() => { setPdfData(null); setExtractedText(''); }} className="p-2 text-gray-400 hover:text-rose-500 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800" title="إغلاق الملف">
              <X size={20} />
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-8 shadow-xl">
            {!extractedText ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setExtractionMode('text')} 
                    className={`p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${extractionMode === 'text' ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10 shadow-md scale-102' : 'border-gray-100 dark:border-white/5 hover:border-gray-200'}`}
                  >
                    <Zap size={24} className={extractionMode === 'text' ? 'text-rose-500' : 'text-gray-400'} />
                    <span className="font-black text-xs">مسح سريع للنص</span>
                    <span className="text-[10px] text-gray-400 font-bold">للمستندات النصية المباشرة</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => !isOcrDisabled && setExtractionMode('ocr')} 
                    disabled={isOcrDisabled}
                    className={`p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${extractionMode === 'ocr' ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10 shadow-md scale-102' : 'border-gray-100 dark:border-white/5 hover:border-gray-200'} ${isOcrDisabled ? 'opacity-40 grayscale' : ''}`}
                  >
                    <ScanSearch size={24} className={extractionMode === 'ocr' ? 'text-rose-500' : 'text-gray-400'} />
                    <span className="font-black text-xs">{isOcrDisabled ? 'القارئ غير متاح' : 'القارئ الضوئي (OCR)'}</span>
                    <span className="text-[10px] text-gray-400 font-bold">للمستندات المصورة والكاميرا</span>
                  </button>
                </div>

                {isProcessing && (
                  <div className="space-y-3">
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden shadow-inner">
                      <div className="bg-rose-500 h-full transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-center text-xs font-bold text-gray-400 animate-pulse">جاري قراءة واستخراج الكلمات من المستند ({progress}%)...</p>
                  </div>
                )}

                {!isProcessing && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3 px-1">اسم الملف النصي عند الحفظ</label>
                      <input 
                        type="text" 
                        value={customFileName} 
                        onChange={(e) => setCustomFileName(e.target.value)} 
                        className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-gray-200 dark:border-zinc-800 focus:border-rose-500 outline-none font-bold text-sm dark:text-white text-right" 
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 px-1 border-b border-gray-100 dark:border-zinc-800 pb-3">
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-300">
                    <AlignRight size={16} className="text-rose-500" /> النص المستخرج
                  </span>
                  <span>{wordCount} كلمة • {charCount} حرف</span>
                </div>

                {/* 🎯 زر التبديل السريع للقارئ الضوئي في حال اكتشاف عدم وجود نص */}
                {hasNoTextDetected && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex items-center justify-between gap-4">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                      المستند يبدو مصوراً. هل تريد القراءة الضوئية المتقدمة؟
                    </p>
                    <button 
                      onClick={() => { setExtractionMode('ocr'); executeTextExtraction('ocr'); }}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shrink-0 shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <RefreshCw size={14} /> تشغيل القارئ الضوئي OCR
                    </button>
                  </div>
                )}

                <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950 dark:bg-black">
                  <textarea 
                    readOnly 
                    dir="auto"
                    value={extractedText} 
                    className="w-full h-96 p-6 bg-transparent text-gray-100 font-sans text-sm leading-relaxed resize-none outline-none scrollbar-thin scrollbar-thumb-zinc-700 selection:bg-rose-500 selection:text-white" 
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={handleDownload} 
                    className="flex-[2] bg-rose-500 hover:bg-rose-600 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download size={18} />
                    <span>حفظ وتحميل الملف النصي (.txt)</span>
                  </button>

                  <button 
                    type="button"
                    onClick={handleCopy} 
                    className="flex-1 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white p-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer border border-gray-200 dark:border-zinc-700"
                  >
                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
                  </button>
                </div>

                <button 
                  type="button"
                  onClick={() => { setExtractedText(''); setProgress(0); setPdfData(null); }} 
                  className="w-full py-3 bg-gray-100 dark:bg-zinc-800/80 hover:bg-rose-500 hover:text-white text-gray-500 dark:text-gray-300 font-bold rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-2 border border-gray-200 dark:border-zinc-700 hover:border-rose-500 cursor-pointer shadow-sm active:scale-98"
                >
                  <X size={16} />
                  <span>إغلاق الملف الحالي</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </NativeToolLayout>
  )
}