<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ShieldCheck, TimerReset } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import AuthShell from '@/components/AuthShell.vue'
import { ApiError } from '@/lib/api'
import { isTransientRequestError } from '@/lib/errors'
import { authService, extractAuthSession } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import { useFormFieldStates } from '@/composables/useFormFieldStates'

const authStore = useAuthStore()
const router = useRouter()

const otp = ref('')
const otpDigits = ref(['', '', '', '', '', ''])
const isSubmitting = ref(false)
const isResendingOtp = ref(false)
const {
  getFieldAttrs,
  getFieldError,
  setFieldError,
  setApiFieldErrors,
  clearFieldError,
  clearFieldErrors,
} = useFormFieldStates<'otp' | 'otpCode' | 'verificationCode'>()

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
} else if (!authStore.signUpDraft.signUpDetailsCompleted) {
  router.replace('/auth/signup/details')
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
    setFieldError('otp', 'Enter the 6-digit OTP first.')
    return
  }

  isSubmitting.value = true
  clearFieldErrors()
  const loadingToastId = toast.loading('Verifying your email...', {
    description: 'Please wait while we confirm your OTP.',
  })

  try {
    await authService.verifyOtp({
      email: authStore.signUpDraft.email,
      otpCode: otp.value,
    })

    await authService.setRegistrationPassword({
      email: authStore.signUpDraft.email,
      password: authStore.signUpDraft.password,
    })

    const response = await authService.completeRegistration({
      email: authStore.signUpDraft.email,
      name: authStore.signUpDraft.name,
      onboarding: {
        acceptedTerms: authStore.signUpDraft.acceptedTerms,
        is16OrAbove: authStore.signUpDraft.is16OrAbove,
        state: authStore.signUpDraft.state,
        country: authStore.signUpDraft.country,
        accountType: authStore.signUpDraft.accountType,
        ...(authStore.signUpDraft.accountType === 'student'
          ? {
              university: authStore.signUpDraft.university,
              yearStarted: authStore.signUpDraft.yearStarted,
              courseOfStudy: authStore.signUpDraft.courseOfStudy,
            }
          : {
              jobTitle: authStore.signUpDraft.jobTitle,
              workplace: authStore.signUpDraft.workplace,
            }),
      },
    })

    authStore.signUpDraft.emailVerified = true

    const session = extractAuthSession(response)
    if (session) {
      authStore.setAuthenticatedSession(session.token, session.userId)
    }
    authStore.setOnboardingRequired(false)
    if (response.data?.user) {
      authStore.setCurrentUser(response.data.user)
    }
    if (response.data?.profile) {
      authStore.setUserProfile(response.data.profile)
    }

    toast.success('Email verified', {
      id: loadingToastId,
      description: 'Your account has been verified successfully and your registration is complete.',
    })

    router.replace('/feed')
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : 'We could not verify that code. Please try again.'

    if (!setApiFieldErrors(error) && !isTransientRequestError(error)) {
      setFieldError('otp', message)
    }

    toast.error('Verification failed', {
      id: loadingToastId,
      description: message,
    })
  } finally {
    isSubmitting.value = false
  }
}

const syncOtpFromDigits = () => {
  otp.value = otpDigits.value.join('')
}

const focusOtpInput = (index: number) => {
  const input = document.querySelector<HTMLInputElement>(`[data-otp-index="${index}"]`)
  input?.focus()
  input?.select()
}

const handleOtpInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value.replace(/\D/g, '')

  if (!value) {
    otpDigits.value[index] = ''
    syncOtpFromDigits()
    clearFieldError('otp')
    return
  }

  if (value.length > 1) {
    value
      .slice(0, 6 - index)
      .split('')
      .forEach((digit, offset) => {
        otpDigits.value[index + offset] = digit
      })
    syncOtpFromDigits()
    clearFieldError('otp')
    focusOtpInput(Math.min(index + value.length, 5))
    return
  }

  otpDigits.value[index] = value
  syncOtpFromDigits()
  clearFieldError('otp')

  if (index < 5) {
    focusOtpInput(index + 1)
  }
}

const handleOtpKeydown = (index: number, event: KeyboardEvent) => {
  if (event.key !== 'Backspace' || otpDigits.value[index]) {
    return
  }

  if (index > 0) {
    focusOtpInput(index - 1)
  }
}

const handleOtpPaste = (index: number, event: ClipboardEvent) => {
  const value = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6 - index) ?? ''

  if (!value) {
    return
  }

  event.preventDefault()
  value.split('').forEach((digit, offset) => {
    otpDigits.value[index + offset] = digit
  })
  syncOtpFromDigits()
  focusOtpInput(Math.min(index + value.length, 5))
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
    const response = await authService.resendRegistrationOtp(authStore.signUpDraft.email)
    authStore.signUpDraft.verificationSentAt = new Date().toISOString()
    otp.value = ''
    otpDigits.value = ['', '', '', '', '', '']

    toast.success('OTP sent again', {
      id: loadingToastId,
      description:
        response.message || 'Check your email for the new verification code.',
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
    badge="Step 3 of 3"
    title="Verify your email before we finish creating your account."
    description="We sent a one-time passcode to your inbox so we can confirm the address belongs to you."
  >
    <div class="relative mx-auto flex w-full max-w-md flex-col justify-center rounded-[1.75rem] sm:max-w-md">
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[1.75rem]">
        <div class="absolute -left-8 top-8 h-24 w-24 rounded-3xl bg-[var(--accent-soft)]" />
        <div class="absolute right-2 top-14 h-20 w-20 rounded-full border border-[color:var(--accent)] bg-[var(--surface-muted)]" />
        <div class="absolute -right-10 bottom-8 h-28 w-28 rotate-12 rounded-[2rem] bg-[var(--accent-soft)]" />
      </div>

      <div class="mb-5 flex justify-center sm:mb-6">
        <div class="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
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
          <div class="grid grid-cols-6 gap-2 sm:gap-3">
            <input
              v-for="(_, index) in otpDigits"
              :key="index"
              :data-otp-index="index"
              :value="otpDigits[index]"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="1"
              required
              v-bind="getFieldAttrs('otp')"
              class="h-12 min-w-0 rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] text-center text-lg font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)] sm:h-13"
              @input="handleOtpInput(index, $event)"
              @keydown="handleOtpKeydown(index, $event)"
              @paste="handleOtpPaste(index, $event)"
            />
          </div>
          <p v-if="getFieldError('otp')" class="input-feedback input-feedback--error">
            {{ getFieldError('otp') }}
          </p>
        </div>

        <div class="rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--text-secondary)]">
          <p class="font-semibold text-[var(--text-primary)]">Check your inbox</p>
          <p class="mt-1">You will receive a one-time password at your email address. Please enter it above to complete verification.</p>
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
