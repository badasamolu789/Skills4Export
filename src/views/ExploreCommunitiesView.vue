<script setup lang="ts">
import { BriefcaseBusiness, Building2, Code2, Palette, Rocket, Users } from 'lucide-vue-next'
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
  <section class="min-h-[calc(100vh-6rem)] px-4 py-10 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl space-y-8">
      <div class="space-y-4 px-1">
        <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
          <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
          <span>/</span>
          <span class="font-medium text-[var(--accent-strong)]">Explore Communities</span>
        </div>

        <div>
          <h1 class="text-[2rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-[2.5rem]">
            Explore Communities
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            Discover focused spaces to ask questions, share wins, and connect with people building in the same direction.
          </p>
        </div>
      </div>

      <div class="space-y-4">
        <article
          v-for="community in communities"
          :key="community.slug"
          class="flex items-start gap-5 overflow-hidden rounded-[2rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-elevated)]"
        >
          <span class="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[var(--surface-secondary)] text-[var(--accent-strong)]">
            <component :is="iconMap[community.icon]" class="h-7 w-7" />
          </span>

          <div class="min-w-0 flex-1">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">
              {{ community.name }}
            </h2>
            <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              {{ community.description }}
            </p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
