<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowUp, ChevronDown, Edit2, MessageSquare, MoreHorizontal, PencilLine, Send, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import AppFeedPost from '@/components/AppFeedPost.vue'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import type { FeedPost } from '@/data/feedPosts'
import { ApiError } from '@/lib/api'
import { postsService, type PostCommentRecord, type PostMediaRecord, type PostRecord } from '@/services/posts'
import { questionsService, type QuestionAnswerRecord, type QuestionRecord } from '@/services/questions'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { getOptionalCount, getPostUserId, mapApiPostToFeedPost } from '@/utils/postMapper'
import { getQuestionCreatedAt, getQuestionUserId, mapApiQuestionToFeedPost } from '@/utils/questionMapper'
import { richTextToPlainText } from '@/utils/richText'

type ActivityTab = 'posts' | 'comments' | 'scored' | 'saved' | 'answers' | 'questions'

type ActivityTabState = {
  page: number
  total: number
  hasMore: boolean
  isLoaded: boolean
  isLoading: boolean
  error: string
}

type CommentActivity = {
  id: string
  postId: string
  postTitle: string
  post: PostRecord
  content: string
  createdAt: string
}

type AnswerActivity = {
  id: string
  questionId: string
  questionTitle: string
  question: QuestionRecord
  content: string
  createdAt: string
  score: number
}

type CommentActivityRecord = PostCommentRecord & {
  post?: PostRecord | null
  postTitle?: string | null
  post_title?: string | null
}

type AnswerActivityRecord = QuestionAnswerRecord & {
  question?: QuestionRecord | null
  questionTitle?: string | null
  question_title?: string | null
}

const tabs: Array<{ id: ActivityTab; label: string }> = [
  { id: 'posts', label: 'Posts' },
  { id: 'comments', label: 'Comments' },
  { id: 'scored', label: 'Scored' },
  { id: 'saved', label: 'Saved' },
  { id: 'answers', label: 'Answers' },
  { id: 'questions', label: 'Questions' },
]

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const activeTab = ref<ActivityTab>('posts')
const userPosts = ref<PostRecord[]>([])
const userComments = ref<CommentActivity[]>([])
const scoredPosts = ref<PostRecord[]>([])
const savedPosts = ref<PostRecord[]>([])
const savedQuestions = ref<QuestionRecord[]>([])
const userAnswers = ref<AnswerActivity[]>([])
const userQuestions = ref<QuestionRecord[]>([])
const postMediaById = ref(new Map<string, PostMediaRecord[]>())
const editModal = ref<{
  isOpen: boolean
  type: 'comment' | 'question' | null
  id: string
  title: string
  body: string
}>({
  isOpen: false,
  type: null,
  id: '',
  title: '',
  body: '',
})
const deleteModal = ref<{
  isOpen: boolean
  type: 'post' | 'comment' | 'question' | null
  id: string
  label: string
}>({
  isOpen: false,
  type: null,
  id: '',
  label: '',
})
const isSavingEdit = ref(false)
const isDeleting = ref(false)
const closedActivityPanels = ref(new Set<string>())
const activeActionMenu = ref('')
const ACTIVITY_PAGE_SIZE = 8

const createTabState = (): ActivityTabState => ({
  page: 0,
  total: 0,
  hasMore: true,
  isLoaded: false,
  isLoading: false,
  error: '',
})

const tabState = reactive<Record<ActivityTab, ActivityTabState>>({
  posts: createTabState(),
  comments: createTabState(),
  scored: createTabState(),
  saved: createTabState(),
  answers: createTabState(),
  questions: createTabState(),
})

const activeCount = computed(() => ({
  posts: tabState.posts.isLoaded ? tabState.posts.total : userPosts.value.length,
  comments: tabState.comments.isLoaded ? tabState.comments.total : userComments.value.length,
  scored: tabState.scored.isLoaded ? tabState.scored.total : scoredPosts.value.length,
  saved: tabState.saved.isLoaded ? tabState.saved.total : savedPosts.value.length + savedQuestions.value.length,
  answers: tabState.answers.isLoaded ? tabState.answers.total : userAnswers.value.length,
  questions: tabState.questions.isLoaded ? tabState.questions.total : userQuestions.value.length,
}))

const activeTabState = computed(() => tabState[activeTab.value])
const isLoading = computed(() => activeTabState.value.isLoading && !activeTabState.value.isLoaded)
const isLoadingMore = computed(() => activeTabState.value.isLoading && activeTabState.value.isLoaded)
const loadError = computed(() => activeTabState.value.error)

