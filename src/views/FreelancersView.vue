<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BadgeCheck,
  BriefcaseBusiness,
  Calendar,
  Image,
  Mail,
  MapPin,
  Search,
  Upload,
  Wallet,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ApiError } from '@/lib/api'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import SkillPillInput from '@/components/SkillPillInput.vue'
import {
  type FreelanceJobRecord,
  type FreelancerRecord,
  freelancersService,
} from '@/services/freelancers'
import { collectUserSkills, usersService, type MyProfileData } from '@/services/users'
import { NIGERIA_COUNTRY, nigeriaProfileLocationOptions, nigeriaStates } from '@/data/locations'
import { useAuthStore } from '@/stores/auth'
import { useFreelancersStore } from '@/stores/freelancers'
import { getDisplayName } from '@/utils/displayName'
import { richTextToPlainText } from '@/utils/richText'
import { slugify } from '@/utils/slugify'

const authStore = useAuthStore()
const freelancersStore = useFreelancersStore()
const route = useRoute()
const router = useRouter()
const activeTab = ref<'freelancers' | 'jobs'>('freelancers')
const skillQuery = ref('')
const locationQuery = ref('')
const availabilityFilter = ref('Any of the options')
const isRegisterModalOpen = ref(false)
const isPostJobModalOpen = ref(false)
const isSubmittingFreelancerRegistration = ref(false)
const isSubmittingFreelanceJob = ref(false)
const agreedToTerms = ref(false)
const freelancerTermsAgreed = ref(false)
const passportFileName = ref('')
const passportFile = ref<File | null>(null)
const passportPreviewUrl = ref('')
const visibleFreelancerCount = ref(2)
const visibleJobCount = ref(1)
const revealSentinel = ref<HTMLElement | null>(null)
const isApplyingToFreelanceJob = ref(false)
const isFreelanceJobDetailOpen = ref(false)
const isEmailModalOpen = ref(false)
const isSendingEmail = ref(false)
const isPrefillingFreelancerForm = ref(false)
const selectedFreelancer = ref<FreelancerRecord | null>(null)
const emailForm = ref({
  category: '',
  skills: '',
  location: '',
  jobType: 'remote',
  message: '',
})
const freelancerForm = ref({
  name: '',
  title: '',
  skills: '',
  location: '',
  bio: '',
  availability: 'available_now',
  remoteOnly: false,
})
const freelanceJobForm = ref({
  title: '',
  skills: '',
  location: '',
  type: 'project-based',
  description: '',
  qualifications: '',
  minFee: '',
  maxFee: '',
  currency: 'NGN',
  companyName: '',
  applicationEndDate: '',
})
const freelanceApplicationForm = ref({
  proposal: '',
  bidAmount: '',
  currency: 'NGN',
  attachmentMediaIds: '',
})
let revealObserver: IntersectionObserver | null = null

const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'FR'

const getFreelancerPath = (freelancer: FreelancerRecord) => `/profile/view/${freelancer.userId}`

const getFreelancerEmail = (freelancer?: FreelancerRecord | null) =>
  freelancer?.email || freelancer?.userEmail || ''

const getRequesterEmail = () =>
  authStore.signUpDraft.email || authStore.currentUser?.email || ''

const formatLocationWithCountry = (value?: string | null) => {
  const location = value?.trim()

  if (!location) {
    return ''
  }

  return location.toLowerCase().endsWith(`, ${NIGERIA_COUNTRY.toLowerCase()}`)
    ? location
    : `${location}, ${NIGERIA_COUNTRY}`
}

const getPlainCardText = (value?: string | null) => richTextToPlainText(value)

