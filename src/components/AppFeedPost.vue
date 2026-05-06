<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  ArrowUp,
  Bookmark,
  Check,
  ChevronDown,
  Users,
  Copy,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Reply,
  Share2,
  X,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { FeedPost } from '@/data/feedPosts'
import { getSeededPublicProfile } from '@/data/publicProfiles'
import { ApiError } from '@/lib/api'
import PostCommentThread from '@/components/PostCommentThread.vue'
import type { PostCommentThreadItem } from '@/components/PostCommentThread.vue'
import { postsService, type PostCommentRecord } from '@/services/posts'
import { usersService, type MyProfileData } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
type PostComment = {
  id: number | string
  parentId?: string | null
  author: string
  authorTo: string
  avatarSrc: string | null
  avatarText: string
  time: string
  tag: string
  body: string
  score: number
  isScored: boolean
  isFollowing: boolean
  isReplying: boolean
  areRepliesOpen: boolean
  replyInput: string
  replies: PostComment[]
}

const props = defineProps<{
  post: FeedPost
}>()

const authStore = useAuthStore()
const isFollowing = ref(props.post.isFollowing ?? false)
const isSaved = ref(false)
const isScored = ref(false)
const currentScore = ref('score' in props.post ? props.post.score : 0)
const isCommentsOpen = ref(false)
const isShareModalOpen = ref(false)
const isReportModalOpen = ref(false)
const isPostMenuOpen = ref(false)
const commentInput = ref('')
const visibleCommentCount = ref(3)
const shareCommunity = ref('')
const shareComment = ref('')
const selectedReportReason = ref('')
const reportTargetLabel = ref('this post')
const isSavingPost = ref(false)
const isReactingToPost = ref(false)
const isSubmittingComment = ref(false)
const isSubmittingReport = ref(false)
const isLoadingComments = ref(false)
const hasLoadedComments = ref(false)
const followLabel = computed(() => (isFollowing.value ? 'Following' : 'Follow'))
const activeActionClass =
  'border-[color:var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] hover:text-white'
const apiPostId = computed(() => props.post.apiId)
const detailPath = computed(() =>
  props.post.type === 'question' ? `/questions/${props.post.slug}` : `/posts/${props.post.slug}`,
)
const shareLink = computed(() => {
  const path = detailPath.value
  return typeof window === 'undefined' ? path : new URL(path, window.location.origin).toString()
})
const sharePreviewAuthor = computed(() =>
  props.post.type === 'question' ? props.post.authorName : props.post.author.name,
)
const sharePreviewDescription = computed(() =>
  'description' in props.post ? props.post.description : '',
)
const sharePreviewImageSrc = computed(() => ('imageSrc' in props.post ? props.post.imageSrc : ''))
const sharePreviewImageAlt = computed(() =>
  'imageAlt' in props.post ? props.post.imageAlt || props.post.title : props.post.title,
)
const reportReasons = [
  'Misinformation',
  'Spam',
  'Threats/Violence',
  'Graphic content',
  'Sexual content',
  'Harassment and Bullying',
  'Illegal activities',
  'Sensitive and personal information',
  'Hate speech',
  'Suicide and Self-Harm',
  'Minor abuse',
  'Prohibited transactions',
  'Scam',
  'Copyright and Intellectual Property',
  'Invasion of privacy',
]
const reportReasonDescriptions: Record<string, string> = {
  Misinformation: 'Do not post misleading or false information that may cause harm or confusion.',
  Spam: 'Do not flood the community with repetitive, irrelevant, or deceptive promotional content.',
  'Threats/Violence': 'Do not share threats or encourage physical harm, violence, or intimidation.',
  'Graphic content': 'Do not post disturbing or excessively graphic media without proper context and safeguards.',
  'Sexual content': 'Do not post explicit sexual content or exploitative material.',
  'Harassment and Bullying': 'Do not target others with abuse, intimidation, humiliation, or repeated harassment.',
  'Illegal activities': 'Do not promote or coordinate unlawful acts, fraud, or criminal behavior.',
  'Sensitive and personal information': 'Do not expose private details such as addresses, phone numbers, or identity documents.',
  'Hate speech': 'Do not attack or dehumanize people based on identity, background, or protected characteristics.',
  'Suicide and Self-Harm': 'Do not post content that promotes or glorifies suicide or self-harm.',
  'Minor abuse': 'Do not post content that exploits, endangers, or sexualizes minors in any way.',
  'Prohibited transactions': 'Do not offer or request restricted goods, services, or unsafe financial transactions.',
  Scam: 'Do not impersonate, deceive, or manipulate users for money, data, or attention.',
  'Copyright and Intellectual Property': 'Do not share content that clearly violates copyright, trademark, or ownership rights.',
  'Invasion of privacy': 'Do not publish private conversations, images, or recordings without consent.',
}

