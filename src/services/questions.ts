import { api } from '@/lib/api'
import type { ApiRequestOptions } from '@/lib/api'
import type { ApiSuccessResponse, PaginatorPayload, PostMediaRecord } from '@/services/posts'

export type QuestionAnswerRecord = {
  id: string
  questionId: string
  question_id?: string
  userId: string
  user_id?: string
  pageId?: string | null
  page_id?: string | null
  parentAnswerId: string | null
  parent_answer_id?: string | null
  content?: string
  body?: string
  answer?: string
  text?: string
  message?: string
  createdAt: string
  created_at?: string
  updatedAt: string
  updated_at?: string
  reactions_count?: number | string
  reaction_count?: number | string
  reactionsCount?: number | string
  likes_count?: number | string
  likesCount?: number | string
  score?: number | string
  comments_count?: number | string
  comment_count?: number | string
  commentsCount?: number | string
  is_saved?: boolean
  is_liked?: boolean
  is_follow?: boolean
  media?: PostMediaRecord[] | null
  media_assets?: PostMediaRecord[] | null
}

export type AnswerCommentRecord = {
  id: string
  answer_id?: string
  user_id?: string
  userId?: string
  content: string
  created_at?: string
  createdAt?: string
}

export type QuestionRecord = {
  id: string
  userId: string
  user_id?: string
  communityId: string | null
  community_id?: string | null
  title: string
  body: string
  visibility: string
  isClosed: boolean
  is_closed?: boolean
  acceptedAnswerId: string | null
  accepted_answer_id?: string | null
  createdAt: string
  created_at?: string
  updatedAt: string
  updated_at?: string
  answers?: QuestionAnswerRecord[] | null
  answers_count?: number | string
  answer_count?: number | string
  answersCount?: number | string
  reactions_count?: number | string
  reaction_count?: number | string
  reactionsCount?: number | string
  likes_count?: number | string
  likesCount?: number | string
  score?: number | string
  is_saved?: boolean
  is_liked?: boolean
  user?: {
    id?: string
    username?: string | null
    name?: string | null
    email?: string | null
  } | null
  asker?: {
    id?: string
    username?: string | null
    name?: string | null
    email?: string | null
  } | null
  community?: {
    id?: string
    name?: string | null
    description?: string | null
    icon?: string | null
    iconName?: string | null
    icon_name?: string | null
    iconClass?: string | null
    icon_class?: string | null
  } | null
}

export type CreateQuestionRequest = {
  communityId?: string | null
  title: string
  body: string
  visibility?: 'public' | 'community_only' | 'community_public'
}

export type UpdateQuestionRequest = {
  title?: string
  body: string
  communityId?: string | null
  visibility?: 'public' | 'community_only' | 'community_public' | string
}

export type DeleteQuestionRequest = {
  userId?: string
}

export type CreateAnswerRequest = {
  content: string
  parentAnswerId?: string | null
  mediaAssetIds?: string[]
}

export type CreateAnswerCommentRequest = {
  userId?: string
  content: string
}

export type ReportAnswerRequest = {
  userId?: string
  reason?: string
  details?: string
}

export type ReportQuestionRequest = ReportAnswerRequest & {
  id?: string
  itemId?: string
  type?: string
}

export type ListQuestionsParams = {
  page?: number
  per_page?: number
  q?: string
  sort?: string
  communityId?: string | null
  visibility?: string
  'filters[search]'?: string
  'filters[community_id]'?: string | null
  'sort[field]'?: string
  'sort[direction]'?: 'asc' | 'desc' | string
}

type QuestionRequestOptions = Pick<ApiRequestOptions, 'suppressErrorModal' | 'signal'>

