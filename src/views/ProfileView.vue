<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Award, BookOpen, Briefcase, ClipboardList, Edit2, ExternalLink, GraduationCap, MoreHorizontal, Pencil, Rocket, Save, Sparkles, Trash2, UserRound, Users, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ApiError } from '@/lib/api'
import { usersService } from '@/services/users'
import { postsService, type PostRecord } from '@/services/posts'
import { questionsService, type QuestionRecord } from '@/services/questions'
import { useAuthStore } from '@/stores/auth'
import { feedPosts } from '@/data/feedPosts'
import type { UserSkill, UserPortfolio, UserCertification, UserEducation, UserExperience } from '@/services/users'

const authStore = useAuthStore()
const route = useRoute()
const isLoadingProfile = ref(false)
const isLoadingFollowers = ref(false)
const isLoadingSkills = ref(false)
const isLoadingPortfolios = ref(false)
const isLoadingCertifications = ref(false)
const isLoadingEducations = ref(false)
const isLoadingExperiences = ref(false)
const isLoadingActivity = ref(false)
const isProfileDetailsModalOpen = ref(false)
const isSavingProfileDetails = ref(false)
const isSavingSectionEdit = ref(false)
const skills = ref<UserSkill[]>([])
const portfolios = ref<UserPortfolio[]>([])
const certifications = ref<UserCertification[]>([])
const educations = ref<UserEducation[]>([])
const experiences = ref<UserExperience[]>([])
const followers = ref<Array<{
  id?: string
  followerId?: string
  followingId?: string
  createdAt?: string
}>>([])
const recentActivities = ref<Array<{
  id: string
  title: string
  description: string
  typeLabel: string
  time: string
  to: string
  createdAt: string
}>>([])
const following = ref<Array<{
  id: string
  name: string
  subtitle: string
  initials: string
}>>([])
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
  comments: 0,
  followers: 0,
})

const optionalField = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed || undefined
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
      issueDate: item.issueDate || '',
    }
  }

  if (type === 'education') {
    const item = educations.value.find((education) => education.id === id)
    if (!item) return
    editEducationForm.value = {
      school: item.school || '',
      degree: item.degree || '',
      field: item.field || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
    }
  }

  if (type === 'experience') {
    const item = experiences.value.find((experience) => experience.id === id)
    if (!item) return
    editExperienceForm.value = {
      company: item.company || '',
      title: item.title || '',
      employmentType: item.employmentType || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      isCurrent: Boolean(item.isCurrent),
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
    const message = error instanceof ApiError || error instanceof Error ? error.message : `Failed to delete ${label}.`
    toast.error('Delete failed', { description: message })
  } finally {
    deletingItem.value = null
    closeActionMenu()
  }
}

const profileDetailsForm = ref({
  displayName: '',
  location: '',
  currentWorkplace: '',
  currentJobTitle: '',
})

