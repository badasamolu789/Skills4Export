<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowUp, BookOpen, Bookmark, Check, CloudUpload, Flag, MessageSquare, Share2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useCurrentUserIdentity, getInitials, getProfileSkills } from '@/composables/useCurrentUserIdentity'
import RichTextContent from '@/components/RichTextContent.vue'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import type { QuestionPost } from '@/data/feedPosts'
import { ApiError } from '@/lib/api'
import { mediaService } from '@/services/media'
import { communitiesService, type CommunityRecord } from '@/services/communities'
import { pagesService } from '@/services/pages'
import type { PostMediaRecord } from '@/services/posts'
import { questionsService, type AnswerCommentRecord, type QuestionAnswerRecord } from '@/services/questions'
import { usersService, type MyProfileData } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { useSocialActionsStore } from '@/stores/socialActions'
import { getOptionalCount } from '@/utils/postMapper'
import { getQuestionUserId, mapApiQuestionToFeedPost } from '@/utils/questionMapper'
import { getDisplayName } from '@/utils/displayName'
import { loadQuestionAuthorProfile } from '@/utils/questionAuthor'

const route = useRoute()
const authStore = useAuthStore()
const socialActionsStore = useSocialActionsStore()
const currentUser = useCurrentUserIdentity()

type AnswerItem = {
  id: string
  authorUserId: string
  pageId: string | null
  authorName: string
  authorTo: string
  avatarSrc: string | null
  avatarText: string
  authorMeta: string[]
  time: string
  content: string
  score: number
  isScored: boolean
  isSaved: boolean
  isFollowing: boolean
  comments: number
  isCommentsOpen: boolean
  commentInput: string
  commentItems: AnswerCommentItem[]
  media: AnswerMediaLike[]
}

type AnswerCommentItem = {
  id: string
  authorName: string
  time: string
  content: string
}

type AnswerMediaLike = Partial<PostMediaRecord> & {
  id: string
  url: string
  mediaType?: string
  thumbnailUrl?: string
  displayOrder?: number
  secure_url?: string
  secureUrl?: string
  media_url?: string
  mediaUrl?: string
  thumbnail?: string
  [key: string]: unknown
}

const apiQuestion = ref<QuestionPost | null>(null)
const isLoadingQuestion = ref(false)
const questionError = ref('')
const answerItems = ref<AnswerItem[]>([])
const questionCommunity = ref<CommunityRecord | null>(null)
const answerSort = ref('newest')
const answerInput = ref('')
const isAnswerModalOpen = ref(false)
const isSubmittingAnswer = ref(false)
const activeAnswerActionId = ref('')
const answerAttachments = ref<File[]>([])
const answerAttachmentPreviews = ref<Array<{ key: string; name: string; url: string; kind: 'image' | 'video' }>>([])
const answererProfile = ref<MyProfileData | null>(null)
const isLoadingAnswererProfile = ref(false)
let realtimeTimer: ReturnType<typeof window.setInterval> | null = null

const question = computed(() => apiQuestion.value)
const questionId = computed(() => question.value?.apiId)
const questionBodyText = computed(() => {
  const body = question.value?.body?.trim() || ''
  const title = question.value?.title?.trim() || ''

  return body && body !== title ? body : ''
})

const formatTime = (value?: string) => {
  if (!value) {
    return 'Just now'
  }

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

const currentAnswerAuthor = () => {
  return {
    name: currentUser.displayName.value,
    to: currentUser.profilePath.value,
    avatarSrc: currentUser.avatarSrc.value || null,
    skills: currentUser.skills.value,
  }
}

const questionAuthor = computed(() => {
  if (!question.value) {
    return null
  }

  return {
    name: question.value.authorName,
    to: question.value.authorTo,
    avatarSrc: question.value.authorAvatarSrc || null,
    avatarText: question.value.authorName
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  }
})

const questionSkills = computed(() =>
  question.value?.tag
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3) ?? [],
)

const sortedAnswers = computed(() => {
  if (answerSort.value === 'oldest') {
    return [...answerItems.value].reverse()
  }

  return answerItems.value
})

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

