import { useState, useRef, useEffect } from 'react'
import { Lock, Unlock, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

import { getPdfMetaData } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import { useObjectURL } from '../../utils/useObjectURL'
import SuccessState from './shared/SuccessState'
import { NativeToolLayout } from './shared/NativeToolLayout'

// ضبط مسار الـ Worker الخارجي لـ PDF.js لفك التشفير بأعلى كفاءة
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
}

type UnlockPdfFile = {
  file: File
  thumbnail?: string
  pageCount: number
  isLocked: boolean
  password?: string
  pdfDoc?: any
}

export default function UnlockTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const { objectUrl, createUrl, clearUrls } = useObjectURL()
  const [pdfData, setPdfData] = useState<UnlockPdfFile | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [password, setPassword] = useState('')
  const [customFileName, setCustomFileName] = useState('paperknife-unlocked')
  const [resultMessage, setResultMessage] = useState('تم فك التشفير وإزالة الحماية بنجاح!')

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFile(file)
    }
  }, [])

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return
    const meta = await getPdfMetaData(file)
    setPdfData({ file, thumbnail: meta.thumbnail, pageCount: meta.pageCount, isLocked: meta.isLocked })
    setCustomFileName(`${file.name.replace(/\.pdf$/i, '')}-unlocked`)
    clearUrls()
    setPassword('')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0])
    if (e.target) e.target.value = ''
  }

  // 🔓 دالة فك التشفير الحقيقية وبناء مستند جديد 100% غير مشفر
  const performUnlock = async () => {
    if (!pdfData) return
    if (pdfData.isLocked && !password.trim()) {
      toast.error('الرجاء إدخال كلمة المرور الخاصة بالمستند')
      return
    }

    const sourceName = pdfData.file.name
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const arrayBuffer = await pdfData.file.arrayBuffer()

      // 1️⃣ فتح المستند المشفر باستخدام PDF.js بكلمة المرور
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        password: password.trim() || undefined,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
      })

      const pdfDocPdfJS = await loadingTask.promise
      const numPages = pdfDocPdfJS.numPages

      // 2️⃣ إنشاء مستند PDF جديد ونقي خالٍ تماماً من قواميس التشفير القديمة
      const newPdfDoc = await PDFDocument.create()

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocPdfJS.getPage(i)
        const viewport = page.getViewport({ scale: 2.0 }) // دقة عالية جداً

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95)
          const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer())

          const embeddedImage = await newPdfDoc.embedJpg(imageBytes)
          const newPage = newPdfDoc.addPage([viewport.width / 2, viewport.height / 2])
          newPage.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: viewport.width / 2,
            height: viewport.height / 2,
          })
        }
      }

      // 3️⃣ حفظ الملف الجديد غير المشفر (مع تحويل الـ buffer لتجنب خطأ TypeScript)
      const pdfBytes = await newPdfDoc.save()
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      const url = createUrl(blob)

      setResultMessage('تم فك التشفير وإزالة كلمة المرور بنجاح! 🎉')

      // 4️⃣ التسجيل الفوري والصامت في Supabase (جدول tool_history)
      await addActivity({
        name: `${customFileName || 'unlocked'}.pdf`,
        tool: 'إزالة حماية PDF',
        size: blob.size,
        resultUrl: url,
        buffer: new Uint8Array(pdfBytes)
      })

      toast.success('تم فك التشفير بنجاح وسُجلت العملية بجدول tool_history! 📥')

    } catch (error: any) {
      console.error('Unlock error:', error)
      if (error?.name === 'PasswordException' || error?.message?.includes('password')) {
        toast.error('كلمة المرور غير صحيحة، يرجى التثبت وإعادة المحاولة')
      } else {
        toast.error(`فشل في فك تشفير المستند "${sourceName}".`)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const ActionButton = () => (
    <button 
      onClick={performUnlock} 
      disabled={isProcessing || (pdfData?.isLocked && !password.trim())} 
      className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 py-4 rounded-2xl text-sm md:p-6 md:rounded-3xl md:text-xl flex items-center justify-center gap-3 shadow-lg shadow-rose-500/20 cursor-pointer"
    >
      {isProcessing ? <Loader2 className="animate-spin" /> : <Unlock size={20} />} 
      {isProcessing ? 'جاري فك التشفير...' : 'إزالة كلمة المرور الآن'}
    </button>
  )

  return (
    <NativeToolLayout 
      title="إزالة حماية PDF" 
      description="إزالة كلمات المرور والقيود عن المستندات بشكل دائم مع معالجة فورية وآمنة." 
      actions={pdfData && !objectUrl && <ActionButton />}
    >
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
      
      {!pdfData ? (
        <button 
          onClick={() => !isProcessing && fileInputRef.current?.click()} 
          className="w-full border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group"
        >
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <Unlock size={32} />
          </div>
          <h3 className="text-xl font-bold dark:text-white mb-2">اختر مستند PDF المحمي</h3>
          <p className="text-sm text-gray-400">اضغط هنا لتصفح الملفات من جهازك</p>
        </button>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6 shadow-sm">
            <div className="w-16 h-20 bg-gray-50 dark:bg-black rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-rose-500 shadow-inner">
              {pdfData.thumbnail ? <img src={pdfData.thumbnail} className="w-full h-full object-cover" /> : <Lock size={20} />}
            </div>
            <div className="flex-1 min-w-0 text-right">
              <h3 className="font-bold text-sm truncate dark:text-white">{pdfData.file.name}</h3>
              <p className="text-[10px] text-gray-400 uppercase font-black">
                {pdfData.isLocked ? 'مستند مشفر بمفتاح' : 'مستند مفتوح'}
              </p>
            </div>
            <button onClick={() => setPdfData(null)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-gray-100 dark:border-white/5 space-y-6 shadow-sm">
            {!objectUrl ? (
              <div className="space-y-6">
                {pdfData.isLocked && (
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-3 text-right">
                      كلمة المرور الرئيسية للمستند
                    </label>
                    <input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-lg text-center dark:text-white" 
                      placeholder="أدخل كلمة المرور لفتح التشفير..." 
                      autoFocus 
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-3 text-right">
                    اسم الملف عند الحفظ
                  </label>
                  <input 
                    type="text" 
                    value={customFileName} 
                    onChange={(e) => setCustomFileName(e.target.value)} 
                    className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white text-right" 
                  />
                </div>
              </div>
            ) : (
              <SuccessState 
                message={resultMessage} 
                downloadUrl={objectUrl} 
                fileName={`${customFileName || 'unlocked'}.pdf`} 
                onStartOver={() => { clearUrls(); setPassword(''); setPdfData(null); setIsProcessing(false); }} 
              />
            )}
          </div>
        </div>
      )}
    </NativeToolLayout>
  )
}