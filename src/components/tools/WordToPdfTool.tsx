import { useState, useRef } from 'react'
import { FileType2, Upload, Loader2, FileText, ArrowLeftRight, Printer } from 'lucide-react'
import { toast } from 'sonner'

type Mode = 'word-to-pdf' | 'pdf-to-word'

const isArabicText = (text: string) => /[\u0600-\u06FF]/.test(text)

export default function WordToPdfTool() {
  const [mode, setMode] = useState<Mode>('word-to-pdf')
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ===== Word → PDF (عبر طباعة المتصفح - الأقوى للعربية) =====
  const handleWordToPdf = async (file: File) => {
    try {
      setLoading(true)
      const mammothModule = await import('mammoth')
      const mammoth = mammothModule.default || mammothModule

      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      const html = result.value

      if (!html || html.trim() === '') {
        toast.error('الملف فارغ أو لا يحتوي على نص')
        return
      }

      // 🎯 فتح نافذة جديدة بالكامل
      const printWindow = window.open('', '_blank', 'width=900,height=700')
      if (!printWindow) {
        toast.error('الرجاء السماح بالنوافذ المنبثقة في المتصفح')
        return
      }

      // 🎯 كتابة مستند HTML كامل للنافذة الجديدة
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <title>${file.name.replace(/\.docx?$/i, '')}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Arial', 'Tahoma', 'Segoe UI', sans-serif;
                direction: rtl;
                text-align: right;
                color: #000000;
                background: #ffffff;
                padding: 40px;
                line-height: 1.8;
                font-size: 14px;
              }
              h1, h2, h3, h4, h5, h6 {
                margin: 16px 0 8px;
                font-weight: bold;
                page-break-after: avoid;
              }
              h1 { font-size: 24px; }
              h2 { font-size: 20px; }
              h3 { font-size: 16px; }
              p {
                margin: 8px 0;
                page-break-inside: avoid;
              }
              ul, ol {
                padding-right: 30px;
                padding-left: 0;
                margin: 10px 0;
              }
              li {
                margin: 4px 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 12px 0;
                page-break-inside: avoid;
              }
              td, th {
                border: 1px solid #ccc;
                padding: 8px;
                text-align: right;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              strong, b { font-weight: bold; }
              em, i { font-style: italic; }
              @media print {
                body { padding: 20px; }
                @page { margin: 15mm; }
              }
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `)

      printWindow.document.close()

      // 🎯 منح المتصفح وقتاً قصيراً لرسم المحتوى ثم إظهار حوار الطباعة تلقائياً
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
      }, 800)

      toast.success('تم فتح نافذة الطباعة — اختر "حفظ كـ PDF" 🖨️')
    } catch (error) {
      console.error('Word → PDF error:', error)
      toast.error('فشل في تحويل الملف')
    } finally {
      setLoading(false)
    }
  }

  // ===== PDF → Word =====
  const handlePdfToWord = async (file: File) => {
    try {
      setLoading(true)

      const pdfjs = await import('pdfjs-dist')
      const docxLib = await import('docx')

      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

      const allParagraphs: any[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()

        type TextItem = { str: string; x: number; y: number; fontName: string }
        const items: TextItem[] = (content.items as any[])
          .filter((item) => 'str' in item && item.str.trim() !== '')
          .map((item) => ({
            str: item.str,
            x: item.transform[4],
            y: item.transform[5],
            fontName: item.fontName || '',
          }))

        items.sort((a, b) => b.y - a.y || a.x - b.x)

        const lines: TextItem[][] = []
        let currentLine: TextItem[] = []
        let lastY = -Infinity
        const Y_TOLERANCE = 5

        for (const item of items) {
          if (Math.abs(item.y - lastY) < Y_TOLERANCE && currentLine.length > 0) {
            currentLine.push(item)
          } else {
            if (currentLine.length > 0) lines.push(currentLine)
            currentLine = [item]
            lastY = item.y
          }
        }
        if (currentLine.length > 0) lines.push(currentLine)

        const paragraphs: string[] = []
        let currentPara = ''
        let prevY = -Infinity
        const PARA_GAP = 20

        for (const line of lines) {
          const lineText = line
            .sort((a, b) => a.x - b.x)
            .map((item) => item.str)
            .join(' ')
            .trim()

          if (!lineText) continue

          const lineY = line[0].y
          if (prevY !== -Infinity && Math.abs(lineY - prevY) > PARA_GAP) {
            if (currentPara.trim()) paragraphs.push(currentPara.trim())
            currentPara = lineText
          } else {
            currentPara += (currentPara ? ' ' : '') + lineText
          }
          prevY = lineY
        }
        if (currentPara.trim()) paragraphs.push(currentPara.trim())

        for (const paraText of paragraphs) {
          if (!paraText) continue
          const hasArabic = isArabicText(paraText)

          allParagraphs.push(
            new docxLib.Paragraph({
              bidirectional: hasArabic,
              alignment: hasArabic ? docxLib.AlignmentType.RIGHT : docxLib.AlignmentType.LEFT,
              spacing: { after: 200, line: 360 },
              children: [
                new docxLib.TextRun({
                  text: paraText,
                  size: 24,
                  font: hasArabic ? 'Arial' : 'Calibri',
                  rightToLeft: hasArabic,
                }),
              ],
            })
          )
        }

        if (i < pdf.numPages) {
          allParagraphs.push(
            new docxLib.Paragraph({
              children: [new docxLib.PageBreak()],
            })
          )
        }
      }

      const doc = new docxLib.Document({
        creator: 'PaperKnife',
        title: file.name.replace(/\.pdf$/i, ''),
        sections: [
          {
            properties: {
              page: {
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
              },
            },
            children: allParagraphs.length > 0
              ? allParagraphs
              : [
                  new docxLib.Paragraph({
                    children: [
                      new docxLib.TextRun({
                        text: '⚠️ لم يتم العثور على نص قابل للاستخراج.',
                        size: 24,
                        italics: true,
                        color: '888888',
                      }),
                    ],
                  }),
                ],
          },
        ],
      })

      const blob = await docxLib.Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name.replace(/\.pdf$/i, '.docx')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('تم التحويل إلى Word بنجاح! 🎉')
    } catch (error) {
      console.error('PDF → Word error:', error)
      toast.error('فشل في تحويل الملف')
    } finally {
      setLoading(false)
    }
  }

  const handleFile = (file: File) => {
    setFileName(file.name)
    if (mode === 'word-to-pdf') {
      if (!file.name.match(/\.docx?$/i)) {
        toast.error('الرجاء اختيار ملف Word (.doc أو .docx)')
        return
      }
      handleWordToPdf(file)
    } else {
      if (!file.type.includes('pdf')) {
        toast.error('الرجاء اختيار ملف PDF')
        return
      }
      handlePdfToWord(file)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-3xl mb-4 shadow-lg shadow-blue-500/30">
            <FileType2 size={32} />
          </div>
          <h1 className="text-3xl font-black dark:text-white mb-2">تحويل Word ↔️ PDF</h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">حوّل مستنداتك بسهولة بين Word و PDF</p>
        </div>

        <div className="flex bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-gray-100 dark:border-zinc-800 mb-6 shadow-sm">
          <button
            onClick={() => setMode('word-to-pdf')}
            disabled={loading}
            className={`flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
              mode === 'word-to-pdf' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-gray-500'
            }`}
          >
            <FileText size={18} /> Word → PDF
          </button>
          <button
            onClick={() => setMode('pdf-to-word')}
            disabled={loading}
            className={`flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
              mode === 'pdf-to-word' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-gray-500'
            }`}
          >
            <ArrowLeftRight size={18} /> PDF → Word
          </button>
        </div>

        <div
          onClick={() => !loading && fileInputRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }}
          onDragOver={(e) => e.preventDefault()}
          className="border-4 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2rem] p-12 sm:p-16 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
              <p className="font-bold dark:text-white">جاري المعالجة...</p>
              <p className="text-xs text-gray-500 mt-1">{fileName}</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload size={32} />
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-2">
                {mode === 'word-to-pdf' ? 'ارفع ملف Word (.docx)' : 'ارفع ملف PDF'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                {mode === 'word-to-pdf' ? 'DOCX • DOC' : 'PDF'}
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={mode === 'word-to-pdf' ? '.doc,.docx' : '.pdf'}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
          <div className="flex items-start gap-3">
            {mode === 'word-to-pdf' ? (
              <Printer size={16} className="text-blue-500 shrink-0 mt-0.5" />
            ) : (
              <FileType2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
            )}
            <div className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
              {mode === 'word-to-pdf' ? (
                <p>📄 <strong>خطوات التحويل:</strong> افتح الملف → اضغط "حفظ كـ PDF" في نافذة الطباعة → احفظ الملف. يدعم العربية بشكل مثالي.</p>
              ) : (
                <p>📝 يستخرج النص من PDF ويحوله لملف Word (.docx) حقيقي.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}