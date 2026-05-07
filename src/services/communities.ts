import { api } from '@/lib/api'
import type { ApiSuccessResponse, PaginatorPayload } from '@/services/posts'

export type CommunityRecord = {
  id: string
  categoryId?: string | null
  category_id?: string | null
  category?: {
    id: string
    name: string
  } | null
  name: string
  description: string
  is_active?: number
  default_post_visibility?: 'public' | 'connections' | 'community' | string | null
  posts_count?: number
  post_likes_count?: number
  post_reactions_count?: number
  comments_count?: number
  created_at?: string
}

export type CommunityMemberRecord = {
  id: string
  userId: string
  communityId: string
  role: string
}

export type CommunityListParams = {
  page?: number
  per_page?: number
  q?: string
  categoryId?: string
  limit?: number
  offset?: number
}

export type CreateCommunityRequest = {
  name: string
  description?: string
  categoryId?: string | null
  defaultPostVisibility?: 'public' | 'connections' | 'community' | string
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

const COMMUNITY_ROUTES = {
  communities: '/communities',
  communityById: (id: string) => `/communities/${id}`,
  communityJoin: (id: string) => `/communities/${id}/join`,
  communityMembers: (id: string) => `/communities/${id}/members`,
} as const

export const communitiesService = {
  listCommunities(params: CommunityListParams = {}, token?: string | null) {
    return api.get<PaginatorPayload<CommunityRecord>>(
      withQuery(COMMUNITY_ROUTES.communities, params),
      { token },
    )
  },

  createCommunity(payload: CreateCommunityRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<CommunityRecord>>(COMMUNITY_ROUTES.communities, payload, { token })
  },

  getCommunity(id: string, token?: string | null) {
    return api.get<ApiSuccessResponse<CommunityRecord>>(COMMUNITY_ROUTES.communityById(id), { token })
  },

  updateCommunity(id: string, payload: Partial<CreateCommunityRequest>, token?: string | null) {
    return api.put<ApiSuccessResponse<CommunityRecord>>(COMMUNITY_ROUTES.communityById(id), payload, { token })
  },

  deleteCommunity(id: string, token?: string | null) {
    return api.delete<ApiSuccessResponse<{ deleted?: boolean }>>(COMMUNITY_ROUTES.communityById(id), { token })
  },

  joinCommunity(id: string, token?: string | null) {
    return api.post<ApiSuccessResponse<CommunityMemberRecord>>(COMMUNITY_ROUTES.communityJoin(id), undefined, { token })
  },

  leaveCommunity(id: string, token?: string | null) {
    return api.delete<ApiSuccessResponse<{ removed: boolean }>>(COMMUNITY_ROUTES.communityJoin(id), { token })
  },

  listCommunityMembers(id: string, token?: string | null) {
    return api.get<ApiSuccessResponse<CommunityMemberRecord[]>>(COMMUNITY_ROUTES.communityMembers(id), { token })
  },
}
