<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Award, BookOpen, Briefcase, ClipboardList, Edit2, ExternalLink, GraduationCap, Image as ImageIcon, MoreHorizontal, Rocket, Sparkles, Trash2, UploadCloud, UserCheck, UserPlus, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import { nigeriaProfileLocationOptions } from '@/data/locations'
import { ApiError } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
import { normalizeUserSkills, usersService } from '@/services/users'
import { mediaService } from '@/services/media'
import { postsService, type PostRecord } from '@/services/posts'
import { questionsService, type QuestionRecord } from '@/services/questions'
import { useAuthStore } from '@/stores/auth'
import { useSocialActionsStore } from '@/stores/socialActions'
import { getOptionalCount, getPostUserId } from '@/utils/postMapper'
import { getQuestionUserId } from '@/utils/questionMapper'
import { getDisplayName, toInitialCaps } from '@/utils/displayName'
import type { MyProfileData, UserSkill, UserPortfolio, UserCertification, UserEducation, UserExperience, UserFollower } from '@/services/users'

type ProfileUploadItem = {
  id: string
  title: string
  externalUrl?: string
  url: string
  mediaType: 'image' | 'video'
  isLocal?: boolean
}

const authStore = useAuthStore()
const socialActionsStore = useSocialActionsStore()
const route = useRoute()
const isLoadingProfile = ref(false)
const hasLoadedProfile = ref(false)
const isLoadingFollowers = ref(false)
const isLoadingSkills = ref(false)
const isLoadingPortfolios = ref(false)
const isLoadingCertifications = ref(false)
const isLoadingEducations = ref(false)
const isLoadingExperiences = ref(false)
const isLoadingActivity = ref(false)
const skillsLoadError = ref('')
const isProfileDetailsModalOpen = ref(false)
const isLoadingProfileDetails = ref(false)
const isSavingProfileDetails = ref(false)
const isSavingSectionEdit = ref(false)
const skills = ref<UserSkill[]>([])
const portfolios = ref<UserPortfolio[]>([])
const certifications = ref<UserCertification[]>([])
const educations = ref<UserEducation[]>([])
const experiences = ref<UserExperience[]>([])
const followers = ref<UserFollower[]>([])
const profileResponseData = ref<MyProfileData | null>(null)
const following = ref<Array<{
  id: string
  name: string
  avatar: string
  initials: string
}>>([])
const isUploadModalOpen = ref(false)
const isUploadingProfileMedia = ref(false)
const uploadFileInput = ref<HTMLInputElement | null>(null)
const uploadFile = ref<File | null>(null)
const uploadPreviewUrl = ref('')
const uploadFileName = ref('')
const profileUploads = ref<ProfileUploadItem[]>([])
const uploadForm = ref({
  title: '',
  externalUrl: '',
})
const followStates = ref<Record<string, boolean>>({})
const followToggles = ref<Record<string, boolean>>({})
const activeActionMenu = ref<{ type: 'skill' | 'portfolio' | 'certification' | 'education' | 'experience'; id: string } | null>(null)
const deletingItem = ref<string | null>(null)
const deleteModal = ref<{ isOpen: boolean; type?: 'skill' | 'portfolio' | 'certification' | 'education' | 'experience'; id?: string; label?: string }>({
  isOpen: false,
})
const editModal = ref<{ isOpen: boolean; type?: 'skill' | 'portfolio' | 'certification' | 'education' | 'experience'; id?: string }>({
  isOpen: false,
})
const profileModal = ref<null | 'score' | 'followers' | 'following'>(null)
const stats = ref({
  pages: 0,
  communities: 0,
  posts: 0,
  questions: 0,
  answers: 0,
  comments: 0,
  followers: 0,
})
const scoreEntries = ref<Array<{ id: string; title: string; community: string; score: number; typeLabel: string }>>([])

const optionalField = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed || undefined
}

