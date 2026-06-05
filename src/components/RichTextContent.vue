<script setup lang="ts">
import { computed } from 'vue'
import { sanitizeRichText } from '@/utils/richText'

const props = defineProps<{
  content?: string | null
  clamp?: boolean
}>()

const safeContent = computed(() => sanitizeRichText(props.content))
</script>

<template>
  <div
    class="prose-content rich-text-content"
    :class="{ 'rich-text-content--clamped': clamp }"
    v-html="safeContent"
  />
</template>