const formatStatusLabel = (value?: string | null) => {
  if (!value) {
    return ''
  }

  if (value.toLowerCase() === 'pending_review') {
    return 'Awaiting admin approval'
  }

  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const formatFee = (job: FreelanceJobRecord) => {
  if (job.feeLabel) {
    return job.feeLabel
  }

  const currency = job.currency || 'NGN'
  const format = (value?: number | null) =>
    typeof value === 'number' && Number.isFinite(value)
      ? new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(value)
      : ''
  const min = format(job.minFee)
  const max = format(job.maxFee)

  if (min && max) {
    return `${min} - ${max}`
  }

  return min || max || 'Fee not listed'
}

const formatDeadline = (value?: string | null) => {
  if (!value) {
    return 'Deadline not listed'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const parseAttachmentIds = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const getProfileName = (profile?: MyProfileData | null) =>
  getDisplayName(
    profile?.profile?.displayName,
    profile?.profile?.username,
    profile?.user?.name,
    profile?.user?.username,
    profile?.name,
    authStore.userProfile?.displayName,
    authStore.userProfile?.username,
    authStore.currentUser?.name,
    authStore.currentUser?.username,
    authStore.signUpDraft.name,
  )

const getProfileTitle = (profile?: MyProfileData | null) =>
  profile?.profile?.currentJobTitle ||
  profile?.profile?.current_job_title ||
  profile?.current_job_title ||
  authStore.userProfile?.currentJobTitle ||
  authStore.userProfile?.current_job_title ||
  authStore.signUpDraft.jobTitle ||
  authStore.signUpDraft.headline ||
  ''

const getProfileLocation = (profile?: MyProfileData | null) => {
  const location =
    profile?.profile?.location ||
    profile?.location ||
    authStore.userProfile?.location ||
    authStore.signUpDraft.location ||
    authStore.signUpDraft.state ||
    ''

  const normalizedLocation = location.replace(new RegExp(`,\\s*${NIGERIA_COUNTRY}$`, 'i'), '')

  return nigeriaStates.includes(normalizedLocation) ? formatLocationWithCountry(normalizedLocation) : ''
}

const getProfileBio = (profile?: MyProfileData | null) =>
  profile?.profile?.bio ||
  profile?.profile?.description ||
  profile?.profile?.about ||
  profile?.bio ||
  authStore.userProfile?.bio ||
  authStore.userProfile?.description ||
  authStore.userProfile?.about ||
  authStore.signUpDraft.headline ||
  ''

const getProfileSkills = (profile?: MyProfileData | null) =>
  collectUserSkills(profile?.skills, profile, authStore.signUpDraft.interests)
    .map((skill) => skill.name || skill.skill || skill.skillName || skill.skill_name || '')
    .map((skill) => skill.trim())
    .filter(Boolean)
    .join(', ')

const getStoredProfileData = (): MyProfileData => ({
  user: authStore.currentUser,
  profile: authStore.userProfile,
  skills: collectUserSkills(authStore.signUpDraft.interests),
  name: authStore.signUpDraft.name,
  location: authStore.signUpDraft.location || authStore.signUpDraft.state,
  bio: authStore.signUpDraft.headline,
  current_job_title: authStore.signUpDraft.jobTitle,
})

const applyFreelancerPrefill = (profile?: MyProfileData | null) => {
  const nextValues = {
    name: getProfileName(profile),
    title: getProfileTitle(profile),
    skills: getProfileSkills(profile),
    location: getProfileLocation(profile),
    bio: getProfileBio(profile),
  }

  Object.entries(nextValues).forEach(([key, value]) => {
    if (!value) {
      return
    }

    const formKey = key as keyof Pick<typeof freelancerForm.value, 'name' | 'title' | 'skills' | 'location' | 'bio'>
    if (!freelancerForm.value[formKey]) {
      freelancerForm.value[formKey] = value
    }
  })
}

const prefillFreelancerForm = async () => {
  applyFreelancerPrefill(getStoredProfileData())

  if (!authStore.authToken || isPrefillingFreelancerForm.value) {
    return
  }

  isPrefillingFreelancerForm.value = true

  try {
    const response = await usersService.getMyProfile(authStore.authToken)
    if (response.data?.profile) {
      authStore.setUserProfile(response.data.profile)
    }
    applyFreelancerPrefill(response.data)
  } catch {
    applyFreelancerPrefill(getStoredProfileData())
  } finally {
    isPrefillingFreelancerForm.value = false
  }
}

const openFreelancerRegistration = () => {
  isRegisterModalOpen.value = true
  void prefillFreelancerForm()
}

const selectedFreelanceJob = computed(() => freelancersStore.currentFreelanceJob)
const selectedJobCategory = computed(() => {
  const value = route.query.category
  return String(Array.isArray(value) ? value[0] ?? '' : value ?? '').trim()
})
const selectedCategoryLabel = computed(() =>
  selectedJobCategory.value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase()),
)

const filteredFreelancers = computed(() => {
  const skill = skillQuery.value.trim().toLowerCase()
  const location = locationQuery.value.trim().toLowerCase()

  return freelancersStore.freelancers.filter((freelancer) => {
    const categoryMatch =
      !selectedJobCategory.value ||
      freelancer.skills.some((item) => slugify(item) === selectedJobCategory.value)
    const skillMatch =
      !skill ||
      freelancer.skills.some((item) => item.toLowerCase().includes(skill)) ||
      freelancer.title.toLowerCase().includes(skill)
    const locationMatch =
      !location ||
      formatLocationWithCountry(freelancer.location).toLowerCase().includes(location) ||
      String(freelancer.location || '').toLowerCase().includes(location)
    const availabilityMatch =
      availabilityFilter.value === 'Any of the options' ||
      (availabilityFilter.value === 'Remote only' && freelancer.remoteOnly) ||
      freelancer.status.toLowerCase() === availabilityFilter.value.toLowerCase() ||
      freelancer.availability.toLowerCase() === availabilityFilter.value.toLowerCase().replace(/\s+/g, '_')

    return categoryMatch && skillMatch && locationMatch && availabilityMatch
  })
})

const filteredJobs = computed(() => {
  const skill = skillQuery.value.trim().toLowerCase()
  const location = locationQuery.value.trim().toLowerCase()

  return freelancersStore.freelanceJobs.filter((job) => {
    const categoryMatch =
      !selectedJobCategory.value ||
      job.skills.some((item) => slugify(item) === selectedJobCategory.value)
    const skillMatch =
      !skill ||
      job.skills.some((item) => item.toLowerCase().includes(skill)) ||
      job.title.toLowerCase().includes(skill)
    const locationMatch =
      !location ||
      formatLocationWithCountry(job.location).toLowerCase().includes(location) ||
      String(job.location || '').toLowerCase().includes(location)

    return categoryMatch && skillMatch && locationMatch
  })
})

const visibleFreelancers = computed(() =>
  filteredFreelancers.value.slice(0, visibleFreelancerCount.value),
)
const visibleJobs = computed(() => filteredJobs.value.slice(0, visibleJobCount.value))
const hasMoreFreelancers = computed(
  () => visibleFreelancerCount.value < filteredFreelancers.value.length,
)
const hasMoreJobs = computed(() => visibleJobCount.value < filteredJobs.value.length)
const hasMoreActiveItems = computed(() =>
  activeTab.value === 'freelancers' ? hasMoreFreelancers.value : hasMoreJobs.value,
)

const revealNextItems = () => {
  if (activeTab.value === 'freelancers') {
    visibleFreelancerCount.value = Math.min(
      visibleFreelancerCount.value + 2,
      filteredFreelancers.value.length,
    )
    return
  }

  visibleJobCount.value = Math.min(visibleJobCount.value + 1, filteredJobs.value.length)
}

const resetRevealCounts = () => {
  visibleFreelancerCount.value = 2
  visibleJobCount.value = 1
}

const setupRevealObserver = () => {
  revealObserver?.disconnect()
  revealObserver = null

  if (!revealSentinel.value || typeof IntersectionObserver === 'undefined') {
    return
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting) && hasMoreActiveItems.value) {
        revealNextItems()
      }
    },
    { threshold: 0.4 },
  )
  revealObserver.observe(revealSentinel.value)
}

watch(
  [
    activeTab,
    skillQuery,
    locationQuery,
    availabilityFilter,
    selectedJobCategory,
  ],
  () => {
    resetRevealCounts()
    nextTick(setupRevealObserver)
  },
)

