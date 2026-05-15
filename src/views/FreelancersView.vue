<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  BadgeCheck,
  BriefcaseBusiness,
  Calendar,
  Image,
  Mail,
  MapPin,
  Search,
  Upload,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ApiError } from '@/lib/api'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import {
  type FreelanceJobRecord,
  type FreelancerRecord,
} from '@/services/freelancers'
import { useAuthStore } from '@/stores/auth'
import { useFreelancersStore } from '@/stores/freelancers'

const authStore = useAuthStore()
const freelancersStore = useFreelancersStore()
const activeTab = ref<'freelancers' | 'jobs'>('freelancers')
const skillQuery = ref('')
const locationQuery = ref('')
const availabilityFilter = ref('Any of the options')
const isRegisterModalOpen = ref(false)
const isPostJobModalOpen = ref(false)
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

const selectedFreelanceJob = computed(() => freelancersStore.currentFreelanceJob)

const filteredFreelancers = computed(() => {
  const skill = skillQuery.value.trim().toLowerCase()
  const location = locationQuery.value.trim().toLowerCase()

  return freelancersStore.freelancers.filter((freelancer) => {
    const skillMatch =
      !skill ||
      freelancer.skills.some((item) => item.toLowerCase().includes(skill)) ||
      freelancer.title.toLowerCase().includes(skill)
    const locationMatch = !location || String(freelancer.location || '').toLowerCase().includes(location)
    const availabilityMatch =
      availabilityFilter.value === 'Any of the options' ||
      (availabilityFilter.value === 'Remote only' && freelancer.remoteOnly) ||
      freelancer.status.toLowerCase() === availabilityFilter.value.toLowerCase() ||
      freelancer.availability.toLowerCase() === availabilityFilter.value.toLowerCase().replace(/\s+/g, '_')

    return skillMatch && locationMatch && availabilityMatch
  })
})

