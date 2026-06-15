<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AuthShell from '@/components/AuthShell.vue'
import { ApiError } from '@/lib/api'
import { authService, extractAuthSession } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import { resolveGoogleOnboardingRedirect } from '@/utils/googleOnboarding'
import { usePasswordToggle } from '@/composables/usePasswordToggle'
import { isGoogleClientConfigured, requestGoogleIdToken } from '@/composables/useGoogleAuth'
import { useFormFieldStates } from '@/composables/useFormFieldStates'

const authStore = useAuthStore()
const router = useRouter()
const isSubmitting = ref(false)
const isRedirectingToGoogle = ref(false)
const passwordToggle = usePasswordToggle()
const {
  getFieldAttrs,
  getFieldError,
  setApiFieldErrors,
  clearFieldError,
  clearFieldErrors,
} = useFormFieldStates<'name' | 'email' | 'password' | 'acceptedTerms'>()

const form = ref({
  name: authStore.signUpDraft.name,
  email: authStore.signUpDraft.email,
  password: authStore.signUpDraft.password,
  rememberMe: authStore.signUpDraft.rememberMe,
  acceptedTerms: authStore.signUpDraft.acceptedTerms,
})

const continueSignUp = async () => {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  clearFieldErrors()
  const loadingToastId = toast.loading('Creating your account...', {
    description: 'Please wait while we send your verification code.',
  })

  authStore.signUpDraft.name = form.value.name
  authStore.signUpDraft.email = form.value.email
  authStore.signUpDraft.password = form.value.password
  authStore.signUpDraft.rememberMe = form.value.rememberMe
  authStore.signUpDraft.acceptedTerms = form.value.acceptedTerms
  authStore.signUpDraft.signUpDetailsCompleted = false
  authStore.signUpDraft.emailVerified = false
  authStore.signUpDraft.verificationCode = ''
  authStore.signUpDraft.verificationSentAt = ''

  try {
    const response = await authService.sendRegistrationOtp(form.value.email)

    authStore.signUpDraft.verificationSentAt = new Date().toISOString()

    toast.success('Verification code sent', {
      id: loadingToastId,
      description:
        response.message || 'Check your email for the OTP to continue. Redirecting now.',
    })

    router.push('/auth/signup/details')
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'We could not start your registration. Please try again.'

    setApiFieldErrors(error)

    toast.error('Sign up failed', {
      id: loadingToastId,
      description: message,
    })
  } finally {
    isSubmitting.value = false
  }
}

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
  <AuthShell
    :centered="true"
    badge="Step 1 of 3"
    title="Build your account and join the platform properly."
    description="Start with your essentials, add your onboarding details, then verify your email with an OTP."
  >
    <div class="relative mx-auto flex w-full max-w-md flex-col justify-center overflow-hidden rounded-[1.75rem] sm:max-w-md">
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[1.75rem]">
        <div class="absolute -left-10 top-8 h-28 w-28 rotate-12 rounded-3xl bg-(--accent-soft)" />
        <div class="absolute right-4 top-16 h-16 w-16 rounded-full border border-(--accent) bg-(--surface-muted)" />
        <div class="absolute -right-8 bottom-10 h-24 w-24 rotate-45 rounded-2xl bg-(--accent-soft)" />
        <div class="absolute bottom-5 left-6 h-0 w-0 border-x-20 border-b-34 border-x-(--surface-primary) border-b-(--accent-soft)" />
      </div>

      <div class="mb-5 flex justify-center sm:mb-6">
        <img loading="eager" decoding="async" fetchpriority="high" src="/logo_1.svg" alt="Skills4Export logo" class="h-14 w-auto sm:h-16" />
      </div>

      <p class="mb-4 text-center text-xl font-semibold tracking-[0.04em] text-(--accent-strong) sm:text-2xl">
        Sign Up
      </p>

      <form class="space-y-3.5 sm:space-y-4" @submit.prevent="continueSignUp">
        <div class="space-y-2">
          <label class="text-sm font-semibold text-(--text-primary) sm:text-base">Full Name</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="Your full name"
            v-bind="getFieldAttrs('name')"
            class="h-12 w-full rounded-2xl border border-(--border-soft) bg-(--surface-secondary) px-4 text-sm outline-none transition focus:border-(--accent) sm:h-13 sm:text-base"
            @input="clearFieldError('name')"
          />
          <p v-if="getFieldError('name')" class="input-feedback input-feedback--error">
            {{ getFieldError('name') }}
          </p>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-(--text-primary) sm:text-base">Email address</label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="you@example.com"
            v-bind="getFieldAttrs('email')"
            class="h-12 w-full rounded-2xl border border-(--border-soft) bg-(--surface-secondary) px-4 text-sm outline-none transition focus:border-(--accent) sm:h-13 sm:text-base"
            @input="clearFieldError('email')"
          />
          <p v-if="getFieldError('email')" class="input-feedback input-feedback--error">
            {{ getFieldError('email') }}
          </p>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-(--text-primary) sm:text-base">Password</label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="passwordToggle.getInputType()"
              required
              minlength="8"
              placeholder="Create a secure password"
              v-bind="getFieldAttrs('password')"
              class="h-12 w-full rounded-2xl border border-(--border-soft) bg-(--surface-secondary) px-4 pr-12 text-sm outline-none transition focus:border-(--accent) sm:h-13 sm:text-base"
              @input="clearFieldError('password')"
            />
            <button
              type="button"
              @click="passwordToggle.togglePasswordVisibility()"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-(--text-tertiary) hover:text-(--text-secondary) transition"
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
          <p v-if="getFieldError('password')" class="input-feedback input-feedback--error">
            {{ getFieldError('password') }}
          </p>
        </div>

        <div class="flex flex-col gap-5 pt-1 text-sm text-(--text-secondary) sm:text-base">
          <label class="flex items-center gap-3">
            <input
              v-model="form.rememberMe"
              type="checkbox"
              class="h-4 w-4 accent-(--accent)"
            />
            <span>Remember me</span>
          </label>

          <label class="flex items-start gap-3">
            <input
              v-model="form.acceptedTerms"
              type="checkbox"
              required
              class="mt-1 h-4 w-4 accent-(--accent)"
            />
            <span>
              I accept the
              <RouterLink class="font-semibold text-(--accent-strong)" to="/terms-and-conditions">
                Terms & Conditions
              </RouterLink>
            </span>
          </label>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-(--accent) text-sm font-semibold text-white transition hover:bg-(--accent-strong) sm:h-13 sm:text-base"
        >
          {{ isSubmitting ? 'Sending verification...' : 'Continue to details' }}
        </button>

        <div class="flex items-center gap-4 pt-1">
          <span class="h-px flex-1 bg-(--border-soft)" />
          <span class="text-sm font-semibold uppercase tracking-[0.22em] text-(--text-tertiary)">
            Continue with
          </span>
          <span class="h-px flex-1 bg-(--border-soft)" />
        </div>

        <button
          type="button"
          :disabled="isRedirectingToGoogle || isSubmitting"
          class="inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-(--border-soft) bg-(--surface-secondary) text-sm font-semibold text-(--text-primary) transition hover:border-(--accent-soft) sm:h-13 sm:text-base"
          @click="signUpWithGoogle"
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

        <p class="pt-2 text-center text-sm text-(--text-secondary) sm:text-base">
          Already have an account?
          <RouterLink class="font-semibold text-(--accent-strong)" to="/auth/login">
            Sign in
          </RouterLink>
        </p>
      </form>
    </div>
  </AuthShell>
</template>
