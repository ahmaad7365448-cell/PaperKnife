import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'paperknife-language';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // 🎯 قراءة اللغة من localStorage أو تثبيت الإنكليزية كافتراضي نهائي
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved === 'en' || saved === 'ar') return saved;
    // إذا لم يتم الاختيار مسبقاً، نثبت الإنجليزية ونحفظها فوراً
    localStorage.setItem(STORAGE_KEY, 'en');
    return 'en';
  });

  const isRTL = language === 'ar';

  // 🎯 دالة تغيير اللغة مع الحفظ الإجباري
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      console.error('Failed to save language to localStorage', e);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  // 🎯 مزامنة اللغة مع خصائص المستند (HTML) عند أي تغيير أو تسجيل دخول
  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = isRTL ? 'rtl' : 'ltr';
    document.title = translations[language]?.pageTitle || 'PaperKnife';

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', translations[language]?.pageDesc || '');
    }
  }, [language, isRTL]);

  // حماية إضافية ضد إعادة التعيين عند إعادة تحميل الصفحة بعد التوثيق
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved && (saved === 'en' || saved === 'ar') && saved !== language) {
        setLanguageState(saved);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [language]);

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};