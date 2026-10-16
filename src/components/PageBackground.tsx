import React from 'react'

/**
 * PageBackground - الخلفية الفنية المذهلة
 * تظهر في كل الصفحات (عبر Layout)
 */
export default function PageBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">

      {/* 1️⃣ التدرج الأساسي الداكن */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#08080a] via-[#0a0a0d] to-[#0d0810]" />

      {/* 2️⃣ بقعة توهج وردية في الأعلى */}
      <div
        className="absolute -top-1/3 left-1/2 -translate-x-1/2 w-[140%] h-[80%] opacity-40"
        style={{
          background: `radial-gradient(ellipse at center, 
            rgba(244,63,94,0.25) 0%, 
            rgba(244,63,94,0.10) 25%, 
            rgba(139,92,246,0.08) 50%, 
            transparent 75%)`,
          filter: 'blur(40px)',
        }}
      />

      {/* 3️⃣ بقعة توهج بنفسجية أسفل يمين */}
      <div
        className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[60%] opacity-30"
        style={{
          background: `radial-gradient(ellipse at center,
            rgba(139,92,246,0.20) 0%,
            rgba(99,102,241,0.10) 40%,
            transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      {/* 4️⃣ بقعة توهج زمردية أسفل يسار */}
      <div
        className="absolute -bottom-1/4 -left-1/4 w-[60%] h-[50%] opacity-20"
        style={{
          background: `radial-gradient(ellipse at center,
            rgba(16,185,129,0.18) 0%,
            transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      {/* 5️⃣ شبكة نقطية دقيقة */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
        }}
      />

      {/* 6️⃣ خطوط قُطرية زخرفية */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="lines-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="80" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lines-pattern)" />
      </svg>

      {/* 7️⃣ أوراق مستندات عائمة */}
      <div className="absolute top-[15%] left-[8%] opacity-[0.08] animate-[float_14s_ease-in-out_infinite]">
        <svg width="60" height="75" viewBox="0 0 60 75" fill="none" stroke="currentColor" className="text-rose-400" strokeWidth="1.5">
          <path d="M 8 8 L 40 8 L 52 20 L 52 67 L 8 67 Z" />
          <path d="M 40 8 L 40 20 L 52 20" />
          <line x1="15" y1="30" x2="45" y2="30" />
          <line x1="15" y1="40" x2="45" y2="40" />
          <line x1="15" y1="50" x2="35" y2="50" />
        </svg>
      </div>

      <div className="absolute top-[55%] right-[6%] opacity-[0.07] animate-[float_18s_ease-in-out_infinite_reverse]">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="currentColor" className="text-indigo-400" strokeWidth="1.5">
          <circle cx="40" cy="40" r="30" />
          <circle cx="40" cy="40" r="20" strokeDasharray="4 4" />
          <path d="M 40 10 L 40 40 L 60 55" />
        </svg>
      </div>

      <div className="absolute bottom-[15%] left-[12%] opacity-[0.06] animate-[float_16s_ease-in-out_infinite]">
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none" stroke="currentColor" className="text-emerald-400" strokeWidth="1.5">
          <path d="M 10 35 Q 35 10 60 35 Q 35 60 10 35 Z" />
          <circle cx="35" cy="35" r="5" fill="currentColor" opacity="0.5" />
        </svg>
      </div>

      <div className="absolute top-[25%] right-[12%] opacity-[0.05] animate-[float_20s_ease-in-out_infinite_reverse]">
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none" stroke="currentColor" className="text-amber-400" strokeWidth="1.5">
          <rect x="10" y="10" width="30" height="30" rx="4" transform="rotate(15 25 25)" />
        </svg>
      </div>

      {/* 8️⃣ خط أفقي مضيء أعلى الصفحة */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

      {/* 9️⃣ طبقة ضوضاء خفيفة */}
      <div
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}