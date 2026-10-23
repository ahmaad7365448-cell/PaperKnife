import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Mail, Send, Heart, MessageCircle, HelpCircle,
  User, FileText, AlertCircle, CheckCircle2, Loader2,
  ChevronDown, Shield, Zap, Clock, Sparkles, ArrowRight,
  Bug, Lightbulb, Users
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useLanguage } from '../LanguageContext'
import { useAuth } from '../AuthContext'

// 🔑 ضع توكن البوت ومعرّف حسابك هنا مباشرة بين التنصيص:
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '8630630472:AAETqChBCzhMP1fOj9eEkb7PDAygP-amzTg'
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || '1834151868'

const FAQS = {
  ar: [
    { q: 'هل ملفاتي محفوظة على سيرفراتكم؟', a: 'لا، بشكل قاطع. جميع الأدوات تعمل محلياً في متصفحك. ملفاتك لا تترك جهازك أبداً — خصوصيتك كاملة.', icon: Shield },
    { q: 'هل الموقع مجاني؟', a: 'نعم، كل الأدوات مجانية تماماً. لا رسوم خفية، لا اشتراكات.', icon: Heart },
    { q: 'هل يعمل الموقع بدون إنترنت؟', a: 'نعم! بعد فتح الموقع أول مرة، يمكنك استخدام أغلب الأدوات بدون اتصال بالإنترنت.', icon: Zap },
    { q: 'كيف أبلغ عن خطأ أو أقترح أداة جديدة؟', a: 'استخدم النموذج أدناه، نقرأ كل الرسائل ونرد في أسرع وقت.', icon: Bug },
    { q: 'هل تدعمون اللغة العربية بشكل كامل؟', a: 'نعم، الموقع مصمم من الأساس للعربية مع دعم كامل في كل الأدوات.', icon: Users },
    { q: 'كم يستغرق الرد؟', a: 'نحاول الرد خلال 24-48 ساعة. قد يتأخر قليلاً في العطلات.', icon: Clock },
  ],
  en: [
    { q: 'Are my files stored on your servers?', a: 'Absolutely not. All tools run locally in your browser. Your files never leave your device.', icon: Shield },
    { q: 'Is the site free?', a: 'Yes, all tools are completely free. No hidden fees, no subscriptions.', icon: Heart },
    { q: 'Does it work offline?', a: 'Yes! After opening the site once, you can use most tools without an internet connection.', icon: Zap },
    { q: 'How do I report a bug?', a: 'Use the message form below.', icon: Bug },
    { q: 'Do you fully support Arabic?', a: 'Yes, the site is designed for Arabic (RTL) with full support in all tools.', icon: Users },
    { q: 'How long does it take to reply?', a: 'We try to reply within 24-48 hours.', icon: Clock },
  ]
}

function ContactCard({
  icon, title, description, action, accent = 'rose'
}: {
  icon: React.ReactNode
  title: string
  description: string
  action: { label: string; href: string; external?: boolean }
  accent?: 'rose' | 'indigo' | 'emerald'
}) {
  const colors = {
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20', hover: 'hover:border-rose-500/40' },
    indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20', hover: 'hover:border-indigo-500/40' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', hover: 'hover:border-emerald-500/40' },
  }
  const c = colors[accent]

  return (
    <div className={`bg-[#111111]/95 backdrop-blur-2xl rounded-[2rem] border ${c.border} ${c.hover} p-6 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50`}>
      <div className={`w-12 h-12 ${c.bg} ${c.text} rounded-2xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-white font-black text-lg mb-2 tracking-tight">{title}</h3>
      <p className="text-zinc-500 text-xs leading-relaxed mb-4">{description}</p>
      {action.external ? (
        <a
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider ${c.text} hover:underline underline-offset-4`}
        >
          {action.label}
          <ArrowRight size={12} className="rotate-180" />
        </a>
      ) : (
        <a
          href={action.href}
          className={`inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider ${c.text} hover:underline underline-offset-4`}
        >
          {action.label}
          <ArrowRight size={12} className="rotate-180" />
        </a>
      )}
    </div>
  )
}

