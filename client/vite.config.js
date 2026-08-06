import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist2', // Redireciona a compilação para a pasta dist2
  },
  server: {
    open: 'msedge'
  },
  define: {
    // Evita sobrescrever todo o objeto process.env para não partir dependências
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})