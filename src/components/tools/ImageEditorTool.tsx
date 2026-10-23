import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Image as ImageIcon, Wand2, Sliders, Palette, RotateCw, RotateCcw, 
  FlipHorizontal, FlipVertical, Download, RefreshCcw, Sparkles, 
  Eye, Eraser, Check, Loader2, ArrowRight, X, FileText, Sun, Contrast,
  Share2, Zap, Layers, SlidersHorizontal, Scale, EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'

import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import { shareFile } from '../../utils/pdfHelpers'
import { NativeToolLayout } from './shared/NativeToolLayout'

type TabType = 'ai' | 'adjust' | 'presets' | 'transform'
type ExportFormat = 'png' | 'jpeg' | 'webp'

interface Adjustments {
  brightness: number
  contrast: number
  saturation: number
  temperature: number
  hue: number
  grayscale: number
  blur: number
  invert: number
  sepia: number
  exposure: number
  aiIsolatorSensitivity: number
  aiIsolatorTolerance: number
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  temperature: 0,
  hue: 0,
  grayscale: 0,
  blur: 0,
  invert: 0,
  sepia: 0,
  exposure: 100,
  aiIsolatorSensitivity: 180,
  aiIsolatorTolerance: 20
}

const PRESETS = [
  { id: 'original', name: 'الأصلي', desc: 'إعادة الوضع كما كان', adj: DEFAULT_ADJUSTMENTS },
  { id: 'sig-clean', name: 'توقيع نقي', desc: 'أبيض وأسود عالي التباين', adj: { ...DEFAULT_ADJUSTMENTS, contrast: 185, brightness: 120, grayscale: 100 } },
  { id: 'hdr', name: 'HDR زاهي', desc: 'تفاصيل مشبعة وألوان حية', adj: { ...DEFAULT_ADJUSTMENTS, saturation: 145, contrast: 120, brightness: 105 } },
  { id: 'doc-scan', name: 'مستند سكانر', desc: 'تنقية الأوراق الرسمية', adj: { ...DEFAULT_ADJUSTMENTS, contrast: 155, brightness: 125, grayscale: 100, exposure: 110 } },
  { id: 'dramatic-bw', name: 'أسود وأبيض سينمائي', desc: 'تباين ظلال عميق', adj: { ...DEFAULT_ADJUSTMENTS, grayscale: 100, contrast: 160, brightness: 95 } },
  { id: 'warm-sun', name: 'دافئ مشرق', desc: 'لمسة إضاءة دافئة', adj: { ...DEFAULT_ADJUSTMENTS, temperature: 25, saturation: 110, brightness: 105 } },
  { id: 'cool-clean', name: 'بارد احترافي', desc: 'درجات لونية هادئة', adj: { ...DEFAULT_ADJUSTMENTS, temperature: -20, contrast: 105, brightness: 100 } },
]

