import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 58401,
    proxy: {
      '/api': {
        target: 'http://localhost:51509',
        changeOrigin: true,
      },
    },
  },
})