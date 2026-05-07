<script setup lang="ts">
import { ArrowUpRight, Megaphone } from 'lucide-vue-next'

defineProps<{
  variant?: 'campaign' | 'jobs'
}>()

const advertContent = {
  campaign: {
    eyebrow: 'Sponsored',
    title: 'Promote your page to the right audience.',
    description:
      'Reach founders, freelancers, and communities across Skills4Export with targeted visibility inside the feed.',
    cta: 'Start campaign',
  },
  jobs: {
    eyebrow: 'Sponsored',
    title: 'Need better applicants for your openings?',
    description:
      'Boost your opportunities in front of professionals already browsing jobs, posts, and questions every day.',
    cta: 'Promote opening',
  },
} as const
</script>

<template>
  <article class="overflow-hidden rounded-[0.95rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)]">
    <div class="border-b border-[color:var(--border-soft)] px-4 py-3">
      <div class="flex items-center gap-2">
        <Megaphone class="h-4 w-4 text-[var(--accent-strong)]" />
        <p class="text-sm font-semibold text-[var(--text-primary)]">Advertisement</p>
      </div>
    </div>

    <div class="p-4">
      <div class="overflow-hidden rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)]">
        <div class="flex h-28 items-end bg-[linear-gradient(135deg,#e8e9ff,#eef2fb)] px-4 py-3">
          <div class="w-full rounded-[0.85rem] border border-[var(--border-soft)] bg-[var(--surface-primary)] p-2.5">
            <p class="text-[0.68rem] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              Sponsored placement
            </p>
            <p class="mt-1 text-[0.78rem] text-[var(--text-secondary)]">Feed advert preview</p>
          </div>
        </div>

        <div class="p-4">
          <p class="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            {{ advertContent[variant || 'campaign'].eyebrow }}
          </p>
          <h3 class="mt-2 text-base font-semibold leading-tight text-[var(--text-primary)]">
            {{ advertContent[variant || 'campaign'].title }}
          </h3>
          <p class="mt-2 text-[0.82rem] leading-5 text-[var(--text-secondary)]">
            {{ advertContent[variant || 'campaign'].description }}
          </p>
          <RouterLink
            to="/feed"
            class="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          >
            {{ advertContent[variant || 'campaign'].cta }}
            <ArrowUpRight class="h-3.5 w-3.5" />
          </RouterLink>
        </div>
      </div>
    </div>
  </article>
</template>
