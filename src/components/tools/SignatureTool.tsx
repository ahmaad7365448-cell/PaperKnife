import { useState, useRef, useEffect } from 'react'
import { Loader2, Lock, Image as ImageIcon, ArrowRight, ChevronLeft, ChevronRight, X, Pen, Eraser, Check, Trash2, Copy, Crop, Sparkles, Sliders, Plus, Eye } from 'lucide-react'
import { PDFDocument } from 'pdf-lib'
import { toast } from 'sonner'
import { Capacitor } from '@capacitor/core'

import { getPdfMetaData, loadPdfDocument, renderPageThumbnail, unlockPdf } from '../../utils/pdfHelpers'
import { getProcessBytes } from '../../utils/decryptInput'
import { addActivity } from '../../utils/recentActivity'
import { usePipeline } from '../../utils/pipelineContext'
import SuccessState from './shared/SuccessState'
import { NativeToolLayout } from './shared/NativeToolLayout'

type SignaturePdfData = { file: File, pageCount: number, isLocked: boolean, pdfDoc?: any, password?: string }
type SavedSig = { id: string, dataUrl: string, createdAt: number }
type Placement = { id: string, page: number, x: number, y: number, size: number, dataUrl: string }

const SIG_STORE_KEY = 'paperknife-signatures'
const MAX_SAVED_SIGS = 5

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read signature'))
    reader.readAsDataURL(blob)
  })

