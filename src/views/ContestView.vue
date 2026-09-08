<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Trophy } from 'lucide-vue-next'
import AppRightRail from '@/components/AppRightRail.vue'
import AppSidebar from '@/components/AppSidebar.vue'

const isFollowingContest = ref(false)

const followLabel = computed(() => (isFollowingContest.value ? 'Following' : 'Follow'))

const toggleFollow = () => {
  isFollowingContest.value = !isFollowingContest.value
}
</script>

<template>
  <section class="space-y-6">
    <section
      class="relative overflow-hidden rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-elevated)] sm:p-8"
    >
      <div class="pointer-events-none absolute right-8 top-0 hidden h-full w-48 opacity-60 lg:block">
        <div class="absolute right-10 top-0 h-full w-px rotate-[-32deg] bg-[var(--border-soft)]" />
        <div class="absolute right-20 top-0 h-full w-px rotate-[-32deg] bg-[var(--border-soft)]" />
        <div class="absolute right-[7.5rem] top-0 h-full w-px rotate-[-32deg] bg-[var(--border-soft)]" />
      </div>

      <div class="relative space-y-4">
        <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
          <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
          <span>/</span>
          <span class="font-medium text-[var(--accent-strong)]">Contest</span>
        </div>

        <h1 class="text-[2rem] font-semibold leading-tight tracking-normal text-[var(--text-primary)] sm:text-[2.4rem]">
          Contest
        </h1>
        <p class="max-w-4xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          Contest helps to create awareness, reward users, positively engage, uplift users, encourage users, create fun.
        </p>
      </div>
    </section>

    <div class="grid gap-4 lg:grid-cols-[17.5rem_minmax(0,1fr)_17.5rem] xl:gap-5">
      <aside class="hidden lg:block">
        <AppSidebar />
      </aside>

      <section class="min-w-0">
      <article
        class="overflow-hidden rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
      >
        <div class="flex min-h-[26rem] flex-col items-center justify-center bg-[var(--surface-secondary)] px-6 py-12 text-center">
          <div class="relative mb-8 flex h-40 w-full max-w-sm items-center justify-center">
            <span class="absolute h-36 w-36 rounded-full bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)]" />
            <span class="relative flex h-24 w-24 items-center justify-center rounded-[1.35rem] bg-[var(--accent)] text-white shadow-[var(--shadow-elevated)]">
              <Trophy class="h-11 w-11" />
            </span>
          </div>

          <h2 class="text-[2rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-[2.6rem]">
            No Active Contest
          </h2>
          <p class="mt-4 text-base leading-7 text-[var(--text-primary)] sm:text-lg">
            To receive notification, click on Follow
          </p>

          <button
            type="button"
            class="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-[0.8rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)]"
            @click="toggleFollow"
          >
            <Check class="h-4 w-4" />
            {{ followLabel }}
          </button>
        </div>
      </article>
      </section>

      <aside class="hidden lg:block">
        <AppRightRail :hide-trending-questions="true" />
      </aside>
    </div>
  </section>
</template>
