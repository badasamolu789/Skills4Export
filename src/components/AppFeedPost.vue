<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ArrowUp,
  Bookmark,
  Check,
  ChevronDown,
  CloudUpload,
  Copy,
  Edit2,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Reply,
  Share2,
  X,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useCurrentUserIdentity, getInitials, getProfileDisplayName } from '@/composables/useCurrentUserIdentity'
import type { FeedPost } from '@/data/feedPosts'
import { ApiError } from '@/lib/api'
import PostCommentThread from '@/components/PostCommentThread.vue'
import RichTextContent from '@/components/RichTextContent.vue'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import type { PostCommentThreadItem } from '@/components/PostCommentThread.vue'
import { communitiesService, type CommunityRecord } from '@/services/communities'
import { pagesService } from '@/services/pages'
import { postsService, type PostCommentRecord } from '@/services/posts'
import { questionsService } from '@/services/questions'
import { mediaService } from '@/services/media'
import { collectUserSkills, usersService, type MyProfileData } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { useSocialActionsStore } from '@/stores/socialActions'
import { getOptionalCount, getPostUserId, isVideoPostMedia, mapApiPostToFeedPost } from '@/utils/postMapper'
import { richTextToPlainText } from '@/utils/richText'
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
  expanded?: boolean
  allowEdit?: boolean
}>()

const authStore = useAuthStore()
const socialActionsStore = useSocialActionsStore()
const currentUser = useCurrentUserIdentity()
const localFollowing = ref(props.post.isFollowing ?? false)
const isSaved = ref(props.post.isSaved ?? false)
const localScored = ref(props.post.isScored ?? false)
const localScore = ref('score' in props.post ? props.post.score || 0 : 0)
const isCommentsOpen = ref(false)
const isShareModalOpen = ref(false)
const isReportModalOpen = ref(false)
const isAnswerModalOpen = ref(false)
const isPostMenuOpen = ref(false)
const failedAuthorAvatarSrc = ref('')
const postMenuRoot = ref<HTMLElement | null>(null)
const isEditModalOpen = ref(false)
const editPostTitle = ref('')
const editPostContent = ref('')
const answerInput = ref('')
const answerAttachments = ref<File[]>([])
const answerAttachmentPreviews = ref<Array<{ key: string; name: string; url: string; kind: 'image' | 'video' }>>([])
const answererProfile = ref<MyProfileData | null>(null)
const isLoadingAnswererProfile = ref(false)
const isContentExpanded = ref(false)
const commentInput = ref('')
const visibleCommentCount = ref(3)
const shareCommunity = ref('')
const shareComment = ref('')
const shareCommunities = ref<CommunityRecord[]>([])
const isLoadingShareCommunities = ref(false)
const hasLoadedShareCommunities = ref(false)
const selectedReportReason = ref('')
const reportTargetLabel = ref('this post')
const isSavingPost = ref(false)
const isReactingToPost = ref(false)
const isSubmittingAnswer = ref(false)
const isSubmittingComment = ref(false)
const isSubmittingReport = ref(false)
const isUpdatingPost = ref(false)
const isLoadingComments = ref(false)
const hasLoadedComments = ref(false)
const sharedOriginalPost = ref<FeedPost | null>(null)
const isLoadingSharedOriginal = ref(false)
const followLabel = computed(() => (isFollowing.value ? 'Following' : 'Follow'))
const activeActionClass =
  'border-[color:var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] hover:text-white'
const apiPostId = computed(() => props.post.apiId)
const detailPath = computed(() =>
  props.post.type === 'question' ? `/questions/${props.post.slug}` : `/posts/${props.post.slug}`,
)
const COMMUNITY_FOLLOWS_KEY = 'skills4export-community-follows'
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
const primaryMedia = computed(() => {
  if (props.post.type === 'question') {
    return null
  }

  const media = props.post.media?.find((item) => item.url)
  if (media) {
    return {
      url: media.url,
      isVideo: isVideoPostMedia(media),
    }
  }

  return props.post.imageSrc
    ? { url: props.post.imageSrc, isVideo: false }
    : null
})
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
const currentAnswers = ref(props.post.type === 'question' ? props.post.answers : 0)
const displayedComments = computed(() =>
  apiPostId.value
    ? socialActionsStore.getCommentCount(apiPostId.value, currentComments.value)
    : currentComments.value,
)
const displayedAnswers = computed(() =>
  apiPostId.value
    ? socialActionsStore.getAnswerCount(apiPostId.value, currentAnswers.value)
    : currentAnswers.value,
)
const visibleComments = computed(() => commentList.value.slice(0, visibleCommentCount.value))
const hiddenCommentCount = computed(() =>
  Math.max(commentList.value.length - visibleCommentCount.value, 0),
)
const answererName = computed(
  () =>
    currentUser.displayName.value ||
    answererProfile.value?.user?.name ||
    answererProfile.value?.profile?.displayName ||
    answererProfile.value?.profile?.username ||
    answererProfile.value?.user?.username ||
    'Member',
)
const answererAvatar = computed(
  () => answererProfile.value?.profile?.avatar || currentUser.avatarSrc.value || '',
)
const answererInitials = computed(() => getInitials(answererName.value))
const answererProfilePath = computed(() => currentUser.profilePath.value)
const answererSkills = computed(() => {
  const profileSkills =
    answererProfile.value?.skills
      ?.map((skill) => (skill.name || skill.skill || '').trim())
      .filter(Boolean)
      .slice(0, 3) ?? []

  if (profileSkills.length) {
    return profileSkills
  }

  return currentUser.skills.value
})

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
const authorAvatarSrc = computed(() => {
  if (props.post.type === 'question') {
    return props.post.authorAvatarSrc || ''
  }

  const source = props.post.author.avatarSrc || ''
  return source && source !== failedAuthorAvatarSrc.value ? source : ''
})
const authorUserId = computed(() => {
  if (props.post.userId) {
    return props.post.userId
  }

  return getPublicProfileIdFromRoute(authorRoute.value)
})

