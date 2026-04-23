<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BriefcaseBusiness, CheckCircle2, MapPin, Wallet } from 'lucide-vue-next'
import { getJobBySlug } from '@/data/jobs'

const route = useRoute()
const job = computed(() => getJobBySlug(String(route.params.slug)))
</script>

<template>
  <section v-if="job" class="space-y-6">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-(--text-secondary)">
        <RouterLink to="/feed" class="transition hover:text-(--accent-strong)">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/jobs/feed" class="transition hover:text-(--accent-strong)">Jobs</RouterLink>
        <span>/</span>
        <span class="font-medium text-(--accent-strong)">Job Details</span>
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-(--text-tertiary)">{{ job.company }}</p>
        <h1 class="mt-2 text-[1.8rem] font-semibold leading-tight text-(--text-primary) sm:text-[2.15rem]">
          {{ job.title }}
        </h1>
      </div>
    </div>

    <article class="rounded-3xl border border-(--border-soft) bg-(--surface-primary) p-5 shadow-[var(--shadow-elevated) sm:p-6">
      <div class="flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary) px-4 py-2 text-sm text-(--text-secondary)">
          <MapPin class="h-4 w-4 text-(--accent-strong)" />
          {{ job.location }}
        </span>
        <span class="inline-flex items-center gap-2 rounded-full bg-(--surface-secondary) px-4 py-2 text-sm text-(--text-secondary)">
          <BriefcaseBusiness class="h-4 w-4 text-(--accent-strong)" />
          {{ job.type }}
        </span>
        <span class="inline-flex items-center gap-2 rounded-full bg-(--surface-secondary) px-4 py-2 text-sm text-(--text-secondary)">
          <Wallet class="h-4 w-4 text-(--accent-strong)" />
          {{ job.salary }}
        </span>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold text-(--text-primary)">Role Summary</h2>
            <p class="mt-3 text-sm leading-7 text-(--text-secondary)">{{ job.summary }}</p>
            <p class="mt-3 text-sm leading-7 text-(--text-secondary)">{{ job.description }}</p>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-(--text-primary)">Responsibilities</h2>
            <ul class="mt-3 space-y-3">
              <li
                v-for="item in job.responsibilities"
                :key="item"
                class="flex items-start gap-3 rounded-2xl bg-(--surface-secondary) p-4 text-sm leading-7 text-(--text-secondary)"
              >
                <CheckCircle2 class="mt-1 h-4 w-4 shrink-0 text-(--accent-strong)" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 class="text-xl font-semibold text-(--text-primary)">Requirements</h2>
            <ul class="mt-3 space-y-3">
              <li
                v-for="item in job.requirements"
                :key="item"
                class="flex items-start gap-3 rounded-2xl bg-(--surface-secondary) p-4 text-sm leading-7 text-(--text-secondary)"
              >
                <CheckCircle2 class="mt-1 h-4 w-4 shrink-0 text-(--accent-strong)" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>

        <aside class="space-y-4">
          <div class="rounded-[1.15rem] border border-(--border-soft)] bg-[var(--surface-secondary) p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)">Perks</p>
            <ul class="mt-3 space-y-2 text-sm text-(--text-secondary)">
              <li v-for="perk in job.perks" :key="perk">{{ perk }}</li>
            </ul>
          </div>
          <button
            type="button"
            class="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--accent) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--accent-strong)"
          >
            Apply now
          </button>
        </aside>
      </div>
    </article>
  </section>

  <section v-else class="rounded-[1.35rem] border border-dashed border-(--border-soft) bg-(--surface-primary) p-8 text-center shadow-(--shadow-soft)">
    <h1 class="text-xl font-semibold text-(--text-primary)">Job not found</h1>
    <p class="mt-3 text-sm leading-7 text-(--text-secondary)">
      The role you opened is not available in this starter dataset.
    </p>
  </section>
</template>
