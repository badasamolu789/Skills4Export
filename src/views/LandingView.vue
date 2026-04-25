<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { MessageSquareMore, Users, Trophy, Laugh, Quote } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth'

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
let autoScrollInterval: ReturnType<typeof setInterval> | null = null

const quotes = [
  'As the population grows, job opportunities should grow with it. Unemployment should not be a default outcome.',
  'Communities work best when people can learn, contribute, and turn visibility into meaningful opportunities.',
  'A stronger network gives talent a better chance to be seen, trusted, and hired across industries.',
  'When skills are shared in the right spaces, collaboration and opportunity tend to follow naturally.',
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

const continueWithGoogle = () => {
  window.location.href = authService.getGoogleRedirectUrl()
}

const openDashboardPreview = () => {
  authStore.setAuthenticatedSession('dev-dashboard-preview-token')

  const redirect =
    typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/feed'

  router.push(redirect)
}
</script>

<template>
  <section
    class="min-h-screen bg-[var(--landing-bg)] text-[var(--landing-text)]"
  >
    <div class="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <main class="flex-1">
        <div
          class="landing-card overflow-hidden rounded-[2rem] border border-[color:var(--landing-border)] bg-[color:color-mix(in_srgb,var(--surface-primary)_74%,transparent)] shadow-[var(--shadow-elevated)] backdrop-blur-sm"
        >
          <div class="grid min-h-[calc(100vh-11rem)] gap-14 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[minmax(20rem,0.9fr)_minmax(24rem,1.1fr)] lg:gap-16 lg:px-14 lg:py-12">
            <div class="flex flex-col justify-center">
              <div class="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-[38rem]">
                <div class="flex justify-center lg:justify-start">
                  <img src="/logo_1.svg" alt="Skills4Export logo" class="h-16 w-auto sm:h-20" />
                </div>

                <div class="mt-10 flex min-h-[11rem] items-center text-center lg:mt-14 lg:min-h-[12.5rem] lg:text-left">
                  <h1
                    class="font-sans text-[2.05rem] font-normal tracking-tight text-[var(--landing-heading)] sm:text-[2.55rem] lg:text-[3.2rem] lg:leading-[1.08]"
                  >
                    Join Skills4Export Community
                  </h1>
                </div>

                <p class="mx-auto mt-6 max-w-2xl text-base leading-8 text-[var(--landing-muted)] lg:mx-0 lg:max-w-[32rem] lg:text-lg">
                  A career and business-focused community where people showcase skills, share experience, discover communities, ask questions, and find real opportunities.
                </p>

                <div class="mt-12 max-w-[38rem] space-y-4">
                  <button
                    type="button"
                    class="inline-flex h-14 w-full items-center justify-center rounded-full bg-[var(--landing-heading)] px-6 text-base font-semibold text-white shadow-[var(--shadow-soft)] transition hover:opacity-90"
                    @click="openDashboardPreview"
                  >
                    Open Dashboard Preview
                  </button>

                  <RouterLink
                    :to="{ path: '/auth/login', query: redirectQuery }"
                    class="inline-flex h-14 w-full items-center justify-center rounded-full bg-[var(--accent)] px-6 text-base font-semibold text-white shadow-[var(--shadow-accent)] transition hover:bg-[var(--accent-strong)]"
                  >
                    Login
                  </RouterLink>

                  <RouterLink
                    :to="{ path: '/auth/signup', query: redirectQuery }"
                    class="inline-flex h-14 w-full items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--accent)_38%,var(--surface-primary))] bg-[color:color-mix(in_srgb,var(--surface-primary)_86%,transparent)] px-6 text-base font-semibold text-[var(--accent-strong)] transition hover:border-[color:var(--accent)] hover:bg-[var(--surface-primary)]"
                  >
                    Create Account
                  </RouterLink>
                </div>

                <p class="mt-4 max-w-[38rem] text-center text-sm leading-7 text-[var(--landing-muted)] lg:text-left">
                  By signing up, you agree to the
                  <a href="#" class="font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent)]">Terms of Service</a>
                  and
                  <a href="#" class="font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent)]">Privacy Policy</a>,
                  including Cookie Use.
                </p>

                <div class="mt-10 max-w-[38rem] flex items-center gap-4">
                  <span class="h-px flex-1 bg-[var(--landing-rule)]" />
                  <span class="text-sm font-medium uppercase tracking-[0.24em] text-[var(--landing-muted)]">Or</span>
                  <span class="h-px flex-1 bg-[var(--landing-rule)]" />
                </div>

                <button
                  type="button"
                  class="mt-8 inline-flex h-14 w-full items-center justify-center gap-3 rounded-full border border-[color:color-mix(in_srgb,var(--accent)_28%,var(--surface-primary))] bg-[color:color-mix(in_srgb,var(--surface-primary)_78%,transparent)] px-6 text-base font-semibold text-[var(--accent)] transition hover:bg-[var(--surface-primary)]"
                  @click="continueWithGoogle"
                >
                  <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.33-.17-1.96H12v3.71h5.39a4.61 4.61 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.97-4.33 2.97-7.27Z" />
                    <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.24-2.5c-.9.6-2.05.96-3.37.96-2.59 0-4.79-1.75-5.57-4.11H3.08v2.58A9.98 9.98 0 0 0 12 22Z" />
                    <path fill="#FBBC04" d="M6.43 13.91A5.98 5.98 0 0 1 6.12 12c0-.66.11-1.3.31-1.91V7.51H3.08A9.98 9.98 0 0 0 2 12c0 1.61.39 3.13 1.08 4.49l3.35-2.58Z" />
                    <path fill="#EA4335" d="M12 5.98c1.47 0 2.78.5 3.81 1.48l2.86-2.86C16.95 2.99 14.69 2 12 2A9.98 9.98 0 0 0 3.08 7.51l3.35 2.58C7.21 7.73 9.41 5.98 12 5.98Z" />
                  </svg>
                  Signup with Google
                </button>
              </div>
            </div>

            <div class="flex flex-col justify-center lg:pl-4">
              <div class="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-[44rem]">
                <p class="max-w-[40rem] text-sm leading-7 text-[var(--landing-text)] sm:text-base">
                  Skills4Export is a career and business focused community where users can showcase skills, share experiences, exchange ideas, ask and answer career-related questions, score and comment on others, join contests, subscribe to services, and apply for jobs, internships, and freelance roles.
                </p>

                <div class="mt-8 rounded-[1.5rem] border border-[color:var(--landing-border)] bg-[color:color-mix(in_srgb,var(--surface-primary)_68%,transparent)] p-5 shadow-[var(--shadow-soft)]">
                  <div class="space-y-7">
                    <article
                      v-for="feature in featureGroups"
                      :key="feature.title"
                      class="grid gap-4 sm:grid-cols-[3rem_minmax(0,1fr)] sm:items-start"
                    >
                      <div class="flex items-start justify-start pt-1">
                        <div class="flex h-10 w-10 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--accent)_24%,var(--surface-primary))] bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--surface-primary))] text-[var(--accent-strong)]">
                          <component :is="feature.icon" class="h-4.5 w-4.5" />
                        </div>
                      </div>
                      <div class="max-w-[32rem]">
                        <h2 class="text-lg font-medium tracking-tight text-[var(--landing-heading)] sm:text-[1.45rem]">
                          {{ feature.title }}
                        </h2>
                        <p class="mt-2 text-sm leading-6 text-[var(--landing-text)] sm:text-[0.95rem]">
                          {{ feature.description }}
                        </p>
                      </div>
                    </article>
                  </div>
                </div>

                <div class="mt-10 w-full rounded-[1.6rem] border border-[color:var(--landing-border)] bg-[color:color-mix(in_srgb,var(--surface-primary)_88%,transparent)] p-5 shadow-[var(--shadow-soft)]">
                  <div class="min-h-[10.5rem]">
                    <div class="relative overflow-hidden rounded-[1.35rem]">
                      <Quote class="absolute left-0 top-0 h-5 w-5 text-[var(--accent-soft)]" />
                      <p class="max-w-[38rem] pl-8 pr-1 text-sm leading-7 text-[var(--landing-muted)] sm:text-[0.95rem] sm:leading-8">
                        {{ currentQuote }}
                      </p>
                    </div>
                  </div>

                  <div class="mt-5 flex items-center justify-between gap-4">
                    <div class="flex gap-2">
                      <button
                        v-for="(_, index) in quotes"
                        :key="index"
                        type="button"
                        :class="[
                          'h-2 rounded-full transition-all duration-300',
                          index === currentQuoteIndex
                            ? 'w-7 bg-[var(--accent)]'
                            : 'w-2 bg-[color:var(--landing-rule)] hover:bg-[var(--accent-soft)]',
                        ]"
                        :aria-label="`Go to quote ${index + 1}`"
                        @click="currentQuoteIndex = index; stopAutoScroll(); startAutoScroll()"
                      />
                    </div>

                    <button
                      type="button"
                      class="inline-flex items-center rounded-full border border-[color:color-mix(in_srgb,var(--accent)_20%,var(--surface-primary))] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)] transition hover:bg-[var(--surface-primary)]"
                      @click="nextQuote(); stopAutoScroll(); startAutoScroll()"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer class="mt-6 rounded-[1.5rem] border border-[color:var(--landing-border)] bg-[color:color-mix(in_srgb,var(--surface-primary)_82%,transparent)] px-6 py-5 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-elevated)] backdrop-blur-sm sm:px-8">
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
