import { computed, ref } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'Skills4Export-theme'
const mode = ref<ThemeMode>('system')
const systemTheme = ref<ResolvedTheme>('light')

let initialized = false
let mediaQuery: MediaQueryList | null = null

const applyTheme = () => {
  if (typeof document === 'undefined') {
    return
  }

  const resolved = mode.value === 'system' ? systemTheme.value : mode.value

  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
}

const handleSystemChange = (event: MediaQueryListEvent) => {
  systemTheme.value = event.matches ? 'dark' : 'light'
  applyTheme()
}

const initializeTheme = () => {
  if (initialized || typeof window === 'undefined') {
    return
  }

  initialized = true
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemTheme.value = mediaQuery.matches ? 'dark' : 'light'

  const storedMode = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
    mode.value = storedMode
  }

  mediaQuery.addEventListener('change', handleSystemChange)
  applyTheme()
}

const setTheme = (nextTheme: ThemeMode) => {
  mode.value = nextTheme

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, nextTheme)
  }

  applyTheme()
}

export const useTheme = () => {
  initializeTheme()

  return {
    theme: computed(() => mode.value),
    resolvedTheme: computed<ResolvedTheme>(() =>
      mode.value === 'system' ? systemTheme.value : mode.value,
    ),
    setTheme,
    themeOptions: ['light', 'dark', 'system'] as ThemeMode[],
  }
}
