import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // GitHub Pages serves this project at /2602vamos/ (the repo name) — only the production
  // build needs that prefix; the local dev server still runs at the root.
  base: command === 'build' ? '/2602vamos/' : '/',
  server: {
    host: true,
  },
}))