const answererInitials = computed(() =>
  answererName.value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const mapAnswerContent = (answer: QuestionAnswerRecord) =>
  answer.content || answer.body || answer.answer || answer.text || answer.message || ''

const getProfileNameWithoutEmail = (profile?: MyProfileData | null) =>
  getDisplayName(
    profile?.user?.name,
    profile?.profile?.displayName,
    (profile?.profile as Record<string, unknown> | null | undefined)?.display_name as string | undefined,
    profile?.profile?.username,
    profile?.user?.username,
  )

const getStringFromRecord = (source: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

const getRecordFromUnknown = (source: unknown, keys: string[]) => {
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

const getEmbeddedProfileData = (source: unknown) => {
  const user = getRecordFromUnknown(source, ['user', 'author', 'answerer', 'commenter'])
  const profile =
    getRecordFromUnknown(source, ['profile', 'userProfile', 'user_profile']) ??
    getRecordFromUnknown(user, ['profile', 'userProfile', 'user_profile'])

  return {
    user,
    profile,
  } as MyProfileData
}

const getEmbeddedAvatar = (source: unknown) => {
  const profileData = getEmbeddedProfileData(source)

  return (
    (profileData.profile ? getStringFromRecord(profileData.profile as Record<string, unknown>, ['avatar', 'avatarUrl', 'avatar_url', 'profileImage', 'profile_image']) : '') ||
    (profileData.user ? getStringFromRecord(profileData.user as Record<string, unknown>, ['avatar', 'avatarUrl', 'avatar_url', 'profileImage', 'profile_image']) : '') ||
    null
  )
}

const normalizeAnswerMediaItems = (value: unknown): AnswerMediaLike[] => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value.flatMap(normalizeAnswerMediaItems)
  }

  if (typeof value !== 'object') {
    return []
  }

  const record = value as Record<string, unknown>
  const nestedMedia = [
    record.media,
    record.mediaAssets,
    record.media_assets,
    record.mediaAsset,
    record.media_asset,
    record.attachments,
    record.attachment,
    record.asset,
    record.file,
  ].flatMap(normalizeAnswerMediaItems)
  const url = getStringFromRecord(record, [
    'url',
    'secure_url',
    'secureUrl',
    'media_url',
    'mediaUrl',
    'file_url',
    'fileUrl',
    'original_url',
    'originalUrl',
  ])

  if (!url) {
    return nestedMedia
  }

  const mediaType = getStringFromRecord(record, [
    'media_type',
    'mediaType',
    'type',
    'kind',
    'resource_type',
    'resourceType',
    'mime_type',
    'mimeType',
  ])
  const thumbnailUrl = getStringFromRecord(record, [
    'thumbnail_url',
    'thumbnailUrl',
    'thumbnail',
    'poster',
    'preview_url',
    'previewUrl',
  ])
  const id = getStringFromRecord(record, ['id', 'uuid', '_id']) || url

  return [
    ...nestedMedia,
    {
      ...record,
      id,
      url,
      media_type: mediaType,
      mediaType,
      thumbnail_url: thumbnailUrl,
      thumbnailUrl,
      display_order: Number(record.display_order ?? record.displayOrder ?? 0),
    },
  ]
}

const getAnswerEmbeddedMedia = (answer: QuestionAnswerRecord) =>
  normalizeAnswerMediaItems(answer)

const getAnswerMediaType = (item: AnswerMediaLike) =>
  String(item.media_type || item.mediaType || item.type || item.kind || '').toLowerCase()

const getAnswerMediaUrl = (item: AnswerMediaLike) =>
  item.url || item.secure_url || item.secureUrl || item.media_url || item.mediaUrl || ''

const getAnswerMediaThumbnail = (item: AnswerMediaLike) =>
  item.thumbnail_url || item.thumbnailUrl || item.thumbnail || getAnswerMediaUrl(item)

const getAnswerPageId = (answer: QuestionAnswerRecord) => answer.pageId || answer.page_id || null

const mapAnswerComment = (comment: AnswerCommentRecord): AnswerCommentItem => ({
  id: comment.id,
  authorName:
    (comment.user_id || comment.userId) === authStore.userId
      ? currentUser.displayName.value
      : getProfileNameWithoutEmail(getEmbeddedProfileData(comment)),
  time: formatTime(comment.createdAt || comment.created_at),
  content: comment.content,
})

const mapAnswerItem = async (answer: QuestionAnswerRecord): Promise<AnswerItem> => {
  const userId = answer.userId || answer.user_id || ''
  const embeddedProfile = getEmbeddedProfileData(answer)
  const author =
    userId && userId === authStore.userId
      ? currentAnswerAuthor()
      : userId
        ? await usersService
            .getUserProfile(userId, authStore.authToken)
            .then((response) => {
              const profile = response.data
              const name = getProfileNameWithoutEmail(profile) || getProfileNameWithoutEmail(embeddedProfile)

              return {
                name,
                to: `/profile/view/${userId}`,
                avatarSrc: profile?.profile?.avatar || getEmbeddedAvatar(answer),
                skills: getProfileSkills(profile),
              }
            })
            .catch(() => ({
              name: getProfileNameWithoutEmail(embeddedProfile),
              to: `/profile/view/${userId}`,
              avatarSrc: getEmbeddedAvatar(answer),
              skills: [] as string[],
            }))
        : {
            name: getProfileNameWithoutEmail(embeddedProfile),
            to: '/profile',
            avatarSrc: getEmbeddedAvatar(answer),
            skills: [] as string[],
          }

  const media = getAnswerEmbeddedMedia(answer)

  return {
    id: answer.id,
    authorUserId: userId,
    pageId: getAnswerPageId(answer),
    authorName: author.name,
    authorTo: author.to,
    avatarSrc: author.avatarSrc,
    avatarText: getInitials(author.name),
    authorMeta: author.skills,
    time: formatTime(answer.createdAt || answer.created_at),
    content: mapAnswerContent(answer),
    score: getOptionalCount(
      answer.score,
      answer.reactions_count,
      answer.reaction_count,
      answer.reactionsCount,
      answer.likes_count,
      answer.likesCount,
    ),
    isScored: false,
    isSaved: Boolean(answer.is_saved),
    isFollowing: Boolean(answer.is_follow),
    comments: getOptionalCount(answer.comments_count, answer.comment_count, answer.commentsCount),
    isCommentsOpen: false,
    commentInput: '',
    commentItems: [],
    media,
  }
}

const uploadAnswerAttachments = async () => {
  const mediaAssetIds: string[] = []
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
    } else {
      throw new Error('Media upload completed without an asset ID.')
    }
  }

  return { mediaAssetIds, uploadedUrls }
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

