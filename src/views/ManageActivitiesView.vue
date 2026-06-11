<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
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

const tabs: Array<{ id: ActivityTab; label: string }> = [
  { id: 'posts', label: 'Posts' },
  { id: 'comments', label: 'Comments' },
  { id: 'scored', label: 'Scored' },
  { id: 'saved', label: 'Saved' },
  { id: 'answers', label: 'Answers' },
  { id: 'questions', label: 'Questions' },
]

const authStore = useAuthStore()
const activeTab = ref<ActivityTab>('posts')
const isLoading = ref(false)
const loadError = ref('')
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
  type: 'comment' | 'question' | null
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

const activeCount = computed(() => ({
  posts: userPosts.value.length,
  comments: userComments.value.length,
  scored: scoredPosts.value.length,
  saved: savedPosts.value.length + savedQuestions.value.length,
  answers: userAnswers.value.length,
  questions: userQuestions.value.length,
}))

const userPostFeedItems = computed<FeedPost[]>(() =>
  userPosts.value.map((post) => mapApiPostToFeedPost(post, postMediaById.value.get(post.id) ?? [])),
)

const userQuestionFeedItems = computed<FeedPost[]>(() =>
  userQuestions.value.map((question) => mapApiQuestionToFeedPost(question)),
)

const scoredPostFeedItems = computed<FeedPost[]>(() =>
  scoredPosts.value.map((post) => mapApiPostToFeedPost(post, postMediaById.value.get(post.id) ?? [])),
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

const hydratePostMedia = async (posts: PostRecord[]) => {
  const entries = await Promise.all(
    posts.map(async (post) => {
      const response = await postsService.listPostMedia(post.id, authStore.authToken).catch(() => null)
      return [post.id, response?.data ?? []] as const
    }),
  )

  postMediaById.value = new Map(entries)
}

const loadActivities = async () => {
  if (!authStore.authToken || isLoading.value) {
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      throw new Error('Unable to identify the signed-in user.')
    }

    const [postsResponse, questionsResponse, savedPostsResponse] = await Promise.all([
      postsService.listPosts({ per_page: 100, sort: '-createdAt' }, authStore.authToken),
      questionsService.listQuestions({ per_page: 100, sort: '-createdAt' }, authStore.authToken),
      postsService
        .listSavedPosts({ per_page: 100, sort: '-createdAt' }, authStore.authToken)
        .catch(() => null),
    ])

    const allPosts = postsResponse.data ?? []
    const allQuestions = questionsResponse.data ?? []
    const ownPosts = allPosts.filter((post) => getPostUserId(post) === userId)
    const ownQuestions = allQuestions.filter((question) => getQuestionUserId(question) === userId)
    const nextScoredPosts = allPosts.filter((post) => Boolean(post.is_liked))
    const nextSavedPosts = (savedPostsResponse?.data ?? allPosts.filter((post) => post.is_saved))
      .filter((post) => savedPostsResponse || post.is_saved)
    const nextSavedQuestions = allQuestions.filter((question) => question.is_saved)

    await hydratePostMedia([...ownPosts, ...nextScoredPosts, ...nextSavedPosts])

    const [commentResults, answerResults] = await Promise.all([
      Promise.all(allPosts.map((post) => postsService.listComments(post.id, authStore.authToken).catch(() => null))),
      Promise.all(allQuestions.map((question) => questionsService.listAnswers(question.id, authStore.authToken).catch(() => null))),
    ])

    const postTitleById = new Map(allPosts.map((post) => [post.id, post.title || 'Post']))
    const postById = new Map(allPosts.map((post) => [post.id, post]))
    const questionTitleById = new Map(allQuestions.map((question) => [question.id, question.title || 'Question']))
    const questionById = new Map(allQuestions.map((question) => [question.id, question]))

    userPosts.value = sortedByDate(ownPosts, getPostCreatedAt)
    scoredPosts.value = sortedByDate(nextScoredPosts, getPostCreatedAt)
    userQuestions.value = sortedByDate(ownQuestions, getQuestionCreatedAt)
    savedPosts.value = sortedByDate(nextSavedPosts, getPostCreatedAt)
    savedQuestions.value = sortedByDate(nextSavedQuestions, getQuestionCreatedAt)
    userComments.value = sortedByDate(
      commentResults
        .flatMap((response) => response?.data ?? [])
        .filter((comment) => getCommentUserId(comment) === userId)
        .filter((comment) => Boolean(postById.get(getCommentPostId(comment))))
        .map((comment) => {
          const postId = getCommentPostId(comment)
          const post = postById.get(postId) as PostRecord

          return {
            id: comment.id,
            postId,
            postTitle: postTitleById.get(postId) || 'Post',
            post,
            content: comment.content,
            createdAt: getCommentCreatedAt(comment),
          }
        }),
      (comment) => comment.createdAt,
    )
    userAnswers.value = sortedByDate(
      answerResults
        .flatMap((response) => response?.data ?? [])
        .filter((answer) => getAnswerUserId(answer) === userId)
        .filter((answer) => Boolean(questionById.get(getAnswerQuestionId(answer))))
        .map((answer) => {
          const questionId = getAnswerQuestionId(answer)
          const question = questionById.get(questionId) as QuestionRecord

          return {
            id: answer.id,
            questionId,
            questionTitle: questionTitleById.get(questionId) || 'Question',
            question,
            content: getAnswerContent(answer),
            createdAt: getAnswerCreatedAt(answer),
            score: getOptionalCount(answer.score, answer.reactions_count, answer.reaction_count, answer.reactionsCount),
          }
        }),
      (answer) => answer.createdAt,
    )
  } catch (error) {
    loadError.value = error instanceof ApiError || error instanceof Error
      ? error.message
      : 'Unable to load your activity right now.'
  } finally {
    isLoading.value = false
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
      toast.success('Comment updated.')
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
      toast.success('Question updated.')
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
    if (deleteModal.value.type === 'comment') {
      await postsService.deleteComment(deleteModal.value.id, { userId: authStore.userId }, authStore.authToken)
      userComments.value = userComments.value.filter((comment) => comment.id !== deleteModal.value.id)
      toast.success('Comment deleted.')
    } else {
      await questionsService.deleteQuestion(deleteModal.value.id, { userId: authStore.userId }, authStore.authToken)
      userQuestions.value = userQuestions.value.filter((question) => question.id !== deleteModal.value.id)
      savedQuestions.value = savedQuestions.value.filter((question) => question.id !== deleteModal.value.id)
      toast.success('Question deleted.')
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

onMounted(() => {
  void loadActivities()
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
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span class="ml-1 text-xs text-[var(--text-tertiary)]">({{ activeCount[tab.id] }})</span>
      </button>
    </nav>

    <div
      v-if="loadError"
      class="rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-secondary)]"
    >
      {{ loadError }}
    </div>

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
        />
      </template>

      <template v-else-if="activeTab === 'saved' && savedFeedItems.length">
        <AppFeedPost
          v-for="item in savedFeedItems"
          :key="`${item.type}-${item.apiId || item.slug}`"
          :post="item"
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
