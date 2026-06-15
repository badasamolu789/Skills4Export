import { api } from '@/lib/api'

export type PostRecord = {
  id: string
  user_id: string
  userId?: string
  community_id: string | null
  communityId?: string | null
  community?: {
    id?: string
    name?: string | null
  } | null
  user?: {
    id?: string
    name?: string | null
    username?: string | null
    displayName?: string | null
    display_name?: string | null
    email?: string | null
    avatar?: string | null
    avatarUrl?: string | null
    avatar_url?: string | null
    profileImage?: string | null
    profile_image?: string | null
  } | null
  page_id: string | null
  pageId?: string | null
  page?: {
    id?: string
    name?: string | null
    displayName?: string | null
    display_name?: string | null
    title?: string | null
    pageName?: string | null
    page_name?: string | null
    slug?: string | null
    avatar?: string | null
    avatarUrl?: string | null
    avatar_url?: string | null
    logo?: string | null
    logoUrl?: string | null
    logo_url?: string | null
    is_follow?: boolean
    isFollow?: boolean
  } | null
  parent_post_id?: string | null
  originalPostId?: string | null
  title: string
  content: string
  file_path?: unknown[]
  filePath?: unknown[]
  media_path?: unknown[]
  mediaPath?: unknown[]
  media?: unknown[]
  attachments?: unknown[]
  created_at: string
  updated_at: string
  comments_count?: number
  comment_count?: number
  commentsCount?: number
  reactions_count?: number
  reaction_count?: number
  score?: number
  is_saved?: boolean
  is_liked?: boolean
  is_report?: boolean
  is_follow?: boolean
}

export type PostMediaRecord = {
  id: string
  post_id: string
  media_type: string
  url: string
  thumbnail_url: string
  display_order: number
  postId?: string
  mediaType?: string
  media_url?: string
  mediaUrl?: string
  secure_url?: string
  secureUrl?: string
  thumbnailUrl?: string
  displayOrder?: number
}

export type PostCommentRecord = {
  id: string
  post_id: string
  postId?: string
  user_id: string
  userId?: string
  parent_comment_id: string | null
  parentCommentId?: string | null
  content: string
  created_at: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  reactions_count?: number | string
  reaction_count?: number | string
  reactionsCount?: number | string
  likes_count?: number | string
  likesCount?: number | string
  score?: number | string
}

