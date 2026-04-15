<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, Bell } from 'lucide-vue-next'
import { notifications } from '@/data/notifications'

const unreadCount = computed(() => notifications.filter((item) => item.unread).length)
</script>

<template>
  <section class="mx-auto max-w-3xl space-y-5">
    <div class="rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-elevated)] sm:p-5">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-start gap-3">
          <RouterLink
            to="/"
            class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            aria-label="Go back"
          >
            <ArrowLeft class="h-5 w-5" />
          </RouterLink>

          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Mobile Notifications
            </p>
            <h1 class="mt-2 text-[1.45rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.6rem]">
              Notifications
            </h1>
            <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              Keep up with mentions, recruiter activity, and platform updates from one place.
            </p>
          </div>
        </div>

        <span
          class="inline-flex items-center rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-sm font-medium text-[var(--text-secondary)]"
        >
          {{ unreadCount }} unread
        </span>
      </div>
    </div>

    <div class="space-y-3">
      <article
        v-for="item in notifications"
        :key="item.id"
        class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)]"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-3">
            <span
              class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--accent-strong)]"
            >
              <Bell class="h-5 w-5" />
            </span>
            <div>
              <p class="text-sm font-semibold text-[var(--text-primary)]">{{ item.title }}</p>
              <p class="mt-1 text-sm leading-7 text-[var(--text-secondary)]">{{ item.description }}</p>
              <p class="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                {{ item.time }}
              </p>
            </div>
          </div>

          <span
            v-if="item.unread"
            class="mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--danger)]"
          />
        </div>
      </article>
    </div>
  </section>
</template>
