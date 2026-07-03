<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import type { NotificationItem } from '@/services/notifications'
import { richTextToPlainText } from '@/utils/richText'

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

const deleteNotification = async (id: string) => {
  try {
    await notificationsStore.deleteNotification(id, authStore.authToken)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete notification.'
    toast.error('Notification delete failed', { description: message })
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
  <section class="mx-auto max-w-5xl space-y-7 px-3 py-6 sm:px-4 lg:px-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-4">
        <span class="flex h-14 w-14 items-center justify-center rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--accent-strong)] shadow-[var(--shadow-soft)]">
          <Bell class="h-7 w-7" />
        </span>
        <div>
          <h1 class="text-[1.8rem] font-semibold leading-tight text-[var(--text-primary)]">
            Notifications
          </h1>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">
            {{ notificationsStore.unreadCount }} unread
          </p>
        </div>
      </div>

      <button
        type="button"
        :disabled="notificationsStore.isLoading"
        class="inline-flex h-10 items-center justify-center rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        @click="refreshNotifications(false)"
      >
        {{ notificationsStore.isLoading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </header>

    <div class="space-y-3">
      <div
        v-if="notificationsStore.isLoading && !notificationsStore.visibleNotifications.length"
        class="space-y-3 rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)]"
        aria-label="Loading notifications"
      >
        <div v-for="item in 7" :key="item" class="flex animate-pulse items-center gap-3">
          <div class="h-12 w-12 rounded-[0.85rem] bg-[var(--surface-muted)]" />
          <div class="min-w-0 flex-1 space-y-2">
            <div class="h-3 w-3/4 rounded-full bg-[var(--surface-muted)]" />
            <div class="h-3 w-1/3 rounded-full bg-[var(--surface-muted)]" />
          </div>
          <div class="h-10 w-10 rounded-[0.75rem] bg-[var(--surface-muted)]" />
        </div>
      </div>

      <div
        v-else-if="notificationsStore.error && !notificationsStore.visibleNotifications.length"
        class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-soft)]"
      >
        {{ notificationsStore.error }}
      </div>

      <div
        v-else-if="!notificationsStore.visibleNotifications.length"
        class="rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 text-center text-sm text-[var(--text-secondary)] shadow-[var(--shadow-soft)]"
      >
        No notifications yet.
      </div>

      <article
        v-for="item in notificationsStore.visibleNotifications"
        :key="item.id"
        class="flex items-center gap-3 rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-soft)] transition hover:border-[color:var(--accent-soft)]"
      >
        <button type="button" class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="openNotification(item)">
          <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[0.85rem] bg-[var(--surface-secondary)] text-[var(--accent-strong)]">
            <img
              v-if="item.actor?.avatar"
              loading="lazy"
              decoding="async"
              :src="item.actor.avatar"
              :alt="item.actor.name || item.title"
              class="h-full w-full object-cover object-center"
            />
            <Bell v-else class="h-5 w-5" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold text-[var(--text-primary)]">{{ item.title }}</span>
            <span class="mt-1 line-clamp-2 block text-sm leading-6 text-[var(--text-secondary)]">{{ richTextToPlainText(item.description) }}</span>
            <span class="mt-1 block text-xs text-[var(--text-tertiary)]">{{ item.time }}</span>
          </span>
          <span
            v-if="item.unread"
            class="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--danger)]"
          />
        </button>

        <button
          type="button"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:text-[var(--danger)]"
          aria-label="Delete notification"
          @click="deleteNotification(item.id)"
        >
          <Trash2 class="h-4 w-4" />
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
