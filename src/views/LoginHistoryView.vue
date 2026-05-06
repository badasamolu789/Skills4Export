<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, Shield, Smartphone, Globe } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ApiError } from '@/lib/api'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const loginHistory = ref<Array<{
  id?: string
  userId?: string
  loginMethod?: string | null
  ipAddress?: string
  loginAt?: string
}>>([])
const isLoading = ref(false)

const loadLoginHistory = async () => {
  if (!authStore.isAuthenticated || !authStore.userId) {
    return
  }

  isLoading.value = true

  try {
    const response = await usersService.getLoginHistory(authStore.userId, authStore.authToken)
    loginHistory.value = response.data
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      const message =
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'Failed to load login history.'

      toast.error(message)
    }
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Unknown'
  try {
    return new Date(dateString).toLocaleString()
  } catch {
    return dateString
  }
}

const isCurrentSession = computed(() => (loginAt?: string) => {
  if (!loginAt) return false
  try {
    const loginTime = new Date(loginAt).getTime()
    const now = Date.now()
    const diffMinutes = (now - loginTime) / 60000
    return diffMinutes < 5 // Current session if logged in within 5 minutes
  } catch {
    return false
  }
})

onMounted(() => {
  void loadLoginHistory()
})
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-(--text-secondary)">
        <RouterLink to="/feed" class="transition hover:text-(--accent-strong)">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/profile" class="transition hover:text-(--accent-strong)">Profile</RouterLink>
        <span>/</span>
        <span class="font-medium text-(--accent-strong)">Login History</span>
      </div>

      <div>
        <h1 class="text-[1.65rem] font-semibold leading-tight text-(--text-primary) sm:text-[1.95rem] lg:text-[2.1rem]">
          Login History
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-7 text-(--text-secondary) sm:text-base">
          View your account security and login activity
        </p>
      </div>
    </div>

    <!-- Security Alert -->
    <div class="rounded-[1.35rem] border border-blue-500 bg-blue-50 dark:bg-blue-950 p-4 flex gap-3">
      <Shield class="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
      <div>
        <p class="font-semibold text-blue-900 dark:text-blue-100">Security Tip</p>
        <p class="mt-1 text-sm text-blue-800 dark:text-blue-200">
          Review your login history regularly. If you see unfamiliar locations or devices, consider changing your password.
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="space-y-3">
      <div
        v-for="item in 5"
        :key="item"
        class="animate-pulse rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="h-4 w-36 rounded-full bg-[var(--surface-muted)]" />
          <div class="h-3 w-24 rounded-full bg-[var(--surface-muted)]" />
        </div>
        <div class="mt-3 h-3 w-2/3 rounded-full bg-[var(--surface-muted)]" />
      </div>
    </div>

    <div v-else-if="loginHistory.length === 0" class="rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-elevated)]">
      <Clock class="mx-auto h-12 w-12 text-[var(--text-tertiary)]" />
      <p class="mt-4 text-lg font-semibold text-[var(--text-primary)]">No login history</p>
      <p class="mt-2 text-sm text-[var(--text-secondary)]">
        Your login activity will appear here
      </p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="session in loginHistory"
        :key="session.id || session.loginAt"
        class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-soft)]"
      >
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-secondary)]">
            <Smartphone
              v-if="session.loginMethod?.toLowerCase().includes('mobile')"
              class="h-5 w-5 text-[var(--accent)]"
            />
            <Globe v-else class="h-5 w-5 text-[var(--accent)]" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="font-semibold text-[var(--text-primary)]">
                {{ session.loginMethod || 'Login activity' }}
              </p>
              <span v-if="isCurrentSession(session.loginAt)" class="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-200">
                Current
              </span>
            </div>

            <p class="mt-1 flex flex-col gap-1 text-sm text-[var(--text-secondary)]">
              <span v-if="session.ipAddress">
                IP: <span class="font-mono">{{ session.ipAddress }}</span>
              </span>
              <span v-if="session.loginAt">
                Logged in: {{ formatDate(session.loginAt) }}
              </span>
            </p>
          </div>

          <div class="flex-shrink-0 text-right">
            <span v-if="isCurrentSession(session.loginAt)" class="inline-block text-xs font-medium text-green-600 dark:text-green-400">
              Active Now
            </span>
            <span v-else class="inline-block text-xs font-medium text-[var(--text-tertiary)]">
              Recorded
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Security Info -->
    <div class="mt-8 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-soft)]">
      <h2 class="font-semibold text-[var(--text-primary)]">Account Security</h2>
      <ul class="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
        <li class="flex gap-3">
          <span class="font-semibold text-[var(--accent)] flex-shrink-0">•</span>
          <span>Change your password if you notice unfamiliar login activity</span>
        </li>
        <li class="flex gap-3">
          <span class="font-semibold text-[var(--accent)] flex-shrink-0">•</span>
          <span>Logout from all other sessions if you suspect unauthorized access</span>
        </li>
        <li class="flex gap-3">
          <span class="font-semibold text-[var(--accent)] flex-shrink-0">•</span>
          <span>Always keep your password strong and never share it with anyone</span>
        </li>
        <li class="flex gap-3">
          <span class="font-semibold text-[var(--accent)] flex-shrink-0">•</span>
          <span>Enable two-factor authentication for additional security</span>
        </li>
      </ul>
    </div>
  </section>
</template>
