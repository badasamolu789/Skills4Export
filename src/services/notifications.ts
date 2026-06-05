import { api, apiConfig } from '@/lib/api'
import { getDisplayName } from '@/utils/displayName'

export type NotificationActor = {
  id?: string
  name?: string
  avatar?: string | null
}

export type NotificationTarget = {
  id?: string
  type?: string
  title?: string
  url?: string
}

export type NotificationItem = {
  id: string
  title: string
  description: string
  time: string
  createdAt: string
  unread: boolean
  type?: string
  actor?: NotificationActor | null
  target?: NotificationTarget | null
  targetUrl?: string
  raw?: Record<string, unknown>
}

export type NotificationsListParams = {
  page?: number
  per_page?: number
  perPage?: number
  limit?: number
  offset?: number
  q?: string
  status?: string
  sort?: string
}

export type NotificationsListResponse = {
  current_page?: number
  data?: Record<string, unknown>[]
  last_page?: number
  per_page?: number
  total?: number
  [key: string]: unknown
}

export type UnreadCountResponse = {
  success?: boolean
  message?: string
  count?: number
  data?: {
    count?: number
  } | null
}

export type NotificationMutationResponse = {
  success?: boolean
  message?: string
  data?: unknown
}

export type NotificationPreferences = Record<string, unknown>

export type NotificationPreferencesResponse = {
  success?: boolean
  message?: string
  data?: NotificationPreferences | null
}

const NOTIFICATION_ROUTES = {
  notifications: '/notifications',
  userNotifications: '/user/notifications',
  unreadCount: '/notifications/unread-count',
  stream: '/notifications/stream',
  markRead: '/notifications/mark-read',
  readAll: '/notifications/read-all',
  readOne: (id: string) => `/notifications/${encodeURIComponent(id)}/read`,
  notificationById: (id: string) => `/notifications/${encodeURIComponent(id)}`,
  preferences: '/users/me/notification-preferences',
} as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getRecord = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key]
    if (isRecord(value)) {
      return value
    }
  }

  return null
}

const getString = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }

    if (typeof value === 'number') {
      return String(value)
    }
  }

  return ''
}

const getBoolean = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'boolean') {
      return value
    }

    if (typeof value === 'number') {
      return value > 0
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (['true', '1', 'yes', 'unread'].includes(normalized)) {
        return true
      }
      if (['false', '0', 'no', 'read'].includes(normalized)) {
        return false
      }
    }
  }

  return null
}

const formatNotificationTime = (value: string) => {
  const date = new Date(value)

  if (!value || Number.isNaN(date.getTime())) {
    return 'Recently'
  }

  const diffMs = date.getTime() - Date.now()
  const minutes = Math.round(diffMs / 60000)
  const hours = Math.round(diffMs / 3600000)
  const days = Math.round(diffMs / 86400000)

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  if (Math.abs(minutes) < 60) {
    return formatter.format(minutes, 'minute')
  }

  if (Math.abs(hours) < 24) {
    return formatter.format(hours, 'hour')
  }

  return formatter.format(days, 'day')
}

const buildQuery = (params: NotificationsListParams = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value))
    }
  })

  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

const inferTargetUrl = (record: Record<string, unknown>, target: Record<string, unknown> | null) => {
  const directUrl = getString(record, ['url', 'link', 'href', 'actionUrl', 'action_url', 'targetUrl', 'target_url'])
  if (directUrl) {
    return directUrl
  }

  if (target) {
    const targetUrl = getString(target, ['url', 'link', 'href', 'path'])
    if (targetUrl) {
      return targetUrl
    }

    const targetType = getString(target, ['type', 'targetType', 'target_type'])
    const targetId = getString(target, ['id', 'targetId', 'target_id'])

    if (targetType && targetId) {
      const routeMap: Record<string, string> = {
        post: 'posts',
        question: 'questions',
        answer: 'questions',
        community: 'communities',
        page: 'pages',
        user: 'users',
        profile: 'users',
        job: 'jobs',
        freelancer: 'freelancers',
      }
      const segment = routeMap[targetType] || targetType
      return `/${segment}/${targetId}`
    }
  }

  return ''
}

