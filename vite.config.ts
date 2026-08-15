import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/dictionary': {
        target: 'https://api.dictionaryapi.dev/api/v2/entries/en',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dictionary/, '')
      },
      '/api/datamuse': {
        target: 'https://api.datamuse.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/datamuse/, '')
      }
    }
  }
})
