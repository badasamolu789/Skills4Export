<script setup lang="ts">
import { computed } from 'vue'
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
      >
    </a>
    <a
      v-else
      href="#"
      aria-label="Advertisement"
      class="block overflow-hidden rounded-[0.95rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] transition hover:opacity-90"
      @click.prevent
    >
      <div class="advert-placeholder aspect-[16/7] w-full" />
    </a>
  </article>
</template>
