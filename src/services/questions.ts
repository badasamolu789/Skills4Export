import { api } from '@/lib/api'
import type { ApiRequestOptions } from '@/lib/api'
import type { ApiSuccessResponse, PaginatorPayload } from '@/services/posts'

export type QuestionAnswerRecord = {
  id: string
  questionId: string
  question_id?: string
  userId: string
  user_id?: string
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
  user?: {
    id?: string
    username?: string | null
    name?: string | null
    email?: string | null
  } | null
}

export type CreateQuestionRequest = {
  communityId?: string | null
  title: string
  body: string
  visibility?: 'public' | 'community_only' | 'community_public'
}

export type CreateAnswerRequest = {
  content: string
  parentAnswerId?: string | null
}

type QuestionRequestOptions = Pick<ApiRequestOptions, 'suppressErrorModal' | 'signal'>

const QUESTION_ROUTES = {
  questions: '/questions',
  questionById: (id: string, includeAnswers = false) =>
    `/questions/${id}${includeAnswers ? '?includeAnswers=true' : ''}`,
  questionAnswers: (questionId: string) => `/questions/${questionId}/answers`,
} as const

export const questionsService = {
  createQuestion(payload: CreateQuestionRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<QuestionRecord>>(QUESTION_ROUTES.questions, payload, { token })
  },

  listQuestions(token?: string | null, options?: QuestionRequestOptions) {
    return api.get<PaginatorPayload<QuestionRecord>>(QUESTION_ROUTES.questions, { token, ...options })
  },

  getQuestion(id: string, token?: string | null, includeAnswers = true) {
    return api.get<ApiSuccessResponse<QuestionRecord>>(
      QUESTION_ROUTES.questionById(id, includeAnswers),
      { token },
    )
  },

  createAnswer(questionId: string, payload: CreateAnswerRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<QuestionAnswerRecord>>(
      QUESTION_ROUTES.questionAnswers(questionId),
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
