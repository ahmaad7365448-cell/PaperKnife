import type { Tool } from '../types'
import type { Language } from '../translations'

/**
 * يرجّع العنوان والوصف المناسبين حسب اللغة
 */
export function getToolLabel(tool: Tool, language: Language) {
  if (language === 'en') {
    return {
      title: tool.titleEn || tool.title,
      desc: tool.descEn || tool.desc,
    }
  }
  return {
    title: tool.title,
    desc: tool.desc,
  }
}
