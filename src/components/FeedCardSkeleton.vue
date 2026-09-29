<script setup lang="ts">
withDefaults(defineProps<{ kind?: 'post' | 'question' | 'mixed' }>(), {
  kind: 'mixed',
})
</script>

<template>
  <article class="animate-pulse rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-elevated)] sm:p-4" aria-hidden="true">
    <template v-if="kind === 'question'">
      <div class="h-7 w-20 rounded-full bg-[var(--surface-muted)]" />
      <div class="mt-3 h-6 w-4/5 rounded-full bg-[var(--surface-muted)]" />
      <div class="mt-3 flex gap-2">
        <div class="h-3 w-14 rounded-full bg-[var(--surface-muted)]" />
        <div class="h-3 w-24 rounded-full bg-[var(--surface-muted)]" />
      </div>
      <div class="mt-5 flex gap-2">
        <div class="h-8 w-20 rounded-[0.6rem] bg-[var(--surface-muted)]" />
        <div class="h-8 w-20 rounded-[0.6rem] bg-[var(--surface-muted)]" />
        <div class="h-8 w-20 rounded-[0.6rem] bg-[var(--surface-muted)]" />
      </div>
    </template>
    <template v-else>
      <div class="flex items-center gap-3">
        <div class="h-11 w-11 shrink-0 rounded-full bg-[var(--surface-muted)] sm:h-12 sm:w-12" />
        <div class="min-w-0 flex-1 space-y-2">
          <div class="h-4 w-2/5 rounded-full bg-[var(--surface-muted)]" />
          <div class="h-3 w-1/4 rounded-full bg-[var(--surface-muted)]" />
        </div>
      </div>
      <div class="mt-5 h-5 w-3/4 rounded-full bg-[var(--surface-muted)]" />
      <div class="mt-3 space-y-2">
        <div class="h-3 w-full rounded-full bg-[var(--surface-muted)]" />
        <div class="h-3 w-5/6 rounded-full bg-[var(--surface-muted)]" />
      </div>
      <div v-if="kind === 'post'" class="mt-4 aspect-[4/5] w-full rounded-[0.5rem] bg-[var(--surface-muted)] sm:aspect-[1.91/1]" />
      <div class="mt-4 flex gap-2">
        <div class="h-7 w-20 rounded-[0.5rem] bg-[var(--surface-muted)]" />
        <div class="h-7 w-20 rounded-[0.5rem] bg-[var(--surface-muted)]" />
      </div>
    </template>
  </article>
</template>