watch(
  () => route.query.tab,
  (tab) => {
    activeTab.value = tab === 'jobs' ? 'jobs' : 'freelancers'
  },
  { immediate: true },
)

const selectTab = (tab: 'freelancers' | 'jobs') => {
  void router.replace({
    path: '/freelancers',
    query: {
      tab,
      ...(selectedJobCategory.value ? { category: selectedJobCategory.value } : {}),
    },
  })
}

watch(hasMoreActiveItems, () => {
  nextTick(setupRevealObserver)
})

onMounted(() => {
  void freelancersStore.loadFreelancers()
  void freelancersStore.loadFreelanceJobs()
  nextTick(setupRevealObserver)
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()

  if (passportPreviewUrl.value) {
    URL.revokeObjectURL(passportPreviewUrl.value)
  }
})

const submitFreelancerRegistration = async () => {
  if (isSubmittingFreelancerRegistration.value) {
    return
  }

  if (!freelancerTermsAgreed.value) {
    toast.error('Accept the terms before submitting.')
    return
  }

  isSubmittingFreelancerRegistration.value = true

  try {
    await freelancersStore.createFreelancer({
      name: freelancerForm.value.name,
      title: freelancerForm.value.title,
      skills: splitList(freelancerForm.value.skills),
      location: formatLocationWithCountry(freelancerForm.value.location),
      bio: freelancerForm.value.bio,
      availability: freelancerForm.value.availability,
      remoteOnly: freelancerForm.value.remoteOnly,
      agreedToTerms: freelancerTermsAgreed.value,
    })
    toast.success('Freelancer profile submitted', {
      description: 'Your freelancer profile is ready for review.',
    })
    isRegisterModalOpen.value = false
    freelancerForm.value = {
      name: '',
      title: '',
      skills: '',
      location: '',
      bio: '',
      availability: 'available_now',
      remoteOnly: false,
    }
    freelancerTermsAgreed.value = false
    clearPassportUpload()
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to submit freelancer profile.'
    toast.error('Freelancer failed', { description: message })
  } finally {
    isSubmittingFreelancerRegistration.value = false
  }
}

const submitFreelanceJob = async () => {
  if (isSubmittingFreelanceJob.value) {
    return
  }

  if (!agreedToTerms.value) {
    toast.error('Accept the terms before posting.')
    return
  }

  isSubmittingFreelanceJob.value = true

  try {
    await freelancersStore.createFreelanceJob({
      title: freelanceJobForm.value.title,
      skills: splitList(freelanceJobForm.value.skills),
      location: freelanceJobForm.value.location,
      type: freelanceJobForm.value.type,
      description: freelanceJobForm.value.description,
      qualifications: freelanceJobForm.value.qualifications,
      minFee: freelanceJobForm.value.minFee ? Number(freelanceJobForm.value.minFee) : undefined,
      maxFee: freelanceJobForm.value.maxFee ? Number(freelanceJobForm.value.maxFee) : undefined,
      currency: freelanceJobForm.value.currency,
      companyName: freelanceJobForm.value.companyName,
      applicationEndDate: freelanceJobForm.value.applicationEndDate,
      agreedToTerms: agreedToTerms.value,
    })
    toast.success('Freelance job submitted', {
      description: 'Your freelance job will show after admin approval.',
    })
    isPostJobModalOpen.value = false
    freelanceJobForm.value = {
      title: '',
      skills: '',
      location: '',
      type: 'project-based',
      description: '',
      qualifications: '',
      minFee: '',
      maxFee: '',
      currency: 'NGN',
      companyName: '',
      applicationEndDate: '',
    }
    agreedToTerms.value = false
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to post freelance job.'
    toast.error('Freelance job failed', { description: message })
  } finally {
    isSubmittingFreelanceJob.value = false
  }
}

const openEmailModal = (freelancer: FreelancerRecord) => {
  selectedFreelancer.value = freelancer
  emailForm.value = {
    category: freelancer.skills?.[0] || freelancer.title || '',
    skills: freelancer.skills?.join(', ') || '',
    location: formatLocationWithCountry(freelancer.location),
    jobType: freelancer.remoteOnly ? 'remote' : 'hybrid',
    message: '',
  }
  isEmailModalOpen.value = true
}

const closeEmailModal = () => {
  if (isSendingEmail.value) {
    return
  }

  isEmailModalOpen.value = false
  selectedFreelancer.value = null
  emailForm.value = {
    category: '',
    skills: '',
    location: '',
    jobType: 'remote',
    message: '',
  }
}

const sendFreelancerEmail = async () => {
  if (!selectedFreelancer.value || isSendingEmail.value) {
    return
  }

  const requesterEmail = getRequesterEmail()
  const category = emailForm.value.category.trim()
  const skills = emailForm.value.skills.trim()
  const location = emailForm.value.location.trim()
  const jobType = emailForm.value.jobType.trim()
  const message = emailForm.value.message.trim()

  if (!category || !message) {
    toast.error('Add category and message before sending.')
    return
  }

  if (!requesterEmail) {
    toast.error('Your account email is unavailable.', {
      description: 'Please refresh your profile or sign in again before contacting a freelancer.',
    })
    return
  }

  const freelancerEmail = getFreelancerEmail(selectedFreelancer.value)
  isSendingEmail.value = true

  try {
    const emailMessage = [
      `Category / Type of Work: ${category}`,
      skills ? `Skills: ${skills}` : '',
      location ? `Location: ${location}` : '',
      jobType ? `Job Type: ${formatStatusLabel(jobType)}` : '',
      '',
      message,
    ].filter(Boolean).join('\n')

    const emailResponse = await freelancersService.emailFreelancer(
      {
        freelancerId: selectedFreelancer.value.id,
        email: freelancerEmail || requesterEmail,
        freelancerEmail: freelancerEmail || undefined,
        recipientEmail: freelancerEmail || undefined,
        replyToEmail: requesterEmail,
        category,
        skills,
        location,
        jobType,
        message: emailMessage,
      },
      authStore.authToken,
    )

    if (emailResponse?.success === false) {
      throw new Error((emailResponse as { message?: string }).message || 'Unable to send this email.')
    }

    toast.success('Message submitted', {
      description: `We sent your message to ${selectedFreelancer.value.name}.`,
    })
    isEmailModalOpen.value = false
    selectedFreelancer.value = null
    emailForm.value = {
      category: '',
      skills: '',
      location: '',
      jobType: 'remote',
      message: '',
    }
  } catch (error) {
    const messageText = error instanceof ApiError ? error.message : 'Unable to send this email.'
    toast.error('Email failed', { description: messageText })
  } finally {
    isSendingEmail.value = false
  }
}

