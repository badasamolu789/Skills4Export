<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, BriefcaseBusiness } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import AuthShell from '@/components/AuthShell.vue'
import { ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { syncSignUpDetailsToProfile } from '@/utils/signupProfile'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const isSubmitting = ref(false)

const currentYear = new Date().getFullYear()
const yearStartedOptions = Array.from({ length: 50 }, (_, index) => String(currentYear - index))

const form = ref({
  is16OrAbove: authStore.signUpDraft.is16OrAbove,
  accountType: authStore.signUpDraft.accountType,
  state: authStore.signUpDraft.state,
  country: authStore.signUpDraft.country,
  jobTitle: authStore.signUpDraft.jobTitle,
  workplace: authStore.signUpDraft.workplace,
  university: authStore.signUpDraft.university,
  yearStarted: authStore.signUpDraft.yearStarted,
  courseOfStudy: authStore.signUpDraft.courseOfStudy,
})

const isGoogleOnboarding = computed(() => Boolean(authStore.authToken && authStore.onboardingRequired))
const canAccessDetails = computed(() => {
  if (isGoogleOnboarding.value) {
    return true
  }

  return Boolean(
    authStore.signUpDraft.name &&
      authStore.signUpDraft.email &&
      authStore.signUpDraft.password &&
      authStore.signUpDraft.acceptedTerms &&
      authStore.signUpDraft.verificationSentAt,
  )
})

if (!canAccessDetails.value) {
  router.replace('/auth/signup')
}

const isStudentAccount = computed(() => form.value.accountType === 'student')

const canSubmit = computed(() => {
  if (!form.value.is16OrAbove) {
    return false
  }

  if (!form.value.state.trim() || !form.value.country.trim()) {
    return false
  }

  if (isStudentAccount.value) {
    return Boolean(
      form.value.university.trim() &&
        form.value.yearStarted &&
        form.value.courseOfStudy.trim(),
    )
  }

  return Boolean(
    form.value.jobTitle.trim() &&
      form.value.workplace.trim(),
  )
})

const persistDraftDetails = () => {
  const state = form.value.state.trim()
  const country = form.value.country.trim()

  authStore.signUpDraft.is16OrAbove = form.value.is16OrAbove
  authStore.signUpDraft.accountType = form.value.accountType
  authStore.signUpDraft.state = state
  authStore.signUpDraft.country = country
  authStore.signUpDraft.jobTitle = form.value.jobTitle.trim()
  authStore.signUpDraft.workplace = form.value.workplace.trim()
  authStore.signUpDraft.university = form.value.university.trim()
  authStore.signUpDraft.yearStarted = form.value.yearStarted
  authStore.signUpDraft.courseOfStudy = form.value.courseOfStudy.trim()
  authStore.signUpDraft.location = [state, country].filter(Boolean).join(', ')
  authStore.signUpDraft.headline = ''
  authStore.signUpDraft.signUpDetailsCompleted = true
}

const completeGoogleOnboarding = async () => {
  await syncSignUpDetailsToProfile(authStore)
  authStore.setOnboardingRequired(false)
}

const submitDetails = async () => {
  if (isSubmitting.value) {
    return
  }

  if (!canSubmit.value) {
    toast.error('Complete the required details before continuing.')
    return
  }

  isSubmitting.value = true

  try {
    persistDraftDetails()

    if (isGoogleOnboarding.value) {
      await completeGoogleOnboarding()

      toast.success('Profile setup complete', {
        description: 'You can now continue to your workspace.',
      })

      const redirectTarget =
        typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
          ? route.query.redirect
          : '/feed'

      router.replace(redirectTarget)
      return
    }

    router.push('/auth/signup/verify')
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'We could not save your details. Please try again.'

    toast.error('Setup details not saved', {
      description: message,
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthShell
    :badge="isGoogleOnboarding ? 'Step 2 of 2' : 'Step 2 of 3'"
    title="Tell us where you fit on the platform."
    :description="isGoogleOnboarding ? 'These details finish your Google account setup before entering the app.' : 'These details help shape profile setup, discovery, jobs, and recommendations after verification.'"
    centered
  >
    <form class="space-y-5" @submit.prevent="submitDetails">
      <div class="px-1">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
          {{ isGoogleOnboarding ? 'Step 2 of 2' : 'Step 2 of 3' }}
        </p>
        <h1 class="mt-2 text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
          Tell us where you fit on the platform.
        </h1>
        <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Add your location, then choose the account type that fits you.
        </p>
      </div>

      <label class="flex items-start gap-3 rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4 text-sm font-semibold text-[var(--text-primary)]">
        <input
          v-model="form.is16OrAbove"
          type="checkbox"
          required
          class="mt-1 h-4 w-4 accent-[var(--accent)]"
        />
        <span>I am 16 or above.</span>
      </label>

      <div class="space-y-3">
        <p class="text-sm font-semibold text-[var(--text-primary)]">Location</p>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-semibold text-[var(--text-primary)]">State</label>
            <input
              v-model="form.state"
              type="text"
              required
              placeholder="e.g. Lagos"
              class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-semibold text-[var(--text-primary)]">Country</label>
            <input
              v-model="form.country"
              type="text"
              required
              placeholder="e.g. Nigeria"
              class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
            />
          </div>
        </div>
      </div>

      <div class="border-b border-[color:var(--border-soft)]">
        <p class="mb-2 text-sm font-semibold text-[var(--text-primary)]">Account type</p>
        <div class="flex items-center gap-8">
          <button
            type="button"
            class="relative inline-flex h-11 items-center justify-center gap-2 text-sm font-semibold transition"
            :class="form.accountType === 'default' ? 'text-[var(--accent-strong)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'"
            @click="form.accountType = 'default'"
          >
            <BriefcaseBusiness class="h-4 w-4" />
            Default
            <span
              v-if="form.accountType === 'default'"
              class="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--accent)]"
            />
          </button>
          <button
            type="button"
            class="relative inline-flex h-11 items-center justify-center gap-2 text-sm font-semibold transition"
            :class="form.accountType === 'student' ? 'text-[var(--accent-strong)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'"
            @click="form.accountType = 'student'"
          >
            <BookOpen class="h-4 w-4" />
            Student
            <span
              v-if="form.accountType === 'student'"
              class="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[var(--accent)]"
            />
          </button>
        </div>
      </div>

      <div v-if="!isStudentAccount" class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2 sm:col-span-2">
          <label class="text-sm font-semibold text-[var(--text-primary)]">Current job title</label>
          <input
            v-model="form.jobTitle"
            type="text"
            required
            placeholder="e.g. Product Designer"
            class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </div>

        <div class="space-y-2 sm:col-span-2">
          <label class="text-sm font-semibold text-[var(--text-primary)]">Current place of work</label>
          <input
            v-model="form.workplace"
            type="text"
            required
            placeholder="e.g. Skills4Export"
            class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2 sm:col-span-2">
          <label class="text-sm font-semibold text-[var(--text-primary)]">College or University</label>
          <input
            v-model="form.university"
            type="text"
            required
            placeholder="e.g. University of Lagos"
            class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-[var(--text-primary)]">Year started</label>
          <select
            v-model="form.yearStarted"
            required
            class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          >
            <option value="">Select year</option>
            <option v-for="year in yearStartedOptions" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-[var(--text-primary)]">Course of study</label>
          <input
            v-model="form.courseOfStudy"
            type="text"
            required
            placeholder="e.g. Computer Science"
            class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <button
        type="submit"
        :disabled="!canSubmit || isSubmitting"
        class="inline-flex h-13 w-full items-center justify-center rounded-2xl bg-[var(--accent)] text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
      >
        {{ isSubmitting ? 'Saving details...' : isGoogleOnboarding ? 'Finish setup' : 'Continue to verification' }}
      </button>
    </form>
  </AuthShell>
</template>
