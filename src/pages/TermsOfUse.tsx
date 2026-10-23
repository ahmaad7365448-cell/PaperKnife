import React from 'react';
import { Link } from 'react-router-dom'; // أو أي مكتبة تستخدمها
import { ArrowRight, FileText } from 'lucide-react'; // إذا كنت تستخدم أيقونات Lucide

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-[#0f0f11] text-gray-300 font-sans dir-rtl" dir="rtl">
      {/* شريط علوي للعودة */}
      <div className="sticky top-0 z-50 bg-[#0f0f11]/80 backdrop-blur-md border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center">
          <Link 
            to="/" 
            className="flex items-center text-white hover:text-rose-400 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            العودة للرئيسية
          </Link>
        </div>
      </div>

      {/* محتوى الصفحة */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-rose-500/20 text-rose-500 rounded-2xl">
            <FileText className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">شروط الاستخدام</h1>
        </div>

        <p className="text-sm text-gray-400 mb-8">آخر تحديث: أكتوبر 2026</p>

        <div className="space-y-8 text-lg leading-relaxed text-gray-300">
          {/* القسم الأول */}
          <section className="bg-[#1a1a1d] p-6 rounded-2xl border border-white/5 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4 text-rose-400">1. مقدمة وقبول الشروط</h2>
            <p>
              مرحباً بك في <strong>PaperKnife</strong>. باستخدامك لهذا الموقع، فإنك توافق على الالتزام بهذه الشروط والأحكام. 
              إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام الموقع أو أدواته.
            </p>
          </section>

          {/* القسم الثاني */}
          <section className="bg-[#1a1a1d] p-6 rounded-2xl border border-white/5 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4 text-rose-400">2. استخدام الأدوات والخدمات</h2>
            <p>
              يوفر موقع PaperKnife مجموعة من الأدوات الذكية (مثل أدوات الكتابة، تحويل الملفات، وغيرها). 
              أنت توافق على استخدام هذه الأدوات للأغراض المشروعة فقط، ويُمنع منعاً باتاً استخدامها في:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-gray-400">
              <li>انتهاك حقوق الملكية الفكرية للآخرين.</li>
              <li>نشر أو إنشاء محتوى ضار أو غير قانوني.</li>
              <li>محاولة اختراق الموقع أو إلحاق الضرر بخوادمه.</li>
            </ul>
          </section>

          {/* القسم الثالث */}
          <section className="bg-[#1a1a1d] p-6 rounded-2xl border border-white/5 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4 text-rose-400">3. الخصوصية وحماية البيانات</h2>
            <p>
              نحن نأخذ خصوصيتك على محمل الجد. يتم تشفير بياناتك ومعالجتها وفقاً لسياسة الخصوصية الخاصة بنا. 
              نحن لا نبيع بياناتك الشخصية لأطراف ثالثة، ونستخدمها فقط لتحسين تجربتك داخل الموقع.
            </p>
          </section>

          {/* القسم الرابع */}
          <section className="bg-[#1a1a1d] p-6 rounded-2xl border border-white/5 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4 text-rose-400">4. التعديلات على الشروط</h2>
            <p>
              نحتفظ بالحق في تحديث أو تعديل هذه الشروط في أي وقت. سيتم نشر التغييرات على هذه الصفحة، 
              واستمرارك في استخدام الموقع بعد نشر التعديلات يعني موافقتك الصريحة عليها.
            </p>
          </section>
        </div>

        {/* تذييل الصفحة */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
          <p>جميع الحقوق محفوظة © PaperKnife 2026</p>
          <p className="mt-2">إذا كان لديك أي استفسار، يمكنك التواصل معنا عبر البريد الإلكتروني.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;