const getStringField = (record: Record<string, unknown> | null | undefined, keys: string[]) => {
  for (const key of keys) {
    const value = record?.[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null

const getBooleanField = (record: Record<string, unknown> | null | undefined, keys: string[]) => {
  for (const key of keys) {
    const value = record?.[key]

    if (typeof value === 'boolean') {
      return value
    }
  }

  return undefined
}

const getAccountInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const isVideoMediaUrl = (url: string) => /\/video\/upload\/|\.(mp4|webm|mov|m4v)(?:[?#]|$)/i.test(url)

const hasProfileUploads = computed(() => profileUploads.value.length > 0)

const getPortfolioUploadUrl = (portfolio: UserPortfolio) =>
  portfolio.pictures?.find((picture) => /^https?:\/\//i.test(picture)) || ''

const mapPortfolioToUpload = (portfolio: UserPortfolio): ProfileUploadItem | null => {
  const url = getPortfolioUploadUrl(portfolio)

  if (!url) {
    return null
  }

  return {
    id: portfolio.id || `portfolio-upload-${portfolio.title || url}`,
    title: portfolio.title || 'Profile upload',
    ...(portfolio.link ? { externalUrl: portfolio.link } : {}),
    url,
    mediaType: isVideoMediaUrl(url) ? 'video' : 'image',
  }
}

const syncProfileUploadsFromPortfolios = () => {
  profileUploads.value = portfolios.value
    .map(mapPortfolioToUpload)
    .filter((item): item is ProfileUploadItem => Boolean(item))
}

const makeUploadClientId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const clearUploadSelection = (options?: { keepPreview?: boolean }) => {
  if (!options?.keepPreview && uploadPreviewUrl.value) {
    URL.revokeObjectURL(uploadPreviewUrl.value)
  }

  uploadFile.value = null
  uploadFileName.value = ''
  uploadPreviewUrl.value = ''

  if (uploadFileInput.value) {
    uploadFileInput.value.value = ''
  }
}

const openUploadModal = () => {
  uploadForm.value = { title: '', externalUrl: '' }
  clearUploadSelection()
  isUploadModalOpen.value = true
}

const selectUploadFile = (file?: File | null) => {
  if (!file) {
    return
  }

  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    toast.error('Please choose an image or video file.')
    return
  }

  clearUploadSelection()
  uploadFile.value = file
  uploadFileName.value = file.name
  uploadPreviewUrl.value = URL.createObjectURL(file)
}

const handleUploadFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  selectUploadFile(input.files?.[0])
}

const handleUploadDrop = (event: DragEvent) => {
  selectUploadFile(event.dataTransfer?.files?.[0])
}

const submitProfileUpload = async () => {
  if (isUploadingProfileMedia.value) {
    return
  }

  const title = uploadForm.value.title.trim()
  const externalUrl = uploadForm.value.externalUrl.trim()

  if (!title) {
    toast.error('Upload title is required.')
    return
  }

  if (!uploadFile.value) {
    toast.error('Choose an image or video to upload.')
    return
  }

  if (!authStore.authToken) {
    toast.error('Please sign in before uploading media.')
    return
  }

  const selectedFile = uploadFile.value
  const mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image'
  const toastId = toast.loading('Uploading media...')
  isUploadingProfileMedia.value = true

  try {
    const uploadResponse = await mediaService.uploadMediaFile(selectedFile, {
      kind: mediaType,
      title,
      token: authStore.authToken,
    })
    const remoteUrl = uploadResponse.data.url || uploadPreviewUrl.value
    const shouldKeepPreview = remoteUrl === uploadPreviewUrl.value
    const portfolioResponse = authStore.userId
      ? await usersService.addUserPortfolio(
          authStore.userId,
          {
            title,
            ...(externalUrl ? { link: externalUrl } : {}),
            pictures: [remoteUrl],
          },
          authStore.authToken,
        )
      : null
    const portfolio = portfolioResponse?.data

    profileUploads.value.unshift({
      id: portfolio?.id || uploadResponse.data.assetId || uploadResponse.data.id || makeUploadClientId(),
      title,
      ...(externalUrl ? { externalUrl } : {}),
      url: remoteUrl,
      mediaType,
      isLocal: shouldKeepPreview,
    })
    if (portfolio) {
      portfolios.value = [portfolio, ...portfolios.value]
    }

    toast.success('Upload added', { id: toastId })
    isUploadModalOpen.value = false
    uploadForm.value = { title: '', externalUrl: '' }
    clearUploadSelection({ keepPreview: shouldKeepPreview })
  } catch (error) {
    const message = getErrorMessage(error, 'Unable to upload this media.')
    toast.error('Upload failed', { id: toastId, description: message })
  } finally {
    isUploadingProfileMedia.value = false
  }
}

const toDateInputValue = (value?: string | null) => optionalField(value)?.slice(0, 10) || ''

const getSkillDisplayName = (skill: UserSkill) => skill.name || skill.skill || ''

const getProfileUserId = (data?: MyProfileData | null) =>
  data?.user?.id || data?.profile?.userId || authStore.userId

let skillsRequestId = 0

const toSkillViewItem = (skill: UserSkill, index = 0): UserSkill => {
  const name = getSkillDisplayName(skill)

  return {
    ...skill,
    id: skill.id || `skill-${name.toLowerCase().replace(/\s+/g, '-') || index}`,
    name,
    skill: typeof skill.skill === 'string' ? skill.skill : name,
  }
}

const loadUserSkills = async (userId: string) => {
  const requestId = ++skillsRequestId
  isLoadingSkills.value = true
  skillsLoadError.value = ''

  try {
    const response = await usersService.listUserSkills(userId, authStore.authToken)

    if (requestId !== skillsRequestId) {
      return
    }

    skills.value = normalizeUserSkills(response.data)
      .map(toSkillViewItem)
      .filter((skill) => skill.name)
  } catch (error) {
    if (requestId !== skillsRequestId) {
      return
    }

    skills.value = []
    skillsLoadError.value = getErrorMessage(error, 'Unable to load skills.')
  } finally {
    if (requestId === skillsRequestId) {
      isLoadingSkills.value = false
    }
  }
}

const toggleActionMenu = (type: 'skill' | 'portfolio' | 'certification' | 'education' | 'experience', id: string | undefined) => {
  if (!id) {
    return
  }

  activeActionMenu.value =
    activeActionMenu.value?.type === type && activeActionMenu.value?.id === id
      ? null
      : { type, id }
}

const closeActionMenu = () => {
  activeActionMenu.value = null
}

const handleActionMenuPointerDown = (event: PointerEvent) => {
  if (!activeActionMenu.value) {
    return
  }

  const target = event.target
  if (target instanceof Element && target.closest('[data-profile-action-menu]')) {
    return
  }

  closeActionMenu()
}

const isDeleting = (type: string, id: string | undefined) => {
  if (!id) {
    return false
  }
  return deletingItem.value === `${type}-${id}`
}

const openDeleteModal = (type: 'skill' | 'portfolio' | 'certification' | 'education' | 'experience', id: string | undefined, label: string) => {
  if (!id) {
    return
  }

  deleteModal.value = {
    isOpen: true,
    type,
    id,
    label,
  }

  closeActionMenu()
}

const closeDeleteModal = () => {
  deleteModal.value = { isOpen: false }
}

const editSkillForm = ref({
  skill: '',
  level: 'intermediate',
})
const editPortfolioForm = ref({
  title: '',
  description: '',
  link: '',
})
const editCertificationForm = ref({
  name: '',
  issuer: '',
  issueDate: '',
})
const editEducationForm = ref({
  school: '',
  degree: '',
  field: '',
  startDate: '',
  endDate: '',
})
const editExperienceForm = ref({
  company: '',
  title: '',
  employmentType: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
})

const openEditModal = (
  type: 'skill' | 'portfolio' | 'certification' | 'education' | 'experience',
  id: string | undefined,
) => {
  if (!id) {
    return
  }

  if (type === 'skill') {
    const item = skills.value.find((skill) => skill.id === id)
    if (!item) return
    editSkillForm.value = {
      skill: item.skill || item.name || '',
      level: item.level || 'intermediate',
    }
  }

  if (type === 'portfolio') {
    const item = portfolios.value.find((portfolio) => portfolio.id === id)
    if (!item) return
    editPortfolioForm.value = {
      title: item.title || '',
      description: item.description || '',
      link: item.link || '',
    }
  }

  if (type === 'certification') {
    const item = certifications.value.find((certification) => certification.id === id)
    if (!item) return
    editCertificationForm.value = {
      name: item.name || '',
      issuer: item.issuer || '',
      issueDate: toDateInputValue(item.issueDate),
    }
  }

  if (type === 'education') {
    const item = educations.value.find((education) => education.id === id)
    if (!item) return
    editEducationForm.value = {
      school: item.school || '',
      degree: item.degree || '',
      field: item.field || '',
      startDate: toDateInputValue(item.startDate),
      endDate: toDateInputValue(item.endDate),
    }
  }

  if (type === 'experience') {
    const item = experiences.value.find((experience) => experience.id === id)
    if (!item) return
    editExperienceForm.value = {
      company: item.company || '',
      title: item.title || '',
      employmentType: item.employmentType || '',
      startDate: toDateInputValue(item.startDate),
      endDate: toDateInputValue(item.endDate),
      isCurrent: item.isCurrent === 1 || item.isCurrent === true,
      description: item.description || '',
    }
  }

  editModal.value = { isOpen: true, type, id }
  closeActionMenu()
}

const closeEditModal = () => {
  if (isSavingSectionEdit.value) {
    return
  }

  editModal.value = { isOpen: false }
}

const openProfileModal = (type: 'score' | 'followers' | 'following') => {
  profileModal.value = type
}

const closeProfileModal = () => {
  profileModal.value = null
}

const confirmDelete = async () => {
  if (!deleteModal.value.type || !deleteModal.value.id) {
    return
  }

  await handleDelete(deleteModal.value.type, deleteModal.value.id)
  closeDeleteModal()
}

const handleDelete = async (
  type: 'skill' | 'portfolio' | 'certification' | 'education' | 'experience',
  id: string | undefined,
) => {
  if (!authStore.userId) {
    toast.error('Unable to delete item: missing user identity.')
    return
  }

  if (!id) {
    toast.error('Unable to delete item: missing ID.')
    closeActionMenu()
    return
  }

  const label = {
    skill: 'skill',
    portfolio: 'portfolio item',
    certification: 'certification',
    education: 'education entry',
    experience: 'experience entry',
  }[type]

  deletingItem.value = `${type}-${id}`

  try {
    switch (type) {
      case 'skill':
        await usersService.deleteUserSkill(authStore.userId, id, authStore.authToken)
        skills.value = skills.value.filter((item) => item.id !== id)
        break
      case 'portfolio':
        await usersService.deleteUserPortfolio(authStore.userId, id, authStore.authToken)
        portfolios.value = portfolios.value.filter((item) => item.id !== id)
        break
      case 'certification':
        await usersService.deleteUserCertification(authStore.userId, id, authStore.authToken)
        certifications.value = certifications.value.filter((item) => item.id !== id)
        break
      case 'education':
        await usersService.deleteUserEducation(authStore.userId, id, authStore.authToken)
        educations.value = educations.value.filter((item) => item.id !== id)
        break
      case 'experience':
        await usersService.deleteUserExperience(authStore.userId, id, authStore.authToken)
        experiences.value = experiences.value.filter((item) => item.id !== id)
        break
    }

    toast.success(`${label.charAt(0).toUpperCase() + label.slice(1)} deleted successfully.`)
  } catch (error) {
    const message = getErrorMessage(error, `Failed to delete ${label}.`)
    toast.error('Delete failed', { description: message })
  } finally {
    deletingItem.value = null
    closeActionMenu()
  }
}

const profileDetailsForm = ref({
  displayName: '',
  bio: '',
  location: '',
  currentWorkplace: '',
  currentJobTitle: '',
})

const loadRecentActivity = async (userId: string) => {
  isLoadingActivity.value = true

  try {
    const [postsResult, questionsResult] = await Promise.allSettled([
      postsService.listPosts({ per_page: 100, sort: '-createdAt' }, authStore.authToken),
      questionsService.listQuestions({ per_page: 100, sort: '-createdAt' }, authStore.authToken),
    ])
    const allPosts = postsResult.status === 'fulfilled' ? postsResult.value.data : []
    const allQuestions = questionsResult.status === 'fulfilled' ? questionsResult.value.data : []
    const userPosts = allPosts.filter((post: PostRecord) => getPostUserId(post) === userId)
    const userQuestions = allQuestions.filter((question: QuestionRecord) => getQuestionUserId(question) === userId)
    const [postCommentResults, questionAnswerResults] = await Promise.all([
      Promise.all(allPosts.map((post) => postsService.listComments(post.id, authStore.authToken).catch(() => null))),
      Promise.all(allQuestions.map((question) => questionsService.listAnswers(question.id, authStore.authToken).catch(() => null))),
    ])
    const userCommentCount = postCommentResults.reduce((total, response) => {
      const comments = response?.data ?? []
      return total + comments.filter((comment) => comment.user_id === userId).length
    }, 0)
    const userAnswers = questionAnswerResults.flatMap((response) => response?.data ?? []).filter((answer) => {
      const answerUserId = answer.userId || answer.user_id || ''
      return answerUserId === userId
    })

    const postScores = userPosts.map((post) => ({
      id: post.id,
      title: post.title,
      community: post.community?.name || 'Post',
      score: getOptionalCount(post.score, post.reactions_count, post.reaction_count),
      typeLabel: 'Post',
    }))
    const questionScores = userQuestions.map((question) => ({
      id: question.id,
      title: question.title,
      community: 'Question',
      score: getOptionalCount(question.score, question.reactions_count, question.reaction_count),
      typeLabel: 'Question',
    }))
    const answerScores = userAnswers.map((answer) => ({
      id: answer.id,
      title: answer.content || answer.body || answer.answer || 'Answer',
      community: 'Answer',
      score: getOptionalCount(answer.score, answer.reactions_count, answer.reaction_count),
      typeLabel: 'Answer',
    }))

    stats.value = {
      ...stats.value,
      posts: userPosts.length,
      questions: userQuestions.length,
      answers: userAnswers.length,
      comments: userCommentCount,
    }
    scoreEntries.value = [...postScores, ...questionScores, ...answerScores]
    socialActionsStore.setProfileStats(userId, {
      score: scoreEntries.value.reduce((total, entry) => total + entry.score, 0),
    })
  } catch {
    scoreEntries.value = []
  } finally {
    isLoadingActivity.value = false
  }
}

const loadProfile = async () => {
  if (!authStore.isAuthenticated) {
    return
  }

  isLoadingProfile.value = true

  try {
    const [profileResult, statsResult] = await Promise.allSettled([
      usersService.getMyProfile(authStore.authToken),
      usersService.getMyStats(authStore.authToken, { suppressErrorModal: true }),
    ])

    if (profileResult.status === 'rejected') {
      throw profileResult.reason
    }

    const profileResponse = profileResult.value
    profileResponseData.value = profileResponse.data ?? null

    authStore.setCurrentUser(profileResponse.data?.user ?? null)
    authStore.setUserProfile(profileResponse.data?.profile ?? null)
    hasLoadedProfile.value = true

    const loadedUserId = getProfileUserId(profileResponse.data)

    if (loadedUserId) {
      authStore.setUserId(loadedUserId)
    }

    if (profileResponse.data?.user?.email && typeof profileResponse.data.user.email === 'string') {
      authStore.signUpDraft.email = profileResponse.data.user.email
    }

    const responseDisplayName = getDisplayName(profileResponse.data?.user?.name)
    if (responseDisplayName) {
      authStore.signUpDraft.name = responseDisplayName
    }

    // Sync profile data to store for persistence across reloads
    if (profileResponse.data?.profile) {
      const profile = profileResponse.data.profile
      authStore.signUpDraft.name = profile.displayName || authStore.signUpDraft.name
      authStore.signUpDraft.username = profile.username || authStore.signUpDraft.username
      authStore.signUpDraft.headline = profile.bio || authStore.signUpDraft.headline
      authStore.signUpDraft.location = authStore.userProfile?.location || ''
      if (profile.avatar) {
        authStore.signUpDraft.avatar = profile.avatar
      }
      if (profile.banner) {
        authStore.signUpDraft.banner = profile.banner
      }
    }

    if (statsResult.status === 'fulfilled') {
      stats.value = {
        pages: statsResult.value.data?.pages ?? 0,
        communities: statsResult.value.data?.communities ?? 0,
        posts: statsResult.value.data?.posts ?? 0,
        questions: 0,
        answers: 0,
        comments: statsResult.value.data?.comments ?? 0,
        followers: 0,
      }
    } else {
      stats.value = {
        ...stats.value,
        pages: 0,
        communities: 0,
        posts: 0,
        questions: 0,
        answers: 0,
        comments: 0,
      }
    }

    if (loadedUserId) {
      await loadUserSkills(loadedUserId)
    } else {
      skills.value = []
      skillsLoadError.value = 'Unable to load skills because the profile response did not include a user id.'
    }

    const [portfoliosResult, certificationsResult, educationsResult, experiencesResult] =
      loadedUserId
        ? await Promise.allSettled([
            usersService.listUserPortfolios(loadedUserId, authStore.authToken),
            usersService.listUserCertifications(loadedUserId, authStore.authToken),
            usersService.listUserEducations(loadedUserId, authStore.authToken),
            usersService.listUserExperiences(loadedUserId, authStore.authToken),
          ])
        : []

    const sourcePortfolios = portfoliosResult?.status === 'fulfilled'
      ? portfoliosResult.value.data
      : profileResponse.data?.portfolios ?? []
    const sourceCertifications = certificationsResult?.status === 'fulfilled'
      ? certificationsResult.value.data
      : profileResponse.data?.certifications ?? []
    const sourceEducations = educationsResult?.status === 'fulfilled'
      ? educationsResult.value.data
      : profileResponse.data?.education ?? []
    const sourceExperiences = experiencesResult?.status === 'fulfilled'
      ? experiencesResult.value.data
      : profileResponse.data?.experiences ?? []

    portfolios.value = sourcePortfolios
    syncProfileUploadsFromPortfolios()

    certifications.value = sourceCertifications

    educations.value = sourceEducations

    experiences.value = sourceExperiences
    const currentExperience = sourceExperiences.find((experience) => Boolean(experience.isCurrent)) || sourceExperiences[0]
    const currentTitle = currentExperience?.title?.trim()
    const currentWorkplace = currentExperience?.company?.trim()

    if (currentTitle) {
      authStore.signUpDraft.jobTitle = currentTitle
    }

    if (currentWorkplace) {
      authStore.signUpDraft.workplace = currentWorkplace
    }

    // Load followers data separately
    if (profileResponse.data?.user?.id) {
      await loadFollowersData(profileResponse.data.user.id)
      await loadRecentActivity(profileResponse.data.user.id)
    }
  } catch (error) {
    isLoadingSkills.value = false
    if (error instanceof ApiError && error.status === 404) {
      authStore.setUserProfile(null)
      return
    }
  } finally {
    hasLoadedProfile.value = true
    isLoadingProfile.value = false
  }
}

const loadFollowersData = async (userId: string) => {
  isLoadingFollowers.value = true

  try {
    const response = await usersService.listFollowers(userId, authStore.authToken)
    const followerRecords = response.data ?? []
    const enrichedFollowers = await Promise.all(
      followerRecords.map(async (follower) => {
        const followerRecord = follower as Record<string, unknown>
        const followerId = getStringField(followerRecord, ['followerId', 'follower_id', 'userId', 'user_id'])

        if (!followerId) {
          return follower
        }

        const [profileResponse, userResponse] = await Promise.all([
          usersService.getUserProfile(followerId, authStore.authToken).catch(() => null),
          usersService.getUser(followerId, authStore.authToken).catch(() => null),
        ])

        return {
          ...follower,
          follower: profileResponse?.data?.user || userResponse?.data || follower.follower,
          followerProfile: profileResponse?.data?.profile || follower.followerProfile,
        }
      }),
    )

    followers.value = enrichedFollowers
    stats.value.followers = followers.value.length
    const nextFollowStates = { ...followStates.value }

    for (const follower of followers.value) {
      const followerRecord = follower as Record<string, unknown>
      const followerId = getStringField(followerRecord, ['followerId', 'follower_id', 'userId', 'user_id'])
      const explicitState = getBooleanField(followerRecord, ['isFollowing', 'is_following', 'followedByMe', 'followed_by_me'])

      if (followerId) {
        nextFollowStates[followerId] = explicitState ?? true
        socialActionsStore.setUserFollowingState(followerId, explicitState ?? true)
      }
    }

    followStates.value = nextFollowStates
    following.value = followerAccounts.value
      .filter((account) => account.isFollowing && !account.isCurrentUser)
      .map((account) => ({
        id: account.id,
        name: account.name,
        avatar: account.avatar,
        initials: account.initials,
      }))
    socialActionsStore.setProfileStats(userId, {
      followers: followers.value.length,
      following: following.value.length,
    })
  } catch (error) {
    followers.value = []
    stats.value.followers = 0
    socialActionsStore.setProfileStats(userId, { followers: 0 })
  } finally {
    isLoadingFollowers.value = false
  }
}

const getFollowerAccount = (follower: UserFollower) => {
  const followerRecord = follower as Record<string, unknown>
  const userRecord =
    asRecord(followerRecord.follower) ||
    asRecord(followerRecord.user) ||
    asRecord(followerRecord.account)
  const profileRecord =
    asRecord(followerRecord.followerProfile) ||
    asRecord(followerRecord.profile) ||
    asRecord(userRecord?.profile)
  const id =
    getStringField(followerRecord, ['followerId', 'follower_id', 'userId', 'user_id']) ||
    getStringField(userRecord, ['id', 'userId', 'user_id'])
  const name = getDisplayName(
    getStringField(profileRecord, ['displayName', 'display_name', 'name']),
    getStringField(userRecord, ['name', 'displayName', 'display_name', 'fullName', 'full_name', 'username']),
    id ? `User ${id.slice(0, 8)}` : 'User',
  )
  const avatar =
    getStringField(profileRecord, ['avatar', 'avatarUrl', 'avatar_url', 'profileImage', 'profile_image']) ||
    getStringField(userRecord, ['avatar', 'avatarUrl', 'avatar_url', 'profileImage', 'profile_image'])
  const explicitState = getBooleanField(followerRecord, ['isFollowing', 'is_following', 'followedByMe', 'followed_by_me'])

  return {
    id,
    name,
    avatar,
    initials: getAccountInitials(name),
    isCurrentUser: Boolean(id && id === authStore.userId),
    isFollowing: id ? followStates.value[id] ?? explicitState ?? false : false,
  }
}

const followerAccounts = computed(() =>
  followers.value
    .map(getFollowerAccount)
    .filter((account) => account.id),
)

const toggleFollowFromModal = async (targetUserId: string) => {
  if (!targetUserId || followToggles.value[targetUserId]) {
    return
  }

  if (authStore.userId && targetUserId === authStore.userId) {
    toast.info('This is your profile', {
      description: 'You cannot follow your own account.',
    })
    return
  }

  if (!authStore.isAuthenticated) {
    return
  }

  followToggles.value[targetUserId] = true

  try {
    if (followStates.value[targetUserId]) {
      await socialActionsStore.unfollowUser(targetUserId)
      followStates.value = {
        ...followStates.value,
        [targetUserId]: false,
      }
      following.value = following.value.filter((account) => account.id !== targetUserId)
      toast.success('User unfollowed.')
      return
    }

    await socialActionsStore.followUser(targetUserId)
    followStates.value = {
      ...followStates.value,
      [targetUserId]: true,
    }
    const account = followerAccounts.value.find((item) => item.id === targetUserId)
    if (account && !following.value.some((item) => item.id === targetUserId)) {
      following.value = [
        ...following.value,
        {
          id: account.id,
          name: account.name,
          avatar: account.avatar,
          initials: account.initials,
        },
      ]
    }
    toast.success('Following user.')
  } catch (error) {
    const message = getErrorMessage(error, 'Unable to update follow status.')
    toast.error('Follow action failed', { description: message })
  } finally {
    followToggles.value[targetUserId] = false
  }
}

const prefillProfileDetailsForm = (data?: MyProfileData | null) => {
  const profileData = data?.profile ?? authStore.userProfile
  const userData = data?.user ?? authStore.currentUser
  const currentExperience =
    data?.experiences?.find((experience) => Boolean(experience.isCurrent)) ||
    data?.experiences?.[0] ||
    featuredExperience.value

  profileDetailsForm.value = {
    displayName:
      toInitialCaps(getDisplayName(
        profileData?.displayName,
        userData?.name,
        authStore.signUpDraft.name,
        profileData?.username,
      )),
    bio: profileData?.bio || '',
    location: toInitialCaps(profileData?.location || authStore.signUpDraft.location || ''),
    currentWorkplace: toInitialCaps(
      currentExperience?.company ||
        profileData?.currentWorkspace ||
        profileData?.current_workspace ||
        authStore.signUpDraft.workplace ||
        '',
      { keepSmallWords: true },
    ),
    currentJobTitle: toInitialCaps(
      currentExperience?.title ||
        profileData?.currentJobTitle ||
        profileData?.current_job_title ||
        authStore.signUpDraft.jobTitle ||
        authStore.signUpDraft.courseOfStudy ||
        '',
      { keepSmallWords: true },
    ),
  }
}

const openProfileDetailsModal = async () => {
  if (isLoadingProfileDetails.value) {
    return
  }

  prefillProfileDetailsForm(profileResponseData.value)
  isProfileDetailsModalOpen.value = true
  isLoadingProfileDetails.value = true

  try {
    const response = await usersService.getMyProfile(authStore.authToken)
    const data = response.data ?? null

    profileResponseData.value = data
    authStore.setCurrentUser(data?.user ?? null)
    authStore.setUserProfile(data?.profile ?? null)
    if (data?.experiences) {
      experiences.value = data.experiences
    }
    prefillProfileDetailsForm(data)
  } catch (error) {
    toast.error('Unable to refresh profile details', {
      description: getErrorMessage(error, 'Using the most recently loaded profile information.'),
    })
  } finally {
    isLoadingProfileDetails.value = false
  }
}

const closeProfileDetailsModal = () => {
  if (isSavingProfileDetails.value) {
    return
  }

  isProfileDetailsModalOpen.value = false
}

const upsertCurrentExperience = async () => {
  if (!authStore.userId) {
    return
  }

  const company = toInitialCaps(profileDetailsForm.value.currentWorkplace, { keepSmallWords: true })
  const title = toInitialCaps(profileDetailsForm.value.currentJobTitle, { keepSmallWords: true })

  if (!company && !title) {
    return
  }

  if (!company || !title) {
    throw new Error('Current work place and current job title are required together.')
  }

  const existingExperience = featuredExperience.value
  const payload = {
    company,
    title,
    employmentType: existingExperience?.employmentType || 'full-time',
    startDate: existingExperience?.startDate || new Date().toISOString().slice(0, 10),
    isCurrent: existingExperience?.isCurrent === undefined ? true : Boolean(existingExperience.isCurrent),
    description: existingExperience?.description || '',
  }

  const payloadWithOptionalEndDate = {
    ...payload,
    ...(!payload.isCurrent && existingExperience?.endDate ? { endDate: existingExperience.endDate } : {}),
  }

  if (existingExperience?.id) {
    const response = await usersService.addUserExperience(
      authStore.userId,
      payloadWithOptionalEndDate,
      authStore.authToken,
      { suppressErrorModal: true },
    )
    await usersService.deleteUserExperience(authStore.userId, existingExperience.id, authStore.authToken)
    experiences.value = experiences.value.map((experience) =>
      experience.id === existingExperience.id ? response.data : experience,
    )
    return
  }

  const response = await usersService.addUserExperience(
    authStore.userId,
    payloadWithOptionalEndDate,
    authStore.authToken,
    { suppressErrorModal: true },
  )
  experiences.value = [response.data, ...experiences.value]
}

const saveProfileDetails = async () => {
  if (!authStore.userId || isSavingProfileDetails.value) {
    return
  }

  isSavingProfileDetails.value = true

  try {
    const displayName = toInitialCaps(profileDetailsForm.value.displayName)
    const bio = profileDetailsForm.value.bio.trim()
    const location = toInitialCaps(profileDetailsForm.value.location)
    const currentWorkspace = toInitialCaps(profileDetailsForm.value.currentWorkplace, { keepSmallWords: true })
    const currentJobTitle = toInitialCaps(profileDetailsForm.value.currentJobTitle, { keepSmallWords: true })
    const profilePayload = {
      username: authStore.userProfile?.username || authStore.signUpDraft.username,
      displayName,
      bio,
      location,
      website: authStore.userProfile?.website || authStore.signUpDraft.website || '',
      linkedin: authStore.userProfile?.linkedin || authStore.signUpDraft.linkedin || '',
      github: authStore.userProfile?.github || authStore.signUpDraft.github || '',
      ...(currentJobTitle ? { currentJobTitle } : {}),
      ...(currentWorkspace ? { currentWorkspace } : {}),
    }

    const userResponse = displayName
      ? await usersService.updateUser(
          authStore.userId,
          {
            name: displayName,
            displayName,
          },
          authStore.authToken,
        )
      : null

    const profileResponse = await usersService.saveUserProfile(
      authStore.userId,
      profilePayload,
      Boolean(authStore.userProfile?.id),
      authStore.authToken,
      { suppressErrorModal: true },
    )
    const savedProfile = profileResponse.data ?? authStore.userProfile

    try {
      await upsertCurrentExperience()
    } catch {
      const company = toInitialCaps(profileDetailsForm.value.currentWorkplace, { keepSmallWords: true })
      const title = toInitialCaps(profileDetailsForm.value.currentJobTitle, { keepSmallWords: true })

      if (company && title) {
        experiences.value = [
          {
            id: `local-current-${authStore.userId}`,
            userId: authStore.userId,
            company,
            title,
            employmentType: 'full-time',
            startDate: new Date().toISOString().slice(0, 10),
            endDate: null,
            isCurrent: true,
            description: '',
          },
          ...experiences.value.filter((experience) => experience.id !== `local-current-${authStore.userId}`),
        ]
      }
    }

    authStore.signUpDraft.name = displayName
    authStore.signUpDraft.headline = bio
    authStore.signUpDraft.location = location
    if (userResponse?.data?.user) {
      authStore.setCurrentUser(userResponse.data.user)
    }
    authStore.setUserProfileOverride({
      ...(userResponse?.data?.profile ?? savedProfile ?? {}),
      displayName,
      bio,
      location,
      ...(currentJobTitle ? { currentJobTitle } : {}),
      ...(currentWorkspace ? { currentWorkspace } : {}),
    })

    isProfileDetailsModalOpen.value = false
    toast.success('Profile updated.')
  } catch (error) {
    const message = getErrorMessage(error, 'We could not save your profile details.')

    toast.error('Update failed', { description: message })
  } finally {
    isSavingProfileDetails.value = false
  }
}

const replaceSectionItem = async () => {
  if (!authStore.userId || !editModal.value.type || !editModal.value.id) {
    return
  }

  const { type, id } = editModal.value
  isSavingSectionEdit.value = true

  try {
    if (type === 'skill') {
      if (!editSkillForm.value.skill.trim()) {
        toast.error('Skill name is required.')
        return
      }

      const response = await usersService.addUserSkill(
        authStore.userId,
        {
          skill: editSkillForm.value.skill.trim(),
          level: editSkillForm.value.level,
        },
        authStore.authToken,
      )
      await usersService.deleteUserSkill(authStore.userId, id, authStore.authToken)
      skills.value = skills.value.map((skill) =>
        skill.id === id
          ? toSkillViewItem({
              ...response.data,
              id: response.data.id || id,
              name: response.data.name || response.data.skill || editSkillForm.value.skill.trim(),
              level: response.data.level || editSkillForm.value.level,
            })
          : skill,
      )
    }

    if (type === 'portfolio') {
      if (!editPortfolioForm.value.title.trim()) {
        toast.error('Project title is required.')
        return
      }

      const description = optionalField(editPortfolioForm.value.description)
      const link = optionalField(editPortfolioForm.value.link)
      const response = await usersService.addUserPortfolio(
        authStore.userId,
        {
          title: editPortfolioForm.value.title.trim(),
          ...(description ? { description } : {}),
          ...(link ? { link } : {}),
        },
        authStore.authToken,
      )
      await usersService.deleteUserPortfolio(authStore.userId, id, authStore.authToken)
      portfolios.value = portfolios.value.map((portfolio) => (portfolio.id === id ? response.data : portfolio))
    }

    if (type === 'certification') {
      if (!editCertificationForm.value.name.trim()) {
        toast.error('Certificate name is required.')
        return
      }

      const issuer = optionalField(editCertificationForm.value.issuer)
      const issueDate = optionalField(editCertificationForm.value.issueDate)
      const response = await usersService.addUserCertification(
        authStore.userId,
        {
          name: editCertificationForm.value.name.trim(),
          ...(issuer ? { issuer } : {}),
          ...(issueDate ? { issueDate } : {}),
        },
        authStore.authToken,
      )
      await usersService.deleteUserCertification(authStore.userId, id, authStore.authToken)
      certifications.value = certifications.value.map((certification) => (
        certification.id === id ? response.data : certification
      ))
    }

    if (type === 'education') {
      if (!editEducationForm.value.school.trim()) {
        toast.error('School name is required.')
        return
      }

      const degree = optionalField(editEducationForm.value.degree)
      const field = optionalField(editEducationForm.value.field)
      const startDate = optionalField(editEducationForm.value.startDate)
      const endDate = optionalField(editEducationForm.value.endDate)
      const response = await usersService.addUserEducation(
        authStore.userId,
        {
          school: editEducationForm.value.school.trim(),
          ...(degree ? { degree } : {}),
          ...(field ? { field } : {}),
          ...(startDate ? { startDate } : {}),
          ...(endDate ? { endDate } : {}),
        },
        authStore.authToken,
      )
      await usersService.deleteUserEducation(authStore.userId, id, authStore.authToken)
      educations.value = educations.value.map((education) => (education.id === id ? response.data : education))
    }

    if (type === 'experience') {
      if (!editExperienceForm.value.company.trim() || !editExperienceForm.value.title.trim()) {
        toast.error('Company and job title are required.')
        return
      }

      const employmentType = optionalField(editExperienceForm.value.employmentType)
      const startDate = optionalField(editExperienceForm.value.startDate)
      const endDate = optionalField(editExperienceForm.value.endDate)
      const description = optionalField(editExperienceForm.value.description)
      const response = await usersService.addUserExperience(
        authStore.userId,
        {
          company: toInitialCaps(editExperienceForm.value.company, { keepSmallWords: true }),
          title: toInitialCaps(editExperienceForm.value.title, { keepSmallWords: true }),
          isCurrent: editExperienceForm.value.isCurrent,
          ...(employmentType ? { employmentType } : {}),
          ...(startDate ? { startDate } : {}),
          ...(description ? { description } : {}),
          ...(!editExperienceForm.value.isCurrent && endDate ? { endDate } : {}),
        },
        authStore.authToken,
      )
      await usersService.deleteUserExperience(authStore.userId, id, authStore.authToken)
      experiences.value = experiences.value.map((experience) => (experience.id === id ? response.data : experience))
    }

    editModal.value = { isOpen: false }
    toast.success('Updated successfully.')
    void loadProfile()
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to update item.')

    toast.error('Update failed', { description: message })
  } finally {
    isSavingSectionEdit.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleActionMenuPointerDown)
  void loadProfile()
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleActionMenuPointerDown)
  clearUploadSelection()

  profileUploads.value.forEach((item) => {
    if (item.isLocal) {
      URL.revokeObjectURL(item.url)
    }
  })
})

// Refresh data when navigating to this route
watch(
  () => route.path,
  () => {
    if (route.path === '/profile') {
      void loadProfile()
    }
  },
)

const profile = computed(() => {
  const draft = authStore.signUpDraft
  const apiProfile = authStore.userProfile
  const apiUser = authStore.currentUser
  const name = toInitialCaps(getDisplayName(
    apiProfile?.displayName ||
      '',
    getStringField(apiUser, ['name', 'displayName', 'fullName', 'full_name']),
    draft.name,
    apiProfile?.username,
    getStringField(apiUser, ['username']),
    draft.username,
  ))
  const username = apiProfile?.username || getStringField(apiUser, ['username']) || draft.username
  const email = getStringField(apiUser, ['email']) || draft.email
  const phone = getStringField(apiProfile, ['phone', 'phoneNumber', 'phone_number']) || getStringField(apiUser, ['phone', 'phoneNumber', 'phone_number']) || draft.phone
  const location = toInitialCaps(apiProfile?.location || draft.location || [draft.state, draft.country].filter(Boolean).join(', '))
  const bio = apiProfile?.bio || profileResponseData.value?.bio || ''
  const initialsSource = name || username

  return {
    name,
    bio,
    username,
    email,
    phone,
    location,
    website: apiProfile?.website || draft.website,
    avatar: apiProfile?.avatar || draft.avatar || '',
    banner: apiProfile?.banner || draft.banner || '',
    initials: initialsSource
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  }
})

const featuredExperience = computed(() => experiences.value[0] ?? null)

const featuredSkill = computed(() => skills.value[0]?.name || '')

const profileSkillLabel = computed(() => toInitialCaps(
  featuredExperience.value?.title ||
    authStore.signUpDraft.jobTitle ||
    authStore.signUpDraft.courseOfStudy ||
    featuredSkill.value ||
    '',
  { keepSmallWords: true },
))
const profileCompanyLabel = computed(() => toInitialCaps(
  featuredExperience.value?.company ||
    authStore.signUpDraft.workplace ||
    authStore.signUpDraft.university ||
    '',
  { keepSmallWords: true },
))
const profileCountryLabel = computed(() => toInitialCaps(profile.value.location || ''))
const profileHeadlineParts = computed(() =>
  [profileSkillLabel.value, profileCompanyLabel.value, profileCountryLabel.value].filter(Boolean),
)

const totalTScore = computed(() =>
  authStore.userId
    ? socialActionsStore.getProfileStats(authStore.userId).score
    : scoreEntries.value.reduce((total, entry) => total + entry.score, 0),
)

const globalFollowerCount = computed(() =>
  authStore.userId
    ? socialActionsStore.getProfileStats(authStore.userId).followers
    : stats.value.followers,
)

const globalFollowingCount = computed(() =>
  authStore.userId
    ? socialActionsStore.getProfileStats(authStore.userId).following
    : following.value.length,
)

const summaryCards = computed(() => [
  {
    label: 'Comments',
    value: stats.value.comments || 0,
    icon: ClipboardList,
    accentClass: 'bg-[var(--accent-soft)] text-[var(--accent-strong)]',
  },
  {
    label: 'Questions',
    value: stats.value.questions || 0,
    icon: Sparkles,
    accentClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    label: 'Answers',
    value: stats.value.answers || 0,
    icon: Rocket,
    accentClass: 'bg-amber-100 text-amber-700',
  },
  {
    label: 'Posts',
    value: stats.value.posts || 0,
    icon: BookOpen,
    accentClass: 'bg-violet-100 text-violet-700',
  },
])

const profileModalTitle = computed(() => {
  if (profileModal.value === 'score') {
    return 'T.Scores'
  }

  if (profileModal.value === 'followers') {
    return 'Followers'
  }

  if (profileModal.value === 'following') {
    return 'Following'
  }

  return ''
})

const editModalTitle = computed(() => {
  const titles = {
    skill: 'Edit Skill',
    portfolio: 'Edit Project',
    certification: 'Edit Professional Certificate',
    education: 'Edit Education',
    experience: 'Edit Experience',
  }

  return editModal.value.type ? titles[editModal.value.type] : 'Edit item'
})
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
    <section class="overflow-hidden rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
      <!-- Banner hidden for now until live banner data is ready for display. -->
      <div v-if="false" class="relative aspect-[4/1] min-h-36 overflow-hidden bg-[var(--surface-secondary)]">
        <img loading="lazy" decoding="async"
          v-if="profile.banner"
          :src="profile.banner"
          alt="Profile banner"
          class="h-full w-full object-cover"
        />
        <div
          v-else
          class="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_16%,white),color-mix(in_srgb,var(--surface-secondary)_80%,white))] text-sm font-semibold text-[var(--text-secondary)]"
        >
          Banner
        </div>
        <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,12,27,0.04),rgba(12,12,27,0.28))]" />
      </div>

      <div class="relative border-b border-[color:var(--border-soft)] px-5 pb-6 pt-4 sm:px-7 lg:px-9 lg:pb-7 lg:pt-5">
        <div class="absolute right-0 top-0 hidden h-full w-48 lg:block">
          <div class="absolute right-10 top-0 h-full w-px bg-[var(--accent-soft)] rotate-[-32deg]" />
          <div class="absolute right-20 top-0 h-full w-px bg-[var(--accent-soft)] rotate-[-32deg]" />
          <div class="absolute right-[7.5rem] top-0 h-full w-px bg-[var(--accent-soft)] rotate-[-32deg]" />
        </div>

        <div class="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
            <div class="h-24 w-24 overflow-hidden rounded-full border-4 border-[var(--surface-primary)] bg-[var(--surface-secondary)] shadow-[var(--shadow-elevated)]">
              <img loading="lazy" decoding="async"
                v-if="profile.avatar"
                :src="profile.avatar"
                alt="Profile avatar"
                class="h-full w-full object-cover"
              />
              <span
                v-else
                class="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_84%,white),color-mix(in_srgb,var(--accent-strong)_72%,white))] text-2xl font-semibold text-white"
              >
                {{ profile.initials }}
              </span>
            </div>

            <div class="min-w-0">
              <div class="flex items-center justify-center gap-2 sm:justify-start">
                <h2
                  v-if="profile.name"
                  class="text-lg font-semibold tracking-tight text-[var(--text-primary)] sm:text-xl"
                >
                  {{ profile.name }}
                </h2>
                <span
                  v-else
                  class="block h-6 w-48 max-w-full animate-pulse rounded-full bg-[var(--surface-muted)]"
                  aria-label="Loading profile name"
                />
                <button
                  type="button"
                  :disabled="isLoadingProfileDetails"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--accent-strong)] transition hover:bg-[var(--surface-secondary)] disabled:cursor-wait disabled:opacity-50"
                  :aria-label="isLoadingProfileDetails ? 'Loading profile details' : 'Edit display name'"
                  @click="openProfileDetailsModal"
                >
                  <Edit2 class="h-4 w-4" />
                </button>
              </div>
              <div v-if="profileHeadlineParts.length" class="mt-0.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-sm leading-5 text-[var(--text-secondary)] sm:justify-start">
                <template v-for="(part, index) in profileHeadlineParts" :key="part">
                  <span v-if="index">-</span>
                  <span>{{ part }}</span>
                </template>
              </div>
              <div
                v-else
                class="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start"
                aria-label="Loading profile details"
              >
                <span class="h-3.5 w-24 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                <span class="h-3.5 w-32 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                <span class="h-3.5 w-20 animate-pulse rounded-full bg-[var(--surface-muted)]" />
              </div>
              <div class="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold leading-5 sm:justify-start sm:text-sm">
                <button
                  type="button"
                  class="text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                  @click="openProfileModal('score')"
                >
                  {{ totalTScore }} T.Scores
                </button>
                <span class="text-[var(--border-strong,var(--border-soft))]">|</span>
                <button
                  type="button"
                  class="text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                  @click="openProfileModal('followers')"
                >
                  {{ globalFollowerCount }} followers
                </button>
                <span class="text-[var(--border-strong,var(--border-soft))]">|</span>
                <button
                  type="button"
                  class="text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                  @click="openProfileModal('following')"
                >
                  {{ globalFollowingCount }} following
                </button>
              </div>
            </div>
          </div>

          <RouterLink
            to="/profile/edit"
            class="z-10 inline-flex items-center justify-center gap-3 self-center rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] sm:absolute sm:right-0 sm:top-4 sm:self-auto lg:top-1"
          >
            <Edit2 class="h-4 w-4" />
            Edit Profile
          </RouterLink>
        </div>
      </div>

      <div class="space-y-8 px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
        <div class="max-w-5xl space-y-5 text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.95rem]">
          <p v-if="profile.bio" class="whitespace-pre-line">
            {{ profile.bio }}
          </p>
          <div v-else-if="isLoadingProfile && !hasLoadedProfile" class="space-y-3 py-2" aria-label="Loading profile about information">
            <span class="block h-4 w-full animate-pulse rounded-full bg-[var(--surface-muted)]" />
            <span class="block h-4 w-5/6 animate-pulse rounded-full bg-[var(--surface-muted)]" />
            <span class="block h-4 w-2/3 animate-pulse rounded-full bg-[var(--surface-muted)]" />
          </div>
          <p v-else>No about information added yet.</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article
            v-for="card in summaryCards"
            :key="card.label"
            class="flex items-center gap-4 rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-5 py-5 shadow-[var(--shadow-soft)]"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[0.75rem]"
              :class="card.accentClass"
            >
              <component :is="card.icon" class="h-5 w-5" />
            </div>
            <div>
              <p class="text-[1.55rem] font-semibold leading-none text-[var(--text-primary)]">
                {{ card.value }}
              </p>
              <p class="mt-1.5 text-sm font-medium text-[var(--text-secondary)] sm:text-[1rem]">
                {{ card.label }}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <div v-if="isLoadingProfile" class="animate-pulse rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4">
      <div class="h-4 w-40 rounded-full bg-[var(--surface-muted)]" />
      <div class="mt-3 h-3 w-64 max-w-full rounded-full bg-[var(--surface-muted)]" />
    </div>

    <div class="space-y-6">
      <div class="flex flex-col gap-6">
        <section id="skills" class="order-5 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Skills</h2>
            <Award class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="isLoadingSkills" class="flex animate-pulse flex-wrap gap-3 py-2">
            <div v-for="item in 4" :key="item" class="h-11 w-32 rounded-full bg-[var(--surface-muted)]" />
          </div>

          <div v-else-if="skills.length > 0" class="flex flex-wrap gap-2 sm:gap-3">
            <div
              v-for="skill in skills"
              :key="skill.id"
              class="inline-flex max-w-full items-center gap-2 rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 py-2 shadow-[var(--shadow-soft)] sm:gap-3 sm:px-4 sm:py-3"
            >
              <span class="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">
                {{ skill.name }}
              </span>
              <div class="relative" data-profile-action-menu>
                <button
                  type="button"
                  class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-tertiary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)] sm:h-7 sm:w-7"
                  @click.stop="toggleActionMenu('skill', skill.id)"
                  aria-label="Open skill actions"
                >
                  <MoreHorizontal class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>

                <div
                  v-if="activeActionMenu?.type === 'skill' && activeActionMenu?.id === skill.id"
                  class="absolute right-0 z-10 mt-2 min-w-[10rem] overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
                >
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                    @click="openEditModal('skill', skill.id)"
                  >
                    <Edit2 class="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-[var(--surface-secondary)]"
                    @click="openDeleteModal('skill', skill.id, skill.name || 'skill')"
                    :disabled="isDeleting('skill', skill.id)"
                  >
                    <Trash2 class="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="skillsLoadError" class="text-center py-8 text-sm text-[var(--danger)]">
            <p class="mb-3">{{ skillsLoadError }}</p>
            <button
              type="button"
              class="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] transition"
              @click="authStore.userId && loadUserSkills(authStore.userId)"
            >
              Retry loading skills →
            </button>
          </div>

          <div v-else class="text-center py-8 text-sm text-[var(--text-secondary)]">
            <p class="mb-3">No skills added yet.</p>
            <RouterLink
              to="/profile/edit"
              class="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] transition"
            >
              Add your first skill →
            </RouterLink>
          </div>
        </section>

        <!-- Portfolio Section -->
        <section id="portfolio" class="order-4 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Projects</h2>
            <BookOpen class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="isLoadingPortfolios" class="grid animate-pulse gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div v-for="item in 3" :key="item" class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4">
              <div class="h-4 w-3/4 rounded-full bg-[var(--surface-muted)]" />
              <div class="mt-3 h-3 w-full rounded-full bg-[var(--surface-muted)]" />
              <div class="mt-2 h-3 w-2/3 rounded-full bg-[var(--surface-muted)]" />
            </div>
          </div>

          <div v-else-if="portfolios.length > 0" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="portfolio in portfolios"
              :key="portfolio.id"
              class="min-w-0 overflow-hidden flex h-full flex-col rounded-[1.1rem] bg-[var(--surface-secondary)] p-4 border border-[color:var(--border-soft)] transition hover:border-[var(--accent)] sm:p-5"
            >
              <div v-if="portfolio.pictures?.[0]" class="-mx-4 -mt-4 mb-4 aspect-video overflow-hidden rounded-t-[1.1rem] bg-[var(--surface-muted)] sm:-mx-5 sm:-mt-5">
                <video
                  v-if="isVideoMediaUrl(portfolio.pictures[0])"
                  :src="portfolio.pictures[0]"
                  class="h-full w-full object-cover"
                  controls
                  playsinline
                  preload="metadata"
                />
                <img loading="lazy" decoding="async"
                  v-else
                  :src="portfolio.pictures[0]"
                  :alt="`${portfolio.title || 'Project'} media`"
                  class="h-full w-full object-cover"
                />
              </div>
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <p class="text-lg font-semibold text-[var(--text-primary)] break-words">{{ portfolio.title }}</p>
                  <p v-if="portfolio.description" class="mt-3 line-clamp-5 break-words text-sm leading-6 text-[var(--text-secondary)]">
                    {{ portfolio.description }}
                  </p>
                  <a
                    v-if="portfolio.link"
                    :href="portfolio.link"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-strong)] transition"
                  >
                    Visit project
                    <ExternalLink class="h-4 w-4" />
                  </a>
                </div>

                <div class="relative" data-profile-action-menu>
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                    @click.stop="toggleActionMenu('portfolio', portfolio.id)"
                  >
                    <MoreHorizontal class="h-5 w-5" />
                  </button>

                  <div
                    v-if="activeActionMenu?.type === 'portfolio' && activeActionMenu?.id === portfolio.id"
                    class="absolute right-0 z-10 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                      @click="openEditModal('portfolio', portfolio.id)"
                    >
                      <Edit2 class="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-[var(--surface-secondary)]"
                      @click="openDeleteModal('portfolio', portfolio.id, 'portfolio item')"
                      :disabled="isDeleting('portfolio', portfolio.id)"
                    >
                      <Trash2 class="h-4 w-4" />
                      Delete item
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div v-else class="text-center py-8 text-sm text-[var(--text-secondary)]">
            <p class="mb-3">No portfolio items added yet.</p>
            <RouterLink
              to="/profile/edit"
              class="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] transition"
            >
              Showcase your work →
            </RouterLink>
          </div>
        </section>

        <!-- Certifications Section -->
        <section id="certifications" class="order-3 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Professional Certifications</h2>
            <Award class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="isLoadingCertifications" class="grid animate-pulse gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div v-for="item in 3" :key="item" class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4">
              <div class="h-4 w-3/4 rounded-full bg-[var(--surface-muted)]" />
              <div class="mt-3 h-3 w-1/2 rounded-full bg-[var(--surface-muted)]" />
            </div>
          </div>

          <div v-else-if="certifications.length > 0" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="certification in certifications"
              :key="certification.id"
              class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-semibold text-[var(--text-primary)]">{{ certification.name }}</p>
                  <p v-if="certification.issuer" class="text-sm text-[var(--text-secondary)]">{{ certification.issuer }}</p>
                  <p v-if="certification.issueDate" class="text-xs text-[var(--text-tertiary)] mt-1">Issued: {{ new Date(certification.issueDate).toLocaleDateString() }}</p>
                </div>

                <div class="relative" data-profile-action-menu>
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                    @click.stop="toggleActionMenu('certification', certification.id)"
                  >
                    <MoreHorizontal class="h-5 w-5" />
                  </button>

                  <div
                    v-if="activeActionMenu?.type === 'certification' && activeActionMenu?.id === certification.id"
                    class="absolute right-0 z-10 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                      @click="openEditModal('certification', certification.id)"
                    >
                      <Edit2 class="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-[var(--surface-secondary)]"
                      @click="openDeleteModal('certification', certification.id, 'certification')"
                      :disabled="isDeleting('certification', certification.id)"
                    >
                      <Trash2 class="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-sm text-[var(--text-secondary)]">
            <p class="mb-3">No certifications added yet.</p>
            <RouterLink
              to="/profile/edit"
              class="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] transition"
            >
              Add certifications →
            </RouterLink>
          </div>
        </section>

        <!-- Education Section -->
        <section id="education" class="order-2 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Highest Level Education</h2>
            <GraduationCap class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="isLoadingEducations" class="grid animate-pulse gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div v-for="item in 3" :key="item" class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4">
              <div class="h-4 w-3/4 rounded-full bg-[var(--surface-muted)]" />
              <div class="mt-3 h-3 w-2/3 rounded-full bg-[var(--surface-muted)]" />
              <div class="mt-2 h-3 w-1/2 rounded-full bg-[var(--surface-muted)]" />
            </div>
          </div>

          <div v-else-if="educations.length > 0" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="education in educations"
              :key="education.id"
              class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-semibold text-[var(--text-primary)]">{{ education.school }}</p>
                  <p v-if="education.degree" class="text-sm text-[var(--text-secondary)]">{{ education.degree }}</p>
                  <p v-if="education.field" class="text-sm text-[var(--text-secondary)]">{{ education.field }}</p>
                  <p v-if="education.startDate || education.endDate" class="text-xs text-[var(--text-tertiary)] mt-1">
                    {{ education.startDate ? new Date(education.startDate).toLocaleDateString() : '' }}
                    {{ education.startDate && education.endDate ? ' - ' : '' }}
                    {{ education.endDate ? new Date(education.endDate).toLocaleDateString() : '' }}
                  </p>
                </div>

                <div class="relative" data-profile-action-menu>
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                    @click.stop="toggleActionMenu('education', education.id)"
                  >
                    <MoreHorizontal class="h-5 w-5" />
                  </button>

                  <div
                    v-if="activeActionMenu?.type === 'education' && activeActionMenu?.id === education.id"
                    class="absolute right-0 z-10 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                      @click="openEditModal('education', education.id)"
                    >
                      <Edit2 class="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-[var(--surface-secondary)]"
                      @click="openDeleteModal('education', education.id, 'education entry')"
                      :disabled="isDeleting('education', education.id)"
                    >
                      <Trash2 class="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-sm text-[var(--text-secondary)]">
            <p class="mb-3">No education records added yet.</p>
            <RouterLink
              to="/profile/edit"
              class="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] transition"
            >
              Add education →
            </RouterLink>
          </div>
        </section>

        <!-- Experience Section -->
        <section id="experience" class="order-1 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Experience</h2>
            <Briefcase class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="isLoadingExperiences" class="grid animate-pulse gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div v-for="item in 3" :key="item" class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4">
              <div class="h-4 w-3/4 rounded-full bg-[var(--surface-muted)]" />
              <div class="mt-3 h-3 w-2/3 rounded-full bg-[var(--surface-muted)]" />
              <div class="mt-2 h-3 w-full rounded-full bg-[var(--surface-muted)]" />
            </div>
          </div>

          <div v-else-if="experiences.length > 0" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="experience in experiences"
              :key="experience.id"
              class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-semibold text-[var(--text-primary)]">{{ toInitialCaps(experience.title, { keepSmallWords: true }) }}</p>
                  <p class="text-sm text-[var(--text-secondary)]">{{ toInitialCaps(experience.company, { keepSmallWords: true }) }}</p>
                  <p v-if="experience.employmentType" class="text-xs text-[var(--text-tertiary)]">{{ experience.employmentType }}</p>
                  <p class="text-xs text-[var(--text-tertiary)] mt-1">
                    {{ experience.startDate ? new Date(experience.startDate).toLocaleDateString() : '' }}
                    {{ experience.startDate && (experience.endDate || experience.isCurrent) ? ' - ' : '' }}
                    {{ experience.isCurrent ? 'Present' : (experience.endDate ? new Date(experience.endDate).toLocaleDateString() : '') }}
                  </p>
                  <p v-if="experience.description" class="text-sm text-[var(--text-secondary)] mt-2">
                    {{ experience.description }}
                  </p>
                </div>

                <div class="relative" data-profile-action-menu>
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                    @click.stop="toggleActionMenu('experience', experience.id)"
                  >
                    <MoreHorizontal class="h-5 w-5" />
                  </button>

                  <div
                    v-if="activeActionMenu?.type === 'experience' && activeActionMenu?.id === experience.id"
                    class="absolute right-0 z-10 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                      @click="openEditModal('experience', experience.id)"
                    >
                      <Edit2 class="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-[var(--surface-secondary)]"
                      @click="openDeleteModal('experience', experience.id, 'experience entry')"
                      :disabled="isDeleting('experience', experience.id)"
                    >
                      <Trash2 class="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-sm text-[var(--text-secondary)]">
            <p class="mb-3">No experience records added yet.</p>
            <RouterLink
              to="/profile/edit"
              class="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] transition"
            >
              Add experience →
            </RouterLink>
          </div>
        </section>

        <!-- Uploads Section -->
        <section id="uploads" class="order-6 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Uploads</h2>
            <button
              type="button"
              class="inline-flex h-11 items-center justify-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-5 text-sm font-semibold text-[var(--text-secondary)] shadow-[var(--shadow-soft)] transition hover:border-[color:var(--accent-soft)] hover:text-[var(--accent-strong)]"
              @click="openUploadModal"
            >
              <ImageIcon class="h-4 w-4" />
              Upload Photos
            </button>
          </div>

          <div v-if="hasProfileUploads" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article
              v-for="item in profileUploads"
              :key="item.id"
              class="overflow-hidden rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-soft)]"
            >
              <div class="aspect-square bg-[var(--surface-secondary)]">
                <img loading="lazy" decoding="async"
                  v-if="item.mediaType === 'image'"
                  :src="item.url"
                  :alt="item.title"
                  class="h-full w-full object-cover"
                />
                <video
                  v-else
                  :src="item.url"
                  class="h-full w-full object-cover"
                  controls
                  playsinline
                  preload="metadata"
                />
              </div>
              <div class="px-4 py-3">
                <a
                  v-if="item.externalUrl"
                  :href="item.externalUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-base font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
                >
                  {{ item.title }}
                </a>
                <h3 v-else class="text-base font-semibold text-[var(--text-primary)]">{{ item.title }}</h3>
              </div>
            </article>
          </div>

          <div v-else class="rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-5 text-center sm:p-8">
            <ImageIcon class="mx-auto h-9 w-9 text-[var(--text-tertiary)]" />
            <p class="mt-3 text-base font-semibold text-[var(--text-primary)]">No profile uploads yet</p>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">Your uploaded images and videos will appear here.</p>
          </div>
        </section>
      </div>
    </div>
  </section>

  <ResponsiveOverlay
    v-model="isUploadModalOpen"
    label="Uploads"
    title="Uploads"
    max-width-class="sm:max-w-xl"
  >
    <form class="space-y-5" @submit.prevent="submitProfileUpload">
      <p class="text-sm leading-7 text-[var(--text-secondary)]">
        If you post image/video and url, the url will open when the upload title is clicked. If no image or video uploaded, the url preview will appear.
      </p>

      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Upload title</span>
        <input
          v-model="uploadForm.title"
          type="text"
          placeholder="photosynthesis in plants"
          class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]"
        />
      </label>

      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">publication/project url</span>
        <input
          v-model="uploadForm.externalUrl"
          type="url"
          placeholder="www.myproject.here"
          class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]"
        />
      </label>

      <div>
        <span class="text-sm font-semibold text-[var(--text-primary)]">Video/Image</span>
        <button
          type="button"
          class="mt-2 flex min-h-40 w-full items-center justify-center overflow-hidden rounded-[0.65rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 text-center transition hover:border-[color:var(--accent-soft)] hover:bg-[var(--surface-secondary)]"
          @click="uploadFileInput?.click()"
          @dragover.prevent
          @drop.prevent="handleUploadDrop"
        >
          <img loading="lazy" decoding="async"
            v-if="uploadPreviewUrl && uploadFile?.type.startsWith('image/')"
            :src="uploadPreviewUrl"
            alt="Selected upload preview"
            class="max-h-56 w-full rounded-[0.55rem] object-cover"
          />
          <video
            v-else-if="uploadPreviewUrl"
            :src="uploadPreviewUrl"
            class="max-h-56 w-full rounded-[0.55rem] object-cover"
            controls
            playsinline
            preload="metadata"
          />
          <span v-else class="inline-flex items-center gap-3 text-sm font-medium text-[var(--text-secondary)]">
            <UploadCloud class="h-4 w-4" />
            Drop files here or click to upload.
          </span>
        </button>
        <input
          ref="uploadFileInput"
          type="file"
          accept="image/*,video/*"
          class="sr-only"
          @change="handleUploadFileChange"
        />
        <p v-if="uploadFileName" class="mt-2 text-xs font-medium text-[var(--text-tertiary)]">
          {{ uploadFileName }}
        </p>
      </div>

      <button
        type="submit"
        :disabled="isUploadingProfileMedia"
        class="inline-flex h-12 w-full items-center justify-center rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
      >
        {{ isUploadingProfileMedia ? 'Uploading...' : 'Upload' }}
      </button>
    </form>
  </ResponsiveOverlay>

  <div
    v-if="isProfileDetailsModalOpen"
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
    @click.self="closeProfileDetailsModal"
  >
    <form
      class="w-full max-h-[calc(100dvh-1.5rem)] max-w-lg overflow-y-auto rounded-t-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)] sm:rounded-[1.35rem] sm:p-6"
      @submit.prevent="saveProfileDetails"
    >
      <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--surface-muted)] sm:hidden" />
      <div class="mb-4 flex justify-end">
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
          aria-label="Close modal"
          @click="closeProfileDetailsModal"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="space-y-4">
        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Display name</span>
          <input
            v-model="profileDetailsForm.displayName"
            type="text"
            class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Location</span>
          <select
            v-model="profileDetailsForm.location"
            class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          >
            <option value="">Select location</option>
            <option v-for="location in nigeriaProfileLocationOptions" :key="location" :value="location">
              {{ location }}
            </option>
          </select>
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">About me</span>
          <textarea
            v-model="profileDetailsForm.bio"
            rows="5"
            class="w-full resize-y rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
            placeholder="Tell people about your work, background, and interests."
          />
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Current work place</span>
          <input
            v-model="profileDetailsForm.currentWorkplace"
            type="text"
            class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Current job title</span>
          <input
            v-model="profileDetailsForm.currentJobTitle"
            type="text"
            class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </label>
      </div>

      <button
        type="submit"
        :disabled="isSavingProfileDetails"
        class="mt-5 inline-flex w-full items-center justify-center rounded-[0.9rem] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
      >
        {{ isSavingProfileDetails ? 'Saving...' : 'Save changes' }}
      </button>
    </form>
  </div>

  <div
    v-if="profileModal"
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"
    @click.self="closeProfileModal"
  >
    <div class="w-full max-w-2xl overflow-hidden rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
      <div class="flex items-center justify-between gap-4 border-b border-[color:var(--border-soft)] px-5 py-4 sm:px-6">
        <div>
          <h3 class="text-lg font-semibold text-[var(--text-primary)]">{{ profileModalTitle }}</h3>
        </div>
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-[0.75rem] border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
          @click="closeProfileModal"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-5 sm:px-6">
        <template v-if="profileModal === 'score'">
          <div
            v-for="entry in scoreEntries"
            :key="entry.id"
            class="flex items-start justify-between gap-4 rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
          >
            <div class="min-w-0">
              <p class="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                {{ entry.typeLabel }}
              </p>
              <p class="mt-2 text-base font-semibold text-[var(--text-primary)]">{{ entry.title }}</p>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ entry.community }}</p>
            </div>
            <div class="rounded-full bg-[color:color-mix(in_srgb,var(--accent)_14%,white)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
              {{ entry.score }} score
            </div>
          </div>

          <div
            v-if="scoreEntries.length === 0"
            class="min-h-28 rounded-[1.15rem] border border-dashed border-[color:var(--border-soft)]"
          />
        </template>

        <template v-else-if="profileModal === 'followers'">
          <div
            v-if="isLoadingFollowers"
            class="space-y-3"
          >
            <div v-for="item in 3" :key="item" class="flex animate-pulse items-center gap-3 rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4">
              <div class="h-10 w-10 rounded-full bg-[var(--surface-muted)]" />
              <div class="min-w-0 flex-1 space-y-2">
                <div class="h-3 w-32 rounded-full bg-[var(--surface-muted)]" />
                <div class="h-3 w-20 rounded-full bg-[var(--surface-muted)]" />
              </div>
            </div>
          </div>
          <template v-else>
            <div
              v-for="account in followerAccounts"
              :key="account.id"
              class="flex items-center justify-between gap-4 rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <div class="flex items-center gap-3">
                <div class="h-12 w-12 overflow-hidden rounded-full bg-[color:color-mix(in_srgb,var(--accent)_16%,white)]">
                  <img loading="lazy" decoding="async"
                    v-if="account.avatar"
                    :src="account.avatar"
                    :alt="`${account.name} profile image`"
                    class="h-full w-full object-cover"
                  />
                  <span
                    v-else
                    class="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--accent-strong)]"
                  >
                    {{ account.initials }}
                  </span>
                </div>
                <div>
                  <p class="text-sm font-semibold text-[var(--text-primary)]">{{ account.name }}</p>
                </div>
              </div>
              <button
                v-if="!account.isCurrentUser"
                type="button"
                :disabled="followToggles[account.id]"
                class="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-[0.75rem] px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                :class="
                  account.isFollowing
                    ? 'border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-primary)] hover:border-red-200 hover:text-red-500'
                    : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]'
                "
                :title="account.isFollowing ? 'Unfollow' : 'Follow'"
                @click="toggleFollowFromModal(account.id)"
              >
                <component :is="account.isFollowing ? UserCheck : UserPlus" class="h-4 w-4" />
                {{ account.isFollowing ? 'Unfollow' : 'Follow' }}
              </button>
            </div>
          </template>
          <div
            v-if="!isLoadingFollowers && followerAccounts.length === 0"
            class="min-h-28 rounded-[1.15rem] border border-dashed border-[color:var(--border-soft)]"
          />
        </template>

        <template v-else>
          <div
            v-for="account in following"
            :key="account.id"
            class="flex items-center justify-between gap-4 rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
          >
            <RouterLink :to="`/profile/view/${account.id}`" class="flex min-w-0 items-center gap-3">
              <div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[color:color-mix(in_srgb,var(--accent)_16%,white)]">
                <img loading="lazy" decoding="async"
                  v-if="account.avatar"
                  :src="account.avatar"
                  :alt="`${account.name} profile image`"
                  class="h-full w-full object-cover"
                />
                <span
                  v-else
                  class="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--accent-strong)]"
                >
                  {{ account.initials }}
                </span>
              </div>
              <p class="truncate text-sm font-semibold text-[var(--text-primary)]">{{ account.name }}</p>
            </RouterLink>
            <button
              type="button"
              :disabled="followToggles[account.id]"
              class="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              title="Unfollow"
              @click="toggleFollowFromModal(account.id)"
            >
              <UserCheck class="h-4 w-4" />
              Unfollow
            </button>
          </div>
          <div
            v-if="following.length === 0"
            class="rounded-[1.15rem] border border-dashed border-[color:var(--border-soft)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]"
          >
            You are not following anyone yet.
          </div>
        </template>
      </div>
    </div>
  </div>

  <div
    v-if="editModal.isOpen"
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
    @click.self="closeEditModal"
  >
    <form
      class="w-full max-h-[calc(100dvh-1.5rem)] max-w-lg overflow-y-auto rounded-t-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)] sm:rounded-[1.35rem] sm:p-6"
      @submit.prevent="replaceSectionItem"
    >
      <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--surface-muted)] sm:hidden" />
      <div class="mb-5 flex items-center justify-between gap-4">
        <h3 class="text-lg font-semibold text-[var(--text-primary)]">{{ editModalTitle }}</h3>
        <button
          type="button"
          class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
          aria-label="Close modal"
          @click="closeEditModal"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div v-if="editModal.type === 'skill'" class="space-y-4">
        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Skill name</span>
          <input v-model="editSkillForm.skill" type="text" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
        </label>
        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Level</span>
          <select v-model="editSkillForm.level" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="expert">Expert</option>
          </select>
        </label>
      </div>

      <div v-else-if="editModal.type === 'portfolio'" class="space-y-4">
        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Project title</span>
          <input v-model="editPortfolioForm.title" type="text" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
        </label>
        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Description</span>
          <textarea v-model="editPortfolioForm.description" rows="4" class="w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]" />
        </label>
        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Link</span>
          <input v-model="editPortfolioForm.link" type="url" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
        </label>
      </div>

      <div v-else-if="editModal.type === 'certification'" class="space-y-4">
        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Certificate name</span>
          <input v-model="editCertificationForm.name" type="text" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
        </label>
        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Issuer</span>
          <input v-model="editCertificationForm.issuer" type="text" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
        </label>
        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Issue date</span>
          <input v-model="editCertificationForm.issueDate" type="date" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
        </label>
      </div>

      <div v-else-if="editModal.type === 'education'" class="space-y-4">
        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">School/University</span>
          <input v-model="editEducationForm.school" type="text" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
        </label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Degree</span>
            <input v-model="editEducationForm.degree" type="text" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
          </label>
          <label class="block space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Field</span>
            <input v-model="editEducationForm.field" type="text" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
          </label>
          <label class="block space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Start date</span>
            <input v-model="editEducationForm.startDate" type="date" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
          </label>
          <label class="block space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">End date</span>
            <input v-model="editEducationForm.endDate" type="date" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
          </label>
        </div>
      </div>

      <div v-else-if="editModal.type === 'experience'" class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Company</span>
            <input v-model="editExperienceForm.company" type="text" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
          </label>
          <label class="block space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Job title</span>
            <input v-model="editExperienceForm.title" type="text" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
          </label>
          <label class="block space-y-2 sm:col-span-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Employment type</span>
            <select v-model="editExperienceForm.employmentType" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]">
              <option value="">Select type</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
            </select>
          </label>
          <label class="block space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Start date</span>
            <input v-model="editExperienceForm.startDate" type="date" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]" />
          </label>
          <label class="block space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">End date</span>
            <input v-model="editExperienceForm.endDate" type="date" :disabled="editExperienceForm.isCurrent" class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)] disabled:opacity-60" />
          </label>
        </div>
        <label class="flex items-center gap-2 text-sm text-[var(--text-primary)]">
          <input v-model="editExperienceForm.isCurrent" type="checkbox" class="h-4 w-4 rounded border-[color:var(--border-soft)]" />
          I currently work here
        </label>
        <label class="block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Description</span>
          <textarea v-model="editExperienceForm.description" rows="4" class="w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]" />
        </label>
      </div>

      <div class="mt-6 flex justify-end gap-3 border-t border-[color:var(--border-soft)] pt-4">
        <button
          type="submit"
          :disabled="isSavingSectionEdit"
          class="inline-flex items-center justify-center rounded-[1rem] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
        >
          {{ isSavingSectionEdit ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </form>
  </div>

  <!-- Delete Confirmation Modal -->
  <div v-if="deleteModal.isOpen" class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
    <div class="w-full max-w-sm overflow-hidden rounded-t-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)] sm:rounded-[1.5rem]">
      <div class="p-6">
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-lg font-semibold text-[var(--text-primary)]">Delete {{ deleteModal.label }}?</h3>
          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
            aria-label="Close modal"
            @click="closeDeleteModal"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
        <p class="mt-3 text-sm text-[var(--text-secondary)]">
          This action cannot be undone. Are you sure you want to delete this {{ deleteModal.label }}?
        </p>
      </div>

      <div class="flex justify-end gap-3 border-t border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4">
        <button
          type="button"
          @click="confirmDelete"
          :disabled="deletingItem !== null"
          class="inline-flex items-center justify-center rounded-[1rem] bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-400"
        >
          {{ deletingItem ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </div>
  </div>
</template>
