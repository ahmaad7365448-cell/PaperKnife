import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Scale, Shield, FileText, ArrowRight, CheckCircle2, AlertCircle, Lock, HelpCircle } from 'lucide-react'
import { useLanguage } from '../LanguageContext'

export default function TermsPage() {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()

  const texts = {
    ar: {
      badge: 'اتفاقية قانونية',
      title1: 'شروط',
      title2: 'الاستخدام.',
      subtitle: 'يرجى قراءة هذه الشروط بعناية قبل استخدام موقع PaperKnife.',
      lastUpdated: 'آخر تحديث: 17 أكتوبر 2026',
      introTitle: '1. الموافقة على الشروط',
      introDesc: 'باستخدامك لموقع PaperKnife، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى التوقف عن استخدام الموقع فوراً.',
      serviceTitle: '2. وصف الخدمة',
      serviceDesc: 'PaperKnife هو موقع يقدم أدوات مجانية لمعالجة ملفات PDF والصور. جميع العمليات تتم محلياً في متصفحك (Client-Side)، ولا يتم رفع ملفاتك إلى أي سيرفر خارجي.',
      useTitle: '3. الاستخدام المقبول',
      useDesc: 'أنت توافق على استخدام الموقع للأغراض القانونية والمشروعة فقط. يُمنع منعاً باتاً:',
      useList: [
        'استخدام الأدوات لمعالجة ملفات غير قانونية أو تنتهك حقوق الملكية.',
        'محاولة اختراق الموقع أو إحداث ضرر بالخدمة.',
        'استخدام الموقع لأي غرض إرهابي أو غير أخلاقي.'
      ],
      privacyTitle: '4. الخصوصية',
      privacyDesc: 'خصوصيتك هي أولويتنا القصوى. نحن لا نجمع بيانات ملفاتك، ولا نحتفظ بها. يرجى مراجعة سياسة الخصوصية لمزيد من التفاصيل.',
      ipTitle: '5. حقوق الملكية الفكرية',
      ipDesc: 'الموقع والكود المصدري محميان بموجب رخصة AGPL-3.0. يمكنك استخدام الأدوات مجاناً، لكن لا يحق لك إزالة حقوق المؤلف.',
      disclaimerTitle: '6. إخلاء المسؤولية',
      disclaimerDesc: 'يتم تقديم الخدمة "كما هي" دون أي ضمانات. نحن غير مسؤولين عن أي فقدان للبيانات أو أضرار ناتجة عن استخدام الأدوات. يرجى الاحتفاظ بنسخة احتياطية من ملفاتك.',
      backBtn: 'العودة للرئيسية',
      contactBtn: 'لديك سؤال؟ تواصل معنا'
    },
    en: {
      badge: 'Legal Agreement',
      title1: 'Terms',
      title2: 'of Service.',
      subtitle: 'Please read these terms carefully before using PaperKnife.',
      lastUpdated: 'Last updated: October 17, 2026',
      introTitle: '1. Acceptance of Terms',
      introDesc: 'By using PaperKnife, you agree to be bound by these terms. If you do not agree, please stop using the site immediately.',
      serviceTitle: '2. Service Description',
      serviceDesc: 'PaperKnife provides free tools for processing PDFs and images. All processing happens locally in your browser (Client-Side). Your files are never uploaded to any external server.',
      useTitle: '3. Acceptable Use',
      useDesc: 'You agree to use the site for lawful purposes only. You are strictly prohibited from:',
      useList: [
        'Processing illegal files or violating intellectual property rights.',
        'Attempting to hack the site or cause harm to the service.',
        'Using the site for any unethical or terrorist purpose.'
      ],
      privacyTitle: '4. Privacy',
      privacyDesc: 'Your privacy is our top priority. We do not collect or retain your file data. Please review our Privacy Policy for more details.',
      ipTitle: '5. Intellectual Property',
      ipDesc: 'The site and source code are protected under the AGPL-3.0 license. You may use the tools for free, but you may not remove author credits.',
      disclaimerTitle: '6. Disclaimer',
      disclaimerDesc: 'The service is provided "as is" without warranties. We are not liable for any data loss or damage. Please keep backups of your files.',
      backBtn: 'Back to Home',
      contactBtn: 'Have a question? Contact us'
    }
  }[language]

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-rose-500/30 backdrop-blur-md">
            <Scale size={13} />
            {texts.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white mb-4">
            {texts.title1} <span className="text-rose-500">{texts.title2}</span>
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto">{texts.subtitle}</p>
          <p className="text-xs text-zinc-600 mt-4">{texts.lastUpdated}</p>
        </div>

        {/* Content */}
        <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-[2rem] border border-zinc-800 p-8 sm:p-10 space-y-8">
          
          {/* 1. Acceptance */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white">{texts.introTitle}</h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{texts.introDesc}</p>
          </div>

          <div className="h-[1px] w-full bg-zinc-800" />

          {/* 2. Service */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText size={16} className="text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-white">{texts.serviceTitle}</h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{texts.serviceDesc}</p>
          </div>

          <div className="h-[1px] w-full bg-zinc-800" />

          {/* 3. Acceptable Use */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertCircle size={16} className="text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white">{texts.useTitle}</h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed mb-3">{texts.useDesc}</p>
            <ul className="space-y-2">
              {texts.useList.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="text-rose-500 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="h-[1px] w-full bg-zinc-800" />

          {/* 4. Privacy */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Lock size={16} className="text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-white">{texts.privacyTitle}</h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{texts.privacyDesc}</p>
          </div>

          <div className="h-[1px] w-full bg-zinc-800" />

          {/* 5. IP */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Shield size={16} className="text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-white">{texts.ipTitle}</h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{texts.ipDesc}</p>
          </div>

          <div className="h-[1px] w-full bg-zinc-800" />

          {/* 6. Disclaimer */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <HelpCircle size={16} className="text-rose-400" />
              </div>
              <h2 className="text-lg font-bold text-white">{texts.disclaimerTitle}</h2>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">{texts.disclaimerDesc}</p>
          </div>

        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all"
          >
            <ArrowRight size={14} className={isRTL ? '' : 'rotate-180'} />
            {texts.backBtn}
          </button>
          <button
            onClick={() => navigate('/contact')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-wider transition-all"
          >
            {texts.contactBtn}
          </button>
        </div>

      </div>
    </div>
  )
}