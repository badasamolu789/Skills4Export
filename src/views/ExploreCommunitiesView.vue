<script setup lang="ts">
import { BriefcaseBusiness, Building2, Code2, Compass, Lock, Palette, Rocket, Sparkles, Users } from 'lucide-vue-next'
import { communities } from '@/data/communities'

const iconMap = {
  palette: Palette,
  code: Code2,
  rocket: Rocket,
  briefcase: BriefcaseBusiness,
  building: Building2,
  users: Users,
}
</script>

<template>
  <section class="space-y-5">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-(--text-secondary)">
        <RouterLink to="/" class="transition hover:text-(--accent-strong)">Home</RouterLink>
        <span>/</span>
        <span class="font-medium text-(--accent-strong)">Explore Communities</span>
      </div>
      <div>
        <h1 class="text-[1.55rem] font-semibold leading-tight text-(--text-primary) sm:text-[1.85rem] lg:text-[2rem]">
          Explore communities
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-7 text-(--text-secondary) sm:text-base">
          Discover focused spaces to ask questions, share wins, find opportunities, and meet people building in the same direction.
        </p>
      </div>
    </div>

    <div
      class="overflow-hidden rounded-3xl border border-(--border-soft) bg-(--surface-primary) shadow-(--shadow-elevated)"
    >
      <div class="bg-[linear-gradient(135deg,rgba(66,63,151,0.12),rgba(211,154,69,0.08))] p-5 sm:p-6">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-(--text-tertiary)">
              Community Directory
            </p>
            <p class="mt-3 text-sm leading-7 text-(--text-secondary) sm:text-base">
              Browse curated community spaces built around careers, collaboration, learning, and growth.
            </p>
          </div>

          <div class="inline-flex items-center gap-2.5 rounded-2xl border border-white/40 bg-white/60 px-3.5 py-2.5 text-[0.92rem] font-medium text-(--text-secondary)">
            <Sparkles class="h-4 w-4 text-(--accent-strong)" />
            <span>{{ communities.length }} featured communities</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <article
        v-for="community in communities"
        :key="community.name"
        class="overflow-hidden rounded-[1.35rem] border border-(--border-soft) bg-(--surface-primary) shadow-(--shadow-elevated)"
      >
        <div class="border-b border-(--border-soft) bg-(--surface-secondary) p-5">
          <div class="flex items-start justify-between gap-3">
            <span class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-(--surface-primary) text-(--accent-strong) shadow-(--shadow-soft)">
              <component :is="iconMap[community.icon]" class="h-7 w-7" />
            </span>
            <span class="rounded-full border border-(--border-soft) bg-(--surface-primary) px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-(--text-secondary)">
              Featured
            </span>
          </div>

          <h2 class="mt-6 text-[1.45rem] font-semibold leading-tight text-(--text-primary)">
            {{ community.name }}
          </h2>
          <p class="mt-2 text-sm leading-7 text-(--text-secondary)">
            {{ community.description }}
          </p>
        </div>

        <div class="space-y-4 p-5">
          <div class="flex flex-wrap gap-2">
            <span
              v-for="item in community.focus"
              :key="item"
              class="inline-flex items-center rounded-full bg-(--surface-secondary)] px-3 py-1.5 text-xs font-medium text-(--text-secondary)"
            >
              {{ item }}
            </span>
          </div>

          <div class="flex flex-wrap gap-2">
            <span
              class="inline-flex items-center gap-2 rounded-full bg-(--surface-secondary) px-3 py-2 text-sm text-(--text-secondary)"
            >
              <Users class="h-4 w-4 text-(--accent-strong)" />
              {{ community.members }}
            </span>
            <span
              class="inline-flex items-center gap-2 rounded-full bg-(--surface-secondary) px-3 py-2 text-sm text-(--text-secondary)"
            >
              <component
                :is="community.visibility === 'Private community' ? Lock : Compass"
                class="h-4 w-4 text-(--accent-strong)"
              />
              {{ community.visibility }}
            </span>
          </div>

          <div class="flex items-center gap-3">
            <RouterLink
              :to="`/communities/${community.slug}`"
              class="inline-flex flex-1 items-center justify-center rounded-2xl bg-(--accent) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--accent-strong)]"
            >
              View Community
            </RouterLink>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-2xl border border-(--border-soft) px-4 py-3 text-sm font-semibold text-(--text-secondary) transition hover:text-(--accent-strong)"
            >
              Join
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