const getTabFromQuery = (value: unknown): ActivityTab | null => {
  const tab = Array.isArray(value) ? value[0] : value

  return tabs.some((item) => item.id === tab) ? tab as ActivityTab : null
}

const syncActiveTabFromRoute = () => {
  activeTab.value = getTabFromQuery(route.query.tab) ?? 'posts'
}

const setActiveTab = (tab: ActivityTab) => {
  activeTab.value = tab
  void router.replace({
    name: 'manage-activities',
    query: {
      ...route.query,
      tab,
    },
  })
}

const userPostFeedItems = computed<FeedPost[]>(() =>
  userPosts.value.map((post) => mapApiPostToFeedPost(post, postMediaById.value.get(post.id) ?? [])),
)

const userQuestionFeedItems = computed<FeedPost[]>(() =>
  userQuestions.value.map((question) => mapApiQuestionToFeedPost(question)),
)

const scoredPostFeedItems = computed<FeedPost[]>(() =>
  scoredPosts.value.map((post) => mapApiPostToFeedPost({ ...post, is_liked: true }, postMediaById.value.get(post.id) ?? [])),
)

const savedFeedItems = computed<FeedPost[]>(() =>
  sortedByDate(
    [
      ...savedPosts.value.map((post) => mapApiPostToFeedPost(post, postMediaById.value.get(post.id) ?? [])),
      ...savedQuestions.value.map((question) => mapApiQuestionToFeedPost(question)),
    ],
    (item) => item.createdAt || item.updatedAt || '',
  ),
)

const activeEmptyMessage = computed(() => {
  switch (activeTab.value) {
    case 'posts':
      return 'No posts yet.'
    case 'comments':
      return 'No comments yet.'
    case 'scored':
      return 'No scored posts yet.'
    case 'saved':
      return 'No saved posts or questions yet.'
    case 'answers':
      return 'No answers yet.'
    case 'questions':
      return 'No questions yet.'
    default:
      return 'No activity yet.'
  }
})

const getCurrentUserId = async () => {
  if (authStore.userId) {
    return authStore.userId
  }

  const response = await usersService.getMyProfile(authStore.authToken)
  const userId = response.data?.user?.id || response.data?.profile?.userId || ''

  if (userId) {
    authStore.setUserId(userId)
  }

  return userId
}

const getCommentUserId = (comment: PostCommentRecord) => comment.user_id || comment.userId || ''
const getCommentPostId = (comment: PostCommentRecord) => comment.post_id || comment.postId || ''
const getAnswerUserId = (answer: QuestionAnswerRecord) => answer.userId || answer.user_id || ''
const getAnswerQuestionId = (answer: QuestionAnswerRecord) => answer.questionId || answer.question_id || ''

const getPostCreatedAt = (post: PostRecord) => post.created_at || post.updated_at || ''
const getCommentCreatedAt = (comment: PostCommentRecord) =>
  comment.created_at || comment.createdAt || comment.updated_at || comment.updatedAt || ''
const getAnswerCreatedAt = (answer: QuestionAnswerRecord) =>
  answer.createdAt || answer.created_at || answer.updatedAt || answer.updated_at || ''

const getAnswerContent = (answer: QuestionAnswerRecord) =>
  answer.content || answer.body || answer.answer || answer.text || answer.message || ''

const getActivityPanelKey = (type: 'comment' | 'answer', id: string) => `${type}-${id}`

const isActivityPanelOpen = (type: 'comment' | 'answer', id: string) =>
  !closedActivityPanels.value.has(getActivityPanelKey(type, id))

const toggleActivityPanel = (type: 'comment' | 'answer', id: string) => {
  const nextPanels = new Set(closedActivityPanels.value)
  const key = getActivityPanelKey(type, id)

  if (nextPanels.has(key)) {
    nextPanels.delete(key)
  } else {
    nextPanels.add(key)
  }

  closedActivityPanels.value = nextPanels
}

const toggleActionMenu = (key: string) => {
  activeActionMenu.value = activeActionMenu.value === key ? '' : key
}

const closeActionMenu = () => {
  activeActionMenu.value = ''
}

const loadActiveTabIfNeeded = () => {
  if (!activeTabState.value.isLoaded) {
    void loadActivities(activeTab.value)
  }
}

const loadMoreActiveTab = () => {
  if (!activeTabState.value.isLoaded || !activeTabState.value.hasMore || activeTabState.value.isLoading) {
    return
  }

  void loadActivities(activeTab.value, { append: true })
}

