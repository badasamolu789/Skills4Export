<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Bell } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import type { NotificationItem } from '@/services/notifications'

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const router = useRouter()

const refreshNotifications = async (background = false) => {
  await notificationsStore.loadNotifications({
    token: authStore.authToken,
    page: 1,
    perPage: 30,
    background,
  })
}

const markAllRead = async () => {
  try {
    await notificationsStore.markAllAsRead(authStore.authToken)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update notifications.'
    toast.error('Notification update failed', { description: message })
  }
}

const clearNotifications = async () => {
  try {
    await notificationsStore.clearAll(authStore.authToken)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to clear notifications.'
    toast.error('Notification clear failed', { description: message })
  }
}

const openNotification = async (item: NotificationItem) => {
  if (item.unread) {
    try {
      await notificationsStore.markAsRead(item.id, authStore.authToken)
    } catch {
      // Keep navigation responsive even if the read call fails.
    }
  }

  if (item.targetUrl) {
    await router.push(item.targetUrl)
  }
}

onMounted(() => {
  void refreshNotifications(true)
})
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
          {{ notificationsStore.unreadCount }} unread
        </span>
      </div>
    </div>

    <div class="flex items-center justify-between gap-3">
      <button
        type="button"
        :disabled="notificationsStore.isLoading"
        class="inline-flex h-10 items-center justify-center rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        @click="refreshNotifications(false)"
      >
        {{ notificationsStore.isLoading ? 'Refreshing...' : 'Refresh' }}
      </button>
      <button
        type="button"
        :disabled="!notificationsStore.unreadCount"
        class="inline-flex h-10 items-center justify-center rounded-[0.85rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
        @click="markAllRead"
      >
        Mark all read
      </button>
      <button
        type="button"
        :disabled="!notificationsStore.visibleNotifications.length"
        class="inline-flex h-10 items-center justify-center rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-60"
        @click="clearNotifications"
      >
        Clear
      </button>
    </div>

    <div class="space-y-3">
      <div
        v-if="notificationsStore.isLoading && !notificationsStore.visibleNotifications.length"
        class="space-y-3 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)]"
        aria-label="Loading notifications"
      >
        <div v-for="item in 3" :key="item" class="flex animate-pulse items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-[var(--surface-muted)]" />
          <div class="min-w-0 flex-1 space-y-2">
            <div class="h-3 w-3/4 rounded-full bg-[var(--surface-muted)]" />
            <div class="h-3 w-1/2 rounded-full bg-[var(--surface-muted)]" />
          </div>
        </div>
      </div>

      <div
        v-else-if="notificationsStore.error && !notificationsStore.visibleNotifications.length"
        class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-soft)]"
      >
        {{ notificationsStore.error }}
      </div>

      <div
        v-else-if="!notificationsStore.visibleNotifications.length"
        class="rounded-[1.35rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-soft)]"
      >
        No notifications yet.
      </div>

      <article
        v-for="item in notificationsStore.visibleNotifications"
        :key="item.id"
        class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)] transition hover:border-[color:var(--accent-soft)]"
      >
        <button type="button" class="w-full text-left" @click="openNotification(item)">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-start gap-3">
              <span
                class="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)] text-[var(--accent-strong)]"
              >
                <img loading="lazy" decoding="async"
                  v-if="item.actor?.avatar"
                  :src="item.actor.avatar"
                  :alt="item.actor.name || item.title"
                  class="h-full w-full rounded-full object-cover object-center"
                />
                <Bell v-else class="h-5 w-5" />
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
        </button>
      </article>

      <button
        v-if="notificationsStore.hasMore"
        type="button"
        :disabled="notificationsStore.isLoading"
        class="inline-flex h-11 w-full items-center justify-center rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        @click="notificationsStore.loadMore(authStore.authToken)"
      >
        Load more
      </button>
    </div>
  </section>
</template>
