<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AuthShell from '@/components/AuthShell.vue'
import { ApiError } from '@/lib/api'
import { authService } from '@/services/auth'
import { usePasswordToggle } from '@/composables/usePasswordToggle'

const route = useRoute()
const router = useRouter()

const email = computed(() => {
  const value = route.query.email
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
})

const token = computed(() => {
  const value = route.query.token
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '')
})

const isResetLinkFlow = computed(() => Boolean(email.value && token.value))

const requestForm = ref({
  email: email.value,
})

const resetForm = ref({
  newPassword: '',
  confirmPassword: '',
})

const newPasswordToggle = usePasswordToggle()
const confirmPasswordToggle = usePasswordToggle()

const isRequestingOtp = ref(false)
const isResettingPassword = ref(false)

const badge = computed(() => (isResetLinkFlow.value ? 'Step 2 of 2' : 'Step 1 of 2'))
const title = computed(() =>
  isResetLinkFlow.value
    ? 'Choose a new password after opening your secure reset link.'
    : 'Start your password reset by requesting a secure reset link.',
)
const description = computed(() =>
  isResetLinkFlow.value
    ? 'We verified your reset link. Set a new password below and use it the next time you sign in.'
    : 'Enter the email tied to your account and we will send a password reset link with a secure token.',
)
const panelHeading = computed(() =>
  isResetLinkFlow.value ? 'Create New Password' : 'Request Reset Link',
)

const canSubmitReset = computed(
  () =>
    Boolean(resetForm.value.newPassword && resetForm.value.confirmPassword) &&
    resetForm.value.newPassword === resetForm.value.confirmPassword,
)

const requestResetLink = async () => {
  if (isRequestingOtp.value) {
    return
  }

  isRequestingOtp.value = true
  const loadingToastId = toast.loading('Sending reset link...', {
    description: 'Please wait while we prepare your password reset email.',
  })

  try {
    await authService.forgotPassword(requestForm.value.email)

    toast.success('Reset link sent', {
      id: loadingToastId,
      description: `Check ${requestForm.value.email} for your secure password reset link.`,
    })
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : 'We could not send the reset link. Please try again.'

    toast.error('Unable to send reset link', {
      id: loadingToastId,
      description: message,
    })
  } finally {
    isRequestingOtp.value = false
  }
}

const submitReset = async () => {
  if (isResettingPassword.value) {
    return
  }

  if (!isResetLinkFlow.value) {
    toast.error('Reset link required', {
      description: 'Open the password reset link from your email to continue.',
    })
    return
  }

  if (resetForm.value.newPassword !== resetForm.value.confirmPassword) {
    toast.error('Passwords do not match', {
      description: 'Please make sure both password fields are the same.',
    })
    return
  }

  isResettingPassword.value = true
  const loadingToastId = toast.loading('Resetting your password...', {
    description: 'Please wait while we update your password.',
  })

  try {
    await authService.resetPassword({
      email: email.value,
      token: token.value || undefined,
      otp: token.value || undefined,
      password: resetForm.value.newPassword,
      password_confirmation: resetForm.value.confirmPassword,
    })

    toast.success('Password reset successful', {
      id: loadingToastId,
      description: 'You can now sign in with your new password. Redirecting to login.',
    })

    router.push('/auth/login')
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : 'We could not reset your password. Please try again.'

    toast.error('Reset failed', {
      id: loadingToastId,
      description: message,
    })
  } finally {
    isResettingPassword.value = false
  }
}
</script>

