import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { FeedPost } from '@/data/feedPosts'
import type { CreateCommentRequest, CreatePostRequest, PostCommentRecord, PostRecord } from '@/services/posts'
import type {
  CreateAnswerRequest,
  CreateQuestionRequest,
  QuestionAnswerRecord,
  QuestionRecord,
} from '@/services/questions'
import { socialActionsApi } from '@/services/socialActionsApi'
import { useAuthStore } from '@/stores/auth'

const getFeedId = (item: FeedPost) => item.apiId || item.slug

export type GlobalProfileStats = {
  score: number
  followers: number
  following: number
}

export const useSocialActionsStore = defineStore('socialActions', () => {
  const authStore = useAuthStore()
  const feed = ref<FeedPost[]>([])
  const followingUserIds = ref<Record<string, boolean>>({})
  const scoredContentIds = ref<Record<string, boolean>>({})
  const commentsByPostId = ref<Record<string, PostCommentRecord[]>>({})
  const answersByQuestionId = ref<Record<string, QuestionAnswerRecord[]>>({})
  const profileStatsByUserId = ref<Record<string, GlobalProfileStats>>({})
  const loadingActions = ref<Record<string, boolean>>({})

  const posts = computed(() => feed.value.filter((item) => item.type !== 'question'))
  const questions = computed(() => feed.value.filter((item) => item.type === 'question'))

  const setLoading = (key: string, value: boolean) => {
    loadingActions.value = {
      ...loadingActions.value,
      [key]: value,
    }
  }

  const updateFeedItem = (id: string, updater: (item: FeedPost) => FeedPost) => {
    feed.value = feed.value.map((item) => getFeedId(item) === id ? updater(item) : item)
  }

  const setFeed = (items: FeedPost[]) => {
    feed.value = items.map((item) => {
      const id = getFeedId(item)
      const authorId = item.userId || ''

      if (authorId && item.isFollowing) {
        followingUserIds.value[authorId] = true
      }

      if (id && item.isScored) {
        scoredContentIds.value[id] = true
      }

      return {
        ...item,
        ...(authorId && followingUserIds.value[authorId] !== undefined
          ? { isFollowing: followingUserIds.value[authorId] }
          : {}),
        ...(id && scoredContentIds.value[id] !== undefined
          ? { isScored: scoredContentIds.value[id] }
          : {}),
      }
    })
  }

  const upsertFeedItem = (item: FeedPost, options: { prepend?: boolean } = {}) => {
    const id = getFeedId(item)
    const existingIndex = feed.value.findIndex((entry) => getFeedId(entry) === id)

    if (existingIndex >= 0) {
      feed.value = feed.value.map((entry, index) =>
        index === existingIndex ? { ...entry, ...item } as FeedPost : entry,
      )
      return
    }

    feed.value = options.prepend === false
      ? [...feed.value, item]
      : [item, ...feed.value]
  }

  const isFollowingUser = (userId?: string | null) =>
    Boolean(userId && followingUserIds.value[userId])

  const setUserFollowingState = (userId: string, isFollowing: boolean) => {
    followingUserIds.value = {
      ...followingUserIds.value,
      [userId]: isFollowing,
    }
    feed.value = feed.value.map((item) =>
      item.userId === userId ? { ...item, isFollowing } as FeedPost : item,
    )
  }

  const isContentScored = (contentId?: string | null) =>
    Boolean(contentId && scoredContentIds.value[contentId])

  const getCommentCount = (postId: string, fallback = 0) => {
    const item = feed.value.find((entry) => getFeedId(entry) === postId)
    return item && 'comments' in item ? item.comments : fallback
  }

  const getAnswerCount = (questionId: string, fallback = 0) => {
    const item = feed.value.find((entry) => getFeedId(entry) === questionId)
    return item?.type === 'question' ? item.answers : fallback
  }

  const getScoreCount = (contentId: string, fallback = 0) => {
    const item = feed.value.find((entry) => getFeedId(entry) === contentId)
    return item?.score ?? fallback
  }

  const getProfileStats = (userId?: string | null): GlobalProfileStats => {
    if (!userId) {
      return { score: 0, followers: 0, following: 0 }
    }

    return profileStatsByUserId.value[userId] ?? { score: 0, followers: 0, following: 0 }
  }

  const setProfileStats = (userId: string, stats: Partial<GlobalProfileStats>) => {
    const current = getProfileStats(userId)
    profileStatsByUserId.value = {
      ...profileStatsByUserId.value,
      [userId]: {
        score: Math.max(0, stats.score ?? current.score),
        followers: Math.max(0, stats.followers ?? current.followers),
        following: Math.max(0, stats.following ?? current.following),
      },
    }
  }

  const adjustProfileStats = (userId: string, stats: Partial<GlobalProfileStats>) => {
    const current = getProfileStats(userId)
    setProfileStats(userId, {
      score: current.score + (stats.score ?? 0),
      followers: current.followers + (stats.followers ?? 0),
      following: current.following + (stats.following ?? 0),
    })
  }

  const followUser = async (userId: string) => {
    if (!authStore.userId || !authStore.authToken || isFollowingUser(userId)) {
      return
    }

    const key = `follow:${userId}`
    followingUserIds.value = { ...followingUserIds.value, [userId]: true }
    adjustProfileStats(userId, { followers: 1 })
    adjustProfileStats(authStore.userId, { following: 1 })
    feed.value = feed.value.map((item) =>
      item.userId === userId ? { ...item, isFollowing: true } as FeedPost : item,
    )
    setLoading(key, true)

    try {
      await socialActionsApi.followUser(userId, authStore.userId, authStore.authToken)
    } catch (error) {
      followingUserIds.value = { ...followingUserIds.value, [userId]: false }
      adjustProfileStats(userId, { followers: -1 })
      adjustProfileStats(authStore.userId, { following: -1 })
      feed.value = feed.value.map((item) =>
        item.userId === userId ? { ...item, isFollowing: false } as FeedPost : item,
      )
      throw error
    } finally {
      setLoading(key, false)
    }
  }

  const unfollowUser = async (userId: string) => {
    if (!authStore.authToken || !isFollowingUser(userId)) {
      return
    }

    const key = `follow:${userId}`
    followingUserIds.value = { ...followingUserIds.value, [userId]: false }
    adjustProfileStats(userId, { followers: -1 })
    if (authStore.userId) {
      adjustProfileStats(authStore.userId, { following: -1 })
    }
    feed.value = feed.value.map((item) =>
      item.userId === userId ? { ...item, isFollowing: false } as FeedPost : item,
    )
    setLoading(key, true)

    try {
      await socialActionsApi.unfollowUser(userId, authStore.authToken)
    } catch (error) {
      followingUserIds.value = { ...followingUserIds.value, [userId]: true }
      adjustProfileStats(userId, { followers: 1 })
      if (authStore.userId) {
        adjustProfileStats(authStore.userId, { following: 1 })
      }
      feed.value = feed.value.map((item) =>
        item.userId === userId ? { ...item, isFollowing: true } as FeedPost : item,
      )
      throw error
    } finally {
      setLoading(key, false)
    }
  }

  const toggleUserFollow = (userId: string) =>
    isFollowingUser(userId) ? unfollowUser(userId) : followUser(userId)

  const toggleContentScore = async (contentId: string, type: 'post' | 'question') => {
    if (!authStore.userId || !authStore.authToken || loadingActions.value[`score:${contentId}`]) {
      return
    }

    const wasScored = isContentScored(contentId)
    const previousScore = getScoreCount(contentId)
    const contentAuthorId = feed.value.find((item) => getFeedId(item) === contentId)?.userId
    const profileScoreDelta = wasScored ? -1 : 1
    const optimisticScore = Math.max(previousScore + (wasScored ? -1 : 1), 0)
    const applyState = (scored: boolean, score: number) => {
      scoredContentIds.value = { ...scoredContentIds.value, [contentId]: scored }
      updateFeedItem(contentId, (item) => ({ ...item, isScored: scored, score }) as FeedPost)
    }

    applyState(!wasScored, optimisticScore)
    if (contentAuthorId) {
      adjustProfileStats(contentAuthorId, { score: profileScoreDelta })
    }
    setLoading(`score:${contentId}`, true)

    try {
      const payload = { userId: authStore.userId, type: 'like' as const }
      const response = type === 'question'
        ? await socialActionsApi.toggleQuestionReaction(contentId, payload, authStore.authToken)
        : await socialActionsApi.togglePostReaction(contentId, payload, authStore.authToken)
      applyState(!wasScored, response.data.count)
      return response.data.count
    } catch (error) {
      applyState(wasScored, previousScore)
      if (contentAuthorId) {
        adjustProfileStats(contentAuthorId, { score: -profileScoreDelta })
      }
      throw error
    } finally {
      setLoading(`score:${contentId}`, false)
    }
  }

  const addComment = async (postId: string, payload: CreateCommentRequest) => {
    const response = await socialActionsApi.createComment(postId, payload, authStore.authToken)
    commentsByPostId.value = {
      ...commentsByPostId.value,
      [postId]: [response.data, ...(commentsByPostId.value[postId] ?? [])],
    }
    updateFeedItem(postId, (item) =>
      'comments' in item
        ? { ...item, comments: item.comments + 1 } as FeedPost
        : item,
    )
    return response.data
  }

  const removeComment = async (postId: string, commentId: string) => {
    await socialActionsApi.deleteComment(
      commentId,
      { userId: authStore.userId || undefined },
      authStore.authToken,
    )
    commentsByPostId.value = {
      ...commentsByPostId.value,
      [postId]: (commentsByPostId.value[postId] ?? []).filter((comment) => comment.id !== commentId),
    }
    updateFeedItem(postId, (item) =>
      'comments' in item
        ? { ...item, comments: Math.max(item.comments - 1, 0) } as FeedPost
        : item,
    )
  }

  const addAnswer = async (questionId: string, payload: CreateAnswerRequest) => {
    const response = await socialActionsApi.createAnswer(questionId, payload, authStore.authToken)
    answersByQuestionId.value = {
      ...answersByQuestionId.value,
      [questionId]: [response.data, ...(answersByQuestionId.value[questionId] ?? [])],
    }
    updateFeedItem(questionId, (item) =>
      item.type === 'question'
        ? { ...item, answers: item.answers + 1 }
        : item,
    )
    return response.data
  }

  const createPost = async (payload: CreatePostRequest) => {
    const response = await socialActionsApi.createPost(payload, authStore.authToken)
    return response.data as PostRecord
  }

  const createQuestion = async (payload: CreateQuestionRequest) => {
    const response = await socialActionsApi.createQuestion(payload, authStore.authToken)
    return response.data as QuestionRecord
  }

  const reset = () => {
    feed.value = []
    followingUserIds.value = {}
    scoredContentIds.value = {}
    commentsByPostId.value = {}
    answersByQuestionId.value = {}
    profileStatsByUserId.value = {}
    loadingActions.value = {}
  }

  return {
    feed,
    posts,
    questions,
    followingUserIds,
    scoredContentIds,
    commentsByPostId,
    answersByQuestionId,
    profileStatsByUserId,
    loadingActions,
    setFeed,
    upsertFeedItem,
    isFollowingUser,
    setUserFollowingState,
    isContentScored,
    getCommentCount,
    getAnswerCount,
    getScoreCount,
    getProfileStats,
    setProfileStats,
    adjustProfileStats,
    followUser,
    unfollowUser,
    toggleUserFollow,
    toggleContentScore,
    addComment,
    removeComment,
    addAnswer,
    createPost,
    createQuestion,
    reset,
  }
})
