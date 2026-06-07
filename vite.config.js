import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Base path — / untuk root domain di Railway
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://testtt.test',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})