const loadQuestion = async (id: string, options: { background?: boolean } = {}) => {
  if (!options.background) {
    isLoadingQuestion.value = true
  }
  questionError.value = ''

  try {
    const response = await questionsService.getQuestion(id, authStore.authToken, true)
    const userId = getQuestionUserId(response.data)
    const communityId = response.data.communityId || response.data.community_id || ''
    const [authorData, answersResponse, communityResponse] = await Promise.all([
      userId
        ? loadQuestionAuthorProfile(userId, authStore.userId, currentUser.profileData.value, authStore.authToken)
        : Promise.resolve(null),
      questionsService.listAnswers(response.data.id, authStore.authToken),
      communityId ? communitiesService.getCommunity(communityId, authStore.authToken) : Promise.resolve(null),
    ])
    const answers = answersResponse.data ?? []
    const embeddedCommunity = response.data.community
      ? {
        id: response.data.community.id || communityId,
        name: response.data.community.name || '',
        description: response.data.community.description || '',
        icon: response.data.community.icon,
        iconName: response.data.community.iconName,
        icon_name: response.data.community.icon_name,
        iconClass: response.data.community.iconClass,
        icon_class: response.data.community.icon_class,
      } as CommunityRecord
      : null

    const previousAnswersById = new Map(answerItems.value.map((answer) => [answer.id, answer]))
    const nextAnswerItems = await Promise.all(answers.map(mapAnswerItem))
    questionCommunity.value = communityResponse?.data ?? embeddedCommunity

    apiQuestion.value = mapApiQuestionToFeedPost(
      {
        ...response.data,
        answers_count: answersResponse.total ?? response.data.answers_count,
        answers,
      },
      authorData,
      questionCommunity.value?.name,
      questionCommunity.value,
    )
    answerItems.value = nextAnswerItems.map((answer) => {
      const previous = previousAnswersById.get(answer.id)

      if (!previous) {
        return answer
      }

      return {
        ...answer,
        media: answer.media.length ? answer.media : previous.media,
        isCommentsOpen: previous.isCommentsOpen,
        commentInput: previous.commentInput,
        commentItems: answer.commentItems.length ? answer.commentItems : previous.commentItems,
        comments: Math.max(answer.comments, previous.comments),
        isSaved: answer.isSaved || previous.isSaved,
        isScored: answer.isScored || previous.isScored,
        isFollowing: answer.isFollowing || previous.isFollowing,
      }
    })
  } catch (error) {
    if (!options.background) {
      questionError.value = error instanceof ApiError ? error.message : 'Unable to load question.'
    }
  } finally {
    if (!options.background) {
      isLoadingQuestion.value = false
    }
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

const submitAnswer = async () => {
  const value = answerInput.value.trim()

  if (!value) {
    return
  }

  if (questionId.value) {
    if (isSubmittingAnswer.value) {
      return
    }

    isSubmittingAnswer.value = true

    try {
      const uploadedMedia = await uploadAnswerAttachments()
      const answer = await socialActionsStore.addAnswer(
        questionId.value,
        {
          content: value,
          parentAnswerId: null,
          mediaAssetIds: uploadedMedia.mediaAssetIds.length ? uploadedMedia.mediaAssetIds : undefined,
        },
      )

      const responseMedia = getAnswerEmbeddedMedia(answer)
      const uploadedPreviewMedia = uploadedMedia.uploadedUrls.map((item, index) => ({
        id: `uploaded-${answer.id}-${index}`,
        post_id: answer.id,
        media_type: item.mediaType,
        url: item.url,
        thumbnail_url: item.mediaType === 'image' ? item.url : '',
        display_order: index,
      }))

      answerItems.value.unshift({
        ...(await mapAnswerItem(answer)),
        authorUserId: authStore.userId || '',
        pageId: null,
        authorName: answererName.value,
        authorTo: answererProfilePath.value,
        avatarSrc: answererAvatar.value || null,
        avatarText: answererInitials.value,
        authorMeta: answererSkills.value,
        time: 'Just now',
        content: mapAnswerContent(answer) || value,
        isSaved: false,
        isFollowing: false,
        comments: 0,
        isCommentsOpen: false,
        commentInput: '',
        commentItems: [],
        media: responseMedia.length ? responseMedia : uploadedPreviewMedia,
      })
      closeAnswerModal()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to post answer.'
      toast.error('Answer failed', { description: message })
    } finally {
      isSubmittingAnswer.value = false
    }

    return
  }

  toast.error('Question is not ready', {
    description: 'Please wait for the live question data to finish loading before answering.',
  })
}

const toggleAnswerScore = async (answer: AnswerItem) => {
  if (answer.authorUserId && answer.authorUserId === authStore.userId) {
    toast.info('This is your answer', {
      description: 'You cannot score your own answer.',
    })
    return
  }

  if (!authStore.authToken || !authStore.userId) {
    toast.error('Sign in required', {
      description: 'Please sign in again before scoring answers.',
    })
    return
  }

  if (activeAnswerActionId.value) {
    return
  }

  activeAnswerActionId.value = answer.id

  try {
    const response = await questionsService.toggleAnswerReaction(
      answer.id,
      {
        userId: authStore.userId,
        type: 'like',
      },
      authStore.authToken,
    )
    answer.isScored = !answer.isScored
    answer.score = response.data.count
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to update reaction.'
    toast.error('Reaction failed', { description: message })
  } finally {
    activeAnswerActionId.value = ''
  }
}

const toggleAnswerFollow = (answer: AnswerItem) => {
  void (async () => {
    if (answer.authorUserId && answer.authorUserId === authStore.userId) {
      toast.info('This is your answer', {
        description: 'You cannot follow yourself.',
      })
      return
    }

    if (!authStore.authToken || !authStore.userId) {
      toast.error('Sign in required', {
        description: 'Please sign in again before following.',
      })
      return
    }

    if (!answer.pageId && !answer.authorUserId) {
      toast.error('Follow unavailable', {
        description: 'This answer does not include a user or page to follow.',
      })
      return
    }

    const nextValue = !answer.isFollowing

    try {
      if (answer.pageId) {
        if (nextValue) {
          await pagesService.followPage(answer.pageId, authStore.authToken)
        } else {
          await pagesService.unfollowPage(answer.pageId, authStore.authToken)
        }
      } else if (answer.authorUserId) {
        await socialActionsStore.toggleUserFollow(answer.authorUserId)
      }

      answer.isFollowing = nextValue
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to update follow state.'
      toast.error('Follow failed', { description: message })
    }
  })()
}

const toggleAnswerComments = async (answer: AnswerItem) => {
  answer.isCommentsOpen = !answer.isCommentsOpen

  if (!answer.isCommentsOpen || answer.commentItems.length || !answer.id) {
    return
  }

  try {
    const response = await questionsService.listAnswerComments(answer.id, authStore.authToken)
    answer.commentItems = (response.data ?? []).map(mapAnswerComment)
    answer.comments = response.total
  } catch {
    answer.commentItems = []
  }
}

const submitAnswerComment = async (answer: AnswerItem) => {
  const value = answer.commentInput.trim()

  if (!value) {
    return
  }

  if (!authStore.authToken || !authStore.userId) {
    toast.error('Sign in required', {
      description: 'Please sign in again before commenting.',
    })
    return
  }

  if (activeAnswerActionId.value) {
    return
  }

  activeAnswerActionId.value = answer.id

  try {
    const response = await questionsService.createAnswerComment(
      answer.id,
      {
        userId: authStore.userId,
        content: value,
      },
      authStore.authToken,
    )
    answer.commentItems.unshift({
      id: response.data.id,
      authorName: currentUser.displayName.value,
      time: 'Just now',
      content: response.data.content || value,
    })
    answer.comments += 1
    answer.commentInput = ''
    answer.isCommentsOpen = true
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to add comment.'
    toast.error('Comment failed', { description: message })
  } finally {
    activeAnswerActionId.value = ''
  }
}

const shareAnswer = async (answer: AnswerItem) => {
  const url =
    typeof window === 'undefined'
      ? `/questions/${question.value?.slug || questionId.value || ''}#answer-${answer.id}`
      : `${window.location.origin}/questions/${question.value?.slug || questionId.value || ''}#answer-${answer.id}`
  const text = [question.value?.title, answer.content].filter(Boolean).join('\n\n')
  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function'

  try {
    if (canNativeShare) {
      await navigator.share({
        title: question.value?.title || 'Question answer',
        text,
        url,
      })
    } else {
      await navigator.clipboard.writeText([text, url].filter(Boolean).join('\n\n'))
    }

    await questionsService.recordAnswerShare(
      answer.id,
      { type: canNativeShare ? 'native_share' : 'copy_link' },
      authStore.authToken,
    )
    toast.success(canNativeShare ? 'Share opened' : 'Answer link copied')
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }

    toast.error('Unable to share answer.')
  }
}

const toggleAnswerSave = async (answer: AnswerItem) => {
  if (!authStore.authToken || !authStore.userId) {
    toast.error('Sign in required', {
      description: 'Please sign in again before saving answers.',
    })
    return
  }

  if (activeAnswerActionId.value) {
    return
  }

  activeAnswerActionId.value = answer.id

  try {
    const response = await questionsService.toggleAnswerSave(
      answer.id,
      { userId: authStore.userId },
      authStore.authToken,
    )
    answer.isSaved = response.data.saved
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to update saved state.'
    toast.error('Save failed', { description: message })
  } finally {
    activeAnswerActionId.value = ''
  }
}

const reportAnswer = async (answer: AnswerItem) => {
  if (!authStore.authToken || !authStore.userId) {
    toast.error('Sign in required', {
      description: 'Please sign in again before reporting answers.',
    })
    return
  }

  try {
    await questionsService.reportAnswer(
      answer.id,
      {
        userId: authStore.userId,
        reason: 'Inappropriate content',
        details: `Reported answer by ${answer.authorName}.`,
      },
      authStore.authToken,
    )
    toast.success('Report submitted')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to submit report.'
    toast.error('Report failed', { description: message })
  }
}

watch(
  () => route.params.slug,
  (slug) => {
    apiQuestion.value = null
    questionCommunity.value = null
    answerItems.value = []
    void loadQuestion(String(slug))
  },
  { immediate: true },
)

watch(
  questionId,
  (id) => {
    if (realtimeTimer) {
      window.clearInterval(realtimeTimer)
      realtimeTimer = null
    }

    if (!id) {
      return
    }

    realtimeTimer = window.setInterval(() => {
      if (!isLoadingQuestion.value && questionId.value) {
        void loadQuestion(questionId.value, { background: true })
      }
    }, 15000)
  },
  { immediate: true },
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

onBeforeUnmount(() => {
  answerAttachmentPreviews.value.forEach((item) => URL.revokeObjectURL(item.url))
  if (realtimeTimer) {
    window.clearInterval(realtimeTimer)
  }
})
</script>

<template>
  <section v-if="isLoadingQuestion && !question" class="space-y-4" aria-label="Loading question">
    <article class="animate-pulse rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4">
      <div class="h-7 w-4/5 rounded-full bg-[var(--surface-muted)]"></div>
      <div class="mt-3 h-4 w-2/3 rounded-full bg-[var(--surface-muted)]"></div>
      <div class="mt-5 h-28 rounded-xl bg-[var(--surface-muted)]"></div>
    </article>
  </section>

  <section v-else-if="question" class="space-y-4">
    <article class="overflow-hidden rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)]">
      <div class="space-y-4 border-b border-[color:var(--border-soft)] p-4 sm:p-5">
        <div class="flex flex-wrap items-center gap-2 text-[0.82rem] text-[var(--text-secondary)]">
          <RouterLink to="/answers" class="transition hover:text-[var(--accent-strong)]">Questions</RouterLink>
          <span>/</span>
          <span class="font-medium text-[var(--accent-strong)]">Details</span>
        </div>

        <h1 class="text-[1.45rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.9rem]">
          {{ question.title }}
        </h1>

        <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--text-secondary)]">
          <RouterLink
            v-if="questionAuthor"
            :to="questionAuthor.to"
            class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--accent)] text-[0.68rem] font-bold text-white"
          >
            <img loading="lazy" decoding="async"
              v-if="questionAuthor.avatarSrc"
              :src="questionAuthor.avatarSrc"
              :alt="questionAuthor.name"
              class="h-full w-full object-cover"
            />
            <span v-else>{{ questionAuthor.avatarText }}</span>
          </RouterLink>
          <RouterLink
            v-if="questionAuthor"
            :to="questionAuthor.to"
            class="font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
          >
            {{ questionAuthor.name }}
          </RouterLink>
          <span class="text-[var(--text-tertiary)]">-</span>
          <span>{{ question.time }}</span>
          <template v-if="questionSkills.length">
            <span class="text-[var(--text-tertiary)]">-</span>
            <span class="min-w-0 truncate font-semibold text-[var(--text-tertiary)]">
              {{ questionSkills.join(' | ') }}
            </span>
          </template>
        </div>

        <p
          v-if="questionBodyText"
          class="whitespace-pre-line text-[0.94rem] leading-8 text-[var(--text-secondary)]"
        >
          {{ questionBodyText }}
        </p>

        <button
          type="button"
          class="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          @click="openAnswerModal"
        >
          <BookOpen class="h-4 w-4" />
          Answer
        </button>
      </div>

      <div class="space-y-6 p-4 sm:p-5">
        <div class="flex flex-col gap-3 border-b border-[color:var(--border-soft)] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-baseline gap-3">
            <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              All Answers
            </p>
            <p class="text-2xl font-semibold text-[var(--text-primary)]">{{ answerItems.length }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <select
              v-model="answerSort"
              class="h-10 rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm font-semibold text-[var(--text-secondary)] outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>

        <div class="space-y-4">
          <article
            v-for="answer in sortedAnswers"
            :key="answer.id"
            :id="`answer-${answer.id}`"
            class="border-b border-[color:var(--border-soft)] pb-5 last:border-b-0 last:pb-0"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex min-w-0 items-start gap-3">
                <RouterLink
                  :to="answer.authorTo"
                  class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)] text-[0.68rem] font-semibold text-[var(--text-tertiary)]"
                >
                  <img loading="lazy" decoding="async"
                    v-if="answer.avatarSrc"
                    :src="answer.avatarSrc"
                    :alt="answer.authorName"
                    class="h-full w-full object-cover"
                  />
                  <span v-else>{{ answer.avatarText }}</span>
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
                      v-if="answer.authorMeta.length"
                      class="min-w-0 truncate text-sm font-semibold text-[var(--text-tertiary)]"
                    >
                      {{ answer.authorMeta.slice(0, 3).join(' | ') }}
                    </span>
                  </div>
                  <button
                    v-if="answer.authorUserId !== authStore.userId && (answer.pageId || answer.authorUserId)"
                    type="button"
                    class="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                    @click="toggleAnswerFollow(answer)"
                  >
                    <Check class="h-3.5 w-3.5" />
                    {{ answer.isFollowing ? 'Unfollow' : 'Follow' }}
                  </button>
                </div>
              </div>
              <div class="text-sm text-[var(--text-secondary)] sm:text-right">
                <p class="font-semibold text-[var(--text-primary)]">answered</p>
                <p class="mt-1">{{ answer.time }}</p>
              </div>
            </div>

            <RichTextContent
              :content="answer.content"
              class="mt-4 text-[0.94rem] leading-8 text-[var(--text-primary)]"
            />

            <div
              v-if="answer.media.length"
              class="mt-4 grid gap-3 sm:grid-cols-2"
            >
              <div
                v-for="item in answer.media"
                :key="item.id || item.url"
                class="overflow-hidden rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)]"
              >
                <img loading="lazy" decoding="async"
                  v-if="!getAnswerMediaType(item).includes('video')"
                  :src="getAnswerMediaThumbnail(item)"
                  :alt="answer.content || 'Answer media'"
                  class="mx-auto aspect-[4/3] max-h-72 w-full object-contain"
                />
                <video
                  v-else
                  :src="getAnswerMediaUrl(item)"
                  class="mx-auto aspect-[4/3] max-h-72 w-full bg-black object-contain"
                  controls
                  playsinline
                />
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                class="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition"
                :class="
                  answer.isScored
                    ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
                "
                :disabled="activeAnswerActionId === answer.id || answer.authorUserId === authStore.userId"
                @click="toggleAnswerScore(answer)"
              >
                <ArrowUp class="h-3.5 w-3.5" />
                {{ answer.score }} score
              </button>
              <button
                type="button"
                class="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                @click="shareAnswer(answer)"
              >
                <Share2 class="h-3.5 w-3.5" />
                Share
              </button>
              <button
                type="button"
                class="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                @click="toggleAnswerComments(answer)"
              >
                <MessageSquare class="h-3.5 w-3.5" />
                {{ answer.comments }}
              </button>
              <button
                type="button"
                class="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition"
                :class="
                  answer.isSaved
                    ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
                "
                :disabled="activeAnswerActionId === answer.id"
                @click="toggleAnswerSave(answer)"
              >
                <Bookmark class="h-3.5 w-3.5" />
                {{ answer.isSaved ? 'Saved' : 'Save' }}
              </button>
              <button
                type="button"
                class="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                @click="reportAnswer(answer)"
              >
                <Flag class="h-3.5 w-3.5" />
                Report
              </button>
            </div>

            <section
              v-if="answer.isCommentsOpen"
              class="mt-4 rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)]"
            >
              <div class="flex flex-col gap-2 border-b border-[color:var(--border-soft)] p-3 sm:flex-row">
                <input
                  v-model="answer.commentInput"
                  type="text"
                  placeholder="Comment..."
                  class="h-9 min-w-0 flex-1 rounded-[0.7rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-[0.8rem] text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                  @keydown.enter.prevent="submitAnswerComment(answer)"
                />
                <button
                  type="button"
                  :disabled="activeAnswerActionId === answer.id || !answer.commentInput.trim()"
                  class="inline-flex h-9 items-center justify-center rounded-[0.7rem] bg-[var(--accent)] px-3 text-[0.8rem] font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
                  @click="submitAnswerComment(answer)"
                >
                  Add Comment
                </button>
              </div>
              <div v-if="answer.commentItems.length" class="divide-y divide-[color:var(--border-soft)]">
                <article
                  v-for="comment in answer.commentItems"
                  :key="comment.id"
                  class="p-3"
                >
                  <div class="flex flex-wrap items-center gap-2 text-[0.78rem] text-[var(--text-secondary)]">
                    <span class="font-semibold text-[var(--text-primary)]">{{ comment.authorName }}</span>
                    <span>{{ comment.time }}</span>
                  </div>
                  <RichTextContent
                    :content="comment.content"
                    class="mt-1.5 text-[0.82rem] leading-6 text-[var(--text-primary)]"
                  />
                </article>
              </div>
              <p v-else class="p-3 text-center text-[0.82rem] text-[var(--text-secondary)]">No comments yet.</p>
            </section>
          </article>
        </div>
      </div>
    </article>
  </section>

  <section v-else class="rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center">
    <h1 class="text-xl font-semibold text-[var(--text-primary)]">Question not found</h1>
    <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
      {{ questionError || 'The question you are looking for is not available.' }}
    </p>
  </section>

  <ResponsiveOverlay
    v-if="question"
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
              {{ question.title }}
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
</template>
