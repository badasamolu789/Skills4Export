<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BriefcaseBusiness, GraduationCap, Loader2, Save, Trophy, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ApiError } from '@/lib/api'
import { alertsService } from '@/services/alerts'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const contestAlert = ref(true)
const sponsorshipAlert = ref(false)
const scholarshipTypes = ref<string[]>([])
const jobAlert = ref(true)
const jobSearchInput = ref('')
const jobSearchTags = ref<string[]>([])
const isLoadingPreferences = ref(false)
const isSavingPreferences = ref(false)

const scholarshipOptions = [
  'Academic Scholarship',
  'IT Tech Scholarship',
  'Artisan Skills Scholarship',
  'Soft skills Scholarship',
]

const maxJobSearchTags = 10

const remainingJobSearchSlots = computed(() => maxJobSearchTags - jobSearchTags.value.length)

const getSavedScholarshipTypes = (data: {
  scholarshipTypes?: string[]
  scholarshipType?: string | null
}) => {
  if (Array.isArray(data.scholarshipTypes)) {
    return data.scholarshipTypes.filter((option) => scholarshipOptions.includes(option))
  }

  return data.scholarshipType && scholarshipOptions.includes(data.scholarshipType)
    ? [data.scholarshipType]
    : []
}

const addJobSearchTag = (rawValue: string) => {
  const value = rawValue.trim()

  if (!value || jobSearchTags.value.length >= maxJobSearchTags) {
    return
  }

  const exists = jobSearchTags.value.some((item) => item.toLowerCase() === value.toLowerCase())

  if (exists) {
    return
  }

  jobSearchTags.value.push(value)
}

const commitJobSearchTags = (value: string) => {
  const parts = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  parts.forEach(addJobSearchTag)
}

const handleJobSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value

  if (jobSearchTags.value.length >= maxJobSearchTags) {
    jobSearchInput.value = ''
    return
  }

  if (!value.includes(',')) {
    jobSearchInput.value = value
    return
  }

  const segments = value.split(',')
  const pendingValue = segments.pop() ?? ''

  commitJobSearchTags(segments.join(','))
  jobSearchInput.value = pendingValue.trimStart()
}

const finalizeJobSearchInput = () => {
  if (!jobSearchInput.value.trim()) {
    return
  }

  commitJobSearchTags(jobSearchInput.value)
  jobSearchInput.value = ''
}

const removeJobSearchTag = (tag: string) => {
  jobSearchTags.value = jobSearchTags.value.filter((item) => item !== tag)
}

const loadAlertPreferences = async () => {
  if (!authStore.authToken) {
    return
  }

  isLoadingPreferences.value = true

  try {
    const response = await alertsService.getAlertPreferences(authStore.authToken)
    contestAlert.value = response.data.contestAlert
    sponsorshipAlert.value = response.data.sponsorshipAlert
    scholarshipTypes.value = getSavedScholarshipTypes(response.data)
    jobAlert.value = response.data.jobAlert
    jobSearchTags.value = response.data.jobSearchTags ?? []
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to load alert preferences.'
    toast.error('Alerts failed', { description: message })
  } finally {
    isLoadingPreferences.value = false
  }
}

const saveAlertPreferences = async () => {
  finalizeJobSearchInput()

  if (!authStore.authToken) {
    toast.error('Sign in required', {
      description: 'Please sign in again before saving alerts.',
    })
    return
  }

  if (isSavingPreferences.value) {
    return
  }

  if (sponsorshipAlert.value && scholarshipTypes.value.length === 0) {
    toast.error('Choose a scholarship type', {
      description: 'Select at least one option for sponsorship alerts.',
    })
    return
  }

  isSavingPreferences.value = true

  try {
    const response = await alertsService.updateAlertPreferences(
      {
        contestAlert: contestAlert.value,
        sponsorshipAlert: sponsorshipAlert.value,
        scholarshipTypes: sponsorshipAlert.value ? scholarshipTypes.value : [],
        // Keep the singular field until the API migrates fully to scholarshipTypes.
        scholarshipType: sponsorshipAlert.value ? scholarshipTypes.value[0] ?? null : null,
        jobAlert: jobAlert.value,
        jobSearchTags: jobAlert.value ? jobSearchTags.value : [],
      },
      authStore.authToken,
    )

    contestAlert.value = response.data.contestAlert
    sponsorshipAlert.value = response.data.sponsorshipAlert
    scholarshipTypes.value = response.data.scholarshipTypes
      ? getSavedScholarshipTypes(response.data)
      : scholarshipTypes.value
    jobAlert.value = response.data.jobAlert
    jobSearchTags.value = response.data.jobSearchTags ?? []
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to save alert preferences.'
    toast.error('Save failed', { description: message })
  } finally {
    isSavingPreferences.value = false
  }
}