const openFreelanceJobDetail = async (job: FreelanceJobRecord) => {
  freelancersStore.currentFreelanceJob = job
  isFreelanceJobDetailOpen.value = true
  freelanceApplicationForm.value = {
    proposal: '',
    bidAmount: '',
    currency: job.currency || 'NGN',
    attachmentMediaIds: '',
  }

  await freelancersStore.loadFreelanceJob(job.slug || job.id)
}

const applyToFreelanceJob = async () => {
  if (!selectedFreelanceJob.value || isApplyingToFreelanceJob.value) {
    return
  }

  if (!authStore.authToken) {
    toast.error('Sign in required', {
      description: 'Please sign in again before applying.',
    })
    return
  }

  isApplyingToFreelanceJob.value = true

  try {
    await freelancersStore.applyToCurrentFreelanceJob({
      proposal: freelanceApplicationForm.value.proposal.trim() || undefined,
      bidAmount: freelanceApplicationForm.value.bidAmount
        ? Number(freelanceApplicationForm.value.bidAmount)
        : undefined,
      currency: freelanceApplicationForm.value.currency || undefined,
      attachmentMediaIds: parseAttachmentIds(freelanceApplicationForm.value.attachmentMediaIds),
    })
    toast.success('Freelance application submitted')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to submit this application.'
    toast.error('Application failed', { description: message })
  } finally {
    isApplyingToFreelanceJob.value = false
  }
}

const handlePassportUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  if (passportPreviewUrl.value) {
    URL.revokeObjectURL(passportPreviewUrl.value)
    passportPreviewUrl.value = ''
  }

  passportFile.value = file
  passportFileName.value = file?.name ?? ''

  if (file) {
    passportPreviewUrl.value = URL.createObjectURL(file)
  }
}