const commentList = ref<PostComment[]>([])
const currentComments = ref('comments' in props.post ? props.post.comments : 0)
const visibleComments = computed(() => commentList.value.slice(0, visibleCommentCount.value))
const hiddenCommentCount = computed(() =>
  Math.max(commentList.value.length - visibleCommentCount.value, 0),
)

const getPublicProfileIdFromRoute = (routeTarget: string) => {
  const match = routeTarget.match(/\/profile\/view\/([^/?#]+)/)
  return match?.[1] ?? ''
}

const authorRoute = computed(() =>
  props.post.type === 'question' ? props.post.authorTo : props.post.author.to,
)

const authorName = computed(() =>
  props.post.type === 'question' ? props.post.authorName : props.post.author.name,
)

const authorProfileDetails = computed(() => {
  const publicProfileId = getPublicProfileIdFromRoute(authorRoute.value)
  const publicProfile = publicProfileId ? getSeededPublicProfile(publicProfileId) : null

  if (!publicProfile) {
    const tag = props.post.type === 'question' ? props.post.tag : props.post.author.tag

    return (tag || 'Skills4Export member')
      .split('|')
      .map((item: string) => item.trim())
      .filter(Boolean)
  }

  const details: string[] = []
  const jobTitle = publicProfile.experiences[0]?.title?.trim()
  const skillNames = publicProfile.skills
    .map((skill) => (skill.name || skill.skill || '').trim())
    .filter(Boolean)
    .slice(0, 3)

  if (jobTitle) {
    details.push(jobTitle)
  }

  details.push(...skillNames)

  return details
})

const authorMetaItems = computed(() => authorProfileDetails.value.slice(0, 3))

const feedPostContextDetail = computed(() => {
  if (props.post.type === 'question') {
    return props.post.communityName
  }

  return props.post.communityId ? props.post.communityName || 'Community' : ''
})

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

const mapComment = async (comment: PostCommentRecord): Promise<PostComment> => {
  const author = await resolveCommentAuthor(comment)

  return {
    id: comment.id,
    parentId: comment.parent_comment_id,
    author: author.name,
    authorTo: author.to,
    avatarSrc: author.avatarSrc,
    avatarText: getInitials(author.name),
    time: formatCommentTime(comment.created_at),
    tag: author.tag,
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

const buildCommentTree = async (comments: PostCommentRecord[]) => {
  const mapped = await Promise.all(comments.map(mapComment))
  const byId = new Map<string, PostComment>()
  const roots: PostComment[] = []

  mapped.forEach((comment) => {
    byId.set(String(comment.id), comment)
  })

  mapped.forEach((comment) => {
    if (comment.parentId && byId.has(comment.parentId)) {
      const parent = byId.get(comment.parentId)
      parent?.replies.push(comment)
      parent!.areRepliesOpen = true
      return
    }

    roots.push(comment)
  })

  return roots
}

const loadComments = async () => {
  if (!apiPostId.value || isLoadingComments.value || hasLoadedComments.value) {
    return
  }

  isLoadingComments.value = true

  try {
    const response = await postsService.listComments(apiPostId.value, authStore.authToken)
    commentList.value = await buildCommentTree(response.data)
    currentComments.value = response.total
    hasLoadedComments.value = true
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to load comments.'
    toast.error('Comments failed', { description: message })
  } finally {
    isLoadingComments.value = false
  }
}

const syncPostCounters = () => {
  currentScore.value = 'score' in props.post ? props.post.score : 0
  currentComments.value = 'comments' in props.post ? props.post.comments : 0
}

onMounted(() => {
  if (props.post.type !== 'question') {
    void loadComments()
  }
})

watch(
  () => props.post,
  () => {
    syncPostCounters()
    commentList.value = []
    hasLoadedComments.value = false

    if (props.post.type !== 'question') {
      void loadComments()
    }
  },
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

    toast.success(isSaved.value ? 'Post saved' : 'Post removed from saved', {
      description: isSaved.value
        ? 'This post is now in your saved list.'
        : 'This post has been removed from your saved list.',
    })
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

    toast.success(isSaved.value ? 'Post saved' : 'Post removed from saved', {
      description: isSaved.value
        ? 'This post is now in your saved list.'
        : 'This post has been removed from your saved list.',
    })
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to update saved state.'
    toast.error('Save failed', { description: message })
  } finally {
    isSavingPost.value = false
  }
}

const toggleComments = () => {
  isCommentsOpen.value = !isCommentsOpen.value

  if (isCommentsOpen.value) {
    visibleCommentCount.value = Math.max(visibleCommentCount.value, 3)
    void loadComments()
  }
}

const loadMoreComments = () => {
  visibleCommentCount.value = Math.min(visibleCommentCount.value + 10, commentList.value.length)
}

const submitComment = async () => {
  const value = commentInput.value.trim()

  if (!value) {
    return
  }

  if (apiPostId.value) {
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

      commentList.value.unshift({
        id: response.data.id,
        parentId: null,
        author: currentUserCommentProfile().name,
        authorTo: currentUserCommentProfile().to,
        avatarSrc: currentUserCommentProfile().avatarSrc,
        avatarText: getInitials(currentUserCommentProfile().name),
        time: 'Just now',
        tag: currentUserCommentProfile().tag,
        body: response.data.content,
        score: 0,
        isScored: false,
        isFollowing: false,
        isReplying: false,
        areRepliesOpen: false,
        replyInput: '',
        replies: [],
      })
      currentComments.value += 1
      commentInput.value = ''

      toast.success('Comment added', {
        description: 'Your comment has been added to this post.',
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to add comment.'
      toast.error('Comment failed', { description: message })
    } finally {
      isSubmittingComment.value = false
    }
    return
  }

  toast.error('Comment needs a post ID', {
    description: 'Only posts loaded from the API can receive live comments.',
  })
}

const openShareModal = () => {
  isShareModalOpen.value = true
}

const closeShareModal = () => {
  isShareModalOpen.value = false
}

const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    toast.success('Link copied', {
      description: 'The post link has been copied to your clipboard.',
    })
  } catch {
    toast.error('Unable to copy link', {
      description: 'Your browser blocked clipboard access. You can still copy the link manually.',
    })
  }
}

const submitShare = async () => {
  const comment = shareComment.value.trim()
  const communityContext = shareCommunity.value ? `Shared from ${shareCommunity.value}` : ''
  const text = [comment, communityContext, sharePreviewDescription.value]
    .filter(Boolean)
    .join('\n\n')
  const canNativeShare = 'share' in navigator && typeof navigator.share === 'function'

  try {
    if (canNativeShare) {
      await navigator.share({
        title: props.post.title,
        text: text || props.post.title,
        url: shareLink.value,
      })
    } else {
      await navigator.clipboard.writeText(
        [comment, props.post.title, shareLink.value].filter(Boolean).join('\n\n'),
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

const openReportModal = () => {
  reportTargetLabel.value = 'this post'
  selectedReportReason.value = ''
  isReportModalOpen.value = true
}

const togglePostMenu = () => {
  isPostMenuOpen.value = !isPostMenuOpen.value
}

const handleMobileSave = () => {
  toggleSave()
  isPostMenuOpen.value = false
}

const handleMobileReport = () => {
  openReportModal()
  isPostMenuOpen.value = false
}

const closeReportModal = () => {
  isReportModalOpen.value = false
}

const submitReport = async () => {
  if (!selectedReportReason.value) {
    toast.error('Select a report reason first.')
    return
  }

  if (!apiPostId.value || reportTargetLabel.value !== 'this post') {
    toast.error('Report needs an endpoint', {
      description: 'Send me the comment report endpoint and I will wire this action live.',
    })
    return
  }

  if (isSubmittingReport.value) {
    return
  }

  isSubmittingReport.value = true

  try {
    await postsService.reportPost(
      apiPostId.value,
      {
        userId: authStore.userId || undefined,
        reason: selectedReportReason.value,
        details: reportReasonDescriptions[selectedReportReason.value] ?? '',
      },
      authStore.authToken,
    )

    toast.success('Report submitted', {
      description: `Thanks for reporting ${reportTargetLabel.value} under ${selectedReportReason.value}.`,
    })
    closeReportModal()
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to submit report.'
    toast.error('Report failed', { description: message })
  } finally {
    isSubmittingReport.value = false
  }
}

const toggleCommentScore = async (comment: PostCommentThreadItem) => {
  if (typeof comment.id === 'string') {
    try {
      const response = await postsService.toggleCommentReaction(
        comment.id,
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

const toggleCommentFollow = (comment: PostComment) => {
  comment.isFollowing = !comment.isFollowing
}

const openCommentReportModal = (comment: PostComment) => {
  reportTargetLabel.value = `${comment.author}'s comment`
  selectedReportReason.value = ''
  isReportModalOpen.value = true
}

const toggleCommentReply = (comment: PostCommentThreadItem) => {
  comment.isReplying = !comment.isReplying
}

const toggleCommentReplies = (comment: PostComment) => {
  comment.areRepliesOpen = !comment.areRepliesOpen
}

const submitCommentReply = async (comment: PostCommentThreadItem) => {
  const value = comment.replyInput.trim()

  if (!value) {
    return
  }

  if (!apiPostId.value || typeof comment.id !== 'string') {
    toast.error('Reply needs a saved comment', {
      description: 'Only comments loaded from the API can receive live replies.',
    })
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
        parentCommentId: comment.id,
      },
      authStore.authToken,
    )

    comment.replies.unshift({
      id: response.data.id,
      parentId: response.data.parent_comment_id,
      author: currentUserCommentProfile().name,
      authorTo: currentUserCommentProfile().to,
      avatarSrc: currentUserCommentProfile().avatarSrc,
      avatarText: getInitials(currentUserCommentProfile().name),
      time: 'Just now',
      tag: currentUserCommentProfile().tag,
      body: response.data.content,
      score: 0,
      isScored: false,
      isFollowing: false,
      isReplying: false,
      areRepliesOpen: false,
      replyInput: '',
      replies: [],
    })
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
</script>

<template>
  <article
    class="rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-elevated)] sm:p-4"
  >
    <template v-if="post.type === 'question'">
      <div class="min-w-0">
        <div>
          <div class="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span class="font-semibold text-[var(--accent-strong)]">Q.</span>
            <Users class="h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
            <span class="truncate">{{ post.communityName }}</span>
          </div>
          <RouterLink
            :to="detailPath"
            class="mt-3 block text-[1.22rem] font-semibold leading-tight text-[var(--text-primary)] transition hover:text-[var(--accent-strong)] sm:text-[1.4rem] lg:text-[1.55rem]"
          >
            {{ post.title }}
          </RouterLink>
          <div class="mt-2.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[0.78rem] leading-5 text-[var(--text-secondary)]">
            <RouterLink :to="authorRoute" class="shrink-0 font-semibold text-[var(--accent-strong)]">
              {{ authorName }}
            </RouterLink>
            <span class="text-[var(--text-tertiary)]">-</span>
            <span class="shrink-0">{{ post.time }}</span>
            <span v-if="authorMetaItems.length" class="text-[var(--text-tertiary)]">-</span>
            <span
              v-for="item in authorMetaItems"
              :key="item"
              class="inline-flex max-w-[9rem] truncate rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-[0.62rem] font-medium leading-4 text-[var(--text-secondary)]"
            >
              {{ item }}
            </span>
          </div>
          <p v-if="post.body" class="mt-3 line-clamp-2 text-[0.9rem] leading-7 text-[var(--text-secondary)]">
            {{ post.body }}
          </p>
        </div>
      </div>

      <div class="mt-5 flex flex-wrap gap-1.5 sm:gap-2">
        <RouterLink
          :to="detailPath"
          class="inline-flex h-9 items-center rounded-[1rem] border border-[color:var(--border-soft)] px-3 text-[0.9rem] font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] sm:h-8.5 sm:px-3.5 sm:text-[0.84rem]"
        >
          View details
        </RouterLink>
        <button
          type="button"
          class="inline-flex h-9 items-center rounded-[1rem] border px-3 text-[0.9rem] font-medium transition sm:h-8.5 sm:px-3.5 sm:text-[0.84rem]"
          :class="
            isFollowing
              ? activeActionClass
              : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
          "
          @click="toggleFollow"
        >
          {{ followLabel }}
        </button>
        <span
          class="inline-flex h-9 items-center rounded-[1rem] border border-[color:var(--border-soft)] px-3 text-[0.9rem] font-medium text-[var(--text-secondary)] sm:h-8.5 sm:px-3.5 sm:text-[0.84rem]"
        >
          {{ post.answers }} Answers
        </span>
      </div>
    </template>

    <template v-else>
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--border-soft)] text-sm font-semibold text-[var(--accent-strong)] sm:h-12 sm:w-12"
          >
            <img
              v-if="post.author.avatarSrc"
              :src="post.author.avatarSrc"
              :alt="post.author.name"
              class="h-full w-full rounded-full object-cover"
            />
            <span v-else>{{ post.author.avatarText }}</span>
          </span>

          <div class="min-w-0 flex-1">
            <div class="min-w-0">
              <div class="flex items-start gap-2">
                <div class="min-w-0 flex flex-1 flex-wrap items-center gap-1.5">
                  <RouterLink
                    :to="authorRoute"
                    class="shrink-0 text-[1.08rem] font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)] sm:text-[1.16rem]"
                  >
                    {{ authorName }}
                  </RouterLink>
                  <span
                    v-for="item in authorMetaItems"
                    :key="item"
                    class="inline-flex max-w-[8.5rem] truncate rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-[0.61rem] font-medium leading-4 text-[var(--text-secondary)]"
                  >
                    {{ item }}
                  </span>
                </div>

                <div class="relative ml-auto sm:hidden">
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                    aria-label="More actions"
                    @click="togglePostMenu"
                  >
                    <MoreHorizontal class="h-4 w-4" />
                  </button>

                  <div
                    v-if="isPostMenuOpen"
                    class="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[9rem] rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-2 shadow-[var(--shadow-elevated)]"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--accent-strong)]"
                      @click="handleMobileSave"
                    >
                      <Bookmark class="h-4 w-4" />
                      {{ isSaved ? 'Saved' : 'Save' }}
                    </button>
                    <button
                      type="button"
                      class="mt-1 flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--accent-strong)]"
                      @click="handleMobileReport"
                    >
                      <Flag class="h-4 w-4" />
                      Report
                    </button>
                  </div>
                </div>
              </div>

              <div class="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <div class="flex min-w-0 flex-1 items-center gap-2">
                  <button
                    type="button"
                    class="inline-flex h-9 shrink-0 items-center rounded-[1rem] border px-3 text-[0.9rem] font-medium transition sm:h-8.5 sm:px-3.5 sm:text-[0.84rem]"
                    :class="
                      isFollowing
                        ? activeActionClass
                        : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
                    "
                    @click="toggleFollow"
                  >
                    {{ followLabel }}
                  </button>
                  <span class="truncate">{{ post.time }}</span>
                  <span v-if="feedPostContextDetail" class="hidden truncate text-[0.78rem] text-[var(--text-tertiary)] sm:inline">
                    {{ feedPostContextDetail }}
                  </span>
                </div>

                <div class="ml-auto flex items-center gap-2 self-start">
                  <RouterLink
                    v-if="post.type === 'community'"
                    :to="detailPath"
                    class="inline-flex h-9 shrink-0 items-center justify-center rounded-[1rem] border border-[color:var(--border-soft)] px-3 text-[0.9rem] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] sm:h-8.5 sm:px-3.5 sm:text-[0.84rem]"
                  >
                    View post
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="min-w-0">
          <RouterLink
            :to="detailPath"
            class="block text-[1.05rem] font-semibold leading-tight text-[var(--text-primary)] transition hover:text-[var(--accent-strong)] sm:text-[1.18rem] lg:text-[1.28rem]"
          >
            {{ post.title }}
          </RouterLink>
          <p class="feed-post-description mt-2 text-[0.82rem] leading-6 text-[var(--text-secondary)] sm:text-[0.9rem] sm:leading-7">
            {{ post.description }}
          </p>

          <img
            v-if="post.imageSrc"
            :src="post.imageSrc"
            :alt="post.imageAlt || post.title"
            class="-mx-3 mt-4 aspect-[4/5] w-[calc(100%+1.5rem)] max-w-none bg-[var(--surface-secondary)] object-cover sm:-mx-4 sm:aspect-[1.91/1] sm:w-[calc(100%+2rem)]"
          />

          <div class="mt-4 flex flex-wrap gap-1.5">
            <button
              type="button"
              class="inline-flex h-8 items-center gap-1 rounded-[0.8rem] border px-2 text-[0.78rem] font-medium transition sm:h-8 sm:px-2.5"
              :class="
                isScored
                  ? activeActionClass
                  : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
              "
              @click="toggleScore"
            >
              <ArrowUp class="h-3 w-3" />
              {{ currentScore }} score
            </button>
            <button
              type="button"
              class="inline-flex h-8 items-center gap-1 rounded-[0.8rem] border border-[color:var(--border-soft)] px-2 text-[0.78rem] font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] sm:h-8 sm:px-2.5"
              @click="openShareModal"
            >
              <Share2 class="h-3 w-3" />
              Share
            </button>
            <button
              type="button"
              class="inline-flex h-8 items-center gap-1 rounded-[0.8rem] border border-[color:var(--border-soft)] px-2 text-[0.78rem] font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] sm:h-8 sm:px-2.5"
              @click="toggleComments"
            >
              <MessageSquare class="h-3 w-3" />
              {{ currentComments }} {{ currentComments === 1 ? 'comment' : 'comments' }}
              <ChevronDown
                class="h-3 w-3 transition"
                :class="isCommentsOpen ? 'rotate-180' : ''"
              />
            </button>
            <button
              type="button"
              class="hidden h-8 items-center gap-1 rounded-[0.8rem] border border-[color:var(--border-soft)] px-2 text-[0.78rem] font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] sm:inline-flex sm:h-8 sm:px-2.5"
              @click="handleMobileReport"
            >
              <Flag class="h-3 w-3" />
              Report
            </button>
            <button
              type="button"
              class="hidden h-8 items-center gap-1 rounded-[0.8rem] border px-2 text-[0.78rem] font-medium transition sm:inline-flex sm:h-8 sm:px-2.5"
              :class="
                isSaved
                  ? activeActionClass
                  : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
              "
              @click="handleMobileSave"
            >
              <Bookmark class="h-3 w-3" />
              {{ isSaved ? 'Saved' : 'Save' }}
            </button>
          </div>

          <section
            v-if="isCommentsOpen"
            class="mt-4 overflow-hidden rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)]"
          >
            <div class="flex flex-col gap-2 border-b border-[color:var(--border-soft)] p-3 sm:flex-row">
              <input
                v-model="commentInput"
                type="text"
                placeholder="Comment..."
                class="h-9 min-w-0 flex-1 rounded-[0.7rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-[0.8rem] text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                @keydown.enter.prevent="submitComment"
              />
              <button
                type="button"
                class="inline-flex h-9 items-center justify-center rounded-[0.7rem] bg-[var(--accent)] px-3 text-[0.8rem] font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                @click="submitComment"
              >
                Add Comment
              </button>
            </div>

            <div class="max-h-[26rem] overflow-y-auto">
              <div
                v-if="isLoadingComments"
                class="space-y-3 p-3"
              >
                <div
                  v-for="item in 3"
                  :key="item"
                  class="flex animate-pulse items-start gap-2.5"
                >
                  <div class="h-8 w-8 rounded-full bg-[var(--surface-muted)]" />
                  <div class="flex-1 space-y-2">
                    <div class="h-3 w-32 rounded-full bg-[var(--surface-muted)]" />
                    <div class="h-3 w-full rounded-full bg-[var(--surface-muted)]" />
                    <div class="h-3 w-2/3 rounded-full bg-[var(--surface-muted)]" />
                  </div>
                </div>
              </div>

              <p
                v-else-if="hasLoadedComments && !commentList.length"
                class="p-4 text-center text-[0.82rem] text-[var(--text-secondary)]"
              >
                No comments yet.
              </p>

              <div
                v-else
                class="divide-y divide-[color:var(--border-soft)]"
              >
                <article
                  v-for="comment in visibleComments"
                  :key="comment.id"
                  class="p-3"
                >
                  <div class="flex items-start gap-2.5">
                    <RouterLink
                      :to="comment.authorTo"
                      class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)] text-[0.68rem] font-semibold text-[var(--text-tertiary)]"
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
                      <div class="flex flex-wrap items-center gap-1.5 text-[0.78rem] text-[var(--text-secondary)]">
                        <RouterLink
                          :to="comment.authorTo"
                          class="font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
                        >
                          {{ comment.author }}
                        </RouterLink>
                        <span>{{ comment.time }}</span>
                      </div>
                      <p class="mt-0.5 text-[0.72rem] text-[var(--text-secondary)] sm:text-[0.76rem]">{{ comment.tag }}</p>
                      <p class="mt-1.5 text-[0.82rem] leading-6 text-[var(--text-primary)]">
                        {{ comment.body }}
                      </p>

                      <div class="mt-2.5 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          class="inline-flex items-center gap-1 rounded-[0.7rem] border px-2 py-1.5 text-[0.76rem] font-medium transition"
                          :class="
                            comment.isScored
                              ? activeActionClass
                              : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
                          "
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
                          :class="
                            comment.isFollowing
                              ? activeActionClass
                              : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
                          "
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

                        <div
                          v-if="comment.areRepliesOpen"
                          class="mt-2 space-y-2 border-l-2 border-[color:var(--border-soft)] pl-3"
                        >
                          <article
                            v-for="reply in comment.replies"
                            :key="reply.id"
                            class="py-1.5"
                          >
                            <div class="flex flex-wrap items-center gap-1.5 text-[0.76rem] text-[var(--text-secondary)]">
                              <span class="font-semibold text-[var(--text-primary)]">{{ reply.author }}</span>
                              <span>{{ reply.time }}</span>
                            </div>
                            <p class="mt-1.5 text-[0.8rem] leading-6 text-[var(--text-primary)]">{{ reply.body }}</p>
                            <div class="mt-2 flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                class="inline-flex items-center gap-1 rounded-[0.7rem] border px-2 py-1.5 text-[0.74rem] font-medium transition"
                                :class="
                                  reply.isScored
                                    ? activeActionClass
                                    : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
                                "
                                @click="toggleCommentScore(reply)"
                              >
                                <ArrowUp class="h-3 w-3" />
                                {{ reply.score }} score
                              </button>
                              <button
                                type="button"
                                class="inline-flex items-center gap-1 rounded-[0.7rem] border border-[color:var(--border-soft)] px-2 py-1.5 text-[0.74rem] font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                                @click="toggleCommentReply(reply)"
                              >
                                <Reply class="h-3 w-3" />
                                {{ reply.isReplying ? 'Cancel Reply' : 'Reply' }}
                              </button>
                            </div>

                            <div v-if="reply.isReplying" class="mt-2 flex flex-col gap-2 border-l-2 border-[color:var(--border-soft)] pl-3">
                              <textarea
                                v-model="reply.replyInput"
                                rows="3"
                                placeholder="Write your reply..."
                                class="w-full rounded-[0.7rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-[0.8rem] text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                              />
                              <div class="flex justify-end gap-2">
                                <button
                                  type="button"
                                  class="inline-flex items-center justify-center rounded-[0.7rem] border border-[color:var(--border-soft)] px-3 py-2 text-[0.78rem] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                                  @click="toggleCommentReply(reply)"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  :disabled="isSubmittingComment || !reply.replyInput.trim()"
                                  class="inline-flex items-center justify-center rounded-[0.7rem] bg-[var(--accent)] px-3 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
                                  @click="submitCommentReply(reply)"
                                >
                                  Reply
                                </button>
                              </div>
                            </div>

                            <PostCommentThread
                              v-if="reply.replies.length"
                              class="mt-2"
                              :comments="reply.replies"
                              :is-submitting="isSubmittingComment"
                              @toggle-score="toggleCommentScore"
                              @toggle-reply="toggleCommentReply"
                              @submit-reply="submitCommentReply"
                            />
                          </article>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              <button
                v-if="hiddenCommentCount"
                type="button"
                class="inline-flex w-full items-center justify-center border-t border-[color:var(--border-soft)] px-3 py-2.5 text-[0.8rem] font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--accent-strong)]"
                @click="loadMoreComments"
              >
                Load more comments ({{ hiddenCommentCount }} left)
              </button>
            </div>
          </section>
        </div>
      </div>
    </template>
  </article>

  <Teleport to="body">
    <div
      v-if="isShareModalOpen"
      class="fixed inset-0 z-[120] flex items-end justify-center bg-[#0c0c1b]/80 px-0 pt-4 sm:items-center sm:px-4 sm:py-5"
      @click.self="closeShareModal"
    >
      <div
        class="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)] sm:max-h-[92vh] sm:rounded-[1rem]"
      >
        <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-[var(--surface-muted)] sm:hidden" />
        <div class="flex items-center justify-between border-b border-[color:var(--border-soft)] px-4 py-3 sm:px-5">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Share</h2>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
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

    <div
      v-if="isReportModalOpen"
      class="fixed inset-0 z-[120] flex items-end justify-center bg-[#0c0c1b]/80 px-0 pt-4 sm:items-center sm:px-4 sm:py-5"
      @click.self="closeReportModal"
    >
      <div
        class="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)] sm:max-h-[92vh] sm:rounded-[1rem]"
      >
        <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-[var(--surface-muted)] sm:hidden" />
        <div class="flex items-center justify-between border-b border-[color:var(--border-soft)] px-4 py-3 sm:px-5">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Submit A Report</h2>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="closeReportModal"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <p class="max-w-3xl text-[0.92rem] leading-6 text-[var(--text-primary)]">
            Thank you for reporting to us posts that break the rules. Let us know which of the rules applies.
          </p>

          <button
            type="button"
            class="mt-3 inline-flex items-center rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 py-2 text-[0.84rem] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
          >
            Review community rules
          </button>

          <div class="mt-5 flex flex-wrap gap-2">
            <button
              v-for="reason in reportReasons"
              :key="reason"
              type="button"
              class="inline-flex items-center rounded-[0.75rem] border px-3 py-2 text-[0.82rem] font-semibold transition"
              :class="
                selectedReportReason === reason
                  ? 'border-[var(--warning)] bg-[#fef3c7] text-[var(--text-primary)]'
                  : 'border-[color:var(--border-soft)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
              "
              @click="selectedReportReason = reason"
            >
              {{ reason }}
            </button>
          </div>

          <div
            v-if="selectedReportReason"
            class="mt-5 rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
          >
            <div class="flex items-center gap-2">
              <Check class="h-4 w-4 text-[var(--accent-strong)]" />
              <h3 class="text-base font-semibold text-[var(--text-primary)]">{{ selectedReportReason }}:</h3>
            </div>
            <p class="mt-2 text-[0.86rem] leading-6 text-[var(--text-secondary)]">
              {{ reportReasonDescriptions[selectedReportReason] }}
            </p>
          </div>
        </div>

        <div class="shrink-0 border-t border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 sm:px-5">
          <div class="flex justify-end">
            <button
              type="button"
              class="inline-flex min-w-[7rem] items-center justify-center rounded-[0.8rem] px-4 py-2.5 text-[0.86rem] font-semibold text-white transition"
              :class="
                selectedReportReason
                  ? 'bg-[#e23a47] hover:bg-[#c9313d]'
                  : 'cursor-not-allowed bg-[var(--text-tertiary)]'
              "
              :disabled="!selectedReportReason"
              @click="submitReport"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