const handleWindowScroll = () => {
  const scrollOffset = window.innerHeight + window.scrollY
  const documentHeight = document.documentElement.scrollHeight

  if (documentHeight - scrollOffset < 560) {
    loadMoreActiveTab()
  }
}

const formatDate = (value: string) => {
  const date = new Date(value)

  if (!value || Number.isNaN(date.getTime())) {
    return 'Recently'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const getSnippet = (value?: string | null, fallback = 'No content available.') => {
  const plainText = richTextToPlainText(value).trim()
  return plainText.length > 190 ? `${plainText.slice(0, 190).trim()}...` : plainText || fallback
}

const sortedByDate = <T,>(items: T[], getDate: (item: T) => string) =>
  [...items].sort((first, second) => new Date(getDate(second)).getTime() - new Date(getDate(first)).getTime())

const getFeedPostId = (post: FeedPost) => post.apiId || post.slug

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))

const isPostRecord = (value: unknown): value is PostRecord =>
  isRecord(value) && typeof value.id === 'string' && ('title' in value || 'content' in value)

const isQuestionRecord = (value: unknown): value is QuestionRecord =>
  isRecord(value) && typeof value.id === 'string' && 'title' in value && ('body' in value || 'visibility' in value)

const readPostActivityRecord = (value: unknown): PostRecord | null => {
  if (isPostRecord(value)) {
    return value
  }

  if (!isRecord(value)) {
    return null
  }

  for (const key of ['post', 'data', 'target', 'item']) {
    if (isPostRecord(value[key])) {
      return value[key]
    }
  }

  return null
}

const readQuestionActivityRecord = (value: unknown): QuestionRecord | null => {
  if (isQuestionRecord(value)) {
    return value
  }

  if (!isRecord(value)) {
    return null
  }

  for (const key of ['question', 'data', 'target', 'item']) {
    if (isQuestionRecord(value[key])) {
      return value[key]
    }
  }

  return null
}

const normalizePostActivityRecords = (items: unknown[]) =>
  items.map((item) => readPostActivityRecord(item)).filter((item): item is PostRecord => Boolean(item))

const updatePostInCollections = (postId: string, updater: (post: PostRecord) => PostRecord) => {
  userPosts.value = userPosts.value.map((post) => post.id === postId ? updater(post) : post)
  scoredPosts.value = scoredPosts.value.map((post) => post.id === postId ? updater(post) : post)
  savedPosts.value = savedPosts.value.map((post) => post.id === postId ? updater(post) : post)
  userComments.value = userComments.value.map((comment) => {
    if (comment.postId !== postId) {
      return comment
    }

    const updatedPost = updater(comment.post)

    return {
      ...comment,
      post: updatedPost,
      postTitle: updatedPost.title || comment.postTitle,
    }
  })
}

const removePostFromCollections = (postId: string) => {
  userPosts.value = userPosts.value.filter((post) => post.id !== postId)
  scoredPosts.value = scoredPosts.value.filter((post) => post.id !== postId)
  savedPosts.value = savedPosts.value.filter((post) => post.id !== postId)
  userComments.value = userComments.value.filter((comment) => comment.postId !== postId)
  postMediaById.value.delete(postId)
}

const handleManagedPostUpdated = (updatedPost: PostRecord) => {
  updatePostInCollections(updatedPost.id, (post) => ({
    ...post,
    ...updatedPost,
    title: updatedPost.title || post.title,
    content: updatedPost.content || post.content,
  }))
}

const handleManagedPostScoreChanged = ({ post, isScored, score }: { post: FeedPost; isScored: boolean; score: number }) => {
  const postId = getFeedPostId(post)

  updatePostInCollections(postId, (record) => ({
    ...record,
    is_liked: isScored,
    score,
  }))

  if (!isScored) {
    scoredPosts.value = scoredPosts.value.filter((record) => record.id !== postId)
  }
}

const handleManagedSaveChanged = ({ post, isSaved }: { post: FeedPost; isSaved: boolean }) => {
  if (isSaved) {
    return
  }

  const itemId = getFeedPostId(post)

  if (post.type === 'question') {
    savedQuestions.value = savedQuestions.value.filter((question) => question.id !== itemId)
    return
  }

  savedPosts.value = savedPosts.value.filter((record) => record.id !== itemId)
}

