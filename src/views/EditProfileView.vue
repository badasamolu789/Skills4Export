<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Briefcase, Camera, Globe, Mail, MapPin, Phone, ShieldCheck, Sparkles, UserRound, Plus, Trash2, Award, BookOpen, GraduationCap } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import { ApiError } from '@/lib/api'
import { mediaService } from '@/services/media'
import { usersService } from '@/services/users'
import type { UserPortfolio, UserSkill, UserCertification, UserEducation, UserExperience } from '@/services/users'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isLoadingProfile = ref(false)
const isSavingContact = ref(false)
const isSavingProfessional = ref(false)
const isLoadingSkills = ref(false)
const isLoadingPortfolios = ref(false)
const isAddingSkill = ref(false)
const isAddingPortfolio = ref(false)
const isDeletingSkill = ref<string | null>(null)
const isDeletingPortfolio = ref<string | null>(null)
const isAddingCertification = ref(false)
const isAddingEducation = ref(false)
const isAddingExperience = ref(false)
const isDeletingCertification = ref<string | null>(null)
const isDeletingEducation = ref<string | null>(null)
const isDeletingExperience = ref<string | null>(null)
const isLoadingCertifications = ref(false)
const isLoadingEducations = ref(false)
const isLoadingExperiences = ref(false)
// Media upload endpoints configured per OpenAPI spec
const isUploadingAvatar = ref(false)
const isUploadingBanner = ref(false)
const avatarFile = ref<File | null>(null)
const bannerFile = ref<File | null>(null)
const avatarFileInput = ref<HTMLInputElement | null>(null)
const bannerFileInput = ref<HTMLInputElement | null>(null)
const avatarObjectUrl = ref('')
const bannerObjectUrl = ref('')
const activeProfileModal = ref<'education' | 'experience' | 'skills' | 'project' | 'certificate' | null>(null)
const currentWorkplace = ref('Amaka Global')
const currentJobTitle = ref('Software Developer')

// Skills
const skills = ref<Array<{ id: string; name: string; level?: string }>>([])
const newSkill = ref({
  skill: '',
  level: 'intermediate',
})

// Portfolios
const portfolios = ref<Array<{ id: string; title: string; description?: string; link?: string }>>([])
const newPortfolio = ref({
  title: '',
  description: '',
  link: '',
})

// Certifications
const certifications = ref<Array<{ id: string; name: string; issuer?: string; issueDate?: string }>>([])
const newCertification = ref({
  name: '',
  issuer: '',
  issueDate: '',
})

// Education
const educations = ref<Array<{ id: string; school: string; degree?: string; field?: string; startDate?: string; endDate?: string | null }>>([])
const newEducation = ref({
  school: '',
  degree: '',
  field: '',
  startDate: '',
  endDate: '',
})

// Experience
const experiences = ref<Array<{ id: string; company: string; title: string; employmentType?: string; startDate: string; endDate?: string | null; isCurrent?: boolean; description?: string }>>([])
const newExperience = ref({
  company: '',
  title: '',
  employmentType: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
})

const form = ref({
  name: authStore.signUpDraft.name || 'Samuel Bada',
  username: authStore.userProfile?.username || authStore.signUpDraft.username || 'samuelbada',
  email: authStore.signUpDraft.email || 'samuel@example.com',
  phone: authStore.signUpDraft.phone || '+234 800 000 0000',
  location: authStore.userProfile?.location || authStore.signUpDraft.location || 'Lagos, Nigeria',
  bio: authStore.userProfile?.bio || '',
  website: authStore.userProfile?.website || '',
  linkedin: authStore.userProfile?.linkedin || '',
  github: authStore.userProfile?.github || '',
  avatar: authStore.userProfile?.avatar || authStore.signUpDraft.avatar || '',
  banner: authStore.userProfile?.banner || authStore.signUpDraft.banner || '',
})

const profileInitials = computed(() =>
  form.value.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const displayName = computed(() => {
  return form.value.name || authStore.signUpDraft.name || 'Samuel Bada'
})

const avatarPreviewUrl = computed(() => avatarObjectUrl.value || form.value.avatar || authStore.userProfile?.avatar || '')

const bannerPreviewUrl = computed(() => bannerObjectUrl.value || form.value.banner || authStore.userProfile?.banner || '')

const optionalField = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed || undefined
}

const syncProfileImage = (kind: 'avatar' | 'banner', url: string) => {
  if (!url) {
    return
  }

  if (kind === 'avatar') {
    form.value.avatar = url
    authStore.signUpDraft.avatar = url
    authStore.setUserProfile({
      ...(authStore.userProfile ?? {}),
      avatar: url,
    })
    return
  }

  form.value.banner = url
  authStore.signUpDraft.banner = url
  authStore.setUserProfile({
    ...(authStore.userProfile ?? {}),
    banner: url,
  })
}

const clearAvatarSelection = () => {
  avatarFile.value = null

  if (avatarFileInput.value) {
    avatarFileInput.value.value = ''
  }
}

const clearBannerSelection = () => {
  bannerFile.value = null

  if (bannerFileInput.value) {
    bannerFileInput.value.value = ''
  }
}

const waitForProfileImageRefresh = async (
  kind: 'avatar' | 'banner',
  previousUrl: string,
) => {
  for (let attempt = 0; attempt < 20; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    await loadProfile()

    const nextUrl = kind === 'avatar'
      ? authStore.userProfile?.avatar
      : authStore.userProfile?.banner

    if (nextUrl && nextUrl !== previousUrl) {
      return nextUrl
    }
  }

  return ''
}