const formatActivityTime = (value: string) => {
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

const getPostDescription = (content: string) => {
  if (typeof document === 'undefined') {
    return content.replace(/<[^>]*>/g, '').trim()
  }

  const element = document.createElement('div')
  element.innerHTML = content

  return (element.textContent || '').trim()
}

const loadRecentActivity = async (userId: string) => {
  isLoadingActivity.value = true

  try {
    const [postsResult, questionsResult] = await Promise.allSettled([
      postsService.listPosts(authStore.authToken),
      questionsService.listQuestions(authStore.authToken),
    ])

    const postActivities =
      postsResult.status === 'fulfilled'
        ? postsResult.value.data
          .filter((post: PostRecord) => post.user_id === userId)
          .map((post) => ({
            id: post.id,
            title: post.title,
            description: getPostDescription(post.content),
            typeLabel: post.community_id ? 'Community post' : 'Post',
            time: formatActivityTime(post.created_at),
            to: `/posts/${post.id}`,
            createdAt: post.created_at,
          }))
        : []

    const questionActivities =
      questionsResult.status === 'fulfilled'
        ? questionsResult.value.data
          .filter((question: QuestionRecord) => question.userId === userId)
          .map((question) => ({
            id: question.id,
            title: question.title,
            description: question.body,
            typeLabel: 'Question',
            time: formatActivityTime(question.createdAt),
            to: `/questions/${question.id}`,
            createdAt: question.createdAt,
          }))
        : []

    recentActivities.value = [...postActivities, ...questionActivities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  } catch {
    recentActivities.value = []
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
    const [profileResponse, statsResponse] = await Promise.all([
      usersService.getMyProfile(authStore.authToken),
      usersService.getMyStats(authStore.authToken),
    ])

    authStore.setUserProfile(profileResponse.data?.profile ?? null)

    if (profileResponse.data?.user?.id) {
      authStore.setUserId(profileResponse.data.user.id)
    }

    if (profileResponse.data?.user?.email && typeof profileResponse.data.user.email === 'string') {
      authStore.signUpDraft.email = profileResponse.data.user.email
    }

    if (profileResponse.data?.user?.name && typeof profileResponse.data.user.name === 'string') {
      authStore.signUpDraft.name = profileResponse.data.user.name
    }

    // Sync profile data to store for persistence across reloads
    if (profileResponse.data?.profile) {
      const profile = profileResponse.data.profile
      authStore.signUpDraft.username = profile.username || authStore.signUpDraft.username
      authStore.signUpDraft.headline = profile.bio || authStore.signUpDraft.headline
      authStore.signUpDraft.location = profile.location || authStore.signUpDraft.location
      if (profile.avatar) {
        authStore.signUpDraft.avatar = profile.avatar
      }
      if (profile.banner) {
        authStore.signUpDraft.banner = profile.banner
      }
    }

    stats.value = {
      pages: statsResponse.data?.pages ?? 0,
      communities: statsResponse.data?.communities ?? 0,
      posts: statsResponse.data?.posts ?? 0,
      comments: statsResponse.data?.comments ?? 0,
      followers: 0,
    }

    // Load additional profile data
    skills.value = (profileResponse.data?.skills || []).map((skill) => ({
      id: skill.id || '',
      name: skill.skill || skill.name || '',
      level: skill.level,
    }))

    portfolios.value = profileResponse.data?.portfolios || []

    certifications.value = profileResponse.data?.certifications || []

    educations.value = profileResponse.data?.education || []

    experiences.value = profileResponse.data?.experiences || []

    following.value = []

    // Load followers data separately
    if (profileResponse.data?.user?.id) {
      await loadFollowersData(profileResponse.data.user.id)
      await loadRecentActivity(profileResponse.data.user.id)
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      authStore.setUserProfile(null)
      return
    }
  } finally {
    isLoadingProfile.value = false
  }
}

const loadFollowersData = async (userId: string) => {
  isLoadingFollowers.value = true

  try {
    const response = await usersService.listFollowers(userId, authStore.authToken)
    followers.value = response.data ?? []
    stats.value.followers = followers.value.length
  } catch (error) {
    followers.value = []
    stats.value.followers = 0
  } finally {
    isLoadingFollowers.value = false
  }
}

const openProfileDetailsModal = () => {
  profileDetailsForm.value = {
    displayName: authStore.signUpDraft.name || authStore.userProfile?.username || '',
    location: authStore.userProfile?.location || authStore.signUpDraft.location || '',
    currentWorkplace: featuredExperience.value?.company || '',
    currentJobTitle: featuredExperience.value?.title || '',
  }
  isProfileDetailsModalOpen.value = true
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

  const company = profileDetailsForm.value.currentWorkplace.trim()
  const title = profileDetailsForm.value.currentJobTitle.trim()

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
    endDate: existingExperience?.endDate ?? null,
    isCurrent: existingExperience?.isCurrent === undefined ? true : Boolean(existingExperience.isCurrent),
    description: existingExperience?.description || '',
  }

  if (existingExperience?.id) {
    const response = await usersService.updateUserExperience(
      authStore.userId,
      existingExperience.id,
      payload,
      authStore.authToken,
    )
    experiences.value = experiences.value.map((experience) =>
      experience.id === existingExperience.id ? response.data : experience,
    )
    return
  }

  const response = await usersService.addUserExperience(authStore.userId, payload, authStore.authToken)
  experiences.value = [response.data, ...experiences.value]
}

const saveProfileDetails = async () => {
  if (!authStore.userId || isSavingProfileDetails.value) {
    return
  }

  isSavingProfileDetails.value = true

  try {
    const payload = {
      username: authStore.userProfile?.username || authStore.signUpDraft.username,
      bio: authStore.userProfile?.bio || authStore.signUpDraft.headline,
      location: profileDetailsForm.value.location.trim(),
      website: authStore.userProfile?.website || authStore.signUpDraft.website || '',
      linkedin: authStore.userProfile?.linkedin || authStore.signUpDraft.linkedin || '',
      github: authStore.userProfile?.github || authStore.signUpDraft.github || '',
    }

    const profileResponse = authStore.userProfile?.id
      ? await usersService.updateUserProfile(authStore.userId, payload, authStore.authToken)
      : await usersService.createUserProfile(authStore.userId, payload, authStore.authToken)

    await upsertCurrentExperience()

    authStore.signUpDraft.name = profileDetailsForm.value.displayName.trim()
    authStore.signUpDraft.location = profileDetailsForm.value.location.trim()
    authStore.setUserProfile(profileResponse.data ?? null)

    isProfileDetailsModalOpen.value = false
    toast.success('Profile updated.')
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'We could not save your profile details.'

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
      skills.value = skills.value.map((skill) => (skill.id === id ? response.data : skill))
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
          company: editExperienceForm.value.company.trim(),
          title: editExperienceForm.value.title.trim(),
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

    await loadProfile()
    editModal.value = { isOpen: false }
    toast.success('Updated successfully.')
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to update item.'

    toast.error('Update failed', { description: message })
  } finally {
    isSavingSectionEdit.value = false
  }
}

onMounted(() => {
  void loadProfile()
})

// Refresh data when user profile changes (after edits)
watch(
  () => authStore.userProfile?.id,
  () => {
    void loadProfile()
  },
)

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
  const name = draft.name || apiProfile?.username || 'Samuel Bada'
  const username = apiProfile?.username || draft.username || 'samuelbada'
  const email = draft.email || 'samuel@example.com'
  const phone = draft.phone || '+234 800 000 0000'
  const location = apiProfile?.location || draft.location || 'Lagos, Nigeria'
  const bio = apiProfile?.bio || draft.headline || 'Founder account'

  return {
    name,
    bio,
    username,
    email,
    phone,
    location,
    website: apiProfile?.website || draft.website || `skills4export.com/@${username}`,
    avatar: apiProfile?.avatar || draft.avatar || '',
    banner: apiProfile?.banner || draft.banner || '',
    initials: name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
    .toUpperCase(),
  }
})

