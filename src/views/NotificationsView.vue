<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { MoreHorizontal, RefreshCw } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import type { NotificationItem } from '@/services/notifications'
import NotificationActorAvatar from '@/components/NotificationActorAvatar.vue'
import { usersService } from '@/services/users'
import { useSocialActionsStore } from '@/stores/socialActions'
import { richTextToPlainText } from '@/utils/richText'

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const router = useRouter()
const socialActionsStore = useSocialActionsStore()
const openMenuId = ref<string | null>(null)
const loadMoreTarget = ref<HTMLElement | null>(null)
let loadMoreObserver: IntersectionObserver | null = null

const refreshNotifications = async (background = false) => {
  await notificationsStore.loadNotifications({
    token: authStore.authToken,
    page: 1,
    perPage: 5,
    background,
    force: !background,
  })
}

const deleteNotification = async (id: string) => {
  openMenuId.value = null
  try {
    await notificationsStore.deleteNotification(id, authStore.authToken)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to delete notification.'
    toast.error('Notification delete failed', { description: message })
  }
}

const markNotificationRead = async (id: string) => {
  openMenuId.value = null
  try {
    await notificationsStore.markAsRead(id, authStore.authToken)
  } catch (error) {
    toast.error('Unable to mark notification as read', { description: error instanceof Error ? error.message : undefined })
  }
}

const unfollowActor = async (item: NotificationItem) => {
  openMenuId.value = null
  const actorId = item.actor?.id
  if (!actorId || actorId === authStore.userId) return
  try {
    await usersService.unfollowUser(actorId, authStore.authToken)
    socialActionsStore.setUserFollowingState(actorId, false)
  } catch (error) {
    toast.error('Unable to unfollow user', { description: error instanceof Error ? error.message : undefined })
  }
}

const closeMenu = (event: MouseEvent) => {
  if (!(event.target as Element).closest('[data-notification-menu]')) openMenuId.value = null
}

const loadMore = () => {
  if (notificationsStore.hasMore && !notificationsStore.isLoading) {
    void notificationsStore.loadMore(authStore.authToken).then(async () => {
      await nextTick()
      if (loadMoreTarget.value) loadMoreObserver?.observe(loadMoreTarget.value)
    })
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
  document.addEventListener('click', closeMenu)
  if (typeof IntersectionObserver !== 'undefined') {
    loadMoreObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMore()
    }, { rootMargin: '200px' })
    if (loadMoreTarget.value) loadMoreObserver.observe(loadMoreTarget.value)
  }
})

onBeforeUnmount(() => {
  loadMoreObserver?.disconnect()
  document.removeEventListener('click', closeMenu)
})

watch(loadMoreTarget, (target, previous) => {
  if (previous) loadMoreObserver?.unobserve(previous)
  if (target) loadMoreObserver?.observe(target)
})
</script>

<template>
  <section class="mx-auto w-full max-w-[44rem] space-y-7 py-6 sm:px-4 lg:max-w-[46rem] lg:px-0">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-4">
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
        class="inline-flex h-10 w-10 items-center justify-center rounded-[0.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Refresh notifications"
        title="Refresh notifications"
        @click="refreshNotifications(false)"
      >
        <RefreshCw class="h-4 w-4" :class="notificationsStore.isLoading ? 'animate-spin' : ''" />
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
          <NotificationActorAvatar :item="item" />
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

        <div class="relative shrink-0 self-start" data-notification-menu>
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-[0.5rem] text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
            :aria-label="`Actions for ${item.title}`"
            aria-haspopup="menu"
            :aria-expanded="openMenuId === item.id"
            @click="openMenuId = openMenuId === item.id ? null : item.id"
          >
            <MoreHorizontal class="h-5 w-5" />
          </button>
          <div
            v-if="openMenuId === item.id"
            role="menu"
            class="absolute right-0 top-11 z-20 w-44 rounded-[0.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-1 shadow-[var(--shadow-elevated)]"
          >
            <button v-if="item.unread" type="button" role="menuitem" class="w-full rounded-[0.35rem] px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]" @click="markNotificationRead(item.id)">Mark as read</button>
            <button v-else type="button" role="menuitem" disabled title="Mark as unread is not supported yet" class="w-full cursor-not-allowed rounded-[0.35rem] px-3 py-2 text-left text-sm text-[var(--text-tertiary)] opacity-60">Mark as unread</button>
            <button v-if="item.actor?.id && item.actor?.id !== authStore.userId" type="button" role="menuitem" class="w-full rounded-[0.35rem] px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]" @click="unfollowActor(item)">Unfollow user</button>
            <button type="button" role="menuitem" class="w-full rounded-[0.35rem] px-3 py-2 text-left text-sm text-[var(--danger)] hover:bg-[var(--surface-secondary)]" @click="deleteNotification(item.id)">Delete notification</button>
          </div>
        </div>
      </article>

      <div v-if="notificationsStore.hasMore" ref="loadMoreTarget" class="h-8" aria-hidden="true" />
      <p v-if="notificationsStore.isLoading && notificationsStore.visibleNotifications.length" class="py-2 text-center text-sm text-[var(--text-tertiary)]">Loading notifications...</p>
    </div>
  </section>
</template>
