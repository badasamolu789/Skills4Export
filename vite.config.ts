import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: env.VITE_API_BASE_URL
      ? {
          proxy: {
            '/auth': {
              target: env.VITE_API_BASE_URL,
              changeOrigin: true,
              secure: true,
            },
            '/health': {
              target: env.VITE_API_BASE_URL,
              changeOrigin: true,
              secure: true,
            },
          },
        }
      : undefined,
  }
})
