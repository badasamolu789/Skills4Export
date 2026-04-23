<script setup lang="ts">
import { MessageSquareMore, Users, Sparkles, BriefcaseBusiness } from 'lucide-vue-next'
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/services/auth'
import AuthShell from '@/components/AuthShell.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// If user is already logged in, redirect to home or redirect query
if (authStore.isAuthenticated) {
  const redirect = (route.query.redirect as string) || '/feed'
  router.push(redirect)
}

const featureGroups = [
  {
    icon: MessageSquareMore,
    title: 'Participate',
    description: 'Share posts, showcase your skills, ask thoughtful questions, and participate in meaningful conversations.',
  },
  {
    icon: Users,
    title: 'Explore Communities',
    description: 'Find communities that match your direction and navigate discussions, opportunities, and people.',
  },
  {
    icon: Sparkles,
    title: 'Contests',
    description: 'Join contests across sub-communities and compete for recognition, prizes, and visibility.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Job Opportunities',
    description: 'Discover internships, freelance jobs, and full-time positions tailored to your skills.',
  },
]

const footerLinks = ['Privacy Policy', 'Terms', 'About', 'Careers', 'Advertising', 'Contact', 'Cookie Policy']

// Carousel logic
const currentFeatureIndex = ref(0)
let autoScrollInterval: ReturnType<typeof setInterval> | null = null
let touchStartX = 0

const currentFeature = computed(() => featureGroups[currentFeatureIndex.value])

const nextFeature = () => {
  currentFeatureIndex.value = (currentFeatureIndex.value + 1) % featureGroups.length
}

const prevFeature = () => {
  currentFeatureIndex.value = (currentFeatureIndex.value - 1 + featureGroups.length) % featureGroups.length
}

const startAutoScroll = () => {
  autoScrollInterval = setInterval(() => {
    nextFeature()
  }, 4000) // Change feature every 4 seconds
}

const stopAutoScroll = () => {
  if (autoScrollInterval) {
    clearInterval(autoScrollInterval)
    autoScrollInterval = null
  }
}

const handleTouchStart = (e: TouchEvent) => {
  touchStartX = e.touches[0].clientX
}

const handleTouchEnd = (e: TouchEvent) => {
  const touchEndX = e.changedTouches[0].clientX
  const diff = touchStartX - touchEndX

  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      nextFeature()
    } else {
      prevFeature()
    }
    stopAutoScroll()
    startAutoScroll()
  }
}

onMounted(() => {
  startAutoScroll()
})

onBeforeUnmount(() => {
  stopAutoScroll()
})

const redirectQuery = computed(() =>
  typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
    ? { redirect: route.query.redirect }
    : {},
)

const continueWithGoogle = () => {
  window.location.href = authService.getGoogleRedirectUrl()
}
</script>

