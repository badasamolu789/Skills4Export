<script setup lang="ts">
defineProps<{
  variant?: 'campaign' | 'jobs'
}>()
</script>

<template>
  <article>
    <a
      href="#"
      aria-label="Advertisement"
      class="block overflow-hidden rounded-[0.95rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] transition hover:opacity-90"
    >
      <div class="advert-placeholder aspect-[16/7] w-full" />
    </a>
  </article>
</template>
