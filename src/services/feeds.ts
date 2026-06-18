import { api } from '@/lib/api'
import type { PaginatorPayload } from '@/services/posts'

export type CompactFeedAuthor = {
  id?: string | null
  name?: string | null
  username?: string | null
  avatar?: string | null
  avatarUrl?: string | null
  avatar_url?: string | null
  skills?: unknown[]
}

export type CompactFeedMedia = {
  id?: string | null
  type?: string | null
  mediaType?: string | null
  media_type?: string | null
  url?: string | null
  thumbnailUrl?: string | null
  thumbnail_url?: string | null
  displayOrder?: number | string | null
  display_order?: number | string | null
}

export type CompactFeedViewerState = {
  isFollowing?: boolean
  is_following?: boolean
  isScored?: boolean
  is_scored?: boolean
  isSaved?: boolean
  is_saved?: boolean
}

export type CompactFeedRecord = {
  type?: 'post' | 'question' | 'POST' | 'QUESTION' | string
  id: string
  userId?: string | null
  user_id?: string | null
  communityId?: string | null
  community_id?: string | null
  pageId?: string | null
  page_id?: string | null
  title?: string | null
  content?: string | null
  body?: string | null
  description?: string | null
  createdAt?: string | null
  created_at?: string | null
  updatedAt?: string | null
  updated_at?: string | null
  score?: number | string | null
  commentsCount?: number | string | null
  comments_count?: number | string | null
  comment_count?: number | string | null
  answersCount?: number | string | null
  answers_count?: number | string | null
  answer_count?: number | string | null
  is_liked?: boolean | number | string | null
  isLiked?: boolean | number | string | null
  is_saved?: boolean | number | string | null
  isSaved?: boolean | number | string | null
  author?: CompactFeedAuthor | null
  user?: CompactFeedAuthor | null
  page?: {
    id?: string | null
    name?: string | null
    slug?: string | null
    avatar?: string | null
    avatarUrl?: string | null
    avatar_url?: string | null
    logo?: string | null
    logoUrl?: string | null
    logo_url?: string | null
    is_follow?: boolean | number | string | null
    isFollow?: boolean | number | string | null
  } | null
  community?: {
    id?: string | null
    name?: string | null
    icon?: string | null
    iconName?: string | null
    icon_name?: string | null
    iconClass?: string | null
    icon_class?: string | null
  } | null
  media?: CompactFeedMedia[]
  viewerState?: CompactFeedViewerState | null
  viewer_state?: CompactFeedViewerState | null
}

export type CompactFeedParams = {
  mode?: 'latest' | 'popular'
  page?: number
  per_page?: number
  q?: string
  communityId?: string | null
}

const withQuery = (path: string, params: Record<string, unknown> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    query.set(key, String(value))
  })

  const value = query.toString()
  return value ? `${path}?${value}` : path
}

export const feedsService = {
  listCompactFeed(params: CompactFeedParams = {}, token?: string | null) {
    return api.get<PaginatorPayload<CompactFeedRecord>>(
      withQuery('/feed', params),
      { token, suppressErrorModal: true },
    )
  },
}
