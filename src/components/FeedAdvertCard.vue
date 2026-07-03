<script setup lang="ts">
import { computed } from 'vue'
import { Megaphone } from 'lucide-vue-next'
import type { AdvertRecord } from '@/services/adverts'

const props = defineProps<{
  advert?: AdvertRecord | null
}>()

const advertImageUrl = computed(() => props.advert?.imageUrl || '')
const advertLinkUrl = computed(() => props.advert?.linkUrl || advertImageUrl.value)
const advertAltText = computed(() =>
  props.advert?.ownerName ? `${props.advert.ownerName} advertisement` : 'Advertisement',
)
</script>

<template>
  <article>
    <a
      v-if="advertImageUrl"
      :href="advertLinkUrl"
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label="Advertisement"
      class="block overflow-hidden rounded-[0.95rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] transition hover:opacity-90"
    >
      <img
        :src="advertImageUrl"
        :alt="advertAltText"
        class="aspect-[16/7] w-full object-cover"
        loading="lazy"
        decoding="async"
      >
    </a>
    <div
      v-else
      class="flex aspect-[16/7] w-full flex-col items-center justify-center rounded-[0.95rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-5 text-center"
      aria-label="No advertisements available"
    >
      <span class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--accent-strong)]">
        <Megaphone class="h-5 w-5" />
      </span>
      <p class="mt-3 text-sm font-semibold text-[var(--text-primary)]">Currently no ads available</p>
    </div>
  </article>
</template>
