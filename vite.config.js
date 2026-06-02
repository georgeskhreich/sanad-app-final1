import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// إعدادات أداة Vite لتجميع التطبيق وبنائه بنجاح
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})
