<script setup lang="ts">
import { computed, ref } from 'vue'
import { Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import type { RouteLocationRaw } from 'vue-router'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ApiError } from '@/lib/api'
import combinedScreenImage from '@/assets/combined_screen.png'
import { authService, extractAuthSession } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import { isGoogleClientConfigured, requestGoogleIdToken } from '@/composables/useGoogleAuth'
import { resolveGoogleOnboardingRedirect } from '@/utils/googleOnboarding'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isRedirectingToGoogle = ref(false)

const { resolvedTheme, setTheme } = useTheme()
const logoSrc = computed(() => resolvedTheme.value === 'dark' ? '/logo_2.png' : '/logo_1.svg')

const toggleTheme = () => {
  const next = resolvedTheme.value === 'dark' ? 'light' : 'dark'
  setTheme(next)
}

if (authStore.isAuthenticated) {
  const redirect = (route.query.redirect as string) || '/feed'
  router.push(redirect)
}

const navLinks = [
  { label: 'Communities', to: '/communities' },
  { label: 'Jokes', to: '/jokes' },
  { label: 'Headlines', to: '/headlines' },
  { label: 'Questions', to: '/answers' },
  { label: 'Freelancers', to: '/freelancers' },
  { label: 'Contests', to: '/contest' },
  { label: 'Posts', to: '/post' },
]

const footerLinks = [
  { label: 'Showcase Skills', to: '/freelancers', requiresAuth: true },
  { label: 'Career Pathways', to: '/communities', requiresAuth: true },
  { label: 'Student Page', to: { path: '/pages/create', query: { type: 'student' } }, requiresAuth: true },
  { label: 'Art&Character', to: '/communities', requiresAuth: true },
  { label: 'Jokes', to: '/jokes', requiresAuth: true },
  { label: 'Headlines', to: '/headlines', requiresAuth: true },
  { label: 'Product Page', to: { path: '/pages/create', query: { type: 'business' } }, requiresAuth: true },
  { label: 'Privacy Policy', to: '/privacy-policy', requiresAuth: false },
  { label: 'Terms', to: '/terms-and-conditions', requiresAuth: false },
  { label: 'About', to: '', requiresAuth: false },
  { label: 'Careers', to: '', requiresAuth: false },
  { label: 'Advertising', to: '', requiresAuth: false },
  { label: 'Contact', to: '', requiresAuth: false },
  { label: 'Cookie Policy', to: '/cookie-policy', requiresAuth: false },
]

const redirectQuery = computed(() =>
  typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
    ? { redirect: route.query.redirect }
    : {},
)

const startGuestSession = () => {
  window.sessionStorage.setItem('skills4export-landing-guest', 'true')
  window.sessionStorage.removeItem('skills4export-guest-auth-prompted')
}

const handleGuestNav = (
  event: MouseEvent,
  navigate: (event?: MouseEvent) => void,
) => {
  if (authStore.isAuthenticated) {
    navigate(event)
    return
  }

  startGuestSession()
  navigate(event)
}

const handleFooterNav = (
  event: MouseEvent,
  requiresAuth: boolean,
  navigate: (event?: MouseEvent) => void,
) => {
  if (requiresAuth) {
    handleGuestNav(event, navigate)
    return
  }

  navigate(event)
}

const getFooterTarget = (to: RouteLocationRaw | '') => to || '/'

