import { postsService } from '@/services/posts'
import type {
  CreateCommentRequest,
  CreatePostRequest,
  DeleteCommentRequest,
  ToggleReactionRequest,
} from '@/services/posts'
import { questionsService } from '@/services/questions'
import type { CreateAnswerRequest, CreateQuestionRequest } from '@/services/questions'
import { usersService } from '@/services/users'

export const socialActionsApi = {
  followUser(userId: string, currentUserId: string, token?: string | null) {
    return usersService.followUser(userId, { followerId: currentUserId }, token)
  },

  unfollowUser(userId: string, token?: string | null) {
    return usersService.unfollowUser(userId, token)
  },

  togglePostReaction(postId: string, payload: ToggleReactionRequest, token?: string | null) {
    return postsService.togglePostReaction(postId, payload, token)
  },

  toggleQuestionReaction(questionId: string, payload: ToggleReactionRequest, token?: string | null) {
    return questionsService.toggleQuestionReaction(questionId, payload, token)
  },

  createComment(postId: string, payload: CreateCommentRequest, token?: string | null) {
    return postsService.createComment(postId, payload, token)
  },

  deleteComment(commentId: string, payload: DeleteCommentRequest, token?: string | null) {
    return postsService.deleteComment(commentId, payload, token)
  },

  createAnswer(questionId: string, payload: CreateAnswerRequest, token?: string | null) {
    return questionsService.createAnswer(questionId, payload, token)
  },

  createPost(payload: CreatePostRequest, token?: string | null) {
    return postsService.createPost(payload, token)
  },

  createQuestion(payload: CreateQuestionRequest, token?: string | null) {
    return questionsService.createQuestion(payload, token)
  },
}