const QUESTION_ROUTES = {
  questions: '/questions',
  questionById: (id: string, includeAnswers = false) =>
    `/questions/${id}${includeAnswers ? '?includeAnswers=true' : ''}`,
  questionAnswers: (questionId: string) => `/questions/${questionId}/answers`,
  questionReactions: (questionId: string) => `/questions/${questionId}/reactions`,
  questionSave: (questionId: string) => `/question/${questionId}/save`,
  questionReport: (questionId: string) => `/question/${questionId}/report`,
  answerReactions: (answerId: string) => `/answers/${answerId}/reactions`,
  answerComments: (answerId: string) => `/answers/${answerId}/comments`,
  answerSave: (answerId: string) => `/answer/${answerId}/save`,
  answerReport: (answerId: string) => `/answer/${answerId}/report`,
  answerShares: (answerId: string) => `/answers/${answerId}/shares`,
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

const normalizeFeedQueryParams = (params: ListQuestionsParams = {}) => {
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

export const questionsService = {
  createQuestion(payload: CreateQuestionRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<QuestionRecord>>(QUESTION_ROUTES.questions, payload, { token })
  },

  listQuestions(params: ListQuestionsParams = {}, token?: string | null, options?: QuestionRequestOptions) {
    return api.get<PaginatorPayload<QuestionRecord>>(withQuery(QUESTION_ROUTES.questions, normalizeFeedQueryParams(params)), {
      token,
      ...options,
    })
  },

  getQuestion(id: string, token?: string | null, includeAnswers = true) {
    return api.get<ApiSuccessResponse<QuestionRecord>>(
      QUESTION_ROUTES.questionById(id, includeAnswers),
      { token },
    )
  },

  updateQuestion(id: string, payload: UpdateQuestionRequest, token?: string | null) {
    return api.put<ApiSuccessResponse<QuestionRecord>>(
      QUESTION_ROUTES.questionById(id),
      payload,
      { token },
    )
  },

  deleteQuestion(id: string, payload: DeleteQuestionRequest, token?: string | null) {
    return api.delete<ApiSuccessResponse<unknown[]>>(
      QUESTION_ROUTES.questionById(id),
      { body: payload, token },
    )
  },

  createAnswer(questionId: string, payload: CreateAnswerRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<QuestionAnswerRecord>>(
      QUESTION_ROUTES.questionAnswers(questionId),
      payload,
      { token },
    )
  },

  toggleQuestionReaction(questionId: string, payload: { userId?: string; type?: 'like' | 'love' | 'clap' | 'dislike' }, token?: string | null) {
    return api.post<ApiSuccessResponse<{ result: object; count: number }>>(
      QUESTION_ROUTES.questionReactions(questionId),
      payload,
      { token },
    )
  },

  toggleQuestionSave(questionId: string, payload: { userId?: string }, token?: string | null) {
    return api.put<ApiSuccessResponse<{ questionId?: string; userId?: string; saved?: boolean }>>(
      QUESTION_ROUTES.questionSave(questionId),
      payload,
      { token },
    )
  },

  reportQuestion(questionId: string, payload: ReportQuestionRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<{ id?: string; question_id?: string }>>(
      QUESTION_ROUTES.questionReport(questionId),
      payload,
      { token },
    )
  },

  toggleAnswerReaction(answerId: string, payload: { userId?: string; type?: 'like' | 'love' | 'clap' | 'dislike' }, token?: string | null) {
    return api.post<ApiSuccessResponse<{ result: object; count: number }>>(
      QUESTION_ROUTES.answerReactions(answerId),
      payload,
      { token },
    )
  },

  listAnswerComments(answerId: string, token?: string | null) {
    return api.get<PaginatorPayload<AnswerCommentRecord>>(
      QUESTION_ROUTES.answerComments(answerId),
      { token },
    )
  },

  createAnswerComment(answerId: string, payload: CreateAnswerCommentRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<AnswerCommentRecord>>(
      QUESTION_ROUTES.answerComments(answerId),
      payload,
      { token },
    )
  },

  toggleAnswerSave(answerId: string, payload: { userId?: string }, token?: string | null) {
    return api.put<ApiSuccessResponse<{ answerId?: string; userId?: string; saved: boolean }>>(
      QUESTION_ROUTES.answerSave(answerId),
      payload,
      { token },
    )
  },

  reportAnswer(answerId: string, payload: ReportAnswerRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<{ id?: string; answer_id?: string }>>(
      QUESTION_ROUTES.answerReport(answerId),
      payload,
      { token },
    )
  },

  recordAnswerShare(answerId: string, payload: { type?: string }, token?: string | null) {
    return api.post<ApiSuccessResponse<{ recorded?: boolean }>>(
      QUESTION_ROUTES.answerShares(answerId),
      payload,
      { token },
    )
  },

  listAnswers(questionId: string, token?: string | null) {
    return api.get<PaginatorPayload<QuestionAnswerRecord>>(
      QUESTION_ROUTES.questionAnswers(questionId),
      { token },
    )
  },
}