watch(
  () => props.post.type === 'question' ? props.post.authorAvatarSrc : props.post.author.avatarSrc,
  () => {
    failedAuthorAvatarSrc.value = ''
  },
)
const usesGlobalUserFollow = computed(() =>
  Boolean(authorUserId.value && !props.post.pageId && !(props.post.type === 'question' && props.post.communityId)),
)
const isFollowing = computed(() =>
  usesGlobalUserFollow.value
    ? socialActionsStore.followingUserIds[authorUserId.value] !== undefined
      ? socialActionsStore.isFollowingUser(authorUserId.value)
      : localFollowing.value
    : localFollowing.value,
)
const isScored = computed(() =>
  apiPostId.value
    ? socialActionsStore.scoredContentIds[apiPostId.value] !== undefined
      ? socialActionsStore.isContentScored(apiPostId.value)
      : localScored.value
    : localScored.value,
)
const currentScore = computed(() =>
  apiPostId.value
    ? socialActionsStore.getScoreCount(apiPostId.value, localScore.value)
    : localScore.value,
)
const isOwnPost = computed(() => Boolean(authStore.userId && authorUserId.value === authStore.userId))
const isCommunityQuestion = computed(() => props.post.type === 'question' && Boolean(props.post.communityId))
const showFollowAction = computed(() =>
  Boolean(!isOwnPost.value && (isCommunityQuestion.value || props.post.pageId || authorUserId.value)),
)
const canScorePost = computed(() => Boolean(!isOwnPost.value))
const canEditPost = computed(() => Boolean(props.allowEdit && isOwnPost.value && apiPostId.value && props.post.type !== 'question'))
const isSharedPost = computed(() => Boolean(props.post.originalPostId))
const contentLabel = computed(() => (props.post.type === 'question' ? 'Question' : 'Post'))
const postPlainDescription = computed(() =>
  props.post.type === 'question' ? '' : richTextToPlainText(props.post.description),
)
const isPostContentCollapsible = computed(() => {
  const text = postPlainDescription.value
  return text.length > 360 || text.split(/\r?\n/).filter((line) => line.trim()).length > 4
})
const shouldClampPostContent = computed(() =>
  Boolean(!props.expanded && isPostContentCollapsible.value && !isContentExpanded.value),
)

const getStoredCommunityFollows = () => {
  if (typeof window === 'undefined') {
    return {} as Record<string, string[]>
  }

  try {
    return JSON.parse(window.localStorage.getItem(COMMUNITY_FOLLOWS_KEY) || '{}') as Record<string, string[]>
  } catch {
    return {}
  }
}

const setStoredCommunityFollow = (communityId: string, nextValue: boolean) => {
  if (typeof window === 'undefined' || !authStore.userId) {
    return
  }

  const follows = getStoredCommunityFollows()
  const userFollows = new Set(follows[authStore.userId] ?? [])

  if (nextValue) {
    userFollows.add(communityId)
  } else {
    userFollows.delete(communityId)
  }

  follows[authStore.userId] = [...userFollows]
  window.localStorage.setItem(COMMUNITY_FOLLOWS_KEY, JSON.stringify(follows))
}

const hasStoredCommunityFollow = (communityId?: string | null) => {
  if (!communityId || !authStore.userId) {
    return false
  }

  return getStoredCommunityFollows()[authStore.userId]?.includes(communityId) ?? false
}

const authorProfileDetails = computed(() => {
  const tag = props.post.type === 'question' ? props.post.tag : props.post.author.tag

  return (tag || '')
    .split('|')
    .map((item: string) => item.trim())
    .filter((item: string) => item && item.toLowerCase() !== 'skills4export member')
    .slice(0, 3)
})

const authorMetaItems = computed(() => authorProfileDetails.value.slice(0, 3))

const feedPostContextDetail = computed(() => {
  if (props.post.type === 'question') {
    return props.post.communityName
  }

  return props.post.communityId ? props.post.communityName || '' : ''
})

const readRecord = (source: unknown, keys: string[]) => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return null
  }

  const record = source as Record<string, unknown>
  for (const key of keys) {
    const value = record[key]

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
  }

  return null
}

const readString = (source: unknown, keys: string[]) => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return ''
  }

  const record = source as Record<string, unknown>
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

