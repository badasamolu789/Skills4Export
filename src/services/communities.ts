import { api } from '@/lib/api'
import type { ApiSuccessResponse, PaginatorPayload } from '@/services/posts'

export type CommunityRecord = {
  id: string
  metadata?: unknown
  meta?: unknown
  metaData?: unknown
  meta_data?: unknown
  categoryId?: string | null
  category_id?: string | null
  category?: {
    id: string
    name: string
    icon?: string | null
    iconName?: string | null
    icon_name?: string | null
    iconClass?: string | null
    icon_class?: string | null
  } | null
  slug?: string | null
  url?: string | null
  community_type?: 'regular' | 'channel' | 'topic' | string | null
  communityType?: 'regular' | 'channel' | 'topic' | string | null
  parent_community_id?: string | null
  parentCommunityId?: string | null
  icon?: string | null
  iconName?: string | null
  icon_name?: string | null
  iconClass?: string | null
  icon_class?: string | null
  name: string
  description: string
  is_active?: number
  visibility?: 'public' | 'private' | 'connections' | 'community' | string | null
  privacy?: 'public' | 'private' | 'connections' | 'community' | string | null
  defaultPostVisibility?: 'public' | 'connections' | 'community' | string | null
  default_post_visibility?: 'public' | 'connections' | 'community' | string | null
  membersOnlyPosting?: boolean | null
  members_only_posting?: boolean | number | string | null
  posts_count?: number
  members_count?: number
  member_count?: number
  followers_count?: number
  follower_count?: number
  post_likes_count?: number
  post_reactions_count?: number
  comments_count?: number
  created_at?: string
}

export type CommunityCategoryRecord = {
  id: string
  name: string
  description?: string | null
  total_communities?: number
  totalCommunities?: number
}

export type CommunityMemberRecord = {
  id: string
  userId?: string
  user_id?: string
  user?: {
    id?: string
  } | null
  communityId?: string
  community_id?: string
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
  communityCategories: '/community-categories',
  communities: '/communities',
  communityById: (id: string) => `/communities/${id}`,
  communityJoin: (id: string) => `/communities/${id}/join`,
  communityMembers: (id: string) => `/communities/${id}/members`,
} as const

export const communitiesService = {
  listCommunityCategories(token?: string | null) {
    return api.get<ApiSuccessResponse<CommunityCategoryRecord[]>>(
      COMMUNITY_ROUTES.communityCategories,
      { token },
    )
  },

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
