/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT_MS?: string
  readonly VITE_SHOW_API_DEBUG_MODAL?: string
  readonly VITE_PUBLIC_SITE_URL?: string
  readonly VITE_PUBLIC_SHARE_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
