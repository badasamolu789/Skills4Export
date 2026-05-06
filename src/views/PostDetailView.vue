<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowUp,
  Bookmark,
  Check,
  ChevronDown,
  CloudUpload,
  Copy,
  BookOpen,
  Flag,
  MessageSquare,
  Reply,
  Share2,
  Users,
  X,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { getFeedPostBySlug, type FeedPost } from '@/data/feedPosts'
import { ApiError } from '@/lib/api'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import PostCommentThread from '@/components/PostCommentThread.vue'
import type { PostCommentThreadItem } from '@/components/PostCommentThread.vue'
import { postsService, type PostCommentRecord, type PostMediaRecord } from '@/services/posts'
import { questionsService, type QuestionAnswerRecord } from '@/services/questions'
import { usersService, type MyProfileData } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { mapApiPostToFeedPost } from '@/utils/postMapper'
import { getQuestionUserId, mapApiQuestionToFeedPost } from '@/utils/questionMapper'

const route = useRoute()
const authStore = useAuthStore()

const apiPost = ref<FeedPost | null>(null)
const isLoadingPost = ref(false)
const postError = ref('')
const seedPost = computed(() => getFeedPostBySlug(String(route.params.slug)))
const post = computed(() => apiPost.value || seedPost.value)
const apiPostId = computed(() => post.value?.apiId)
const isQuestionRoute = computed(() => route.path.startsWith('/questions/'))
const isFollowing = ref(false)
const isSaved = ref(false)
const isScored = ref(false)
const isSavingPost = ref(false)
const isReactingToPost = ref(false)
const isSubmittingAnswer = ref(false)
const isLoadingComments = ref(false)
const isSubmittingComment = ref(false)
const currentScore = ref(0)
const currentComments = ref(0)
const commentInput = ref('')
const answerInput = ref('')
const isAnswerModalOpen = ref(false)
const answerSort = ref('newest')
const answerAttachments = ref<File[]>([])
const answererProfile = ref<MyProfileData | null>(null)
const isLoadingAnswererProfile = ref(false)
const isShareModalOpen = ref(false)
const shareCommunity = ref('')
const shareComment = ref('')
const activeActionClass =
  'border-[color:var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] hover:text-white'

type DetailComment = {
  id: string
  parentId: string | null
  author: string
  authorTo: string
  avatarSrc: string | null
  avatarText: string
  tag: string
  time: string
  body: string
  score: number
  isScored: boolean
  isFollowing: boolean
  isReplying: boolean
  areRepliesOpen: boolean
  replyInput: string
  replies: DetailComment[]
}

type QuestionAnswerItem = {
  id: string
  authorName: string
  authorTo: string
  authorMeta: string[]
  time: string
  content: string
  score: number
}

const answerItems = ref<QuestionAnswerItem[]>([
  {
    id: 'seed-answer-1',
    authorName: 'Arden Smith',
    authorTo: '/profile/view/user-arden-smith',
    authorMeta: ['Psychologist', 'CSS3', 'Java'],
    time: '6 hours ago',
    content:
      'Beryllium is the fourth element of the periodic table. It has the atomic number 4 and the chemical symbol Be.',
    score: 0,
  },
  {
    id: 'seed-answer-2',
    authorName: 'Naomi Cole',
    authorTo: '/profile/view/user-naomi-cole',
    authorMeta: ['Frontend', 'UI Systems', 'Mentorship'],
    time: '4 hours ago',
    content:
      'The answer is beryllium. The first four elements are hydrogen, helium, lithium, and beryllium.',
    score: 0,
  },
])

const mapAnswerBody = (answer: QuestionAnswerRecord) => answer.content

const mapAnswerItem = (answer: QuestionAnswerRecord): QuestionAnswerItem => {
  const userId = answer.userId || answer.user_id || ''

  return {
    id: answer.id,
    authorName: userId && userId === authStore.userId ? 'You' : 'Community member',
    authorTo: userId ? `/profile/view/${userId}` : '/profile',
    authorMeta: ['Skills4Export member'],
    time: formatCommentTime(answer.createdAt || answer.created_at || ''),
    content: mapAnswerBody(answer),
    score: 0,
  }
}

const formatCommentTime = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CM'

const getProfileName = (profile?: MyProfileData | null) =>
  profile?.profile?.username?.trim() ||
  profile?.user?.username?.trim() ||
  profile?.user?.email?.split('@')[0]?.trim() ||
  ''

const getProfileSkills = (profile?: MyProfileData | null) =>
  profile?.skills
    ?.map((skill) => (skill.name || skill.skill || '').trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' | ') || ''

const currentUserCommentProfile = () => {
  const name =
    authStore.userProfile?.username ||
    authStore.signUpDraft.username ||
    authStore.signUpDraft.name ||
    'You'

  return {
    name,
    to: authStore.userId ? `/profile/view/${authStore.userId}` : '/profile',
    avatarSrc: authStore.userProfile?.avatar || authStore.signUpDraft.avatar || null,
    tag: authStore.signUpDraft.interests.slice(0, 3).join(' | '),
  }
}

const resolveCommentAuthor = async (comment: PostCommentRecord) => {
  if (comment.user_id && comment.user_id === authStore.userId) {
    return currentUserCommentProfile()
  }

  const response = comment.user_id
    ? await usersService.getUserProfile(comment.user_id, authStore.authToken).catch(() => null)
    : null
  const profile = response?.data ?? null
  const name = getProfileName(profile) || 'Community member'

  return {
    name,
    to: comment.user_id ? `/profile/view/${comment.user_id}` : '/profile',
    avatarSrc: profile?.profile?.avatar || null,
    tag: getProfileSkills(profile),
  }
}

