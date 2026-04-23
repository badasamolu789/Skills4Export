<script setup lang="ts">
import { computed, ref } from 'vue'
import { BriefcaseBusiness, Clock3, Search, Send, UserCheck } from 'lucide-vue-next'

const postedJobs = [
  {
    title: 'Frontend Developer',
    company: 'Skills4Export',
    status: 'Live',
    applicants: 24,
    postedOn: 'Posted 3 days ago',
    description:
      'Hiring a frontend developer to refine product workflows, improve dashboard performance, and ship polished UI updates.',
  },
  {
    title: 'Community Manager',
    company: 'Telefun',
    status: 'Reviewing',
    applicants: 11,
    postedOn: 'Posted 1 week ago',
    description:
      'Looking for a community lead to coordinate creator communication, moderation standards, and campaign rollouts.',
  },
]

const appliedJobs = [
  {
    title: 'Product Designer',
    company: 'EL Academy',
    status: 'Interview stage',
    appliedOn: 'Applied 2 days ago',
    location: 'Remote',
  },
  {
    title: 'Growth Marketer',
    company: 'Nova Labs',
    status: 'Application sent',
    appliedOn: 'Applied 5 days ago',
    location: 'Lagos, Nigeria',
  },
]

const searchQuery = ref('')
const activeTab = ref<'posted' | 'applied'>('posted')

const filteredPostedJobs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return postedJobs
  }

  return postedJobs.filter((job) =>
    [job.title, job.company, job.status, job.description].some((value) =>
      value.toLowerCase().includes(query),
    ),
  )
})

const filteredAppliedJobs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return appliedJobs
  }

  return appliedJobs.filter((job) =>
    [job.title, job.company, job.status, job.appliedOn, job.location].some((value) =>
      value.toLowerCase().includes(query),
    ),
  )
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

    <div
      class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-elevated)] sm:p-5"
    >
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div class="grid w-full grid-cols-1 gap-2 rounded-[1.2rem] bg-[var(--surface-secondary)] p-1 sm:grid-cols-2 xl:w-auto xl:min-w-[28rem]">
          <button
            type="button"
            :class="
              activeTab === 'posted'
                ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-soft)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
            "
            class="inline-flex min-w-0 items-center justify-center gap-2 rounded-[0.95rem] px-3.5 py-2.5 text-[0.92rem] font-semibold transition"
            @click="activeTab = 'posted'"
          >
            <BriefcaseBusiness class="h-4 w-4 shrink-0" />
            <span class="truncate">Jobs Posted</span>
          </button>
          <button
            type="button"
            :class="
              activeTab === 'applied'
                ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-soft)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
            "
            class="inline-flex min-w-0 items-center justify-center gap-2 rounded-[0.95rem] px-3.5 py-2.5 text-[0.92rem] font-semibold transition"
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
            class="w-full border-none bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
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
          {{ activeTab === 'posted' ? filteredPostedJobs.length : filteredAppliedJobs.length }}
        </span>
      </div>

      <div v-if="activeTab === 'posted'" class="mt-5 space-y-4">
        <article
          v-for="job in filteredPostedJobs"
          :key="`${job.company}-${job.title}`"
          class="rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-primary)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]"
            >
              <BriefcaseBusiness class="h-3.5 w-3.5" />
              {{ job.company }}
            </span>
            <span
              class="inline-flex items-center rounded-full bg-[var(--surface-primary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
            >
              {{ job.status }}
            </span>
          </div>
          <h3 class="mt-3 text-lg font-semibold text-[var(--text-primary)]">{{ job.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{{ job.description }}</p>
          <div class="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-primary)] px-3 py-1.5">
              <UserCheck class="h-4 w-4 text-[var(--accent-strong)]" />
              {{ job.applicants }} applicants
            </span>
            <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-primary)] px-3 py-1.5">
              <Clock3 class="h-4 w-4 text-[var(--accent-strong)]" />
              {{ job.postedOn }}
            </span>
          </div>
        </article>

        <article
          v-if="filteredPostedJobs.length === 0"
          class="rounded-[1.1rem] border border-dashed border-[color:var(--border-soft)] p-6 text-center"
        >
          <p class="text-sm text-[var(--text-secondary)]">No posted jobs match your search.</p>
        </article>
      </div>

      <div v-else class="mt-5 space-y-4">
        <article
          v-for="job in filteredAppliedJobs"
          :key="`${job.company}-${job.title}`"
          class="rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-primary)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]"
            >
              <Send class="h-3.5 w-3.5" />
              {{ job.company }}
            </span>
            <span
              class="inline-flex items-center rounded-full bg-[var(--surface-primary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
            >
              {{ job.status }}
            </span>
          </div>
          <h3 class="mt-3 text-lg font-semibold text-[var(--text-primary)]">{{ job.title }}</h3>
          <div class="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-primary)] px-3 py-1.5">
              <Clock3 class="h-4 w-4 text-[var(--accent-strong)]" />
              {{ job.appliedOn }}
            </span>
            <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-primary)] px-3 py-1.5">
              <BriefcaseBusiness class="h-4 w-4 text-[var(--accent-strong)]" />
              {{ job.location }}
            </span>
          </div>
        </article>

        <article
          v-if="filteredAppliedJobs.length === 0"
          class="rounded-[1.1rem] border border-dashed border-[color:var(--border-soft)] p-6 text-center"
        >
          <p class="text-sm text-[var(--text-secondary)]">No applications match your search.</p>
        </article>
      </div>
    </section>
  </section>
</template>
