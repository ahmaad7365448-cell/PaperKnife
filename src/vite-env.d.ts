/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_DISABLE_OCR?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Vite: import as URL
declare module '*?url' {
  const src: string
  export default src
}

// Vite: import as raw string
declare module '*?raw' {
  const src: string
  export default src
}

// Vite: import as worker
declare module '*?worker' {
  const workerConstructor: {
    new (): Worker
  }
  export default workerConstructor
}

// Vite: import as worker inline
declare module '*?worker&inline' {
  const workerConstructor: {
    new (): Worker
  }
  export default workerConstructor
}