export default function ImageEditorTool() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { consumePipelineFile, setPipelineFile } = usePipeline()

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('ai')
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS)
  const [rotation, setRotation] = useState<number>(0)
  const [flipH, setFlipH] = useState<boolean>(false)
  const [flipV, setFlipV] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [showOriginal, setShowOriginal] = useState<boolean>(false)
  const [customFileName, setCustomFileName] = useState('paperknife-edited')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [applySignatureAlpha, setApplySignatureAlpha] = useState<boolean>(false)
  const [isolatorMode, setIsolatorMode] = useState<'bright' | 'dark' | 'custom'>('bright')
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: pipelined.type || 'image/png' })
      loadImage(file)
    }
  }, [])

  const loadImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('الرجاء اختيار ملف صورة صالح (PNG, JPG, WEBP)')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        setImageObj(img)
        setImageFile(file)
        setCustomFileName(file.name.replace(/\.[^/.]+$/, "") + '-معدلة')
        resetAll()
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const resetAll = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS)
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setApplySignatureAlpha(false)
  }

  const buildFilterString = useCallback((adj: Adjustments) => {
    const effectiveBrightness = (adj.brightness / 100) * (adj.exposure / 100) * 100
    return [
      `brightness(${effectiveBrightness}%)`,
      `contrast(${adj.contrast}%)`,
      `saturate(${adj.saturation}%)`,
      `grayscale(${adj.grayscale}%)`,
      `blur(${adj.blur}px)`,
      `invert(${adj.invert}%)`,
      `sepia(${adj.sepia}%)`,
      `hue-rotate(${adj.hue}deg)`
    ].join(' ')
  }, [])

  const renderCanvas = useCallback(() => {
    if (!imageObj || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isRotated90 = (rotation / 90) % 2 !== 0
    const width = isRotated90 ? imageObj.naturalHeight : imageObj.naturalWidth
    const height = isRotated90 ? imageObj.naturalWidth : imageObj.naturalHeight

    canvas.width = width
    canvas.height = height

    ctx.save()
    ctx.clearRect(0, 0, width, height)

    if (!showOriginal) {
      ctx.filter = buildFilterString(adjustments)
    } else {
      ctx.filter = 'none'
    }

    ctx.translate(width / 2, height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)

    ctx.drawImage(imageObj, -imageObj.naturalWidth / 2, -imageObj.naturalHeight / 2)
    ctx.restore()

    if (!showOriginal && applySignatureAlpha) {
      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data
      const sens = adjustments.aiIsolatorSensitivity
      const tol = adjustments.aiIsolatorTolerance

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const lum = 0.299 * r + 0.587 * g + 0.114 * b

        let makeTransparent = false

        if (isolatorMode === 'bright') {
          if (lum >= sens && Math.abs(r - g) <= tol && Math.abs(g - b) <= tol) {
            makeTransparent = true
          }
        } else if (isolatorMode === 'dark') {
          if (lum <= (255 - sens) && Math.abs(r - g) <= tol && Math.abs(g - b) <= tol) {
            makeTransparent = true
          }
        } else {
          if (Math.abs(r - g) <= tol && Math.abs(g - b) <= tol && Math.abs(r - b) <= tol && lum > 130) {
            makeTransparent = true
          }
        }

        if (makeTransparent) {
          data[i + 3] = 0
        } else if (isolatorMode === 'bright') {
          data[i] = Math.max(0, r - 30)
          data[i + 1] = Math.max(0, g - 30)
          data[i + 2] = Math.max(0, b - 30)
        }
      }
      ctx.putImageData(imageData, 0, 0)
    }

    if (!showOriginal && adjustments.temperature !== 0) {
      ctx.save()
      ctx.globalCompositeOperation = 'overlay'
      ctx.fillStyle = adjustments.temperature > 0 
        ? `rgba(255, 160, 0, ${Math.abs(adjustments.temperature) / 200})` 
        : `rgba(0, 120, 255, ${Math.abs(adjustments.temperature) / 200})`
      ctx.fillRect(0, 0, width, height)
      ctx.restore()
    }
  }, [imageObj, adjustments, rotation, flipH, flipV, showOriginal, applySignatureAlpha, isolatorMode, buildFilterString])

  useEffect(() => {
    renderCanvas()
  }, [renderCanvas])

  const applyAIEnhance = async () => {
    if (!imageObj) return
    setIsProcessing(true)
    toast.info('جاري تحليل وتنقية زوايا الصورة وتعديل الإضاءة...')

    await new Promise(res => setTimeout(res, 1200))

    setAdjustments(prev => ({
      ...prev,
      brightness: 110,
      contrast: 125,
      saturation: 115,
      exposure: 105,
      temperature: 5
    }))

    setIsProcessing(false)
    toast.success('تم تحسين الوضوح والألوان والدقة تلقائياً! ✨')
  }

  const toggleCleanSignatureAI = () => {
    if (!imageObj) return
    setApplySignatureAlpha(prev => !prev)
    if (!applySignatureAlpha) {
      toast.info('تم تفعيل ميزة عزل وتفريغ الخلفية، يمكنك ضبط الحساسية والتسامح بالأسفل الآن!')
    }
  }

  const applyAutoDocClean = () => {
    setAdjustments({
      ...DEFAULT_ADJUSTMENTS,
      brightness: 120,
      contrast: 150,
      grayscale: 100,
      exposure: 110
    })
    toast.success('تم تحويل الصورة إلى مستند ناصع النقاء!')
  }

  const handleSliderChange = (key: keyof Adjustments, val: number) => {
    setAdjustments(prev => ({ ...prev, [key]: val }))
  }

  const handleSave = async () => {
    if (!canvasRef.current) return
    try {
      const canvas = canvasRef.current
      const mime = exportFormat === 'png' ? 'image/png' : exportFormat === 'webp' ? 'image/webp' : 'image/jpeg'
      const dataUrl = canvas.toDataURL(mime, 0.98)
      
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const buffer = new Uint8Array(await blob.arrayBuffer())

      const finalName = `${customFileName}.${exportFormat}`

      if (isNative) {
        await shareFile(buffer, finalName, mime)
      } else {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = finalName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }

      setPipelineFile({
        buffer,
        name: finalName,
        type: mime
      })

      addActivity({
        name: finalName,
        tool: 'Image Editor',
        size: blob.size,
        resultUrl: dataUrl,
        buffer
      })

      toast.success('تم حفظ وتصدير الصورة بنجاح! 🎨')
    } catch (err) {
      console.error(err)
      toast.error('تعذر حفظ الملف الناتج')
    }
  }

  return (
    <NativeToolLayout 
      title="محرر الصور والتواقيع" 
      description="عدّل الإضاءة، حَسّن التفاصيل، وفرّغ التواقيع بدقة عالية بضغطة زر."
    >
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={(e) => e.target.files?.[0] && loadImage(e.target.files[0])} 
      />

      {!imageObj ? (
        <div 
          onClick={() => fileInputRef.current?.click()} 
          className="border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-16 text-center hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all cursor-pointer group shadow-sm"
          dir="rtl"
        >
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <ImageIcon size={36} />
          </div>
          <h3 className="text-xl font-bold dark:text-white mb-2">اختر صورة أو توقيعاً لبدء التعديل</h3>
          <p className="text-sm text-gray-400">يدعم كافة الصيغ عالية الدقة (PNG, JPG, WEBP)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" dir="rtl">
          
          <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-6 shadow-2xl space-y-6">
            
            <div className="grid grid-cols-4 gap-2 p-1.5 bg-gray-50 dark:bg-black rounded-2xl border border-gray-100 dark:border-zinc-800">
              <button 
                type="button"
                onClick={() => setActiveTab('ai')} 
                className={`py-3 rounded-xl font-black text-xs transition-all flex flex-col items-center gap-1 ${activeTab === 'ai' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                <Wand2 size={16} />
                <span>الذكاء الاصطناعي</span>
              </button>

              <button 
                type="button"
                onClick={() => setActiveTab('adjust')} 
                className={`py-3 rounded-xl font-black text-xs transition-all flex flex-col items-center gap-1 ${activeTab === 'adjust' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                <Sliders size={16} />
                <span>الضبط اليدوي</span>
              </button>

              <button 
                type="button"
                onClick={() => setActiveTab('presets')} 
                className={`py-3 rounded-xl font-black text-xs transition-all flex flex-col items-center gap-1 ${activeTab === 'presets' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                <Palette size={16} />
                <span>الفلاتر</span>
              </button>

              <button 
                type="button"
                onClick={() => setActiveTab('transform')} 
                className={`py-3 rounded-xl font-black text-xs transition-all flex flex-col items-center gap-1 ${activeTab === 'transform' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                <RotateCw size={16} />
                <span>التدوير والقص</span>
              </button>
            </div>

            <div className="space-y-6 min-h-[300px]">
              
              {activeTab === 'ai' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-5 bg-gradient-to-br from-rose-500/10 via-purple-500/5 to-transparent border border-rose-500/20 rounded-2xl space-y-3">
                    <h4 className="font-bold text-xs text-rose-500 flex items-center gap-2">
                      <Sparkles size={16} /> التحسين الشامل بالذكاء الاصطناعي
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      ضبط الإضاءة، نضارة الألوان، وزيادة وضوح الملامح بضغطة زر.
                    </p>
                    <button 
                      type="button"
                      onClick={applyAIEnhance} 
                      disabled={isProcessing}
                      className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                      <span>تحسين جودة الصورة فوراً</span>
                    </button>
                  </div>

                  <div className={`p-4 rounded-2xl border transition-all ${applySignatureAlpha ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-gray-50 dark:bg-black/50 border-gray-100 dark:border-white/5'} space-y-3`}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs dark:text-white flex items-center gap-2">
                        <Eraser size={16} className="text-rose-500" /> تفريغ خلفية التوقيع والورق (PNG)
                      </h4>
                      {applySignatureAlpha && <span className="px-2 py-0.5 bg-emerald-500 text-white font-black text-[9px] rounded">نشط</span>}
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      تفريغ الأسطح البيضاء أو الرمادية الفاتحة لتصبح شفافة. اضبط الحساسية بالأسفل لتحديد ما ترغب بعزله.
                    </p>
                    <button 
                      type="button"
                      onClick={toggleCleanSignatureAI} 
                      disabled={isProcessing}
                      className={`w-full py-3 text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${applySignatureAlpha ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 text-white'}`}
                    >
                      <Eraser size={15} />
                      <span>{applySignatureAlpha ? 'إيقاف التفريغ النشط' : 'تفريغ الخلفية وافتراض الشفافية'}</span>
                    </button>

                    {applySignatureAlpha && (
                      <div className="space-y-3.5 pt-3 border-t border-dashed border-gray-200 dark:border-zinc-800">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5">نوع خلفية الصورة</label>
                          <div className="grid grid-cols-3 gap-1.5 p-1 bg-white dark:bg-zinc-950 rounded-lg border border-gray-100 dark:border-zinc-800">
                            <button type="button" onClick={() => setIsolatorMode('bright')} className={`py-1 text-[10px] rounded font-bold transition-all ${isolatorMode === 'bright' ? 'bg-rose-500 text-white' : 'text-gray-400'}`}>ورق/فاتحة</button>
                            <button type="button" onClick={() => setIsolatorMode('dark')} className={`py-1 text-[10px] rounded font-bold transition-all ${isolatorMode === 'dark' ? 'bg-rose-500 text-white' : 'text-gray-400'}`}>داكنة</button>
                            <button type="button" onClick={() => setIsolatorMode('custom')} className={`py-1 text-[10px] rounded font-bold transition-all ${isolatorMode === 'custom' ? 'bg-rose-500 text-white' : 'text-gray-400'}`}>طبيعية/مبهمة</button>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10px] font-black text-gray-400 mb-1">
                            <span>حساسية التفريغ والسطوع (Sensitivity)</span>
                            <span className="text-rose-500">{adjustments.aiIsolatorSensitivity}</span>
                          </div>
                          <input 
                            type="range" min="30" max="250" value={adjustments.aiIsolatorSensitivity}
                            onChange={(e) => handleSliderChange('aiIsolatorSensitivity', Number(e.target.value))}
                            className="w-full accent-rose-500 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-lg cursor-pointer" 
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10px] font-black text-gray-400 mb-1">
                            <span>تسامح وتماسك الألوان (Tolerance)</span>
                            <span className="text-rose-500">{adjustments.aiIsolatorTolerance}</span>
                          </div>
                          <input 
                            type="range" min="5" max="100" value={adjustments.aiIsolatorTolerance}
                            onChange={(e) => handleSliderChange('aiIsolatorTolerance', Number(e.target.value))}
                            className="w-full accent-rose-500 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-lg cursor-pointer" 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-black/50 border border-gray-100 dark:border-white/5 rounded-2xl space-y-3">
                    <h4 className="font-bold text-xs dark:text-white flex items-center gap-2">
                      <FileText size={16} className="text-indigo-500" /> تنقية المستندات والأوراق
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      إزالة ظلال الكاميرا والتباين الضعيف لجعل الورقة تبدو كمستند رسمي.
                    </p>
                    <button 
                      type="button"
                      onClick={applyAutoDocClean} 
                      className="w-full py-3 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles size={15} className="text-indigo-400" />
                      <span>تطبيق خوارزمية السكانر</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'adjust' && (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 animate-in fade-in duration-200">
                  <div className="space-y-3 p-3 bg-gray-50 dark:bg-black/30 rounded-2xl border border-gray-100 dark:border-zinc-800/80">
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold mb-1.5 dark:text-white">
                        <span>الإضاءة (Brightness)</span>
                        <span className="text-rose-500">{adjustments.brightness}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="200" value={adjustments.brightness} 
                        onChange={(e) => handleSliderChange('brightness', Number(e.target.value))}
                        className="w-full accent-rose-500 h-2 bg-gray-200 dark:bg-zinc-800 rounded-lg cursor-pointer" 
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs font-bold mb-1.5 dark:text-white">
                        <span>التعريض الضوئي (Exposure)</span>
                        <span className="text-rose-500">{adjustments.exposure}%</span>
                      </div>
                      <input 
                        type="range" min="20" max="200" value={adjustments.exposure} 
                        onChange={(e) => handleSliderChange('exposure', Number(e.target.value))}
                        className="w-full accent-rose-500 h-2 bg-gray-200 dark:bg-zinc-800 rounded-lg cursor-pointer" 
                      />
                    </div>
                  </div>

                  <div className="space-y-3 p-3 bg-gray-50 dark:bg-black/30 rounded-2xl border border-gray-100 dark:border-zinc-800/80">
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold mb-1.5 dark:text-white">
                        <span>التباين (Contrast)</span>
                        <span className="text-rose-500">{adjustments.contrast}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="250" value={adjustments.contrast} 
                        onChange={(e) => handleSliderChange('contrast', Number(e.target.value))}
                        className="w-full accent-rose-500 h-2 bg-gray-200 dark:bg-zinc-800 rounded-lg cursor-pointer" 
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs font-bold mb-1.5 dark:text-white">
                        <span>التشبع الألوان (Saturation)</span>
                        <span className="text-rose-500">{adjustments.saturation}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="250" value={adjustments.saturation} 
                        onChange={(e) => handleSliderChange('saturation', Number(e.target.value))}
                        className="w-full accent-rose-500 h-2 bg-gray-200 dark:bg-zinc-800 rounded-lg cursor-pointer" 
                      />
                    </div>
                  </div>

                  <div className="space-y-3 p-3 bg-gray-50 dark:bg-black/30 rounded-2xl border border-gray-100 dark:border-zinc-800/80">
                    <div>
                      <div className="flex justify-between items-center text-xs font-bold mb-1.5 dark:text-white">
                        <span>تدرج رمادي (Grayscale)</span>
                        <span className="text-rose-500">{adjustments.grayscale}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={adjustments.grayscale} 
                        onChange={(e) => handleSliderChange('grayscale', Number(e.target.value))}
                        className="w-full accent-rose-500 h-2 bg-gray-200 dark:bg-zinc-800 rounded-lg cursor-pointer" 
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs font-bold mb-1.5 dark:text-white">
                        <span>عكس الألوان (Invert Colors)</span>
                        <span className="text-rose-500">{adjustments.invert}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={adjustments.invert} 
                        onChange={(e) => handleSliderChange('invert', Number(e.target.value))}
                        className="w-full accent-rose-500 h-2 bg-gray-200 dark:bg-zinc-800 rounded-lg cursor-pointer" 
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs font-bold mb-1.5 dark:text-white">
                        <span>الضبابية (Blur)</span>
                        <span className="text-rose-500">{adjustments.blur}px</span>
                      </div>
                      <input 
                        type="range" min="0" max="10" step="0.5" value={adjustments.blur} 
                        onChange={(e) => handleSliderChange('blur', Number(e.target.value))}
                        className="w-full accent-rose-500 h-2 bg-gray-200 dark:bg-zinc-800 rounded-lg cursor-pointer" 
                      />
                    </div>
                  </div>

                </div>
              )}

              {activeTab === 'presets' && (
                <div className="grid grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 animate-in fade-in duration-200">
                  {PRESETS.map(preset => (
                    <button 
                      key={preset.id}
                      type="button"
                      onClick={() => setAdjustments(preset.adj)}
                      className="p-3.5 bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 rounded-2xl hover:border-rose-500 text-right transition-all group"
                    >
                      <span className="block font-bold text-xs dark:text-white mb-1 group-hover:text-rose-500 transition-colors">{preset.name}</span>
                      <span className="block text-[10px] text-gray-400">{preset.desc}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'transform' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setRotation(r => (r + 90) % 360)}
                      className="p-4 bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 rounded-2xl hover:border-rose-500 flex items-center justify-center gap-2 font-bold text-xs dark:text-white transition-all"
                    >
                      <RotateCw size={18} className="text-rose-500" /> تدوير 90°
                    </button>

                    <button 
                      type="button"
                      onClick={() => setRotation(r => (r - 90 + 360) % 360)}
                      className="p-4 bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 rounded-2xl hover:border-rose-500 flex items-center justify-center gap-2 font-bold text-xs dark:text-white transition-all"
                    >
                      <RotateCcw size={18} className="text-rose-500" /> تدوير عكسي
                    </button>

                    <button 
                      type="button"
                      onClick={() => setFlipH(f => !f)}
                      className={`p-4 border rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-all ${flipH ? 'bg-rose-500 text-white border-rose-500' : 'bg-gray-50 dark:bg-black/40 border-gray-100 dark:border-white/5 dark:text-white'}`}
                    >
                      <FlipHorizontal size={18} /> قلب أفقي
                    </button>

                    <button 
                      type="button"
                      onClick={() => setFlipV(f => !f)}
                      className={`p-4 border rounded-2xl flex items-center justify-center gap-2 font-bold text-xs transition-all ${flipV ? 'bg-rose-500 text-white border-rose-500' : 'bg-gray-50 dark:bg-black/40 border-gray-100 dark:border-white/5 dark:text-white'}`}
                    >
                      <FlipVertical size={18} /> قلب عمودي
                    </button>
                  </div>
                </div>
              )}

            </div>

            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <input 
                  type="text" 
                  value={customFileName} 
                  onChange={(e) => setCustomFileName(e.target.value)}
                  className="flex-1 bg-gray-50 dark:bg-black rounded-xl px-4 py-2.5 border border-gray-200 dark:border-zinc-800 focus:border-rose-500 outline-none font-bold text-xs dark:text-white text-right"
                  placeholder="اسم الملف..."
                />
                <div className="flex gap-1 bg-gray-50 dark:bg-black p-1 rounded-xl border border-gray-100 dark:border-zinc-800">
                  {(['png', 'jpeg', 'webp'] as const).map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setExportFormat(fmt)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${exportFormat === fmt ? 'bg-rose-500 text-white shadow' : 'text-gray-400'}`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={handleSave}
                  className="py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  <span>تصدير وحفظ الصورة</span>
                </button>

                <button 
                  type="button"
                  onClick={resetAll}
                  className="py-3.5 bg-gray-100 dark:bg-zinc-800 hover:bg-rose-500 hover:text-white text-gray-500 dark:text-gray-300 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-zinc-700"
                >
                  <RefreshCcw size={15} />
                  <span>إعادة ضبط التعديلات</span>
                </button>
              </div>
            </div>

          </div>

          <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center justify-center min-h-[520px] relative overflow-hidden">
            
            <div className="absolute top-6 right-6 left-6 flex items-center justify-between z-10">
              <button 
                type="button"
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="px-4 py-2 bg-black/60 backdrop-blur-md hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-2 border border-white/10 shadow-lg select-none active:scale-95 transition-all"
              >
                <Eye size={15} className="text-rose-400" />
                <span>اضغط لمقارنة الأصل</span>
              </button>

              <button 
                type="button"
                onClick={() => { setImageObj(null); setImageFile(null); }}
                className="p-2 text-gray-400 hover:text-rose-500 transition-colors bg-black/60 backdrop-blur-md rounded-full border border-white/10 shadow-lg"
                title="إغلاق الصورة"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-w-full max-h-[550px] rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-inner bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] flex items-center justify-center p-2">
              <canvas ref={canvasRef} className="max-w-full max-h-[500px] object-contain block mx-auto rounded-lg shadow-md transition-all duration-300" />
            </div>

          </div>

        </div>
      )}
    </NativeToolLayout>
  )
}