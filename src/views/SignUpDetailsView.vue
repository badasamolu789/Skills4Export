<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { BriefcaseBusiness, MapPin, Sparkles } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import AuthShell from '@/components/AuthShell.vue'
import { ApiError } from '@/lib/api'
import { authService, extractUserId } from '@/services/auth'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const isSubmitting = ref(false)

const interestOptions = ['Community', 'Jobs', 'Referrals', 'Contests', 'Learning', 'Alerts']

const form = ref({
  username: authStore.signUpDraft.username,
  phone: authStore.signUpDraft.phone,
  location: authStore.signUpDraft.location,
  headline: authStore.signUpDraft.headline,
  interests: [...authStore.signUpDraft.interests],
})

const canAccessDetails = computed(
  () =>
    Boolean(
      authStore.signUpDraft.name &&
        authStore.signUpDraft.email &&
        authStore.signUpDraft.password &&
        authStore.signUpDraft.emailVerified,
    ),
)

if (!canAccessDetails.value) {
  router.replace('/auth/signup/verify')
}

const canSubmit = computed(
  () =>
    Boolean(form.value.username && form.value.location && form.value.headline) &&
    form.value.interests.length > 0,
)

const toggleInterest = (interest: string) => {
  if (form.value.interests.includes(interest)) {
    form.value.interests = form.value.interests.filter((item) => item !== interest)
    return
  }

  form.value.interests.push(interest)
}

const resolveUserId = async () => {
  if (authStore.userId) {
    return authStore.userId
  }

  if (!authStore.authToken) {
    return ''
  }

  const response = await authService.getCurrentUser(authStore.authToken)
  const id = extractUserId(response)

  if (id) {
    authStore.setUserId(id)
  }

  return id
}

const submitDetails = async () => {
  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  const loadingToastId = toast.loading('Saving your profile...', {
    description: 'Please wait while we finish setting up your account.',
  })

  authStore.signUpDraft.username = form.value.username
  authStore.signUpDraft.phone = form.value.phone
  authStore.signUpDraft.location = form.value.location
  authStore.signUpDraft.headline = form.value.headline
  authStore.signUpDraft.interests = form.value.interests

  try {
    const id = await resolveUserId()

    if (id) {
      const payload = {
        username: form.value.username,
        bio: form.value.headline,
        location: form.value.location,
        avatar: null,
        banner: null,
        website: '',
        linkedin: '',
        github: '',
      }

      let profileResponse

      try {
        profileResponse = await usersService.createUserProfile(id, payload, authStore.authToken)
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 409)) {
          throw error
        }

        profileResponse = await usersService.updateUserProfile(id, payload, authStore.authToken)
      }

      authStore.setUserProfile(profileResponse.data ?? null)
    }

    authStore.isAuthenticated = true

    toast.success('Account setup complete', {
      id: loadingToastId,
      description: 'Your profile details have been saved successfully.',
    })

    router.push('/auth/signup/success')
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'We could not save your profile details.'

    toast.error('Unable to complete sign up', {
      id: loadingToastId,
      description: message,
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthShell
    badge="Step 3 of 3"
    title="Finish your profile with the details that actually matter."
    description="This step captures the richer information we’ll need later for onboarding, visibility, recommendations, and account tools."
  >
    <template #aside>
      <div class="rounded-[1.5rem] bg-[var(--surface-secondary)] p-5">
        <p class="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <Sparkles class="h-4 w-4 text-[var(--accent-strong)]" />
          Why these details
        </p>
        <ul class="mt-4 space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
          <li>Your public handle helps people recognize you in the community.</li>
          <li>Location and headline support jobs, referrals, and relevance.</li>
          <li>Interest areas help shape alerts, recommendations, and engagement.</li>
        </ul>
      </div>
    </template>

    <form class="space-y-5" @submit.prevent="submitDetails">
      <div class="grid gap-5 sm:grid-cols-2">
        <div class="space-y-2">
          <label class="text-sm font-semibold text-[var(--text-primary)]">Username</label>
          <input
            v-model="form.username"
            type="text"
            required
            placeholder="@yourhandle"
            class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-semibold text-[var(--text-primary)]">Phone number</label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="+234..."
            class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-semibold text-[var(--text-primary)]">Location</label>
        <div class="relative">
          <MapPin class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            v-model="form.location"
            type="text"
            required
            placeholder="City, Country"
            class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] pl-11 pr-4 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-semibold text-[var(--text-primary)]">Professional headline</label>
        <div class="relative">
          <BriefcaseBusiness class="pointer-events-none absolute left-4 top-5 h-4 w-4 text-[var(--text-tertiary)]" />
          <textarea
            v-model="form.headline"
            required
            rows="4"
            placeholder="Tell people what you do, what you care about, or what you’re looking for."
            class="w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] pl-11 pr-4 pt-4 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-semibold text-[var(--text-primary)]">Interest areas</label>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="interest in interestOptions"
            :key="interest"
            type="button"
            class="rounded-full border px-4 py-2 text-sm font-semibold transition"
            :class="
              form.interests.includes(interest)
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[color:var(--border-soft)] bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
            "
            @click="toggleInterest(interest)"
          >
            {{ interest }}
          </button>
        </div>
      </div>

      <button
        type="submit"
        :disabled="!canSubmit || isSubmitting"
        class="inline-flex h-13 w-full items-center justify-center rounded-2xl bg-[var(--accent)] text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
      >
        {{ isSubmitting ? 'Completing sign up...' : 'Complete sign up' }}
      </button>
    </form>
  </AuthShell>
</template>
