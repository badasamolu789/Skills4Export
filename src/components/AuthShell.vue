<script setup lang="ts">
defineProps<{
  badge: string
  title: string
  description: string
  centered?: boolean
}>()
</script>

<template>
  <section
    :class="
      centered
        ? 'mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-2xl items-center justify-center'
        : 'mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8'
    "
  >
    <aside
      v-if="!centered"
      class="overflow-hidden rounded-[2rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
    >
      <div class="border-b border-[color:var(--border-soft)] px-6 py-6 sm:px-8 sm:py-8">
        <p class="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--text-tertiary)]">
          {{ badge }}
        </p>
        <h1 class="mt-4 max-w-md text-4xl font-semibold leading-tight text-[var(--text-primary)] sm:text-5xl">
          {{ title }}
        </h1>
        <p class="mt-4 max-w-lg text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          {{ description }}
        </p>
      </div>

      <div class="space-y-4 px-6 py-6 sm:px-8 sm:py-8">
        <slot name="aside" />
      </div>
    </aside>

    <div
      :class="
        centered
          ? 'w-full rounded-[2rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-5 shadow-[var(--shadow-elevated)] sm:px-5 sm:py-6'
          : 'rounded-[2rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)] sm:p-8'
      "
    >
      <slot />
    </div>
  </section>
</template>