const hydratePostMedia = async (posts: PostRecord[]) => {
  const postsNeedingMedia = posts.filter((post) => !postMediaById.value.has(post.id))

  if (!postsNeedingMedia.length) {
    return
  }

  const entries = await Promise.all(
    postsNeedingMedia.map(async (post) => {
      const response = await postsService.listPostMedia(post.id, authStore.authToken)
      return [post.id, response.data ?? []] as const
    }),
  )

  postMediaById.value = new Map([...postMediaById.value, ...entries])
}

const mergeById = <T extends { id: string }>(currentItems: T[], nextItems: T[], append: boolean) => {
  if (!append) {
    return nextItems
  }

  const merged = new Map(currentItems.map((item) => [item.id, item]))

  nextItems.forEach((item) => {
    merged.set(item.id, item)
  })

  return Array.from(merged.values())
}

const responseHasMore = (response: { current_page?: number; last_page?: number; next_page_url?: string | null }) =>
  Boolean(response.next_page_url) || (
    typeof response.current_page === 'number' &&
    typeof response.last_page === 'number' &&
    response.current_page < response.last_page
  )

const updateLoadedTabState = (tab: ActivityTab, page: number, total: number, hasMore: boolean) => {
  const state = tabState[tab]
  state.page = page
  state.total = total
  state.hasMore = hasMore
  state.isLoaded = true
}

const buildActivityParams = (page: number) => ({
  page,
  per_page: ACTIVITY_PAGE_SIZE,
  sort: '-createdAt',
})

const loadPostActivityTab = async (tab: 'posts' | 'scored' | 'saved', page: number, append: boolean, userId: string) => {
  const response =
    tab === 'posts'
      ? await postsService.listUserPosts(buildActivityParams(page), authStore.authToken)
      : tab === 'scored'
        ? await postsService.listScoredPosts(buildActivityParams(page), authStore.authToken)
        : await postsService.listSavedPosts(buildActivityParams(page), authStore.authToken)

  const posts = normalizePostActivityRecords(response.data ?? [])
    .filter((post) => tab !== 'posts' || !getPostUserId(post) || getPostUserId(post) === userId)
    .map((post) => tab === 'scored' ? { ...post, is_liked: true } : post)

  await hydratePostMedia(posts)

  if (tab === 'posts') {
    userPosts.value = sortedByDate(mergeById(userPosts.value, posts, append), getPostCreatedAt)
  } else if (tab === 'scored') {
    scoredPosts.value = sortedByDate(mergeById(scoredPosts.value, posts, append), getPostCreatedAt)
  } else {
    savedPosts.value = sortedByDate(mergeById(savedPosts.value, posts, append), getPostCreatedAt)
    savedQuestions.value = append ? savedQuestions.value : []
  }

  updateLoadedTabState(tab, page, response.total ?? posts.length, responseHasMore(response))
}

const loadCommentActivityTab = async (page: number, append: boolean, userId: string) => {
  const response = await postsService.listUserComments(buildActivityParams(page), authStore.authToken)
  const rawComments = (response.data ?? []) as CommentActivityRecord[]
  const commentActivities = await Promise.all(
    rawComments
      .filter((comment) => !getCommentUserId(comment) || getCommentUserId(comment) === userId)
      .map(async (comment) => {
        const embeddedPost = readPostActivityRecord(comment.post)
        const postId = getCommentPostId(comment) || embeddedPost?.id || ''
        let post = embeddedPost || null

        if (!post && postId) {
          try {
            const postResponse = await postsService.getPost(postId, authStore.authToken)
            post = postResponse.data
          } catch {
            post = null
          }
        }

        if (!post) {
          return null
        }

        return {
          id: comment.id,
          postId: post.id,
          postTitle: comment.postTitle || comment.post_title || post.title || 'Post',
          post,
          content: comment.content,
          createdAt: getCommentCreatedAt(comment),
        } satisfies CommentActivity
      }),
  )
  const comments = commentActivities.filter((comment): comment is CommentActivity => Boolean(comment))

  await hydratePostMedia(comments.map((comment) => comment.post))
  userComments.value = sortedByDate(mergeById(userComments.value, comments, append), (comment) => comment.createdAt)
  updateLoadedTabState('comments', page, response.total ?? comments.length, responseHasMore(response))
}

