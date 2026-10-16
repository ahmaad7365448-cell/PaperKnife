import { useState, useRef } from 'react'
import { Wand2, Upload, Download, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

export default function RemoveBackgroundTool() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('الرجاء اختيار صورة صحيحة')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string)
      setProcessedImage(null)
      setProgress(0)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveBackground = async () => {
    if (!originalImage) return
    setLoading(true)
    setProgress(0)

    // ✅ تتبع أعلى نسبة وصلنا إليها (لا نعود للخلف أبداً)
    let maxProgress = 0
    // ✅ تخزين تقدم كل مفتاح على حدة
    const progressKeys: Record<string, number> = {}

    try {
      const { removeBackground } = await import('@imgly/background-removal')

      const blob = await removeBackground(originalImage, {
        progress: (key: string, current: number, total: number) => {
          // نحسب نسبة هذا المفتاح تحديداً
          const thisKeyProgress = total > 0 ? (current / total) * 100 : 0
          progressKeys[key] = thisKeyProgress

          // نحسب المتوسط لكل المفاتيح النشطة
          const allValues = Object.values(progressKeys)
          const average = allValues.reduce((a, b) => a + b, 0) / allValues.length

          // ✅ نأخذ الأعلى فقط (لا يرجع للخلف أبداً)
          if (average > maxProgress) {
            maxProgress = average
            // نترك 100% للنهاية الفعلية
            setProgress(Math.min(Math.round(average), 99))
          }
        }
      })

      const url = URL.createObjectURL(blob)
      setProcessedImage(url)
      setProgress(100) // ✅ نصل إلى 100% فقط عند النجاح الفعلي
      toast.success('تمت إزالة الخلفية بنجاح! 🎉')
    } catch (error) {
      console.error(error)
      toast.error('فشل في معالجة الصورة')
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!processedImage) return
    const link = document.createElement('a')
    link.href = processedImage
    link.download = `no-bg-${Date.now()}.png`
    link.click()
    toast.success('تم التحميل!')
  }

  const handleReset = () => {
    setOriginalImage(null)
    setProcessedImage(null)
    setProgress(0)
  }

  // ✅ استخراج نص المرحلة الحالية من نسبة التقدم
  const getProgressStage = (p: number) => {
    if (p < 30) return 'جاري تحميل النموذج...'
    if (p < 70) return 'جاري تحليل الصورة...'
    if (p < 99) return 'اللمسات الأخيرة...'
    return 'اكتمل!'
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* الترويسة */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-fuchsia-500 text-white rounded-3xl mb-4 shadow-lg shadow-fuchsia-500/30">
            <Wand2 size={32} />
          </div>
          <h1 className="text-3xl font-black dark:text-white mb-2">إزالة خلفية الصور</h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">
            أزل خلفية أي صورة بضغطة زر — مثالي للبائعين على إنستغرام
          </p>
        </div>

        {/* المحتوى */}
        {!originalImage ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
            onDragOver={(e) => e.preventDefault()}
            className="border-4 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2rem] p-12 sm:p-20 text-center cursor-pointer hover:border-fuchsia-400 hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-900/10 transition-all"
          >
            <div className="w-20 h-20 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-2">اسحب الصورة هنا أو اضغط للاختيار</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">PNG • JPG • WEBP</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-xl border border-gray-100 dark:border-zinc-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* الصورة الأصلية */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">الأصلية</p>
                <div className="bg-[repeating-conic-gradient(#e5e7eb_0%_25%,white_0%_50%)] dark:bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)] bg-[length:20px_20px] rounded-2xl overflow-hidden">
                  <img src={originalImage} alt="Original" className="w-full h-auto" />
                </div>
              </div>
              {/* النتيجة */}
              <div>
                <p className="text-xs font-bold text-fuchsia-500 uppercase tracking-wider mb-2">بدون خلفية</p>
                <div className="bg-[repeating-conic-gradient(#e5e7eb_0%_25%,white_0%_50%)] dark:bg-[repeating-conic-gradient(#27272a_0%_25%,#18181b_0%_50%)] bg-[length:20px_20px] rounded-2xl overflow-hidden">
                  {processedImage ? (
                    <img src={processedImage} alt="Processed" className="w-full h-auto" />
                  ) : (
                    <div className="h-full min-h-[200px] flex items-center justify-center p-4">
                      {loading ? (
                        <div className="text-center w-full">
                          <Loader2 className="animate-spin text-fuchsia-500 mx-auto mb-3" size={32} />
                          <p className="text-sm text-gray-600 dark:text-zinc-300 font-bold mb-1">
                            {getProgressStage(progress)}
                          </p>
                          <p className="text-xs text-fuchsia-500 font-black mb-3">
                            {progress}%
                          </p>
                          <div className="w-48 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-600 transition-all duration-300 ease-out rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
                            المرة الأولى قد تستغرق دقيقة (تحميل النموذج)
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">النتيجة ستظهر هنا</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* الأزرار */}
            <div className="flex flex-wrap gap-3">
              {!processedImage ? (
                <button
                  onClick={handleRemoveBackground}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg hover:shadow-fuchsia-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                  {loading ? getProgressStage(progress) : 'إزالة الخلفية'}
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  تحميل الصورة
                </button>
              )}
              <button
                onClick={handleReset}
                disabled={loading}
                className="px-6 py-4 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold rounded-2xl hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
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