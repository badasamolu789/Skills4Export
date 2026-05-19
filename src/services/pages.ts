import { api } from '@/lib/api'
import type { ApiSuccessResponse, PaginatorPayload } from '@/services/posts'

export type PageRecord = {
  id: string
  ownerId?: string | null
  owner_id?: string | null
  userId?: string | null
  user_id?: string | null
  createdByUserId?: string | null
  created_by_user_id?: string | null
  categoryId?: string | null
  category_id?: string | null
  name: string
  slug: string
  description: string
  avatar?: string | null
  coverImage?: string | null
  isVerified: number
  isActive: number
  isApproved: number
  approvalNotes?: string | null
  approvedAt?: string | null
  approvedBy?: string | null
  metadata?: Record<string, unknown> | null
  followers_count?: number | null
  posts_count?: number | null
  category_pages_count?: number | null
  createdAt: string
  updatedAt: string
}

export type CreatePageRequest = {
  categoryId?: string
  name: string
  slug: string
  description?: string
  metadata?: Record<string, unknown> | null
}

export type UploadPageAvatarFileResponse = {
  success: boolean
  data: {
    jobId: string
  }
}

export type DeletePageResponse = ApiSuccessResponse<{
  id: string
}>

export type PageListParams = {
  page?: number
  per_page?: number
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

const PAGE_ROUTES = {
  pages: '/pages',
  pageById: (id: string) => `/pages/${id}`,
  pageAvatarFile: (id: string) => `/pages/${id}/avatar-file`,
} as const

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? value as Record<string, unknown> : {}

const readString = (...values: unknown[]) => {
  const value = values.find((item) => typeof item === 'string' && item.trim())
  return typeof value === 'string' ? value : ''
}

const readNullableString = (...values: unknown[]) => {
  const value = readString(...values)
  return value || null
}

const readNumber = (...values: unknown[]) => {
  const value = values.find((item) => {
    if (typeof item === 'number') {
      return Number.isFinite(item)
    }

    if (typeof item === 'string' && item.trim()) {
      return Number.isFinite(Number(item))
    }

    return false
  })

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    return Number(value)
  }

  return 0
}

const readMetadata = (...values: unknown[]) => {
  const value = values.find((item) => item && typeof item === 'object' && !Array.isArray(item))
  return value ? value as Record<string, unknown> : {}
}

const unwrapPageRecord = (value: unknown) => {
  const record = asRecord(value)
  return asRecord(record.page || record.record || record.item || value)
}

const normalizePage = (page: unknown): PageRecord => {
  const record = unwrapPageRecord(page)
  const owner = asRecord(record.owner || record.user || record.createdBy)
  const category = asRecord(record.category)

  return {
    ...(record as PageRecord),
    id: readString(record.id, record.uuid, record.pageId, record.page_id),
    ownerId: readNullableString(
      record.ownerId,
      record.owner_id,
      record.userId,
      record.user_id,
      record.createdByUserId,
      record.created_by_user_id,
      owner.id,
      owner.userId,
      owner.user_id,
    ),
    categoryId: readNullableString(record.categoryId, record.category_id, category.id),
    name: readString(record.name, record.title) || 'Untitled page',
    slug: readString(record.slug),
    description: readString(record.description, record.bio, record.about),
    avatar: readNullableString(record.avatar, record.avatarUrl, record.avatar_url, record.logo, record.logoUrl, record.logo_url),
    coverImage: readNullableString(record.coverImage, record.cover_image, record.banner, record.bannerUrl, record.banner_url),
    isVerified: readNumber(record.isVerified, record.is_verified),
    isActive: readNumber(record.isActive, record.is_active, 1),
    isApproved: readNumber(record.isApproved, record.is_approved, 1),
    approvalNotes: readNullableString(record.approvalNotes, record.approval_notes),
    approvedAt: readNullableString(record.approvedAt, record.approved_at),
    approvedBy: readNullableString(record.approvedBy, record.approved_by),
    metadata: readMetadata(record.metadata),
    followers_count: readNumber(record.followers_count, record.followersCount),
    posts_count: readNumber(record.posts_count, record.postsCount),
    category_pages_count: readNumber(record.category_pages_count, record.categoryPagesCount),
    createdAt: readString(record.createdAt, record.created_at) || new Date().toISOString(),
    updatedAt: readString(record.updatedAt, record.updated_at) || readString(record.createdAt, record.created_at) || new Date().toISOString(),
  }
}

const normalizePaginator = (response: PaginatorPayload<PageRecord>): PaginatorPayload<PageRecord> => ({
  ...response,
  data: Array.isArray(response.data) ? response.data.map(normalizePage) : [],
})

const normalizeSuccess = (response: ApiSuccessResponse<PageRecord>): ApiSuccessResponse<PageRecord> => ({
  ...response,
  data: normalizePage(response.data),
})

export const pagesService = {
  async listPages(params: PageListParams = {}, token?: string | null) {
    const response = await api.get<PaginatorPayload<PageRecord>>(withQuery(PAGE_ROUTES.pages, params), { token })
    return normalizePaginator(response)
  },

  async createPage(payload: CreatePageRequest, token?: string | null) {
    const response = await api.post<ApiSuccessResponse<PageRecord>>(PAGE_ROUTES.pages, payload, { token })
    return normalizeSuccess(response)
  },

  async getPage(id: string, token?: string | null) {
    const response = await api.get<ApiSuccessResponse<PageRecord>>(PAGE_ROUTES.pageById(id), { token })
    return normalizeSuccess(response)
  },

  uploadPageAvatarFile(id: string, file: File, token?: string | null) {
    const formData = new FormData()
    formData.append('file', file)

    return api.post<UploadPageAvatarFileResponse>(PAGE_ROUTES.pageAvatarFile(id), formData, {
      token,
      retry: false,
    })
  },

  deletePage(id: string, token?: string | null) {
    return api.delete<DeletePageResponse>(PAGE_ROUTES.pageById(id), { token })
  },
}
