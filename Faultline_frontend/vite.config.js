import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The Faultline API does not enable CORS, so in development the browser must see the
// API on the same origin as the app. Vite proxies `/api/*` to the backend and strips the
// prefix, which is why VITE_API_BASE_URL defaults to `/api` rather than an absolute URL.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3000'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
