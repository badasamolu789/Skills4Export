<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BriefcaseBusiness, MapPin, Search, Wallet } from 'lucide-vue-next'
import PostJobModal from '@/components/PostJobModal.vue'
import type { JobRecord } from '@/services/jobs'
import { useJobsStore } from '@/stores/jobs'

const jobsStore = useJobsStore()
const searchQuery = ref('')
const isPostJobModalOpen = ref(false)
const visibleJobCount = ref(6)
const loadMoreTarget = ref<HTMLElement | null>(null)
let loadMoreObserver: IntersectionObserver | null = null

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

const getSalaryLabel = (job: JobRecord) => {
  if (job.salaryLabel) {
    return job.salaryLabel
  }

  const min = formatMoney(job.salaryMin, job.salaryCurrency || 'NGN')
  const max = formatMoney(job.salaryMax, job.salaryCurrency || 'NGN')

  if (min && max) {
    return `${min} - ${max}`
  }

  return min || max || 'Salary not listed'
}

const getJobPath = (job: JobRecord) => `/jobs/${job.slug || job.id}`

const getJobExperience = (job: JobRecord) => job.experience || 'Experience not listed'

const filteredJobs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return jobsStore.jobs
  }

  return jobsStore.jobs.filter((job) =>
    [
      job.title,
      job.companyName,
      job.location,
      job.type,
      getSalaryLabel(job),
      job.experience,
      job.description,
      ...(job.skills || []),
    ].some((value) =>
      String(value || '').toLowerCase().includes(query),
    ),
  )
})

const visibleJobs = computed(() => filteredJobs.value.slice(0, visibleJobCount.value))
const hasMoreJobs = computed(() => visibleJobCount.value < filteredJobs.value.length)

const loadMoreJobs = () => {
  if (!hasMoreJobs.value) {
    return
  }

  visibleJobCount.value = Math.min(visibleJobCount.value + 6, filteredJobs.value.length)
}

watch(searchQuery, () => {
  visibleJobCount.value = 6
})

const addCreatedJob = (job: JobRecord) => {
  if (!jobsStore.jobs.some((item) => item.id === job.id)) {
    jobsStore.jobs = [job, ...jobsStore.jobs]
  }
}

onMounted(() => {
  void jobsStore.loadJobs()

  loadMoreObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      loadMoreJobs()
    }
  })

  if (loadMoreTarget.value) {
    loadMoreObserver.observe(loadMoreTarget.value)
  }
})

onBeforeUnmount(() => {
  loadMoreObserver?.disconnect()
})
</script>

