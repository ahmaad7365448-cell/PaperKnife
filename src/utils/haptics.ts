/**
 * Haptics - نسخة بدون Capacitor (تعمل على Vercel)
 * Vibrate API الأصلية في المتصفح
 */

export function hapticImpact() {
  try {
    // استخدام Vibration API الأصلي في المتصفح
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  } catch {
    // تجاهل الأخطاء (بعض المتصفحات لا تدعم)
  }
}

export function hapticSuccess() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([10, 50, 10])
    }
  } catch { /* ignore */ }
}

export function hapticError() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([50, 30, 50])
    }
  } catch { /* ignore */ }
}

export function hapticLight() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(5)
    }
  } catch { /* ignore */ }
}