export const normalizeNotification = (record: Record<string, unknown>): NotificationItem => {
  const data = getRecord(record, ['data', 'payload', 'meta', 'metadata'])
  const actor = getRecord(record, ['actor', 'sender', 'user', 'fromUser', 'from_user']) ||
    (data ? getRecord(data, ['actor', 'sender', 'user', 'fromUser', 'from_user']) : null)
  const target = getRecord(record, ['target', 'resource', 'entity']) ||
    (data ? getRecord(data, ['target', 'resource', 'entity']) : null)
  const id = getString(record, ['id', 'notificationId', 'notification_id', 'uuid']) || getString(data ?? {}, ['id'])
  const title =
    getString(record, ['title', 'subject', 'heading']) ||
    getString(data ?? {}, ['title', 'subject', 'heading']) ||
    'Notification'
  const description =
    getString(record, ['description', 'body', 'message', 'content']) ||
    getString(data ?? {}, ['description', 'body', 'message', 'content']) ||
    title
  const createdAt =
    getString(record, ['createdAt', 'created_at', 'created', 'timestamp']) ||
    getString(data ?? {}, ['createdAt', 'created_at', 'created', 'timestamp']) ||
    new Date().toISOString()
  const readAt = getString(record, ['readAt', 'read_at', 'seenAt', 'seen_at'])
  const explicitUnread = getBoolean(record, ['unread', 'isUnread', 'is_unread'])
  const explicitRead = getBoolean(record, ['read', 'isRead', 'is_read', 'seen', 'isSeen', 'is_seen'])
  const type = getString(record, ['type', 'kind', 'event']) || getString(data ?? {}, ['type', 'kind', 'event'])
  const normalizedTarget = target
    ? {
        id: getString(target, ['id', 'targetId', 'target_id']),
        type: getString(target, ['type', 'targetType', 'target_type']),
        title: getString(target, ['title', 'name']),
        url: getString(target, ['url', 'link', 'href', 'path']),
      }
    : null

  return {
    id: id || `${createdAt}-${title}`,
    title,
    description,
    time: formatNotificationTime(createdAt),
    createdAt,
    unread: explicitUnread ?? (explicitRead !== null ? !explicitRead : !readAt),
    type,
    actor: actor
      ? {
          id: getString(actor, ['id', 'userId', 'user_id']),
          name: getDisplayName(
            getString(actor, ['name', 'displayName', 'display_name']),
            getString(actor, ['username']),
          ),
          avatar: getString(actor, ['avatar', 'avatarUrl', 'avatar_url', 'image', 'imageUrl']) || null,
        }
      : null,
    target: normalizedTarget,
    targetUrl: inferTargetUrl(record, target),
    raw: record,
  }
}

export const notificationsService = {
  getStreamUrl(token?: string | null) {
    const base = apiConfig.baseUrl || ''
    const path = `${base}${NOTIFICATION_ROUTES.stream}`
    const query = new URLSearchParams()

    if (token) {
      query.set('token', token)
    }

    const value = query.toString()
    return value ? `${path}?${value}` : path
  },

  async listNotifications(
    params: NotificationsListParams = {},
    token?: string | null,
    options?: { signal?: AbortSignal; suppressErrorModal?: boolean },
  ) {
    return api.get<NotificationsListResponse>(
      `${NOTIFICATION_ROUTES.notifications}${buildQuery(params)}`,
      { token, signal: options?.signal, suppressErrorModal: options?.suppressErrorModal },
    )
  },

  async listUserNotifications(
    params: NotificationsListParams = {},
    token?: string | null,
    options?: { signal?: AbortSignal; suppressErrorModal?: boolean },
  ) {
    return api.get<NotificationsListResponse>(
      `${NOTIFICATION_ROUTES.userNotifications}${buildQuery(params)}`,
      { token, signal: options?.signal, suppressErrorModal: options?.suppressErrorModal },
    )
  },

  async getUnreadCount(token?: string | null, options?: { signal?: AbortSignal; suppressErrorModal?: boolean }) {
    return api.get<UnreadCountResponse>(NOTIFICATION_ROUTES.unreadCount, {
      token,
      signal: options?.signal,
      suppressErrorModal: options?.suppressErrorModal,
    })
  },

  async markNotificationRead(id: string, token?: string | null) {
    return api.patch<NotificationMutationResponse>(NOTIFICATION_ROUTES.readOne(id), undefined, { token })
  },

  async markNotificationsRead(ids: string[], token?: string | null) {
    return api.patch<NotificationMutationResponse>(NOTIFICATION_ROUTES.markRead, { ids, notificationIds: ids }, { token })
  },

  async markAllNotificationsRead(token?: string | null) {
    return api.patch<NotificationMutationResponse>(NOTIFICATION_ROUTES.readAll, undefined, { token })
  },

  async deleteNotification(id: string, token?: string | null) {
    return api.delete<NotificationMutationResponse>(NOTIFICATION_ROUTES.notificationById(id), { token })
  },

  async clearNotifications(token?: string | null) {
    return api.delete<NotificationMutationResponse>(NOTIFICATION_ROUTES.notifications, { token })
  },

  async getPreferences(token?: string | null) {
    return api.get<NotificationPreferencesResponse>(NOTIFICATION_ROUTES.preferences, { token })
  },

  async updatePreferences(payload: NotificationPreferences, token?: string | null) {
    return api.put<NotificationPreferencesResponse>(NOTIFICATION_ROUTES.preferences, payload, { token })
  },
}
