import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages base path: must match repo name exactly (case-sensitive)
// Repo: https://github.com/chaserqq/GSO  ->  base: '/GSO/'
export default defineConfig({
  plugins: [react()],
  base: '/GSO/',
})
