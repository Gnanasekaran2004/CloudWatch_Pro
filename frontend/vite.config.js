import { defineConfig, loadEnv } from 'vite'
import react        from '@vitejs/plugin-react'
import tailwindcss  from '@tailwindcss/vite'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: command === 'serve' ? {
      proxy: {
        '/api':       { target: 'http://localhost:3000', changeOrigin: true },
        '/socket.io': { target: 'http://localhost:3000', ws: true, changeOrigin: true }
      }
    } : {},
    build: {
      outDir:        'dist',
      sourcemap:     false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor';
            }
            if (id.includes('node_modules/recharts')) {
              return 'recharts';
            }
            if (id.includes('node_modules/socket.io-client')) {
              return 'socket';
            }
          }
        }
      }
    }
  }
})
