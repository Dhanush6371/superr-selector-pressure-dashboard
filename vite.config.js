import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' makes the built site work from any folder or sub-path
// (Netlify, Vercel, GitHub Pages).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: { manualChunks: { recharts: ['recharts'], react: ['react', 'react-dom'] } },
    },
  },
})
