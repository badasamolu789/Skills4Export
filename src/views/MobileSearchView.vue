<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, BriefcaseBusiness, Compass, MessageSquareMore, Search, Trophy } from 'lucide-vue-next'

type SearchTarget = {
  title: string
  description: string
  to: string
  keywords: string[]
  icon: unknown
}

const searchQuery = ref('')

const searchTargets: SearchTarget[] = [
  {
    title: 'Jobs Feed',
    description: 'Browse open roles and fresh opportunities from the community.',
    to: '/jobs/feed',
    keywords: ['jobs', 'feed', 'roles', 'opportunities', 'hiring'],
    icon: BriefcaseBusiness,
  },
  {
    title: 'Manage Jobs',
    description: 'Review jobs you posted and the ones you applied for.',
    to: '/jobs',
    keywords: ['manage', 'applications', 'posted', 'applied'],
    icon: BriefcaseBusiness,
  },
  {
    title: 'Question Answers',
    description: 'Jump into community questions and discover helpful answers.',
    to: '/answer/question',
    keywords: ['ask', 'answers', 'questions', 'community'],
    icon: MessageSquareMore,
  },
  {
    title: 'Explore Communities',
    description: 'Find new groups, discussions, and people to connect with.',
    to: '/communities',
    keywords: ['communities', 'groups', 'network', 'people'],
    icon: Compass,
  },
  {
    title: 'Create Job Alert',
    description: 'Set up alerts so matching opportunities come to you.',
    to: '/jobs/alerts',
    keywords: ['alerts', 'notifications', 'job alert'],
    icon: Trophy,
  },
]

const filteredTargets = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return searchTargets
  }

  return searchTargets.filter((item) =>
    [item.title, item.description, ...item.keywords].some((value) =>
      value.toLowerCase().includes(query),
    ),
  )
})
</script>

<template>
  <section class="mx-auto max-w-3xl space-y-5">
    <div class="rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-elevated)] sm:p-5">
      <div class="flex items-start gap-3">
        <RouterLink
          to="/"
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
          aria-label="Go back"
        >
          <ArrowLeft class="h-5 w-5" />
        </RouterLink>

        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            Mobile Search
          </p>
          <h1 class="mt-2 text-[1.45rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.6rem]">
            Search
          </h1>
          <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
            Search quickly across jobs, communities, alerts, and questions from a dedicated mobile screen.
          </p>
        </div>
      </div>

      <label
        class="mt-5 flex items-center gap-3 rounded-[1.2rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-3 shadow-[var(--shadow-soft)]"
      >
        <Search class="h-5 w-5 text-[var(--text-tertiary)]" />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search jobs, communities, alerts..."
          class="w-full border-none bg-[var(--surface-primary)] text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
        />
      </label>
    </div>

    <div class="space-y-3">
      <RouterLink
        v-for="item in filteredTargets"
        :key="item.title"
        :to="item.to"
        class="flex items-start gap-3 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--accent-soft)]"
      >
        <span
          class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--accent-strong)]"
        >
          <component :is="item.icon" class="h-5 w-5" />
        </span>
        <div class="min-w-0">
          <p class="text-base font-semibold text-[var(--text-primary)]">{{ item.title }}</p>
          <p class="mt-1 text-sm leading-7 text-[var(--text-secondary)]">{{ item.description }}</p>
        </div>
      </RouterLink>

      <article
        v-if="filteredTargets.length === 0"
        class="rounded-[1.35rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 text-center shadow-[var(--shadow-soft)]"
      >
        <p class="text-base font-semibold text-[var(--text-primary)]">No results found</p>
        <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
          Try another keyword like jobs, communities, alerts, or answers.
        </p>
      </article>
    </div>
  </section>
</template>