const loadQuestionActivityTab = async (page: number, append: boolean, userId: string) => {
  const response = await questionsService.listUserQuestions(buildActivityParams(page), authStore.authToken)
  const questions = (response.data ?? [])
    .map((question) => readQuestionActivityRecord(question))
    .filter((question): question is QuestionRecord => Boolean(question))
    .filter((question) => !getQuestionUserId(question) || getQuestionUserId(question) === userId)

  userQuestions.value = sortedByDate(mergeById(userQuestions.value, questions, append), getQuestionCreatedAt)
  updateLoadedTabState('questions', page, response.total ?? questions.length, responseHasMore(response))
}

const loadAnswerActivityTab = async (page: number, append: boolean, userId: string) => {
  const response = await questionsService.listUserAnswers(buildActivityParams(page), authStore.authToken)
  const rawAnswers = (response.data ?? []) as AnswerActivityRecord[]
  const answerActivities = await Promise.all(
    rawAnswers
      .filter((answer) => !getAnswerUserId(answer) || getAnswerUserId(answer) === userId)
      .map(async (answer) => {
        const embeddedQuestion = readQuestionActivityRecord(answer.question)
        const questionId = getAnswerQuestionId(answer) || embeddedQuestion?.id || ''
        let question = embeddedQuestion || null

        if (!question && questionId) {
          try {
            const questionResponse = await questionsService.getQuestion(questionId, authStore.authToken, false)
            question = questionResponse.data
          } catch {
            question = null
          }
        }

        if (!question) {
          return null
        }

        return {
          id: answer.id,
          questionId: question.id,
          questionTitle: answer.questionTitle || answer.question_title || question.title || 'Question',
          question,
          content: getAnswerContent(answer),
          createdAt: getAnswerCreatedAt(answer),
          score: getOptionalCount(answer.score, answer.reactions_count, answer.reaction_count, answer.reactionsCount),
        } satisfies AnswerActivity
      }),
  )
  const answers = answerActivities.filter((answer): answer is AnswerActivity => Boolean(answer))

  userAnswers.value = sortedByDate(mergeById(userAnswers.value, answers, append), (answer) => answer.createdAt)
  updateLoadedTabState('answers', page, response.total ?? answers.length, responseHasMore(response))
}

const loadActivities = async (tab: ActivityTab = activeTab.value, options: { append?: boolean } = {}) => {
  const state = tabState[tab]
  const append = Boolean(options.append)

  if (!authStore.authToken || state.isLoading || (append && !state.hasMore)) {
    return
  }

  state.isLoading = true
  state.error = ''

  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      throw new Error('Unable to identify the signed-in user.')
    }

    const page = append ? state.page + 1 : 1

    if (tab === 'posts' || tab === 'scored' || tab === 'saved') {
      await loadPostActivityTab(tab, page, append, userId)
    } else if (tab === 'comments') {
      await loadCommentActivityTab(page, append, userId)
    } else if (tab === 'questions') {
      await loadQuestionActivityTab(page, append, userId)
    } else {
      await loadAnswerActivityTab(page, append, userId)
    }
  } catch (error) {
    state.error = error instanceof ApiError || error instanceof Error
      ? error.message
      : 'Unable to load your activity right now.'
  } finally {
    state.isLoading = false
  }
}

const openEditComment = (comment: CommentActivity) => {
  editModal.value = {
    isOpen: true,
    type: 'comment',
    id: comment.id,
    title: '',
    body: comment.content,
  }
}

const openEditQuestion = (question: QuestionRecord) => {
  editModal.value = {
    isOpen: true,
    type: 'question',
    id: question.id,
    title: question.title,
    body: question.body,
  }
}

const closeEditModal = (options?: { force?: boolean }) => {
  if (isSavingEdit.value && !options?.force) {
    return
  }

  editModal.value = {
    isOpen: false,
    type: null,
    id: '',
    title: '',
    body: '',
  }
}

const submitEdit = async () => {
  if (!editModal.value.type || isSavingEdit.value) {
    return
  }

  const body = editModal.value.body.trim()
  const title = editModal.value.title.trim()

  if (!body || (editModal.value.type === 'question' && !title)) {
    toast.error('Please fill in the required fields.')
    return
  }

  isSavingEdit.value = true

  try {
    if (editModal.value.type === 'comment') {
      await postsService.updateComment(editModal.value.id, {
        userId: authStore.userId,
        content: body,
      }, authStore.authToken)
      userComments.value = userComments.value.map((comment) =>
        comment.id === editModal.value.id ? { ...comment, content: body } : comment,
      )
    } else {
      const question = userQuestions.value.find((item) => item.id === editModal.value.id)
      await questionsService.updateQuestion(editModal.value.id, {
        title,
        body,
        communityId: question?.communityId || question?.community_id || null,
        visibility: question?.visibility || 'public',
      }, authStore.authToken)
      userQuestions.value = userQuestions.value.map((item) =>
        item.id === editModal.value.id ? { ...item, title, body } : item,
      )
      savedQuestions.value = savedQuestions.value.map((item) =>
        item.id === editModal.value.id ? { ...item, title, body } : item,
      )
    }

    closeEditModal({ force: true })
  } catch (error) {
    const message = error instanceof ApiError || error instanceof Error
      ? error.message
      : 'Unable to save changes.'
    toast.error('Update failed', { description: message })
  } finally {
    isSavingEdit.value = false
  }
}

