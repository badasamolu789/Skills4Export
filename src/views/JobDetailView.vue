<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { BriefcaseBusiness, CheckCircle2, MapPin, Send, Wallet } from 'lucide-vue-next'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import { ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { useJobsStore } from '@/stores/jobs'

const route = useRoute()
const authStore = useAuthStore()
const jobsStore = useJobsStore()
const job = computed(() => jobsStore.currentJob)
const isApplying = ref(false)
const isApplyModalOpen = ref(false)
const applicationForm = ref({
  coverLetter: '',
  resumeMediaId: '',
})

const formatMoney = (value?: number | null, currency = 'NGN') => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return ''
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

const salaryLabel = computed(() => {
  const currentJob = job.value

  if (!currentJob) {
    return 'Salary not listed'
  }

  if (currentJob.salaryLabel) {
    return currentJob.salaryLabel
  }

  const min = formatMoney(currentJob.salaryMin, currentJob.salaryCurrency || 'NGN')
  const max = formatMoney(currentJob.salaryMax, currentJob.salaryCurrency || 'NGN')

  if (min && max) {
    return `${min} - ${max}`
  }

  return min || max || 'Salary not listed'
})

const responsibilities = computed(() => {
  if (job.value?.responsibilities?.length) {
    return job.value.responsibilities
  }

  return job.value?.summary ? [job.value.summary] : []
})

const requirements = computed(() => job.value?.requirements || [])
const perks = computed(() => job.value?.perks || [])

const openApplyModal = () => {
  if (!job.value || isApplying.value) {
    return
  }

  if (!authStore.authToken) {
    toast.error('Sign in required', {
      description: 'Please sign in again before applying.',
    })
    return
  }

  isApplyModalOpen.value = true
}

const applyToJob = async () => {
  if (!job.value || isApplying.value) {
    return
  }

  if (!authStore.authToken) {
    toast.error('Sign in required', {
      description: 'Please sign in again before applying.',
    })
    return
  }

  isApplying.value = true

  try {
    await jobsStore.applyToCurrentJob({
      coverLetter: applicationForm.value.coverLetter.trim() || undefined,
      resumeMediaId: applicationForm.value.resumeMediaId.trim() || undefined,
      answers: [],
    })
    toast.success('Application submitted')
    isApplyModalOpen.value = false
    applicationForm.value = {
      coverLetter: '',
      resumeMediaId: '',
    }
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to submit this application.'
    toast.error('Application failed', { description: message })
  } finally {
    isApplying.value = false
  }
}

watch(
  () => route.params.slug,
  (slug) => {
    void jobsStore.loadJob(String(slug))
  },
  { immediate: true },
)
</script>

<template>
  <section v-if="jobsStore.isLoadingJob" class="space-y-6">
    <div class="animate-pulse space-y-3 px-1">
      <div class="h-4 w-56 rounded-full bg-[var(--surface-secondary)]" />
      <div class="h-3 w-32 rounded-full bg-[var(--surface-secondary)]" />
      <div class="h-8 w-2/3 rounded-full bg-[var(--surface-secondary)]" />
    </div>
    <article class="animate-pulse rounded-3xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)] sm:p-6">
      <div class="flex flex-wrap gap-2">
        <span class="h-9 w-36 rounded-full bg-[var(--surface-secondary)]" />
        <span class="h-9 w-28 rounded-full bg-[var(--surface-secondary)]" />
        <span class="h-9 w-36 rounded-full bg-[var(--surface-secondary)]" />
      </div>
      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div class="space-y-6">
          <div class="space-y-3">
            <div class="h-6 w-40 rounded-full bg-[var(--surface-secondary)]" />
            <div class="h-4 w-full rounded-full bg-[var(--surface-secondary)]" />
            <div class="h-4 w-2/3 rounded-full bg-[var(--surface-secondary)]" />
          </div>
          <div class="space-y-3">
            <div class="h-6 w-48 rounded-full bg-[var(--surface-secondary)]" />
            <div class="h-16 rounded-2xl bg-[var(--surface-secondary)]" />
            <div class="h-16 rounded-2xl bg-[var(--surface-secondary)]" />
          </div>
        </div>
        <aside class="space-y-4">
          <div class="h-32 rounded-[1.15rem] bg-[var(--surface-secondary)]" />
          <div class="h-12 rounded-2xl bg-[var(--surface-secondary)]" />
        </aside>
      </div>
    </article>
  </section>

  <section v-else-if="job" class="space-y-6">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/jobs/feed" class="transition hover:text-[var(--accent-strong)]">Jobs</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">Job Details</span>
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">{{ job.companyName }}</p>
        <h1 class="mt-2 text-[1.8rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[2.15rem]">
          {{ job.title }}
        </h1>
      </div>
    </div>

    <article class="rounded-3xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)] sm:p-6">
      <div class="flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-sm text-[var(--text-secondary)]">
          <MapPin class="h-4 w-4 text-[var(--accent-strong)]" />
          {{ job.location || 'Location not listed' }}
        </span>
        <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-sm text-[var(--text-secondary)]">
          <BriefcaseBusiness class="h-4 w-4 text-[var(--accent-strong)]" />
          {{ job.type || 'Type not listed' }}
        </span>
        <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-sm text-[var(--text-secondary)]">
          <Wallet class="h-4 w-4 text-[var(--accent-strong)]" />
          {{ salaryLabel }}
        </span>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Role Summary</h2>
            <p v-if="job.summary" class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{{ job.summary }}</p>
            <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{{ job.description || 'No description has been added yet.' }}</p>
          </div>

          <div v-if="responsibilities.length">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Responsibilities</h2>
            <ul class="mt-3 space-y-3">
              <li
                v-for="item in responsibilities"
                :key="item"
                class="flex items-start gap-3 rounded-2xl bg-[var(--surface-secondary)] p-4 text-sm leading-7 text-[var(--text-secondary)]"
              >
                <CheckCircle2 class="mt-1 h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>

          <div v-if="requirements.length">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Requirements</h2>
            <ul class="mt-3 space-y-3">
              <li
                v-for="item in requirements"
                :key="item"
                class="flex items-start gap-3 rounded-2xl bg-[var(--surface-secondary)] p-4 text-sm leading-7 text-[var(--text-secondary)]"
              >
                <CheckCircle2 class="mt-1 h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>

        <aside class="space-y-4">
          <div class="rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Perks</p>
            <ul v-if="perks.length" class="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
              <li v-for="perk in perks" :key="perk">{{ perk }}</li>
            </ul>
            <p v-else class="mt-3 text-sm text-[var(--text-secondary)]">No perks listed yet.</p>
          </div>
          <button
            type="button"
            :disabled="isApplying || job.hasApplied === true"
            class="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
            @click="openApplyModal"
          >
            {{ job.hasApplied ? 'Applied' : isApplying ? 'Applying...' : 'Apply now' }}
          </button>
        </aside>
      </div>
    </article>

    <ResponsiveOverlay
      v-model="isApplyModalOpen"
      label="Job application"
      title="Apply for this job"
      max-width-class="sm:max-w-2xl"
    >
      <form class="space-y-4" @submit.prevent="applyToJob">
        <div class="rounded-[1rem] bg-[var(--surface-secondary)] p-4">
          <p class="text-sm font-semibold text-[var(--text-primary)]">{{ job.title }}</p>
          <p class="mt-1 text-xs text-[var(--text-secondary)]">{{ job.companyName }}</p>
        </div>

        <label class="block">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Cover letter</span>
          <textarea
            v-model="applicationForm.coverLetter"
            rows="6"
            class="mt-2 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)]"
            placeholder="Optional text"
          />
        </label>

        <label class="block">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Resume media ID</span>
          <input
            v-model="applicationForm.resumeMediaId"
            class="mt-2 h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)]"
            placeholder="media-uuid"
          />
        </label>

        <div class="flex justify-end gap-2 border-t border-[color:var(--border-soft)] pt-4">
          <button
            type="button"
            class="inline-flex h-10 items-center rounded-[0.8rem] border border-[color:var(--border-soft)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="isApplyModalOpen = false"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isApplying"
            class="inline-flex h-10 items-center gap-2 rounded-[0.8rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
          >
            <Send class="h-4 w-4" />
            {{ isApplying ? 'Submitting...' : 'Submit application' }}
          </button>
        </div>
      </form>
    </ResponsiveOverlay>
  </section>

  <section v-else class="rounded-[1.35rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-soft)]">
    <h1 class="text-xl font-semibold text-[var(--text-primary)]">Job not found</h1>
    <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
      {{ jobsStore.jobError || 'The role you opened is not available.' }}
    </p>
  </section>
</template>