const clearPassportUpload = () => {
  if (passportPreviewUrl.value) {
    URL.revokeObjectURL(passportPreviewUrl.value)
    passportPreviewUrl.value = ''
  }

  passportFile.value = null
  passportFileName.value = ''
}
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-5 px-1">
      <div class="max-w-3xl">
        <h1 class="text-[1.9rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[2.3rem]">
          Freelancers
        </h1>
        <p class="mt-3 max-w-2xl text-[0.98rem] leading-8 text-[var(--text-secondary)]">
          A pool of self-employed individuals who offer specialized services, operating in fields like writing, design, IT, marketing, and many more.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="inline-flex h-10 items-center justify-center rounded-[0.8rem] border border-[color:var(--accent)] bg-transparent px-4 text-[0.86rem] font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--surface-secondary)]"
          @click="openFreelancerRegistration"
        >
          Register as a Freelancer
        </button>
        <button
          type="button"
          class="inline-flex h-10 items-center justify-center rounded-[0.8rem] border border-[color:var(--accent)] px-4 text-[0.86rem] font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--surface-secondary)]"
          @click="isPostJobModalOpen = true"
        >
          Post Freelancer Job
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <div class="flex gap-6 border-b border-[color:var(--border-soft)]">
        <button
          type="button"
          class="border-b-2 px-0 pb-3 text-[0.95rem] font-semibold transition"
          :class="activeTab === 'freelancers' ? 'border-[color:var(--accent)] text-[var(--accent-strong)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'"
          @click="selectTab('freelancers')"
        >
          Freelancers
        </button>
        <button
          type="button"
          class="border-b-2 px-0 pb-3 text-[0.95rem] font-semibold transition"
          :class="activeTab === 'jobs' ? 'border-[color:var(--accent)] text-[var(--accent-strong)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'"
          @click="selectTab('jobs')"
        >
          Freelance jobs
        </button>
      </div>

      <div
        :class="
          activeTab === 'jobs'
            ? 'grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]'
            : 'grid gap-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)_12rem_auto]'
        "
      >
        <template v-if="activeTab === 'freelancers'">
          <label class="flex h-11 items-center gap-2 rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-[var(--text-secondary)]">
            <Search class="h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              v-model="skillQuery"
              type="search"
              placeholder="Search by skill"
              class="min-w-0 flex-1 bg-transparent text-[0.86rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </label>
          <label class="flex h-11 items-center gap-2 rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-[var(--text-secondary)]">
            <MapPin class="h-4 w-4 text-[var(--text-tertiary)]" />
            <select
              v-model="locationQuery"
              class="min-w-0 flex-1 bg-transparent text-[0.86rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            >
              <option value="">All locations</option>
              <option v-for="location in nigeriaProfileLocationOptions" :key="location" :value="location">
                {{ location }}
              </option>
            </select>
          </label>
          <select
            v-model="availabilityFilter"
            class="h-11 rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-[0.86rem] text-[var(--text-primary)] outline-none"
          >
            <option>Any of the options</option>
            <option>Certified</option>
            <option>Available now</option>
            <option>Remote only</option>
          </select>
        </template>

        <label
          v-else
          class="flex h-11 items-center gap-2 rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-[var(--text-secondary)]"
        >
          <Search class="h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            v-model="skillQuery"
            type="search"
            placeholder="Search all jobs"
            class="min-w-0 flex-1 bg-transparent text-[0.86rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          />
        </label>

        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-[0.8rem] bg-[var(--accent)] px-5 text-[0.86rem] font-semibold text-white transition hover:bg-[var(--accent-strong)]"
        >
          Search
          <Search class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div class="space-y-4">
      <div class="space-y-3">
        <template v-if="activeTab === 'freelancers'">
          <article
            v-if="freelancersStore.isLoadingFreelancers"
            v-for="item in 3"
            :key="`freelancer-skeleton-${item}`"
            class="animate-pulse rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)]"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span class="h-14 w-14 shrink-0 rounded-full bg-[var(--surface-secondary)]" />
              <div class="min-w-0 flex-1 space-y-3">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div class="space-y-2">
                    <div class="h-5 w-40 rounded-full bg-[var(--surface-secondary)]" />
                    <div class="h-4 w-56 rounded-full bg-[var(--surface-secondary)]" />
                  </div>
                  <span class="h-9 w-28 rounded-[0.75rem] bg-[var(--surface-secondary)]" />
                </div>
                <div class="h-4 w-2/3 rounded-full bg-[var(--surface-secondary)]" />
                <div class="h-3 w-1/2 rounded-full bg-[var(--surface-secondary)]" />
                <div class="h-3 w-full rounded-full bg-[var(--surface-secondary)]" />
              </div>
            </div>
          </article>

          <article
            v-if="!freelancersStore.isLoadingFreelancers"
            v-for="freelancer in visibleFreelancers"
            :key="freelancer.id"
            class="rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)] transition hover:border-[color:var(--accent-soft)]"
          >
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex min-w-0 items-center gap-3">
                  <RouterLink
                    :to="getFreelancerPath(freelancer)"
                    class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)] text-xs font-semibold text-[var(--accent-strong)] sm:h-14 sm:w-14"
                  >
                    <img loading="lazy" decoding="async"
                      v-if="freelancer.avatar"
                      :src="freelancer.avatar"
                      :alt="freelancer.name"
                      class="h-full w-full object-cover"
                    />
                    <span v-else>{{ getInitials(freelancer.name) }}</span>
                  </RouterLink>

                  <div class="min-w-0">
                    <RouterLink
                      :to="getFreelancerPath(freelancer)"
                      class="block truncate text-[0.98rem] font-semibold leading-tight text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
                    >
                      {{ freelancer.name }}
                    </RouterLink>
                    <p class="mt-1 truncate text-[0.86rem] font-medium text-[var(--text-secondary)]">{{ freelancer.title }}</p>
                  </div>
                </div>

                <button
                  type="button"
                  class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[0.85rem] border border-[color:var(--border-soft)] px-4 text-[0.86rem] font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
                  @click="openEmailModal(freelancer)"
                >
                  <Mail class="h-3.5 w-3.5" />
                  Email {{ freelancer.name.split(' ')[0] || 'user' }}
                </button>
              </div>

              <div class="min-w-0">
                <p class="text-[1.08rem] font-semibold leading-7 text-[var(--text-primary)] sm:text-[1.2rem]">
                  {{ freelancer.skills.join(', ') }}
                </p>
                <p class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9rem] text-[var(--text-secondary)]">
                  <span class="font-semibold text-[var(--text-primary)]">Location</span>
                  <span>-</span>
                  <span>{{ formatLocationWithCountry(freelancer.location) || 'Location not listed' }}</span>
                  <span class="text-[var(--text-tertiary)]">|</span>
                  <span class="inline-flex items-center gap-1">
                    <span class="font-semibold text-[var(--text-primary)]">Status</span>
                    <span>-</span>
                    <span class="font-semibold text-[var(--danger)]">{{ formatStatusLabel(freelancer.status) }}</span>
                    <BadgeCheck v-if="freelancer.status === 'certified'" class="h-3.5 w-3.5 text-[var(--accent-strong)]" />
                  </span>
                </p>
                <p class="mt-5 line-clamp-3 text-[1rem] leading-8 text-[var(--text-secondary)] sm:text-[1.05rem]">
                  {{ getPlainCardText(freelancer.bio) || 'No bio has been added yet.' }}
                </p>
              </div>
            </div>
          </article>

          <button
            v-if="hasMoreFreelancers"
            ref="revealSentinel"
            type="button"
            class="mx-auto flex h-10 items-center justify-center rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-[0.82rem] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="revealNextItems"
          >
            Scroll to reveal more freelancers
          </button>

          <article
            v-if="!freelancersStore.isLoadingFreelancers && visibleFreelancers.length === 0"
            class="rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 text-center shadow-[var(--shadow-soft)]"
          >
            <h2 class="text-base font-semibold text-[var(--text-primary)]">
              {{ selectedCategoryLabel ? `No freelancers found for ${selectedCategoryLabel}.` : 'No freelancers found.' }}
            </h2>
            <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {{ freelancersStore.freelancersError || (selectedCategoryLabel ? 'There are currently no freelancer profiles in this category.' : 'Freelancers will appear here once profiles are available for this filter.') }}
            </p>
            <button
              v-if="!freelancersStore.freelancersError"
              type="button"
              class="mt-4 inline-flex h-10 items-center justify-center rounded-[0.8rem] border border-[color:var(--accent)] bg-transparent px-4 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--surface-secondary)]"
              @click="isRegisterModalOpen = true"
            >
              Register as a freelancer
            </button>
          </article>
        </template>

        <template v-else>
          <div
            v-if="freelancersStore.isLoadingFreelanceJobs"
            class="divide-y divide-[color:var(--border-soft)] rounded-[1rem] bg-[var(--surface-primary)] px-4 py-2 shadow-[var(--shadow-soft)]"
          >
            <article
              v-for="item in 3"
              :key="`freelance-job-skeleton-${item}`"
              class="animate-pulse py-5"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0 flex-1 space-y-3">
                  <div class="h-5 w-2/5 rounded-full bg-[var(--surface-secondary)]" />
                  <div class="h-3 w-full rounded-full bg-[var(--surface-secondary)]" />
                  <div class="h-3 w-2/3 rounded-full bg-[var(--surface-secondary)]" />
                </div>
                <span class="h-7 w-32 rounded-full bg-[var(--surface-secondary)]" />
              </div>
              <div class="mt-3 flex flex-wrap gap-1.5">
                <span class="h-6 w-16 rounded-[0.45rem] bg-[var(--surface-secondary)]" />
                <span class="h-6 w-20 rounded-[0.45rem] bg-[var(--surface-secondary)]" />
                <span class="h-6 w-14 rounded-[0.45rem] bg-[var(--surface-secondary)]" />
              </div>
              <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span class="h-4 w-48 rounded-full bg-[var(--surface-secondary)]" />
                <span class="h-4 w-28 rounded-full bg-[var(--surface-secondary)]" />
              </div>
            </article>
          </div>

          <div v-else class="space-y-4">
            <article
              v-for="job in visibleJobs"
              :key="job.id"
              class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]"
            >
              <div class="min-w-0">
                <button
                  type="button"
                  class="block text-left text-[1.08rem] font-semibold leading-tight text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
                  @click="openFreelanceJobDetail(job)"
                >
                  {{ job.title }}
                </button>

                <p class="mt-2 inline-flex items-center gap-2 text-[0.86rem] font-semibold text-[var(--text-secondary)]">
                  <BriefcaseBusiness class="h-4 w-4 text-[var(--accent-strong)]" />
                  {{ job.companyName || 'Company not listed' }}
                </p>

                <p class="mt-2 line-clamp-2 max-w-3xl text-[0.84rem] leading-5 text-[var(--text-secondary)]">
                  {{ getPlainCardText(job.description) || 'No description has been added yet.' }}
                </p>

                <div class="mt-3 flex flex-wrap gap-2">
                  <span class="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-[0.82rem] text-[var(--text-secondary)] sm:max-w-[18rem]">
                    <MapPin class="h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
                    <span class="truncate">{{ formatLocationWithCountry(job.location) || 'Location not listed' }}</span>
                  </span>
                  <span class="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-[0.82rem] text-[var(--text-secondary)] sm:max-w-[12rem]">
                    <BriefcaseBusiness class="h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
                    <span class="truncate">{{ job.type || 'Type not listed' }}</span>
                  </span>
                  <span class="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-[0.82rem] text-[var(--text-secondary)] sm:max-w-[18rem]">
                    <Wallet class="h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
                    <span class="truncate">{{ formatFee(job) }}</span>
                  </span>
                  <span class="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-[0.82rem] font-semibold text-[var(--danger)]">
                    {{ job.verified ? 'Verified' : formatStatusLabel(job.status) }}
                  </span>
                </div>

                <div class="mt-3 flex flex-wrap gap-2">
                  <span
                    v-for="skill in job.skills || []"
                    :key="`${job.id}-${skill}`"
                    class="rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 py-1 text-[0.76rem] font-semibold text-[var(--text-secondary)]"
                  >
                    {{ skill }}
                  </span>
                </div>

                <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p class="text-[0.84rem] font-medium text-[var(--text-secondary)]">
                    Deadline: <span class="font-semibold text-[var(--text-primary)]">{{ formatDeadline(job.applicationEndDate) }}</span>
                  </p>
                  <button
                    type="button"
                    class="inline-flex h-9 items-center justify-center rounded-[0.75rem] bg-[var(--accent)] px-4 text-[0.82rem] font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                    @click="openFreelanceJobDetail(job)"
                  >
                    View and apply
                  </button>
                </div>
              </div>
            </article>
          </div>

          <button
            v-if="hasMoreJobs"
            ref="revealSentinel"
            type="button"
            class="mx-auto flex h-10 items-center justify-center rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-[0.82rem] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="revealNextItems"
          >
            Scroll to reveal more jobs
          </button>

          <article
            v-if="!freelancersStore.isLoadingFreelanceJobs && visibleJobs.length === 0"
            class="rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 text-center shadow-[var(--shadow-soft)]"
          >
            <h2 class="text-base font-semibold text-[var(--text-primary)]">
              {{ selectedCategoryLabel ? `No freelance jobs found for ${selectedCategoryLabel}.` : 'No freelance jobs found.' }}
            </h2>
            <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {{ freelancersStore.freelanceJobsError || (selectedCategoryLabel ? 'There are currently no freelance jobs in this category.' : 'Freelance jobs will appear here once clients publish matching work.') }}
            </p>
            <button
              v-if="!freelancersStore.freelanceJobsError"
              type="button"
              class="mt-4 inline-flex h-10 items-center justify-center rounded-[0.8rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              @click="isPostJobModalOpen = true"
            >
              Post a freelance job
            </button>
          </article>
        </template>
      </div>

    </div>
  </section>

  <ResponsiveOverlay
    v-model="isPostJobModalOpen"
    label="Freelance Job"
    title="Post Freelance Job"
    max-width-class="sm:max-w-4xl"
  >
    <form class="space-y-4" @submit.prevent="submitFreelanceJob">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="sm:col-span-2">
          <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Job Title / Designation:<span class="text-[var(--danger)]">*</span></span>
          <input v-model="freelanceJobForm.title" class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" placeholder="Senior Software Engineer, Business Development Mgr" />
        </label>
        <label class="sm:col-span-2">
          <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Required skills:<span class="text-[var(--danger)]">*</span></span>
          <SkillPillInput v-model="freelanceJobForm.skills" placeholder="Java, Project Mgt, Event management" />
        </label>
        <label>
          <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Location:<span class="text-[var(--danger)]">*</span></span>
          <select v-model="freelanceJobForm.location" class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]">
            <option value="">Select location</option>
            <option v-for="location in nigeriaProfileLocationOptions" :key="location" :value="location">
              {{ location }}
            </option>
          </select>
        </label>
        <label>
          <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Job Type:<span class="text-[var(--danger)]">*</span></span>
          <select v-model="freelanceJobForm.type" class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]">
            <option value="contract">Contract</option>
            <option value="part-time">Part time</option>
            <option value="project-based">Project based</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>
        <label class="sm:col-span-2">
          <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Job Description:<span class="text-[var(--danger)]">*</span></span>
          <textarea v-model="freelanceJobForm.description" rows="3" class="mt-1 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label class="sm:col-span-2">
          <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Qualifications and Skills:<span class="text-[var(--danger)]">*</span></span>
          <RichTextEditor
            v-model="freelanceJobForm.qualifications"
            placeholder="List the qualifications, skills, certifications, and requirements for this freelance job."
          />
        </label>
        <label>
          <span class="text-[0.82rem] text-[var(--text-secondary)]">Min fee:N</span>
          <input v-model="freelanceJobForm.minFee" type="number" class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-[0.82rem] text-[var(--text-secondary)]">Max fee:N</span>
          <input v-model="freelanceJobForm.maxFee" type="number" class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-[0.82rem] text-[var(--text-secondary)]">Company Name :<span class="text-[var(--danger)]">*</span></span>
          <input v-model="freelanceJobForm.companyName" class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-[0.82rem] text-[var(--text-secondary)]">Application end date:<span class="text-[var(--danger)]">*</span></span>
          <div class="mt-1 flex h-11 items-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3">
            <input v-model="freelanceJobForm.applicationEndDate" type="date" class="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            <Calendar class="h-4 w-4 text-[var(--text-tertiary)]" />
          </div>
        </label>
      </div>
      <label class="flex items-start gap-2 text-[0.82rem] leading-6 text-[var(--text-secondary)]">
        <input v-model="agreedToTerms" type="checkbox" class="mt-1 h-4 w-4 rounded border-[color:var(--border-soft)]" />
        <span>
          <span class="text-[var(--danger)]">*</span>
          By posting, you agreed to the <RouterLink to="/terms-and-conditions" class="text-[var(--accent-strong)]">Terms of Service</RouterLink> and <RouterLink to="/privacy-policy" class="text-[var(--accent-strong)]">Privacy Policy</RouterLink>.
        </span>
      </label>
      <div class="flex justify-end gap-2 border-t border-[color:var(--border-soft)] pt-4">
        <button
          type="submit"
          :disabled="isSubmittingFreelanceJob"
          class="inline-flex h-10 items-center rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
        >
          {{ isSubmittingFreelanceJob ? 'Submitting...' : 'Submit' }}
        </button>
      </div>
    </form>
  </ResponsiveOverlay>

  <ResponsiveOverlay
    v-model="isRegisterModalOpen"
    label="Freelancers"
    title="Join Freelancers"
    max-width-class="sm:max-w-4xl"
  >
    <form class="space-y-4" @submit.prevent="submitFreelancerRegistration">
      <div class="space-y-4">
        <div class="space-y-4">
          <label class="block">
            <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Your Name</span>
            <input v-model="freelancerForm.name" placeholder="Take from user profile" class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]" />
          </label>
          <label class="block">
            <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Job Title</span>
            <input v-model="freelancerForm.title" placeholder="Take from user profile" class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]" />
          </label>
          <label class="block">
            <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Skills</span>
            <SkillPillInput v-model="freelancerForm.skills" placeholder="Take from user profile, else, Java, Project Mgt.." />
          </label>
          <label class="block">
            <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Location</span>
            <select v-model="freelancerForm.location" class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]">
              <option value="">Select location</option>
              <option v-for="location in nigeriaProfileLocationOptions" :key="location" :value="location">
                {{ location }}
              </option>
            </select>
          </label>
        </div>

        <section class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4">
          <div class="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center">
            <div class="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-sm font-semibold tracking-[0.04em] text-[var(--text-secondary)] sm:h-32 sm:w-32">
              <img loading="lazy" decoding="async"
                v-if="passportPreviewUrl"
                :src="passportPreviewUrl"
                alt="Passport preview"
                class="h-full w-full object-cover object-center"
              />
              <span v-else>300 x 270</span>
            </div>
            <div class="min-w-0 space-y-3">
              <div>
                <p class="text-sm font-semibold text-[var(--text-primary)]">Passport photo</p>
                <p class="mt-1 text-[0.78rem] leading-5 text-[var(--text-secondary)]">Maximum file size: 10 MB.</p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <label class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--accent-soft)] hover:text-[var(--accent-strong)]">
                  <Image class="h-4 w-4" />
                  Upload Passport
                  <input type="file" accept="image/*" class="sr-only" @change="handlePassportUpload" />
                </label>
                <button
                  v-if="passportFileName"
                  type="button"
                  class="inline-flex h-10 items-center rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-[0.78rem] font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--danger)] hover:text-[var(--danger)]"
                  @click="clearPassportUpload"
                >
                  Remove
                </button>
              </div>
              <p v-if="passportFileName" class="flex min-w-0 items-center gap-1 text-[0.76rem] font-medium text-[var(--accent-strong)]">
                <Upload class="h-3.5 w-3.5 shrink-0" />
                <span class="truncate">{{ passportFileName }}</span>
              </p>
            </div>
          </div>
        </section>

        <label class="mt-6 block">
          <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">
            About - Describe your academic achievements, skills, experiences
          </span>
          <textarea v-model="freelancerForm.bio" rows="3" class="mt-2 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>

        <label class="mt-4 flex items-start gap-2 text-[0.82rem] leading-6 text-[var(--text-secondary)]">
          <input v-model="freelancerTermsAgreed" type="checkbox" class="mt-1 h-4 w-4 rounded border-[color:var(--border-soft)]" />
          <span>
            By Submitting, you agree to the <RouterLink to="/terms-and-conditions" class="text-[var(--accent-strong)]">Terms of Service</RouterLink> and <RouterLink to="/privacy-policy" class="text-[var(--accent-strong)]">Privacy Policy</RouterLink>.
          </span>
        </label>

        <button
          type="submit"
          :disabled="isSubmittingFreelancerRegistration"
          class="mt-4 inline-flex h-10 items-center rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
        >
          {{ isSubmittingFreelancerRegistration ? 'Submitting...' : 'Submit' }}
        </button>
      </div>

    </form>
  </ResponsiveOverlay>

  <ResponsiveOverlay
    v-model="isEmailModalOpen"
    label="Email freelancer"
    title="Compose Email"
    max-width-class="sm:max-w-3xl"
  >
    <form class="space-y-5" @submit.prevent="sendFreelancerEmail">
      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Category / Type of Work<span class="text-[var(--danger)]">*</span></span>
        <input
          v-model="emailForm.category"
          :disabled="isSendingEmail"
          class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-70"
          placeholder="Writing, App dev., Websites, Data entry, etc."
        />
      </label>

      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">skills</span>
        <input
          v-model="emailForm.skills"
          :disabled="isSendingEmail"
          class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-70"
        />
      </label>

      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Location</span>
        <select
          v-model="emailForm.location"
          :disabled="isSendingEmail"
          class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <option value="">Add location</option>
          <option v-for="location in nigeriaProfileLocationOptions" :key="location" :value="location">
            {{ location }}
          </option>
        </select>
      </label>

      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Job Type</span>
        <select
          v-model="emailForm.jobType"
          :disabled="isSendingEmail"
          class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="onsite">Onsite</option>
          <option value="contract">Contract</option>
          <option value="part-time">Part time</option>
          <option value="project-based">Project based</option>
        </select>
      </label>

      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Message<span class="text-[var(--danger)]">*</span></span>
        <textarea
          v-model="emailForm.message"
          rows="4"
          :disabled="isSendingEmail"
          class="mt-2 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-70"
        />
      </label>

      <button
        type="submit"
        :disabled="isSendingEmail"
        class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
      >
        {{ isSendingEmail ? 'Sending...' : 'Send' }}
        <span aria-hidden="true">→</span>
      </button>

      <div class="flex justify-end border-t border-[color:var(--border-soft)] pt-4">
        <button
          type="button"
          :disabled="isSendingEmail"
          class="inline-flex h-10 items-center justify-center rounded-[0.75rem] bg-[var(--danger)] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          @click="closeEmailModal"
        >
          Close
        </button>
      </div>
    </form>
  </ResponsiveOverlay>

  <ResponsiveOverlay
    v-model="isFreelanceJobDetailOpen"
    label="Freelance job"
    title="Freelance job details"
    max-width-class="sm:max-w-4xl"
  >
    <div v-if="selectedFreelanceJob" class="space-y-5">
      <div class="rounded-[1rem] bg-[var(--surface-secondary)] p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              {{ selectedFreelanceJob.companyName }}
            </p>
            <h2 class="mt-2 text-xl font-semibold text-[var(--text-primary)]">{{ selectedFreelanceJob.title }}</h2>
          </div>
          <span class="inline-flex w-fit rounded-full bg-[var(--surface-primary)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
            {{ selectedFreelanceJob.verified ? 'Verified' : formatStatusLabel(selectedFreelanceJob.status) }}
          </span>
        </div>

        <div class="mt-4 grid gap-2 sm:grid-cols-3">
          <span class="rounded-[0.75rem] bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            {{ formatLocationWithCountry(selectedFreelanceJob.location) || 'Location not listed' }}
          </span>
          <span class="rounded-[0.75rem] bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            {{ selectedFreelanceJob.type }}
          </span>
          <span class="rounded-[0.75rem] bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            {{ formatFee(selectedFreelanceJob) }}
          </span>
        </div>
      </div>

      <div
        v-if="freelancersStore.isLoadingFreelanceJobDetail"
        class="space-y-3 rounded-[1rem] border border-[color:var(--border-soft)] p-4"
        aria-label="Loading freelance job details"
      >
        <div class="h-4 w-2/5 animate-pulse rounded-full bg-[var(--surface-muted)]" />
        <div class="h-4 w-full animate-pulse rounded-full bg-[var(--surface-muted)]" />
        <div class="h-4 w-4/5 animate-pulse rounded-full bg-[var(--surface-muted)]" />
      </div>
      <div v-else-if="freelancersStore.freelanceJobDetailError" class="rounded-[1rem] border border-[color:var(--border-soft)] p-4 text-sm text-[var(--text-secondary)]">
        {{ freelancersStore.freelanceJobDetailError }}
      </div>

      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <section class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-[var(--text-primary)]">Description</h3>
            <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              {{ getPlainCardText(selectedFreelanceJob.description) || 'No description has been added yet.' }}
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-[var(--text-primary)]">Qualifications</h3>
            <div
              v-if="selectedFreelanceJob.qualifications"
              class="prose-content mt-2 text-sm leading-7 text-[var(--text-secondary)]"
              v-html="selectedFreelanceJob.qualifications"
            />
            <p v-else class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">No qualifications have been added yet.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="skill in selectedFreelanceJob.skills"
              :key="skill"
              class="rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]"
            >
              {{ skill }}
            </span>
          </div>
        </section>

        <form class="space-y-4 rounded-[1rem] border border-[color:var(--border-soft)] p-4" @submit.prevent="applyToFreelanceJob">
          <h3 class="text-base font-semibold text-[var(--text-primary)]">Apply</h3>
          <label class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Proposal</span>
            <textarea
              v-model="freelanceApplicationForm.proposal"
              rows="5"
              class="mt-2 w-full rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent-soft)]"
              placeholder="I can deliver this in 3 weeks."
            />
          </label>
          <div class="grid gap-3 sm:grid-cols-2">
            <label>
              <span class="text-sm font-semibold text-[var(--text-primary)]">Bid amount</span>
              <input
                v-model="freelanceApplicationForm.bidAmount"
                type="number"
                class="mt-2 h-10 w-full rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]"
                placeholder="300000"
              />
            </label>
            <label>
              <span class="text-sm font-semibold text-[var(--text-primary)]">Currency</span>
              <input
                v-model="freelanceApplicationForm.currency"
                class="mt-2 h-10 w-full rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]"
              />
            </label>
          </div>
          <label class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Attachment media IDs</span>
            <input
              v-model="freelanceApplicationForm.attachmentMediaIds"
              class="mt-2 h-10 w-full rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]"
              placeholder="media-uuid, another-media-uuid"
            />
          </label>
          <button
            type="submit"
            :disabled="isApplyingToFreelanceJob || selectedFreelanceJob.hasApplied === true"
            class="inline-flex h-10 w-full items-center justify-center rounded-[0.8rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
          >
            {{ selectedFreelanceJob.hasApplied ? 'Applied' : isApplyingToFreelanceJob ? 'Submitting...' : 'Submit application' }}
          </button>
        </form>
      </div>
    </div>
  </ResponsiveOverlay>
</template>
