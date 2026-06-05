import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  normalizeNotification,
  notificationsService,
  type NotificationItem,
} from '@/services/notifications'

const SYNC_INTERVAL_MS = 30000

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<NotificationItem[]>([])
  const unreadCount = ref(0)
  const currentPage = ref(1)
  const lastPage = ref(1)
  const total = ref(0)
  const isLoading = ref(false)
  const isRefreshing = ref(false)
  const isRealtimeConnected = ref(false)
  const error = ref('')
  const lastSyncedAt = ref('')
  let syncTimer: number | null = null
  let eventSource: EventSource | null = null
  let hasCompletedInitialSync = false

  const hasUnread = computed(() => unreadCount.value > 0)
  const hasMore = computed(() => currentPage.value < lastPage.value)
  const visibleNotifications = computed(() => notifications.value)

  const mergeNotifications = (nextItems: NotificationItem[], append: boolean) => {
    if (!append) {
      notifications.value = nextItems
      return
    }

    const seen = new Set(notifications.value.map((item) => item.id))
    notifications.value = [
      ...notifications.value,
      ...nextItems.filter((item) => !seen.has(item.id)),
    ]
  }

  const upsertNotification = (item: NotificationItem) => {
    const existingIndex = notifications.value.findIndex((notification) => notification.id === item.id)

    if (existingIndex >= 0) {
      notifications.value = notifications.value.map((notification, index) =>
        index === existingIndex ? { ...notification, ...item } : notification,
      )
      return
    }

    notifications.value = [item, ...notifications.value]
  }

  const showBrowserNotification = (item: NotificationItem) => {
    if (
      typeof window === 'undefined' ||
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted' ||
      document.visibilityState === 'visible'
    ) {
      return
    }

    const browserNotification = new Notification(item.title, {
      body: item.description,
      icon: item.actor?.avatar || '/logo_1.svg',
      tag: item.id,
    })

    browserNotification.onclick = () => {
      window.focus()
      if (item.targetUrl) {
        window.location.assign(item.targetUrl)
      }
      browserNotification.close()
    }
  }

  const requestBrowserNotifications = async () => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'default') {
      return Notification?.permission
    }

    return Notification.requestPermission()
  }

  const syncUnreadCount = async (token?: string | null, options?: { suppressErrorModal?: boolean }) => {
    if (!token) {
      unreadCount.value = 0
      return
    }

    const response = await notificationsService.getUnreadCount(token, {
      suppressErrorModal: options?.suppressErrorModal ?? true,
    })
    unreadCount.value = Number(response.count ?? response.data?.count ?? unreadCount.value ?? 0)
  }

  const handleRealtimePayload = (payload: unknown) => {
    if (!payload || typeof payload !== 'object') {
      return
    }

    const record = payload as Record<string, unknown>
    const directCount = typeof record.count === 'number'
      ? record.count
      : typeof record.unreadCount === 'number'
        ? record.unreadCount
        : null
    const data = record.data && typeof record.data === 'object' && !Array.isArray(record.data)
      ? record.data as Record<string, unknown>
      : null
    const notificationRecord =
      data?.notification && typeof data.notification === 'object'
        ? data.notification as Record<string, unknown>
        : record.notification && typeof record.notification === 'object'
          ? record.notification as Record<string, unknown>
          : data ?? record

    if (directCount !== null) {
      unreadCount.value = directCount
    }

    const notification = normalizeNotification(notificationRecord)
    if (notification.id) {
      upsertNotification(notification)
      if (notification.unread) {
        unreadCount.value = Math.max(unreadCount.value, notifications.value.filter((item) => item.unread).length)
        showBrowserNotification(notification)
      }
    }
  }

  const parseRealtimeMessage = (event: MessageEvent) => {
    try {
      handleRealtimePayload(JSON.parse(event.data))
    } catch {
      return
    }
  }

  const loadNotifications = async (options?: {
    token?: string | null
    page?: number
    perPage?: number
    append?: boolean
    background?: boolean
  }) => {
    const token = options?.token

    if (!token) {
      notifications.value = []
      unreadCount.value = 0
      return
    }

    const page = options?.page ?? 1
    const append = Boolean(options?.append)
    const background = Boolean(options?.background)

    if (background) {
      isRefreshing.value = true
    } else {
      isLoading.value = true
    }

    error.value = ''

    try {
      const response = await notificationsService.listNotifications(
        {
          page,
          per_page: options?.perPage ?? 20,
          sort: '-createdAt',
        },
        token,
        { suppressErrorModal: background },
      )
      const previousUnread = unreadCount.value
      const rawItems = response.data ?? []
      const nextItems = rawItems.map(normalizeNotification)

      mergeNotifications(nextItems, append)
      currentPage.value = Number(response.current_page ?? page)
      lastPage.value = Number(response.last_page ?? page)
      total.value = Number(response.total ?? notifications.value.length)
      unreadCount.value = nextItems.filter((item) => item.unread).length +
        (append ? Math.max(0, unreadCount.value - notifications.value.filter((item) => item.unread).length) : 0)

      await syncUnreadCount(token, { suppressErrorModal: true })
      if (hasCompletedInitialSync && unreadCount.value > previousUnread) {
        const newestUnread = nextItems.find((item) => item.unread)
        if (newestUnread) {
          showBrowserNotification(newestUnread)
        }
      }

      hasCompletedInitialSync = true
      lastSyncedAt.value = new Date().toISOString()
    } catch (loadError) {
      error.value = loadError instanceof Error ? loadError.message : 'Unable to load notifications.'
    } finally {
      isLoading.value = false
      isRefreshing.value = false
    }
  }

  const refresh = async (token?: string | null, background = true) => {
    await loadNotifications({ token, page: 1, perPage: 20, background })
  }

  const loadMore = async (token?: string | null) => {
    if (!hasMore.value || isLoading.value) {
      return
    }

    await loadNotifications({
      token,
      page: currentPage.value + 1,
      perPage: 20,
      append: true,
    })
  }

  const markAsRead = async (id: string, token?: string | null) => {
    if (!token || !id) {
      return
    }

    const previousItems = notifications.value
    const previousUnread = unreadCount.value
    const wasUnread = notifications.value.some((item) => item.id === id && item.unread)

    notifications.value = notifications.value.map((item) =>
      item.id === id ? { ...item, unread: false } : item,
    )

    if (wasUnread) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }

    try {
      await notificationsService.markNotificationRead(id, token)
    } catch (markError) {
      notifications.value = previousItems
      unreadCount.value = previousUnread
      throw markError
    }
  }

  const markAllAsRead = async (token?: string | null) => {
    if (!token) {
      return
    }

    const previousItems = notifications.value
    const previousUnread = unreadCount.value

    notifications.value = notifications.value.map((item) => ({ ...item, unread: false }))
    unreadCount.value = 0

    try {
      await notificationsService.markAllNotificationsRead(token)
    } catch (markError) {
      notifications.value = previousItems
      unreadCount.value = previousUnread
      throw markError
    }
  }

  const deleteNotification = async (id: string, token?: string | null) => {
    if (!token || !id) {
      return
    }

    const previousItems = notifications.value
    const previousUnread = unreadCount.value
    const deletedItem = notifications.value.find((item) => item.id === id)

    notifications.value = notifications.value.filter((item) => item.id !== id)
    if (deletedItem?.unread) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }

    try {
      await notificationsService.deleteNotification(id, token)
    } catch (deleteError) {
      notifications.value = previousItems
      unreadCount.value = previousUnread
      throw deleteError
    }
  }

  const clearAll = async (token?: string | null) => {
    if (!token) {
      return
    }

    const previousItems = notifications.value
    const previousUnread = unreadCount.value
    notifications.value = []
    unreadCount.value = 0

    try {
      await notificationsService.clearNotifications(token)
    } catch (clearError) {
      notifications.value = previousItems
      unreadCount.value = previousUnread
      throw clearError
    }
  }

  const startRealtimeStream = (token?: string | null) => {
    stopRealtimeStream()

    if (!token || typeof EventSource === 'undefined') {
      return
    }

    eventSource = new EventSource(notificationsService.getStreamUrl(token))
    eventSource.onopen = () => {
      isRealtimeConnected.value = true
    }
    eventSource.onmessage = parseRealtimeMessage
    eventSource.addEventListener('notification', parseRealtimeMessage)
    eventSource.addEventListener('unread-count', parseRealtimeMessage)
    eventSource.onerror = () => {
      isRealtimeConnected.value = false
    }
  }

  const stopRealtimeStream = () => {
    eventSource?.close()
    eventSource = null
    isRealtimeConnected.value = false
  }

  const startBackgroundSync = (token?: string | null) => {
    stopBackgroundSync()
    stopRealtimeStream()

    if (!token || typeof window === 'undefined') {
      return
    }

    void refresh(token, true)
    startRealtimeStream(token)
    syncTimer = window.setInterval(() => {
      void refresh(token, true)
    }, isRealtimeConnected.value ? SYNC_INTERVAL_MS * 4 : SYNC_INTERVAL_MS)
  }

  const stopBackgroundSync = () => {
    if (syncTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(syncTimer)
    }

    syncTimer = null
  }

  const reset = () => {
    stopBackgroundSync()
    stopRealtimeStream()
    notifications.value = []
    unreadCount.value = 0
    currentPage.value = 1
    lastPage.value = 1
    total.value = 0
    isLoading.value = false
    isRefreshing.value = false
    isRealtimeConnected.value = false
    error.value = ''
    lastSyncedAt.value = ''
    hasCompletedInitialSync = false
  }

  return {
    notifications,
    visibleNotifications,
    unreadCount,
    currentPage,
    lastPage,
    total,
    isLoading,
    isRefreshing,
    isRealtimeConnected,
    error,
    lastSyncedAt,
    hasUnread,
    hasMore,
    loadNotifications,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    requestBrowserNotifications,
    startBackgroundSync,
    startRealtimeStream,
    stopBackgroundSync,
    stopRealtimeStream,
    reset,
  }
})
