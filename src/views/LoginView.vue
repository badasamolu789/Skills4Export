<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AuthShell from '@/components/AuthShell.vue'
import { ApiError } from '@/lib/api'
import { authService, extractAuthSession } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import { usePasswordToggle } from '@/composables/usePasswordToggle'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const isSubmitting = ref(false)
const isRedirectingToGoogle = ref(false)
const passwordToggle = usePasswordToggle()
const form = ref({
  email: '',
  password: '',
  rememberMe: true,
})

const submitLogin = async () => {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  const loadingToastId = toast.loading('Signing you in...', {
    description: 'Please wait while we validate your credentials.',
  })

  const redirectTarget =
    typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/feed'

  try {
    const response = await authService.login({
      email: form.value.email,
      password: form.value.password,
    })

    const session = extractAuthSession(response)
    if (!session) {
      throw new Error('No access token was returned by the server.')
    }

    authStore.signUpDraft.email = form.value.email
    authStore.setAuthenticatedSession(session.token, session.userId)

    toast.success('Signed in', {
      id: loadingToastId,
      description: 'Your account session is now active. Redirecting you now.',
    })

    router.push(redirectTarget)
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'We could not sign you in. Please try again.'

    toast.error('Sign in failed', {
      id: loadingToastId,
      description: message,
    })
  } finally {
    isSubmitting.value = false
  }
}

const continueWithGoogle = () => {
  if (isRedirectingToGoogle.value) {
    return
  }

  isRedirectingToGoogle.value = true
  toast.loading('Redirecting to Google...', {
    description: 'You are being redirected to continue authentication.',
  })
  window.location.href = authService.getGoogleRedirectUrl()
}
</script>

<template>
  <AuthShell
    :centered="true"
    badge="Login"
    title="Welcome back to your community workspace."
    description="Sign in to continue managing your profile, alerts, activities, job flow, and community participation."
  >
    <div class="relative mx-auto flex w-full max-w-md flex-col justify-center overflow-hidden rounded-[1.75rem] sm:max-w-md">
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[1.75rem]">
        <div class="absolute -left-10 top-8 h-28 w-28 rotate-12 rounded-3xl bg-[var(--accent-soft)]" />
        <div class="absolute right-4 top-16 h-16 w-16 rounded-full border border-[color:var(--accent)] bg-[var(--surface-muted)]" />
        <div class="absolute -right-8 bottom-10 h-24 w-24 rotate-45 rounded-2xl bg-[var(--accent-soft)]" />
        <div class="absolute bottom-5 left-6 h-0 w-0 border-x-[20px] border-b-[34px] border-x-[var(--surface-primary)] border-b-[var(--accent-soft)]" />
      </div>

      <div class="mb-5 flex justify-center sm:mb-6">
        <img src="/logo_1.svg" alt="Skills4Export logo" class="h-10 w-auto sm:h-12" />
      </div>

      <p class="mb-4 text-center text-xl tracking-[0.08em] text-[var(--accent-strong)] sm:text-2xl">
        Sign In
      </p>

      <form class="space-y-3.5 sm:space-y-4" @submit.prevent="submitLogin">
      <div class="space-y-2">
        <label class="text-sm font-semibold text-[var(--text-primary)] sm:text-base">Email address</label>
        <input
          v-model="form.email"
          type="email"
          required
          placeholder="you@example.com"
          class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)] sm:h-13 sm:text-base"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-semibold text-[var(--text-primary)] sm:text-base">Password</label>
        <div class="relative">
          <input
            v-model="form.password"
            :type="passwordToggle.getInputType()"
            required
            placeholder="Enter your password"
            class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 pr-12 text-sm outline-none transition focus:border-[var(--accent)] sm:h-13 sm:text-base"
          />
          <button
            type="button"
            @click="passwordToggle.togglePasswordVisibility()"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition"
            :aria-label="passwordToggle.showPassword.value ? 'Hide password' : 'Show password'"
          >
            <svg v-if="passwordToggle.showPassword.value" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-3 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between sm:text-base">
        <label class="inline-flex items-center gap-2">
          <input v-model="form.rememberMe" type="checkbox" class="h-4 w-4 accent-[var(--accent)]" />
          <span>Remember me</span>
        </label>
        <RouterLink class="font-semibold text-[var(--accent-strong)]" to="/auth/forgot-password">
          Forgot password?
        </RouterLink>
      </div>

      <button
        type="submit"
        :disabled="isSubmitting"
        class="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--accent)] text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] sm:h-13 sm:text-base"
      >
        {{ isSubmitting ? 'Signing in...' : 'Sign in' }}
      </button>

      <div class="flex items-center gap-4 pt-1">
        <span class="h-px flex-1 bg-[var(--border-soft)]" />
        <span class="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
          Continue with
        </span>
        <span class="h-px flex-1 bg-[var(--border-soft)]" />
      </div>

      <button
        type="button"
        :disabled="isRedirectingToGoogle || isSubmitting"
        class="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-soft)] sm:h-13 sm:text-base"
        @click="continueWithGoogle"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M21.6 12.23c0-.68-.06-1.33-.17-1.96H12v3.71h5.39a4.61 4.61 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.97-4.33 2.97-7.27Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.24-2.5c-.9.6-2.05.96-3.37.96-2.59 0-4.79-1.75-5.57-4.11H3.08v2.58A9.98 9.98 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC04"
            d="M6.43 13.91A5.98 5.98 0 0 1 6.12 12c0-.66.11-1.3.31-1.91V7.51H3.08A9.98 9.98 0 0 0 2 12c0 1.61.39 3.13 1.08 4.49l3.35-2.58Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.98c1.47 0 2.78.5 3.81 1.48l2.86-2.86C16.95 2.99 14.69 2 12 2A9.98 9.98 0 0 0 3.08 7.51l3.35 2.58C7.21 7.73 9.41 5.98 12 5.98Z"
          />
        </svg>
        {{ isRedirectingToGoogle ? 'Redirecting to Google...' : 'Continue with Google' }}
      </button>

      <p class="pt-2 text-center text-sm text-[var(--text-secondary)] sm:text-base">
        Already have an account?
        <RouterLink class="font-semibold text-[var(--accent-strong)]" to="/auth/signup">
          Sign Up
        </RouterLink>
      </p>
      </form>
    </div>
  </AuthShell>
</template>
