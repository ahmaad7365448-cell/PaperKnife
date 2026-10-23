import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, Bug, Star, ArrowRight, Sparkles, Send, ShieldCheck 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

// 🔑 ضع توكن البوت ومعرّف حسابك هنا مباشرة بين التنصيص:
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8630630472:AAETqChBCzhMP1fOj9eEkb7PDAygP-amzTg'
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || '1834151868'

const SupportPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'support' | 'bug'>('support');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const getRatingText = (val: number) => {
    switch(val) {
      case 1: return "سيء جداً 😞";
      case 2: return "مقبول 😐";
      case 3: return "جيد 🙂";
      case 4: return "جيد جداً 😃";
      case 5: return "ممتاز وخارق! 🤩";
      default: return "اختر تقييمك";
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('الرجاء كتابة رسالتك أولاً.');
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading('جارٍ إرسال الرسالة...');

    try {
      const typeLabel = activeTab === 'support' ? 'دعم واقتراح' : 'الإبلاغ عن خطأ';
      const ratingText = activeTab === 'support' && rating > 0 ? `\n⭐ *التقييم:* ${rating} / 5 نجوم` : '';

      // 1️⃣ حفظ الرسالة في Supabase (تم إضافة حقل email لتفادي خطأ NOT NULL)
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert([{
          name: name.trim() || 'زائر',
          email: user?.email || 'support-guest@paperknife.app', // 👈 حل مشكلة الكونسول
          subject: typeLabel,
          message: message.trim(),
          status: 'new'
        }]);

      if (dbError) {
        console.error('Supabase error:', dbError);
      }

      // 2️⃣ التنسيق المطابق للرسائل القديمة
      const tgText =
        `📣 *رسالة جديدة من PaperKnife!*\n\n` +
        `📌 *النوع:* ${typeLabel}\n` +
        `👤 *الاسم:* ${name.trim() || 'مجهول'}` +
        `${ratingText}\n\n` +
        `💬 *الرسالة:*\n${message.trim()}`;

      // 3️⃣ الإرسال المباشر لبوت التلغرام
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID && !TELEGRAM_BOT_TOKEN.includes('ضع_توكن')) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: tgText,
            parse_mode: 'Markdown'
          })
        }).catch(err => console.error('Telegram send error:', err));
      }

      toast.success('تم إرسال رسالتك بنجاح! شكراً لك 💖', { id: loadingToast });
      
      // تفريغ الحقول
      setName('');
      setMessage('');
      setRating(0);

    } catch (err: any) {
      console.error(err);
      toast.error('حدث خطأ أثناء الإرسال. حاول مرة أخرى.', { id: loadingToast });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#050505] text-white font-sans relative overflow-hidden flex flex-col">
      
      {/* 🌟 تأثيرات الإضاءة الخلفية */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-500/20 rounded-full mix-blend-screen filter blur-[120px] opacity-60 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/20 rounded-full mix-blend-screen filter blur-[120px] opacity-60"></div>

      <nav className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-white hover:text-rose-400 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md"
        >
          <ArrowRight className="w-5 h-5" />
          العودة للرئيسية
        </Link>
        <div className="flex items-center gap-2 font-black text-xl">
          PaperKnife
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* التبويبات */}
          <div className="flex p-2 bg-black/40 border-b border-white/5">
            <button
              onClick={() => setActiveTab('support')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-3xl font-black text-sm transition-all duration-300 cursor-pointer ${activeTab === 'support' ? 'bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-400 border border-rose-500/30 shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              <Heart size={18} className={activeTab === 'support' ? 'fill-rose-400' : ''} />
              ادعمنا
            </button>
            <button
              onClick={() => setActiveTab('bug')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-3xl font-black text-sm transition-all duration-300 cursor-pointer ${activeTab === 'bug' ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              <Bug size={18} />
              أبلغ عن خطأ
            </button>
          </div>

          <div className="p-8 md:p-12 space-y-8">
            
            <div className="text-center space-y-3">
              <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center shadow-2xl rotate-3 transition-colors duration-500 ${activeTab === 'support' ? 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/30' : 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/30'}`}>
                {activeTab === 'support' ? <Sparkles size={40} className="text-white" /> : <ShieldCheck size={40} className="text-white" />}
              </div>
              <h1 className="text-3xl md:text-4xl font-black">
                {activeTab === 'support' ? 'دعمك يصنع الفارق' : 'ساعدنا في التطور'}
              </h1>
              <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
                {activeTab === 'support' 
                  ? 'رأيك يهمنا جداً. قم بتقييم تجربتك وشاركنا أفكارك لتطوير أدواتنا.' 
                  : 'واجهت مشكلة؟ صادفت خطأ؟ أخبرنا بالتفاصيل الدقيقة وسنعمل على حلها فوراً.'}
              </p>
            </div>

            {activeTab === 'support' && (
              <div className="bg-black/20 p-6 rounded-3xl border border-white/5 flex flex-col items-center animate-in fade-in duration-500">
                <p className="text-sm font-bold text-gray-300 mb-4">كيف تقيم تجربتك معنا؟</p>
                <div className="flex gap-2" dir="ltr">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                    >
                      <Star 
                        size={36} 
                        className={`transition-colors duration-200 ${
                          star <= (hoverRating || rating) 
                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' 
                            : 'text-gray-600'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                <p className={`mt-3 text-sm font-bold h-6 transition-all ${rating > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                  {getRatingText(hoverRating || rating)}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">الاسم (اختياري)</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="كيف نناديك؟"
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-2 ml-1">
                  {activeTab === 'bug' ? 'تفاصيل المشكلة' : 'رسالتك أو اقتراحك'}
                </label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={activeTab === 'bug' ? 'اشرح لنا الخطأ الذي واجهته وكيف حدث...' : 'شاركنا أفكارك، أو ما الذي أعجبك...'}
                  rows={4}
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all resize-none"
                />
              </div>

              <div className="pt-2">
                <button 
                  onClick={handleSend}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer ${
                    activeTab === 'support' 
                      ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-500/20' 
                      : 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/20'
                  }`}
                >
                  <Send size={18} />
                  {isLoading ? 'جارٍ الإرسال...' : 'إرسال الرسالة الآن'}
                </button>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500 pt-4 border-t border-white/5">
              نحن نقدر وقتك ونسعى دائماً لتقديم الأفضل. شكراً لدعمك! 💖
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;