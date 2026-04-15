<script setup lang="ts">
import { computed, ref } from 'vue'
import { BriefcaseBusiness, MapPin, Search, Wallet } from 'lucide-vue-next'
import PostJobModal from '@/components/PostJobModal.vue'
import { jobs } from '@/data/jobs'

const searchQuery = ref('')
const isPostJobModalOpen = ref(false)

const filteredJobs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return jobs
  }

  return jobs.filter((job) =>
    [job.title, job.company, job.location, job.type, job.salary, job.description].some((value) =>
      value.toLowerCase().includes(query),
    ),
  )
})
</script>

<template>
  <section class="space-y-5">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-(--text-secondary)">
        <RouterLink to="/" class="transition hover:text-(--accent-strong)">Home</RouterLink>
        <span>/</span>
        <span class="font-medium text-(--accent-strong)">Jobs</span>
      </div>
      <div>
        <h1 class="text-[1.55rem] font-semibold leading-tight text-[var(--text-primary) sm:text-[1.85rem] lg:text-[2rem]">
          Discover jobs
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-7 text-(--text-secondary) sm:text-base">
          Explore fresh job posts, browse opportunities by company, and search for the roles that fit you best.
        </p>
      </div>
    </div>

    <div
      class="overflow-hidden rounded-3xl border border-(--border-soft) bg-(--surface-primary) shadow-(--shadow-elevated)"
    >
      <div class="bg-[linear-gradient(135deg,rgba(66,63,151,0.12),rgba(211,154,69,0.08))] p-5 sm:p-6">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-(--text-tertiary)">
              Jobs Feed
            </p>
            <p class="mt-3 text-sm leading-7 text-(--text-secondary) sm:text-base">
              Live opportunities across your network, updated for quick browsing and fast action.
            </p>
          </div>

          <button
            type="button"
            class="inline-flex items-center gap-3 rounded-2xl border border-white/40 bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-4 py-3 text-[0.92rem] font-semibold text-white shadow-[0_16px_28px_rgba(66,63,151,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_32px_rgba(66,63,151,0.3)]"
            @click="isPostJobModalOpen = true"
          >
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-white/16">
              <BriefcaseBusiness class="h-4 w-4" />
            </span>
            <span class="flex flex-col items-start leading-tight">
              <span>Post A New Job</span>
              <!-- <span class="text-xs font-medium text-white/75">Reach qualified candidates faster</span> -->
            </span>
          </button>
        </div>

        <div class="mt-5">
          <label
            class="flex items-center gap-3 rounded-[1.2rem] border border-(--border-soft) bg-(--surface-primary) px-4 py-3 shadow-(--shadow-soft)"
          >
            <Search class="h-5 w-5 text-(--text-tertiary)" />
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Search the job post"
              class="w-full border-none bg-transparent text-sm text-(--text-primary) outline-none placeholder:text-(--text-secondary)"
            />
          </label>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3 px-1">
        <p class="text-sm font-medium text-(--text-secondary)">
          {{ filteredJobs.length }} job{{ filteredJobs.length === 1 ? '' : 's' }} found
        </p>
        <p class="text-sm text-(--text-secondary)">Live opportunities across your network</p>
      </div>

      <article
        v-for="job in filteredJobs"
        :key="`${job.company}-${job.title}`"
        class="rounded-[1.35rem] border border-(--border-soft) bg-(--surface-primary) p-5 shadow-(--shadow-elevated)"
      >
        <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <div class="min-w-0">
            <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-tertiary)">
              <BriefcaseBusiness class="h-4 w-4 text-(--accent-strong)" />
              <span>{{ job.company }}</span>
            </div>
            <h2 class="mt-3 text-[1.55rem] font-semibold leading-tight text-(--text-primary)">
              {{ job.title }}
            </h2>

            <div class="mt-4 flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center gap-2 rounded-full bg-(--surface-secondary) px-4 py-2 text-sm text-(--text-secondary)"
              >
                <MapPin class="h-4 w-4 text-(--accent-strong)" />
                {{ job.location }}
              </span>
              <span
                class="inline-flex items-center gap-2 rounded-full bg-(--surface-secondary) px-4 py-2 text-sm text-(--text-secondary)"
              >
                <BriefcaseBusiness class="h-4 w-4 text-(--accent-strong)" />
                {{ job.type }}
              </span>
              <span
                class="inline-flex items-center gap-2 rounded-full bg-(--surface-secondary) px-4 py-2 text-sm text-(--text-secondary)"
              >
                <Wallet class="h-4 w-4 text-(--accent-strong)" />
                {{ job.salary }}
              </span>
            </div>

            <p class="mt-3 text-sm leading-7 text-(--text-secondary)">
              {{ job.description }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-3 self-start">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full border border-(--border-soft) px-4 py-2.5 text-sm font-semibold text-(--text-secondary) transition hover:text-(--accent-strong)"
            >
              Save
            </button>
            <RouterLink
              :to="`/jobs/${job.slug}`"
              class="inline-flex items-center justify-center rounded-full bg-(--accent) px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-(--accent-strong)"
            >
              View Job
            </RouterLink>
          </div>
        </div>
      </article>

      <article
        v-if="filteredJobs.length === 0"
        class="rounded-[1.35rem] border border-dashed border-(--border-soft) bg-(--surface-primary) p-8 text-center shadow-(--shadow-soft)"
      >
        <h2 class="text-xl font-semibold text-(--text-primary)">No job posts match your search.</h2>
        <p class="mt-3 text-sm leading-7 text-(--text-secondary)">
          Try another keyword for role, company, location, or job type.
        </p>
      </article>
    </div>

    <PostJobModal :open="isPostJobModalOpen" @close="isPostJobModalOpen = false" />
  </section>
</template>
