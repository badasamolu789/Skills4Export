<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BriefcaseBusiness, Clock3, Search, Send, UserCheck } from 'lucide-vue-next'
import { useJobsStore } from '@/stores/jobs'

const jobsStore = useJobsStore()
const searchQuery = ref('')
const activeTab = ref<'posted' | 'applied'>('posted')

const formatDate = (value?: string) => {
  if (!value) {
    return 'Date not available'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const filteredPostedJobs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return jobsStore.postedJobs
  }

  return jobsStore.postedJobs.filter((job) =>
    [job.title, job.companyName, job.status, job.description].some((value) =>
      String(value || '').toLowerCase().includes(query),
    ),
  )
})

const filteredAppliedJobs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return jobsStore.appliedJobs
  }

  return jobsStore.appliedJobs.filter((application) =>
    [
      application.job?.title,
      application.job?.companyName,
      application.status,
      application.appliedAt,
      application.job?.location,
    ].some((value) =>
      String(value || '').toLowerCase().includes(query),
    ),
  )
})

onMounted(() => {
  void jobsStore.loadManageJobs()
})
</script>

<template>
  <section class="space-y-5">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/jobs/feed" class="transition hover:text-[var(--accent-strong)]">Jobs</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">Manage Jobs</span>
      </div>
      <div>
        <h1 class="text-[1.55rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.85rem] lg:text-[2rem]">
          Manage your jobs
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          Switch between roles you have posted and jobs you have applied for, then search through either list quickly.
        </p>
      </div>
    </div>

    <div>
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex gap-6 border-b border-[color:var(--border-soft)]">
          <button
            type="button"
            :class="
              activeTab === 'posted'
                ? 'border-[color:var(--accent)] text-[var(--accent-strong)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
            "
            class="inline-flex min-w-0 items-center justify-center gap-2 border-b-2 px-0 pb-3 text-[0.95rem] font-semibold transition"
            @click="activeTab = 'posted'"
          >
            <BriefcaseBusiness class="h-4 w-4 shrink-0" />
            <span class="truncate">Jobs Posted</span>
          </button>
          <button
            type="button"
            :class="
              activeTab === 'applied'
                ? 'border-[color:var(--accent)] text-[var(--accent-strong)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
            "
            class="inline-flex min-w-0 items-center justify-center gap-2 border-b-2 px-0 pb-3 text-[0.95rem] font-semibold transition"
            @click="activeTab = 'applied'"
          >
            <Send class="h-4 w-4 shrink-0" />
            <span class="truncate">Jobs Applied For</span>
          </button>
        </div>

        <label
          class="flex w-full items-center gap-3 rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-3 xl:max-w-md"
        >
          <Search class="h-5 w-5 text-[var(--text-tertiary)]" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search jobs"
            class="w-full border-none bg-[var(--surface-secondary)] text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
          />
        </label>
      </div>
    </div>

    <section
      class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]"
    >
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
            {{ activeTab === 'posted' ? 'Posted Jobs' : 'Applied Jobs' }}
          </p>
          <h2 class="mt-2 text-xl font-semibold text-[var(--text-primary)]">
            {{ activeTab === 'posted' ? 'Jobs you posted' : 'Jobs you applied for' }}
          </h2>
        </div>
        <span
          class="inline-flex items-center rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-sm font-medium text-[var(--text-secondary)]"
        >
          {{ jobsStore.isLoadingManageJobs ? '...' : activeTab === 'posted' ? filteredPostedJobs.length : filteredAppliedJobs.length }}
        </span>
      </div>

      <div v-if="activeTab === 'posted'" class="mt-5 space-y-4">
        <article
          v-if="jobsStore.isLoadingManageJobs"
          v-for="item in 2"
          :key="`posted-job-skeleton-${item}`"
          class="animate-pulse rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
        >
          <div class="flex gap-2">
            <span class="h-7 w-32 rounded-full bg-[var(--surface-primary)]" />
            <span class="h-7 w-24 rounded-full bg-[var(--surface-primary)]" />
          </div>
          <div class="mt-3 h-5 w-1/3 rounded-full bg-[var(--surface-primary)]" />
          <div class="mt-3 h-3 w-full rounded-full bg-[var(--surface-primary)]" />
          <div class="mt-2 h-3 w-2/3 rounded-full bg-[var(--surface-primary)]" />
        </article>

        <article
          v-if="!jobsStore.isLoadingManageJobs"
          v-for="job in filteredPostedJobs"
          :key="job.id"
          class="rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-primary)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]"
            >
              <BriefcaseBusiness class="h-3.5 w-3.5" />
              {{ job.companyName }}
            </span>
            <span
              class="inline-flex items-center rounded-full bg-[var(--surface-primary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
            >
              {{ job.status || 'draft' }}
            </span>
          </div>
          <h3 class="mt-3 text-lg font-semibold text-[var(--text-primary)]">{{ job.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{{ job.description }}</p>
          <div class="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-primary)] px-3 py-1.5">
              <UserCheck class="h-4 w-4 text-[var(--accent-strong)]" />
              {{ job.applicantCount || 0 }} applicants
            </span>
            <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-primary)] px-3 py-1.5">
              <Clock3 class="h-4 w-4 text-[var(--accent-strong)]" />
              Posted {{ formatDate(job.createdAt || job.updatedAt) }}
            </span>
          </div>
        </article>

        <article
          v-if="!jobsStore.isLoadingManageJobs && filteredPostedJobs.length === 0"
          class="rounded-[1.1rem] border border-dashed border-[color:var(--border-soft)] p-6 text-center"
        >
          <p class="text-sm text-[var(--text-secondary)]">
            {{ jobsStore.manageJobsError || (searchQuery ? 'No posted jobs match your search.' : 'You have not posted any jobs yet.') }}
          </p>
        </article>
      </div>

      <div v-else class="mt-5 space-y-4">
        <article
          v-if="jobsStore.isLoadingManageJobs"
          v-for="item in 2"
          :key="`applied-job-skeleton-${item}`"
          class="animate-pulse rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
        >
          <div class="flex gap-2">
            <span class="h-7 w-32 rounded-full bg-[var(--surface-primary)]" />
            <span class="h-7 w-28 rounded-full bg-[var(--surface-primary)]" />
          </div>
          <div class="mt-3 h-5 w-2/5 rounded-full bg-[var(--surface-primary)]" />
          <div class="mt-4 flex gap-2">
            <span class="h-8 w-36 rounded-full bg-[var(--surface-primary)]" />
            <span class="h-8 w-32 rounded-full bg-[var(--surface-primary)]" />
          </div>
        </article>

        <article
          v-if="!jobsStore.isLoadingManageJobs"
          v-for="application in filteredAppliedJobs"
          :key="application.id"
          class="rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-primary)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]"
            >
              <Send class="h-3.5 w-3.5" />
              {{ application.job?.companyName || 'Company not listed' }}
            </span>
            <span
              class="inline-flex items-center rounded-full bg-[var(--surface-primary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
            >
              {{ application.status || 'submitted' }}
            </span>
          </div>
          <h3 class="mt-3 text-lg font-semibold text-[var(--text-primary)]">{{ application.job?.title || 'Job application' }}</h3>
          <div class="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-primary)] px-3 py-1.5">
              <Clock3 class="h-4 w-4 text-[var(--accent-strong)]" />
              Applied {{ formatDate(application.appliedAt || application.createdAt) }}
            </span>
            <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-primary)] px-3 py-1.5">
              <BriefcaseBusiness class="h-4 w-4 text-[var(--accent-strong)]" />
              {{ application.job?.location || 'Location not listed' }}
            </span>
          </div>
        </article>

        <article
          v-if="!jobsStore.isLoadingManageJobs && filteredAppliedJobs.length === 0"
          class="rounded-[1.1rem] border border-dashed border-[color:var(--border-soft)] p-6 text-center"
        >
          <p class="text-sm text-[var(--text-secondary)]">
            {{ jobsStore.manageJobsError || (searchQuery ? 'No applications match your search.' : 'You have not applied for any jobs yet.') }}
          </p>
        </article>
      </div>
    </section>
  </section>
</template>
