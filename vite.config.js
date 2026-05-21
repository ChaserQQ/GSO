import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: project repo면 '/repo-name/' 으로 바꿔주세요
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || '/',
})
