import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import ToolHeader from './ToolHeader'
import AndroidHeader from '../../AndroidHeader'

// 🎨 دالة ذكية لاختيار الصورة المناسبة بناءً على كلمات مفتاحية في اسم الأداة
const getBgImage = (title: string) => {
  const t = title.toLowerCase();
  
  if (t.includes('compress') || t.includes('ضغط')) return 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2000&auto=format&fit=crop'; // ضغط
  if (t.includes('split') || t.includes('تقسيم')) return 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=2000&auto=format&fit=crop'; // تقسيم
  if (t.includes('merge') || t.includes('دمج')) return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2000&auto=format&fit=crop'; // دمج
  if (t.includes('rotate') || t.includes('تدوير')) return 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2000&auto=format&fit=crop'; // تدوير
  if (t.includes('unlock') || t.includes('إزالة حماية')) return 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2000&auto=format&fit=crop'; // فك حماية
  if (t.includes('protect') || t.includes('حماية')) return 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2000&auto=format&fit=crop'; // حماية
  if (t.includes('signature') || t.includes('توقيع')) return 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?q=80&w=2000&auto=format&fit=crop'; // توقيع
  if (t.includes('watermark') || t.includes('علامة')) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop'; // علامة مائية
  if (t.includes('organize') || t.includes('ترتيب')) return 'https://images.unsplash.com/photo-1507925922873-475d624e42e9?q=80&w=2000&auto=format&fit=crop'; // ترتيب
  if (t.includes('word') || t.includes('وورد')) return 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2000&auto=format&fit=crop'; // تحويل Word
  if (t.includes('image') || t.includes('صورة')) return 'https://images.unsplash.com/photo-1554147090-e1221a04a025?q=80&w=2000&auto=format&fit=crop'; // تحويل الصور
  if (t.includes('text') || t.includes('نص')) return 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=2000&auto=format&fit=crop'; // استخراج النص
  if (t.includes('cv') || t.includes('سيرة')) return 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2000&auto=format&fit=crop'; // السيرة الذاتية
  if (t.includes('background') || t.includes('خلفية')) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop'; // إزالة الخلفية
  
  // الخلفية الافتراضية لأي أداة أخرى
  return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop';
}

interface NativeToolLayoutProps {
  title: string
  description: string
  children: React.ReactNode
  actions?: React.ReactNode
  onBack?: () => void
  hideNativeHeader?: boolean
}

export const NativeToolLayout = ({
  title,
  description,
  children,
  actions,
  onBack,
  hideNativeHeader
}: NativeToolLayoutProps) => {
  const navigate = useNavigate()
  
  const isNative = Capacitor.isNativePlatform()
  const isAndroidView = isNative || document.body.classList.contains('android-mode') || window.location.pathname.includes('android')
  const showNativeHeader = isAndroidView

  // 🔍 استدعاء الدالة الذكية للحصول على الصورة المناسبة
  const bgImage = getBgImage(title)

  return (
    <div className="themed-page flex flex-col min-h-screen transition-colors" style={{ backgroundImage: `url('${bgImage}')` }}>
      
      {showNativeHeader && !hideNativeHeader && (
        <AndroidHeader title={title} onBack={onBack || (() => navigate(-1))} />
      )}

      <main className={`flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full relative z-10 ${actions ? 'pb-32 md:pb-8' : ''}`}>
        <div className={`${showNativeHeader || hideNativeHeader ? 'hidden md:block' : 'block'} mb-8`}>
           <ToolHeader title={title} description={description} />
        </div>

        <div className="flex-1">
          {children}
        </div>
      </main>

      {actions && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 z-40 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           <div className="p-4 max-w-md mx-auto">
             {actions}
           </div>
        </div>
      )}
    </div>
  )
}