const loadProfile = async () => {
  if (!authStore.isAuthenticated) {
    return
  }

  isLoadingProfile.value = true

  try {
    const response = await usersService.getMyProfile(authStore.authToken)
    const profile = response.data?.profile ?? null
    authStore.setUserProfile(profile)

    if (response.data?.user?.id) {
      authStore.setUserId(response.data.user.id)
    }

    if (response.data?.user?.email && typeof response.data.user.email === 'string') {
      form.value.email = response.data.user.email
      authStore.signUpDraft.email = response.data.user.email
    }

    if (profile) {
      form.value.username = profile.username || form.value.username
      form.value.location = profile.location || form.value.location
      form.value.bio = profile.bio || form.value.bio
      form.value.website = profile.website || form.value.website
      form.value.linkedin = profile.linkedin || form.value.linkedin
      form.value.github = profile.github || form.value.github
      form.value.avatar = profile.avatar || form.value.avatar
      form.value.banner = profile.banner || form.value.banner

      skills.value = response.data?.skills?.map((skill: UserSkill) => ({
        id: skill.id || '',
        name: skill.skill || skill.name || 'Unnamed skill',
        level: skill.level,
      })) || skills.value

      portfolios.value = response.data?.portfolios?.map((portfolio: UserPortfolio) => ({
        id: portfolio.id || '',
        title: portfolio.title || portfolio.link || 'Untitled project',
        description: portfolio.description,
        link: portfolio.link,
      })) || portfolios.value

      certifications.value = response.data?.certifications?.map((certification: UserCertification) => ({
        id: certification.id || '',
        name: certification.name || 'Unnamed certification',
        issuer: certification.issuer,
        issueDate: certification.issueDate,
      })) || certifications.value

      educations.value = response.data?.education?.map((education: UserEducation) => ({
        id: education.id || '',
        school: education.school || 'Unnamed school',
        degree: education.degree,
        field: education.field,
        startDate: education.startDate,
        endDate: education.endDate,
      })) || educations.value

      experiences.value = response.data?.experiences?.map((experience: UserExperience) => ({
        id: experience.id || '',
        company: experience.company || 'Unnamed company',
        title: experience.title || 'Unnamed title',
        employmentType: experience.employmentType,
        startDate: experience.startDate || '',
        endDate: experience.endDate,
        isCurrent: experience.isCurrent === 1,
        description: experience.description,
      })) || experiences.value

      // Sync server data to store for persistence
      authStore.signUpDraft.username = profile.username || authStore.signUpDraft.username
      authStore.signUpDraft.location = profile.location || authStore.signUpDraft.location
      if (profile.avatar) {
        authStore.signUpDraft.avatar = profile.avatar
      }
      if (profile.banner) {
        authStore.signUpDraft.banner = profile.banner
      }
    }
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      toast.error('Unable to load profile details right now.')
    }
  } finally {
    isLoadingProfile.value = false
  }
}

// Media upload functions
const uploadAvatarFile = async () => {
  if (!authStore.userId || !avatarFile.value) {
    toast.error('Choose an avatar file before uploading.')
    return
  }

  isUploadingAvatar.value = true
  const loadingToastId = toast.loading('Uploading avatar...')

  try {
    const previousAvatar = authStore.userProfile?.avatar || ''
    const response = await mediaService.uploadAvatarFile(authStore.userId, avatarFile.value, {
      kind: 'avatar',
      replace: true,
      token: authStore.authToken,
    })
    const jobId = response.data?.jobId

    if (!jobId) {
      throw new Error('The server did not return a media processing job ID.')
    }

    toast.loading('Processing avatar...', { id: loadingToastId })
    const processedMedia = await mediaService.waitForProcessedMediaResult(jobId, {
      token: authStore.authToken,
      attempts: 45,
      intervalMs: 1000,
    })

    const refreshedAvatar = await waitForProfileImageRefresh('avatar', previousAvatar)

    if (refreshedAvatar) {
      syncProfileImage('avatar', refreshedAvatar)
      clearAvatarSelection()
      toast.success('Avatar uploaded successfully!', {
        id: loadingToastId,
        description: 'Your profile image is now live.',
      })
      return
    }

    if (processedMedia.url) {
      syncProfileImage('avatar', processedMedia.url)
    }

    if (import.meta.env.DEV) {
      console.info('[profile] avatar job completed but profile.avatar was not updated', processedMedia.job)
    }

    toast.error('Avatar processed, but not attached', {
      id: loadingToastId,
      description: 'The backend accepted the image job, but /user/profile/me did not return the new avatar.',
    })
  } catch (error) {
    const message = error instanceof ApiError || error instanceof Error ? error.message : 'Avatar upload failed.'
    toast.error('Avatar upload failed', {
      id: loadingToastId,
      description: message,
    })
  } finally {
    isUploadingAvatar.value = false
  }
}

const uploadBannerFile = async () => {
  if (!authStore.userId || !bannerFile.value) {
    toast.error('Choose a banner file before uploading.')
    return
  }

  isUploadingBanner.value = true
  const loadingToastId = toast.loading('Uploading banner...')

  try {
    const previousBanner = authStore.userProfile?.banner || ''
    const response = await mediaService.uploadAvatarFile(authStore.userId, bannerFile.value, {
      kind: 'banner',
      replace: true,
      token: authStore.authToken,
    })
    const jobId = response.data?.jobId

    if (!jobId) {
      throw new Error('The server did not return a media processing job ID.')
    }

    toast.loading('Processing banner...', { id: loadingToastId })
    const processedMedia = await mediaService.waitForProcessedMediaResult(jobId, {
      token: authStore.authToken,
      attempts: 45,
      intervalMs: 1000,
    })

    const refreshedBanner = await waitForProfileImageRefresh('banner', previousBanner)

    if (refreshedBanner) {
      syncProfileImage('banner', refreshedBanner)
      clearBannerSelection()
      toast.success('Banner uploaded successfully!', {
        id: loadingToastId,
        description: 'Your profile banner is now live.',
      })
      return
    }

    if (processedMedia.url) {
      syncProfileImage('banner', processedMedia.url)
    }

    if (import.meta.env.DEV) {
      console.info('[profile] banner job completed but profile.banner was not updated', processedMedia.job)
    }

    toast.error('Banner processed, but not attached', {
      id: loadingToastId,
      description: 'The backend accepted the image job, but /user/profile/me did not return the new banner.',
    })
  } catch (error) {
    const message = error instanceof ApiError || error instanceof Error ? error.message : 'Banner upload failed.'
    toast.error('Banner upload failed', {
      id: loadingToastId,
      description: message,
    })
  } finally {
    isUploadingBanner.value = false
  }
}

const handleAvatarFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  avatarFile.value = target.files?.[0] ?? null
}

const handleBannerFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  bannerFile.value = target.files?.[0] ?? null
}

watch(avatarFile, (file) => {
  if (avatarObjectUrl.value) {
    URL.revokeObjectURL(avatarObjectUrl.value)
    avatarObjectUrl.value = ''
  }

  if (file) {
    avatarObjectUrl.value = URL.createObjectURL(file)
  }
})

watch(bannerFile, (file) => {
  if (bannerObjectUrl.value) {
    URL.revokeObjectURL(bannerObjectUrl.value)
    bannerObjectUrl.value = ''
  }

  if (file) {
    bannerObjectUrl.value = URL.createObjectURL(file)
  }
})

onBeforeUnmount(() => {
  if (avatarObjectUrl.value) {
    URL.revokeObjectURL(avatarObjectUrl.value)
  }

  if (bannerObjectUrl.value) {
    URL.revokeObjectURL(bannerObjectUrl.value)
  }
})

const loadSkills = async () => {
  if (!authStore.isAuthenticated || !authStore.userId) {
    return
  }

  isLoadingSkills.value = true

  try {
    const response = await usersService.listUserSkills(authStore.userId, authStore.authToken)
    skills.value = response.data.map((skill) => ({
      id: skill.id || '',
      name: skill.skill || skill.name || '',
      level: skill.level,
    }))
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      toast.error('Unable to load skills.')
    }
  } finally {
    isLoadingSkills.value = false
  }
}

