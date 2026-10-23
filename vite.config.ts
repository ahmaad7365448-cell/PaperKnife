import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  // 🌟 التعديل هنا: غيرنا './' إلى '/'
  base: process.env.VITE_BASE || '/',
  server: {
    host: true
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-lib-core': ['pdf-lib'],
          'pdfjs-viewer': ['pdfjs-dist'],
          'vendor-ui': ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'sonner'],
          'vendor-utils': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities']
        }
      }
    }
  }
})