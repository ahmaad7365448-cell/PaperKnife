import React from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, Shield, Zap, Layers, PenTool, Lock, ArrowLeft, 
  CheckCircle2, Sparkles, Image as ImageIcon, Scissors, 
  FileOutput, FileSearch, Fingerprint, ChevronLeft 
} from 'lucide-react'

export default function LandingPage() {
  
  // دالة التمرير السلس للأقسام (بديل آمن لروابط #)
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // دالة العودة لأعلى الصفحة
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#050505] text-white font-sans selection:bg-rose-500 selection:text-white overflow-hidden relative">
      
      {/* 🌟 تأثيرات الإضاءة الخلفية (Glowing Blobs) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/20 rounded-full mix-blend-screen filter blur-[120px] opacity-70 animate-blob"></div>
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full mix-blend-screen filter blur-[120px] opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full mix-blend-screen filter blur-[120px] opacity-70 animate-blob animation-delay-4000"></div>

      {/* 🟢 شريط التنقل العلوي (Glassmorphism) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={scrollToTop}>
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/30">
              <FileText size={22} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              PaperKnife
            </span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-bold text-gray-400">
            {/* استخدام أزرار بدلاً من الروابط لتجنب مشكلة الـ HashRouter */}
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors duration-300">المميزات الخارقة</button>
            <button onClick={() => scrollToSection('security')} className="hover:text-white transition-colors duration-300">الخصوصية المطلقة</button>
            <button onClick={() => scrollToSection('how')} className="hover:text-white transition-colors duration-300">كيف يعمل؟</button>
          </div>

          <Link to="/tools" className="bg-white text-black px-6 py-2.5 rounded-full font-black text-sm hover:bg-gray-200 hover:scale-105 transition-all duration-300 flex items-center gap-2">
            جرب الأدوات مجاناً <ArrowLeft size={16} />
          </Link>
        </div>
      </nav>

      {/* 🚀 القسم الترحيبي (Hero Section) */}
      <section className="pt-44 pb-32 px-6 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-bold text-gray-300 mb-8 backdrop-blur-md animate-float">
            <Sparkles size={16} className="text-rose-400" />
            الإصدار الجديد 2.0 — أسرع بنسبة 300%
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] mb-8 tracking-tight">
            أدوات PDF <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-400 to-rose-500">لا مثيل لها</span> <br />
            بين يديك.
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
            تجربة سلسة وخارقة لدمج، تقسيم، ضغط، وتوقيع ملفاتك. 
            <br className="hidden md:block" />
            <span className="text-white font-bold">بدون رفع ملفات، بدون انتظار، وبدون تعقيد.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link to="/tools" className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all duration-300 active:scale-95 shadow-[0_0_40px_-10px_rgba(225,29,72,0.5)] flex items-center justify-center gap-3 group">
              ابدأ العمل الآن
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <button onClick={() => scrollToSection('features')} className="w-full sm:w-auto bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 text-center flex items-center justify-center gap-2">
              استكشف المميزات
            </button>
          </div>

          {/* شريط الثقة السريع */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-x-8 gap-y-4 text-sm font-bold text-gray-500">
            <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-rose-500" /> معالجة محلية 100%</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-rose-500" /> لا حاجة للتسجيل</div>
            <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-rose-500" /> مجاني بالكامل</div>
          </div>
        </div>
      </section>

      {/* ✨ قسم المميزات (Bento Grid) */}
      <section id="features" className="py-24 px-6 relative z-10 border-t border-white/5 bg-[#070707]/50 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black mb-6">قوة خارقة في <span className="text-rose-500">تصميم أنيق</span></h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">كل ما تحتاجه لإدارة مستنداتك، تم بناؤه بعناية فائقة ليقدم لك أفضل تجربة ممكنة.</p>
          </div>

          {/* شبكة Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* البطاقة الكبيرة 1 */}
            <div className="md:col-span-2 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-10 rounded-[2.5rem] hover:border-rose-500/50 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full filter blur-[80px] group-hover:bg-rose-500/20 transition-all duration-500"></div>
              <Layers size={40} className="text-rose-500 mb-8 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-3xl font-black mb-4">دمج وتقسيم الملفات بذكاء</h3>
              <p className="text-gray-400 text-lg leading-relaxed max-w-lg">تعامل مع مستنداتك كالمحترفين. ادمج مئات الصفحات في ملف واحد، أو استخرج الصفحات التي تريدها بدقة متناهية.</p>
            </div>

            {/* البطاقة الصغيرة 1 */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-10 rounded-[2.5rem] hover:border-emerald-500/50 transition-all duration-500 group">
              <Zap size={40} className="text-emerald-400 mb-8 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-2xl font-black mb-4">ضغط فوري</h3>
              <p className="text-gray-400 leading-relaxed">قلل حجم ملفاتك بنسبة تصل إلى 80% دون فقدان الجودة.</p>
            </div>

            {/* البطاقة الصغيرة 2 */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-10 rounded-[2.5rem] hover:border-blue-500/50 transition-all duration-500 group">
              <Shield size={40} className="text-blue-400 mb-8 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-2xl font-black mb-4">حماية وتشفير</h3>
              <p className="text-gray-400 leading-relaxed">أضف كلمات مرور قوية لملفاتك، أو أزل الحماية عنها في ثوانٍ.</p>
            </div>

            {/* البطاقة الكبيرة 2 */}
            <div className="md:col-span-2 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-10 rounded-[2.5rem] hover:border-amber-500/50 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full filter blur-[80px] group-hover:bg-amber-500/20 transition-all duration-500"></div>
              <PenTool size={40} className="text-amber-400 mb-8 group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-3xl font-black mb-4">توقيع إلكتروني احترافي</h3>
              <p className="text-gray-400 text-lg leading-relaxed max-w-lg">ارسم توقيعك أو ارفع صورته، وضعه في المكان المناسب على الصفحة بدقة تامة.</p>
            </div>
          </div>

          {/* صف ثاني من المميزات المصغرة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { icon: ImageIcon, name: "تحويل الصور", color: "text-purple-400" },
              { icon: Scissors, name: "استخراج الصفحات", color: "text-cyan-400" },
              { icon: FileOutput, name: "تحويل Word", color: "text-blue-400" },
              { icon: FileSearch, name: "استخراج النص", color: "text-orange-400" }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center text-center hover:bg-white/10 transition-all duration-300">
                <item.icon size={28} className={`${item.color} mb-4`} />
                <span className="font-bold text-sm text-gray-300">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🔒 قسم الخصوصية والأمان */}
      <section id="security" className="py-32 px-6 relative z-10">
        <div className="max-w-5xl mx-auto bg-gradient-to-br from-rose-500/10 via-[#0a0a0a] to-[#0a0a0a] border border-rose-500/30 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-rose-500/10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/20 rounded-full filter blur-[100px]"></div>
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-rose-500/40 rotate-3 animate-float">
              <Fingerprint size={48} className="text-white" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">أمانك ليس خياراً.. <br /> بل هو أساس بنائنا.</h2>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
              نحن نستخدم أحدث تقنيات الويب لمعالجة ملفاتك <span className="text-white font-bold">داخل متصفحك مباشرة</span>. هذا يعني أن ملفاتك لا ترفع إلى أي سيرفر، ولا يمكن لأي شخص آخر رؤيتها.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-bold text-gray-300">
              <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10"><Lock size={18} className="text-rose-500" /> تشفير محلي</div>
              <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10"><Shield size={18} className="text-rose-500" /> خصوصية مطلقة</div>
            </div>
          </div>
        </div>
      </section>

      {/* 🛠️ دعوة للعمل (CTA) */}
      <section id="how" className="py-24 px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black mb-8">جاهز لتجربة <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500">المستقبل؟</span></h2>
          <p className="text-2xl text-gray-400 mb-12">لا حاجة لبطاقة ائتمان. لا حاجة للتسجيل. فقط اختر أداتك وابدأ.</p>
          <Link to="/tools" className="inline-flex items-center gap-4 bg-white text-black px-12 py-6 rounded-3xl font-black text-xl transition-all duration-300 hover:scale-105 shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)]">
            تصفح جميع الأدوات <ChevronLeft size={24} />
          </Link>
        </div>
      </section>

      {/* 📝 التذييل */}
      <footer className="border-t border-white/10 py-12 text-center text-gray-500 text-sm relative z-10 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 font-black text-lg text-white">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            PaperKnife
          </div>
          <p className="font-medium">© {new Date().getFullYear()} PaperKnife. جميع الحقوق محفوظة.</p>
          <div className="flex gap-8 font-bold">
            <button onClick={() => scrollToSection('security')} className="hover:text-white transition-colors">سياسة الخصوصية</button>
            <button onClick={() => scrollToSection('how')} className="hover:text-white transition-colors">شروط الاستخدام</button>
          </div>
        </div>
      </footer>
    </div>
  )
}