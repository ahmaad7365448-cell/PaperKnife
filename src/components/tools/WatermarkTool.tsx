import { useState, useRef, useEffect } from 'react'
import { Type, Lock, Loader2, Palette, Eye, X, Sparkles, Check, RotateCw, Maximize, Sun, RefreshCw, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { PDFDocument, degrees } from 'pdf-lib'

import { getPdfMetaData, unlockPdf } from '../../utils/pdfHelpers'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import { useObjectURL } from '../../utils/useObjectURL'
import SuccessState from './shared/SuccessState'
import { NativeToolLayout } from './shared/NativeToolLayout'

type WatermarkPdfData = { 
  file: File
  pageCount: number
  isLocked: boolean
  password?: string
  thumbnail?: string 
}

export default function WatermarkTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { consumePipelineFile } = usePipeline()
  const { objectUrl, createUrl, clearUrls } = useObjectURL()
  
  const [pdfData, setPdfData] = useState<WatermarkPdfData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [customFileName, setCustomFileName] = useState('paperknife-watermarked')
  const [unlockPassword, setUnlockPassword] = useState('')
  
  // 🎛️ خيارات العلامة المائية التفاعلية
  const [text, setText] = useState('أحمد')
  const [opacity, setOpacity] = useState(0.35)
  const [fontSize, setFontSize] = useState(50)
  const [rotation, setRotation] = useState(-45)
  const [color, setColor] = useState('#F43F5E')

  const colorPresets = ['#F43F5E', '#3B82F6', '#10B981', '#F59E0B', '#000000', '#FFFFFF']

  // دوال التحكم بالأزرار (+ و -) لضمان عدم تجاوز الحدود
  const handleOpacityChange = (delta: number) => setOpacity(prev => Math.min(1, Math.max(0.05, parseFloat((prev + delta).toFixed(2)))))
  const handleSizeChange = (delta: number) => setFontSize(prev => Math.min(180, Math.max(10, prev + delta)))
  const handleRotationChange = (delta: number) => setRotation(prev => Math.min(180, Math.max(-180, prev + delta)))

  const handleResetStyle = () => {
    setText('أحمد')
    setOpacity(0.35)
    setFontSize(50)
    setRotation(-45)
    setColor('#F43F5E')
    toast.success('تمت إعادة تعيين النمط الافتراضي')
  }

  const handleReset = () => {
    clearUrls()
    setPdfData(null)
    setUnlockPassword('')
    setIsProcessing(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFile(file)
    }
  }, [])

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
        setPdfData({ file, pageCount: meta.pageCount, isLocked: false, thumbnail: meta.thumbnail })
        setCustomFileName(`${file.name.replace(/\.pdf$/i, '')}-watermarked`)
      }
    } catch (err) { 
      toast.error('فشل في فتح مستند PDF') 
    } finally { 
      setIsProcessing(false)
      clearUrls()
    }
  }

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return
    setIsProcessing(true)
    const result = await unlockPdf(pdfData.file, unlockPassword)
    if (result.success) {
      setPdfData({ ...pdfData, isLocked: false, pageCount: result.pageCount, password: unlockPassword, thumbnail: result.thumbnail })
      setCustomFileName(`${pdfData.file.name.replace(/\.pdf$/i, '')}-watermarked`)
    } else { 
      toast.error(`كلمة المرور غير صحيحة.`) 
    }
    setIsProcessing(false)
  }

  const generateWatermarkPng = async (wmText: string, wmColor: string, wmSize: number, wmOpacity: number, wmRotation: number): Promise<Uint8Array> => {
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 1414
    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(500, 707)
      ctx.rotate((wmRotation * Math.PI) / 180)
      ctx.font = `bold ${wmSize * 2.5}px Cairo, Tajawal, Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = wmColor
      ctx.globalAlpha = wmOpacity
      ctx.fillText(wmText || 'أحمد', 0, 0)
      ctx.restore()
    }
    const dataUrl = canvas.toDataURL('image/png')
    const res = await fetch(dataUrl)
    return new Uint8Array(await res.arrayBuffer())
  }

  const applyWatermark = async () => {
    if (!pdfData) return
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 100))
    try {
      const arrayBuffer = await pdfData.file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
      const pngBytes = await generateWatermarkPng(text, color, fontSize, opacity, rotation)
      const watermarkImg = await pdfDoc.embedPng(pngBytes)

      for (const page of pdfDoc.getPages()) {
        const { width, height } = page.getSize()
        page.drawImage(watermarkImg, { x: 0, y: 0, width: width, height: height })
      }

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      const url = createUrl(blob)

      toast.success('تم تطبيق العلامة المائية بنجاح! 🎉')
      await addActivity({ name: `${customFileName}.pdf`, tool: 'العلامة المائية', size: blob.size, resultUrl: url, buffer: new Uint8Array(pdfBytes) })
    } catch (error: any) { 
      toast.error(`حدث خطأ: ${error.message}`) 
    } finally { 
      setIsProcessing(false) 
    }
  }

  const ActionButton = () => (
    <button 
      type="button" onClick={applyWatermark} disabled={isProcessing || !text.trim()} 
      className="w-full bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 py-4 rounded-2xl text-sm md:p-5 md:rounded-3xl md:text-lg flex items-center justify-center gap-3 shadow-lg shadow-rose-500/25 cursor-pointer"
    >
      {isProcessing ? <Loader2 className="animate-spin" size={22} /> : <Sparkles size={22} />} 
      {isProcessing ? 'جاري المعالجة...' : 'تطبيق العلامة المائية الآن'}
    </button>
  )

  return (
    <NativeToolLayout 
      title="العلامة المائية" 
      description="أضف نصوص وحقوق الملكية على المستندات بأسلوب احترافي ومعالجة محليّة." 
      actions={pdfData && !pdfData.isLocked && !objectUrl && <ActionButton />}
    >
      {/* 🎨 كود CSS مخصص لجعل أشرطة التمرير ناعمة واحترافية */}
      <style>{`
        input[type=range].custom-slider {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        input[type=range].custom-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #F43F5E;
          cursor: grab;
          margin-top: -8px;
          box-shadow: 0 0 10px rgba(244, 63, 94, 0.4);
          transition: transform 0.1s;
        }
        input[type=range].custom-slider::-webkit-slider-thumb:active {
          cursor: grabbing;
          transform: scale(1.2);
        }
        input[type=range].custom-slider::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: #e5e7eb;
          border-radius: 2px;
        }
        .dark input[type=range].custom-slider::-webkit-slider-runnable-track {
          background: #3f3f46;
        }
      `}</style>

      <input type="file" accept="application/pdf,.pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      
      {!pdfData ? (
        <div onClick={() => !isProcessing && fileInputRef.current?.click()} className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <Type size={32} />
          </div>
          <h3 className="text-xl font-bold dark:text-white mb-2">اختر مستند PDF</h3>
          <p className="text-sm text-gray-400">اضغط هنا لتحديد الملف وبدء وضع العلامة المائية</p>
        </div>
      ) : pdfData.isLocked ? (
        <div className="max-w-md mx-auto relative z-[100]" dir="rtl">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 text-center shadow-2xl relative">
            <button type="button" onClick={handleReset} className="absolute top-6 left-6 p-2 text-gray-400 hover:text-rose-500 cursor-pointer"><X size={20} /></button>
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={32} /></div>
            <h3 className="text-lg font-bold text-white mb-2">{pdfData.file.name}</h3>
            <p className="text-xs text-gray-400 mb-4">هذا المستند محمي بكلمة مرور</p>
            <input type="password" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} placeholder="أدخل كلمة المرور..." className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-center mb-4 dark:text-white" />
            <div className="flex gap-2">
              <button type="button" onClick={handleUnlock} disabled={!unlockPassword || isProcessing} className="flex-1 bg-rose-500 text-white p-4 rounded-2xl font-black uppercase text-xs disabled:opacity-50 cursor-pointer">فك الحماية</button>
              <button type="button" onClick={handleReset} className="px-4 bg-zinc-800 text-zinc-300 rounded-2xl font-bold text-xs cursor-pointer">إلغاء</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500" dir="rtl">
          
          {/* 👁️ المعاينة المباشرة */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden flex flex-col items-center relative">
               <button type="button" onClick={handleReset} className="absolute top-5 left-5 p-2.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-400 hover:text-rose-500 transition-colors z-20 shadow-sm cursor-pointer"><X size={18} /></button>
               <div className="flex justify-between items-center w-full mb-4 px-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2"><Eye size={14} className="text-rose-500"/> المعاينة المباشرة</h4>
                  <span className="text-xs text-gray-400 truncate max-w-[200px]">{pdfData.file.name}</span>
               </div>
               <div className="relative w-full max-w-[380px] aspect-[1/1.414] bg-[#f8f9fa] dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-0">
                  <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  {pdfData.thumbnail ? <img src={pdfData.thumbnail} className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none shadow-lg" alt="PDF Page" /> : <div className="absolute inset-0 bg-white" />}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-visible" viewBox="0 0 1000 1414" preserveAspectRatio="xMidYMid meet">
                    <g transform={`translate(500, 707) rotate(${rotation})`}>
                      <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fill={color} opacity={opacity} fontSize={fontSize * 2.5} fontWeight="bold" fontFamily="Cairo, Tajawal, Arial, sans-serif" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>
                        {text || 'أحمد'}
                      </text>
                    </g>
                  </svg>
               </div>
            </div>
          </div>

          {/* 🎛️ لوحة التحكم */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl space-y-8">
              
              {!objectUrl ? (
                <>
                  {/* النص */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase text-gray-400 flex items-center gap-2"><Type size={16} className="text-rose-500"/> نص العلامة</label>
                      <button onClick={handleResetStyle} className="text-[10px] text-gray-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer"><RefreshCw size={12} /> إعادة ضبط</button>
                    </div>
                    <input type="text" value={text} onChange={(e) => setText(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-2xl px-5 py-4 border border-gray-200 dark:border-zinc-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none font-bold text-base dark:text-white text-right transition-all" placeholder="أدخل النص..." />
                  </div>
                  
                  {/* الألوان */}
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase text-gray-400 flex items-center gap-2"><Palette size={16} className="text-rose-500"/> لون العلامة</label>
                    <div className="flex flex-wrap gap-3 items-center justify-between">
                      {colorPresets.map(c => (
                        <button key={c} type="button" onClick={() => setColor(c)} className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${color === c ? 'scale-110 ring-2 ring-offset-2 ring-rose-500 dark:ring-offset-zinc-900 shadow-lg' : 'hover:scale-110 border border-gray-200 dark:border-zinc-700'}`} style={{ backgroundColor: c }}>
                          {color === c && <Check size={16} className={c === '#FFFFFF' || c === '#F59E0B' ? 'text-black' : 'text-white'} />}
                        </button>
                      ))}
                      <div className="relative w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-zinc-700 shadow-sm hover:scale-110 transition-transform cursor-pointer">
                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="absolute inset-1 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                      </div>
                    </div>
                  </div>

                  {/* Sliders Section */}
                  <div className="space-y-6 pt-2">
                    
                    {/* الشفافية */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-600 dark:text-zinc-300 flex items-center gap-2"><Sun size={14} /> الشفافية</label>
                        <span className="text-xs font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md">{Math.round(opacity * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => handleOpacityChange(-0.05)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"><Minus size={16}/></button>
                        <input type="range" min="0.05" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="custom-slider flex-1" />
                        <button type="button" onClick={() => handleOpacityChange(0.05)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"><Plus size={16}/></button>
                      </div>
                    </div>

                    {/* الحجم */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-600 dark:text-zinc-300 flex items-center gap-2"><Maximize size={14} /> الحجم</label>
                        <span className="text-xs font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md">{fontSize}px</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => handleSizeChange(-2)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"><Minus size={16}/></button>
                        <input type="range" min="10" max="180" step="2" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="custom-slider flex-1" />
                        <button type="button" onClick={() => handleSizeChange(2)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"><Plus size={16}/></button>
                      </div>
                    </div>

                    {/* الدوران */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-gray-600 dark:text-zinc-300 flex items-center gap-2"><RotateCw size={14} /> الدوران</label>
                        <span className="text-xs font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-md">{rotation}°</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => handleRotationChange(-5)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"><Minus size={16}/></button>
                        <input type="range" min="-180" max="180" step="5" value={rotation} onChange={(e) => setRotation(parseInt(e.target.value))} className="custom-slider flex-1" />
                        <button type="button" onClick={() => handleRotationChange(5)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"><Plus size={16}/></button>
                      </div>
                    </div>

                  </div>

                  {/* اسم الملف */}
                  <div className="pt-6 border-t border-gray-100 dark:border-zinc-800">
                    <label className="block text-xs font-black uppercase text-gray-400 mb-3">اسم الملف عند الحفظ</label>
                    <input type="text" value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-gray-200 dark:border-zinc-800 focus:border-rose-500 outline-none font-bold text-sm dark:text-white text-right transition-all" />
                  </div>
                </>
              ) : (
                <SuccessState message="تم تطبيق العلامة المائية بنجاح! 🎉" downloadUrl={objectUrl} fileName={`${customFileName || 'watermarked'}.pdf`} onStartOver={handleReset} />
              )}

              {/* زر الإلغاء */}
              <button type="button" onClick={handleReset} className="relative z-[999] w-full py-4 bg-gray-100 dark:bg-zinc-800/80 hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-500 text-gray-500 dark:text-gray-300 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-zinc-700 hover:border-rose-500/30 cursor-pointer shadow-sm mt-2 pointer-events-auto">
                <X size={18} /> إلغاء وإغلاق الملف الحالي
              </button>

            </div>
          </div>

        </div>
      )}
    </NativeToolLayout>
  )
}