<template>
  <AuthShell
    :centered="true"
    :badge="badge"
    :title="title"
    :description="description"
  >
    <div class="relative mx-auto flex w-full max-w-md flex-col justify-center overflow-hidden rounded-[1.75rem] sm:max-w-md">
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[1.75rem]">
        <div class="absolute -left-10 top-8 h-28 w-28 rotate-12 rounded-3xl bg-(--accent-soft)" />
        <div class="absolute right-4 top-16 h-16 w-16 rounded-full border border-(--accent) bg-(--surface-muted)" />
        <div class="absolute -right-8 bottom-10 h-24 w-24 rotate-45 rounded-2xl bg-(--accent-soft)" />
        <div class="absolute bottom-5 left-6 h-0 w-0 border-x-20 border-b-34 border-x-(--surface-primary) border-b-(--accent-soft)" />
      </div>

      <div class="mb-5 flex justify-center sm:mb-6">
        <img src="/logo_1.svg" alt="Skills4Export logo" class="h-10 w-auto sm:h-12" />
      </div>

      <p class="mb-4 text-center text-xl tracking-[0.08em] text-(--accent-strong) sm:text-2xl">
        {{ panelHeading }}
      </p>

      <form
        v-if="!isResetLinkFlow"
        class="space-y-3.5 sm:space-y-4"
        @submit.prevent="requestResetLink"
      >
        <div class="space-y-2">
          <label class="text-sm font-semibold text-(--text-primary) sm:text-base">Email address</label>
          <input
            v-model="requestForm.email"
            type="email"
            required
            placeholder="you@example.com"
            class="h-12 w-full rounded-2xl border border-(--border-soft) bg-(--surface-secondary) px-4 text-sm outline-none transition focus:border-(--accent) sm:h-13 sm:text-base"
          />
        </div>

        <button
          type="submit"
          :disabled="isRequestingOtp"
          class="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--accent) text-sm font-semibold text-white transition hover:bg-[var(--accent-strong) disabled:cursor-not-allowed disabled:bg-(--accent-soft) sm:h-13 sm:text-base"
        >
          {{ isRequestingOtp ? 'Sending reset link...' : 'Continue to email check' }}
        </button>

        <div class="rounded-2xl border border-(--border-soft) bg-(--surface-secondary) p-4 text-sm text-(--text-secondary)">
          Once the email arrives, open the reset link inside it to continue to the password change screen.
        </div>

        <p class="pt-2 text-center text-sm text-(--text-secondary) sm:text-base">
          Remembered your password?
          <RouterLink class="font-semibold text-(--accent-strong)" to="/auth/login">
            Sign in
          </RouterLink>
        </p>
      </form>

      <form v-else class="space-y-3.5 sm:space-y-4" @submit.prevent="submitReset">
        <div class="rounded-2xl border border-(--border-soft) bg-(--surface-secondary)] p-4 text-sm text-(--text-secondary)">
          This reset link is for
          <span class="font-semibold text-(--text-primary)">{{ email }}</span>.
          Set your new password below to complete the reset.
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-(--text-primary) sm:text-base">New password</label>
          <div class="relative">
            <input
              v-model="resetForm.newPassword"
              :type="newPasswordToggle.getInputType()"
              required
              minlength="8"
              placeholder="Enter your new password"
              class="h-12 w-full rounded-2xl border border-(--border-soft) bg-(--surface-secondary) px-4 pr-12 text-sm outline-none transition focus:border-(--accent) sm:h-13 sm:text-base"
            />
            <button
              type="button"
              @click="newPasswordToggle.togglePasswordVisibility()"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-(--text-tertiary) hover:text-(--text-secondary) transition"
              :aria-label="newPasswordToggle.showPassword.value ? 'Hide password' : 'Show password'"
            >
              <svg v-if="newPasswordToggle.showPassword.value" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

        <div class="space-y-2">
          <label class="text-sm font-semibold text-(--text-primary) sm:text-base">Confirm new password</label>
          <div class="relative">
            <input
              v-model="resetForm.confirmPassword"
              :type="confirmPasswordToggle.getInputType()"
              required
              minlength="8"
              placeholder="Re-enter your new password"
              class="h-12 w-full rounded-2xl border border-(--border-soft) bg-(--surface-secondary) px-4 pr-12 text-sm outline-none transition focus:border-(--accent) sm:h-13 sm:text-base"
            />
            <button
              type="button"
              @click="confirmPasswordToggle.togglePasswordVisibility()"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-(--text-tertiary) hover:text-(--text-secondary) transition"
              :aria-label="confirmPasswordToggle.showPassword.value ? 'Hide password' : 'Show password'"
            >
              <svg v-if="confirmPasswordToggle.showPassword.value" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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

        <button
          type="submit"
          :disabled="isResettingPassword || !canSubmitReset"
          class="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-(--accent) text-sm font-semibold text-white transition hover:bg-(--accent-strong) disabled:cursor-not-allowed disabled:bg-(--accent-soft) sm:h-13 sm:text-base"
        >
          {{ isResettingPassword ? 'Resetting password...' : 'Reset password' }}
        </button>

        <p class="pt-2 text-center text-sm text-(--text-secondary) sm:text-base">
          Need a fresh link?
          <RouterLink class="font-semibold text-(--accent-strong)" to="/auth/forgot-password">
            Request another one
          </RouterLink>
        </p>
      </form>
    </div>
  </AuthShell>
</template>
