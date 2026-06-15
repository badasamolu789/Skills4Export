<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCw, WifiOff } from 'lucide-vue-next'

const props = defineProps<{
  offline: boolean
  lastIssueAt?: string
}>()

const emit = defineEmits<{
  (event: 'retry'): void
}>()

const title = computed(() =>
  props.offline
    ? 'No internet connection'
    : 'We are having trouble reaching the server',
)

const description = computed(() =>
  props.offline
    ? 'Your device appears to be offline. Please wait while your connection comes back on. The app will recover automatically once the internet is available again.'
    : 'Your internet may still be on, but the app cannot reach the server right now. Please wait a moment for the connection to come back, then try again.',
)

const footnote = computed(() => {
  if (!props.lastIssueAt) {
    return 'Waiting for connection to come back on.'
  }

  const date = new Date(props.lastIssueAt)

  if (Number.isNaN(date.getTime())) {
    return 'Waiting for connection to come back on.'
  }

  return `Last checked ${date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })}`
})
</script>

<template>
  <section
    class="rounded-[0.95rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-4"
    role="status"
    aria-live="polite"
  >
    <div class="flex items-start gap-3">
      <div class="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
        <WifiOff class="h-5 w-5" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-[var(--text-primary)]">{{ title }}</p>
        <p class="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
          {{ description }}
        </p>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="inline-flex h-9 items-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="emit('retry')"
          >
            <RefreshCw class="h-4 w-4" />
            Try again
          </button>
          <span class="text-xs font-medium text-[var(--text-tertiary)]">
            {{ footnote }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