const signUpWithGoogle = async () => {
  if (isRedirectingToGoogle.value) {
    return
  }

  isRedirectingToGoogle.value = true
  const loadingToastId = toast.loading('Connecting to Google...', {
    description: 'Please wait while we finish your Google authentication.',
  })

  try {
    if (!isGoogleClientConfigured()) {
      throw new Error('Missing Google client ID. Add VITE_GOOGLE_CLIENT_ID to your environment.')
    }

    const idToken = await requestGoogleIdToken('signup')
    const response = await authService.googleTokenSignIn({ id_token: idToken })
    const session = extractAuthSession(response)
    if (!session) {
      throw new Error('Google sign-in completed but no auth token was returned.')
    }

    authStore.setAuthenticatedSession(session.token, session.userId)
    const redirectTarget = await resolveGoogleOnboardingRedirect(authStore, response)
    toast.success('Signed in with Google', {
      id: loadingToastId,
      description: redirectTarget === '/auth/signup/details'
        ? 'Add a few profile details to finish your setup.'
        : 'Your account session is ready. Redirecting now.',
    })
    router.push(redirectTarget)
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Google sign-up could not be completed.'

    toast.error('Google sign-up failed', {
      id: loadingToastId,
      description: message,
    })
    isRedirectingToGoogle.value = false
  }
}
</script>

