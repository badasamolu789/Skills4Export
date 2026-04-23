<script setup lang="ts">
import { ArrowUpRight, BadgeHelp, Megaphone } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    pinnedLayout?: boolean
  }>(),
  {
    pinnedLayout: false,
  },
)

const trendingQuestions = [
  {
    title: 'How did chickenpox get its name?',
    time: '2 mins ago',
    author: 'Sudhir Kumbhare',
  },
  {
    title: 'Why do we say break a leg before a performance?',
    time: '8 mins ago',
    author: 'Anita George',
  },
  {
    title: 'Why is midnight called the witching hour in stories?',
    time: '14 mins ago',
    author: 'David Mensah',
  },
  {
    title: 'How did the phrase raining cats and dogs begin?',
    time: '21 mins ago',
    author: 'Mariam Yusuf',
  },
]
</script>

<template>
  <aside :class="props.pinnedLayout ? 'w-80' : 'w-full lg:w-[18rem] xl:w-[19rem]'">
    <div
      :class="
        [
          'space-y-5',
          props.pinnedLayout
            ? 'h-full'
            : 'lg:sticky lg:top-28',
        ].join(' ')
      "
    >
      <section
        class="rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]"
      >
        <div class="flex items-center gap-2">
          <BadgeHelp class="h-5 w-5 text-[var(--accent-strong)]" />
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Trending Questions</h2>
        </div>

        <div class="mt-4 space-y-3">
          <article
            v-for="item in trendingQuestions"
            :key="item.title"
            class="rounded-xl bg-[var(--surface-secondary)] p-4"
          >
            <p class="text-sm font-semibold leading-6 text-[var(--text-primary)]">
              {{ item.title }}
            </p>
            <p class="mt-1.5 text-xs text-[var(--text-secondary)]">
              {{ item.time }} . by {{ item.author }}
            </p>
          </article>
        </div>
      </section>

      <section
        class="overflow-hidden rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
      >
        <div class="border-b border-[color:var(--border-soft)] px-5 py-4">
          <div class="flex items-center gap-2">
            <Megaphone class="h-5 w-5 text-[var(--accent-strong)]" />
            <h2 class="text-lg font-semibold text-[var(--text-primary)]">Advertisement</h2>
          </div>
        </div>

        <div class="p-5">
          <div class="overflow-hidden rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)]">
            <div
              class="flex h-44 items-end bg-[linear-gradient(135deg,rgba(66,63,151,0.2),rgba(52,50,116,0.08))] px-5 py-4"
            >
              <div class="w-full rounded-[1.25rem] border border-white/40 bg-white/65 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-black/20">
                <p class="text-xs font-medium uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                  Image Placeholder
                </p>
                <p class="mt-1 text-sm text-[var(--text-secondary)]">Advertisement visual area</p>
              </div>
            </div>

            <div class="p-5">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Sponsored
              </p>
              <h3 class="mt-3 text-lg font-semibold leading-tight text-[var(--text-primary)]">
                Promote your page to the right audience.
              </h3>
              <p class="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                Reach founders, freelancers, and communities across Skills4export with targeted page visibility.
              </p>
              <RouterLink
                to="/feed"
                class="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              >
                Start campaign
                <ArrowUpRight class="h-4 w-4" />
              </RouterLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>