const openDeleteComment = (comment: CommentActivity) => {
  deleteModal.value = {
    isOpen: true,
    type: 'comment',
    id: comment.id,
    label: 'this comment',
  }
}

const openDeletePost = (post: FeedPost) => {
  deleteModal.value = {
    isOpen: true,
    type: 'post',
    id: getFeedPostId(post),
    label: 'this post',
  }
}

const openDeleteQuestion = (question: QuestionRecord) => {
  deleteModal.value = {
    isOpen: true,
    type: 'question',
    id: question.id,
    label: 'this question',
  }
}

const closeDeleteModal = (options?: { force?: boolean }) => {
  if (isDeleting.value && !options?.force) {
    return
  }

  deleteModal.value = {
    isOpen: false,
    type: null,
    id: '',
    label: '',
  }
}

const confirmDelete = async () => {
  if (!deleteModal.value.type || isDeleting.value) {
    return
  }

  isDeleting.value = true

  try {
    if (deleteModal.value.type === 'post') {
      await postsService.deletePost(deleteModal.value.id, { userId: authStore.userId }, authStore.authToken)
      removePostFromCollections(deleteModal.value.id)
    } else if (deleteModal.value.type === 'comment') {
      await postsService.deleteComment(deleteModal.value.id, { userId: authStore.userId }, authStore.authToken)
      userComments.value = userComments.value.filter((comment) => comment.id !== deleteModal.value.id)
    } else {
      await questionsService.deleteQuestion(deleteModal.value.id, { userId: authStore.userId }, authStore.authToken)
      userQuestions.value = userQuestions.value.filter((question) => question.id !== deleteModal.value.id)
      savedQuestions.value = savedQuestions.value.filter((question) => question.id !== deleteModal.value.id)
    }

    closeDeleteModal({ force: true })
  } catch (error) {
    const message = error instanceof ApiError || error instanceof Error
      ? error.message
      : 'Unable to delete this activity.'
    toast.error('Delete failed', { description: message })
  } finally {
    isDeleting.value = false
  }
}

watch(
  () => route.query.tab,
  () => {
    syncActiveTabFromRoute()
  },
)

watch(activeTab, () => {
  closeActionMenu()
  loadActiveTabIfNeeded()
})

onMounted(() => {
  syncActiveTabFromRoute()
  window.addEventListener('scroll', handleWindowScroll, { passive: true })
  loadActiveTabIfNeeded()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleWindowScroll)
})
</script>