<template>
  <section class="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
    <div class="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div class="flex-1">
        <AuthShell
          badge="Welcome"
          title="Join the community for skills and opportunities."
          description="Connect, grow, and discover opportunities in one workspace."
        >
    <template #aside>
      <!-- Features Carousel -->
      <div
        class="relative flex flex-col gap-6"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <!-- Current Feature -->
        <div class="transition-all duration-500 ease-in-out">
          <div class="flex gap-4">
            <div class="flex-shrink-0 pt-0.5">
              <component
                :is="currentFeature.icon"
                class="h-8 w-8 text-[var(--accent)]"
              />
            </div>
            <div>
              <h3 class="font-semibold text-[var(--text-primary)] text-lg">{{ currentFeature.title }}</h3>
              <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{{ currentFeature.description }}</p>
            </div>
          </div>
        </div>

        <!-- Carousel Indicators -->
        <div class="flex gap-2 justify-center mt-8">
          <button
            v-for="(_, index) in featureGroups"
            :key="index"
            @click="currentFeatureIndex = index; stopAutoScroll(); startAutoScroll()"
            :class="[
              'h-2 rounded-full transition-all duration-300',
              index === currentFeatureIndex
                ? 'bg-[var(--accent)] w-8'
                : 'bg-[var(--border-soft)] w-2 hover:bg-[var(--text-tertiary)]'
            ]"
            :aria-label="`Go to feature ${index + 1}`"
          />
        </div>

        <!-- Navigation Arrows (hidden on mobile, shown on larger screens) -->
        <div class="hidden sm:flex gap-3 justify-center">
          <button
            @click="prevFeature(); stopAutoScroll(); startAutoScroll()"
            class="p-2 rounded-full border border-[var(--border-soft)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
            aria-label="Previous feature"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            @click="nextFeature(); stopAutoScroll(); startAutoScroll()"
            class="p-2 rounded-full border border-[var(--border-soft)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition"
            aria-label="Next feature"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </template>

    <!-- Main Content: Authentication Form -->
    <div class="relative mx-auto flex w-full max-w-md flex-col justify-center overflow-hidden rounded-[1.75rem]">
      <!-- Decorative Background -->
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[1.75rem]">
        <div class="absolute -left-10 top-8 h-28 w-28 rotate-12 rounded-3xl bg-[var(--accent)]/8" />
        <div class="absolute right-4 top-16 h-16 w-16 rounded-full border border-[color:color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[var(--accent)]/5" />
        <div class="absolute -right-8 bottom-10 h-24 w-24 rotate-45 rounded-2xl bg-[var(--accent)]/7" />
        <div class="absolute bottom-5 left-6 h-0 w-0 border-x-[20px] border-b-[34px] border-x-transparent border-b-[color:color-mix(in_srgb,var(--accent)_12%,transparent)]" />
      </div>

      <!-- Logo -->
      <div class="mb-6 flex justify-center sm:mb-8">
        <img src="/logo_1.svg" alt="Skills4Export logo" class="h-16 w-auto sm:h-20" />
      </div>

      <!-- Heading -->
      <p class="mb-6 text-center text-xl tracking-[0.08em] text-[var(--accent-strong)] sm:text-2xl">
        Join Skills4Export Community
      </p>

      <!-- Login Button -->
      <RouterLink
        :to="{ path: '/auth/login', query: redirectQuery }"
        class="mb-3 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--accent)] text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] sm:h-13 sm:text-base"
      >
        Sign in
      </RouterLink>

      <!-- Create Account Button -->
      <RouterLink
        :to="{ path: '/auth/signup', query: redirectQuery }"
        class="mb-4 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-soft)] sm:h-13 sm:text-base"
      >
        Create Account
      </RouterLink>

      <!-- Divider -->
      <div class="flex items-center gap-3">
        <span class="h-px flex-1 bg-[var(--border-soft)]" />
        <span class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">Or continue with</span>
        <span class="h-px flex-1 bg-[var(--border-soft)]" />
      </div>

      <!-- Google Button -->
      <button
        type="button"
        class="mt-4 inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-soft)] sm:h-13 sm:text-base"
        @click="continueWithGoogle"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M21.6 12.23c0-.68-.06-1.33-.17-1.96H12v3.71h5.39a4.61 4.61 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.97-4.33 2.97-7.27Z" />
          <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.24-2.5c-.9.6-2.05.96-3.37.96-2.59 0-4.79-1.75-5.57-4.11H3.08v2.58A9.98 9.98 0 0 0 12 22Z" />
          <path fill="#FBBC04" d="M6.43 13.91A5.98 5.98 0 0 1 6.12 12c0-.66.11-1.3.31-1.91V7.51H3.08A9.98 9.98 0 0 0 2 12c0 1.61.39 3.13 1.08 4.49l3.35-2.58Z" />
          <path fill="#EA4335" d="M12 5.98c1.47 0 2.78.5 3.81 1.48l2.86-2.86C16.95 2.99 14.69 2 12 2A9.98 9.98 0 0 0 3.08 7.51l3.35 2.58C7.21 7.73 9.41 5.98 12 5.98Z" />
        </svg>
        Continue with Google
      </button>

      <!-- Terms Text -->
      <p class="mt-6 text-center text-xs leading-6 text-[var(--text-secondary)]">
        By signing up, you agree to the<br />
        <a href="#" class="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">Terms of Service</a> and
        <a href="#" class="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">Privacy Policy</a>
      </p>
    </div>
        </AuthShell>
      </div>

      <!-- Footer -->
      <footer class="mt-6 flex flex-col gap-4 rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-6 py-5 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
        <p>© 2026 Skills4Export</p>
      </footer>
    </div>
  </section>
</template>
