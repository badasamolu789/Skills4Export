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
  <aside :class="props.pinnedLayout ? 'w-full' : 'w-full lg:w-[16.5rem] xl:w-[17.5rem]'">
    <div
      :class="
        [
          'space-y-4',
          props.pinnedLayout
            ? 'h-full'
            : 'lg:sticky lg:top-28',
        ].join(' ')
      "
    >
      <section
        class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-elevated)]"
      >
        <div class="flex items-center gap-2">
          <BadgeHelp class="h-4 w-4 text-[var(--accent-strong)]" />
          <h2 class="text-base font-semibold text-[var(--text-primary)]">Trending Questions</h2>
        </div>

        <div class="mt-3 space-y-2">
          <article
            v-for="item in trendingQuestions"
            :key="item.title"
            class="rounded-lg bg-[var(--surface-secondary)] p-3"
          >
            <p class="text-[0.84rem] font-semibold leading-5 text-[var(--text-primary)]">
              {{ item.title }}
            </p>
            <p class="mt-1 text-[0.72rem] text-[var(--text-secondary)]">
              {{ item.time }} . by {{ item.author }}
            </p>
          </article>
        </div>
      </section>

      <section
        class="overflow-hidden rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
      >
        <div class="border-b border-[color:var(--border-soft)] px-4 py-3">
          <div class="flex items-center gap-2">
            <Megaphone class="h-4 w-4 text-[var(--accent-strong)]" />
            <h2 class="text-base font-semibold text-[var(--text-primary)]">Advertisement</h2>
          </div>
        </div>

        <div class="p-4">
          <div class="overflow-hidden rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)]">
            <div
              class="flex h-32 items-end bg-[linear-gradient(135deg,#e8e9ff,#eef2fb)] px-4 py-3"
            >
              <div class="w-full rounded-[0.9rem] border border-[var(--border-soft)] bg-[var(--surface-primary)] p-2.5">
                <p class="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  Image Placeholder
                </p>
                <p class="mt-1 text-[0.78rem] text-[var(--text-secondary)]">Advertisement visual area</p>
              </div>
            </div>

            <div class="p-4">
              <p class="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Sponsored
              </p>
              <h3 class="mt-2 text-base font-semibold leading-tight text-[var(--text-primary)]">
                Promote your page to the right audience.
              </h3>
              <p class="mt-2 text-[0.82rem] leading-5 text-[var(--text-secondary)]">
                Reach founders, freelancers, and communities across Skills4export with targeted page visibility.
              </p>
              <RouterLink
                to="/feed"
                class="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              >
                Start campaign
                <ArrowUpRight class="h-3.5 w-3.5" />
              </RouterLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>
