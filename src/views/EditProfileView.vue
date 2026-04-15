<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { AtSign, Mail, MapPin, Phone, Save, ShieldCheck, Sparkles, UserRound } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ApiError } from '@/lib/api'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const interestOptions = ['Community', 'Jobs', 'Referrals', 'Contests', 'Learning', 'Alerts']
const isSaving = ref(false)
const isLoadingProfile = ref(false)

const form = ref({
  name: authStore.signUpDraft.name || 'Samuel Bada',
  username: authStore.userProfile?.username || authStore.signUpDraft.username || 'samuelbada',
  email: authStore.signUpDraft.email || 'samuel@example.com',
  phone: authStore.signUpDraft.phone || '+234 800 000 0000',
  location: authStore.userProfile?.location || authStore.signUpDraft.location || 'Lagos, Nigeria',
  headline: authStore.userProfile?.bio || authStore.signUpDraft.headline || 'Founder account',
  interests: authStore.signUpDraft.interests.length
    ? [...authStore.signUpDraft.interests]
    : ['Community', 'Jobs', 'Referrals'],
})

const canSave = computed(
  () =>
    Boolean(
      form.value.name &&
        form.value.username &&
        form.value.email &&
        form.value.location &&
        form.value.headline,
    ) && form.value.interests.length > 0,
)

const profileInitials = computed(() =>
  form.value.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const completionScore = computed(() => {
  const checks = [
    Boolean(form.value.name),
    Boolean(form.value.username),
    Boolean(form.value.email),
    Boolean(form.value.phone),
    Boolean(form.value.location),
    Boolean(form.value.headline),
    form.value.interests.length > 0,
  ]

  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
})

const loadProfile = async () => {
  if (!authStore.isAuthenticated) {
    return
  }

  isLoadingProfile.value = true

  try {
    const response = await usersService.getMyProfile(authStore.authToken)
    const profile = response.data?.profile ?? null
    authStore.setUserProfile(profile)

    if (response.data?.user?.id) {
      authStore.setUserId(response.data.user.id)
    }

    if (response.data?.user?.email && typeof response.data.user.email === 'string') {
      form.value.email = response.data.user.email
      authStore.signUpDraft.email = response.data.user.email
    }

    if (profile) {
      form.value.username = profile.username || form.value.username
      form.value.location = profile.location || form.value.location
      form.value.headline = profile.bio || form.value.headline
    }
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      toast.error('Unable to load profile details right now.')
    }
  } finally {
    isLoadingProfile.value = false
  }
}

onMounted(() => {
  void loadProfile()
})

const toggleInterest = (interest: string) => {
  if (form.value.interests.includes(interest)) {
    form.value.interests = form.value.interests.filter((item) => item !== interest)
    return
  }

  form.value.interests.push(interest)
}

