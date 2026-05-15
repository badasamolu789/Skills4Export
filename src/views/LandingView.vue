<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { MessageSquareMore, Users, Trophy, Laugh, Quote } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { authService, extractAuthSession } from '@/services/auth'
import { isGoogleClientConfigured, requestGoogleIdToken } from '@/composables/useGoogleAuth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

if (authStore.isAuthenticated) {
  const redirect = (route.query.redirect as string) || '/feed'
  router.push(redirect)
}

const featureGroups = [
  {
    icon: MessageSquareMore,
    title: 'Participate',
    description:
      'Share posts, showcase your skills, ask better questions, and join conversations that move your work forward.',
  },
  {
    icon: Users,
    title: 'Explore Communities',
    description:
      'Find communities that match your interests and use them to navigate people, discussions, and opportunities.',
  },
  {
    icon: Trophy,
    title: 'Contest',
    description:
      'Join contests across sub-communities and compete for visibility, recognition, and practical rewards.',
  },
  {
    icon: Laugh,
    title: 'Jokes Community',
    description:
      'Take a breather, read light posts, and enjoy the social side of the platform without losing the sense of community.',
  },
]

const footerLinks = ['Privacy Policy', 'Terms', 'About', 'Careers', 'Advertising', 'Contact', 'Cookie Policy']

const currentQuoteIndex = ref(0)
const isRedirectingToGoogle = ref(false)
let autoScrollInterval: ReturnType<typeof setInterval> | null = null

const quotes = [
  'As the population grows, so should job opportunities to match the demand created by the growth in population. Unemployment should be a choice.',
  'Unemployment is an anomaly. Human Capital development and job switch is required to correct the in-balance of underemployment and job loss.',
  // 'A stronger network gives talent a better chance to be seen, trusted, and hired across industries.',
  // 'When skills are shared in the right spaces, collaboration and opportunity tend to follow naturally.',
]

const currentQuote = computed(() => quotes[currentQuoteIndex.value])

const redirectQuery = computed(() =>
  typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
    ? { redirect: route.query.redirect }
    : {},
)

const nextQuote = () => {
  currentQuoteIndex.value = (currentQuoteIndex.value + 1) % quotes.length
}

const startAutoScroll = () => {
  autoScrollInterval = setInterval(() => {
    nextQuote()
  }, 3500)
}

const stopAutoScroll = () => {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval)
    autoScrollInterval = null
  }
}

onMounted(() => {
  startAutoScroll()
})

onBeforeUnmount(() => {
  stopAutoScroll()
})

const continueWithGoogle = async () => {
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

    const idToken = await requestGoogleIdToken()
    const response = await authService.googleTokenSignIn({ id_token: idToken })
    const session = extractAuthSession(response)
    if (!session) {
      throw new Error('Google sign-in completed but no auth token was returned.')
    }

    authStore.setAuthenticatedSession(session.token, session.userId)
    toast.success('Signed in with Google', {
      id: loadingToastId,
      description: 'Your account session is ready. Redirecting now.',
    })
    await router.push('/feed')
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Google sign-in could not be completed.'

    toast.error('Google sign-in failed', {
      id: loadingToastId,
      description: message,
    })
    isRedirectingToGoogle.value = false
  }
}
</script>

