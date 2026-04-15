<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { CheckCheck, Sparkles } from 'lucide-vue-next'
import AuthShell from '@/components/AuthShell.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const hasCompletedSignUp = computed(
  () =>
    Boolean(
      authStore.isAuthenticated &&
        authStore.signUpDraft.name &&
        authStore.signUpDraft.email &&
        authStore.signUpDraft.emailVerified,
    ),
)

if (!hasCompletedSignUp.value) {
  router.replace('/auth/signup')
}
</script>

<template>
  <AuthShell
    :centered="true"
    badge="Account Created"
    title="Your account is ready."
    description="Everything is set up and your email has been verified successfully in this signup flow."
  >
    <div class="relative mx-auto flex w-full max-w-md flex-col items-center overflow-hidden rounded-[1.75rem] px-1 py-2 text-center">
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[1.75rem]">
        <div class="absolute left-4 top-6 h-20 w-20 rounded-full bg-(--accent)/10 blur-xl" />
        <div class="absolute right-2 top-16 h-24 w-24 rounded-4xl bg-(--accent)/8" />
        <div class="absolute bottom-2 left-1/2 h-28 w-28 -translate-x-1/2 rounded-full bg-(--accent)/8 blur-2xl" />
      </div>

      <div class="flex h-18 w-18 items-center justify-center rounded-full bg-(--accent) text-white shadow-[0_18px_40px_-18px_rgba(124,110,255,0.9)]">
        <CheckCheck class="h-9 w-9" />
      </div>

      <div class="mt-6 space-y-3">
        <p class="text-2xl font-semibold text-(--text-primary)">Welcome, {{ authStore.signUpDraft.name }}</p>
        <p class="text-sm leading-7 text-(--text-secondary) sm:text-base">
          Your account has been created successfully. You can head into the platform now and start exploring jobs, community conversations, and referrals.
        </p>
      </div>

      <div class="mt-6 w-full rounded-3xl border border-(--border-soft) bg-(--surface-secondary) p-4 text-left">
        <p class="flex items-center gap-2 text-sm font-semibold text-(--text-primary)">
          <Sparkles class="h-4 w-4 text-(--accent-strong)" />
          What is ready
        </p>
        <ul class="mt-3 space-y-2 text-sm text-(--text-secondary)">
          <li>Email verified for {{ authStore.signUpDraft.email }}</li>
          <li>Your account session is now active on this device</li>
          <li>You can now explore jobs, referrals, and community activity</li>
        </ul>
      </div>

      <div class="mt-6 flex w-full flex-col gap-3 sm:flex-row">
        <RouterLink
          to="/"
          class="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-(--accent) px-4 text-sm font-semibold text-white transition hover:bg-(--accent-strong)"
        >
          Go to home
        </RouterLink>
        <RouterLink
          to="/jobs"
          class="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-(--border-soft) bg-(--surface-secondary) px-4 text-sm font-semibold text-(--text-primary) transition hover:border-(--accent-soft)"
        >
          Browse jobs
        </RouterLink>
      </div>
    </div>
  </AuthShell>
</template>