export type PaginatorPayload<T> = {
  current_page: number
  data: T[]
  first_page_url: string | null
  from: number | null
  last_page: number
  last_page_url: string | null
  links: object[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export type ListPostsParams = {
  page?: number
  per_page?: number
  q?: string
  sort?: string
  communityId?: string | null
  pageId?: string | null
  type?: string
  'filters[search]'?: string
  'filters[community_id]'?: string | null
  'sort[field]'?: string
  'sort[direction]'?: 'asc' | 'desc' | string
}

export type ApiSuccessResponse<T> = {
  success: boolean
  data: T
}

export type CreatePostRequest = {
  userId?: string
  communityId?: string | null
  community_id?: string | null
  pageId?: string | null
  page_id?: string | null
  title: string
  content: string
  visibility?: 'public' | 'connections' | 'community' | null
  mediaAssetIds?: string[]
  media_asset_ids?: string[]
}

export type UpdatePostRequest = {
  userId?: string
  title?: string
  content: string
}

export type DeletePostRequest = {
  userId?: string
}

export type AttachPostMediaRequest = {
  url: string
  mediaType?: string
  displayOrder?: number
}

export type CreateCommentRequest = {
  userId?: string
  content: string
  parentCommentId?: string | null
}

export type UpdateCommentRequest = {
  userId?: string
  content: string
}

export type DeleteCommentRequest = {
  userId?: string
}

export type ToggleReactionRequest = {
  userId?: string
  type?: 'like' | 'love' | 'clap' | 'dislike'
}

export type ToggleSaveRequest = {
  userId?: string
}

export type ReportPostRequest = {
  userId?: string
  reason?: string
  details?: string
}

export type SharePostRequest = {
  communityId: string
  comment?: string
}

export type ShareEventRequest = {
  type: 'copy_link' | 'native_share' | 'manual_share' | string
}

export type DeletePostResponse = {
  success: boolean
  message: string
  data: unknown[]
}

export type AttachPostMediaResponse = ApiSuccessResponse<{
  jobId: string
}>

export type ToggleReactionResponse = ApiSuccessResponse<{
  result: object
  count: number
}>

export type ToggleSaveResponse = ApiSuccessResponse<{
  postId: string
  userId: string
  saved: boolean
}>

export type ReportPostResponse = ApiSuccessResponse<{
  id: string
  post_id: string
  user_id: string
  reason: string
  details: string
  created_at: string
}>

export type SharePostResponse = ApiSuccessResponse<PostRecord & {
  originalPostId?: string
  communityId?: string
  comment?: string
  createdAt?: string
}>

export type ShareEventResponse = ApiSuccessResponse<{
  postId: string
  userId?: string
  type: string
  recorded: boolean
  createdAt?: string
}>

const POST_ROUTES = {
  posts: '/posts',
  postById: (id: string) => `/posts/${id}`,
  postMedia: (id: string) => `/posts/${id}/media`,
  postComments: (id: string) => `/posts/${id}/comments`,
  postShares: (id: string) => `/posts/${id}/shares`,
  postShareEvents: (id: string) => `/posts/${id}/share-events`,
  postReactions: (id: string) => `/posts/${id}/reactions`,
  postSave: (id: string) => `/posts/${id}/save`,
  postReport: (id: string) => `/posts/${id}/report`,
  commentReactions: (id: string) => `/comments/${id}/reactions`,
  commentById: (id: string) => `/comments/${id}`,
  commentReport: (id: string) => `/comments/${id}/report`,
  postMediaById: (id: string) => `/posts/media/${id}`,
  pagePosts: (id: string) => `/page/${id}/post`,
} as const

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

const SORT_FIELD_ALIASES: Record<string, string> = {
  createdAt: 'created_at',
  created_at: 'created_at',
  updatedAt: 'updated_at',
  updated_at: 'updated_at',
  commentsCount: 'comment_count',
  commentCount: 'comment_count',
  comment_count: 'comment_count',
  title: 'title',
  score: 'score',
}

const normalizeSortField = (field: string) => SORT_FIELD_ALIASES[field] || field

const normalizeFeedQueryParams = (params: ListPostsParams = {}) => {
  const normalized: Record<string, unknown> = { ...params }

  if (params.q && !normalized['filters[search]']) {
    normalized['filters[search]'] = params.q
  }

  if (params.communityId && !normalized['filters[community_id]']) {
    normalized['filters[community_id]'] = params.communityId
    normalized.community_id = params.communityId
  }

  if (params.sort && !normalized['sort[field]']) {
    const descending = params.sort.startsWith('-')
    const field = descending ? params.sort.slice(1) : params.sort
    normalized['sort[field]'] = normalizeSortField(field)
    normalized['sort[direction]'] = descending ? 'desc' : 'asc'
  }

  if (typeof normalized['sort[field]'] === 'string') {
    normalized['sort[field]'] = normalizeSortField(normalized['sort[field]'])
    delete normalized.sort
  }

  return normalized
}

export const postsService = {
  createPost(payload: CreatePostRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<PostRecord>>(POST_ROUTES.posts, payload, { token })
  },

  listPosts(params: ListPostsParams = {}, token?: string | null) {
    return api.get<PaginatorPayload<PostRecord>>(withQuery(POST_ROUTES.posts, normalizeFeedQueryParams(params)), { token })
  },

  listPagePosts(id: string, params: Omit<ListPostsParams, 'pageId'> = {}, token?: string | null) {
    return api.get<PaginatorPayload<PostRecord>>(withQuery(POST_ROUTES.pagePosts(id), normalizeFeedQueryParams(params)), { token })
  },

  listSavedPosts(params: ListPostsParams = {}, token?: string | null) {
    return api.get<PaginatorPayload<PostRecord>>(withQuery('/user/saved-posts', normalizeFeedQueryParams(params)), { token })
  },

  getPost(id: string, token?: string | null) {
    return api.get<ApiSuccessResponse<PostRecord>>(POST_ROUTES.postById(id), { token })
  },

  updatePost(id: string, payload: UpdatePostRequest, token?: string | null) {
    return api.put<ApiSuccessResponse<PostRecord>>(POST_ROUTES.postById(id), payload, { token })
  },

  deletePost(id: string, payload: DeletePostRequest, token?: string | null) {
    return api.delete<DeletePostResponse>(POST_ROUTES.postById(id), { body: payload, token })
  },

  attachPostMedia(id: string, payload: AttachPostMediaRequest, token?: string | null) {
    return api.post<AttachPostMediaResponse>(POST_ROUTES.postMedia(id), payload, { token })
  },

  listPostMedia(id: string, token?: string | null) {
    return api.get<ApiSuccessResponse<PostMediaRecord[]>>(POST_ROUTES.postMedia(id), { token })
  },

  createComment(id: string, payload: CreateCommentRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<PostCommentRecord>>(POST_ROUTES.postComments(id), payload, { token })
  },

  listComments(id: string, token?: string | null) {
    return api.get<PaginatorPayload<PostCommentRecord>>(POST_ROUTES.postComments(id), { token })
  },

  togglePostReaction(id: string, payload: ToggleReactionRequest, token?: string | null) {
    return api.post<ToggleReactionResponse>(POST_ROUTES.postReactions(id), payload, { token })
  },

  toggleSave(id: string, payload: ToggleSaveRequest, token?: string | null) {
    return api.post<ToggleSaveResponse>(POST_ROUTES.postSave(id), payload, { token })
  },

  reportPost(id: string, payload: ReportPostRequest, token?: string | null) {
    return api.post<ReportPostResponse>(POST_ROUTES.postReport(id), payload, { token })
  },

  sharePostToCommunity(id: string, payload: SharePostRequest, token?: string | null) {
    return api.post<SharePostResponse>(POST_ROUTES.postShares(id), payload, { token })
  },

  recordShareEvent(id: string, payload: ShareEventRequest, token?: string | null) {
    return api.post<ShareEventResponse>(POST_ROUTES.postShareEvents(id), payload, { token })
  },

  toggleCommentReaction(id: string, payload: ToggleReactionRequest, token?: string | null) {
    return api.post<ToggleReactionResponse>(POST_ROUTES.commentReactions(id), payload, { token })
  },

  updateComment(id: string, payload: UpdateCommentRequest, token?: string | null) {
    return api.put<ApiSuccessResponse<PostCommentRecord>>(POST_ROUTES.commentById(id), payload, { token })
  },

  deleteComment(id: string, payload: DeleteCommentRequest, token?: string | null) {
    return api.delete<DeletePostResponse>(POST_ROUTES.commentById(id), { body: payload, token })
  },

  reportComment(id: string, payload: ReportPostRequest, token?: string | null) {
    return api.post<ReportPostResponse>(POST_ROUTES.commentReport(id), payload, { token })
  },

  deletePostMedia(id: string, token?: string | null) {
    return api.delete<ApiSuccessResponse<{ id: string }>>(POST_ROUTES.postMediaById(id), { token })
  },
}