<template>
  <section class="mx-auto w-full max-w-5xl space-y-6 pb-8">
    <div>
      <h1 class="text-2xl font-bold tracking-normal text-[var(--text-primary)] sm:text-3xl">
        Manage Activities
      </h1>
    </div>

    <nav class="flex gap-5 overflow-x-auto border-b border-[color:var(--border-soft)]" aria-label="Activity sections">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="-mb-px shrink-0 border-b-2 px-0 pb-3 text-sm font-semibold transition sm:text-base"
        :class="
          activeTab === tab.id
            ? 'border-[var(--accent)] text-[var(--accent-strong)]'
            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        "
        @click="setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div
      v-if="loadError"
      class="rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-secondary)]"
    >
      {{ loadError }}
    </div>

    <div class="mx-auto w-full max-w-[44rem] lg:max-w-[46rem]">
      <div v-if="isLoading" class="space-y-4">
        <article
          v-for="item in 4"
          :key="item"
          class="animate-pulse rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4"
        >
          <div class="h-4 w-32 rounded-full bg-[var(--surface-muted)]" />
          <div class="mt-4 h-5 w-3/4 rounded-full bg-[var(--surface-muted)]" />
          <div class="mt-3 h-4 w-full rounded-full bg-[var(--surface-muted)]" />
          <div class="mt-2 h-4 w-2/3 rounded-full bg-[var(--surface-muted)]" />
        </article>
      </div>

      <div v-else class="space-y-4">
      <template v-if="activeTab === 'posts' && userPostFeedItems.length">
        <AppFeedPost
          v-for="post in userPostFeedItems"
          :key="post.apiId || post.slug"
          :post="post"
          allow-edit
          @post-updated="handleManagedPostUpdated"
          @delete-requested="openDeletePost"
          @score-changed="handleManagedPostScoreChanged"
          @save-changed="handleManagedSaveChanged"
        />
      </template>

      <template v-else-if="activeTab === 'comments' && userComments.length">
        <div
          v-for="comment in userComments"
          :key="comment.id"
          class="space-y-2"
        >
          <AppFeedPost
            :post="mapApiPostToFeedPost(comment.post, postMediaById.get(comment.postId) ?? [])"
            @post-updated="handleManagedPostUpdated"
            @score-changed="handleManagedPostScoreChanged"
            @save-changed="handleManagedSaveChanged"
          />
          <section class="overflow-visible rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
            <header class="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
              <button
                type="button"
                class="inline-flex min-w-0 items-center gap-2 text-left text-[0.86rem] font-semibold text-[var(--text-primary)]"
                @click="toggleActivityPanel('comment', comment.id)"
              >
                <ChevronDown
                  class="h-4 w-4 shrink-0 transition"
                  :class="isActivityPanelOpen('comment', comment.id) ? '' : '-rotate-90'"
                />
                <span class="truncate">Your comment</span>
                <span class="shrink-0 text-[0.76rem] font-medium text-[var(--text-secondary)]">{{ formatDate(comment.createdAt) }}</span>
              </button>
              <div class="relative shrink-0">
                <button
                  type="button"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--accent-strong)]"
                  aria-label="Comment actions"
                  @click="toggleActionMenu(`comment-${comment.id}`)"
                >
                  <MoreHorizontal class="h-4 w-4" />
                </button>
                <div
                  v-if="activeActionMenu === `comment-${comment.id}`"
                  class="absolute right-0 top-[calc(100%+0.45rem)] z-20 min-w-[9rem] rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-2 shadow-[var(--shadow-elevated)]"
                >
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--accent-strong)]"
                    @click="closeActionMenu(); openEditComment(comment)"
                  >
                    <Edit2 class="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    class="mt-1 flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                    @click="closeActionMenu(); openDeleteComment(comment)"
                  >
                    <Trash2 class="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </header>
            <div
              v-if="isActivityPanelOpen('comment', comment.id)"
              class="border-t border-[color:var(--border-soft)] px-3 py-3 sm:px-4"
            >
              <p class="rounded-[0.8rem] bg-[var(--surface-secondary)] px-3 py-2 text-[0.9rem] leading-6 text-[var(--text-primary)]">
                {{ getSnippet(comment.content) }}
              </p>
            </div>
          </section>
        </div>
      </template>

      <template v-else-if="activeTab === 'scored' && scoredPostFeedItems.length">
        <AppFeedPost
          v-for="post in scoredPostFeedItems"
          :key="post.apiId || post.slug"
          :post="post"
          @score-changed="handleManagedPostScoreChanged"
          @save-changed="handleManagedSaveChanged"
        />
      </template>

      <template v-else-if="activeTab === 'saved' && savedFeedItems.length">
        <AppFeedPost
          v-for="item in savedFeedItems"
          :key="`${item.type}-${item.apiId || item.slug}`"
          :post="item"
          @post-updated="handleManagedPostUpdated"
          @score-changed="handleManagedPostScoreChanged"
          @save-changed="handleManagedSaveChanged"
        />
      </template>

      <template v-else-if="activeTab === 'answers' && userAnswers.length">
        <div
          v-for="answer in userAnswers"
          :key="answer.id"
          class="space-y-2"
        >
          <AppFeedPost :post="mapApiQuestionToFeedPost(answer.question)" />
          <section class="overflow-hidden rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
            <header class="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
              <button
                type="button"
                class="inline-flex min-w-0 items-center gap-2 text-left text-[0.86rem] font-semibold text-[var(--text-primary)]"
                @click="toggleActivityPanel('answer', answer.id)"
              >
                <ChevronDown
                  class="h-4 w-4 shrink-0 transition"
                  :class="isActivityPanelOpen('answer', answer.id) ? '' : '-rotate-90'"
                />
                <span class="truncate">Your answer</span>
                <span class="shrink-0 text-[0.76rem] font-medium text-[var(--text-secondary)]">{{ formatDate(answer.createdAt) }}</span>
              </button>
              <span class="inline-flex h-8 items-center gap-1 rounded-[0.8rem] border border-[color:var(--border-soft)] px-2 text-[0.78rem] font-medium text-[var(--text-secondary)] sm:px-2.5">
                <ArrowUp class="h-3 w-3" />
                {{ answer.score }} score
              </span>
            </header>
            <div
              v-if="isActivityPanelOpen('answer', answer.id)"
              class="border-t border-[color:var(--border-soft)] px-3 py-3 sm:px-4"
            >
              <p class="text-[0.9rem] leading-6 text-[var(--text-primary)]">
                {{ getSnippet(answer.content) }}
              </p>
            </div>
          </section>
        </div>
      </template>

      <template v-else-if="activeTab === 'questions' && userQuestionFeedItems.length">
        <div
          v-for="question in userQuestions"
          :key="question.id"
          class="space-y-2"
        >
          <AppFeedPost
            :post="mapApiQuestionToFeedPost(question)"
          >
            <template #question-menu-actions="{ closeMenu }">
              <button
                type="button"
                class="mt-1 flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--accent-strong)]"
                aria-label="Edit question"
                @click="closeMenu(); openEditQuestion(question)"
              >
                <PencilLine class="h-4 w-4" />
                Edit
              </button>
              <button
                type="button"
                class="mt-1 flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                aria-label="Delete question"
                @click="closeMenu(); openDeleteQuestion(question)"
              >
                <Trash2 class="h-4 w-4" />
                Delete
              </button>
            </template>
          </AppFeedPost>
        </div>
      </template>

        <div
          v-else
          class="rounded-[0.9rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center"
        >
          <p class="text-sm font-semibold text-[var(--text-primary)]">{{ activeEmptyMessage }}</p>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">Your activity will appear here as you use Skills4Export.</p>
        </div>

        <div
          v-if="isLoadingMore"
          class="rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-center text-sm font-semibold text-[var(--text-secondary)]"
        >
          Loading more activity...
        </div>

        <div v-else-if="activeTabState.isLoaded && activeTabState.hasMore" class="flex justify-center pt-1">
          <button
            type="button"
            class="inline-flex h-10 items-center justify-center rounded-[0.65rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
            @click="loadMoreActiveTab"
          >
            Load more
          </button>
        </div>
      </div>
    </div>
  </section>

  <ResponsiveOverlay
    v-model="editModal.isOpen"
    label="Edit activity"
    :title="editModal.type === 'question' ? 'Edit Question' : 'Edit Comment'"
    :description="editModal.type === 'question' ? 'Update your question title and details.' : 'Update your comment.'"
    max-width-class="sm:max-w-xl"
  >
    <form class="space-y-4" @submit.prevent="submitEdit">
      <label v-if="editModal.type === 'question'" class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Title</span>
        <input
          v-model="editModal.title"
          type="text"
          class="mt-2 w-full rounded-[0.65rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
        >
      </label>
      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Content</span>
        <textarea
          v-model="editModal.body"
          rows="7"
          class="mt-2 w-full resize-y rounded-[0.65rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2.5 text-sm leading-6 text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
        />
      </label>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="inline-flex h-10 items-center justify-center rounded-[0.55rem] border border-[color:var(--border-soft)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          :disabled="isSavingEdit"
          @click="closeEditModal()"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="inline-flex h-10 items-center justify-center rounded-[0.55rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSavingEdit"
        >
          {{ isSavingEdit ? 'Saving...' : 'Save changes' }}
        </button>
      </div>
    </form>
  </ResponsiveOverlay>

  <ResponsiveOverlay
    v-model="deleteModal.isOpen"
    label="Delete activity"
    title="Delete Activity"
    :description="`Are you sure you want to delete ${deleteModal.label}?`"
    max-width-class="sm:max-w-md"
  >
    <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        class="inline-flex h-10 items-center justify-center rounded-[0.55rem] border border-[color:var(--border-soft)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        :disabled="isDeleting"
        @click="closeDeleteModal()"
      >
        Cancel
      </button>
      <button
        type="button"
        class="inline-flex h-10 items-center justify-center rounded-[0.55rem] bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isDeleting"
        @click="confirmDelete"
      >
        {{ isDeleting ? 'Deleting...' : 'Delete' }}
      </button>
    </div>
  </ResponsiveOverlay>
</template>
