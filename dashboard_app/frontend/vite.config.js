import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dashboard visuals reuse versioned robot renders and fonts from the
    // repository's shared docs/website assets during local development.
    fs: {
      allow: [fileURLToPath(new URL('../..', import.meta.url))],
    },
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