const mapDetailComment = async (comment: PostCommentRecord): Promise<DetailComment> => {
  const authorProfile = await resolveCommentAuthor(comment)

  return {
    id: comment.id,
    parentId: comment.parent_comment_id,
    author: authorProfile.name,
    authorTo: authorProfile.to,
    avatarSrc: authorProfile.avatarSrc,
    avatarText: getInitials(authorProfile.name),
    tag: authorProfile.tag,
    time: formatCommentTime(comment.created_at),
    body: comment.content,
    score: 0,
    isScored: false,
    isFollowing: false,
    isReplying: false,
    areRepliesOpen: false,
    replyInput: '',
    replies: [],
  }
}

const detailComments = ref<DetailComment[]>([])

const buildDetailCommentTree = async (comments: PostCommentRecord[]) => {
  const mapped = await Promise.all(comments.map(mapDetailComment))
  const byId = new Map<string, DetailComment>()
  const roots: DetailComment[] = []

  mapped.forEach((comment) => {
    byId.set(comment.id, comment)
  })

  mapped.forEach((comment) => {
    if (comment.parentId && byId.has(comment.parentId)) {
      const parent = byId.get(comment.parentId)
      parent?.replies.push(comment)
      if (parent) {
        parent.areRepliesOpen = true
      }
      return
    }

    roots.push(comment)
  })

  return roots
}

const loadApiQuestion = async (id: string) => {
  const response = await questionsService.getQuestion(id, authStore.authToken, true)
  const userId = getQuestionUserId(response.data)

  const [authorResponse, answersResponse] = await Promise.all([
    userId
      ? usersService.getUserProfile(userId, authStore.authToken).catch(() => null)
      : Promise.resolve(null),
    response.data.answers?.length
      ? Promise.resolve(null)
      : questionsService.listAnswers(response.data.id, authStore.authToken).catch(() => null),
  ])

  const answers = response.data.answers ?? answersResponse?.data ?? []
  const authorData =
    authorResponse?.data ??
    (userId && userId === authStore.userId
      ? {
          user: {
            id: authStore.userId,
            username:
              authStore.userProfile?.username ||
              authStore.signUpDraft.username ||
              authStore.signUpDraft.name ||
              'You',
            email: authStore.signUpDraft.email,
          },
          profile: authStore.userProfile,
        }
      : null)

  apiPost.value = mapApiQuestionToFeedPost(
    {
      ...response.data,
      answers,
    },
    authorData,
  )
  answerItems.value = answers.map(mapAnswerItem)
}

const author = computed(() => {
  if (!post.value) {
    return null
  }

  if (post.value.type === 'question') {
    return {
      name: post.value.authorName,
      to: post.value.authorTo,
      avatarText: post.value.authorName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      eyebrow: post.value.communityName,
    }
  }

  return {
    name: post.value.author.name,
    to: post.value.author.to,
    avatarText: post.value.author.avatarText,
    avatarSrc: post.value.author.avatarSrc || null,
    eyebrow: post.value.author.tag || 'Skills4Export member',
  }
})

const postContextLabel = computed(() => {
  if (!post.value) {
    return ''
  }

  if (post.value.type === 'question') {
    return post.value.communityId ? 'Question in community' : 'Question'
  }

  if (post.value.communityId) {
    return 'User post in community'
  }

  return 'User post'
})

const postContextDetail = computed(() => {
  if (!post.value) {
    return ''
  }

  if (post.value.type === 'question') {
    return post.value.communityName
  }

  if (post.value.communityId) {
    return post.value.communityName || 'Community'
  }

  return 'Personal post'
})

const skillPills = computed(() => {
  if (!post.value) {
    return []
  }

  if (post.value.type === 'question') {
    return post.value.tag.split('|').map((item) => item.trim()).filter(Boolean)
  }

  if (post.value.type === 'personal') {
    return post.value.author.tag
      .split('|')
      .map((item) => item.trim())
      .filter((item) => item && item.toLowerCase() !== 'skills4export member')
      .slice(0, 3)
  }

  return (post.value.author.tag || '')
    .split('|')
    .map((item) => item.trim())
    .filter((item) => item && item.toLowerCase() !== 'skills4export member')
    .slice(0, 3)
})

const sortedAnswerItems = computed(() => {
  if (answerSort.value === 'oldest') {
    return [...answerItems.value].reverse()
  }

  return answerItems.value
})

const answererName = computed(
  () =>
    answererProfile.value?.profile?.username ||
    answererProfile.value?.user?.username ||
    answererProfile.value?.user?.email?.split('@')[0] ||
    authStore.userProfile?.username ||
    authStore.signUpDraft.username ||
    authStore.signUpDraft.name ||
    'You',
)

const answererAvatar = computed(
  () => answererProfile.value?.profile?.avatar || authStore.userProfile?.avatar || authStore.signUpDraft.avatar || '',
)

const answererProfilePath = computed(() => (authStore.userId ? `/profile/view/${authStore.userId}` : '/profile'))

const answererSkills = computed(() => {
  const profileSkills =
    answererProfile.value?.skills
      ?.map((skill) => (skill.name || skill.skill || '').trim())
      .filter(Boolean)
      .slice(0, 3) ?? []

  if (profileSkills.length) {
    return profileSkills
  }

  const draftSkills = authStore.signUpDraft.interests.slice(0, 3)

  return draftSkills.length ? draftSkills : ['Skills4Export member']
})