const loadCertifications = async () => {
  if (!authStore.isAuthenticated || !authStore.userId) {
    return
  }

  isLoadingCertifications.value = true

  try {
    const response = await usersService.listUserCertifications(authStore.userId, authStore.authToken)
    certifications.value = response.data.map((certification) => ({
      id: certification.id || '',
      name: certification.name || '',
      issuer: certification.issuer,
      issueDate: certification.issueDate,
    }))
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      toast.error('Unable to load certifications.')
    }
  } finally {
    isLoadingCertifications.value = false
  }
}

const loadEducations = async () => {
  if (!authStore.isAuthenticated || !authStore.userId) {
    return
  }

  isLoadingEducations.value = true

  try {
    const response = await usersService.listUserEducations(authStore.userId, authStore.authToken)
    educations.value = response.data.map((education) => ({
      id: education.id || '',
      school: education.school || '',
      degree: education.degree,
      field: education.field,
      startDate: education.startDate,
      endDate: education.endDate,
    }))
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      toast.error('Unable to load education records.')
    }
  } finally {
    isLoadingEducations.value = false
  }
}

const loadExperiences = async () => {
  if (!authStore.isAuthenticated || !authStore.userId) {
    return
  }

  isLoadingExperiences.value = true

  try {
    const response = await usersService.listUserExperiences(authStore.userId, authStore.authToken)
    experiences.value = response.data.map((experience) => ({
      id: experience.id || '',
      company: experience.company || '',
      title: experience.title || '',
      employmentType: experience.employmentType,
      startDate: experience.startDate || '',
      endDate: experience.endDate,
      isCurrent: experience.isCurrent === 1,
      description: experience.description,
    }))
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      toast.error('Unable to load experience records.')
    }
  } finally {
    isLoadingExperiences.value = false
  }
}

const loadPortfolios = async () => {
  if (!authStore.isAuthenticated || !authStore.userId) {
    return
  }

  isLoadingPortfolios.value = true

  try {
    const response = await usersService.listUserPortfolios(authStore.userId, authStore.authToken)
    portfolios.value = response.data.map((portfolio) => ({
      id: portfolio.id || '',
      title: portfolio.title || '',
      description: portfolio.description,
      link: portfolio.link,
    }))
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      toast.error('Unable to load portfolios.')
    }
  } finally {
    isLoadingPortfolios.value = false
  }
}

onMounted(() => {
  void loadProfile()
})

onMounted(() => {
  if (authStore.userId) {
    void loadSkills()
    void loadPortfolios()
    void loadCertifications()
    void loadEducations()
    void loadExperiences()
  }
})

const addSkill = async () => {
  if (!newSkill.value.skill.trim() || !authStore.userId) {
    toast.error('Please enter a skill name.')
    return
  }

  isAddingSkill.value = true

  try {
    const response = await usersService.addUserSkill(
      authStore.userId,
      {
        skill: newSkill.value.skill.trim(),
        level: newSkill.value.level,
      },
      authStore.authToken,
    )

    const createdSkill = response.data
    skills.value = [
      {
        id: createdSkill.id || `skill-${Date.now()}`,
        name: createdSkill.name || newSkill.value.skill,
        level: createdSkill.level || newSkill.value.level,
      },
      ...skills.value,
    ]
    toast.success('Skill added successfully!')
    newSkill.value = { skill: '', level: 'intermediate' }
    await loadSkills()
    await loadProfile()
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to add skill.'

    toast.error(message)
  } finally {
    isAddingSkill.value = false
  }
}

const deleteSkill = async (skillId: string) => {
  if (!authStore.userId || !skillId) {
    toast.error('Unable to delete this skill. Missing skill identifier.')
    return
  }

  isDeletingSkill.value = skillId

  try {
    await usersService.deleteUserSkill(authStore.userId, skillId, authStore.authToken)

    toast.success('Skill removed!')
    await loadSkills()
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to delete skill.'

    toast.error(message)
  } finally {
    isDeletingSkill.value = null
  }
}

const addPortfolio = async () => {
  if (!newPortfolio.value.title.trim() || !authStore.userId) {
    toast.error('Please enter a portfolio title.')
    return
  }

  isAddingPortfolio.value = true

  try {
    const description = optionalField(newPortfolio.value.description)
    const link = optionalField(newPortfolio.value.link)
    const response = await usersService.addUserPortfolio(
      authStore.userId,
      {
        title: newPortfolio.value.title.trim(),
        ...(description ? { description } : {}),
        ...(link ? { link } : {}),
      },
      authStore.authToken,
    )

    if (response.data) {
      portfolios.value = [
        {
          id: response.data.id || `portfolio-${Date.now()}`,
          title: response.data.title || newPortfolio.value.title,
          description: response.data.description,
          link: response.data.link,
        },
        ...portfolios.value,
      ]
    }
    toast.success('Portfolio item added successfully!')
    newPortfolio.value = { title: '', description: '', link: '' }
    await loadPortfolios()
    await loadProfile()
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to add portfolio item.'

    toast.error(message)
  } finally {
    isAddingPortfolio.value = false
  }
}

const deletePortfolio = async (portfolioId: string) => {
  if (!authStore.userId || !portfolioId) {
    toast.error('Unable to delete this portfolio item. Missing portfolio identifier.')
    return
  }

  isDeletingPortfolio.value = portfolioId

  try {
    await usersService.deleteUserPortfolio(authStore.userId, portfolioId, authStore.authToken)

    toast.success('Portfolio item removed!')
    await loadPortfolios()
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to delete portfolio item.'

    toast.error(message)
  } finally {
    isDeletingPortfolio.value = null
  }
}

const addCertification = async () => {
  if (!newCertification.value.name.trim() || !authStore.userId) {
    toast.error('Please enter a certification name.')
    return
  }

  isAddingCertification.value = true

  try {
    const issuer = optionalField(newCertification.value.issuer)
    const issueDate = optionalField(newCertification.value.issueDate)
    const response = await usersService.addUserCertification(
      authStore.userId,
      {
        name: newCertification.value.name.trim(),
        ...(issuer ? { issuer } : {}),
        ...(issueDate ? { issueDate } : {}),
      },
      authStore.authToken,
    )

    if (response.data) {
      certifications.value = [
        {
          id: response.data.id || `certification-${Date.now()}`,
          name: response.data.name || newCertification.value.name,
          issuer: response.data.issuer,
          issueDate: response.data.issueDate,
        },
        ...certifications.value,
      ]
    }
    toast.success('Certification added successfully!')
    newCertification.value = { name: '', issuer: '', issueDate: '' }
    await loadCertifications()
    await loadProfile()
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to add certification.'

    toast.error(message)
  } finally {
    isAddingCertification.value = false
  }
}

const deleteCertification = async (certificationId: string) => {
  if (!authStore.userId || !certificationId) {
    toast.error('Unable to delete this certification. Missing certification identifier.')
    return
  }

  isDeletingCertification.value = certificationId

  try {
    await usersService.deleteUserCertification(authStore.userId, certificationId, authStore.authToken)

    toast.success('Certification removed!')
    await loadCertifications()
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to delete certification.'

    toast.error(message)
  } finally {
    isDeletingCertification.value = null
  }
}