onMounted(() => {
  void loadAlertPreferences()
})
</script>

<template>
  <section class="mx-auto max-w-3xl space-y-5">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/jobs/feed" class="transition hover:text-[var(--accent-strong)]">Jobs</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">Create Alert</span>
      </div>
      <div>
        <h1 class="text-[1.55rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.85rem] lg:text-[2rem]">
          Create alerts
        </h1>
      </div>
    </div>

    <section
      class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]"
    >
      <div
        v-if="isLoadingPreferences"
        class="mb-5 space-y-3 rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
        aria-label="Loading alert preferences"
      >
        <div class="h-4 w-1/3 animate-pulse rounded-full bg-[var(--surface-muted)]" />
        <div class="h-4 w-2/3 animate-pulse rounded-full bg-[var(--surface-muted)]" />
      </div>

      <div class="space-y-5">
        <label
          class="flex items-center justify-between gap-4 rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-4"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <Trophy class="h-4 w-4 text-[var(--accent-strong)]" />
              <p class="font-semibold text-[var(--text-primary)]">Contest Alert</p>
            </div>
          </div>
          <input v-model="contestAlert" type="checkbox" class="h-5 w-5 accent-[var(--accent)]" />
        </label>

        <div class="rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-4">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <GraduationCap class="h-4 w-4 text-[var(--accent-strong)]" />
                <p class="font-semibold text-[var(--text-primary)]">Sponsorship Alert</p>
              </div>
            </div>
            <input v-model="sponsorshipAlert" type="checkbox" class="mt-1 h-5 w-5 accent-[var(--accent)]" />
          </div>

          <div v-if="sponsorshipAlert" class="mt-4">
            <div class="grid gap-3 sm:grid-cols-2">
              <label
                v-for="option in scholarshipOptions"
                :key="option"
                class="flex cursor-pointer items-center gap-3 rounded-[1rem] border px-4 py-3 transition"
                :class="
                  scholarshipTypes.includes(option)
                    ? 'border-[color:var(--accent-soft)] bg-white'
                    : 'border-[color:var(--border-soft)] bg-[var(--surface-primary)]'
                "
              >
                <input
                  v-model="scholarshipTypes"
                  type="checkbox"
                  :value="option"
                  class="h-4 w-4 accent-[var(--accent)]"
                />
                <span class="text-sm font-medium text-[var(--text-primary)]">{{ option }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-4">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <BriefcaseBusiness class="h-4 w-4 text-[var(--accent-strong)]" />
                <p class="font-semibold text-[var(--text-primary)]">Job Alert</p>
              </div>
            </div>
            <input v-model="jobAlert" type="checkbox" class="mt-1 h-5 w-5 accent-[var(--accent)]" />
          </div>

          <div v-if="jobAlert" class="mt-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="text-sm font-semibold text-[var(--text-primary)]">Jobs you are searching for</p>
              </div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                {{ remainingJobSearchSlots }} slots left
              </p>
            </div>

            <div
              class="flex min-h-[7rem] flex-wrap items-start gap-2 rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-3 transition focus-within:border-[color:var(--accent-soft)]"
            >
              <span
                v-for="tag in jobSearchTags"
                :key="tag"
                class="inline-flex items-center gap-2 rounded-full bg-[color:color-mix(in_srgb,var(--accent)_14%,white)] px-3 py-2 text-sm font-medium text-[var(--accent-strong)]"
              >
                <span>{{ tag }}</span>
                <button
                  type="button"
                  class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[var(--accent-strong)] transition hover:bg-[var(--surface-muted)]"
                  @click="removeJobSearchTag(tag)"
                >
                  <X class="h-3.5 w-3.5" />
                </button>
              </span>

              <input
                v-if="jobSearchTags.length < maxJobSearchTags"
                :value="jobSearchInput"
                type="text"
                placeholder="Product designer, frontend developer, UI/UX, ..."
                class="min-w-[14rem] flex-1 border-none bg-[var(--surface-secondary)] px-1 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                @input="handleJobSearchInput"
                @blur="finalizeJobSearchInput"
                @keydown.enter.prevent="finalizeJobSearchInput"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          :disabled="isSavingPreferences"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          @click="saveAlertPreferences"
        >
          <Loader2 v-if="isSavingPreferences" class="h-4 w-4 animate-spin" />
          <Save v-else class="h-4 w-4" />
          {{ isSavingPreferences ? 'Saving...' : 'Save alerts' }}
        </button>
      </div>
    </section>
  </section>
</template>