const syncEditForm = () => {
  editPostTitle.value = props.post.title
  editPostContent.value = 'description' in props.post ? props.post.description : props.post.body || ''
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

const getProfileSkills = (profile?: MyProfileData | null) =>
  profile?.skills
    ?.map((skill) => (skill.name || skill.skill || '').trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' | ') || ''

const currentUserCommentProfile = () => {
  return {
    name: currentUser.displayName.value,
    to: currentUser.profilePath.value,
    avatarSrc: currentUser.avatarSrc.value || null,
    tag: currentUser.skills.value.join(' | '),
  }
}

const resolveCommentAuthor = async (comment: PostCommentRecord) => {
  if (comment.user_id && comment.user_id === authStore.userId) {
    return currentUserCommentProfile()
  }

  const embeddedUser = readRecord(comment, ['user', 'author', 'commenter'])
  const embeddedProfile =
    readRecord(comment, ['profile', 'userProfile', 'user_profile']) ??
    readRecord(embeddedUser, ['profile', 'userProfile', 'user_profile'])
  const embeddedData = {
    user: embeddedUser,
    profile: embeddedProfile,
  } as MyProfileData
  const embeddedName = getProfileDisplayName(embeddedData)

  const response = comment.user_id
    ? await usersService.getUserProfile(comment.user_id, authStore.authToken).catch(() => null)
    : null
  const profile = response?.data ?? null
  const name = getProfileDisplayName(profile) || embeddedName

  return {
    name,
    to: comment.user_id ? `/profile/view/${comment.user_id}` : '/profile',
    avatarSrc: profile?.profile?.avatar || readString(embeddedProfile, ['avatar', 'avatarUrl', 'avatar_url', 'profileImage', 'profile_image']) || null,
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
    score: getOptionalCount(
      comment.score,
      comment.reactions_count,
      comment.reaction_count,
      comment.reactionsCount,
      comment.likes_count,
      comment.likesCount,
    ),
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

const loadSharedOriginalPost = async () => {
  if (!props.post.originalPostId || isLoadingSharedOriginal.value) {
    sharedOriginalPost.value = null
    return
  }

  isLoadingSharedOriginal.value = true

  try {
    const originalResponse = await postsService.getPost(props.post.originalPostId, authStore.authToken)
    const original = originalResponse.data
    const originalUserId = getPostUserId(original)
    const [mediaResponse, authorResponse, userResponse, skillsResponse] = await Promise.all([
      postsService.listPostMedia(original.id, authStore.authToken).catch(() => null),
      originalUserId
        ? usersService.getUserProfile(originalUserId, authStore.authToken).catch(() => null)
        : Promise.resolve(null),
      originalUserId
        ? usersService.getUser(originalUserId, authStore.authToken).catch(() => null)
        : Promise.resolve(null),
      originalUserId
        ? usersService.listUserSkills(originalUserId, authStore.authToken).catch(() => null)
        : Promise.resolve(null),
    ])
    const authorData = authorResponse?.data
      ? {
        ...authorResponse.data,
        user: {
          ...(authorResponse.data.user ?? {}),
          ...(userResponse?.data ?? {}),
        },
        skills: collectUserSkills(skillsResponse?.data, authorResponse.data.skills, authorResponse.data, userResponse?.data),
      }
      : userResponse?.data
        ? { user: userResponse.data, skills: collectUserSkills(skillsResponse?.data, userResponse.data) }
        : null

    sharedOriginalPost.value = mapApiPostToFeedPost(
      original,
      mediaResponse?.data ?? [],
      authorData,
    )
  } catch {
    sharedOriginalPost.value = null
  } finally {
    isLoadingSharedOriginal.value = false
  }
}

const syncPostCounters = () => {
  localScore.value = 'score' in props.post ? props.post.score || 0 : 0
  currentComments.value = 'comments' in props.post ? props.post.comments : 0
  currentAnswers.value = props.post.type === 'question' ? props.post.answers : 0
}

const syncFollowState = () => {
  localFollowing.value = props.post.isFollowing ?? false

  if (props.post.type === 'question' && props.post.communityId) {
    localFollowing.value = props.post.isFollowing ?? hasStoredCommunityFollow(props.post.communityId)
  }
}

const handleDocumentPointerDown = (event: PointerEvent) => {
  if (!isPostMenuOpen.value) {
    return
  }

  const target = event.target as Node | null
  if (target && postMenuRoot.value?.contains(target)) {
    return
  }

  isPostMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentPointerDown)
  socialActionsStore.upsertFeedItem(props.post, { prepend: false })
  syncFollowState()
  syncEditForm()
  void loadSharedOriginalPost()
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown)
  answerAttachmentPreviews.value.forEach((item) => URL.revokeObjectURL(item.url))
})

watch(
  () => props.post,
  () => {
    socialActionsStore.upsertFeedItem(props.post, { prepend: false })
    syncPostCounters()
    syncFollowState()
    isSaved.value = props.post.isSaved ?? false
    localScored.value = props.post.isScored ?? false
    syncEditForm()
    void loadSharedOriginalPost()
    commentList.value = []
    hasLoadedComments.value = false
    answerInput.value = ''
    answerAttachments.value = []
    isAnswerModalOpen.value = false
    isContentExpanded.value = false

  },
)

