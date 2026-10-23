import React, { useState, useRef } from 'react'
import { PDFDocument } from 'pdf-lib'
import { 
  Layers, UploadCloud, Download, Loader2, Trash2, 
  ArrowUp, ArrowDown, FileText, Sparkles, Plus, RefreshCw 
} from 'lucide-react'
import { toast } from 'sonner'
import { addActivity } from '../../utils/recentActivity'

interface FileItem {
  id: string
  file: File
  name: string
  size: string
}

export default function MergeTool() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null)
  const [mergedUrl, setMergedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // تنسيق حجم الملف
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // معالجة اختيار وإضافة الملفات
  const handleFileSelect = (newFiles: FileList | File[]) => {
    const validFiles: FileItem[] = []
    
    Array.from(newFiles).forEach((file) => {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        validFiles.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          name: file.name,
          size: formatSize(file.size)
        })
      } else {
        toast.error(`الملف ${file.name} ليس مستند PDF صالح`)
      }
    })

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles])
      setMergedBlob(null)
      setMergedUrl(null)
    }
  }

  // حذف ملف من القائمة
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    setMergedBlob(null)
    setMergedUrl(null)
  }

  // تحريك الملف للأعلى
  const moveUp = (index: number) => {
    if (index === 0) return
    setFiles((prev) => {
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[index - 1]
      updated[index - 1] = temp
      return updated
    })
  }

  // تحريك الملف للأسفل
  const moveDown = (index: number) => {
    if (index === files.length - 1) return
    setFiles((prev) => {
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[index + 1]
      updated[index + 1] = temp
      return updated
    })
  }

  // ⚙️ معالجة دمج مستندات PDF
  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error('الرجاء اختيار ملفين PDF على الأقل للدمج')
      return
    }

    setLoading(true)
    try {
      const mergedPdf = await PDFDocument.create()

      for (const item of files) {
        const arrayBuffer = await item.file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => mergedPdf.addPage(page))
      }

      const pdfBytes = await mergedPdf.save()
      
      // 🟢 تصحيح نوع Uint8Array لتوافق الـ BlobPart عبر as any لتجاوز خطأ TS2322
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      setMergedBlob(blob)
      setMergedUrl(url)

      toast.success('تم دمج ملفات PDF بنجاح! 🎉')

      // تسجيل صامت في قاعدة البيانات
      addActivity({
        tool: 'دمج PDF',
        name: `مستند مدمج (${files.length} ملفات)`,
        size: blob.size
      }).catch(() => {})

    } catch (error) {
      console.error('Merge error:', error)
      toast.error('حدث خطأ أثناء دمج الملفات، تأكد من أن الملفات غير محمية بكلمة سر')
    } finally {
      setLoading(false)
    }
  }

  // 📥 تنزيل المستند المدمج
  const handleDownload = () => {
    if (!mergedBlob && !mergedUrl) return

    const fileName = `paperknife-merged-${Date.now()}.pdf`
    
    try {
      const blobToUse = mergedBlob || new Blob([], { type: 'application/pdf' })
      const downloadUrl = mergedUrl || URL.createObjectURL(blobToUse)
      
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = downloadUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        document.body.removeChild(a)
      }, 1000)

      toast.success('تم تنزيل المستند المدمج بنجاح! 📥')
    } catch (e) {
      console.error(e)
      toast.error('فشل في عملية الحفظ')
    }
  }

  // إعادة الضبط
  const handleReset = () => {
    if (mergedUrl) {
      URL.revokeObjectURL(mergedUrl)
    }
    setFiles([])
    setMergedBlob(null)
    setMergedUrl(null)
  }

  const customStyles = `
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob { animation: blob 10s infinite alternate cubic-bezier(0.4, 0, 0.2, 1); }
    .animation-delay-2000 { animation-delay: 2s; }
  `

  return (
    <div className="min-h-screen relative overflow-hidden pt-24 pb-12 px-6" dir="rtl">
      <style>{customStyles}</style>

      {/* 🌌 الخلفية التفاعلية الموحدة */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-rose-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* الترويسة */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md shadow-xl">
            <Sparkles size={14} className="animate-pulse" />
            <span>معالجة المستندات السحابية</span>
          </div>

          <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl mx-auto flex items-center justify-center mb-6 border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
            <Layers size={36} strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">دمج ملفات PDF</h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto font-medium">
            اجمع عدة ملفات في مستند واحد بترتيبك الخاص، تتم المعالجة بالكامل داخل متصفحك لضمان خصوصيتك.
          </p>
        </div>

        {/* منطقة رفع وتجهيز الملفات */}
        {files.length === 0 ? (
          <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault()
                if (e.dataTransfer.files) handleFileSelect(e.dataTransfer.files)
              }}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-zinc-700/50 hover:border-rose-500/50 bg-zinc-950/30 rounded-[2rem] flex flex-col items-center justify-center py-20 px-6 text-center transition-all cursor-pointer group"
            >
              <div className="w-20 h-20 bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center mb-6 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300 shadow-lg">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">اسحب وأفلت الملفات هنا</h3>
              <p className="text-zinc-500 mb-6 font-medium">أو اضغط لتصفح جهازك واختيار ملفات PDF</p>
              
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
                className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all flex items-center gap-2 shadow-lg"
              >
                تحديد الملفات <Plus size={18} className="text-rose-400" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            />
          </div>
        ) : (
          <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl animate-in fade-in duration-500">
            
            {/* الشريط العلوى للحالة */}
            <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-sm">
                  {files.length}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">الملفات المحددة</h3>
                  <p className="text-xs text-zinc-400 font-medium">يمكنك إعادة ترتيب المستندات باستخدام الأسهم</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold rounded-xl transition-all"
              >
                <Plus size={16} className="text-rose-400" />
                إضافة المزيد
              </button>
            </div>

            {/* قائمة المستندات */}
            <div className="space-y-3 mb-8 max-h-[380px] overflow-y-auto pr-1">
              {files.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-zinc-950/60 rounded-2xl border border-white/5 hover:border-rose-500/30 transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className="w-7 h-7 rounded-lg bg-white/5 text-zinc-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {index + 1}
                    </span>
                    <FileText size={24} className="text-rose-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{item.name}</p>
                      <p className="text-xs text-zinc-500">{item.size}</p>
                    </div>
                  </div>

                  {/* أزرار الترتيب والحذف */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="تحريك للأعلى"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(index)}
                      disabled={index === files.length - 1}
                      className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      title="تحريك للأسفل"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="p-2 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors"
                      title="حذف الملف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            />

            {/* الأزرار العريضة */}
            <div className="flex flex-wrap gap-4">
              {!mergedUrl ? (
                <button
                  type="button"
                  onClick={handleMerge}
                  disabled={loading || files.length < 2}
                  className="flex-1 bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-rose-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 text-base"
                >
                  {loading ? <Loader2 className="animate-spin" size={22} /> : <Layers size={22} />}
                  {loading ? 'جاري دمج المستندات...' : `دمج (${files.length}) ملفات PDF الآن`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center gap-3 text-base"
                >
                  <Download size={22} />
                  تحميل المستند المدمج (PDF)
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="px-6 py-4 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-bold rounded-2xl border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-base"
              >
                <RefreshCw size={18} />
                بدء من جديد
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}