<template>
  <section class="space-y-5">
    <div class="space-y-4 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">Jobs</span>
      </div>
      <h1 class="text-[1.25rem] font-semibold text-[var(--text-primary)]">Jobs</h1>

      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <label
          class="flex items-center gap-3 rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 shadow-[var(--shadow-soft)]"
        >
          <Search class="h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search jobs"
            class="w-full border-none bg-[var(--surface-secondary)] text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
          />
        </label>
          <button
            type="button"
          class="inline-flex items-center justify-center gap-2 rounded-[0.9rem] bg-[var(--accent)] px-4 py-3 text-[0.92rem] font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            @click="isPostJobModalOpen = true"
          >
          <BriefcaseBusiness class="h-4 w-4" />
          Post Job
          </button>
      </div>
    </div>

    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 px-1">
        <p class="text-sm font-medium text-[var(--text-secondary)]">
          {{ jobsStore.isLoadingJobs ? 'Loading jobs...' : `${filteredJobs.length} job${filteredJobs.length === 1 ? '' : 's'} found` }}
        </p>
        <p class="text-sm text-[var(--text-secondary)]">Live opportunities across your network</p>
      </div>

      <article
        v-if="jobsStore.isLoadingJobs"
        v-for="item in 4"
        :key="`job-skeleton-${item}`"
        class="animate-pulse rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]"
      >
        <div class="space-y-3">
          <div class="h-5 w-2/5 rounded-full bg-[var(--surface-secondary)]" />
          <div class="h-4 w-48 rounded-full bg-[var(--surface-secondary)]" />
          <div class="h-3 w-full max-w-3xl rounded-full bg-[var(--surface-secondary)]" />
          <div class="h-3 w-2/3 rounded-full bg-[var(--surface-secondary)]" />
          <div class="grid gap-2 sm:grid-cols-3">
            <span class="h-8 rounded-full bg-[var(--surface-secondary)]" />
            <span class="h-8 rounded-full bg-[var(--surface-secondary)]" />
            <span class="h-8 rounded-full bg-[var(--surface-secondary)]" />
          </div>
        </div>
      </article>

      <article
        v-if="!jobsStore.isLoadingJobs"
        v-for="job in visibleJobs"
        :key="job.id"
        class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]"
      >
        <div class="min-w-0">
          <RouterLink
            :to="getJobPath(job)"
            class="block text-[1.08rem] font-semibold leading-tight text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
          >
              {{ job.title }}
          </RouterLink>

          <p class="mt-2 inline-flex items-center gap-2 text-[0.86rem] font-semibold text-[var(--text-secondary)]">
            <BriefcaseBusiness class="h-4 w-4 text-[var(--accent-strong)]" />
            {{ job.companyName }}
          </p>

          <p class="mt-2 line-clamp-2 max-w-3xl text-[0.84rem] leading-5 text-[var(--text-secondary)]">
            {{ job.description }}
          </p>

          <div class="mt-3 grid gap-2 sm:grid-cols-3">
              <span
              class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-[0.82rem] text-[var(--text-secondary)]"
              >
                <MapPin class="h-4 w-4 text-[var(--accent-strong)]" />
            {{ job.location || 'Location not listed' }}
              </span>
              <span
              class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-[0.82rem] text-[var(--text-secondary)]"
              >
              <BriefcaseBusiness class="h-4 w-4 text-[var(--accent-strong)]" />
              {{ getJobExperience(job) }}
              </span>
              <span
              class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-[0.82rem] text-[var(--text-secondary)]"
              >
                <Wallet class="h-4 w-4 text-[var(--accent-strong)]" />
                {{ getSalaryLabel(job) }}
              </span>
            </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="skill in job.skills || []"
              :key="skill"
              class="rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 py-1 text-[0.76rem] font-semibold text-[var(--text-secondary)]"
            >
              {{ skill }}
            </span>
          </div>
        </div>
      </article>

      <article
        v-if="!jobsStore.isLoadingJobs && filteredJobs.length === 0"
        class="rounded-[1.35rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-soft)]"
      >
        <h2 class="text-xl font-semibold text-[var(--text-primary)]">
          {{ jobsStore.jobsError ? 'Jobs could not be loaded.' : searchQuery ? 'No job posts match your search.' : 'No jobs posted yet.' }}
        </h2>
        <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
          {{ jobsStore.jobsError || (searchQuery ? 'Try another keyword for role, company, location, or job type.' : 'Live opportunities will show here as soon as they are published.') }}
        </p>
        <button
          v-if="!jobsStore.jobsError && !searchQuery"
          type="button"
          class="mt-5 inline-flex items-center justify-center gap-2 rounded-[0.9rem] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          @click="isPostJobModalOpen = true"
        >
          <BriefcaseBusiness class="h-4 w-4" />
          Post the first job
        </button>
      </article>

      <div
        v-if="hasMoreJobs"
        ref="loadMoreTarget"
        class="py-4 text-center text-sm font-medium text-[var(--text-secondary)]"
      >
        Loading more jobs...
      </div>
    </div>

    <PostJobModal :open="isPostJobModalOpen" @created="addCreatedJob" @close="isPostJobModalOpen = false" />
  </section>
</template>
