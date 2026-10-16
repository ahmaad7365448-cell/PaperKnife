import { useState, useRef, useEffect } from 'react'
import { 
  Upload, Download, RotateCw, RotateCcw, FlipHorizontal2, FlipVertical2,
  Sliders, Eraser, ZoomIn, RefreshCw, Loader2, X, Palette, Pipette
} from 'lucide-react'
import { toast } from 'sonner'

type Stroke = { points: { x: number; y: number }[]; size: number; color: string }

export default function ImageEditorTool() {
  const [originalSrc, setOriginalSrc] = useState('')
  const [activeTab, setActiveTab] = useState<'colors' | 'transform' | 'erase'>('colors')
  const [loading, setLoading] = useState(false)

  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [hue, setHue] = useState(0)
  const [blur, setBlur] = useState(0)
  const [grayscale, setGrayscale] = useState(false)
  const [sepia, setSepia] = useState(false)
  const [invert, setInvert] = useState(false)

  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [scale, setScale] = useState(1)

  const [eraseMode, setEraseMode] = useState(false)
  const [brushSize, setBrushSize] = useState(40)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [fillColor, setFillColor] = useState<string>('transparent')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const drawingRef = useRef(false)
  const currentStrokeRef = useRef<Stroke | null>(null)

  const cssFilters = [
    `brightness(${brightness}%)`,
    `contrast(${contrast}%)`,
    `saturate(${saturation}%)`,
    `hue-rotate(${hue}deg)`,
    blur > 0 ? `blur(${blur}px)` : '',
    grayscale ? 'grayscale(100%)' : '',
    sepia ? 'sepia(100%)' : '',
    invert ? 'invert(100%)' : '',
  ].filter(Boolean).join(' ')

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('الرجاء اختيار صورة صحيحة')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        imageRef.current = img
        setOriginalSrc(src)
        resetAll()
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img || !originalSrc) return

    const isRot90 = rotation === 90 || rotation === 270
    const baseW = isRot90 ? img.naturalHeight : img.naturalWidth
    const baseH = isRot90 ? img.naturalWidth : img.naturalHeight
    canvas.width = Math.round(baseW * scale)
    canvas.height = Math.round(baseH * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale((flipH ? -1 : 1) * scale, (flipV ? -1 : 1) * scale)
    ctx.filter = cssFilters || 'none'
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
    ctx.filter = 'none'
    ctx.restore()

    if (strokes.length > 0) {
      ctx.globalCompositeOperation = fillColor === 'transparent' ? 'destination-out' : 'source-over'
      for (const stroke of strokes) {
        ctx.strokeStyle = stroke.color === 'transparent' ? 'rgba(0,0,0,1)' : stroke.color
        ctx.fillStyle = stroke.color === 'transparent' ? 'rgba(0,0,0,1)' : stroke.color
        ctx.lineWidth = stroke.size
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        if (stroke.points.length === 1) {
          const p = stroke.points[0]
          ctx.beginPath()
          ctx.arc(p.x, p.y, stroke.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
          }
          ctx.stroke()
        }
      }
      ctx.globalCompositeOperation = 'source-over'
    }
  }, [originalSrc, brightness, contrast, saturation, hue, blur, grayscale, sepia, invert, rotation, flipH, flipV, scale, strokes, fillColor])

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!eraseMode || !imageRef.current) return
    e.preventDefault()
    drawingRef.current = true
    const { x, y } = getCoords(e)
    const stroke: Stroke = { points: [{ x, y }], size: brushSize, color: fillColor }
    currentStrokeRef.current = stroke

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.filter = 'none'
    ctx.globalCompositeOperation = fillColor === 'transparent' ? 'destination-out' : 'source-over'
    ctx.fillStyle = fillColor === 'transparent' ? 'rgba(0,0,0,1)' : fillColor
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }

  const continueDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!eraseMode || !drawingRef.current || !currentStrokeRef.current) return
    e.preventDefault()
    const { x, y } = getCoords(e)
    const stroke = currentStrokeRef.current
    const lastPoint = stroke.points[stroke.points.length - 1]
    stroke.points.push({ x, y })

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.filter = 'none'
    ctx.globalCompositeOperation = fillColor === 'transparent' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = fillColor === 'transparent' ? 'rgba(0,0,0,1)' : fillColor
    ctx.lineWidth = stroke.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
  }

  const endDraw = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    if (currentStrokeRef.current) {
      const finished = currentStrokeRef.current
      setStrokes(prev => [...prev, finished])
      currentStrokeRef.current = null
    }
  }

  const pickColorFromCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (eraseMode) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = Math.floor((e.clientX - rect.left) * scaleX)
    const y = Math.floor((e.clientY - rect.top) * scaleY)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pixel = ctx.getImageData(x, y, 1, 1).data
    const hex = `#${[pixel[0], pixel[1], pixel[2]].map(n => n.toString(16).padStart(2, '0')).join('')}`
    setFillColor(hex)
    toast.success(`تم اختيار اللون ${hex}`)
  }

  const resetColors = () => {
    setBrightness(100); setContrast(100); setSaturation(100)
    setHue(0); setBlur(0); setGrayscale(false); setSepia(false); setInvert(false)
  }
  const resetTransforms = () => {
    setRotation(0); setFlipH(false); setFlipV(false); setScale(1)
  }
  const resetErasures = () => setStrokes([])
  const resetAll = () => { resetColors(); resetTransforms(); resetErasures() }
  const handleReset = () => {
    setOriginalSrc('')
    imageRef.current = null
    resetAll()
  }

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setLoading(true)
    setTimeout(() => {
      try {
        const dataUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = `edited-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('تم التحميل بنجاح! 🎉')
      } catch (error) {
        console.error('Download error:', error)
        toast.error('فشل في التحميل، حاول مرة أخرى')
      } finally {
        setLoading(false)
      }
    }, 100)
  }

  const Slider = ({ label, value, min, max, onChange, unit = '' }: {
    label: string; value: number; min: number; max: number
    onChange: (v: number) => void; unit?: string
  }) => (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-bold text-gray-600 dark:text-zinc-300">{label}</label>
        <span className="text-xs font-black text-fuchsia-500">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-fuchsia-500 cursor-pointer" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white rounded-3xl mb-4 shadow-lg shadow-fuchsia-500/30">
            <Palette size={32} />
          </div>
          <h1 className="text-3xl font-black dark:text-white mb-2">محرر الصور الاحترافي</h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">
            عدّل الألوان، ارفع الدقة، وأزل أي عنصر من صورتك
          </p>
        </div>

        {!originalSrc ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]) }}
            onDragOver={(e) => e.preventDefault()}
            className="border-4 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2rem] p-12 sm:p-20 text-center cursor-pointer hover:border-fuchsia-400 transition-all"
          >
            <div className="w-20 h-20 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-2">اسحب الصورة هنا أو اضغط للاختيار</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">PNG • JPG • WEBP</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]) }} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 shadow-xl border border-gray-100 dark:border-zinc-800">
                <div className="relative flex items-center justify-center min-h-[400px] max-h-[70vh] bg-[repeating-conic-gradient(#e5e7eb800_0%_25%,white_0%_50%) p] dark:bg-[repeating-conic--gradient(#27272a_0%_25%,#18181b_0%_50%)] bg-[length:20px_20px] rounded-2xl overflow-hidden p-4">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDraw}
                    onMouseMove={continueDraw}
                    onMouseUp={endDraw}
                    onMouseLeave={endDraw}
                    onTouchStart={startDraw}
                    onTouchMove={continueDraw}
                    onTouchEnd={endDraw}
                    onContextMenu={(e) => { e.preventDefault(); pickColorFromCanvas(e) }}
                    style={{
                      cursor: eraseMode ? 'crosshair' : 'default',
                      maxWidth: '100%',
                      maxHeight: '60vh',
                      objectFit: 'contain',
                      touchAction: eraseMode ? 'none' : 'auto',
                    }}
                  />
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => setEraseMode(!eraseMode)}
                    className={`flex-1 min-w-[120px] py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      eraseMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                    }`}>
                    <Eraser size={16} />
                    {eraseMode ? 'وضع الفرشاة مفعّل ✓' : 'تفعيل الفرشاة'}
                  </button>
                  <button onClick={handleDownload} disabled={loading}
                    className="flex-1 min-w-[120px] py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                    {loading ? 'جاري التصدير...' : 'تحميل PNG'}
                  </button>
                  <button onClick={resetAll} className="px-4 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl font-bold text-sm flex items-center gap-2">
                    <RefreshCw size={16} /> إعادة ضبط
                  </button>
                  <button onClick={handleReset} className="px-4 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl font-bold text-sm flex items-center gap-2">
                    <X size={16} /> صورة جديدة
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-zinc-800 sticky top-6">
                <div className="flex bg-gray-100 dark:bg-zinc-1 rounded-2xl mb-6">
                  {[
                    { id: 'colors', label: 'الألوان', icon: Sliders },
                    { id: 'transform', label: 'التحويل', icon: RotateCw },
                    { id: 'erase', label: 'الفرشاة', icon: Eraser },
                  ].map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id as 'colors' | 'transform' | 'erase')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        activeTab === id ? 'bg-fuchsia-500 text-white shadow-md' : 'text-gray-500 dark:text-zinc-400'
                      }`}>
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>

                {activeTab === 'colors' && (
                  <div className="space-y-4">
                    <Slider label="السطوع" value={brightness} min={0} max={200} onChange={setBrightness} unit="%" />
                    <Slider label="التباين" value={contrast} min={0} max={200} onChange={setContrast} unit="%" />
                    <Slider label="التشبع" value={saturation} min={0} max={200} onChange={setSaturation} unit="%" />
                    <Slider label="تدوير اللون" value={hue} min={0} max={360} onChange={setHue} unit="°" />
                    <Slider label="الضبابية" value={blur} min={0} max={20} onChange={setBlur} unit="px" />
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button onClick={() => setGrayscale(!grayscale)} className={`py-2 rounded-xl text-xs font-bold ${grayscale ? 'bg-zinc-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}>رمادي</button>
                      <button onClick={() => setSepia(!sepia)} className={`py-2 rounded-xl text-xs font-bold ${sepia ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}>بني</button>
                      <button onClick={() => setInvert(!invert)} className={`py-2 rounded-xl text-xs font-bold ${invert ? 'bg-indigo-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300'}`}>عكسي</button>
                    </div>
                    <button onClick={resetColors} className="w-full py-2 text-xs font-bold text-fuchsia-500 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 rounded-xl transition">إعادة ضبط الألوان</button>
                  </div>
                )}

                {activeTab === 'transform' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-gray-600 dark:text-zinc-300 mb-2">الدوران</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setRotation((rotation - 90 + 360) % 360)} className="py-3 bg-gray-100 dark:bg-zinc-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-gray-700 dark:text-zinc-300">
                          <RotateCcw size={16} /> يمين
                        </button>
                        <button onClick={() => setRotation((rotation + 90) % 360)} className="py-3 bg-gray-100 dark:bg-zinc-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-gray-700 dark:text-zinc-300">
                          <RotateCw size={16} /> يسار
                        </button>
                      </div>
                      <p className="text-center text-xs text-fuchsia-500 font-black mt-2">الزاوية: {rotation}°</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-600 dark:text-zinc-300 mb-2">القلب</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setFlipH(!flipH)} className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 ${flipH ? 'bg-fuchsia-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'}`}>
                          <FlipHorizontal2 size={16} /> أفقي
                        </button>
                        <button onClick={() => setFlipV(!flipV)} className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 ${flipV ? 'bg-fuchsia-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'}`}>
                          <FlipVertical2 size={16} /> عمودي
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-600 dark:text-zinc-300 mb-2 flex items-center gap-1">
                        <ZoomIn size={14} /> رفع الدقة
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 1.5, 2, 3].map(s => (
                          <button key={s} onClick={() => setScale(s)} className={`py-2 rounded-xl text-xs font-bold ${scale === s ? 'bg-fuchsia-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'}`}>{s}x</button>
                        ))}
                      </div>
                    </div>
                    <button onClick={resetTransforms} className="w-full py-2 text-xs font-bold text-fuchsia-500 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 rounded-xl transition">إعادة ضبط التحويلات</button>
                  </div>
                )}

                {activeTab === 'erase' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      💡 اضغط "تفعيل الفرشاة" بالأسفل، ثم ارسم على الجزء الذي تريد إزالته.
                    </div>
                    <Slider label="حجم الفرشاة" value={brushSize} min={10} max={150} onChange={setBrushSize} unit="px" />
                    
                    <div className="border-t border-gray-200 dark:border-zinc-700 pt-4">
                      <p className="text-xs font-bold text-gray-600 dark:text-zinc-300 mb-3 flex items-center gap-1">
                        <Pipette size={14} /> لون الملء (لإخفاء الإزالة)
                      </p>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="color" 
                          value={fillColor === 'transparent' ? '#ffffff' : fillColor}
                          onChange={(e) => setFillColor(e.target.value)}
                          className="w-12 h-12 rounded-xl cursor-pointer border-2 border-gray-200 dark:border-zinc-700"
                        />
                        <button 
                          onClick={() => setFillColor('transparent')}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold ${fillColor === 'transparent' ? 'bg-fuchsia-500 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'}`}
                        >
                          شفاف (بدون ملء)
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-2 leading-relaxed">
                        💡 للحصول على ملء تلقائي (AI Fill)، لا يمكن تنفيذه في المتصفح فقط. لكن يمكنك اختيار لون مشابه للخلفية (بالنقر بزر الفأرة الأيمن على أي مكان في الصورة) وسيبدو الفراغ مُصلّحاً.
                      </p>
                    </div>

                    <button onClick={resetErasures} className="w-full py-2 text-xs font-bold text-fuchsia-500 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 rounded-xl transition">مسح كل الإزالات</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}