function SignaturePad({ onSave, onCancel, inkColor }: { onSave: (blob: Blob) => void, onCancel: () => void, inkColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPoint = useRef<{ x: number, y: number } | null>(null)
  const inkRef = useRef(inkColor)
  inkRef.current = inkColor

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, Math.round(rect.width * dpr))
    canvas.height = Math.max(1, Math.round(rect.height * dpr))
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const pointsFrom = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return []
    const rect = canvas.getBoundingClientRect()
    const toPt = (clientX: number, clientY: number) => ({ x: clientX - rect.left, y: clientY - rect.top })
    if ('touches' in e && e.touches.length > 0) {
      const native = e.nativeEvent as TouchEvent & { getCoalescedEvents?: () => Touch[] }
      const coalesced: Array<{ clientX: number, clientY: number }> = native.getCoalescedEvents?.() ?? []
      const touches = coalesced.length > 0 ? coalesced : (e.touches[0] ? [e.touches[0]] : [])
      return touches.map(t => toPt(t.clientX, t.clientY))
    }
    const m = e as React.MouseEvent
    return [toPt(m.clientX, m.clientY)]
  }

  const strokeTo = (pt: { x: number, y: number }) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const last = lastPoint.current ?? pt
    const dx = pt.x - last.x, dy = pt.y - last.y
    const dist = Math.hypot(dx, dy)
    const n = Math.max(1, Math.ceil(dist / 1.5))
    ctx.fillStyle = inkRef.current
    for (let i = 0; i <= n; i++) {
      const x = last.x + (dx * i) / n, y = last.y + (dy * i) / n
      ctx.beginPath()
      ctx.arc(x, y, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.strokeStyle = inkRef.current
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
    lastPoint.current = pt
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    const pts = pointsFrom(e)
    lastPoint.current = pts[0] ?? null
    if (pts[0]) {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        ctx.fillStyle = inkRef.current
        ctx.beginPath()
        ctx.arc(pts[0].x, pts[0].y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    pointsFrom(e).forEach(strokeTo)
  }

  const stopDrawing = () => { setIsDrawing(false); lastPoint.current = null }

  const handleClear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleDone = () => {
    const canvas = canvasRef.current
    if (canvas) canvas.toBlob((blob) => { if (blob) onSave(blob) }, 'image/png')
  }

  return (
    <div className="space-y-4 animate-in zoom-in-95 duration-200">
      <div className="relative aspect-video w-full bg-white border-2 border-gray-200 dark:border-zinc-700 rounded-3xl overflow-hidden touch-none select-none shadow-sm">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={handleClear} className="p-2.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm text-gray-400" title="Clear"><Eraser size={18} /></button>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500">إلغاء</button>
        <button onClick={handleDone} className="flex-[2] py-3 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"><Check size={16} /> اعتماد التوقيع</button>
      </div>
    </div>
  )
}

function SignatureCropModal({ imgSrc, onApply, onCancel }: { imgSrc: string, onApply: (blob: Blob) => void, onCancel: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 40 })
  const [sensitivity, setSensitivity] = useState(40)
  const [inkMode, setInkMode] = useState<'auto' | 'blue' | 'dark'>('auto')
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ x: number, y: number, cropX: number, cropY: number } | null>(null)

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    dragStart.current = { x: clientX, y: clientY, cropX: crop.x, cropY: crop.y }
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !dragStart.current || !containerRef.current) return
    const currentDrag = dragStart.current
    const rect = containerRef.current.getBoundingClientRect()
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    const deltaX = ((clientX - currentDrag.x) / rect.width) * 100
    const deltaY = ((clientY - currentDrag.y) / rect.height) * 100

    setCrop(prev => ({
      ...prev,
      x: Math.max(0, Math.min(100 - prev.width, currentDrag.cropX + deltaX)),
      y: Math.max(0, Math.min(100 - prev.height, currentDrag.cropY + deltaY))
    }))
  }

  const handleMouseUp = () => { setIsDragging(false); dragStart.current = null }

  const updateLivePreview = () => {
    const img = imgRef.current
    const canvas = previewCanvasRef.current
    if (!img || !canvas) return

    const naturalWidth = img.naturalWidth || 800
    const naturalHeight = img.naturalHeight || 600

    const cropPx = {
      x: (crop.x / 100) * naturalWidth,
      y: (crop.y / 100) * naturalHeight,
      w: Math.max(10, (crop.width / 100) * naturalWidth),
      h: Math.max(10, (crop.height / 100) * naturalHeight)
    }

    canvas.width = cropPx.w
    canvas.height = cropPx.h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    ctx.clearRect(0, 0, cropPx.w, cropPx.h)
    ctx.drawImage(img, cropPx.x, cropPx.y, cropPx.w, cropPx.h, 0, 0, cropPx.w, cropPx.h)

    const imgData = ctx.getImageData(0, 0, cropPx.w, cropPx.h)
    const data = imgData.data

    let bgLum = 240
    const sensFactor = sensitivity / 50

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const lum = 0.299 * r + 0.587 * g + 0.114 * b

      let isInk = false

      if (inkMode === 'blue') {
        isInk = (b - r > 12) && (b - g > 5) && (b > 40)
      } else if (inkMode === 'dark') {
        isInk = lum < 120 * sensFactor
      } else {
        const diff = bgLum - lum
        isInk = diff > (35 / sensFactor) || (b - r > 15)
      }

      if (isInk) {
        data[i + 3] = 255 
      } else {
        data[i + 3] = 0 
      }
    }

    ctx.putImageData(imgData, 0, 0)
  }

  useEffect(() => {
    updateLivePreview()
  }, [crop, sensitivity, inkMode])

  const processCropAndClean = () => {
    const canvas = previewCanvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (blob) onApply(blob)
    }, 'image/png')
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
            <Crop size={20} className="text-rose-500" /> استخراج وتفريغ التوقيع
          </h3>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-rose-500"><X size={20} /></button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-bold">1. حرك المربع الأحمر لتأطير التوقيع المطلوب:</p>
          <div 
            ref={containerRef}
            className="relative w-full aspect-video bg-zinc-950 rounded-2xl overflow-hidden select-none touch-none flex items-center justify-center border border-zinc-800"
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
          >
            <img ref={imgRef} src={imgSrc} onLoad={updateLivePreview} className="w-full h-full object-contain pointer-events-none" alt="To Crop" />
            
            <div 
              style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              className="absolute border-2 border-rose-500 bg-rose-500/20 cursor-move rounded-lg shadow-2xl flex items-center justify-center"
            >
              <span className="text-[10px] font-black uppercase text-white bg-rose-500/90 px-2 py-0.5 rounded pointer-events-none shadow">تحديد التوقيع</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
            <Eye size={14} className="text-rose-500" /> 2. المعاينة الحية للشفافية المفرغة:
          </p>
          <div className="w-full h-24 bg-[#1a1a1a] rounded-2xl flex items-center justify-center p-3 border border-zinc-800 relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '12px 12px' }}>
            <canvas ref={previewCanvasRef} className="max-h-full object-contain" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-black/40 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-500">نوع القلم الحبر:</label>
            <div className="flex gap-1">
              {(['auto', 'blue', 'dark'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setInkMode(mode)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${inkMode === mode ? 'bg-rose-500 text-white shadow' : 'bg-white dark:bg-zinc-800 text-gray-400'}`}
                >
                  {mode === 'auto' ? 'تلقائي' : mode === 'blue' ? 'أزرق' : 'أسود'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px] font-bold text-gray-500">
              <span className="flex items-center gap-1"><Sliders size={13} /> حدة الشفافية</span>
              <span className="text-rose-500">{sensitivity}%</span>
            </div>
            <input 
              type="range" min="10" max="90" value={sensitivity} onChange={(e) => setSensitivity(parseInt(e.target.value))} 
              className="w-full accent-rose-500 cursor-pointer h-2"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3.5 bg-gray-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-gray-500">إلغاء</button>
          <button onClick={processCropAndClean} className="flex-[2] py-3.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25">
            <Sparkles size={16} /> اعتماد التوقيع المفرغ
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SignatureTool() {
  const fileInputRef = useRef<HTMLInputElement>(null); const signatureInputRef = useRef<HTMLInputElement>(null); const previewRef = useRef<HTMLDivElement>(null)
  const { consumePipelineFile } = usePipeline()
  const [pdfData, setPdfData] = useState<SignaturePdfData | null>(null); const [signatureImg, setSignatureImg] = useState<string | null>(null); const [signatureFile, setSignatureFile] = useState<File | Blob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false); const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [customFileName, setCustomFileName] = useState('paperknife-signed')
  const [unlockPassword, setUnlockPassword] = useState(''); const [activePage, setActivePage] = useState(1)
  const [sigMode, setSigMode] = useState<'draw' | null>(null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [placements, setPlacements] = useState<Placement[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const dragRef = useRef<{ id: string, mode: 'move' | 'resize' } | null>(null)
  const [savedSigs, setSavedSigs] = useState<SavedSig[]>([])
  const sigUrlRef = useRef<string | null>(null)
  const isNative = Capacitor.isNativePlatform()

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIG_STORE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setSavedSigs(parsed.filter(s => s && typeof s.dataUrl === 'string'))
      }
    } catch { /* empty */ }
  }, [])

  const setSig = (file: Blob, url: string) => {
    if (sigUrlRef.current) URL.revokeObjectURL(sigUrlRef.current)
    sigUrlRef.current = url
    setSignatureFile(file)
    setSignatureImg(url)
  }

  const clearSignature = () => {
    if (sigUrlRef.current) { URL.revokeObjectURL(sigUrlRef.current); sigUrlRef.current = null }
    setSignatureFile(null)
    setSignatureImg(null)
  }

  const handleImageFileSelect = (file: File) => {
    const url = URL.createObjectURL(file)
    setCropSrc(url)
  }

  const handleCropApplied = (cleanedBlob: Blob) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
    setSig(cleanedBlob, URL.createObjectURL(cleanedBlob))
    toast.success('تمت إزالة الخلفية واقتصاص التوقيع بنجاح! 🎉')
  }

  const persistSigs = (list: SavedSig[]) => {
    setSavedSigs(list)
    try {
      localStorage.setItem(SIG_STORE_KEY, JSON.stringify(list))
    } catch {
      toast.error('Signature library is full — delete one first.')
    }
  }

  const saveForReuse = async () => {
    if (!signatureFile) return
    try {
      const dataUrl = await blobToDataUrl(signatureFile)
      if (savedSigs.some(s => s.dataUrl === dataUrl)) { toast.success('Already in your library.'); return }
      persistSigs([{ id: Math.random().toString(36).slice(2), dataUrl, createdAt: Date.now() }, ...savedSigs].slice(0, MAX_SAVED_SIGS))
      toast.success('Saved — stored only on this device.')
    } catch {
      toast.error('Could not save signature.')
    }
  }

  const loadSavedSig = async (s: SavedSig) => {
    try {
      const blob = await (await fetch(s.dataUrl)).blob()
      setSig(blob, URL.createObjectURL(blob))
    } catch {
      toast.error('Could not load that signature.')
    }
  }

  const deleteSavedSig = (id: string) => persistSigs(savedSigs.filter(s => s.id !== id))

  useEffect(() => {
    const pipelined = consumePipelineFile()
    if (pipelined) {
      const file = new File([pipelined.buffer as any], pipelined.name, { type: 'application/pdf' })
      handleFile(file)
    }
  }, [])

  const handleUnlock = async () => {
    if (!pdfData || !unlockPassword) return; setIsProcessing(true)
    try {
      const result = await unlockPdf(pdfData.file, unlockPassword)
      if (result.success) { setPdfData({ ...pdfData, isLocked: false, pageCount: result.pageCount, pdfDoc: result.pdfDoc, password: unlockPassword }); setActivePage(1); const thumb = await renderPageThumbnail(result.pdfDoc, 1, 2.0); setThumbnail(thumb) }
      else { toast.error(`Incorrect password for "${pdfData?.file.name}".`) }
    } catch { toast.error('Failed to unlock PDF') } finally { setIsProcessing(false) }
  }

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') return; setIsProcessing(true)
    setPlacements([]); setSelectedId(null)
    try {
      const meta = await getPdfMetaData(file)
      if (meta.isLocked) { setPdfData({ file, pageCount: 0, isLocked: true }) }
      else { const pdfDoc = await loadPdfDocument(file); setPdfData({ file, pageCount: meta.pageCount, isLocked: false, pdfDoc }); setActivePage(1); const thumb = await renderPageThumbnail(pdfDoc, 1, 2.0); setThumbnail(thumb) }
    } catch { toast.error('Failed to open PDF') } finally { 
      setIsProcessing(false) 
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const changePage = async (pageNum: number) => {
    if (!pdfData || !pdfData.pdfDoc) return
    const clamped = Math.min(Math.max(pageNum, 1), pdfData.pageCount)
    if (clamped === activePage && thumbnail) return
    setActivePage(clamped); setThumbnail(null)
    try {
      setThumbnail(await renderPageThumbnail(pdfData.pdfDoc, clamped, 2.0))
    } catch { toast.error('Failed to render page') }
  }

  const thumbImgRef = useRef<HTMLImageElement>(null)

  const previewPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const imgRect = thumbImgRef.current?.getBoundingClientRect()
    const boxRect = previewRef.current?.getBoundingClientRect()
    const rect = (imgRect && imgRect.width > 0 ? imgRect : boxRect)
    if (!rect) return null
    const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    return { rect, x: ((clientX - rect.left) / rect.width) * 100, y: ((clientY - rect.top) / rect.height) * 100 }
  }

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const pt = previewPoint(e)
    if (!pt) return
    setPlacements(prev => prev.map(p => {
      if (p.id !== drag.id) return p
      if (drag.mode === 'move') {
        return { ...p, x: Math.max(0, Math.min(100, pt.x)), y: Math.max(0, Math.min(100, pt.y)) }
      }
      const curPx = (p.size / 100) * pt.rect.width
      const sigLeftPx = (p.x / 100) * pt.rect.width
      const clientX = 'touches' in e && e.touches.length > 0 ? e.touches[0].clientX : (e as React.MouseEvent).clientX
      const newPx = clientX - (pt.rect.left + sigLeftPx - curPx / 2)
      return { ...p, size: Math.max(5, Math.min(100, (newPx / pt.rect.width) * 100)) }
    }))
  }

  const endDrag = () => { dragRef.current = null }

  const handleCanvasClick = () => {
    if (selectedId !== null) setSelectedId(null)
  }

  const addSignatureToPage = async () => {
    if (!signatureImg) {
      toast.error('الرجاء إعداد توقيع أو رفعه أولاً')
      return
    }
    try {
      const blob = await (await fetch(signatureImg)).blob()
      const dataUrl = await blobToDataUrl(blob)
      const p: Placement = {
        id: Math.random().toString(36).slice(2),
        page: activePage,
        x: 50,
        y: 50,
        size: 35,
        dataUrl,
      }
      setPlacements(prev => [...prev, p])
      setSelectedId(p.id)
      toast.success('تم إدراج التوقيع في الصفحة!')
    } catch {
      toast.error('تعذر إدراج التوقيع.')
    }
  }

  const duplicatePlacement = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const target = placements.find(p => p.id === id)
    if (!target) return
    const newP: Placement = {
      ...target,
      id: Math.random().toString(36).slice(2),
      x: Math.min(95, target.x + 4),
      y: Math.min(95, target.y + 4),
    }
    setPlacements(prev => [...prev, newP])
    setSelectedId(newP.id)
    toast.success('تم نسخ التوقيع بنجاح!')
  }

  const removePlacement = (id: string) => {
    setPlacements(prev => prev.filter(p => p.id !== id))
    setSelectedId(cur => (cur === id ? null : cur))
  }

  const saveSignedPdf = async () => {
    if (!pdfData || placements.length === 0) return; setIsProcessing(true)
    try {
      let bytes: Uint8Array
      try {
        bytes = await getProcessBytes(pdfData.file, pdfData.password)
      } catch (e: any) {
        toast.error(e.message || `Failed to unlock "${pdfData.file.name}".`); setIsProcessing(false); return
      }
      const pdfDoc = await PDFDocument.load(bytes, { throwOnInvalidObject: false } as any)
      const embedded = new Map<string, any>()
      const embedFor = async (dataUrl: string) => {
        const hit = embedded.get(dataUrl)
        if (hit) return hit
        const blob = await (await fetch(dataUrl)).blob()
        const sigBytes = await blob.arrayBuffer()
        const sigImage = blob.type === 'image/jpeg' ? await pdfDoc.embedJpg(sigBytes) : await pdfDoc.embedPng(sigBytes)
        embedded.set(dataUrl, sigImage)
        return sigImage
      }
      for (const p of placements) {
        const sigImage = await embedFor(p.dataUrl)
        const page = pdfDoc.getPages()[Math.min(Math.max(p.page, 1), pdfDoc.getPageCount()) - 1]
        const { width, height } = page.getSize()
        const rotRaw = Number((page.getRotation() as any)?.angle ?? 0)
        const rot = ((Math.round(rotRaw) % 360) + 360) % 360
        const xv = p.x / 100, yv = p.y / 100
        let xu = xv, yu = yv
        if (rot === 90) { xu = yv; yu = 1 - xv }
        else if (rot === 180) { xu = 1 - xv; yu = 1 - yv }
        else if (rot === 270) { xu = 1 - yv; yu = xv }
        const visualW = (rot === 90 || rot === 270) ? height : width
        const w = (p.size / 100) * visualW
        const h = w * (sigImage.height / sigImage.width)
        const pdfX = (xu * width) - w / 2
        const pdfY = (height - (yu * height)) - h / 2
        page.drawImage(sigImage, { x: pdfX, y: pdfY, width: w, height: h })
      }
      const pdfBytes = await pdfDoc.save(); const blob = new Blob([pdfBytes as any], { type: 'application/pdf' }); const url = URL.createObjectURL(blob)
      setDownloadUrl(url); addActivity({ name: `${customFileName}.pdf`, tool: 'Signature', size: blob.size, resultUrl: url, buffer: new Uint8Array(await blob.arrayBuffer()) })
    } catch { toast.error('Failed to sign PDF') } finally { setIsProcessing(false) }
  }

  const ActionButton = () => (
    <button onClick={saveSignedPdf} disabled={isProcessing || placements.length === 0} className={`w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-rose-500/20 ${isNative ? 'py-4 rounded-2xl text-sm' : 'p-6 rounded-3xl text-xl'}`}>
      {isProcessing ? <Loader2 className="animate-spin" /> : <>حفظ وتصدير المستند <ArrowRight size={18} /></>}
    </button>
  )

  return (
    <NativeToolLayout title="توقيع المستندات" description="أضف توقيعك واسحبه فوق صفحات PDF بكل سلاسة." actions={pdfData && !pdfData.isLocked && !downloadUrl && <ActionButton />}>
      {cropSrc && <SignatureCropModal imgSrc={cropSrc} onApply={handleCropApplied} onCancel={() => setCropSrc(null)} />}
      
      <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input type="file" accept="image/*" className="hidden" ref={signatureInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (signatureInputRef.current) signatureInputRef.current.value = ''; if (!file) return; if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return } handleImageFileSelect(file) }} />
      
      {!pdfData ? (
        <button 
          onClick={() => !isProcessing && fileInputRef.current?.click()} 
          className="w-full border-4 border-dashed border-gray-100 dark:border-zinc-900 rounded-[2.5rem] p-12 text-center hover:bg-rose-50 transition-all cursor-pointer group"
        >
          <ImageIcon size={32} className="mx-auto mb-4 text-rose-500" />
          <h3 className="text-xl font-bold dark:text-white">اختر مستند PDF</h3>
        </button>
      ) : pdfData.isLocked ? (
        <div className="max-w-md mx-auto relative z-[100]">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-white/5 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={32} /></div>
            <h3 className="text-2xl font-bold mb-2 dark:text-white">ملف محمي بكلمة مرور</h3>
            <input type="password" value={unlockPassword} onChange={(e) => setUnlockPassword(e.target.value)} placeholder="أدخل كلمة المرور..." className="w-full bg-gray-50 dark:bg-black rounded-2xl px-6 py-4 border border-transparent focus:border-rose-500 outline-none font-bold text-center mb-4 dark:text-white" />
            <button onClick={handleUnlock} disabled={!unlockPassword || isProcessing} className="w-full bg-rose-500 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-xs">فك الحماية</button>
          </div>
        </div>
      ) : (
        <div className="space-y-6" onMouseMove={handleMove} onTouchMove={handleMove} onMouseUp={endDrag} onTouchEnd={endDrag}>
          {!downloadUrl ? (
            <>
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 flex items-center gap-6 shadow-sm" dir="rtl">
                <div className="w-12 h-16 bg-gray-50 dark:bg-black rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-rose-500 shadow-inner">{thumbnail ? <img src={thumbnail} className="w-full h-full object-cover" /> : <ImageIcon size={24} />}</div>
                <div className="flex-1 min-w-0 text-right">
                  <h3 className="font-bold text-sm truncate dark:text-white">{pdfData.file.name}</h3>
                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{pdfData.pageCount} صفحة • {(pdfData.file.size / (1024*1024)).toFixed(1)} ميجابايت</p>
                </div>
                <button onClick={() => { setPdfData(null); clearSignature(); }} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><X size={20} /></button>
              </div>

              {/* ✅ تمت إزالة الزر الأحمر الكبير المكرر من هنا */}

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm" dir="rtl">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 px-1">التوقيع الحالي</label>
                {!signatureImg && sigMode === null && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setSigMode('draw')} className="aspect-video bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-900/30 rounded-2xl flex flex-col items-center justify-center gap-2 text-rose-500 hover:bg-rose-100 transition-all"><Pen size={24} /><span className="text-[10px] font-black uppercase tracking-widest">رسم توقيع</span></button>
                      <button onClick={() => signatureInputRef.current?.click()} className="aspect-video bg-rose-50 dark:bg-rose-900/10 border-2 border-rose-100 dark:border-rose-900/30 rounded-2xl flex flex-col items-center justify-center gap-2 text-rose-500 hover:bg-rose-100 transition-all"><ImageIcon size={24} /><span className="text-[10px] font-black uppercase tracking-widest">رفع صورة</span></button>
                    </div>
                  </div>
                )}
                {sigMode === 'draw' && !signatureImg && <SignaturePad inkColor="#000000" onSave={(blob) => { handleCropApplied(blob); setSigMode(null); }} onCancel={() => setSigMode(null)} />}
                {signatureImg && (
                  <div className="relative group">
                    <div className="w-full p-4 bg-white rounded-2xl border-2 border-gray-100 flex items-center justify-center min-h-[100px] shadow-inner overflow-hidden relative">
                      <img src={signatureImg} className="h-20 object-contain" style={{ mixBlendMode: 'multiply' }} alt="Signature preview" />
                    </div>
                    <button onClick={clearSignature} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-lg" aria-label="Remove signature"><Trash2 size={14} /></button>
                  </div>
                )}
                {signatureImg && signatureFile && (
                  <button onClick={saveForReuse} className="mt-3 w-full py-3 bg-gray-100 dark:bg-zinc-800 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 dark:text-zinc-300 hover:text-rose-500 transition-colors">حفظ التوقيع لاستخدامه لاحقاً</button>
                )}
              </div>

              {pdfData.pageCount > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-zinc-900 px-4 py-3 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm" dir="rtl">
                  <button onClick={() => changePage(activePage - 1)} disabled={activePage <= 1} className="p-2 text-gray-400 hover:text-rose-500 disabled:opacity-30 transition-colors" aria-label="Previous page"><ChevronLeft size={20} /></button>
                  <span className="text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400">الصفحة {activePage} من {pdfData.pageCount}</span>
                  <button onClick={() => changePage(activePage + 1)} disabled={activePage >= pdfData.pageCount} className="p-2 text-gray-400 hover:text-rose-500 disabled:opacity-30 transition-colors" aria-label="Next page"><ChevronRight size={20} /></button>
                </div>
              )}

              {signatureImg && (
                <button
                  type="button"
                  onClick={addSignatureToPage}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <Plus size={18} />
                  إدراج التوقيع في الصفحة الحالية ({activePage})
                </button>
              )}

              <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-white/5 overflow-hidden touch-none" ref={previewRef} onClick={handleCanvasClick}>
                {thumbnail ? (
                  <div className="relative w-full">
                    <img ref={thumbImgRef} src={thumbnail} className="w-full h-auto block" alt={`Page ${activePage} preview`} />
                    {placements.filter(p => p.page === activePage).map(p => (
                      <div
                        key={p.id}
                        onMouseDown={(e) => { e.stopPropagation(); dragRef.current = { id: p.id, mode: 'move' }; setSelectedId(p.id) }}
                        onTouchStart={(e) => { e.stopPropagation(); dragRef.current = { id: p.id, mode: 'move' }; setSelectedId(p.id) }}
                        onClick={(e) => { e.stopPropagation(); setSelectedId(p.id) }}
                        style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}%`, transform: 'translate(-50%, -50%)' }}
                        className={`absolute cursor-move rounded-sm ${selectedId === p.id ? 'ring-2 ring-rose-500 bg-rose-500/10' : 'ring-1 ring-transparent hover:ring-black/20'}`}
                      >
                        <img src={p.dataUrl} className="w-full pointer-events-none" style={{ mixBlendMode: 'multiply' }} alt="Signature placement" />
                        
                        {selectedId === p.id && (
                          <>
                            <button 
                              onClick={(e) => duplicatePlacement(p.id, e)} 
                              className="absolute -top-2 -left-2 bg-indigo-600 text-white rounded-full p-1 shadow hover:scale-110 active:scale-95 transition-all z-10" 
                              title="نسخ وتكرار التوقيع"
                            >
                              <Copy size={12} />
                            </button>

                            <div onMouseDown={(e) => { e.stopPropagation(); dragRef.current = { id: p.id, mode: 'resize' } }} onTouchStart={(e) => { e.stopPropagation(); dragRef.current = { id: p.id, mode: 'resize' } }} className="absolute -bottom-2 -right-2 w-6 h-6 bg-rose-500 rounded-full border-2 border-white cursor-nwse-resize z-10" />
                            
                            <button onClick={(e) => { e.stopPropagation(); removePlacement(p.id) }} className="absolute -top-2 -right-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full p-1 shadow hover:scale-110 active:scale-95 transition-all z-10" aria-label="Remove this signature"><X size={12} /></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full min-h-[300px] flex items-center justify-center"><Loader2 className="animate-spin text-rose-500" /></div>
                )}
              </div>

              {placements.length > 0 && (
                <div className="flex items-center justify-between px-1" dir="rtl">
                  <p className="text-[11px] font-bold text-gray-400">عدد التوقيعات المضافة: {placements.length}</p>
                  <button onClick={() => { setPlacements([]); setSelectedId(null) }} className="text-[11px] font-black uppercase text-gray-400 hover:text-rose-500 transition-colors">مسح الجميع</button>
                </div>
              )}

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm" dir="rtl">
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 px-1">اسم الملف عند الحفظ</label>
                <input 
                  type="text" 
                  value={customFileName} 
                  onChange={(e) => setCustomFileName(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-black rounded-xl px-4 py-3 border border-transparent focus:border-rose-500 outline-none font-bold text-sm dark:text-white" 
                />
              </div>
            </>
          ) : (
            <SuccessState message="Signed Successfully!" downloadUrl={downloadUrl} fileName={`${customFileName}.pdf`} onStartOver={() => { setDownloadUrl(null); setPdfData(null); clearSignature(); setSigMode(null); setPlacements([]); setSelectedId(null); }} />
          )}
          <button onClick={() => { setPdfData(null); clearSignature(); setSigMode(null); setPlacements([]); setSelectedId(null); }} className="w-full py-2 text-[10px] font-black uppercase text-gray-300 hover:text-rose-500 transition-colors">إغلاق الملف</button>
        </div>
      )}
    </NativeToolLayout>
  )
}