function FaqItem({ q, a, icon: Icon }: { q: string; a: string; icon: any }) {
  const [open, setOpen] = useState(false)

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-right bg-[#111111]/95 backdrop-blur-2xl border border-rose-500/15 hover:border-rose-500/30 rounded-2xl p-5 transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
          open ? 'bg-rose-500 text-white' : 'bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20'
        }`}>
          <Icon size={18} />
        </div>
        <span className="flex-1 font-bold text-sm text-white">{q}</span>
        <ChevronDown
          size={18}
          className={`text-rose-400 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </div>
      {open && (
        <div className="mt-4 pr-14 text-xs text-zinc-400 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
          {a}
        </div>
      )}
    </button>
  )
}

export default function ContactPage() {
  const navigate = useNavigate()
  const { language, isRTL } = useLanguage()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('general')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email)
  }, [user])

  const texts = {
    ar: {
      badge: 'نحن هنا لمساعدتك',
      title1: 'تواصل',
      title2: 'معنا.',
      subtitle: 'هل لديك سؤال، اقتراح، أو واجهت مشكلة؟ نحن نسمعك.',
      cardEmail: 'البريد الإلكتروني',
      cardEmailDesc: 'للاستفسارات العامة، الشراكات، أو أي سؤال يخص المشروع.',
      cardSupport: 'الدعم',
      cardSupportDesc: 'ادعم استمرارية المشروع وساهم في تطوير أدوات جديدة.',
      supportLabel: 'ادعم PaperKnife',
      formTitle: 'أرسل رسالة',
      formSubtitle: 'سنرد عليك في أقرب وقت ممكن',
      labelName: 'الاسم',
      labelEmail: 'البريد الإلكتروني',
      labelSubject: 'الموضوع',
      labelMessage: 'الرسالة',
      placeholderName: 'اسمك الكريم',
      placeholderEmail: 'name@example.com',
      placeholderMessage: 'اكتب رسالتك هنا بالتفصيل...',
      sendBtn: 'إرسال الرسالة',
      sending: 'جارٍ الإرسال...',
      chars: 'حرف',
      privacy: '🔒 رسالتك تُحفظ بأمان ولن تُشارَك مع أي طرف ثالث.',
      successTitle: 'تم إرسال رسالتك! ✅',
      successDesc: 'شكراً لتواصلك. سنرد عليك في أقرب وقت ممكن.',
      faqTitle: 'أسئلة شائعة',
      faqSubtitle: 'قد تجد إجابتك هنا',
      ctaTitle: 'عندك فكرة أداة جديدة؟',
      ctaDesc: 'نحن نبني PaperKnife بناءً على احتياجاتك. شاركنا فكرتك!',
      ctaBtn: 'اقترح أداة جديدة',
      backBtn: 'العودة للأدوات',
      subjects: [
        { value: 'general', label: 'استفسار عام' },
        { value: 'bug', label: 'الإبلاغ عن خطأ' },
        { value: 'feature', label: 'اقتراح أداة جديدة' },
        { value: 'support', label: 'طلب دعم' },
        { value: 'partnership', label: 'شراكة / تعاون' },
      ],
      errName: 'الاسم مطلوب',
      errEmail: 'البريد الإلكتروني مطلوب',
      errEmailInvalid: 'البريد الإلكتروني غير صحيح',
      errMessage: 'الرسالة مطلوبة',
      errMessageShort: 'الرسالة قصيرة جداً (10 أحرف على الأقل)',
      errFix: 'الرجاء تصحيح الأخطاء في النموذج',
      errSendFail: 'حدث خطأ أثناء الإرسال. حاول مرة أخرى.',
      sentToast: 'تم إرسال رسالتك بنجاح! ✅',
    },
    en: {
      badge: 'We are here to help',
      title1: 'Contact',
      title2: 'us.',
      subtitle: 'Have a question, suggestion, or encountered a problem? We hear you.',
      cardEmail: 'Email',
      cardEmailDesc: 'For general inquiries, partnerships, or any question about the project.',
      cardSupport: 'Support',
      cardSupportDesc: 'Support the project and help develop new free tools.',
      supportLabel: 'Support PaperKnife',
      formTitle: 'Send a message',
      formSubtitle: 'We will reply as soon as possible',
      labelName: 'Name',
      labelEmail: 'Email',
      labelSubject: 'Subject',
      labelMessage: 'Message',
      placeholderName: 'Your name',
      placeholderEmail: 'name@example.com',
      placeholderMessage: 'Write your message here in detail...',
      sendBtn: 'Send message',
      sending: 'Sending...',
      chars: 'chars',
      privacy: '🔒 Your message is stored securely and never shared with third parties.',
      successTitle: 'Message sent! ✅',
      successDesc: 'Thanks for reaching out. We will reply as soon as possible.',
      faqTitle: 'Frequently asked',
      faqSubtitle: 'You may find your answer here',
      ctaTitle: 'Got a new tool idea?',
      ctaDesc: 'We build PaperKnife based on your needs. Share your idea!',
      ctaBtn: 'Suggest a new tool',
      backBtn: 'Back to tools',
      subjects: [
        { value: 'general', label: 'General inquiry' },
        { value: 'bug', label: 'Report a bug' },
        { value: 'feature', label: 'Suggest a feature' },
        { value: 'support', label: 'Request support' },
        { value: 'partnership', label: 'Partnership' },
      ],
      errName: 'Name is required',
      errEmail: 'Email is required',
      errEmailInvalid: 'Invalid email address',
      errMessage: 'Message is required',
      errMessageShort: 'Message is too short (at least 10 chars)',
      errFix: 'Please fix the errors in the form',
      errSendFail: 'An error occurred, please try again',
      sentToast: 'Your message has been sent! ✅',
    }
  }[language]

  const faqs = FAQS[language]

  const validate = () => {
    const err: Record<string, string> = {}
    if (!name.trim()) err.name = texts.errName
    if (!email.trim()) err.email = texts.errEmail
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.email = texts.errEmailInvalid
    if (!message.trim()) err.message = texts.errMessage
    else if (message.trim().length < 10) err.message = texts.errMessageShort
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      toast.error(texts.errFix)
      return
    }

    setSending(true)
    try {
      const subjectLabel = texts.subjects.find(s => s.value === subject)?.label || 'استفسار'

      // 1️⃣ حفظ الرسالة في Supabase
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert([{
          name: name.trim(),
          email: email.trim().toLowerCase(),
          subject: subjectLabel,
          message: message.trim(),
          user_id: user?.id || null,
          status: 'new',
        }])

      if (dbError) console.error('Supabase error:', dbError)

      // 2️⃣ التنسيق المطابق للرسائل القديمة:
      const tgText =
        `📣 *رسالة جديدة من PaperKnife!*\n\n` +
        `📌 *النوع:* ${subjectLabel}\n` +
        `👤 *الاسم:* ${name.trim()}\n` +
        `📧 *البريد:* ${email.trim()}\n\n` +
        `💬 *الرسالة:*\n${message.trim()}`

      // 3️⃣ الإرسال المباشر للتلغرام
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID && !TELEGRAM_BOT_TOKEN.includes('ضع_توكن')) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: tgText,
            parse_mode: 'Markdown'
          })
        }).catch(err => console.error('Telegram send error:', err))
      }

      setSent(true)
      toast.success(texts.sentToast)

      setTimeout(() => {
        setName('')
        setEmail(user?.email || '')
        setSubject('general')
        setMessage('')
        setSent(false)
      }, 4000)
    } catch (err: any) {
      console.error('Contact submit error:', err)
      toast.error(texts.errSendFail)
    } finally {
      setSending(false)
    }
  }

  const clearError = (field: string) => {
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#080808] relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse 60% 50% at 15% 20%, rgba(220,38,38,0.16) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 85% 80%, rgba(244,63,94,0.12) 0%, transparent 55%),
          radial-gradient(ellipse 40% 40% at 85% 15%, rgba(190,24,93,0.1) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 10% 85%, rgba(220,38,38,0.1) 0%, transparent 60%)
        `
      }} />

      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
        `,
        backgroundSize: '70px 70px'
      }} />

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-rose-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6 lg:p-10">

        <section className="text-center pt-8 pb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-rose-500/20">
            <MessageCircle size={13} />
            {texts.badge}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-[1.1] mb-5">
            {texts.title1} <br />
            <span className="text-rose-500">{texts.title2}</span>
          </h1>

          <p className="text-sm text-zinc-500 font-medium max-w-xl mx-auto leading-relaxed">
            {texts.subtitle}
          </p>
        </section>

        {/* 🟢 تم الحذف وتعديل الشبكة لتصبح بكارتين متناسقين */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <ContactCard
            icon={<Mail size={22} />}
            title={texts.cardEmail}
            description={texts.cardEmailDesc}
            action={{ label: 'potatameister@proton.me', href: 'mailto:potatameister@proton.me' }}
            accent="rose"
          />
          <ContactCard
            icon={<Heart size={22} />}
            title={texts.cardSupport}
            description={texts.cardSupportDesc}
            action={{ label: texts.supportLabel, href: '/support' }}
            accent="emerald"
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          <div className="lg:col-span-3 bg-[#111111]/95 backdrop-blur-2xl rounded-[2rem] border border-rose-500/15 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <Send size={20} className="text-rose-400" />
              </div>
              <div className="text-right">
                <h2 className="font-black text-white text-lg tracking-tight">{texts.formTitle}</h2>
                <p className="text-[11px] text-zinc-500 font-medium">{texts.formSubtitle}</p>
              </div>
            </div>

            {sent ? (
              <div className="py-16 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">{texts.successTitle}</h3>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto">{texts.successDesc}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">{texts.labelName}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500"><User size={16} /></span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); clearError('name') }}
                        placeholder={texts.placeholderName}
                        className={`w-full bg-[#1a0a10] border rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all ${
                          errors.name ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-rose-500/20 focus:border-rose-400'
                        }`}
                      />
                    </div>
                    {errors.name && <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold"><AlertCircle size={12} />{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">{texts.labelEmail}</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500"><Mail size={16} /></span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); clearError('email') }}
                        placeholder={texts.placeholderEmail}
                        dir="ltr"
                        className={`w-full bg-[#1a0a10] border rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all text-left ${
                          errors.email ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-rose-500/20 focus:border-rose-400'
                        }`}
                      />
                    </div>
                    {errors.email && <p className="text-[10px] text-rose-400 mt-1.5 flex items-center gap-1 font-bold"><AlertCircle size={12} />{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">{texts.labelSubject}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 pointer-events-none"><FileText size={16} /></span>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-[#1a0a10] border border-rose-500/20 rounded-xl px-4 py-3 pr-11 text-sm text-white focus:outline-none focus:border-rose-400 transition-all cursor-pointer appearance-none"
                    >
                      {texts.subjects.map(s => (
                        <option key={s.value} value={s.value} className="bg-[#1a0a10] text-white">{s.label}</option>
                      ))}
                    </select>
                    <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <ChevronDown size={16} className="text-zinc-500" />
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2">{texts.labelMessage}</label>
                  <textarea
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); clearError('message') }}
                    placeholder={texts.placeholderMessage}
                    rows={6}
                    className={`w-full bg-[#1a0a10] border rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all resize-none ${
                      errors.message ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-rose-500/20 focus:border-rose-400'
                    }`}
                  />
                  <div className="flex items-center justify-between mt-2">
                    {errors.message ? (
                      <p className="text-[10px] text-rose-400 flex items-center gap-1 font-bold"><AlertCircle size={12} />{errors.message}</p>
                    ) : (
                      <span className="text-[10px] text-zinc-600 font-medium">{message.length} {texts.chars}</span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 hover:from-rose-500 hover:via-rose-400 hover:to-rose-300 text-white font-black py-4 rounded-xl shadow-[0_0_25px_rgba(244,63,94,0.5)] hover:shadow-[0_0_40px_rgba(244,63,94,0.8)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer tracking-wider"
                >
                  {sending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{texts.sending}</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>{texts.sendBtn}</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] text-zinc-600 leading-relaxed">
                  {texts.privacy}
                </p>
              </form>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <HelpCircle size={20} className="text-rose-400" />
              </div>
              <div className="text-right">
                <h2 className="font-black text-white text-lg tracking-tight">{texts.faqTitle}</h2>
                <p className="text-[11px] text-zinc-500 font-medium">{texts.faqSubtitle}</p>
              </div>
            </div>
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} icon={faq.icon} />
            ))}
          </div>
        </section>

        <section className="mt-12 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/15 rounded-[2rem] p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-500/20 flex items-center justify-center">
            <Lightbulb size={26} className="text-rose-400" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{texts.ctaTitle}</h3>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto mb-6 leading-relaxed">
            {texts.ctaDesc}
          </p>
          <button
            onClick={() => {
              setSubject('feature')
              setMessage('')
              window.scrollTo({ top: 400, behavior: 'smooth' })
              setTimeout(() => {
                const el = document.querySelector('textarea')
                el?.focus()
              }, 500)
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles size={14} />
            {texts.ctaBtn}
          </button>
        </section>

        <div className="text-center mt-10">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-black text-zinc-500 hover:text-rose-400 uppercase tracking-widest transition-colors cursor-pointer"
          >
            <ArrowRight size={14} className={isRTL ? '' : 'rotate-180'} />
            {texts.backBtn}
          </button>
        </div>

      </div>
    </div>
  )
}