const answererInitials = computed(() =>
  answererName.value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const loadAnswererProfile = async () => {
  if (!authStore.authToken || isLoadingAnswererProfile.value || answererProfile.value) {
    return
  }

  isLoadingAnswererProfile.value = true

  try {
    const response = await usersService.getMyProfile(authStore.authToken)
    answererProfile.value = response.data ?? null
  } catch {
    answererProfile.value = null
  } finally {
    isLoadingAnswererProfile.value = false
  }
}

const openAnswerModal = () => {
  answerInput.value = ''
  answerAttachments.value = []
  isAnswerModalOpen.value = true
  void loadAnswererProfile()
}

const closeAnswerModal = () => {
  isAnswerModalOpen.value = false
  answerInput.value = ''
  answerAttachments.value = []
}

const handleAnswerAttachmentChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  answerAttachments.value = Array.from(input.files ?? [])
}

const loadPostComments = async (postId: string) => {
  isLoadingComments.value = true

  try {
    const response = await postsService.listComments(postId, authStore.authToken)
    detailComments.value = await buildDetailCommentTree(response.data)
    currentComments.value = response.total
  } catch {
    detailComments.value = []
    currentComments.value = 0
  } finally {
    isLoadingComments.value = false
  }
}

const shareLink = computed(() =>
  typeof window === 'undefined'
    ? `${post.value?.type === 'question' ? '/questions' : '/posts'}/${post.value?.slug ?? ''}`
    : window.location.href,
)

const sharePreviewAuthor = computed(() => author.value?.name || 'Skills4Export member')
const sharePreviewDescription = computed(() => {
  if (!post.value) {
    return ''
  }

  return 'description' in post.value ? post.value.description : post.value.body || post.value.title
})
const sharePreviewImageSrc = computed(() =>
  post.value && 'imageSrc' in post.value ? post.value.imageSrc : '',
)
const sharePreviewImageAlt = computed(() => post.value?.title || 'Shared post')

watch(
  () => route.params.slug,
  async (slug) => {
    apiPost.value = null
    postError.value = ''

    if (getFeedPostBySlug(String(slug))) {
      return
    }

    isLoadingPost.value = true

    try {
      if (isQuestionRoute.value) {
        await loadApiQuestion(String(slug))
        return
      }

      const response = await postsService.getPost(String(slug), authStore.authToken)
      let media: PostMediaRecord[] = []
      const postUserId = response.data.user_id

      try {
        const mediaResponse = await postsService.listPostMedia(response.data.id, authStore.authToken)
        media = mediaResponse.data
      } catch {
        media = []
      }

      const authorResponse = postUserId
        ? await usersService.getUserProfile(postUserId, authStore.authToken).catch(() => null)
        : null

      apiPost.value = mapApiPostToFeedPost(response.data, media, authorResponse?.data ?? null)
      await loadPostComments(response.data.id)
    } catch (error) {
      try {
        await loadApiQuestion(String(slug))
      } catch (questionError) {
        postError.value =
          questionError instanceof ApiError
            ? questionError.message
            : error instanceof ApiError
              ? error.message
              : 'Unable to load post.'
      }
    } finally {
      isLoadingPost.value = false
    }
  },
  { immediate: true },
)

watch(
  post,
  (nextPost) => {
    isFollowing.value = nextPost?.isFollowing ?? false
    isSaved.value = false
    isScored.value = false
    currentScore.value = nextPost && 'score' in nextPost ? nextPost.score : 0
    currentComments.value = nextPost && 'comments' in nextPost ? nextPost.comments : detailComments.value.length
    commentInput.value = ''
    answerInput.value = ''
  },
  { immediate: true },
)

const toggleFollow = () => {
  isFollowing.value = !isFollowing.value
}

const toggleScore = async () => {
  if (!apiPostId.value) {
    isScored.value = !isScored.value
    currentScore.value += isScored.value ? 1 : -1
    return
  }

  if (isReactingToPost.value) {
    return
  }

  isReactingToPost.value = true

  try {
    const response = await postsService.togglePostReaction(
      apiPostId.value,
      {
        userId: authStore.userId || undefined,
        type: 'like',
      },
      authStore.authToken,
    )
    isScored.value = !isScored.value
    currentScore.value = response.data.count
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to update reaction.'
    toast.error('Reaction failed', { description: message })
  } finally {
    isReactingToPost.value = false
  }
}

const toggleSave = async () => {
  if (!apiPostId.value) {
    isSaved.value = !isSaved.value
    toast.success(isSaved.value ? 'Post saved' : 'Post removed from saved')
    return
  }

  if (!authStore.authToken || !authStore.userId) {
    toast.error('Sign in required', {
      description: 'Please sign in again before saving posts.',
    })
    return
  }

  if (isSavingPost.value) {
    return
  }

  isSavingPost.value = true

  try {
    const response = await postsService.toggleSave(
      apiPostId.value,
      { userId: authStore.userId },
      authStore.authToken,
    )
    isSaved.value = response.data.saved
    toast.success(isSaved.value ? 'Post saved' : 'Post removed from saved')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to update saved state.'
    toast.error('Save failed', { description: message })
  } finally {
    isSavingPost.value = false
  }
}

const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    toast.success('Post link copied')
  } catch {
    toast.error('Unable to copy link')
  }
}

const openShareModal = () => {
  isShareModalOpen.value = true
}

const closeShareModal = () => {
  isShareModalOpen.value = false
}

const submitShare = async () => {
  if (!post.value) {
    return
  }

  const comment = shareComment.value.trim()
  const communityContext = shareCommunity.value ? `Shared from ${shareCommunity.value}` : ''
  const text = [comment, communityContext, sharePreviewDescription.value]
    .filter(Boolean)
    .join('\n\n')
  const canNativeShare = 'share' in navigator && typeof navigator.share === 'function'

  try {
    if (canNativeShare) {
      await navigator.share({
        title: post.value.title,
        text: text || post.value.title,
        url: shareLink.value,
      })
    } else {
      await navigator.clipboard.writeText(
        [comment, post.value.title, shareLink.value].filter(Boolean).join('\n\n'),
      )
    }

    toast.success('Post shared', {
      description: canNativeShare ? 'The native share sheet has been opened.' : 'The share text has been copied.',
    })
    shareCommunity.value = ''
    shareComment.value = ''
    closeShareModal()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }

    toast.error('Unable to share', {
      description: 'Please copy the link and share it manually.',
    })
  }
}

