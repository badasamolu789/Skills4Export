<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight, CircleUserRound, LogOut } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ApiError } from '@/lib/api'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'

type MenuItem = {
  label: string
  to: string
  action?: 'logout'
}

const router = useRouter()
const authStore = useAuthStore()

const profileName = computed(() => authStore.signUpDraft.name || 'Samuel Bada')
const profileRole = computed(() => authStore.signUpDraft.headline || 'Community member')
const profileImage = computed(() => authStore.signUpDraft.avatar || authStore.userProfile?.avatar || '')
const profileInitials = computed(() =>
  profileName.value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const userMenu = computed<MenuItem[]>(() => [
  { label: 'Profile', to: '/profile' },
  { label: 'Create Alerts', to: '/jobs/alerts' },
  { label: 'Manage activities', to: '/' },
  { label: 'Manage Jobs', to: '/jobs' },
  { label: 'Referrals', to: '/referrals' },
  ...(authStore.isAuthenticated
    ? [
        { label: 'Settings', to: '/settings' },
        { label: authStore.authMenuLabel, to: '/', action: 'logout' as const },
      ]
    : [{ label: authStore.authMenuLabel, to: '/auth/login' }]),
])

const handleItemClick = async (item: MenuItem) => {
  if (item.action !== 'logout') {
    router.push(item.to)
    return
  }

  const loadingToastId = toast.loading('Logging you out...', {
    description: 'Please wait while we clear your session.',
  })

  try {
    if (authStore.authToken) {
      await authService.logout(authStore.authToken)
    }
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : 'We could not confirm logout with the server.'

    toast.error('Logout request failed', {
      id: loadingToastId,
      description: `${message} Your local session has still been cleared.`,
    })
  } finally {
    authStore.clearAuthenticatedSession()
    router.push('/auth/login')

    toast.success('Logged out', {
      id: loadingToastId,
      description: 'Your session has been cleared on this device.',
    })
  }
}
</script>

<template>
  <section class="mx-auto max-w-3xl px-4 py-6 sm:px-6">
    <div class="rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)]">
      <div class="border-b border-[color:var(--border-soft)] px-5 py-5">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
          Account
        </p>

        <div class="mt-4 flex items-center gap-4">
          <div class="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)]">
            <span
              v-if="authStore.isAuthenticated && !profileImage"
              class="flex h-full w-full items-center justify-center bg-[var(--accent)] text-sm font-bold text-white"
            >
              {{ profileInitials }}
            </span>
            <img
              v-else-if="authStore.isAuthenticated && profileImage"
              :src="profileImage"
              :alt="profileName"
              class="h-full w-full object-cover"
            />
            <span
              v-else
              class="flex h-full w-full items-center justify-center text-[var(--text-secondary)]"
            >
              <CircleUserRound class="h-6 w-6" />
            </span>
            <span
              v-if="authStore.isAuthenticated"
              class="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-[var(--surface-primary)] bg-green-500"
            />
          </div>

          <div class="min-w-0">
            <p class="truncate text-base font-semibold text-[var(--text-primary)]">
              {{ authStore.isAuthenticated ? profileName : 'Guest user' }}
            </p>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">
              {{
                authStore.isAuthenticated
                  ? profileRole
                  : 'Log in to personalize your profile, alerts, and activities.'
              }}
            </p>
          </div>
        </div>
      </div>

      <div class="px-4 py-4">
        <button
          v-for="item in userMenu"
          :key="item.label"
          type="button"
          class="flex w-full items-center justify-between rounded-[1rem] px-4 py-4 text-left text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-secondary)]"
          @click="handleItemClick(item)"
        >
          <div class="flex items-center gap-3">
            <LogOut
              v-if="item.action === 'logout'"
              class="h-4 w-4 text-[var(--text-tertiary)]"
            />
            <span>{{ item.label }}</span>
          </div>
          <ChevronRight v-if="item.action !== 'logout'" class="h-4 w-4 text-[var(--text-tertiary)]" />
        </button>
      </div>
    </div>
  </section>
</template>
