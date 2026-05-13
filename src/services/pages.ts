import { api } from '@/lib/api'
import type { ApiSuccessResponse, PaginatorPayload } from '@/services/posts'

export type PageRecord = {
  id: string
  ownerId: string
  categoryId?: string | null
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
} as const

export const pagesService = {
  listPages(params: PageListParams = {}, token?: string | null) {
    return api.get<PaginatorPayload<PageRecord>>(withQuery(PAGE_ROUTES.pages, params), { token })
  },

  createPage(payload: CreatePageRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<PageRecord>>(PAGE_ROUTES.pages, payload, { token })
  },

  getPage(id: string, token?: string | null) {
    return api.get<ApiSuccessResponse<PageRecord>>(PAGE_ROUTES.pageById(id), { token })
  },
}
