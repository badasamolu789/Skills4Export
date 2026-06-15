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
  type?: 'business' | 'student' | null
  pageType?: 'business' | 'student' | null
  page_type?: 'business' | 'student' | null
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
  is_follow?: boolean
  isFollow?: boolean
  createdAt: string
  updatedAt: string
}

export type CreatePageRequest = {
  type?: 'business' | 'student'
  pageType?: 'business' | 'student'
  page_type?: 'business' | 'student'
  categoryId?: string
  name: string
  slug: string
  description?: string
  avatar?: string | null
  coverImage?: string | null
  slogan?: string
  contactEmail?: string
  website?: string
  staffSize?: string
  businessCategory?: string
  email?: string
  phone?: string
  courseOfStudy?: string
  graduationDate?: string
  skills?: string[] | string
  metadata?: Record<string, unknown> | null
}

export type UpdatePageRequest = Partial<CreatePageRequest>

export type UploadPageAvatarFileResponse = {
  success: boolean
  message?: string
  data: {
    jobId?: string
    assetId?: string
    id?: string
    url?: string
    publicId?: string
    kind?: string
    title?: string | null
    mimeType?: string | null
    sizeBytes?: number | null
    avatar?: string | null
    coverImage?: string | null
    cover_image?: string | null
    page?: Partial<PageRecord> | null
  }
}

export type DeletePageResponse = ApiSuccessResponse<{
  id: string
}>

export type PageListParams = {
  page?: number
  per_page?: number
  q?: string
  type?: 'business' | 'student'
  ownerId?: string
  owner_id?: string
  userId?: string
  user_id?: string
}

export type PagePrefillRecord = {
  type?: 'business' | 'student'
  pageType?: 'business' | 'student'
  name?: string | null
  email?: string | null
  phone?: string | null
  courseOfStudy?: string | null
  skills?: string[] | null
  contactEmail?: string | null
  website?: string | null
  businessCategory?: string | null
  avatar?: string | null
}

const PAGE_METADATA_KEYS = [
  'slogan',
  'contactEmail',
  'website',
  'staffSize',
  'businessCategory',
  'email',
  'phone',
  'courseOfStudy',
  'graduationDate',
  'skills',
] as const

const PAGE_FORMATTED_FIELDS = new Set(['contactEmail', 'email', 'graduationDate'])

const normalizePagePayload = (
  payload: CreatePageRequest | UpdatePageRequest,
  options: { preserveEmpty?: boolean } = {},
) => {
  const preserveEmpty = options.preserveEmpty ?? false
  const normalized: UpdatePageRequest = {}
  const normalizedRecord = normalized as Record<string, unknown>

  for (const [key, value] of Object.entries(payload)) {
    if (key === 'metadata') {
      continue
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed && PAGE_FORMATTED_FIELDS.has(key)) {
        continue
      }
      if (trimmed || preserveEmpty) {
        normalizedRecord[key] = trimmed
      }
      continue
    }

    if (Array.isArray(value)) {
      const items = value.map((item) => String(item).trim()).filter(Boolean)
      if (items.length || preserveEmpty) {
        normalizedRecord[key] = items
      }
      continue
    }

    if (value !== undefined && (value !== null || preserveEmpty)) {
      normalizedRecord[key] = value
    }
  }

  const metadata = readMetadata(payload.metadata)
  const normalizedMetadata: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed && PAGE_FORMATTED_FIELDS.has(key)) {
        continue
      }
      if (trimmed || preserveEmpty) normalizedMetadata[key] = trimmed
      continue
    }

    if (Array.isArray(value)) {
      const items = value.map((item) => String(item).trim()).filter(Boolean)
      if (items.length || preserveEmpty) normalizedMetadata[key] = items
      continue
    }

    if (value !== undefined && (value !== null || preserveEmpty)) {
      normalizedMetadata[key] = value
    }
  }

  if (Object.keys(normalizedMetadata).length || (preserveEmpty && payload.metadata !== undefined)) {
    normalized.metadata = normalizedMetadata
  }

  return normalized
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
  myPages: '/me/pages',
  pagePrefill: '/pages/prefill',
  pageById: (id: string) => `/pages/${id}`,
  pageFollow: (id: string) => `/pages/${id}/follow`,
  pageFollowers: (id: string) => `/pages/${id}/followers`,
  pageAvatarFile: (id: string) => `/pages/${id}/avatar-file`,
  pageCoverFile: (id: string) => `/pages/${id}/cover-file`,
  pageUploads: (id: string) => `/page/${id}/uploads`,
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

  if (value) {
    return value as Record<string, unknown>
  }

  const jsonValue = values.find((item) => typeof item === 'string' && item.trim().startsWith('{'))

  if (typeof jsonValue === 'string') {
    try {
      const parsed = JSON.parse(jsonValue)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {}
    } catch {
      return {}
    }
  }

  return {}
}

const unwrapPageRecord = (value: unknown) => {
  const record = asRecord(value)
  return asRecord(record.page || record.record || record.item || value)
}