<template>
  <section
    class="min-h-screen bg-[var(--landing-bg)] text-[var(--landing-text)]"
  >
    <div class="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
      <main class="flex-1">
        <div class="pt-5 sm:pt-7 lg:pt-8">
          <div class="flex justify-center">
            <img src="/nlogo.png" alt="Skills4Export logo" class="h-16 w-auto sm:h-20 lg:h-24" />
          </div>

          <div class="grid gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(20rem,0.92fr)_minmax(24rem,1.08fr)] lg:gap-12 lg:py-12">
            <div class="flex flex-col justify-start lg:pt-8">
              <div class="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-[38rem]">
                <div class="text-center">
                  <h1 class="landing-hero-title mx-auto max-w-[40rem] text-[#5a5a5a] dark:text-[var(--landing-heading)]">
                    <span class="landing-title-line block">Join Skills4Export</span>
                    <span class="block">Community</span>
                  </h1>
                </div>

                <!-- <p class="mx-auto mt-8 max-w-2xl text-base leading-8 text-[var(--landing-muted)] lg:mx-0 lg:max-w-[32rem] lg:text-lg">
                  A career and business-focused community where people showcase skills, share experience, discover communities, ask questions, and find real opportunities.
                </p> -->

                <div class="mt-9 max-w-[38rem] space-y-3.5">
                  <RouterLink
                    :to="{ path: '/auth/login', query: redirectQuery }"
                    class="inline-flex h-14 w-full items-center justify-center rounded-full bg-[var(--accent)] px-6 text-base font-semibold text-white shadow-[var(--shadow-accent)] transition hover:bg-[var(--accent-strong)]"
                  >
                    Login
                  </RouterLink>

                  <RouterLink
                    :to="{ path: '/auth/signup', query: redirectQuery }"
                    class="inline-flex h-14 w-full items-center justify-center rounded-full border border-[color:var(--accent)] bg-[var(--surface-primary)] px-6 text-base font-semibold text-[var(--accent-strong)] transition hover:border-[color:var(--accent)] hover:bg-[var(--surface-muted)]"
                  >
                    Create Account
                  </RouterLink>
                </div>

                <p class="mt-3 max-w-[38rem] text-center text-sm leading-7 text-[var(--landing-muted)]">
                  By signing up, you agree to the
                  <a href="#" class="font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent)]">Terms of Service</a>
                  and
                  <a href="#" class="font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent)]">Privacy Policy</a>,
                  including Cookie Use.
                </p>

                <div class="mt-8 max-w-[38rem] flex items-center gap-4">
                  <span class="h-px flex-1 bg-[var(--landing-rule)]" />
                  <span class="text-sm font-medium uppercase tracking-[0.24em] text-[var(--landing-muted)]">Or</span>
                  <span class="h-px flex-1 bg-[var(--landing-rule)]" />
                </div>

                <button
                  type="button"
                  :disabled="isRedirectingToGoogle"
                  class="mt-6 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full border border-[color:var(--accent)] bg-[var(--surface-primary)] px-6 text-base font-semibold text-[var(--accent)] transition hover:bg-[var(--surface-muted)]"
                  @click="continueWithGoogle"
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
            </div>

            <div class="flex flex-col justify-start lg:pl-4 lg:pt-7">
              <div class="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-152">
                <p class="landing-intro-text max-w-[40rem] text-[var(--landing-text)]">
                  A career and business focused Community. where users: showcase skills, share experiences, share ideas, ask and answer career related questions, score & comment others, partake in contests, subscribe to services. Apply for jobs, internships, Freelance jobs.
                </p>

                <div class="mt-7">
                  <div class="space-y-5">
                    <article
                      v-for="feature in featureGroups"
                      :key="feature.title"
                      class="grid gap-4 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:items-start"
                    >
                      <div class="flex items-start justify-start pt-1">
                        <div class="flex h-11 w-11 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--accent)_24%,var(--surface-primary))] bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--surface-primary))] text-[var(--accent-strong)]">
                          <component :is="feature.icon" class="h-4.5 w-4.5" />
                        </div>
                      </div>
                      <div class="max-w-[32rem]">
                        <h2 class="landing-feature-title text-[var(--landing-heading)]">
                          {{ feature.title }}
                        </h2>
                        <p class="landing-feature-text mt-2 text-[var(--landing-text)]">
                          {{ feature.description }}
                        </p>
                      </div>
                    </article>
                  </div>
                </div>

                <div class="mt-8 w-full">
                  <div class="relative max-w-[38rem] rounded-md bg-white px-7 py-7 text-[#5a5a5a] dark:bg-[var(--surface-primary)] dark:text-[var(--landing-muted)] sm:px-9 sm:py-8">
                    <div class="absolute -bottom-8 left-20 h-0 w-0 border-l-[1.8rem] border-r-[0.35rem] border-t-[2rem] border-l-transparent border-r-transparent border-t-white dark:border-t-[var(--surface-primary)]" />
                    <div class="relative grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3">
                      <Quote class="mt-1 h-9 w-9 fill-[var(--accent)] text-[var(--accent)]" />
                      <p class="landing-quote-text">
                        {{ currentQuote }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer class="mt-6 rounded-[1.5rem] border border-[color:var(--landing-border)] bg-[var(--surface-primary)] px-6 py-5 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-elevated)] sm:px-8">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-wrap gap-x-5 gap-y-2">
            <a
              v-for="item in footerLinks"
              :key="item"
              href="#"
              class="transition hover:text-[var(--accent-strong)]"
            >
              {{ item }}
            </a>
          </div>
          <p class="text-[var(--text-secondary)]">© 2026 Skills4Export</p>
        </div>
      </footer>
    </div>
  </section>
</template>
