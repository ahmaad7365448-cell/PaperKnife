import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Scale, Shield, FileText, ArrowRight, CheckCircle2, XCircle, Heart } from 'lucide-react'
import { useLanguage } from '../LanguageContext'

export default function LicensePage() {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()

  const texts = {
    ar: {
      badge: 'معلومات قانونية',
      title1: 'الرخصة',
      title2: 'والاستخدام.',
      subtitle: 'PaperKnife مفتوح المصدر ومجاني للأبد — إليك التفاصيل.',
      licenseName: 'GNU Affero General Public License v3.0',
      licenseShort: 'AGPL-3.0',
      canDo: 'ماذا يمكنك أن تفعل',
      cannotDo: 'ماذا لا يمكنك أن تفعل',
      mustDo: 'ما يجب عليك فعله',
      allowed: [
        'استخدام البرنامج لأي غرض (شخصي، تجاري، تعليمي)',
        'دراسة الكود المصدري وتعديله',
        'توزيع نسخ من البرنامج',
        'تحسين البرنامج ومشاركة تحسيناتك',
      ],
      forbidden: [
        'إزالة اسم المؤلف أو إخفاء المصدر الأصلي',
        'استخدام البرنامج في مشروع مغلق المصدر',
        'بيع البرنامج كما هو دون إضافة قيمة',
      ],
      required: [
        'الإشارة إلى المشروع الأصلي',
        'مشاركة أي تعديلات تحت نفس الرخصة',
        'إتاحة الكود المصدري للمستخدمين',
      ],
      privacyTitle: 'الخصوصية',
      privacyDesc: 'PaperKnife لا يجمع أي بيانات. جميع العمليات تتم محلياً في متصفحك.',
      copyright: 'حقوق النشر',
      copyrightText: 'جميع حقوق PaperKnife محفوظة لصاحبها، مع منح الحقوق المذكورة أعلاه بموجب رخصة AGPL-3.0.',
      backBtn: 'العودة للأدوات',
      contactBtn: 'تواصل معنا',
    },
    en: {
      badge: 'Legal Information',
      title1: 'License',
      title2: '& Usage.',
      subtitle: 'PaperKnife is open source and free forever — here are the details.',
      licenseName: 'GNU Affero General Public License v3.0',
      licenseShort: 'AGPL-3.0',
      canDo: 'What you CAN do',
      cannotDo: 'What you CANNOT do',
      mustDo: 'What you MUST do',
      allowed: [
        'Use for any purpose (personal, commercial, educational)',
        'Study and modify the source code',
        'Distribute copies',
        'Improve and share your improvements',
      ],
      forbidden: [
        'Remove the author\'s name',
        'Use in a closed-source project',
        'Sell as-is without adding value',
      ],
      required: [
        'Credit the original project',
        'Share modifications under the same license',
        'Make source code available',
      ],
      privacyTitle: 'Privacy',
      privacyDesc: 'PaperKnife collects no data. All operations run locally in your browser.',
      copyright: 'Copyright',
      copyrightText: 'All rights to PaperKnife are reserved to its owner, with the rights above granted under AGPL-3.0.',
      backBtn: 'Back to tools',
      contactBtn: 'Contact us',
    }
  }[language]

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-rose-500/30 backdrop-blur-md">
            <Scale size={13} />
            {texts.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white mb-4">
            {texts.title1} <span className="text-rose-500">{texts.title2}</span>
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl mx-auto">{texts.subtitle}</p>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-[2rem] border border-zinc-800 p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center">
              <FileText size={26} className="text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">License</p>
              <h2 className="font-black text-white text-lg">{texts.licenseName}</h2>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300">
                {texts.licenseShort}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-[2rem] border border-emerald-500/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-emerald-400" />
              </div>
              <h3 className="font-black text-white text-sm">{texts.canDo}</h3>
            </div>
            <ul className="space-y-2">
              {texts.allowed.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-[2rem] border border-rose-500/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <XCircle size={20} className="text-rose-400" />
              </div>
              <h3 className="font-black text-white text-sm">{texts.cannotDo}</h3>
            </div>
            <ul className="space-y-2">
              {texts.forbidden.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed">
                  <span className="text-rose-400 mt-0.5">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-[2rem] border border-amber-500/20 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Shield size={20} className="text-amber-400" />
              </div>
              <h3 className="font-black text-white text-sm">{texts.mustDo}</h3>
            </div>
            <ul className="space-y-2">
              {texts.required.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed">
                  <span className="text-amber-400 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-[2rem] border border-zinc-800 p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Shield size={18} className="text-emerald-400" />
            </div>
            <h3 className="font-black text-white">{texts.privacyTitle}</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">{texts.privacyDesc}</p>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-2xl rounded-[2rem] border border-zinc-800 p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <Heart size={18} className="text-rose-400" />
            </div>
            <h3 className="font-black text-white">{texts.copyright}</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">{texts.copyrightText}</p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
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