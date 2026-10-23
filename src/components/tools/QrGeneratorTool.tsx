import React, { useState, useRef } from 'react';
import { QrCode, Download, Link2, Palette, LayoutTemplate, ShieldCheck } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient'; // تأكد من صحة المسار

export default function QrGeneratorTool() {
  const [value, setValue] = useState('https://paperknife.com');
  const [fgColor, setFgColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#18181b');
  const qrRef = useRef<HTMLDivElement>(null);

  const customStyles = `
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob { animation: blob 10s infinite alternate cubic-bezier(0.4, 0, 0.2, 1); }
    .animation-delay-2000 { animation-delay: 2s; }
  `;

  const handleDownload = async () => {
    if (!value.trim()) {
      toast.error('يرجى إدخال الرابط أو النص أولاً! 🎯');
      return;
    }
    
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      // 1. تحميل الصورة للعميل
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `PaperKnife-QR-${Math.floor(Math.random() * 1000)}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success('تم تحميل الباركود بنجاح! 🚀');

      // 2. الحفظ الصامت في Supabase
      try {
        const { error } = await supabase
          .from('qr_data') // سنقوم بإنشاء هذا الجدول
          .insert([
            {
              content: value,
              fg_color: fgColor,
              bg_color: bgColor
            }
          ]);
          
        if (error) console.error("🚨 خطأ صامت في حفظ بيانات QR:", error);
      } catch (dbError) {
        console.error("🚨 تعذر الاتصال بـ Supabase:", dbError);
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden pt-24 pb-12 px-6" dir="rtl">
      <style>{customStyles}</style>

      {/* الخلفية التفاعلية */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* الترويسة */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/10">
              <QrCode size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">صانع الباركود الاحترافي</h1>
              <p className="text-zinc-400 font-medium">قم بتوليد رموز QR سريعة وعالية الدقة للروابط والنصوص.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
             <ShieldCheck size={16} className="text-emerald-400" />
             <span className="text-xs font-bold text-gray-300">آمن ومجاني 100%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* لوحة الإعدادات */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
              <h2 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <LayoutTemplate size={20} className="text-blue-400" /> محتوى وتصميم الباركود
              </h2>
              
              <div className="space-y-8">
                {/* حقل الرابط/النص */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 mb-3">
                    <Link2 size={16} className="text-rose-400" /> الرابط أو النص المراد تحويله
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={value} 
                      onChange={e => setValue(e.target.value)} 
                      placeholder="https://example.com أو اكتب نصاً هنا..." 
                      dir="ltr"
                      className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-blue-500/50 outline-none transition-all text-left shadow-inner font-medium" 
                    />
                  </div>
                </div>

                {/* حقول الألوان */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="bg-zinc-950/50 border border-white/5 p-4 rounded-2xl">
                    <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 mb-3">
                      <Palette size={16} className="text-purple-400" /> لون الباركود (الخطوط)
                    </label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={fgColor} 
                        onChange={e => setFgColor(e.target.value)} 
                        className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0 shadow-sm" 
                      />
                      <span className="text-zinc-300 text-sm font-mono uppercase bg-black/50 px-3 py-1.5 rounded-lg border border-white/10">{fgColor}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-950/50 border border-white/5 p-4 rounded-2xl">
                    <label className="flex items-center gap-2 text-sm font-bold text-zinc-400 mb-3">
                      <Palette size={16} className="text-emerald-400" /> لون الخلفية
                    </label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color" 
                        value={bgColor} 
                        onChange={e => setBgColor(e.target.value)} 
                        className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0 shadow-sm" 
                      />
                      <span className="text-zinc-300 text-sm font-mono uppercase bg-black/50 px-3 py-1.5 rounded-lg border border-white/10">{bgColor}</span>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>

          {/* المعاينة الحية والتحميل */}
          <div className="space-y-6">
            <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl sticky top-24 flex flex-col items-center">
              <h3 className="text-sm font-black text-white mb-8 w-full text-center bg-white/5 py-2 rounded-full border border-white/5">المعاينة الحية</h3>
              
              <div 
                ref={qrRef} 
                className="p-6 bg-white rounded-3xl shadow-[0_10px_50px_rgba(0,0,0,0.5)] mb-8 transition-all duration-500 hover:scale-105 border border-white/10"
                style={{ backgroundColor: bgColor }}
              >
                <QRCodeCanvas 
                  value={value || ' '} 
                  size={220} 
                  fgColor={fgColor} 
                  bgColor={bgColor} 
                  level="H"
                  includeMargin={true}
                />
              </div>

              <button 
                onClick={handleDownload}
                disabled={!value.trim()}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-black transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(37,99,235,0.3)] disabled:opacity-50 hover:scale-[1.02] active:scale-95"
              >
                <Download size={20} /> تحميل بجودة عالية
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}