watch(answerAttachments, (files) => {
  answerAttachmentPreviews.value.forEach((item) => URL.revokeObjectURL(item.url))
  answerAttachmentPreviews.value = files.map((file) => ({
    key: `${file.name}-${file.size}-${file.lastModified}`,
    name: file.name,
    url: URL.createObjectURL(file),
    kind: file.type.startsWith('video/') ? 'video' : 'image',
  }))
})

const openEditModal = () => {
  if (!canEditPost.value) {
    return
  }

  syncEditForm()
  isPostMenuOpen.value = false
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  if (isUpdatingPost.value) {
    return
  }

  isEditModalOpen.value = false
}

const submitPostEdit = async () => {
  if (!apiPostId.value || isUpdatingPost.value) {
    return
  }

  const content = editPostContent.value.trim()

  if (!content) {
    toast.error('Post content is required.')
    return
  }

  isUpdatingPost.value = true

  try {
    const response = await postsService.updatePost(
      apiPostId.value,
      {
        userId: authStore.userId,
        title: editPostTitle.value.trim() || props.post.title,
        content,
      },
      authStore.authToken,
    )

    if ('description' in props.post) {
      props.post.description = response.data.content || content
      props.post.title = response.data.title || editPostTitle.value.trim() || props.post.title
    }

    isEditModalOpen.value = false
    toast.success('Post updated.')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to update this post.'
    toast.error('Update failed', { description: message })
  } finally {
    isUpdatingPost.value = false
  }
}

const toggleFollow = async () => {
  if (isOwnPost.value) {
    toast.info(`This is your ${contentLabel.value.toLowerCase()}`, {
      description: 'You cannot follow yourself from your own content.',
    })
    return
  }

  if (!authStore.authToken || !authStore.userId) {
    toast.error('Sign in required', {
      description: 'Please sign in again before following.',
    })
    return
  }

  const nextValue = !isFollowing.value

  try {
    if (props.post.type === 'question' && props.post.communityId) {
      if (nextValue) {
        await communitiesService.joinCommunity(props.post.communityId, authStore.authToken)
      } else {
        await communitiesService.leaveCommunity(props.post.communityId, authStore.authToken)
      }

      setStoredCommunityFollow(props.post.communityId, nextValue)
    } else if (props.post.pageId) {
      if (nextValue) {
        await pagesService.followPage(props.post.pageId, authStore.authToken)
      } else {
        await pagesService.unfollowPage(props.post.pageId, authStore.authToken)
      }
    } else if (authorUserId.value) {
      await socialActionsStore.toggleUserFollow(authorUserId.value)
    }

    localFollowing.value = nextValue
    toast.success(nextValue ? 'Following' : 'Unfollowed')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to update follow state.'
    toast.error('Follow failed', { description: message })
  }
}

