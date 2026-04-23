<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BriefcaseBusiness, Building2, Code2, Compass, Lock, Palette, Rocket, Users } from 'lucide-vue-next'
import { getCommunityBySlug } from '@/data/communities'

const route = useRoute()
const community = computed(() => getCommunityBySlug(String(route.params.slug)))

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
  <section v-if="community" class="space-y-6">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-(--text-secondary)">
        <RouterLink to="/feed" class="transition hover:text-(--accent-strong)">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/communities" class="transition hover:text-(--accent-strong)">Communities</RouterLink>
        <span>/</span>
        <span class="font-medium text-(--accent-strong)">{{ community.name }}</span>
      </div>

      <div class="flex items-start gap-4">
        <span class="inline-flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-(--surface-secondary) text-(--accent-strong)">
          <component :is="iconMap[community.icon]" class="h-8 w-8" />
        </span>
        <div>
          <h1 class="text-[1.8rem] font-semibold leading-tight text-(--text-primary) sm:text-[2.15rem]">
            {{ community.name }}
          </h1>
          <p class="mt-2 max-w-3xl text-sm leading-7 text-(--text-secondary) sm:text-base">
            {{ community.description }}
          </p>
        </div>
      </div>
    </div>

    <article class="rounded-3xl border border-(--border-soft) bg-(--surface-primary) p-5 shadow-(--shadow-elevated) sm:p-6">
      <div class="flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-2 rounded-full bg-(--surface-secondary) px-4 py-2 text-sm text-(--text-secondary)">
          <Users class="h-4 w-4 text-(--accent-strong)" />
          {{ community.members }}
        </span>
        <span class="inline-flex items-center gap-2 rounded-full bg-(--surface-secondary) px-4 py-2 text-sm text-(--text-secondary)">
          <component :is="community.visibility === 'Private community' ? Lock : Compass" class="h-4 w-4 text-(--accent-strong)" />
          {{ community.visibility }}
        </span>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <h2 class="text-xl font-semibold text-(--text-primary)">Focus Areas</h2>
          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="item in community.focus"
              :key="item"
              class="inline-flex items-center rounded-full bg-(--surface-secondary) px-4 py-2 text-sm text-(--text-secondary)"
            >
              {{ item }}
            </span>
          </div>
        </div>

        <aside class="space-y-3">
          <button
            type="button"
            class="inline-flex w-full items-center justify-center rounded-2xl bg-(--accent) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--accent-strong)"
          >
            Join community
          </button>
          <button
            type="button"
            class="inline-flex w-full items-center justify-center rounded-2xl border border-(--border-soft) px-4 py-3 text-sm font-semibold text-(--text-secondary) transition hover:text-(--accent-strong)"
          >
            Share
          </button>
        </aside>
      </div>
    </article>
  </section>

  <section v-else class="rounded-[1.35rem] border border-dashed border-(--border-soft) bg-(--surface-primary) p-8 text-center shadow-(--shadow-soft)">
    <h1 class="text-xl font-semibold text-(--text-primary)">Community not found</h1>
    <p class="mt-3 text-sm leading-7 text-(--text-secondary)">
      The community you opened is not available in this starter dataset.
    </p>
  </section>
</template>