const saveProfile = async () => {
  if (!canSave.value || isSaving.value) {
    if (!canSave.value) {
      toast.error('Complete the required profile details first.')
    }

    return
  }

  isSaving.value = true
  const loadingToastId = toast.loading('Saving profile...', {
    description: 'Please wait while we update your profile.',
  })

  try {
    const id = authStore.userId

    if (!id) {
      throw new Error('No authenticated user ID is available for this profile update.')
    }

    const payload = {
      username: form.value.username,
      bio: form.value.headline,
      location: form.value.location,
      avatar: authStore.userProfile?.avatar ?? null,
      banner: authStore.userProfile?.banner ?? null,
      website: authStore.userProfile?.website || '',
      linkedin: authStore.userProfile?.linkedin || '',
      github: authStore.userProfile?.github || '',
    }

    let profileResponse

    try {
      profileResponse = await usersService.updateUserProfile(id, payload, authStore.authToken)
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) {
        throw error
      }

      profileResponse = await usersService.createUserProfile(id, payload, authStore.authToken)
    }

    authStore.signUpDraft.name = form.value.name
    authStore.signUpDraft.username = form.value.username
    authStore.signUpDraft.email = form.value.email
    authStore.signUpDraft.phone = form.value.phone
    authStore.signUpDraft.location = form.value.location
    authStore.signUpDraft.headline = form.value.headline
    authStore.signUpDraft.interests = [...form.value.interests]
    authStore.setUserProfile(profileResponse.data ?? null)

    toast.success('Profile updated', {
      id: loadingToastId,
      description: 'Your public profile details have been saved.',
    })

    router.push('/profile')
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'We could not save your profile.'

    toast.error('Profile update failed', {
      id: loadingToastId,
      description: message,
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-(--text-secondary)">
        <RouterLink to="/" class="transition hover:text-(--accent-strong)">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/profile" class="transition hover:text-(--accent-strong)">Profile</RouterLink>
        <span>/</span>
        <span class="font-medium text-(--accent-strong)">Edit Profile</span>
      </div>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-[1.65rem] font-semibold leading-tight text-(--text-primary) sm:text-[1.95rem] lg:text-[2.1rem]">
            Edit profile
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-7 text-(--text-secondary) sm:text-base">
            Update the details people see about you across your profile, applications, referrals, and community activity.
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <RouterLink
            to="/profile"
            class="inline-flex items-center justify-center rounded-[1rem] border border-[color:var(--border-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
          >
            Cancel
          </RouterLink>
          <button
            type="button"
            :disabled="!canSave || isSaving"
            class="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
            @click="saveProfile"
          >
            <Save class="h-4 w-4" />
            {{ isSaving ? 'Saving...' : 'Save changes' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoadingProfile" class="rounded-[1.25rem] border border-dashed border-[color:var(--border-soft)] p-4 text-sm text-[var(--text-secondary)]">
      Loading profile data...
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.9fr)]">
      <form
        class="space-y-6 rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)] sm:p-6"
        @submit.prevent="saveProfile"
      >
        <section class="overflow-hidden rounded-[1.35rem] border border-[color:var(--border-soft)]">
          <div class="bg-[linear-gradient(135deg,rgba(66,63,151,0.1),rgba(211,154,69,0.05))] p-5 sm:p-6">
            <div class="flex items-start gap-4">
              <span class="inline-flex h-18 w-18 items-center justify-center rounded-[1.75rem] bg-[var(--surface-primary)] text-xl font-semibold text-[var(--accent-strong)] shadow-[var(--shadow-soft)]">
                {{ profileInitials }}
              </span>
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                  Public identity
                </p>
                <h2 class="mt-2 text-[1.4rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.6rem]">
                  Make your profile easy to recognize
                </h2>
                <p class="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                  These details show up first in your profile, referrals, and job-related interactions.
                </p>
              </div>
            </div>
          </div>

          <div class="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <div class="space-y-2">
              <label class="text-sm font-semibold text-[var(--text-primary)]">Full name</label>
              <div class="relative">
                <UserRound class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input v-model="form.name" type="text" class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] pl-11 pr-4 text-sm outline-none transition focus:border-[var(--accent)]" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-semibold text-[var(--text-primary)]">Username</label>
              <div class="relative">
                <AtSign class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input v-model="form.username" type="text" class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] pl-11 pr-4 text-sm outline-none transition focus:border-[var(--accent)]" />
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] p-5 sm:p-6">
          <div class="flex items-start gap-3">
            <ShieldCheck class="mt-1 h-5 w-5 text-[var(--accent-strong)]" />
            <div>
              <h2 class="text-[1.2rem] font-semibold text-[var(--text-primary)]">Contact details</h2>
              <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                Keep these details current so opportunities, referrals, and collaborators can reach you easily.
              </p>
            </div>
          </div>

          <div class="mt-5 grid gap-5 sm:grid-cols-2">
            <div class="space-y-2">
              <label class="text-sm font-semibold text-[var(--text-primary)]">Email address</label>
              <div class="relative">
                <Mail class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input v-model="form.email" type="email" class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] pl-11 pr-4 text-sm outline-none transition focus:border-[var(--accent)]" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-semibold text-[var(--text-primary)]">Phone number</label>
              <div class="relative">
                <Phone class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input v-model="form.phone" type="tel" class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] pl-11 pr-4 text-sm outline-none transition focus:border-[var(--accent)]" />
              </div>
            </div>
          </div>

          <div class="mt-5 space-y-2">
            <label class="text-sm font-semibold text-[var(--text-primary)]">Location</label>
            <div class="relative">
              <MapPin class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input v-model="form.location" type="text" class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] pl-11 pr-4 text-sm outline-none transition focus:border-[var(--accent)]" />
            </div>
          </div>
        </section>

        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] p-5 sm:p-6">
          <div class="flex items-start gap-3">
            <Sparkles class="mt-1 h-5 w-5 text-[var(--accent-strong)]" />
            <div>
              <h2 class="text-[1.2rem] font-semibold text-[var(--text-primary)]">Professional profile</h2>
              <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                Shape how people understand what you do and the kind of opportunities you want.
              </p>
            </div>
          </div>

          <div class="mt-5 space-y-2">
            <label class="text-sm font-semibold text-[var(--text-primary)]">Professional headline</label>
            <textarea v-model="form.headline" rows="4" class="w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-4 text-sm outline-none transition focus:border-[var(--accent)]" />
          </div>

          <div class="mt-5 space-y-3">
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
        </section>

        <div class="flex flex-wrap justify-end gap-3 border-t border-[color:var(--border-soft)] pt-5">
          <RouterLink to="/profile" class="inline-flex items-center justify-center rounded-[1rem] border border-[color:var(--border-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]">
            Cancel
          </RouterLink>
          <button type="submit" :disabled="!canSave || isSaving" class="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]">
            <Save class="h-4 w-4" />
            {{ isSaving ? 'Saving...' : 'Save changes' }}
          </button>
        </div>
      </form>

      <aside class="space-y-6">
        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-start gap-4">
            <span class="inline-flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[var(--surface-secondary)] text-xl font-semibold text-[var(--accent-strong)]">
              {{ profileInitials }}
            </span>
            <div>
              <h2 class="text-xl font-semibold text-[var(--text-primary)]">Live preview</h2>
              <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                This is how your profile identity will read across the platform after saving.
              </p>
            </div>
          </div>

          <div class="mt-5 rounded-[1.2rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              @{{ form.username }}
            </p>
            <p class="mt-2 text-xl font-semibold text-[var(--text-primary)]">{{ form.name }}</p>
            <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">{{ form.headline }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <span
                v-for="interest in form.interests"
                :key="interest"
                class="inline-flex items-center rounded-full bg-[var(--surface-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]"
              >
                {{ interest }}
              </span>
            </div>
          </div>
        </section>

        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Profile strength</h2>
            <span class="text-lg font-semibold text-[var(--accent-strong)]">{{ completionScore }}%</span>
          </div>

          <div class="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
            <div class="h-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong))]" :style="{ width: `${completionScore}%` }" />
          </div>

          <ul class="mt-5 space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
            <li>Use a clear headline so recruiters and collaborators understand your direction quickly.</li>
            <li>Keep your location and contact details current for jobs, referrals, and introductions.</li>
            <li>Choose interests that match the kind of opportunities and conversations you want more often.</li>
          </ul>
        </section>
      </aside>
    </div>
  </section>
</template>