const featuredExperience = computed(() => experiences.value[0] ?? null)

const featuredSkill = computed(() => skills.value[0]?.name || authStore.signUpDraft.interests[0] || '')

const profileSkillLabel = computed(() => featuredExperience.value?.title || featuredSkill.value || 'Software Developer')
const profileCompanyLabel = computed(() => featuredExperience.value?.company || 'Amaka Global')
const profileCountryLabel = computed(() => profile.value.location || 'Nigeria')

const scoreEntries = computed(() =>
  feedPosts
    .filter((post) =>
      post.type === 'personal'
        ? post.author.name === profile.value.name
        : post.type === 'question'
          ? post.authorName === profile.value.name
          : post.author.name === profile.value.name,
    )
    .map((post) => ({
      id: post.slug,
      title: post.title,
      community: post.type === 'question' ? post.communityName : 'Personal post',
      score: 'score' in post ? post.score : 0,
      typeLabel: post.type === 'question' ? 'Question' : 'Post',
    })),
)

const totalTScore = computed(() =>
  scoreEntries.value.reduce((total, entry) => total + entry.score, 0),
)

const questionCount = computed(
  () =>
    feedPosts.filter(
      (post) => post.type === 'question' && post.authorName === profile.value.name,
    ).length,
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
    value: questionCount.value,
    icon: Sparkles,
    accentClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    label: 'Answers & Posts',
    value: stats.value.posts || 0,
    icon: Rocket,
    accentClass: 'bg-amber-100 text-amber-700',
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
      <div class="relative aspect-[4/1] min-h-36 overflow-hidden bg-[var(--surface-secondary)]">
        <img
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

      <div class="relative border-b border-[color:var(--border-soft)] px-5 pb-6 pt-0 sm:px-7 lg:px-9 lg:pb-7">
        <div class="absolute right-0 top-0 hidden h-full w-48 lg:block">
          <div class="absolute right-10 top-0 h-full w-px bg-[var(--accent-soft)] rotate-[-32deg]" />
          <div class="absolute right-20 top-0 h-full w-px bg-[var(--accent-soft)] rotate-[-32deg]" />
          <div class="absolute right-[7.5rem] top-0 h-full w-px bg-[var(--accent-soft)] rotate-[-32deg]" />
        </div>

        <div class="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div class="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
            <div class="-mt-12 h-24 w-24 overflow-hidden rounded-full border-4 border-[var(--surface-primary)] bg-[var(--surface-secondary)] shadow-[var(--shadow-elevated)] sm:-mt-14">
              <img
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
              <h2 class="text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl">
                {{ profile.name }}
              </h2>
              <div class="mt-0.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-sm leading-5 text-[var(--text-secondary)] sm:justify-start">
                <span>{{ profileSkillLabel }}</span>
                <span>-</span>
                <span>{{ profileCompanyLabel }}</span>
                <span>-</span>
                <span>{{ profileCountryLabel }}</span>
                <button
                  type="button"
                  @click="openProfileDetailsModal"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-primary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--accent-strong)]"
                  aria-label="Edit profile"
                >
                  <Pencil class="h-4 w-4" />
                </button>
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
                  {{ stats.followers }} followers
                </button>
                <span class="text-[var(--border-strong,var(--border-soft))]">|</span>
                <button
                  type="button"
                  class="text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                  @click="openProfileModal('following')"
                >
                  {{ following.length }} following
                </button>
              </div>
            </div>
          </div>

          <RouterLink
            to="/profile/edit"
            class="inline-flex items-center justify-center gap-3 self-center rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] shadow-[var(--shadow-soft)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] sm:self-start"
          >
            <Edit2 class="h-4 w-4" />
            Edit Profile
          </RouterLink>
        </div>
      </div>

      <div class="space-y-8 px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
        <div class="max-w-5xl space-y-5 text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.95rem]">
          <p>
            {{ profile.bio || 'Add a short introduction to tell people what you do, what you care about, and the kind of opportunities or conversations you want to attract.' }}
          </p>
          <p>
            <span class="font-medium text-[var(--text-primary)]">{{ featuredExperience?.title || 'Community member' }}</span>
            <span v-if="featuredExperience?.company"> at {{ featuredExperience.company }}</span>
            <span v-else> building visibility through Skills4Export.</span>
            <span v-if="profile.location"> Based in {{ profile.location }}.</span>
          </p>
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <article
            v-for="card in summaryCards"
            :key="card.label"
            class="flex items-center gap-4 rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-5 py-5 shadow-[var(--shadow-soft)]"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
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
      <div class="space-y-6">
        <section id="skills" class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Skills</h2>
            <Award class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="isLoadingSkills" class="flex animate-pulse flex-wrap gap-3 py-2">
            <div v-for="item in 4" :key="item" class="h-11 w-32 rounded-full bg-[var(--surface-muted)]" />
          </div>

          <div v-else-if="skills.length > 0" class="flex flex-wrap gap-3">
            <div
              v-for="skill in skills"
              :key="skill.id"
              class="inline-flex max-w-full items-center gap-3 rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-3 shadow-[var(--shadow-soft)]"
            >
              <span class="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">
                {{ skill.name || 'Unnamed skill' }}
              </span>
              <span
                class="inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]"
                :class="{
                  'bg-blue-100 text-blue-700': skill.level === 'beginner',
                  'bg-amber-100 text-amber-700': skill.level === 'intermediate',
                  'bg-green-100 text-green-700': skill.level === 'advanced' || skill.level === 'expert',
                }"
              >
                {{ skill.level || 'beginner' }}
              </span>
              <div class="relative">
                <button
                  type="button"
                  class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-tertiary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                  @click.stop="toggleActionMenu('skill', skill.id)"
                  aria-label="Open skill actions"
                >
                  <MoreHorizontal class="h-4 w-4" />
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
        <section id="portfolio" class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Portfolio</h2>
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
              class="flex h-full flex-col rounded-[1.1rem] bg-[var(--surface-secondary)] p-5 border border-[color:var(--border-soft)] transition hover:border-[var(--accent)]"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <p class="text-lg font-semibold text-[var(--text-primary)] break-words">{{ portfolio.title }}</p>
                  <p v-if="portfolio.description" class="mt-3 line-clamp-5 text-sm leading-6 text-[var(--text-secondary)]">
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

                <div class="relative">
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
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
        <section id="certifications" class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Certifications</h2>
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

                <div class="relative">
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
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
        <section id="education" class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Education</h2>
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

                <div class="relative">
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
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
        <section id="experience" class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Work Experience</h2>
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
                  <p class="font-semibold text-[var(--text-primary)]">{{ experience.title }}</p>
                  <p class="text-sm text-[var(--text-secondary)]">{{ experience.company }}</p>
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

                <div class="relative">
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
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

        <!-- Recent Activity Section -->
        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Recent activity</h2>
            <RouterLink to="/feed" class="text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]">
              View feed
            </RouterLink>
          </div>

          <div v-if="isLoadingActivity" class="space-y-3">
            <div
              v-for="item in 3"
              :key="item"
              class="animate-pulse rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="h-3 w-24 rounded-full bg-[var(--surface-muted)]" />
                <div class="h-3 w-20 rounded-full bg-[var(--surface-muted)]" />
              </div>
              <div class="mt-3 h-4 w-3/4 rounded-full bg-[var(--surface-muted)]" />
              <div class="mt-3 h-3 w-full rounded-full bg-[var(--surface-muted)]" />
              <div class="mt-2 h-3 w-2/3 rounded-full bg-[var(--surface-muted)]" />
            </div>
          </div>

          <div v-else-if="recentActivities.length === 0" class="text-center py-8 text-sm text-[var(--text-secondary)]">
            <p class="mb-3">No posts shared yet.</p>
            <RouterLink
              to="/feed"
              class="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] transition"
            >
              Start sharing →
            </RouterLink>
          </div>

          <div v-else class="space-y-3">
            <RouterLink
              v-for="activity in recentActivities"
              :key="`${activity.typeLabel}-${activity.id}`"
              :to="activity.to"
              class="block rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4 transition hover:border-[color:var(--accent-soft)] hover:bg-[var(--surface-primary)]"
            >
              <div class="flex flex-wrap items-center justify-between gap-2 text-[0.75rem] text-[var(--text-tertiary)]">
                <span class="rounded-full bg-[var(--surface-primary)] px-2.5 py-1 font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                  {{ activity.typeLabel }}
                </span>
                <span>{{ activity.time }}</span>
              </div>
              <h3 class="mt-3 line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">
                {{ activity.title }}
              </h3>
              <p v-if="activity.description" class="mt-2 line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">
                {{ activity.description }}
              </p>
            </RouterLink>
          </div>
        </section>
      </div>
    </div>
  </section>

  <div
    v-if="isProfileDetailsModalOpen"
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950 p-0 sm:items-center sm:p-4"
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
          <input
            v-model="profileDetailsForm.location"
            type="text"
            class="h-11 w-full rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
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
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950 p-4 sm:items-center"
    @click.self="closeProfileModal"
  >
    <div class="w-full max-w-2xl overflow-hidden rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
      <div class="flex items-center justify-between gap-4 border-b border-[color:var(--border-soft)] px-5 py-4 sm:px-6">
        <div>
          <h3 class="text-lg font-semibold text-[var(--text-primary)]">{{ profileModalTitle }}</h3>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">
            <span v-if="profileModal === 'score'">Your post scores across communities and shared content.</span>
            <span v-else-if="profileModal === 'followers'">People currently following your profile.</span>
            <span v-else>Accounts you are following will appear here.</span>
          </p>
        </div>
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
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
            class="rounded-[1.15rem] border border-dashed border-[color:var(--border-soft)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]"
          >
            No scored posts yet. Your community post scores will show here.
          </div>
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
              v-for="follower in followers"
              :key="follower.id || follower.followerId"
              class="flex items-center justify-between gap-4 rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--accent)_16%,white)] text-sm font-semibold text-[var(--accent-strong)]">
                  {{ (follower.followerId?.charAt(0) || 'U').toUpperCase() }}
                </div>
                <div>
                  <p class="text-sm font-semibold text-[var(--text-primary)]">User {{ follower.followerId }}</p>
                  <p class="text-xs text-[var(--text-secondary)]">
                    {{ follower.createdAt ? new Date(follower.createdAt).toLocaleDateString() : 'Recently followed' }}
                  </p>
                </div>
              </div>
              <Users class="h-5 w-5 text-[var(--text-tertiary)]" />
            </div>
          </template>
          <div
            v-if="!isLoadingFollowers && followers.length === 0"
            class="rounded-[1.15rem] border border-dashed border-[color:var(--border-soft)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]"
          >
            No followers yet.
          </div>
        </template>

        <template v-else>
          <div
            v-for="account in following"
            :key="account.id"
            class="flex items-center justify-between gap-4 rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--accent)_16%,white)] text-sm font-semibold text-[var(--accent-strong)]">
                {{ account.initials }}
              </div>
              <div>
                <p class="text-sm font-semibold text-[var(--text-primary)]">{{ account.name }}</p>
                <p class="text-xs text-[var(--text-secondary)]">{{ account.subtitle }}</p>
              </div>
            </div>
            <UserRound class="h-5 w-5 text-[var(--text-tertiary)]" />
          </div>
          <div
            v-if="following.length === 0"
            class="rounded-[1.15rem] border border-dashed border-[color:var(--border-soft)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]"
          >
            Following data is not available from the current API yet. This modal is ready and will populate as soon as that endpoint is connected.
          </div>
        </template>
      </div>
    </div>
  </div>

  <div
    v-if="editModal.isOpen"
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950 p-0 sm:items-center sm:p-4"
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

      <div class="mt-6 flex gap-3 border-t border-[color:var(--border-soft)] pt-4">
        <button
          type="button"
          class="flex-1 inline-flex items-center justify-center rounded-[1rem] border border-[color:var(--border-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
          @click="closeEditModal"
        >
          Cancel
        </button>
        <button
          type="submit"
          :disabled="isSavingSectionEdit"
          class="flex-1 inline-flex items-center justify-center rounded-[1rem] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
        >
          {{ isSavingSectionEdit ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </form>
  </div>

  <!-- Delete Confirmation Modal -->
  <div v-if="deleteModal.isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
    <div class="w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-[var(--text-primary)]">Delete {{ deleteModal.label }}?</h3>
        <p class="mt-3 text-sm text-[var(--text-secondary)]">
          This action cannot be undone. Are you sure you want to delete this {{ deleteModal.label }}?
        </p>
      </div>

      <div class="flex gap-3 border-t border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4">
        <button
          type="button"
          @click="closeDeleteModal"
          class="flex-1 inline-flex items-center justify-center rounded-[1rem] border border-[color:var(--border-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="confirmDelete"
          :disabled="deletingItem !== null"
          class="flex-1 inline-flex items-center justify-center rounded-[1rem] bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-400"
        >
          {{ deletingItem ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </div>
  </div>
</template>