const toggleScore = async () => {
  if (!canScorePost.value) {
    toast.info(`This is your ${contentLabel.value.toLowerCase()}`, {
      description: `You cannot score your own ${contentLabel.value.toLowerCase()}.`,
    })
    return
  }

  if (!apiPostId.value) {
    localScored.value = !localScored.value
    localScore.value += localScored.value ? 1 : -1
    return
  }

  if (isReactingToPost.value) {
    return
  }

  if (!authStore.authToken || !authStore.userId) {
    toast.error('Sign in required', {
      description: 'Please sign in again before scoring posts.',
    })
    return
  }

  isReactingToPost.value = true

  try {
    const count = await socialActionsStore.toggleContentScore(
      apiPostId.value,
      props.post.type === 'question' ? 'question' : 'post',
    )
    localScored.value = socialActionsStore.isContentScored(apiPostId.value)
    localScore.value = count ?? localScore.value
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

    toast.success(isSaved.value ? `${contentLabel.value} saved` : `${contentLabel.value} removed from saved`, {
      description: isSaved.value
        ? `This ${contentLabel.value.toLowerCase()} is now in your saved list.`
        : `This ${contentLabel.value.toLowerCase()} has been removed from your saved list.`,
    })
    return
  }

  if (!authStore.authToken || !authStore.userId) {
    toast.error('Sign in required', {
      description: `Please sign in again before saving ${contentLabel.value.toLowerCase()}s.`,
    })
    return
  }

  if (isSavingPost.value) {
    return
  }

  isSavingPost.value = true

  try {
    if (props.post.type === 'question') {
      const response = await questionsService.toggleQuestionSave(
        apiPostId.value,
        { userId: authStore.userId },
        authStore.authToken,
      )
      isSaved.value = typeof response.data.saved === 'boolean' ? response.data.saved : !isSaved.value
    } else {
      const response = await postsService.toggleSave(
        apiPostId.value,
        { userId: authStore.userId },
        authStore.authToken,
      )
      isSaved.value = response.data.saved
    }

    toast.success(isSaved.value ? `${contentLabel.value} saved` : `${contentLabel.value} removed from saved`, {
      description: isSaved.value
        ? `This ${contentLabel.value.toLowerCase()} is now in your saved list.`
        : `This ${contentLabel.value.toLowerCase()} has been removed from your saved list.`,
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
      const comment = await socialActionsStore.addComment(
        apiPostId.value,
        {
          userId: authStore.userId || undefined,
          content: value,
          parentCommentId: null,
        },
      )

      commentList.value.unshift({
        id: comment.id,
        parentId: null,
        author: currentUserCommentProfile().name,
        authorTo: currentUserCommentProfile().to,
        avatarSrc: currentUserCommentProfile().avatarSrc,
        avatarText: getInitials(currentUserCommentProfile().name),
        time: 'Just now',
        tag: currentUserCommentProfile().tag,
        body: comment.content,
        score: 0,
        isScored: false,
        isFollowing: false,
        isReplying: false,
        areRepliesOpen: false,
        replyInput: '',
        replies: [],
      })
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
  void loadShareCommunities()
}

const closeShareModal = () => {
  isShareModalOpen.value = false
}

const openAnswerModal = () => {
  if (props.post.type !== 'question') {
    return
  }

  answerInput.value = ''
  answerAttachments.value = []
  isAnswerModalOpen.value = true
  isPostMenuOpen.value = false
  void loadAnswererProfile()
}

const closeAnswerModal = () => {
  isAnswerModalOpen.value = false
  answerInput.value = ''
  clearAnswerAttachments()
}

const handleAnswerAttachmentChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  answerAttachments.value = Array.from(input.files ?? [])
}

const clearAnswerAttachments = () => {
  answerAttachments.value = []
}

const removeAnswerAttachment = (index: number) => {
  answerAttachments.value = answerAttachments.value.filter((_, itemIndex) => itemIndex !== index)
}

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

const uploadAnswerAttachments = async () => {
  const mediaAssetIds: string[] = []
  const fallbackMedia: Array<{ url: string; mediaType: string }> = []
  const uploadedUrls: Array<{ url: string; mediaType: string }> = []

  for (const file of answerAttachments.value) {
    const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
    const uploadResponse = await mediaService.uploadMediaFile(file, {
      kind: mediaType === 'video' ? 'video' : 'post_image',
      title: file.name,
      token: authStore.authToken,
    })
    const assetId = uploadResponse.data.assetId || uploadResponse.data.id
    const url = uploadResponse.data.url || ''

    if (assetId) {
      mediaAssetIds.push(assetId)
      if (url) {
        uploadedUrls.push({
          url,
          mediaType,
        })
      }
    } else if (url) {
      fallbackMedia.push({
        url,
        mediaType,
      })
    }
  }

  return { mediaAssetIds, fallbackMedia, uploadedUrls }
}

const submitAnswer = async () => {
  const value = answerInput.value.trim()

  if (!value) {
    return
  }

  if (!apiPostId.value) {
    toast.error('Answer needs a question ID', {
      description: 'Only questions loaded from the API can receive live answers.',
    })
    return
  }

  if (!authStore.authToken || !authStore.userId) {
    toast.error('Sign in required', {
      description: 'Please sign in again before answering questions.',
    })
    return
  }

  if (isSubmittingAnswer.value) {
    return
  }

  isSubmittingAnswer.value = true

  try {
    const uploadedMedia = await uploadAnswerAttachments()
    await socialActionsStore.addAnswer(
      apiPostId.value,
      {
        content: value,
        parentAnswerId: null,
        mediaAssetIds: uploadedMedia.mediaAssetIds.length ? uploadedMedia.mediaAssetIds : undefined,
      },
    )

    closeAnswerModal()
    toast.success('Answer posted')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to post your answer.'
    toast.error('Answer failed', { description: message })
  } finally {
    isSubmittingAnswer.value = false
  }
}

const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    if (apiPostId.value) {
      await postsService.recordShareEvent(apiPostId.value, { type: 'copy_link' }, authStore.authToken).catch(() => null)
    }
    toast.success('Link copied', {
      description: 'The post link has been copied to your clipboard.',
    })
  } catch {
    toast.error('Unable to copy link', {
      description: 'Your browser blocked clipboard access. You can still copy the link manually.',
    })
  }
}

const loadShareCommunities = async () => {
  if (hasLoadedShareCommunities.value || isLoadingShareCommunities.value) {
    return
  }

  isLoadingShareCommunities.value = true

  try {
    const response = await communitiesService.listCommunities({ per_page: 100, limit: 100 }, authStore.authToken)
    shareCommunities.value = response.data ?? []
    hasLoadedShareCommunities.value = true
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to load communities.'
    toast.error('Communities failed', { description: message })
  } finally {
    isLoadingShareCommunities.value = false
  }
}

