<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { BriefcaseBusiness, MapPin, Search, Wallet } from 'lucide-vue-next'
import PostJobModal from '@/components/PostJobModal.vue'
import { jobs } from '@/data/jobs'

const searchQuery = ref('')
const isPostJobModalOpen = ref(false)
const visibleJobCount = ref(6)
const loadMoreTarget = ref<HTMLElement | null>(null)
let loadMoreObserver: IntersectionObserver | null = null

const jobFeedItems = computed(() =>
  Array.from({ length: 10 }, (_, groupIndex) =>
    jobs.map((job, jobIndex) => ({
      ...job,
      feedId: `${job.slug}-${groupIndex}-${jobIndex}`,
      company: groupIndex === 0 ? job.company : `${job.company} ${groupIndex + 1}`,
    })),
  ).flat(),
)

const filteredJobs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return jobFeedItems.value
  }

  return jobFeedItems.value.filter((job) =>
    [job.title, job.company, job.location, job.type, job.salary, job.experience, job.description, ...job.skills].some((value) =>
      value.toLowerCase().includes(query),
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

onMounted(() => {
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
      <div class="flex flex-wrap items-center gap-2 text-sm text-(--text-secondary)">
        <RouterLink to="/feed" class="transition hover:text-(--accent-strong)">Home</RouterLink>
        <span>/</span>
        <span class="font-medium text-(--accent-strong)">Jobs</span>
      </div>
      <h1 class="text-[1.25rem] font-semibold text-(--text-primary)">Jobs</h1>

      <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <label
          class="flex items-center gap-3 rounded-[0.9rem] border border-(--border-soft) bg-(--surface-primary) px-4 py-3 shadow-(--shadow-soft)"
        >
          <Search class="h-4 w-4 text-(--text-tertiary)" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search jobs"
            class="w-full border-none bg-(--surface-secondary) text-sm text-(--text-primary) outline-none placeholder:text-(--text-secondary)"
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
        <p class="text-sm font-medium text-(--text-secondary)">
          {{ filteredJobs.length }} job{{ filteredJobs.length === 1 ? '' : 's' }} found
        </p>
        <p class="text-sm text-(--text-secondary)">Live opportunities across your network</p>
      </div>

      <article
        v-for="job in visibleJobs"
        :key="job.feedId"
        class="rounded-[1.35rem] border border-(--border-soft) bg-(--surface-primary) p-5 shadow-(--shadow-elevated)"
      >
        <div class="min-w-0">
          <RouterLink
            :to="`/jobs/${job.slug}`"
            class="block text-[1.08rem] font-semibold leading-tight text-(--text-primary) transition hover:text-(--accent-strong)"
          >
              {{ job.title }}
          </RouterLink>

          <p class="mt-2 inline-flex items-center gap-2 text-[0.86rem] font-semibold text-(--text-secondary)">
            <BriefcaseBusiness class="h-4 w-4 text-(--accent-strong)" />
            {{ job.company }}
          </p>

          <p class="mt-2 line-clamp-2 max-w-3xl text-[0.84rem] leading-5 text-(--text-secondary)">
            {{ job.description }}
          </p>

          <div class="mt-3 grid gap-2 sm:grid-cols-3">
              <span
              class="inline-flex items-center gap-2 rounded-full bg-(--surface-secondary) px-3 py-1.5 text-[0.82rem] text-(--text-secondary)"
              >
                <MapPin class="h-4 w-4 text-(--accent-strong)" />
                {{ job.location }}
              </span>
              <span
              class="inline-flex items-center gap-2 rounded-full bg-(--surface-secondary) px-3 py-1.5 text-[0.82rem] text-(--text-secondary)"
              >
              <BriefcaseBusiness class="h-4 w-4 text-(--accent-strong)" />
              {{ job.experience }}
              </span>
              <span
              class="inline-flex items-center gap-2 rounded-full bg-(--surface-secondary) px-3 py-1.5 text-[0.82rem] text-(--text-secondary)"
              >
                <Wallet class="h-4 w-4 text-(--accent-strong)" />
                {{ job.salary }}
              </span>
            </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <span
              v-for="skill in job.skills"
              :key="skill"
              class="rounded-full border border-(--border-soft) bg-(--surface-secondary) px-3 py-1 text-[0.76rem] font-semibold text-(--text-secondary)"
            >
              {{ skill }}
            </span>
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

      <div
        v-if="hasMoreJobs"
        ref="loadMoreTarget"
        class="py-4 text-center text-sm font-medium text-(--text-secondary)"
      >
        Loading more jobs...
      </div>
    </div>

    <PostJobModal :open="isPostJobModalOpen" @close="isPostJobModalOpen = false" />
  </section>
</template>
