import { useState, useRef } from 'react'
import { Wand2, Upload, Download, Loader2, X, Sparkles, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { addActivity } from '../../utils/recentActivity'

export default function RemoveBackgroundTool() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('الرجاء اختيار صورة صحيحة')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string)
      setProcessedImage(null)
      setProcessedBlob(null)
      setProgress(0)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveBackground = async () => {
    if (!originalImage) return
    setLoading(true)
    setProgress(0)

    let maxProgress = 0
    const progressKeys: Record<string, number> = {}

    try {
      const { removeBackground } = await import('@imgly/background-removal')

      const blob = await removeBackground(originalImage, {
        progress: (key: string, current: number, total: number) => {
          const thisKeyProgress = total > 0 ? (current / total) * 100 : 0
          progressKeys[key] = thisKeyProgress

          const allValues = Object.values(progressKeys)
          const average = allValues.reduce((a, b) => a + b, 0) / allValues.length

          if (average > maxProgress) {
            maxProgress = average
            setProgress(Math.min(Math.round(average), 99))
          }
        }
      })

      const purePngBlob = new Blob([blob], { type: 'image/png' })
      setProcessedBlob(purePngBlob)

      const url = URL.createObjectURL(purePngBlob)
      setProcessedImage(url)
      setProgress(100)
      toast.success('تمت إزالة الخلفية بنجاح! 🎉')

      // تسجيل صامت في قاعدة البيانات وقائمة الأنشطة
      addActivity({
        tool: 'إزالة خلفية الصور',
        name: 'صورة مجزأة بدون خلفية',
        size: purePngBlob.size
      }).catch(() => {})

    } catch (error) {
      console.error('Background removal error:', error)
      toast.error('فشل في معالجة الصورة، جرب صورة أخرى')
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    const blobToDownload = processedBlob

    if (!blobToDownload && !processedImage) {
      toast.error('لا توجد صورة صالحة للتحميل')
      return
    }

    if (blobToDownload) {
      triggerBlobDownload(blobToDownload)
    } else if (processedImage) {
      fetch(processedImage)
        .then(res => res.blob())
        .then(b => triggerBlobDownload(b))
        .catch(() => toast.error('حدث خطأ أثناء تنزيل الصورة'))
    }
  }

  const triggerBlobDownload = (blob: Blob) => {
    try {
      const fileName = `paperknife-nobg-${Date.now()}.png`
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = downloadUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(downloadUrl)
      }, 1000)

      toast.success('تم تحميل الصورة بنجاح! 📥')
    } catch (e) {
      console.error(e)
      toast.error('فشل في عملية الحفظ')
    }
  }

  const handleReset = () => {
    if (processedImage) {
      URL.revokeObjectURL(processedImage)
    }
    setOriginalImage(null)
    setProcessedImage(null)
    setProcessedBlob(null)
    setProgress(0)
  }

  const getProgressStage = (p: number) => {
    if (p < 30) return 'جاري تحميل النموذج...'
    if (p < 70) return 'جاري تحليل الصورة وحواف الكائن...'
    if (p < 99) return 'اللمسات الأخيرة والقص الشفاف...'
    return 'اكتمل!'
  }

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
    
    .glass-panel-tool {
      background: rgba(24, 24, 27, 0.65);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
    }
  `

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden" dir="rtl">
      <style>{customStyles}</style>

      {/* 🌌 الخلفية المتحركة الفخمة الموحدة */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000" />
        
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-12">
        {/* الترويسة */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md shadow-xl">
            <Sparkles size={14} className="animate-pulse" />
            <span>معالجة ذكية للصور</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-l from-white via-zinc-200 to-zinc-400 tracking-tight mb-4">
            إزالة خلفية الصور <span className="text-fuchsia-500 drop-shadow-[0_0_35px_rgba(217,70,239,0.4)]">بضغطة واحدة.</span>
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg max-w-xl mx-auto font-medium leading-relaxed">
            افصل المنتجات والأشخاص بدقة فائقة وحواف ناعمة شفافة — مثالي للمصممين والبائعين على المتاجر الإلكترونية.
          </p>
        </div>

        {/* المحتوى الرئيسية */}
        {!originalImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }}
            onDragOver={(e) => e.preventDefault()}
            className="glass-panel-tool rounded-[2.5rem] p-12 sm:p-20 text-center cursor-pointer hover:border-fuchsia-500/50 hover:bg-white/[0.02] transition-all duration-500 group relative overflow-hidden animate-in fade-in zoom-in-95 duration-700"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative z-10">
              <div className="w-24 h-24 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-[0_0_40px_rgba(217,70,239,0.15)]">
                <Upload size={36} />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">اسحب الصورة هنا أو اضغط للاختيار</h3>
              <p className="text-sm text-zinc-400 font-medium">PNG • JPG • WEBP • الدقة الفائقة مدعومة</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="glass-panel-tool rounded-[2.5rem] p-6 sm:p-8 shadow-2xl animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {/* الصورة الأصلية */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ImageIcon size={16} className="text-zinc-400" />
                  <p className="text-xs font-black text-zinc-400 uppercase tracking-wider">الصورة الأصلية</p>
                </div>
                <div className="relative bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)] bg-[length:20px_20px] rounded-3xl overflow-hidden border border-white/10 shadow-inner min-h-[250px] flex items-center justify-center">
                  <img src={originalImage} alt="Original" className="w-full h-auto object-contain max-h-[380px] rounded-2xl" />
                </div>
              </div>

              {/* النتيجة المعالجة */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wand2 size={16} className="text-fuchsia-400" />
                  <p className="text-xs font-black text-fuchsia-400 uppercase tracking-wider">النتيجة بدون خلفية (PNG شفافة)</p>
                </div>
                <div className="relative bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)] bg-[length:20px_20px] rounded-3xl overflow-hidden border border-fuchsia-500/20 shadow-[0_0_30px_rgba(217,70,239,0.1)] min-h-[250px] flex items-center justify-center">
                  {processedImage ? (
                    <img src={processedImage} alt="Processed" className="w-full h-auto object-contain max-h-[380px] rounded-2xl animate-in fade-in zoom-in-95 duration-500" />
                  ) : (
                    <div className="h-full min-h-[250px] flex items-center justify-center p-6 w-full">
                      {loading ? (
                        <div className="text-center w-full">
                          <Loader2 className="animate-spin text-fuchsia-400 mx-auto mb-4" size={40} />
                          <p className="text-base text-white font-bold mb-1">
                            {getProgressStage(progress)}
                          </p>
                          <p className="text-sm text-fuchsia-400 font-black mb-4">
                            {progress}%
                          </p>
                          <div className="w-56 h-2.5 bg-zinc-800 rounded-full mx-auto overflow-hidden border border-white/5">
                            <div
                              className="h-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 transition-all duration-300 ease-out rounded-full shadow-[0_0_15px_rgba(217,70,239,0.5)]"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
                            تتم المعالجة محلياً بسرعة عالية ودون رفع صورتك لأي خادم خارجي
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500 font-medium">اضغط على زر إزالة الخلفية لبدء المعالجة</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* أزرار التحكم والعمليات */}
            <div className="flex flex-wrap gap-4">
              {!processedImage ? (
                <button
                  onClick={handleRemoveBackground}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-fuchsia-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 text-base"
                >
                  {loading ? <Loader2 className="animate-spin" size={22} /> : <Wand2 size={22} />}
                  {loading ? getProgressStage(progress) : 'إزالة الخلفية الآن'}
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black py-4 px-6 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center gap-3 text-base"
                >
                  <Download size={22} />
                  تحميل الصورة عالية الدقة (PNG شفافة)
                </button>
              )}
              
              <button
                onClick={handleReset}
                disabled={loading}
                className="px-8 py-4 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 font-bold rounded-2xl border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-base"
              >
                <X size={20} />
                صورة جديدة
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}