const filteredJobs = computed(() => {
  const skill = skillQuery.value.trim().toLowerCase()
  const location = locationQuery.value.trim().toLowerCase()

  return freelancersStore.freelanceJobs.filter((job) => {
    const skillMatch =
      !skill ||
      job.skills.some((item) => item.toLowerCase().includes(skill)) ||
      job.title.toLowerCase().includes(skill)
    const locationMatch = !location || String(job.location || '').toLowerCase().includes(location)

    return skillMatch && locationMatch
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

watch([activeTab, skillQuery, locationQuery, availabilityFilter], () => {
  resetRevealCounts()
  nextTick(setupRevealObserver)
})

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
  if (!freelancerTermsAgreed.value) {
    toast.error('Accept the terms before submitting.')
    return
  }

  try {
    await freelancersStore.createFreelancer({
      name: freelancerForm.value.name,
      title: freelancerForm.value.title,
      skills: splitList(freelancerForm.value.skills),
      location: freelancerForm.value.location,
      bio: freelancerForm.value.bio,
      availability: freelancerForm.value.availability,
      remoteOnly: freelancerForm.value.remoteOnly,
      agreedToTerms: freelancerTermsAgreed.value,
    })
    toast.success('Freelancer profile submitted', {
      description: 'Your freelancer profile is ready for review.',
    })
    isRegisterModalOpen.value = false
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to submit freelancer profile.'
    toast.error('Freelancer failed', { description: message })
  }
}

const submitFreelanceJob = async () => {
  if (!agreedToTerms.value) {
    toast.error('Accept the terms before posting.')
    return
  }

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
    toast.success('Freelance job posted', {
      description: 'Your freelance job is now ready for applicants.',
    })
    isPostJobModalOpen.value = false
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to post freelance job.'
    toast.error('Freelance job failed', { description: message })
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
          class="inline-flex h-10 items-center justify-center rounded-[0.8rem] bg-[var(--accent)] px-4 text-[0.86rem] font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          @click="isRegisterModalOpen = true"
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
          @click="activeTab = 'freelancers'"
        >
          Freelancers
        </button>
        <button
          type="button"
          class="border-b-2 px-0 pb-3 text-[0.95rem] font-semibold transition"
          :class="activeTab === 'jobs' ? 'border-[color:var(--accent)] text-[var(--accent-strong)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'"
          @click="activeTab = 'jobs'"
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
            <input
              v-model="locationQuery"
              type="search"
              placeholder="Located anywhere"
              class="min-w-0 flex-1 bg-transparent text-[0.86rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
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
              <span class="h-14 w-14 shrink-0 rounded-[0.9rem] bg-[var(--surface-secondary)]" />
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

          <RouterLink
            v-if="!freelancersStore.isLoadingFreelancers"
            v-for="freelancer in visibleFreelancers"
            :key="freelancer.id"
            :to="getFreelancerPath(freelancer)"
            class="block rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)] transition hover:border-[color:var(--accent-soft)]"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[0.9rem] bg-[var(--surface-secondary)] text-sm font-semibold text-[var(--accent-strong)]"
              >
                <img
                  v-if="freelancer.avatar"
                  :src="freelancer.avatar"
                  :alt="freelancer.name"
                  class="h-full w-full object-cover"
                />
                <span v-else>{{ getInitials(freelancer.name) }}</span>
              </span>

              <div class="min-w-0 flex-1">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div class="min-w-0">
                    <h2 class="text-base font-semibold text-[var(--text-primary)]">{{ freelancer.name }}</h2>
                    <p class="mt-1 text-[0.84rem] text-[var(--text-secondary)]">{{ freelancer.title }}</p>
                  </div>
                  <span
                    class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] px-3 text-[0.8rem] font-semibold text-[var(--text-secondary)]"
                  >
                    <Mail class="h-3.5 w-3.5" />
                    Email {{ freelancer.name.split(' ')[0] }}
                  </span>
                </div>

                <p class="mt-2 text-[0.92rem] font-semibold leading-6 text-[var(--text-primary)]">
                  {{ freelancer.skills.join(', ') }}
                </p>
                <p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.82rem] text-[var(--text-secondary)]">
                  <span>Location - {{ freelancer.location }}</span>
                  <span>|</span>
                  <span class="inline-flex items-center gap-1">
                    Status -
                  <span class="font-semibold text-[var(--danger)]">{{ freelancer.status }}</span>
                    <BadgeCheck v-if="freelancer.status === 'certified'" class="h-3.5 w-3.5 text-[var(--accent-strong)]" />
                  </span>
                </p>
                <p class="mt-3 line-clamp-3 text-[0.86rem] leading-7 text-[var(--text-secondary)]">
                  {{ freelancer.bio }}
                </p>
              </div>
            </div>
          </RouterLink>

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
            <h2 class="text-base font-semibold text-[var(--text-primary)]">No freelancers found.</h2>
            <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {{ freelancersStore.freelancersError || 'Freelancers will appear here once profiles are available for this filter.' }}
            </p>
            <button
              v-if="!freelancersStore.freelancersError"
              type="button"
              class="mt-4 inline-flex h-10 items-center justify-center rounded-[0.8rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
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

          <div
            v-else
            class="divide-y divide-[color:var(--border-soft)] rounded-[1rem] bg-[var(--surface-primary)] px-4 py-2 shadow-[var(--shadow-soft)]"
          >
            <article
              v-for="job in visibleJobs"
              :key="job.id"
              class="py-5"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <button
                    type="button"
                    class="text-left text-[1.05rem] font-semibold leading-6 text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
                    @click="openFreelanceJobDetail(job)"
                  >
                    {{ job.title }}
                  </button>
                  <p class="mt-2 line-clamp-2 text-[0.9rem] leading-7 text-[var(--text-secondary)]">{{ job.description }}</p>
                </div>
                <span class="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-[0.78rem] font-semibold text-[var(--accent-strong)]">
                  <BriefcaseBusiness class="h-3.5 w-3.5" />
                  {{ job.companyName }}
                </span>
              </div>

              <div class="mt-3 flex flex-wrap gap-1.5">
                <span
                  v-for="skill in job.skills"
                  :key="`${job.id}-${skill}`"
                  class="rounded-[0.45rem] bg-[var(--surface-secondary)] px-2.5 py-1 text-[0.7rem] font-medium text-[var(--text-secondary)]"
                >
                  {{ skill }}
                </span>
              </div>

              <div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-[0.84rem]">
                <p class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span class="font-semibold text-emerald-600">Offer | {{ formatFee(job) }}</span>
                  <span class="text-[var(--text-tertiary)]">|</span>
                  <span class="font-semibold text-[var(--danger)]">{{ job.verified ? 'Verified' : job.status }}</span>
                </p>
                <p class="font-medium text-[var(--text-primary)]">{{ formatDeadline(job.applicationEndDate) }}</p>
              </div>
              <div class="mt-4 flex justify-end">
                <button
                  type="button"
                  class="inline-flex h-9 items-center justify-center rounded-[0.75rem] bg-[var(--accent)] px-4 text-[0.82rem] font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                  @click="openFreelanceJobDetail(job)"
                >
                  View and apply
                </button>
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
            <h2 class="text-base font-semibold text-[var(--text-primary)]">No freelance jobs found.</h2>
            <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {{ freelancersStore.freelanceJobsError || 'Freelance jobs will appear here once clients publish matching work.' }}
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
          <input v-model="freelanceJobForm.skills" class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" placeholder="Java, Project Mgt, Event management" />
        </label>
        <label>
          <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Location:<span class="text-[var(--danger)]">*</span></span>
          <input v-model="freelanceJobForm.location" class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" placeholder="Abuja" />
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
          <textarea v-model="freelanceJobForm.qualifications" rows="3" class="mt-1 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
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
      <div class="flex justify-between gap-2 border-t border-[color:var(--border-soft)] pt-4">
        <button type="submit" class="inline-flex h-10 items-center rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]">
          Submit
        </button>
        <button type="button" class="inline-flex h-10 items-center rounded-[0.75rem] bg-[var(--danger)] px-5 text-sm font-semibold text-white transition hover:opacity-90" @click="isPostJobModalOpen = false">
          Close
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
      <div class="mx-auto max-w-3xl rounded-[0.95rem] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)] sm:p-6">
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
            <input v-model="freelancerForm.skills" placeholder="Take from user profile, else, Java, Project Mgt.." class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]" />
          </label>
          <label class="block">
            <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Location</span>
            <select v-model="freelancerForm.location" class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]">
              <option value="">Select location</option>
              <option>Abuja</option>
              <option>Lagos</option>
              <option>Remote</option>
              <option>Accra</option>
            </select>
          </label>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div class="hidden sm:block" />
          <div class="flex aspect-[10/9] w-full max-w-[14rem] items-center justify-center overflow-hidden justify-self-center rounded-[0.85rem] bg-[var(--surface-secondary)] text-xl font-bold text-[var(--text-secondary)]">
            <img
              v-if="passportPreviewUrl"
              :src="passportPreviewUrl"
              alt="Passport preview"
              class="h-full w-full object-cover"
            />
            <span v-else>300 x 270</span>
          </div>
          <div class="justify-self-start">
            <label class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]">
              <Image class="h-4 w-4" />
              Upload Passport
              <input type="file" accept="image/*" class="sr-only" @change="handlePassportUpload" />
            </label>
            <p class="mt-2 text-[0.78rem] text-[var(--text-secondary)]">Maximum file size: 10 MB.</p>
            <div v-if="passportFileName" class="mt-2 flex flex-wrap items-center gap-2">
              <p class="inline-flex items-center gap-1 text-[0.76rem] font-medium text-[var(--accent-strong)]">
                <Upload class="h-3.5 w-3.5" />
                {{ passportFileName }}
              </p>
              <button
                type="button"
                class="inline-flex h-8 items-center rounded-[0.65rem] border border-[color:var(--border-soft)] px-3 text-[0.76rem] font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--danger)] hover:text-[var(--danger)]"
                @click="clearPassportUpload"
              >
                Remove
              </button>
            </div>
          </div>
        </div>

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

        <button type="submit" class="mt-4 inline-flex h-10 items-center rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]">
          Submit
        </button>
      </div>

      <div class="flex justify-end border-t border-[color:var(--border-soft)] pt-4">
        <button type="button" class="inline-flex h-10 items-center rounded-[0.75rem] bg-[var(--danger)] px-5 text-sm font-semibold text-white transition hover:opacity-90" @click="isRegisterModalOpen = false">
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
            {{ selectedFreelanceJob.verified ? 'Verified' : selectedFreelanceJob.status }}
          </span>
        </div>

        <div class="mt-4 grid gap-2 sm:grid-cols-3">
          <span class="rounded-[0.75rem] bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            {{ selectedFreelanceJob.location || 'Location not listed' }}
          </span>
          <span class="rounded-[0.75rem] bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            {{ selectedFreelanceJob.type }}
          </span>
          <span class="rounded-[0.75rem] bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            {{ formatFee(selectedFreelanceJob) }}
          </span>
        </div>
      </div>

      <div v-if="freelancersStore.isLoadingFreelanceJobDetail" class="rounded-[1rem] border border-[color:var(--border-soft)] p-4 text-sm text-[var(--text-secondary)]">
        Loading details...
      </div>
      <div v-else-if="freelancersStore.freelanceJobDetailError" class="rounded-[1rem] border border-[color:var(--border-soft)] p-4 text-sm text-[var(--text-secondary)]">
        {{ freelancersStore.freelanceJobDetailError }}
      </div>

      <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <section class="space-y-4">
          <div>
            <h3 class="text-base font-semibold text-[var(--text-primary)]">Description</h3>
            <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              {{ selectedFreelanceJob.description || 'No description has been added yet.' }}
            </p>
          </div>
          <div>
            <h3 class="text-base font-semibold text-[var(--text-primary)]">Qualifications</h3>
            <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              {{ selectedFreelanceJob.qualifications || 'No qualifications have been added yet.' }}
            </p>
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
