import { api } from '@/lib/api'

export type PostRecord = {
  id: string
  user_id: string
  community_id: string | null
  communityId?: string | null
  page_id: string | null
  parent_post_id?: string | null
  originalPostId?: string | null
  title: string
  content: string
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
}

export type PostCommentRecord = {
  id: string
  post_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  created_at: string
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
}

export type ApiSuccessResponse<T> = {
  success: boolean
  data: T
}

export type CreatePostRequest = {
  userId?: string
  communityId?: string | null
  pageId?: string | null
  title: string
  content: string
  mediaAssetIds?: string[]
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
  commentReport: (id: string) => `/comments/${id}/report`,
  postMediaById: (id: string) => `/posts/media/${id}`,
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

export const postsService = {
  createPost(payload: CreatePostRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<PostRecord>>(POST_ROUTES.posts, payload, { token })
  },

  listPosts(params: ListPostsParams = {}, token?: string | null) {
    return api.get<PaginatorPayload<PostRecord>>(withQuery(POST_ROUTES.posts, params), { token })
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

  reportComment(id: string, payload: ReportPostRequest, token?: string | null) {
    return api.post<ReportPostResponse>(POST_ROUTES.commentReport(id), payload, { token })
  },

  deletePostMedia(id: string, token?: string | null) {
    return api.delete<ApiSuccessResponse<{ id: string }>>(POST_ROUTES.postMediaById(id), { token })
  },
}
