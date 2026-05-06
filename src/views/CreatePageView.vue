<script setup lang="ts">
import { Building2, GraduationCap } from 'lucide-vue-next'

const pageTypes = [
  {
    label: 'Create Business page',
    icon: Building2,
  },
  {
    label: 'Create Student page',
    icon: GraduationCap,
  },
]
</script>

<template>
  <section class="flex min-h-[calc(100vh-6rem)] items-center px-4 py-12 sm:px-6 lg:px-8">
    <div class="mx-auto flex w-full max-w-5xl flex-col justify-center space-y-10">
      <div class="space-y-4 px-1 text-center">
        <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
          <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
          <span>/</span>
          <span class="font-medium text-[var(--accent-strong)]">Create page</span>
        </div>

        <div>
          <h1 class="text-[2.35rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-[3rem]">
            Choose a Page Type
          </h1>
        </div>
      </div>

      <div class="grid gap-6 sm:grid-cols-2">
        <button
          v-for="item in pageTypes"
          :key="item.label"
          type="button"
          class="group rounded-[2rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-10 text-left shadow-[var(--shadow-elevated)] transition hover:border-[var(--accent)] hover:shadow-[var(--shadow-elevated)]"
        >
          <div class="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[var(--surface-secondary)] text-[var(--accent-strong)] transition group-hover:bg-[var(--accent)] group-hover:text-white">
            <component :is="item.icon" class="h-8 w-8" />
          </div>
          <p class="mt-8 text-lg font-semibold text-[var(--text-primary)]">
            {{ item.label }}
          </p>
        </button>
      </div>
    </div>
  </section>
</template>
