import { useState, useRef } from 'react'
import { UserCircle, Download, Plus, Trash2, Mail, Phone, MapPin, Briefcase, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'

interface Experience { id: string; title: string; company: string; period: string; desc: string }
interface Education { id: string; degree: string; school: string; period: string }

export default function CvMakerTool() {
  const [name, setName] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [summary, setSummary] = useState('')
  const [skills, setSkills] = useState('')
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [educations, setEducations] = useState<Education[]>([])
  const printRef = useRef<HTMLDivElement>(null)

  const addExperience = () => {
    setExperiences([...experiences, { id: Date.now().toString(), title: '', company: '', period: '', desc: '' }])
  }
  const addEducation = () => {
    setEducations([...educations, { id: Date.now().toString(), degree: '', school: '', period: '' }])
  }
  const updateExp = (id: string, field: keyof Experience, value: string) => {
    setExperiences(experiences.map(e => e.id === id ? { ...e, [field]: value } : e))
  }
  const updateEdu = (id: string, field: keyof Education, value: string) => {
    setEducations(educations.map(e => e.id === id ? { ...e, [field]: value } : e))
  }
  const removeExp = (id: string) => setExperiences(experiences.filter(e => e.id !== id))
  const removeEdu = (id: string) => setEducations(educations.filter(e => e.id !== id))

  const downloadPdf = async () => {
    if (!printRef.current) return
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: '#ffffff' })
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight)
      } else {
        let heightLeft = imgHeight
        let position = 0
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pdfHeight
        while (heightLeft > 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
          heightLeft -= pdfHeight
        }
      }

      pdf.save(`CV-${name || 'resume'}.pdf`)
      toast.success('تم تحميل السيرة الذاتية! 🎉')
    } catch (e) {
      console.error(e)
      toast.error('فشل في توليد PDF')
    }
  }

  const inputClass = "w-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:text-white"

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 text-white rounded-3xl mb-4 shadow-lg shadow-emerald-500/30">
            <UserCircle size={32} />
          </div>
          <h1 className="text-3xl font-black dark:text-white mb-2">صانع السيرة الذاتية</h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">أنشئ CV احترافي بالعربي جاهز للطباعة</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* النموذج */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 space-y-4">
              <h3 className="font-black dark:text-white flex items-center gap-2"><UserCircle size={18} className="text-emerald-500" /> المعلومات الشخصية</h3>
              <input className={inputClass} placeholder="الاسم الكامل" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={inputClass} placeholder="المسمى الوظيفي (مثال: مهندس برمجيات)" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              <input className={inputClass} placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={inputClass} placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input className={inputClass} placeholder="العنوان (المدينة، الدولة)" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 space-y-4">
              <h3 className="font-black dark:text-white">نبذة عنك</h3>
              <textarea className={inputClass} rows={3} placeholder="اكتب نبذة قصيرة عن خبراتك وأهدافك" value={summary} onChange={(e) => setSummary(e.target.value)} />
              <input className={inputClass} placeholder="المهارات (افصل بينها بفاصلة)" value={skills} onChange={(e) => setSkills(e.target.value)} />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black dark:text-white flex items-center gap-2"><Briefcase size={18} className="text-emerald-500" /> الخبرات</h3>
                <button onClick={addExperience} className="text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 p-2 rounded-xl transition"><Plus size={20} /></button>
              </div>
              {experiences.map(exp => (
                <div key={exp.id} className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 space-y-2 relative">
                  <button onClick={() => removeExp(exp.id)} className="absolute top-3 left-3 text-rose-500 hover:text-rose-600"><Trash2 size={16} /></button>
                  <input className={inputClass} placeholder="المسمى الوظيفي" value={exp.title} onChange={(e) => updateExp(exp.id, 'title', e.target.value)} />
                  <input className={inputClass} placeholder="الشركة" value={exp.company} onChange={(e) => updateExp(exp.id, 'company', e.target.value)} />
                  <input className={inputClass} placeholder="الفترة (مثال: 2022 - 2024)" value={exp.period} onChange={(e) => updateExp(exp.id, 'period', e.target.value)} />
                  <textarea className={inputClass} rows={2} placeholder="وصف المهام" value={exp.desc} onChange={(e) => updateExp(exp.id, 'desc', e.target.value)} />
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-gray-100 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black dark:text-white flex items-center gap-2"><GraduationCap size={18} className="text-emerald-500" /> التعليم</h3>
                <button onClick={addEducation} className="text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 p-2 rounded-xl transition"><Plus size={20} /></button>
              </div>
              {educations.map(edu => (
                <div key={edu.id} className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 space-y-2 relative">
                  <button onClick={() => removeEdu(edu.id)} className="absolute top-3 left-3 text-rose-500 hover:text-rose-600"><Trash2 size={16} /></button>
                  <input className={inputClass} placeholder="الشهادة" value={edu.degree} onChange={(e) => updateEdu(edu.id, 'degree', e.target.value)} />
                  <input className={inputClass} placeholder="الجامعة/المعهد" value={edu.school} onChange={(e) => updateEdu(edu.id, 'school', e.target.value)} />
                  <input className={inputClass} placeholder="الفترة" value={edu.period} onChange={(e) => updateEdu(edu.id, 'period', e.target.value)} />
                </div>
              ))}
            </div>

            <button onClick={downloadPdf} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-4 rounded-2xl hover:shadow-lg hover:shadow-emerald-500/30 transition flex items-center justify-center gap-2">
              <Download size={20} /> تحميل السيرة الذاتية PDF
            </button>
          </div>

          {/* المعاينة */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div ref={printRef} dir="rtl" className="bg-white text-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-100" style={{ fontFamily: 'Arial, sans-serif' }}>
              <div className="border-b-4 border-emerald-500 pb-4 mb-4">
                <h1 className="text-3xl font-black mb-1">{name || 'اسمك الكامل'}</h1>
                <p className="text-emerald-600 font-bold text-lg">{jobTitle || 'المسمى الوظيفي'}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-4">
                {email && <span className="flex items-center gap-1"><Mail size={12} /> {email}</span>}
                {phone && <span className="flex items-center gap-1"><Phone size={12} /> {phone}</span>}
                {address && <span className="flex items-center gap-1"><MapPin size={12} /> {address}</span>}
              </div>
              {summary && (
                <div className="mb-4">
                  <h2 className="text-sm font-black text-emerald-600 mb-2 uppercase tracking-wider">نبذة</h2>
                  <p className="text-xs leading-relaxed text-gray-700">{summary}</p>
                </div>
              )}
              {skills && (
                <div className="mb-4">
                  <h2 className="text-sm font-black text-emerald-600 mb-2 uppercase tracking-wider">المهارات</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.split(',').map((s, i) => s.trim() && (
                      <span key={i} className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold">{s.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
              {experiences.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-sm font-black text-emerald-600 mb-2 uppercase tracking-wider flex items-center gap-1"><Briefcase size={12} /> الخبرات</h2>
                  <div className="space-y-3">
                    {experiences.map(exp => (
                      <div key={exp.id} className="border-r-2 border-emerald-200 pr-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-black text-sm">{exp.title || 'المسمى'}</h3>
                          <span className="text-xs text-gray-500">{exp.period}</span>
                        </div>
                        <p className="text-xs text-emerald-700 font-bold">{exp.company}</p>
                        {exp.desc && <p className="text-xs text-gray-600 mt-1">{exp.desc}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {educations.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-sm font-black text-emerald-600 mb-2 uppercase tracking-wider flex items-center gap-1"><GraduationCap size={12} /> التعليم</h2>
                  <div className="space-y-2">
                    {educations.map(edu => (
                      <div key={edu.id} className="border-r-2 border-emerald-200 pr-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-black text-sm">{edu.degree || 'الشهادة'}</h3>
                          <span className="text-xs text-gray-500">{edu.period}</span>
                        </div>
                        <p className="text-xs text-emerald-700 font-bold">{edu.school}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}