const createCurrentUserDetailComment = (
  id: string,
  body: string,
  parentId: string | null = null,
): DetailComment => {
  const profile = currentUserCommentProfile()

  return {
    id,
    parentId,
    author: profile.name,
    authorTo: profile.to,
    avatarSrc: profile.avatarSrc,
    avatarText: getInitials(profile.name),
    tag: profile.tag,
    time: 'Just now',
    body,
    score: 0,
    isScored: false,
    isFollowing: false,
    isReplying: false,
    areRepliesOpen: false,
    replyInput: '',
    replies: [],
  }
}

const toggleCommentScore = async (comment: DetailComment | PostCommentThreadItem) => {
  if (apiPostId.value && comment.id) {
    try {
      const response = await postsService.toggleCommentReaction(
        String(comment.id),
        {
          userId: authStore.userId || undefined,
          type: 'like',
        },
        authStore.authToken,
      )
      comment.isScored = !comment.isScored
      comment.score = response.data.count
      return
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to update reaction.'
      toast.error('Reaction failed', { description: message })
      return
    }
  }

  comment.isScored = !comment.isScored
  comment.score = (comment.score ?? 0) + (comment.isScored ? 1 : -1)
}

const toggleCommentFollow = (comment: DetailComment | PostCommentThreadItem) => {
  comment.isFollowing = !comment.isFollowing
}

const toggleCommentReply = (comment: DetailComment | PostCommentThreadItem) => {
  comment.isReplying = !comment.isReplying
}

const toggleCommentReplies = (comment: DetailComment | PostCommentThreadItem) => {
  comment.areRepliesOpen = !comment.areRepliesOpen
}

const openCommentReportModal = (comment: DetailComment | PostCommentThreadItem) => {
  toast.success('Report noted', {
    description: `Thanks for reporting ${comment.author}'s comment.`,
  })
}

const submitCommentReply = async (comment: DetailComment | PostCommentThreadItem) => {
  const value = comment.replyInput.trim()

  if (!value) {
    return
  }

  if (!apiPostId.value) {
    comment.replies.unshift(createCurrentUserDetailComment(`local-reply-${Date.now()}`, value, String(comment.id)))
    comment.areRepliesOpen = true
    comment.isReplying = false
    comment.replyInput = ''
    currentComments.value += 1
    toast.success('Reply added')
    return
  }

  if (isSubmittingComment.value) {
    return
  }

  isSubmittingComment.value = true

  try {
    const response = await postsService.createComment(
      apiPostId.value,
      {
        userId: authStore.userId || undefined,
        content: value,
        parentCommentId: String(comment.id),
      },
      authStore.authToken,
    )

    comment.replies.unshift(
      createCurrentUserDetailComment(response.data.id, response.data.content, response.data.parent_comment_id),
    )
    comment.areRepliesOpen = true
    comment.isReplying = false
    comment.replyInput = ''
    currentComments.value += 1
    toast.success('Reply added')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to add reply.'
    toast.error('Reply failed', { description: message })
  } finally {
    isSubmittingComment.value = false
  }
}

const submitComment = async () => {
  const value = commentInput.value.trim()

  if (!value) {
    return
  }

  if (!apiPostId.value) {
    detailComments.value.unshift(createCurrentUserDetailComment(`local-comment-${Date.now()}`, value))
    currentComments.value += 1
    commentInput.value = ''
    toast.success('Comment added')
    return
  }

  if (isSubmittingComment.value) {
    return
  }

  isSubmittingComment.value = true

  try {
    const response = await postsService.createComment(
      apiPostId.value,
      {
        userId: authStore.userId || undefined,
        content: value,
        parentCommentId: null,
      },
      authStore.authToken,
    )

    detailComments.value.unshift(
      createCurrentUserDetailComment(response.data.id, response.data.content, response.data.parent_comment_id),
    )
    currentComments.value += 1
    commentInput.value = ''
    toast.success('Comment added')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to add comment.'
    toast.error('Comment failed', { description: message })
  } finally {
    isSubmittingComment.value = false
  }
}

const submitAnswer = async () => {
  const value = answerInput.value.trim()

  if (!value) {
    return
  }

  if (post.value?.type === 'question' && apiPostId.value) {
    if (isSubmittingAnswer.value) {
      return
    }

    isSubmittingAnswer.value = true

    try {
      const response = await questionsService.createAnswer(
        apiPostId.value,
        {
          content: value,
          parentAnswerId: null,
        },
        authStore.authToken,
      )

      answerItems.value.unshift({
        ...mapAnswerItem(response.data),
        authorName: 'You',
        authorTo: authStore.userId ? `/profile/view/${authStore.userId}` : '/profile',
        authorMeta: skillPills.value.length ? skillPills.value.slice(0, 3) : ['Skills4Export member'],
        time: 'Just now',
      })
      closeAnswerModal()

      if (apiPost.value?.type === 'question') {
        apiPost.value = {
          ...apiPost.value,
          answers: apiPost.value.answers + 1,
        }
      }

      toast.success('Answer posted')
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to post answer.'
      toast.error('Answer failed', { description: message })
    } finally {
      isSubmittingAnswer.value = false
    }
    return
  }

  answerItems.value.unshift({
    id: `local-answer-${Date.now()}`,
    authorName: 'You',
    authorTo: authStore.userId ? `/profile/view/${authStore.userId}` : '/profile',
    authorMeta: skillPills.value.length ? skillPills.value.slice(0, 3) : ['Skills4Export member'],
    time: 'Just now',
    content: value,
    score: 0,
  })
  closeAnswerModal()
  toast.success('Answer posted')
}
</script>