<template>
  <section class="min-h-screen bg-[var(--landing-bg)] text-[var(--landing-text)]">
    <header class="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 border-b border-[color:var(--landing-border)] bg-[color:color-mix(in_srgb,var(--surface-primary)_94%,transparent)] px-4 py-2 shadow-[var(--shadow-soft)] backdrop-blur sm:px-6 lg:px-8">
      <RouterLink to="/" class="flex items-center gap-3" aria-label="Skills4Export home">
        <img loading="eager" decoding="async" fetchpriority="high" :src="logoSrc" alt="Skills4Export logo" class="h-12 w-auto object-contain sm:h-14" />
      </RouterLink>

      <nav class="hidden min-w-0 flex-1 items-center justify-center gap-1 text-sm font-medium text-[var(--landing-muted)] lg:flex" aria-label="Landing navigation">
        <RouterLink
          v-for="item in navLinks"
          :key="item.label"
          :to="item.to"
          custom
          v-slot="{ href, navigate }"
        >
          <a
            :href="href"
            class="rounded-full px-2.5 py-2 transition hover:bg-[var(--surface-muted)] hover:text-[var(--accent-strong)] xl:px-3"
            @click="handleGuestNav($event, navigate)"
          >
            {{ item.label }}
          </a>
        </RouterLink>
      </nav>

      <div class="flex items-center gap-2">
        <RouterLink
          :to="{ path: '/auth/signup', query: redirectQuery }"
          class="hidden h-10 items-center justify-center rounded-full px-4 text-sm font-semibold text-[var(--landing-muted)] transition hover:text-[var(--accent-strong)] sm:inline-flex"
        >
          Sign up
        </RouterLink>
        <RouterLink
          :to="{ path: '/auth/login', query: redirectQuery }"
          class="inline-flex h-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] px-4 text-sm font-semibold text-[var(--landing-heading)] transition hover:border-[color:var(--accent)] hover:text-[var(--accent-strong)]"
        >
          Sign in
        </RouterLink>
        <button
          type="button"
          @click="toggleTheme"
          :aria-pressed="resolvedTheme === 'dark'"
          class="ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--landing-muted)] hover:bg-[var(--surface-muted)]"
          title="Toggle theme"
        >
          <Sun v-if="resolvedTheme === 'dark'" class="h-5 w-5" />
          <Moon v-else class="h-5 w-5" />
        </button>
      </div>
    </header>

    <div class="flex min-h-screen w-full max-w-none flex-col px-4 pb-5 pt-20 sm:px-6 sm:pt-24 lg:px-8">
      <main class="grid flex-1 items-center">
        <section id="overview" class="landing-auth-hero mx-auto grid w-full max-w-[96rem] scroll-mt-28 items-center justify-center gap-8 px-2 py-6 sm:px-6 sm:py-8 md:gap-10 lg:grid-cols-[minmax(17rem,31rem)_minmax(24rem,40rem)] lg:gap-16 lg:px-8 xl:gap-24 xl:px-10 2xl:gap-28">
          <div class="landing-auth-panel mx-auto w-full max-w-[31rem] text-left lg:mx-0 lg:justify-self-start">
            <h1 class="landing-join-title text-[var(--landing-heading)]">
              <span class="block">Join Skills4Export</span>
              <span class="block">Community</span>
            </h1>

            <div class="mt-5 space-y-3">
              <RouterLink
                :to="{ path: '/auth/login', query: redirectQuery }"
                class="inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              >
                Login
              </RouterLink>

              <RouterLink
                :to="{ path: '/auth/signup', query: redirectQuery }"
                class="inline-flex h-11 w-full items-center justify-center rounded-full border border-[color:var(--accent)] bg-transparent px-5 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--surface-muted)]"
              >
                Create Account
              </RouterLink>
            </div>

            <p class="mt-2 max-w-[31rem] text-sm leading-5 text-[var(--landing-muted)]">
              By signing up, you agree to the
              <RouterLink to="/terms-and-conditions" class="font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent)]">Terms of Service</RouterLink>
              and
              <RouterLink to="/privacy-policy" class="font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent)]">Privacy Policy</RouterLink>, including
              <RouterLink to="/cookie-policy" class="font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent)]">Cookie Use</RouterLink>.
            </p>

            <div class="mx-auto mt-5 flex max-w-[18rem] items-center gap-5">
              <span class="h-px flex-1 bg-[var(--landing-rule)]" />
              <span class="text-sm font-semibold uppercase text-[var(--landing-muted)]">OR</span>
              <span class="h-px flex-1 bg-[var(--landing-rule)]" />
            </div>

            <button
              type="button"
              :disabled="isRedirectingToGoogle"
              class="mt-5 inline-flex h-11 w-full items-center justify-center gap-3 rounded-full border border-[color:var(--accent)] bg-transparent px-5 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-70"
              @click="signUpWithGoogle"
            >
              <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.33-.17-1.96H12v3.71h5.39a4.61 4.61 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.97-4.33 2.97-7.27Z" />
                <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.24-2.5c-.9.6-2.05.96-3.37.96-2.59 0-4.79-1.75-5.57-4.11H3.08v2.58A9.98 9.98 0 0 0 12 22Z" />
                <path fill="#FBBC04" d="M6.43 13.91A5.98 5.98 0 0 1 6.12 12c0-.66.11-1.3.31-1.91V7.51H3.08A9.98 9.98 0 0 0 2 12c0 1.61.39 3.13 1.08 4.49l3.35-2.58Z" />
                <path fill="#EA4335" d="M12 5.98c1.47 0 2.78.5 3.81 1.48l2.86-2.86C16.95 2.99 14.69 2 12 2A9.98 9.98 0 0 0 3.08 7.51l3.35 2.58C7.21 7.73 9.41 5.98 12 5.98Z" />
              </svg>
              {{ isRedirectingToGoogle ? 'Connecting to Google...' : 'Signup with Google' }}
            </button>
          </div>

          <div class="landing-preview mx-auto hidden w-full max-w-[20rem] sm:max-w-[28rem] md:block md:max-w-[34rem] lg:mx-0 lg:max-w-[36rem] xl:max-w-[40rem] lg:justify-self-stretch">
            <img
              :src="combinedScreenImage"
              alt="Skills4Export app preview"
              class="block w-full h-auto object-contain"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
          </div>
        </section>

      </main>

      <footer class="mx-auto w-full max-w-[96rem] px-2 py-4 text-sm text-[var(--text-secondary)] sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center">
            <RouterLink
              v-for="item in footerLinks"
              :key="item.label"
              :to="getFooterTarget(item.to)"
              custom
              v-slot="{ href, navigate }"
            >
              <a
                :href="href"
                class="transition hover:text-[var(--accent-strong)]"
                @click="handleFooterNav($event, item.requiresAuth, navigate)"
              >
                {{ item.label }}
              </a>
            </RouterLink>
          <p class="text-[var(--text-secondary)]">© 2026 Skills4Export</p>
        </div>
      </footer>
    </div>
  </section>
</template>
