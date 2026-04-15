<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ShieldCheck, TimerReset } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import AuthShell from '@/components/AuthShell.vue'
import { ApiError } from '@/lib/api'
import { authService, extractAuthSession } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const otp = ref('')
const isSubmitting = ref(false)
const isResendingOtp = ref(false)

const hasAccountBasics = computed(
  () =>
    Boolean(
      authStore.signUpDraft.name &&
        authStore.signUpDraft.email &&
        authStore.signUpDraft.password &&
        authStore.signUpDraft.acceptedTerms,
    ),
)

if (!hasAccountBasics.value) {
  router.replace('/auth/signup')
}

const maskedEmail = computed(() => {
  const email = authStore.signUpDraft.email
  const [localPart = '', domain = ''] = email.split('@')

  if (!localPart || !domain) {
    return email
  }

  const visibleStart = localPart.slice(0, 2)
  const maskedLength = Math.max(localPart.length - 2, 2)

  return `${visibleStart}${'*'.repeat(maskedLength)}@${domain}`
})

const verifyOtp = async () => {
  if (isSubmitting.value) {
    return
  }

  if (otp.value.length !== 6) {
    toast.error('Enter the 6-digit OTP first.')
    return
  }

  isSubmitting.value = true
  const loadingToastId = toast.loading('Verifying your email...', {
    description: 'Please wait while we confirm your OTP.',
  })

  try {
    const response = await authService.verifyOtp({
      email: authStore.signUpDraft.email,
      otpCode: otp.value,
    })

    authStore.signUpDraft.emailVerified = true

    const session = extractAuthSession(response)
    if (session) {
      authStore.setAuthenticatedSession(session.token, session.userId)
    }
    authStore.isAuthenticated = true

    toast.success('Email verified', {
      id: loadingToastId,
      description: 'Your account has been verified successfully. Redirecting to the success screen.',
    })

    router.push('/auth/signup/success')
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : 'We could not verify that code. Please try again.'

    toast.error('Verification failed', {
      id: loadingToastId,
      description: message,
    })
  } finally {
    isSubmitting.value = false
  }
}

const resendOtp = async () => {
  if (isResendingOtp.value) {
    return
  }

  isResendingOtp.value = true
  const loadingToastId = toast.loading('Sending another OTP...', {
    description: 'Please wait while we request a fresh verification code.',
  })

  try {
    const response = await authService.requestOtp(authStore.signUpDraft.email, 'registration')
    authStore.signUpDraft.verificationSentAt = new Date().toISOString()
    otp.value = ''

    toast.success('OTP sent again', {
      id: loadingToastId,
      description:
        response.data?.message || response.message || 'Check your email for the new verification code.',
    })
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : 'We could not resend the OTP. Please try again.'

    toast.error('Unable to resend OTP', {
      id: loadingToastId,
      description: message,
    })
  } finally {
    isResendingOtp.value = false
  }
}
</script>

<template>
  <AuthShell
    :centered="true"
    badge="Step 2 of 2"
    title="Verify your email before we finish creating your account."
    description="We sent a one-time passcode to your inbox so we can confirm the address belongs to you."
  >
    <div class="relative mx-auto flex w-full max-w-md flex-col justify-center rounded-[1.75rem] sm:max-w-md">
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[1.75rem]">
        <div class="absolute -left-8 top-8 h-24 w-24 rounded-3xl bg-[var(--accent)]/8" />
        <div class="absolute right-2 top-14 h-20 w-20 rounded-full border border-[color:color-mix(in srgb,var(--accent) 25%,transparent)] bg-[var(--accent)]/6" />
        <div class="absolute -right-10 bottom-8 h-28 w-28 rotate-12 rounded-[2rem] bg-[var(--accent)]/7" />
      </div>

      <div class="mb-5 flex justify-center sm:mb-6">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/12 text-[var(--accent-strong)]">
          <ShieldCheck class="h-7 w-7" />
        </div>
      </div>

      <div class="space-y-2 text-center">
        <p class="text-xl tracking-[0.08em] text-[var(--accent-strong)] sm:text-2xl">Email Verification</p>
        <p class="text-sm text-[var(--text-secondary)] sm:text-base">
          Enter the 6-digit OTP sent to
          <span class="font-semibold text-[var(--text-primary)]">{{ maskedEmail }}</span>
        </p>
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="verifyOtp">
        <div class="space-y-2">
          <label class="text-sm font-semibold text-[var(--text-primary)] sm:text-base">One-time password</label>
          <input
            v-model="otp"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            required
            placeholder="123456"
            class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-center text-lg tracking-[0.45em] outline-none transition focus:border-[var(--accent)] sm:h-13"
          />
        </div>

        <div class="rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--text-secondary)]">
          <p class="font-semibold text-[var(--text-primary)]">Check your inbox</p>
          <p class="mt-1">Your backend now handles OTP delivery. Use the code sent to your email to complete verification.</p>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[var(--accent)] text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)] sm:h-13 sm:text-base"
        >
          {{ isSubmitting ? 'Verifying...' : 'Verify email' }}
        </button>

        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 text-sm text-[var(--text-secondary)]">
          <button
            type="button"
            :disabled="isResendingOtp || isSubmitting"
            class="inline-flex min-w-0 items-center gap-2 font-semibold text-[var(--accent-strong)]"
            @click="resendOtp"
          >
            <TimerReset class="h-4 w-4" />
            {{ isResendingOtp ? 'Sending...' : 'Resend OTP' }}
          </button>

          <RouterLink class="shrink-0 font-semibold text-[var(--accent-strong)]" to="/auth/signup">
            Change email
          </RouterLink>
        </div>
      </form>
    </div>
  </AuthShell>
</template>
