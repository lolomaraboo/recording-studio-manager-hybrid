import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@rsm/shared': path.resolve(__dirname, '../shared/src/index.ts'),
      '@rsm/server': path.resolve(__dirname, '../server/src/index.ts'),
    },
  },
  server: {
    host: '0.0.0.0', // Required for Docker
    port: 5174,
    watch: {
      usePolling: true, // Required for Docker volumes on macOS/Windows
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