const addEducation = async () => {
  if (!newEducation.value.school.trim() || !authStore.userId) {
    toast.error('Please enter a school name.')
    return
  }

  isAddingEducation.value = true

  try {
    const degree = optionalField(newEducation.value.degree)
    const field = optionalField(newEducation.value.field)
    const startDate = optionalField(newEducation.value.startDate)
    const endDate = optionalField(newEducation.value.endDate)
    const payload = {
      school: newEducation.value.school.trim(),
      ...(degree ? { degree } : {}),
      ...(field ? { field } : {}),
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    }
    const response = await usersService.addUserEducation(authStore.userId, payload, authStore.authToken)

    if (response.data) {
      educations.value = [
        {
          id: response.data.id || `education-${Date.now()}`,
          school: response.data.school || newEducation.value.school,
          degree: response.data.degree,
          field: response.data.field,
          startDate: response.data.startDate,
          endDate: response.data.endDate,
        },
        ...educations.value,
      ]
    }
    toast.success('Education record added successfully!')
    newEducation.value = { school: '', degree: '', field: '', startDate: '', endDate: '' }
    await loadEducations()
    await loadProfile()
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to add education record.'

    toast.error(message)
  } finally {
    isAddingEducation.value = false
  }
}

const deleteEducation = async (educationId: string) => {
  if (!authStore.userId || !educationId) {
    toast.error('Unable to delete this education record. Missing education identifier.')
    return
  }

  isDeletingEducation.value = educationId

  try {
    await usersService.deleteUserEducation(authStore.userId, educationId, authStore.authToken)

    toast.success('Education record removed!')
    await loadEducations()
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to delete education record.'

    toast.error(message)
  } finally {
    isDeletingEducation.value = null
  }
}

const addExperience = async () => {
  if (!newExperience.value.company.trim() || !newExperience.value.title.trim() || !authStore.userId) {
    toast.error('Please enter company and job title.')
    return
  }

  isAddingExperience.value = true

  try {
    const employmentType = optionalField(newExperience.value.employmentType)
    const startDate = optionalField(newExperience.value.startDate)
    const endDate = optionalField(newExperience.value.endDate)
    const description = optionalField(newExperience.value.description)
    const payload = {
      company: newExperience.value.company.trim(),
      title: newExperience.value.title.trim(),
      isCurrent: newExperience.value.isCurrent,
      ...(employmentType ? { employmentType } : {}),
      ...(startDate ? { startDate } : {}),
      ...(description ? { description } : {}),
      ...(!newExperience.value.isCurrent && endDate ? { endDate } : {}),
    }
    const response = await usersService.addUserExperience(authStore.userId, payload, authStore.authToken)

    if (response.data) {
      experiences.value = [
        {
          id: response.data.id || `experience-${Date.now()}`,
          company: response.data.company || newExperience.value.company,
          title: response.data.title || newExperience.value.title,
          employmentType: response.data.employmentType,
          startDate: response.data.startDate || newExperience.value.startDate,
          endDate: response.data.endDate,
          isCurrent: Boolean(response.data.isCurrent),
          description: response.data.description,
        },
        ...experiences.value,
      ]
    }
    toast.success('Experience record added successfully!')
    newExperience.value = { company: '', title: '', employmentType: '', startDate: '', endDate: '', isCurrent: false, description: '' }
    await loadExperiences()
    await loadProfile()
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to add experience record.'

    toast.error(message)
  } finally {
    isAddingExperience.value = false
  }
}

const deleteExperience = async (experienceId: string) => {
  if (!authStore.userId || !experienceId) {
    toast.error('Unable to delete this experience record. Missing experience identifier.')
    return
  }

  isDeletingExperience.value = experienceId

  try {
    await usersService.deleteUserExperience(authStore.userId, experienceId, authStore.authToken)

    toast.success('Experience record removed!')
    await loadExperiences()
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to delete experience record.'

    toast.error(message)
  } finally {
    isDeletingExperience.value = null
  }
}

const upsertProfile = async (payload: {
  username?: string
  bio?: string
  location?: string
  avatar?: string | null
  banner?: string | null
  website?: string
  linkedin?: string
  github?: string
}) => {
  const id = authStore.userId

  if (!id) {
    throw new Error('No authenticated user ID is available for this profile update.')
  }

  if (!authStore.userProfile?.id) {
    return usersService.createUserProfile(id, payload, authStore.authToken)
  }

  try {
    return await usersService.updateUserProfile(id, payload, authStore.authToken)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new Error(
        'The backend does not expose a profile update route for existing profiles. Please ask the backend team to enable profile updates for /api/users/:id/profile or make POST /api/users/:id/profile update existing profiles.',
      )
    }

    throw error
  }
}

const saveContactSection = async () => {
  if (isSavingContact.value) {
    return
  }

  if (!form.value.location.trim()) {
    toast.error('Location is required.')
    return
  }

  isSavingContact.value = true
  try {
    const profileResponse = await upsertProfile({
      username: form.value.username,
      location: form.value.location,
      bio: authStore.userProfile?.bio || form.value.bio,
      website: authStore.userProfile?.website || form.value.website,
      linkedin: authStore.userProfile?.linkedin || form.value.linkedin,
      github: authStore.userProfile?.github || form.value.github,
    })

    authStore.signUpDraft.name = form.value.name
    authStore.signUpDraft.email = form.value.email
    authStore.signUpDraft.phone = form.value.phone
    authStore.signUpDraft.location = form.value.location
    authStore.setUserProfile(profileResponse.data ?? null)
    await loadProfile()

    toast.success('Contact details updated successfully.')
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'We could not save your contact details.'

    toast.error('Contact update failed', {
      description: message,
    })
  } finally {
    isSavingContact.value = false
  }
}

const saveProfessionalSection = async () => {
  if (isSavingProfessional.value) {
    return
  }

  if (!form.value.username.trim() || !form.value.bio.trim()) {
    toast.error('Username and bio are required.')
    return
  }

  isSavingProfessional.value = true
  try {
    const profileResponse = await upsertProfile({
      username: form.value.username,
      bio: form.value.bio,
      location: form.value.location,
      website: form.value.website,
      linkedin: form.value.linkedin,
      github: form.value.github,
    })

    authStore.signUpDraft.name = form.value.name
    authStore.signUpDraft.username = form.value.username
    authStore.signUpDraft.location = form.value.location
    authStore.signUpDraft.headline = form.value.bio
    authStore.setUserProfile(profileResponse.data ?? null)
    await loadProfile()

    toast.success('Professional profile updated successfully.')
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'We could not save your professional profile.'

    toast.error('Professional update failed', {
      description: message,
    })
  } finally {
    isSavingProfessional.value = false
  }
}

const profileModalTitle = computed(() => {
  const titles = {
    education: 'Add Education',
    experience: 'Add Experience',
    skills: 'Add Skills',
    project: 'Add Project',
    certificate: 'Add Professional Certificate',
  }

  return activeProfileModal.value ? titles[activeProfileModal.value] : 'Profile update'
})

