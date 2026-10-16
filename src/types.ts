export type Theme = 'light' | 'dark' | 'system'
export type ViewMode = 'web' | 'android'
export type ToolCategory = 'Edit' | 'Secure' | 'Convert' | 'Optimize'

export interface Tool {
  title: string
  titleEn?: string
  desc: string
  descEn?: string
  icon: any
  implemented: boolean
  path?: string
  category: ToolCategory
  color: string
  bg: string
}