<template>
  <section
    v-if="isLoadingPost"
    class="space-y-4"
    aria-label="Loading post details"
  >
    <div class="flex animate-pulse flex-wrap items-center gap-2 px-1">
      <div class="h-3 w-12 rounded-full bg-[var(--surface-muted)]" />
      <div class="h-3 w-2 rounded-full bg-[var(--surface-muted)]" />
      <div class="h-3 w-24 rounded-full bg-[var(--surface-muted)]" />
    </div>

    <article class="overflow-hidden rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
      <div class="space-y-5 border-b border-[color:var(--border-soft)] p-4 sm:p-5">
        <div class="flex animate-pulse flex-col gap-4 sm:flex-row sm:items-start">
          <div class="h-14 w-14 shrink-0 rounded-full bg-[var(--surface-muted)]" />
          <div class="min-w-0 flex-1 space-y-3">
            <div class="flex flex-wrap gap-2">
              <div class="h-3 w-28 rounded-full bg-[var(--surface-muted)]" />
              <div class="h-3 w-20 rounded-full bg-[var(--surface-muted)]" />
              <div class="h-5 w-20 rounded-full bg-[var(--surface-muted)]" />
            </div>
            <div class="h-7 w-4/5 rounded-full bg-[var(--surface-muted)]" />
            <div class="h-4 w-3/5 rounded-full bg-[var(--surface-muted)]" />
            <div class="flex flex-wrap gap-2">
              <div class="h-6 w-20 rounded-full bg-[var(--surface-muted)]" />
              <div class="h-6 w-24 rounded-full bg-[var(--surface-muted)]" />
              <div class="h-6 w-16 rounded-full bg-[var(--surface-muted)]" />
            </div>
          </div>
        </div>

        <div class="flex animate-pulse flex-wrap gap-2">
          <div class="h-9 w-24 rounded-[0.8rem] bg-[var(--surface-muted)]" />
          <div class="h-9 w-24 rounded-[0.8rem] bg-[var(--surface-muted)]" />
          <div class="h-9 w-20 rounded-[0.8rem] bg-[var(--surface-muted)]" />
          <div class="h-9 w-20 rounded-[0.8rem] bg-[var(--surface-muted)]" />
        </div>
      </div>

      <div class="space-y-6 p-4 sm:p-5">
        <div class="animate-pulse space-y-3">
          <div class="h-4 w-full rounded-full bg-[var(--surface-muted)]" />
          <div class="h-4 w-11/12 rounded-full bg-[var(--surface-muted)]" />
          <div class="h-4 w-2/3 rounded-full bg-[var(--surface-muted)]" />
          <div class="h-64 w-full rounded-[0.9rem] bg-[var(--surface-muted)]" />
        </div>

        <section v-if="!isQuestionRoute" class="space-y-3 border-t border-[color:var(--border-soft)] pt-5">
          <div class="flex animate-pulse items-center justify-between gap-3">
            <div class="h-5 w-32 rounded-full bg-[var(--surface-muted)]" />
            <div class="h-3 w-16 rounded-full bg-[var(--surface-muted)]" />
          </div>
          <div class="flex animate-pulse flex-col gap-2 sm:flex-row">
            <div class="h-10 flex-1 rounded-[0.8rem] bg-[var(--surface-muted)]" />
            <div class="h-10 w-24 rounded-[0.8rem] bg-[var(--surface-muted)]" />
          </div>
          <div class="space-y-2">
            <div
              v-for="item in 3"
              :key="item"
              class="animate-pulse rounded-[0.85rem] bg-[var(--surface-secondary)] p-3"
            >
              <div class="flex gap-2">
                <div class="h-3 w-24 rounded-full bg-[var(--surface-muted)]" />
                <div class="h-3 w-16 rounded-full bg-[var(--surface-muted)]" />
              </div>
              <div class="mt-3 h-3 w-full rounded-full bg-[var(--surface-muted)]" />
              <div class="mt-2 h-3 w-3/4 rounded-full bg-[var(--surface-muted)]" />
            </div>
          </div>
        </section>
      </div>
    </article>
  </section>

  <section v-if="post" class="space-y-4">
    <div
      v-if="postError"
      class="rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-soft)]"
    >
      {{ postError }}
    </div>

    <div class="flex flex-wrap items-center gap-2 px-1 text-[0.82rem] text-[var(--text-secondary)]">
      <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
      <span>/</span>
      <span class="font-medium text-[var(--accent-strong)]">Post Details</span>
    </div>

    <article class="overflow-hidden rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
      <div class="space-y-5 border-b border-[color:var(--border-soft)] p-4 sm:p-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
          <RouterLink
            v-if="author"
            :to="author.to"
            class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--accent)] text-sm font-bold text-white sm:h-12 sm:w-12"
          >
            <img
              v-if="author.avatarSrc"
              :src="author.avatarSrc"
              :alt="author.name"
              class="h-full w-full object-cover"
            />
            <span v-else>{{ author.avatarText }}</span>
          </RouterLink>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 text-[0.82rem] text-[var(--text-secondary)]">
              <RouterLink
                v-if="author"
                :to="author.to"
                class="text-[1.08rem] font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)] sm:text-[1.16rem]"
              >
                {{ author.name }}
              </RouterLink>
              <span>{{ post.time }}</span>
              <template v-if="skillPills.length">
                <span class="text-[var(--text-tertiary)]">-</span>
                <span
                  v-for="pill in skillPills"
                  :key="pill"
                  class="inline-flex max-w-[9rem] truncate rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-[0.62rem] font-medium leading-4 text-[var(--text-secondary)]"
                >
                  {{ pill }}
                </span>
              </template>
            </div>

            <h1 class="mt-2 text-[1.45rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.9rem]">
              {{ post.title }}
            </h1>
          </div>
        </div>

        <div v-if="post.type === 'question'" class="flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex h-10 items-center gap-2 rounded-xl border border-[color:var(--accent)] px-4 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--accent-soft)]"
            @click="openAnswerModal"
          >
            <BookOpen class="h-4 w-4" />
            Answer
          </button>
        </div>

        <div v-else class="flex flex-wrap gap-2">
          <button
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-[0.8rem] border px-3 text-[0.82rem] font-semibold transition"
            :class="isFollowing ? 'border-[color:var(--accent)] bg-[var(--accent)] text-white' : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'"
            @click="toggleFollow"
          >
            <Check v-if="isFollowing" class="h-3.5 w-3.5" />
            {{ isFollowing ? 'Following' : 'Follow' }}
          </button>
          <button
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-[0.8rem] border px-3 text-[0.82rem] font-semibold transition"
            :class="isScored ? 'border-[color:var(--accent)] bg-[var(--accent)] text-white' : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'"
            @click="toggleScore"
          >
            <ArrowUp class="h-3.5 w-3.5" />
            {{ currentScore }} score
          </button>
          <button
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-[0.8rem] border border-[color:var(--border-soft)] px-3 text-[0.82rem] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="toggleSave"
          >
            <Bookmark class="h-3.5 w-3.5" />
            {{ isSaved ? 'Saved' : 'Save' }}
          </button>
          <button
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-[0.8rem] border border-[color:var(--border-soft)] px-3 text-[0.82rem] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="openShareModal"
          >
            <Share2 class="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </div>

      <div class="space-y-6 p-4 sm:p-5">
        <template v-if="post.type === 'question'">
          <div class="rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4">
            <p v-if="post.body" class="whitespace-pre-line text-[0.94rem] leading-8 text-[var(--text-primary)]">
              {{ post.body }}
            </p>
          </div>

          <div class="flex flex-col gap-3 border-b border-[color:var(--border-soft)] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                All Answers
              </p>
              <p class="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{{ answerItems.length }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <select
                v-model="answerSort"
                class="h-10 rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm font-semibold text-[var(--text-secondary)] outline-none"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
              <button
                type="button"
                class="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                @click="openAnswerModal"
              >
                <BookOpen class="h-4 w-4" />
                Answer
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <article
              v-for="answer in sortedAnswerItems"
              :key="answer.id"
              class="border-b border-[color:var(--border-soft)] pb-5 last:border-b-0 last:pb-0"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="flex min-w-0 items-start gap-3">
                  <RouterLink
                    :to="answer.authorTo"
                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[0.62rem] font-semibold text-[var(--text-tertiary)]"
                  >
                    200 x 200
                  </RouterLink>
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <RouterLink
                        :to="answer.authorTo"
                        class="font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
                      >
                        {{ answer.authorName }}
                      </RouterLink>
                      <span
                        v-for="item in answer.authorMeta"
                        :key="item"
                        class="text-xs font-semibold text-[var(--text-tertiary)]"
                      >
                        {{ item }}
                      </span>
                    </div>
                    <button
                      type="button"
                      class="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                    >
                      <Check class="h-3.5 w-3.5" />
                      Follow
                    </button>
                  </div>
                </div>
                <div class="text-sm text-[var(--text-secondary)] sm:text-right">
                  <p class="font-semibold text-[var(--text-primary)]">answered</p>
                  <p class="mt-1">{{ answer.time }}</p>
                </div>
              </div>

              <p class="mt-4 whitespace-pre-line text-[0.94rem] leading-8 text-[var(--text-primary)]">
                {{ answer.content }}
              </p>

              <div class="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                >
                  <ArrowUp class="h-3.5 w-3.5" />
                  {{ answer.score }} score
                </button>
                <button
                  type="button"
                  class="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                  @click="openShareModal"
                >
                  <Share2 class="h-3.5 w-3.5" />
                  Share
                </button>
                <button
                  type="button"
                  class="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                >
                  <MessageSquare class="h-3.5 w-3.5" />
                  0
                </button>
                <button
                  type="button"
                  class="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                >
                  <Bookmark class="h-3.5 w-3.5" />
                  Save
                </button>
              </div>
            </article>
          </div>
        </template>

        <template v-else>
          <p class="text-[0.94rem] leading-8 text-[var(--text-secondary)]">{{ post.description }}</p>
          <img
            :src="post.imageSrc"
            :alt="post.imageAlt || post.title"
            class="aspect-[4/5] max-h-[40rem] w-full rounded-[0.9rem] bg-[var(--surface-secondary)] object-cover sm:aspect-[1.91/1]"
          />
        </template>

        <section
          v-if="post.type !== 'question'"
          class="space-y-3 border-t border-[color:var(--border-soft)] pt-5"
        >
          <div class="flex items-center justify-between gap-3">
            <h2 class="inline-flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
              <MessageSquare class="h-4 w-4 text-[var(--accent-strong)]" />
              Comments
            </h2>
            <span class="text-[0.78rem] font-medium text-[var(--text-tertiary)]">
              {{ currentComments }} total
            </span>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row">
            <input
              v-model="commentInput"
              type="text"
              placeholder="Add a comment..."
              class="h-10 min-w-0 flex-1 rounded-[0.8rem] bg-[var(--surface-secondary)] px-3 text-[0.86rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              @keydown.enter.prevent="submitComment"
            />
            <button
              type="button"
              :disabled="isSubmittingComment || !commentInput.trim()"
              class="inline-flex h-10 items-center justify-center rounded-[0.8rem] bg-[var(--accent)] px-4 text-[0.84rem] font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
              @click="submitComment"
            >
              Comment
            </button>
          </div>

          <div v-if="isLoadingComments" class="space-y-2">
            <div
              v-for="item in 3"
              :key="item"
              class="animate-pulse rounded-[0.85rem] bg-[var(--surface-secondary)] p-3"
            >
              <div class="h-3 w-32 rounded-full bg-[var(--surface-muted)]"></div>
              <div class="mt-3 h-3 w-full rounded-full bg-[var(--surface-muted)]"></div>
              <div class="mt-2 h-3 w-3/4 rounded-full bg-[var(--surface-muted)]"></div>
            </div>
          </div>

          <div v-else-if="detailComments.length" class="space-y-2">
            <article
              v-for="comment in detailComments"
              :key="comment.id"
              class="rounded-[0.85rem] bg-[var(--surface-secondary)] p-3"
            >
              <div class="flex items-start gap-2.5">
                <RouterLink
                  :to="comment.authorTo"
                  class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-primary)] text-[0.68rem] font-semibold text-[var(--text-tertiary)]"
                >
                  <img
                    v-if="comment.avatarSrc"
                    :src="comment.avatarSrc"
                    :alt="comment.author"
                    class="h-full w-full object-cover"
                  />
                  <span v-else>{{ comment.avatarText }}</span>
                </RouterLink>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2 text-[0.78rem] text-[var(--text-secondary)]">
                    <RouterLink
                      :to="comment.authorTo"
                      class="font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
                    >
                      {{ comment.author }}
                    </RouterLink>
                    <span>{{ comment.time }}</span>
                  </div>
                  <p v-if="comment.tag" class="mt-0.5 text-[0.72rem] text-[var(--text-secondary)]">{{ comment.tag }}</p>
                  <p class="mt-1.5 text-[0.86rem] leading-6 text-[var(--text-primary)]">{{ comment.body }}</p>

                  <div class="mt-2.5 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-[0.7rem] border px-2 py-1.5 text-[0.76rem] font-medium transition"
                      :class="comment.isScored ? activeActionClass : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'"
                      @click="toggleCommentScore(comment)"
                    >
                      <ArrowUp class="h-3 w-3" />
                      {{ comment.score }} score
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-[0.7rem] border border-[color:var(--border-soft)] px-2 py-1.5 text-[0.76rem] font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                      @click="toggleCommentReply(comment)"
                    >
                      <Reply class="h-3 w-3" />
                      {{ comment.isReplying ? 'Cancel Reply' : 'Reply' }}
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-[0.7rem] border px-2 py-1.5 text-[0.76rem] font-medium transition"
                      :class="comment.isFollowing ? activeActionClass : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'"
                      @click="toggleCommentFollow(comment)"
                    >
                      <Check v-if="comment.isFollowing" class="h-3 w-3" />
                      {{ comment.isFollowing ? 'Following' : 'Follow' }}
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 rounded-[0.7rem] border border-[color:var(--border-soft)] px-2 py-1.5 text-[0.76rem] font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                      @click="openCommentReportModal(comment)"
                    >
                      <Flag class="h-3 w-3" />
                      Report
                    </button>
                  </div>

                  <div v-if="comment.isReplying" class="mt-3 flex flex-col gap-2 border-l-2 border-[color:var(--border-soft)] pl-3">
                    <textarea
                      v-model="comment.replyInput"
                      rows="3"
                      placeholder="Write your reply..."
                      class="w-full rounded-[0.7rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-[0.8rem] text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                    />
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="inline-flex items-center justify-center rounded-[0.7rem] border border-[color:var(--border-soft)] px-3 py-2 text-[0.78rem] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                        @click="toggleCommentReply(comment)"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        :disabled="isSubmittingComment || !comment.replyInput.trim()"
                        class="inline-flex items-center justify-center rounded-[0.7rem] bg-[var(--accent)] px-3 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
                        @click="submitCommentReply(comment)"
                      >
                        Reply
                      </button>
                    </div>
                  </div>

                  <div v-if="comment.replies.length" class="mt-3">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 text-[0.78rem] font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
                      @click="toggleCommentReplies(comment)"
                    >
                      <ChevronDown
                        class="h-3.5 w-3.5 transition"
                        :class="comment.areRepliesOpen ? 'rotate-180' : ''"
                      />
                      {{ comment.areRepliesOpen ? 'Hide replies' : `View ${comment.replies.length} replies` }}
                    </button>

                    <PostCommentThread
                      v-if="comment.areRepliesOpen"
                      class="mt-2"
                      :comments="comment.replies"
                      :is-submitting="isSubmittingComment"
                      @toggle-score="toggleCommentScore"
                      @toggle-reply="toggleCommentReply"
                      @submit-reply="submitCommentReply"
                    />
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div v-else class="rounded-[0.85rem] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--text-secondary)]">
            No comments yet.
          </div>
        </section>
      </div>
    </article>
  </section>

  <section v-else-if="!isLoadingPost" class="rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-soft)]">
    <h1 class="text-xl font-semibold text-[var(--text-primary)]">Post not found</h1>
    <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
      The post you are looking for is not available in this starter dataset.
    </p>
    <RouterLink
      to="/feed"
      class="mt-5 inline-flex h-10 items-center justify-center rounded-[0.8rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
    >
      Back to Feed
    </RouterLink>
  </section>

  <ResponsiveOverlay
    v-if="post?.type === 'question'"
    v-model="isAnswerModalOpen"
    label="Answer question"
    title="Answer question"
    max-width-class="sm:max-w-4xl"
    :show-header-text="false"
  >
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <RouterLink
            :to="answererProfilePath"
            class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-strong)]"
          >
            <img
              v-if="answererAvatar"
              :src="answererAvatar"
              :alt="answererName"
              class="h-full w-full object-cover"
            />
            <span v-else>{{ answererInitials }}</span>
          </RouterLink>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <RouterLink
                :to="answererProfilePath"
                class="text-base font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
              >
                {{ answererName }}
              </RouterLink>
              <span
                v-for="skill in answererSkills"
                :key="skill"
                class="text-xs font-semibold text-[var(--text-secondary)]"
              >
                {{ skill }}
              </span>
            </div>
            <h2 class="mt-3 text-xl font-semibold leading-tight text-[var(--text-primary)]">
              {{ post.title }}
            </h2>
          </div>
        </div>
      </div>

      <textarea
        v-model="answerInput"
        rows="12"
        placeholder="Your answer here..."
        class="min-h-[18rem] w-full resize-y rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-[0.95rem] leading-7 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-soft)]"
      />

      <div class="space-y-2">
        <p class="text-sm font-semibold text-[var(--text-primary)]">Images or Video</p>
        <label class="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-6 text-center text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]">
          <CloudUpload class="h-5 w-5" />
          <span>images, videos, click to upload.</span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            class="sr-only"
            @change="handleAnswerAttachmentChange"
          />
        </label>
        <div v-if="answerAttachments.length" class="flex flex-wrap gap-2">
          <span
            v-for="file in answerAttachments"
            :key="`${file.name}-${file.size}`"
            class="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]"
          >
            {{ file.name }}
          </span>
        </div>
      </div>

      <button
        type="button"
        :disabled="isSubmittingAnswer || !answerInput.trim()"
        class="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
        @click="submitAnswer"
      >
        {{ isSubmittingAnswer ? 'Replying...' : 'Reply' }}
        <ArrowUp class="h-4 w-4 rotate-45" />
      </button>

      <div class="flex justify-end border-t border-[color:var(--border-soft)] pt-4">
        <button
          type="button"
          class="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--danger)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
          @click="closeAnswerModal"
        >
          Close
        </button>
      </div>
    </div>
  </ResponsiveOverlay>

  <Teleport to="body">
    <div
      v-if="isShareModalOpen && post"
      class="fixed inset-0 z-[120] flex items-end justify-center bg-[#0c0c1b]/80 px-0 pt-4 sm:items-center sm:px-4 sm:py-5"
      @click.self="closeShareModal"
    >
      <div class="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)] sm:max-h-[92vh] sm:rounded-[1rem]">
        <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-[var(--surface-muted)] sm:hidden" />
        <div class="flex items-center justify-between border-b border-[color:var(--border-soft)] px-4 py-3 sm:px-5">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Share</h2>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            aria-label="Close share modal"
            @click="closeShareModal"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div class="space-y-4">
            <div class="space-y-2">
              <p class="text-[0.92rem] font-semibold text-[var(--text-primary)]">Share a link to this Post</p>
              <div class="flex overflow-hidden rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)]">
                <input
                  :value="shareLink"
                  readonly
                  class="h-10 min-w-0 flex-1 bg-[var(--surface-secondary)] px-3 text-[0.86rem] text-[var(--text-primary)] outline-none"
                />
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 border-l border-[color:var(--border-soft)] px-3 text-[0.84rem] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                  @click="copyShareLink"
                >
                  <Copy class="h-4 w-4" />
                  Copy
                </button>
              </div>
            </div>

            <div class="space-y-2 border-t border-[color:var(--border-soft)] pt-4">
              <p class="text-[0.92rem] font-semibold text-[var(--text-primary)]">Share within a community</p>
              <select
                v-model="shareCommunity"
                class="h-10 w-full rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 text-[0.86rem] text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
              >
                <option value="">Select a community</option>
                <option value="Design Community">Design Community</option>
                <option value="Tech Careers">Tech Careers</option>
                <option value="Opportunities Hub">Opportunities Hub</option>
                <option value="General Community">General Community</option>
              </select>
              <p class="text-xs leading-5 text-[var(--text-tertiary)]">
                This adds community context to the shared link.
              </p>
            </div>

            <div class="space-y-2">
              <textarea
                v-model="shareComment"
                rows="3"
                placeholder="Make comment here..."
                class="w-full rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 py-2.5 text-[0.86rem] text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
              />
            </div>

            <div class="rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-3">
              <p class="text-base font-semibold leading-tight text-[var(--text-primary)]">
                {{ post.title }}
              </p>
              <p class="mt-2 text-[0.86rem] leading-6 text-[var(--text-secondary)]">
                {{ sharePreviewDescription }}
              </p>
              <div class="mt-2 flex items-center gap-2 text-[0.84rem] text-[var(--text-secondary)]">
                <span class="font-semibold text-[var(--text-primary)]">{{ sharePreviewAuthor }}</span>
                <span>{{ post.time }}</span>
              </div>
              <img
                v-if="sharePreviewImageSrc"
                :src="sharePreviewImageSrc"
                :alt="sharePreviewImageAlt"
                class="mt-3 aspect-[4/5] w-full rounded-[0.8rem] bg-[var(--surface-primary)] object-cover sm:aspect-[1.91/1]"
              />
            </div>
          </div>
        </div>

        <div class="shrink-0 border-t border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 sm:px-5">
          <div class="flex justify-end">
            <button
              type="button"
              class="inline-flex min-w-[7rem] items-center justify-center gap-1.5 rounded-[0.8rem] bg-[var(--accent)] px-4 py-2.5 text-[0.86rem] font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              @click="submitShare"
            >
              <span>Share</span>
              <ArrowUp class="h-4 w-4 rotate-45" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
