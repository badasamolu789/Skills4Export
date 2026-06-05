import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL?.trim()
  const parsedApiUrl = apiBaseUrl
    ? (() => {
        try {
          return new URL(apiBaseUrl)
        } catch {
          return null
        }
      })()
    : null
  const proxyTarget = parsedApiUrl ? parsedApiUrl.origin : apiBaseUrl || ''
  const isHttpsProxyTarget = parsedApiUrl ? parsedApiUrl.protocol === 'https:' : proxyTarget.startsWith('https://')

  return {
    plugins: [vue(), tailwindcss()],
    build: {
      // CKEditor Classic is a monolithic prebuilt editor. It is emitted as a
      // lazy shared chunk, so keep the warning threshold just above its known
      // minified size while still flagging unexpected large app chunks.
      chunkSizeWarningLimit: 1400,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return
            }

            if (id.includes('vue-router')) {
              return 'router'
            }

            if (id.includes('pinia')) {
              return 'state'
            }

            if (id.includes('vue-sonner')) {
              return 'toasts'
            }

            if (id.includes('lucide-vue-next')) {
              return 'icons'
            }

            if (id.includes('@ckeditor/ckeditor5-build-classic')) {
              return 'ckeditor-classic'
            }

            if (id.includes('@ckeditor/ckeditor5-vue') || id.includes('@ckeditor/ckeditor5-integrations-common')) {
              return 'ckeditor-vue'
            }

            if (id.includes('/vue/') || id.includes('@vue/')) {
              return 'vue-core'
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: proxyTarget
      ? {
          proxy: {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              secure: isHttpsProxyTarget,
              timeout: 60000,
              proxyTimeout: 60000,
            },
            '/health': {
              target: proxyTarget,
              changeOrigin: true,
              secure: isHttpsProxyTarget,
              timeout: 60000,
              proxyTimeout: 60000,
            },
          },
        }
      : undefined,
  }
})