const normalizePage = (page: unknown): PageRecord => {
  const record = unwrapPageRecord(page)
  const owner = asRecord(record.owner || record.user || record.createdBy)
  const category = asRecord(record.category)
  const metadata: Record<string, unknown> = {
    ...readMetadata(record.metadata),
  }

  for (const key of PAGE_METADATA_KEYS) {
    if (metadata[key] === undefined && record[key] !== undefined && record[key] !== null) {
      metadata[key] = record[key]
    }
  }

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
    type: readNullableString(record.type, record.pageType, record.page_type) as PageRecord['type'],
    pageType: readNullableString(record.pageType, record.type, record.page_type) as PageRecord['pageType'],
    page_type: readNullableString(record.page_type, record.type, record.pageType) as PageRecord['page_type'],
    name: readString(record.name, record.title),
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
    metadata,
    followers_count: readNumber(record.followers_count, record.followersCount),
    posts_count: readNumber(record.posts_count, record.postsCount),
    category_pages_count: readNumber(record.category_pages_count, record.categoryPagesCount),
    is_follow: Boolean(record.is_follow ?? record.isFollow),
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
  getPagePrefill(type: 'business' | 'student', token?: string | null) {
    return api.get<ApiSuccessResponse<PagePrefillRecord>>(
      withQuery(PAGE_ROUTES.pagePrefill, {
        type,
        pageType: type,
      }),
      {
        token,
        suppressErrorModal: true,
      },
    )
  },

  async listPages(params: PageListParams = {}, token?: string | null) {
    const response = await api.get<PaginatorPayload<PageRecord>>(withQuery(PAGE_ROUTES.pages, params), { token })
    return normalizePaginator(response)
  },

  async listMyPages(params: PageListParams = {}, token?: string | null) {
    const response = await api.get<PaginatorPayload<PageRecord>>(withQuery(PAGE_ROUTES.myPages, params), { token })
    return normalizePaginator(response)
  },

  async findPageBySlug(slug: string, token?: string | null, options?: { ownedOnly?: boolean }) {
    const response = options?.ownedOnly
      ? await pagesService.listMyPages({ per_page: 100 }, token)
      : await pagesService.listPages({ per_page: 100, q: slug }, token)

    const match = response.data.find((page) => page.slug === slug) ?? null

    if (match || options?.ownedOnly) {
      return match
    }

    const fallbackResponse = await pagesService.listPages({ per_page: 100 }, token)
    return fallbackResponse.data.find((page) => page.slug === slug) ?? null
  },

  async createPage(payload: CreatePageRequest, token?: string | null) {
    const normalizedPayload = normalizePagePayload(payload) as CreatePageRequest
    const response = await api.post<ApiSuccessResponse<PageRecord>>(PAGE_ROUTES.pages, normalizedPayload, {
      token,
      timeoutMs: 60000,
      suppressErrorModal: true,
      // The backend should persist responses by this key so a repeated create
      // after an uncertain timeout returns the original page instead of a duplicate.
      headers: {
        'Idempotency-Key': `page-create:${normalizedPayload.type || normalizedPayload.pageType || normalizedPayload.page_type || 'page'}:${normalizedPayload.slug}`,
      },
    })
    return normalizeSuccess(response)
  },

  async getPage(id: string, token?: string | null) {
    const response = await api.get<ApiSuccessResponse<PageRecord>>(PAGE_ROUTES.pageById(id), {
      token,
      suppressErrorModal: true,
    })
    return normalizeSuccess(response)
  },

  async updatePage(id: string, payload: UpdatePageRequest, token?: string | null) {
    const response = await api.put<ApiSuccessResponse<PageRecord>>(
      PAGE_ROUTES.pageById(id),
      normalizePagePayload(payload, { preserveEmpty: true }),
      { token },
    )
    return normalizeSuccess(response)
  },

  uploadPageAvatarFile(id: string, file: File, token?: string | null) {
    const formData = new FormData()
    formData.append('file', file)

    return api.post<UploadPageAvatarFileResponse>(PAGE_ROUTES.pageAvatarFile(id), formData, {
      token,
      retry: false,
      suppressErrorModal: true,
    })
  },

  uploadPageCoverFile(id: string, file: File, token?: string | null) {
    const formData = new FormData()
    formData.append('file', file)

    return api.post<UploadPageAvatarFileResponse>(PAGE_ROUTES.pageCoverFile(id), formData, {
      token,
      retry: false,
      suppressErrorModal: true,
    })
  },

  listPageUploads(id: string, token?: string | null) {
    return api.get<PaginatorPayload<Record<string, unknown>>>(withQuery(PAGE_ROUTES.pageUploads(id), {
      per_page: 100,
      sort: '-createdAt',
    }), { token, suppressErrorModal: true })
  },

  deletePage(id: string, token?: string | null) {
    return api.delete<DeletePageResponse>(PAGE_ROUTES.pageById(id), { token })
  },

  followPage(id: string, token?: string | null) {
    return api.post<ApiSuccessResponse<Record<string, unknown>>>(PAGE_ROUTES.pageFollow(id), {}, { token })
  },

  unfollowPage(id: string, token?: string | null) {
    return api.delete<ApiSuccessResponse<Record<string, unknown>>>(PAGE_ROUTES.pageFollow(id), { token })
  },

  listPageFollowers(id: string, params: PageListParams = {}, token?: string | null) {
    return api.get<PaginatorPayload<Record<string, unknown>>>(
      withQuery(PAGE_ROUTES.pageFollowers(id), params),
      { token },
    )
  },
}