const submitShare = async () => {
  if (shareCommunity.value) {
    if (!apiPostId.value) {
      toast.error('Share needs a post ID', {
        description: 'Only API posts can be shared into a community.',
      })
      return
    }

    try {
      const response = await postsService.sharePostToCommunity(
        apiPostId.value,
        {
          communityId: shareCommunity.value,
          comment: shareComment.value.trim() || undefined,
        },
        authStore.authToken,
      )

      toast.success('Post shared to community.')
      shareCommunity.value = ''
      shareComment.value = ''
      closeShareModal()

      if (response.data.id && typeof window !== 'undefined') {
        window.location.assign(`/posts/${response.data.id}`)
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to share this post.'
      toast.error('Share failed', { description: message })
    }
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
    if (apiPostId.value) {
      await postsService
        .recordShareEvent(apiPostId.value, { type: canNativeShare ? 'native_share' : 'manual_share' }, authStore.authToken)
        .catch(() => null)
    }
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
  reportTargetLabel.value = props.post.type === 'question' ? 'this question' : 'this post'
  selectedReportReason.value = ''
  isReportModalOpen.value = true
}

const togglePostMenu = () => {
  isPostMenuOpen.value = !isPostMenuOpen.value
}

const closePostMenu = () => {
  isPostMenuOpen.value = false
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

  if (!apiPostId.value && (reportTargetLabel.value === 'this post' || reportTargetLabel.value === 'this question')) {
    toast.error('Report needs an endpoint', {
      description: 'Only API content can be reported live.',
    })
    return
  }

  if (isSubmittingReport.value) {
    return
  }

  isSubmittingReport.value = true

  try {
    const reportPayload = {
      userId: authStore.userId || undefined,
      reason: selectedReportReason.value,
      details: reportReasonDescriptions[selectedReportReason.value] ?? '',
    }

    if (reportTargetLabel.value === 'this question') {
      await questionsService.reportQuestion(
        apiPostId.value as string,
        {
          ...reportPayload,
          id: apiPostId.value,
          itemId: apiPostId.value,
          type: 'question',
        },
        authStore.authToken,
      )
    } else if (reportTargetLabel.value === 'this post') {
      await postsService.reportPost(apiPostId.value as string, reportPayload, authStore.authToken)
    } else {
      const comment = commentList.value.find((item) => `${item.author}'s comment` === reportTargetLabel.value)
      if (!comment || typeof comment.id !== 'string') {
        throw new Error('Only saved comments can be reported.')
      }
      await postsService.reportComment(comment.id, reportPayload, authStore.authToken)
    }

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
    if (!authStore.authToken || !authStore.userId) {
      toast.error('Sign in required', {
        description: 'Please sign in again before scoring comments.',
      })
      return
    }

    try {
      const response = await postsService.toggleCommentReaction(
        comment.id,
        {
          userId: authStore.userId,
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
    const reply = await socialActionsStore.addComment(
      apiPostId.value,
      {
        userId: authStore.userId || undefined,
        content: value,
        parentCommentId: comment.id,
      },
    )

    comment.replies.unshift({
      id: reply.id,
      parentId: reply.parent_comment_id,
      author: currentUserCommentProfile().name,
      authorTo: currentUserCommentProfile().to,
      avatarSrc: currentUserCommentProfile().avatarSrc,
      avatarText: getInitials(currentUserCommentProfile().name),
      time: 'Just now',
      tag: currentUserCommentProfile().tag,
      body: reply.content,
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
    class="s4e-feed-card rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-elevated)] sm:p-4"
  >
    <template v-if="post.type === 'question'">
      <div class="min-w-0">
        <div class="flex items-start gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--accent)_12%,var(--surface-primary))] text-[var(--accent-strong)]">
                Q
              </span>
              <i :class="post.communityIconClass || 'las la-users'" class="shrink-0 text-base leading-none text-[var(--accent-strong)]" aria-hidden="true" />
              <span class="truncate font-semibold">{{ post.communityName }}</span>
            </div>
            <RouterLink
              :to="detailPath"
              class="mt-3 block text-[1.28rem] font-semibold leading-tight tracking-[-0.015em] text-[var(--text-primary)] transition hover:text-[var(--accent-strong)] sm:text-[1.45rem] lg:text-[1.58rem]"
            >
              {{ post.title }}
            </RouterLink>
            <div class="mt-2.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[0.82rem] leading-5 text-[var(--text-secondary)]">
              <span class="shrink-0">{{ post.time }}</span>
              <span class="text-[var(--text-tertiary)]">-</span>
              <RouterLink :to="authorRoute" class="shrink-0 font-semibold text-[var(--accent-strong)]">
                {{ authorName }}
              </RouterLink>
              <template v-if="authorMetaItems.length">
                <span class="text-[var(--text-tertiary)]">-</span>
                <span class="min-w-0 truncate font-semibold text-[var(--text-tertiary)]">
                  {{ authorMetaItems.join(' | ') }}
                </span>
              </template>
            </div>
          </div>

          <div ref="postMenuRoot" class="relative shrink-0">
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:border-[color:var(--accent-soft)] hover:text-[var(--accent-strong)]"
              aria-label="Question actions"
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
                @click="openAnswerModal"
              >
                <Reply class="h-4 w-4" />
                Answer
              </button>
              <button
                type="button"
                class="mt-1 flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--accent-strong)]"
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
              <slot name="question-menu-actions" :close-menu="closePostMenu" />
            </div>
          </div>
        </div>
      </div>

      <div class="mt-5 flex flex-wrap gap-1.5 sm:gap-2">
        <button
          type="button"
          class="inline-flex h-9 items-center rounded-[1rem] border border-[color:var(--border-soft)] px-3 text-[0.9rem] font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] sm:h-8.5 sm:px-3.5 sm:text-[0.84rem]"
          @click="openAnswerModal"
        >
          <Reply class="mr-1 h-3.5 w-3.5" />
          Answer
        </button>
        <button
          v-if="showFollowAction"
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
          {{ displayedAnswers }} Answers
        </span>
      </div>
    </template>

    <template v-else>
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <RouterLink
            :to="authorRoute"
            class="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] text-sm font-semibold text-[var(--accent-strong)] sm:h-12 sm:w-12"
            :aria-label="`View ${authorName}'s profile`"
          >
            <img loading="lazy" decoding="async"
              v-if="authorAvatarSrc"
              :src="authorAvatarSrc"
              :alt="post.author.name"
              class="absolute inset-0 block h-full w-full object-cover"
              @error="failedAuthorAvatarSrc = authorAvatarSrc"
            />
            <span v-else>{{ post.author.avatarText }}</span>
          </RouterLink>

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
                    v-if="authorMetaItems.length"
                    class="min-w-0 truncate text-[0.92rem] font-semibold text-[var(--text-tertiary)]"
                  >
                    {{ authorMetaItems.join(' | ') }}
                  </span>
                </div>

                <div ref="postMenuRoot" class="relative ml-auto sm:hidden">
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
                      v-if="canEditPost"
                      type="button"
                      class="flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--accent-strong)]"
                      @click="openEditModal"
                    >
                      <Edit2 class="h-4 w-4" />
                      Edit
                    </button>
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
                    v-if="showFollowAction"
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
          <RichTextContent
            :content="post.description"
            :clamp="shouldClampPostContent"
            class="mt-2 text-[0.82rem] leading-6 text-[var(--text-secondary)] sm:text-[0.9rem] sm:leading-7"
          />
          <button
            v-if="isPostContentCollapsible && !props.expanded"
            type="button"
            class="mt-1 inline-flex text-[0.82rem] font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
            @click="isContentExpanded = !isContentExpanded"
          >
            {{ isContentExpanded ? 'Read less...' : 'Read more...' }}
          </button>

          <div
            v-if="isSharedPost"
            class="mt-4 rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-3"
          >
            <div
              v-if="isLoadingSharedOriginal"
              class="space-y-2"
              aria-label="Loading shared post"
            >
              <div class="h-3 w-1/3 animate-pulse rounded-full bg-[var(--surface-muted)]" />
              <div class="h-4 w-4/5 animate-pulse rounded-full bg-[var(--surface-muted)]" />
              <div class="h-3 w-2/3 animate-pulse rounded-full bg-[var(--surface-muted)]" />
            </div>
            <template v-else-if="sharedOriginalPost && sharedOriginalPost.type !== 'question'">
              <div class="flex items-center gap-2 text-[0.78rem] text-[var(--text-secondary)]">
                <span class="font-semibold text-[var(--text-primary)]">{{ sharedOriginalPost.author.name }}</span>
                <span>{{ sharedOriginalPost.time }}</span>
              </div>
              <RouterLink
                :to="`/posts/${sharedOriginalPost.slug}`"
                class="mt-2 block text-[0.95rem] font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
              >
                {{ sharedOriginalPost.title }}
              </RouterLink>
              <RichTextContent
                :content="sharedOriginalPost.description"
                clamp
                class="mt-2 text-[0.82rem] leading-6 text-[var(--text-secondary)]"
              />
              <img
                v-if="sharedOriginalPost.imageSrc"
                :src="sharedOriginalPost.imageSrc"
                :alt="sharedOriginalPost.imageAlt || sharedOriginalPost.title"
                loading="lazy"
                decoding="async"
                class="mt-3 aspect-[4/5] w-full rounded-[0.8rem] bg-[var(--surface-primary)] object-cover sm:aspect-[1.91/1]"
              />
            </template>
            <p v-else class="text-sm text-[var(--text-secondary)]">The original shared post is not available.</p>
          </div>

          <video
            v-if="primaryMedia?.isVideo"
            :src="primaryMedia.url"
            controls
            preload="none"
            playsinline
            class="-mx-3 mt-4 aspect-video w-[calc(100%+1.5rem)] max-w-none bg-black object-contain sm:-mx-4 sm:w-[calc(100%+2rem)]"
          />
          <img
            v-else-if="primaryMedia"
            :src="primaryMedia.url"
            :alt="post.imageAlt || post.title"
            loading="lazy"
            decoding="async"
            class="-mx-3 mt-4 aspect-[4/5] w-[calc(100%+1.5rem)] max-w-none bg-[var(--surface-secondary)] object-cover sm:-mx-4 sm:aspect-[1.91/1] sm:w-[calc(100%+2rem)]"
          />

          <div class="mt-4 flex flex-wrap gap-1.5">
            <button
              type="button"
              class="inline-flex h-8 items-center gap-1 rounded-[0.8rem] border px-2 text-[0.78rem] font-medium transition sm:h-8 sm:px-2.5"
              :class="
                !canScorePost
                  ? 'cursor-not-allowed border-[color:var(--border-soft)] text-[var(--text-tertiary)] opacity-70'
                  : isScored
                  ? activeActionClass
                  : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
              "
              :disabled="!canScorePost || isReactingToPost"
              @click="toggleScore"
            >
              <ArrowUp class="h-3 w-3" />
              {{ currentScore }} score
            </button>
            <button
              v-if="canEditPost"
              type="button"
              class="inline-flex h-8 items-center gap-1 rounded-[0.8rem] border border-[color:var(--border-soft)] px-2 text-[0.78rem] font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] sm:h-8 sm:px-2.5"
              @click="openEditModal"
            >
              <Edit2 class="h-3 w-3" />
              Edit
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
              {{ displayedComments }} {{ displayedComments === 1 ? 'comment' : 'comments' }}
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
                      <img loading="lazy" decoding="async"
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

  <ResponsiveOverlay
    v-if="post.type === 'question'"
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
            <img loading="lazy" decoding="async"
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
        <div v-if="answerAttachmentPreviews.length" class="space-y-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="(file, index) in answerAttachmentPreviews"
              :key="file.key"
              class="overflow-hidden rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)]"
            >
              <img loading="lazy" decoding="async"
                v-if="file.kind === 'image'"
                :src="file.url"
                :alt="file.name"
                class="mx-auto aspect-[4/3] max-h-72 w-full object-contain"
              />
              <video
                v-else
                :src="file.url"
                class="mx-auto aspect-[4/3] max-h-72 w-full bg-black object-contain"
                controls
                playsinline
              />
              <div class="flex items-center justify-between gap-2 px-3 py-2">
                <p class="truncate text-xs font-semibold text-[var(--text-primary)]">{{ file.name }}</p>
                <button
                  type="button"
                  class="inline-flex h-8 items-center justify-center rounded-lg border border-[color:var(--border-soft)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--danger)] hover:text-[var(--danger)]"
                  @click="removeAnswerAttachment(index)"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="inline-flex h-9 items-center justify-center rounded-lg border border-[color:var(--border-soft)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--danger)] hover:text-[var(--danger)]"
            @click="clearAnswerAttachments"
          >
            Clear all
          </button>
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

    </div>
  </ResponsiveOverlay>

  <Teleport to="body">
    <div
      v-if="isShareModalOpen"
      class="fixed inset-0 z-[120] flex items-end justify-center bg-[#0c0c1b]/50 px-0 pt-4 sm:items-center sm:px-4 sm:py-5"
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
                <option
                  v-for="community in shareCommunities"
                  :key="community.id"
                  :value="community.id"
                >
                  {{ community.name }}
                </option>
              </select>
              <p v-if="!isLoadingShareCommunities" class="text-xs leading-5 text-[var(--text-tertiary)]">
                Select a community to repost this content there.
              </p>
              <div
                v-else
                class="h-3 w-44 animate-pulse rounded-full bg-[var(--surface-muted)]"
                aria-label="Loading communities"
              />
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
              <img loading="lazy" decoding="async"
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
      class="fixed inset-0 z-[120] flex items-end justify-center bg-[#0c0c1b]/50 px-0 pt-4 sm:items-center sm:px-4 sm:py-5"
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
            Thank you for reporting {{ contentLabel.toLowerCase() }}s that break the rules. Let us know which of the rules applies.
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
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]'
                  : 'border-[color:var(--border-soft)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
              "
              @click="selectedReportReason = reason"
            >
              {{ reason }}
            </button>
          </div>

          <div
            v-if="selectedReportReason"
            class="mt-5 rounded-[0.9rem] border border-[color:var(--accent-soft)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface-primary))] p-4"
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

  <Teleport to="body">
    <div
      v-if="isEditModalOpen"
      class="fixed inset-0 z-[130] flex items-end justify-center bg-[#0c0c1b]/50 px-0 pt-4 sm:items-center sm:px-4 sm:py-5"
      @click.self="closeEditModal"
    >
      <form
        class="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)] sm:max-h-[92vh] sm:rounded-[1rem]"
        @submit.prevent="submitPostEdit"
      >
        <div class="mx-auto mt-3 h-1 w-10 rounded-full bg-[var(--surface-muted)] sm:hidden" />
        <div class="flex items-center justify-between border-b border-[color:var(--border-soft)] px-4 py-3 sm:px-5">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Edit post</h2>
          <button
            type="button"
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="closeEditModal"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          <label class="block space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Title</span>
            <input
              v-model="editPostTitle"
              type="text"
              class="h-11 w-full rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
            />
          </label>

          <label class="block space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Post</span>
            <textarea
              v-model="editPostContent"
              rows="7"
              class="w-full resize-y rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 py-3 text-sm leading-6 text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
            />
          </label>
        </div>

        <div class="shrink-0 border-t border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 sm:px-5">
          <div class="flex justify-end gap-2">
            <button
              type="submit"
              :disabled="isUpdatingPost"
              class="inline-flex h-10 min-w-[7rem] items-center justify-center rounded-[0.8rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
            >
              {{ isUpdatingPost ? 'Saving...' : 'Save changes' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </Teleport>
</template>

<style scoped>
.s4e-feed-card {
  min-width: 0;
}
</style>