const openProfileModal = (modal: NonNullable<typeof activeProfileModal.value>) => {
  activeProfileModal.value = modal
}

const closeProfileModal = () => {
  activeProfileModal.value = null
}

const addSkillFromModal = async () => {
  await addSkill()
  if (!newSkill.value.skill.trim()) {
    closeProfileModal()
  }
}

const addPortfolioFromModal = async () => {
  await addPortfolio()
  if (!newPortfolio.value.title.trim()) {
    closeProfileModal()
  }
}

const addCertificationFromModal = async () => {
  await addCertification()
  if (!newCertification.value.name.trim()) {
    closeProfileModal()
  }
}

const addEducationFromModal = async () => {
  await addEducation()
  if (!newEducation.value.school.trim()) {
    closeProfileModal()
  }
}

const addExperienceFromModal = async () => {
  await addExperience()
  if (!newExperience.value.company.trim() && !newExperience.value.title.trim()) {
    closeProfileModal()
  }
}
</script>

<template>
  <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-(--text-secondary)">
        <RouterLink to="/feed" class="transition hover:text-(--accent-strong)">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/profile" class="transition hover:text-(--accent-strong)">Profile</RouterLink>
        <span>/</span>
        <span class="font-medium text-(--accent-strong)">Edit Profile</span>
      </div>
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-[1.65rem] font-semibold leading-tight text-(--text-primary) sm:text-[1.95rem] lg:text-[2.1rem]">
            Edit profile
          </h1>
        </div>
      </div>
    </div>

    <div v-if="isLoadingProfile" class="animate-pulse rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4">
      <div class="h-4 w-40 rounded-full bg-[var(--surface-muted)]" />
      <div class="mt-3 h-3 w-64 max-w-full rounded-full bg-[var(--surface-muted)]" />
    </div>

    <section class="overflow-hidden rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-soft)]">
      <div class="relative aspect-[4/1] min-h-36 overflow-hidden bg-[var(--surface-secondary)]">
        <img
          v-if="bannerPreviewUrl"
          :src="bannerPreviewUrl"
          alt="Banner preview"
          class="h-full w-full object-cover"
        />
        <div
          v-else
          class="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_16%,white),color-mix(in_srgb,var(--surface-secondary)_80%,white))] text-sm font-semibold text-[var(--text-secondary)]"
        >
          Banner preview
        </div>
        <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.36))]" />

        <label
          class="absolute right-4 top-4 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-white/90 text-[var(--text-primary)] shadow-[var(--shadow-soft)] transition hover:bg-white hover:text-[var(--accent-strong)]"
          aria-label="Upload banner image"
          title="Upload banner image"
        >
          <Camera class="h-4 w-4" />
          <input ref="bannerFileInput" type="file" accept="image/*" class="sr-only" @change="handleBannerFileChange" />
        </label>

        <div
          v-if="bannerFile"
          class="absolute bottom-4 right-4 flex flex-wrap items-center justify-end gap-2"
        >
          <button
            type="button"
            :disabled="isUploadingBanner"
            class="inline-flex h-10 items-center rounded-[0.75rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            @click="uploadBannerFile"
          >
            {{ isUploadingBanner ? 'Saving...' : 'Save banner' }}
          </button>
          <button
            type="button"
            :disabled="isUploadingBanner"
            class="inline-flex h-10 items-center rounded-[0.75rem] bg-white/90 px-4 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--shadow-soft)] transition hover:bg-white hover:text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-60"
            @click="clearBannerSelection"
          >
            Cancel
          </button>
        </div>
      </div>

      <div class="relative px-5 pb-5 pt-28 sm:px-7 sm:pb-7 sm:pl-52 sm:pt-6">
        <div class="absolute -top-16 left-5 sm:left-7">
          <div class="relative h-32 w-32 overflow-hidden rounded-full border-4 border-[var(--surface-primary)] bg-[var(--surface-secondary)] shadow-[var(--shadow-elevated)] sm:h-36 sm:w-36">
            <img
              v-if="avatarPreviewUrl"
              :src="avatarPreviewUrl"
              alt="Profile image preview"
              class="h-full w-full object-cover"
            />
            <span
              v-else
              class="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_84%,white),color-mix(in_srgb,var(--accent-strong)_72%,white))] text-3xl font-semibold text-white"
            >
              {{ profileInitials }}
            </span>
            <label
              class="absolute bottom-2 right-2 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/70 bg-white/95 text-[var(--text-primary)] shadow-[var(--shadow-soft)] transition hover:text-[var(--accent-strong)]"
              aria-label="Upload profile image"
              title="Upload profile image"
            >
              <Camera class="h-4 w-4" />
              <input ref="avatarFileInput" type="file" accept="image/*" class="sr-only" @change="handleAvatarFileChange" />
            </label>
          </div>
        </div>

        <div class="flex min-h-[9.5rem] flex-col justify-end gap-4 sm:min-h-32 sm:flex-row sm:items-end sm:justify-between">
          <div class="min-w-0 pt-3 sm:pt-0">
            <h2 class="text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">{{ displayName }}</h2>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">
              {{ currentJobTitle || 'Add your role' }} <span class="text-[var(--border-strong,var(--border-soft))]">-</span> {{ currentWorkplace || 'Add your workplace' }}
            </p>
            <p v-if="avatarFile || bannerFile" class="mt-2 text-xs font-semibold text-[var(--accent-strong)]">
              Preview updated. Save the selected image to publish it.
            </p>
          </div>

          <div v-if="avatarFile" class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              :disabled="isUploadingAvatar"
              class="inline-flex h-10 items-center justify-center rounded-[0.75rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              @click="uploadAvatarFile"
            >
              {{ isUploadingAvatar ? 'Saving...' : 'Save photo' }}
            </button>
            <button
              type="button"
              :disabled="isUploadingAvatar"
              class="inline-flex h-10 items-center justify-center rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--danger)] hover:text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-60"
              @click="clearAvatarSelection"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="item in [
          { label: 'ADD EDUCATION', modal: 'education' },
          { label: 'ADD EXPERIENCE', modal: 'experience' },
          { label: 'ADD SKILLS', modal: 'skills' },
          { label: 'ADD PROJECT', modal: 'project' },
          { label: 'ADD PROFESSIONAL CERTIFICATE', modal: 'certificate' },
        ]"
        :key="item.label"
        type="button"
        class="rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-left text-[0.82rem] font-semibold text-[var(--accent-strong)] transition hover:border-[color:var(--accent-soft)] hover:bg-[var(--surface-secondary)]"
        @click="openProfileModal(item.modal as NonNullable<typeof activeProfileModal>)"
      >
        {{ item.label }}
      </button>
    </div>

    <section class="space-y-6">
      <div class="border-b border-[color:var(--border-soft)] pb-2">
        <h2 class="inline-flex border-b-2 border-[color:var(--accent)] pb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
          Public Information
        </h2>
      </div>

      <div class="grid gap-5 lg:grid-cols-2">
        <div class="space-y-5">
          <label class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Display name</span>
            <input v-model="form.name" type="text" class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)]" />
          </label>
          <label class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Location</span>
            <input v-model="form.location" type="text" class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)]" />
          </label>
        </div>
        <div class="space-y-5">
          <label class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Current Workplace</span>
            <input v-model="currentWorkplace" type="text" class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)]" />
          </label>
          <label class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Current Job Title</span>
            <input v-model="currentJobTitle" type="text" class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)]" />
          </label>
        </div>
      </div>

      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">About me</span>
        <div class="mt-2 overflow-hidden rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)]">
          <div class="flex flex-wrap gap-2 border-b border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 py-2 text-[0.78rem] font-semibold text-[var(--text-secondary)]">
            <span>Paragraph</span>
            <span>B</span>
            <span>I</span>
            <span>U</span>
            <span>•</span>
            <span>1.</span>
            <span>Link</span>
          </div>
          <textarea v-model="form.bio" rows="9" class="w-full resize-y bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none" />
        </div>
      </label>

      <button
        type="button"
        :disabled="isSavingProfessional"
        class="inline-flex h-11 items-center rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        @click="saveProfessionalSection"
      >
        {{ isSavingProfessional ? 'Saving...' : 'Save changes' }}
      </button>
    </section>

    <div v-if="false" class="space-y-6 rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)] sm:p-6">
      <!-- Public Identity Section -->
      <section class="overflow-hidden rounded-[1.35rem] border border-[color:var(--border-soft)]">
        <div class="relative h-[18rem] overflow-hidden bg-[var(--surface-secondary)]">
          <div v-if="bannerPreviewUrl" class="absolute inset-0">
            <img :src="bannerPreviewUrl" alt="Banner preview" class="h-full w-full object-cover" />
          </div>
          <div v-else class="absolute inset-0 bg-[linear-gradient(135deg,#e8e9ff,#fef3c7)]" />
          <div class="absolute inset-0 bg-[#12121f]" />

          <div class="absolute left-5 bottom-5 flex items-center gap-4">
            <div class="relative h-20 w-20 overflow-hidden rounded-full border border-white bg-[var(--surface-primary)] shadow-[var(--shadow-soft)]">
              <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" alt="Avatar preview" class="h-full w-full object-cover" />
              <span v-else class="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
                {{ profileInitials }}
              </span>
            </div>
            <div class="text-white">
              <h2 class="text-2xl font-semibold leading-tight">{{ displayName }}</h2>
            </div>
          </div>
        </div>

        <div class="space-y-3 p-5 sm:p-6">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
            Public identity
          </p>

          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div class="space-y-3">
              <label class="block text-sm font-semibold text-[var(--text-primary)]">Avatar</label>
              <div class="relative">
                <input
                  type="file"
                  accept="image/*"
                  @change="handleAvatarFileChange"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div class="w-full text-sm text-[var(--text-secondary)] p-3 rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-primary)] transition-colors cursor-pointer">
                  {{ avatarFile?.name || 'Click to select avatar image' }}
                </div>
              </div>
              <button
                type="button"
                :disabled="!avatarFile || isUploadingAvatar"
                @click="uploadAvatarFile"
                class="inline-flex w-full items-center justify-center gap-2 rounded-[1rem] px-4 py-3 text-sm font-semibold transition"
                :class="avatarFile && !isUploadingAvatar ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]' : 'bg-[var(--accent-soft)] text-white cursor-not-allowed'"
              >
                <Sparkles v-if="isUploadingAvatar" class="h-4 w-4 animate-spin" />
                {{ isUploadingAvatar ? 'Uploading...' : 'Upload Avatar' }}
              </button>
            </div>

            <div class="space-y-3">
              <label class="block text-sm font-semibold text-[var(--text-primary)]">Banner</label>
              <div class="relative">
                <input
                  type="file"
                  accept="image/*"
                  @change="handleBannerFileChange"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div class="w-full text-sm text-[var(--text-secondary)] p-3 rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-primary)] transition-colors cursor-pointer">
                  {{ bannerFile?.name || 'Click to select banner image' }}
                </div>
              </div>
              <button
                type="button"
                :disabled="!bannerFile || isUploadingBanner"
                @click="uploadBannerFile"
                class="inline-flex w-full items-center justify-center gap-2 rounded-[1rem] px-4 py-3 text-sm font-semibold transition"
                :class="bannerFile && !isUploadingBanner ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]' : 'bg-[var(--accent-soft)] text-white cursor-not-allowed'"
              >
                <Sparkles v-if="isUploadingBanner" class="h-4 w-4 animate-spin" />
                {{ isUploadingBanner ? 'Uploading...' : 'Upload Banner' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact Details Section -->
      <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] p-5 sm:p-6">
        <div class="flex items-start gap-3">
          <ShieldCheck class="mt-1 h-5 w-5 text-[var(--accent-strong)]" />
          <div>
            <h2 class="text-[1.2rem] font-semibold text-[var(--text-primary)]">Contact details</h2>
          </div>
        </div>

        <div class="mt-5 space-y-5">
          <div class="space-y-2">
            <label class="text-sm font-semibold text-[var(--text-primary)]">Email address</label>
            <div class="relative">
              <Mail class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input v-model="form.email" type="email" class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] pl-11 pr-4 text-sm outline-none transition focus:border-[var(--accent)]" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-semibold text-[var(--text-primary)]">Phone number</label>
            <div class="relative">
              <Phone class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input v-model="form.phone" type="tel" class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] pl-11 pr-4 text-sm outline-none transition focus:border-[var(--accent)]" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-semibold text-[var(--text-primary)]">Location</label>
            <div class="relative">
              <MapPin class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input v-model="form.location" type="text" class="h-13 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] pl-11 pr-4 text-sm outline-none transition focus:border-[var(--accent)]" />
            </div>
          </div>

          <div class="flex justify-end">
            <button
              type="button"
              :disabled="isSavingContact"
              class="inline-flex items-center justify-center rounded-[1rem] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
              @click="saveContactSection"
            >
              {{ isSavingContact ? 'Saving...' : 'Save Contact Details' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Professional Profile Section -->
      <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] p-5 sm:p-6">
        <div class="flex items-start gap-3">
          <Globe class="mt-1 h-5 w-5 text-[var(--accent-strong)]" />
          <div>
            <h2 class="text-[1.2rem] font-semibold text-[var(--text-primary)]">Professional profile</h2>
          </div>
        </div>

        <div class="mt-5 space-y-5">
          <div class="space-y-2">
            <label class="text-sm font-semibold text-[var(--text-primary)]">Full name</label>
            <input v-model="form.name" type="text" class="w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-4 text-sm outline-none transition focus:border-[var(--accent)]" placeholder="Your full name" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-semibold text-[var(--text-primary)]">Username</label>
            <div class="relative">
              <UserRound class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input v-model="form.username" type="text" class="w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] py-4 pl-11 pr-4 text-sm outline-none transition focus:border-[var(--accent)]" placeholder="Username" />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-semibold text-[var(--text-primary)]">Bio</label>
            <textarea v-model="form.bio" rows="4" class="w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-4 text-sm outline-none transition focus:border-[var(--accent)]" placeholder="Tell us about yourself..." />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-semibold text-[var(--text-primary)]">Website</label>
            <input v-model="form.website" type="url" class="w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-4 text-sm outline-none transition focus:border-[var(--accent)]" placeholder="https://yourwebsite.com" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-semibold text-[var(--text-primary)]">LinkedIn</label>
            <input v-model="form.linkedin" type="url" class="w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-4 text-sm outline-none transition focus:border-[var(--accent)]" placeholder="https://linkedin.com/in/yourprofile" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-semibold text-[var(--text-primary)]">GitHub</label>
            <input v-model="form.github" type="url" class="w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-4 text-sm outline-none transition focus:border-[var(--accent)]" placeholder="https://github.com/yourusername" />
          </div>

          <div class="flex justify-end">
            <button
              type="button"
              :disabled="isSavingProfessional"
              class="inline-flex items-center justify-center rounded-[1rem] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
              @click="saveProfessionalSection"
            >
              {{ isSavingProfessional ? 'Saving...' : 'Save Professional Profile' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Skills Section -->
      <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] p-5 sm:p-6">
        <div class="flex items-start gap-3">
          <Award class="mt-1 h-5 w-5 text-[var(--accent-strong)]" />
          <div>
            <h2 class="text-[1.2rem] font-semibold text-[var(--text-primary)]">Skills</h2>
            <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              Add your professional skills to showcase your expertise.
            </p>
          </div>
        </div>

        <div class="mt-5 space-y-5">
          <div class="space-y-3">
            <div class="space-y-2">
              <label class="text-sm font-semibold text-[var(--text-primary)]">Skill name</label>
              <input
                v-model="newSkill.skill"
                type="text"
                placeholder="e.g., JavaScript, Python, Design..."
                class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-semibold text-[var(--text-primary)]">Level</label>
              <select
                v-model="newSkill.level"
                class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <button
              type="button"
              :disabled="isAddingSkill || !newSkill.skill.trim()"
              class="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)] w-full"
              @click="addSkill"
            >
              <Plus class="h-4 w-4" />
              {{ isAddingSkill ? 'Adding...' : 'Add Skill' }}
            </button>
          </div>
        </div>
      </section>

      <!-- Portfolio Section -->
      <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] p-5 sm:p-6">
        <div class="flex items-start gap-3">
          <BookOpen class="mt-1 h-5 w-5 text-[var(--accent-strong)]" />
          <div>
            <h2 class="text-[1.2rem] font-semibold text-[var(--text-primary)]">Portfolio</h2>
            <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              Showcase your best work and projects to potential employers and collaborators.
            </p>
          </div>
        </div>

        <div class="mt-5 space-y-5">
            <div class="space-y-3">
              <div class="space-y-2">
                <label class="text-sm font-semibold text-[var(--text-primary)]">Project title</label>
                <input
                  v-model="newPortfolio.title"
                  type="text"
                  placeholder="e.g., E-commerce Mobile App..."
                  class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
                />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-semibold text-[var(--text-primary)]">Description</label>
                <textarea
                  v-model="newPortfolio.description"
                  placeholder="Brief description of the project..."
                  rows="3"
                  class="w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                />
              </div>

              <div class="space-y-2">
                <label class="text-sm font-semibold text-[var(--text-primary)]">Link (optional)</label>
                <input
                  v-model="newPortfolio.link"
                  type="url"
                  placeholder="https://example.com/project"
                  class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
                />
              </div>

              <button
                type="button"
                :disabled="isAddingPortfolio || !newPortfolio.title.trim()"
                class="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)] w-full"
                @click="addPortfolio"
              >
                <Plus class="h-4 w-4" />
                {{ isAddingPortfolio ? 'Adding...' : 'Add Portfolio Item' }}
              </button>
            </div>

        </div>
      </section>

      <!-- Certifications Section -->
      <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] p-5 sm:p-6">
        <div class="flex items-start gap-3">
          <Award class="mt-1 h-5 w-5 text-[var(--accent-strong)]" />
          <div>
            <h2 class="text-[1.2rem] font-semibold text-[var(--text-primary)]">Certifications</h2>
            <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              Showcase your professional certifications and credentials.
            </p>
          </div>
        </div>

        <div class="mt-5 space-y-5">
            <div class="space-y-3">
              <div class="space-y-2">
                <label class="text-sm font-semibold text-[var(--text-primary)]">Certification name</label>
                <input
                  v-model="newCertification.name"
                  type="text"
                  placeholder="e.g., AWS Certified Solutions Architect..."
                  class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
                />
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-[var(--text-primary)]">Issuing organization</label>
                  <input
                    v-model="newCertification.issuer"
                    type="text"
                    placeholder="e.g., Amazon Web Services..."
                    class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-semibold text-[var(--text-primary)]">Issue date</label>
                    <input
                    v-model="newCertification.issueDate"
                    type="date"
                    class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <button
                type="button"
                :disabled="isAddingCertification || !newCertification.name.trim()"
                class="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)] w-full"
                @click="addCertification"
              >
                <Plus class="h-4 w-4" />
                {{ isAddingCertification ? 'Adding...' : 'Add Certification' }}
              </button>
            </div>
        </div>
      </section>

      <!-- Education Section -->
      <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] p-5 sm:p-6">
        <div class="flex items-start gap-3">
          <GraduationCap class="mt-1 h-5 w-5 text-[var(--accent-strong)]" />
          <div>
            <h2 class="text-[1.2rem] font-semibold text-[var(--text-primary)]">Education</h2>
            <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              Share your educational background and academic achievements.
            </p>
          </div>
        </div>

        <div class="mt-5 space-y-5">
            <div class="space-y-3">
              <div class="space-y-2">
                <label class="text-sm font-semibold text-[var(--text-primary)]">School/University</label>
                <input
                  v-model="newEducation.school"
                  type="text"
                  placeholder="e.g., Harvard University..."
                  class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
                />
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-[var(--text-primary)]">Degree</label>
                  <input
                    v-model="newEducation.degree"
                    type="text"
                    placeholder="e.g., Bachelor of Science..."
                    class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-semibold text-[var(--text-primary)]">Field of study</label>
                  <input
                    v-model="newEducation.field"
                    type="text"
                    placeholder="e.g., Computer Science..."
                    class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-[var(--text-primary)]">Start date</label>
                  <input
                    v-model="newEducation.startDate"
                    type="date"
                    class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-semibold text-[var(--text-primary)]">End date (optional)</label>
                  <input
                    v-model="newEducation.endDate"
                    type="date"
                    class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <button
                type="button"
                :disabled="isAddingEducation || !newEducation.school.trim()"
                class="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)] w-full"
                @click="addEducation"
              >
                <Plus class="h-4 w-4" />
                {{ isAddingEducation ? 'Adding...' : 'Add Education' }}
              </button>
            </div>
        </div>
      </section>

      <!-- Experience Section -->
      <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] p-5 sm:p-6">
        <div class="flex items-start gap-3">
          <Briefcase class="mt-1 h-5 w-5 text-[var(--accent-strong)]" />
          <div>
            <h2 class="text-[1.2rem] font-semibold text-[var(--text-primary)]">Work Experience</h2>
            <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              Highlight your professional experience and career journey.
            </p>
          </div>
        </div>

        <div class="mt-5 space-y-5">
            <div class="space-y-3">
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-[var(--text-primary)]">Company</label>
                  <input
                    v-model="newExperience.company"
                    type="text"
                    placeholder="e.g., Google..."
                    class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-semibold text-[var(--text-primary)]">Job title</label>
                  <input
                    v-model="newExperience.title"
                    type="text"
                    placeholder="e.g., Software Engineer..."
                    class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-semibold text-[var(--text-primary)]">Employment type</label>
                <select
                  v-model="newExperience.employmentType"
                  class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
                >
                  <option value="">Select type</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="space-y-2">
                  <label class="text-sm font-semibold text-[var(--text-primary)]">Start date</label>
                  <input
                    v-model="newExperience.startDate"
                    type="date"
                    class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)]"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-sm font-semibold text-[var(--text-primary)]">End date</label>
                  <input
                    v-model="newExperience.endDate"
                    type="date"
                    :disabled="newExperience.isCurrent"
                  class="h-12 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm outline-none transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)]"
                  />
                </div>
              </div>

              <div class="flex items-center gap-3">
                <input
                  id="isCurrent"
                  v-model="newExperience.isCurrent"
                  type="checkbox"
                  class="h-4 w-4 rounded border-[color:var(--border-soft)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <label for="isCurrent" class="text-sm text-[var(--text-primary)]">I currently work here</label>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-semibold text-[var(--text-primary)]">Description</label>
                <textarea
                  v-model="newExperience.description"
                  placeholder="Describe your responsibilities and achievements..."
                  rows="3"
                  class="w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                />
              </div>

              <button
                type="button"
                :disabled="isAddingExperience || !newExperience.company.trim() || !newExperience.title.trim()"
                class="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)] w-full"
                @click="addExperience"
              >
                <Plus class="h-4 w-4" />
                {{ isAddingExperience ? 'Adding...' : 'Add Experience' }}
              </button>
            </div>
        </div>
      </section>
    </div>
  </section>

  <ResponsiveOverlay
    :model-value="activeProfileModal !== null"
    :title="profileModalTitle"
    label="Profile section"
    max-width-class="sm:max-w-2xl"
    @update:model-value="(value) => { if (!value) closeProfileModal() }"
  >
    <div v-if="activeProfileModal === 'education'" class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="sm:col-span-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">School/University</span>
          <input v-model="newEducation.school" type="text" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Degree</span>
          <input v-model="newEducation.degree" type="text" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Field of study</span>
          <input v-model="newEducation.field" type="text" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Start date</span>
          <input v-model="newEducation.startDate" type="date" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">End date</span>
          <input v-model="newEducation.endDate" type="date" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
      </div>
      <button type="button" :disabled="isAddingEducation || !newEducation.school.trim()" class="inline-flex h-10 items-center rounded-[0.75rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white disabled:opacity-60" @click="addEducationFromModal">
        {{ isAddingEducation ? 'Adding...' : 'Add Education' }}
      </button>
    </div>

    <div v-else-if="activeProfileModal === 'experience'" class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-2">
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Company</span>
          <input v-model="newExperience.company" type="text" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Job title</span>
          <input v-model="newExperience.title" type="text" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label class="sm:col-span-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Employment type</span>
          <select v-model="newExperience.employmentType" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]">
            <option value="">Select type</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="freelance">Freelance</option>
          </select>
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Start date</span>
          <input v-model="newExperience.startDate" type="date" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">End date</span>
          <input v-model="newExperience.endDate" type="date" :disabled="newExperience.isCurrent" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)] disabled:opacity-60" />
        </label>
      </div>
      <label class="flex items-center gap-2 text-sm text-[var(--text-primary)]">
        <input v-model="newExperience.isCurrent" type="checkbox" class="h-4 w-4 rounded border-[color:var(--border-soft)]" />
        I currently work here
      </label>
      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Description</span>
        <textarea v-model="newExperience.description" rows="3" class="mt-2 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
      </label>
      <button type="button" :disabled="isAddingExperience || !newExperience.company.trim() || !newExperience.title.trim()" class="inline-flex h-10 items-center rounded-[0.75rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white disabled:opacity-60" @click="addExperienceFromModal">
        {{ isAddingExperience ? 'Adding...' : 'Add Experience' }}
      </button>
    </div>

    <div v-else-if="activeProfileModal === 'skills'" class="space-y-4">
      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Skill name</span>
        <input v-model="newSkill.skill" type="text" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
      </label>
      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Level</span>
        <select v-model="newSkill.level" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]">
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="expert">Expert</option>
        </select>
      </label>
      <button type="button" :disabled="isAddingSkill || !newSkill.skill.trim()" class="inline-flex h-10 items-center rounded-[0.75rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white disabled:opacity-60" @click="addSkillFromModal">
        {{ isAddingSkill ? 'Adding...' : 'Add Skill' }}
      </button>
    </div>

    <div v-else-if="activeProfileModal === 'project'" class="space-y-4">
      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Project title</span>
        <input v-model="newPortfolio.title" type="text" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
      </label>
      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Description</span>
        <textarea v-model="newPortfolio.description" rows="3" class="mt-2 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
      </label>
      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Link</span>
        <input v-model="newPortfolio.link" type="url" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
      </label>
      <button type="button" :disabled="isAddingPortfolio || !newPortfolio.title.trim()" class="inline-flex h-10 items-center rounded-[0.75rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white disabled:opacity-60" @click="addPortfolioFromModal">
        {{ isAddingPortfolio ? 'Adding...' : 'Add Project' }}
      </button>
    </div>

    <div v-else-if="activeProfileModal === 'certificate'" class="space-y-4">
      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Certificate name</span>
        <input v-model="newCertification.name" type="text" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
      </label>
      <div class="grid gap-3 sm:grid-cols-2">
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Issuer</span>
          <input v-model="newCertification.issuer" type="text" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Issue date</span>
          <input v-model="newCertification.issueDate" type="date" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
      </div>
      <button type="button" :disabled="isAddingCertification || !newCertification.name.trim()" class="inline-flex h-10 items-center rounded-[0.75rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white disabled:opacity-60" @click="addCertificationFromModal">
        {{ isAddingCertification ? 'Adding...' : 'Add Certificate' }}
      </button>
    </div>

  </ResponsiveOverlay>
</template>
