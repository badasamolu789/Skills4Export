<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowRight, BriefcaseBusiness, CalendarDays, CheckCircle2, Copy, MapPin, UploadCloud, Wallet } from 'lucide-vue-next'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import { ApiError } from '@/lib/api'
import { advertsService, type AdvertRecord } from '@/services/adverts'
import { useAuthStore } from '@/stores/auth'
import { useJobsStore } from '@/stores/jobs'

const route = useRoute()
const authStore = useAuthStore()
const jobsStore = useJobsStore()
const job = computed(() => jobsStore.currentJob)
const isApplying = ref(false)
const isApplyModalOpen = ref(false)
const isReferralModalOpen = ref(false)
const referralEmails = ref('')
const adverts = ref<AdvertRecord[]>([])
const isLoadingAdverts = ref(false)
const resumeInput = ref<HTMLInputElement | null>(null)
const selectedResumeFile = ref<File | null>(null)
const hasAgreedToApplicationTerms = ref(false)
const applicationForm = ref({
  resumeMediaId: '',
})

const formatMoney = (value?: number | null, currency = 'NGN') => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return ''
  }

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

const salaryLabel = computed(() => {
  const currentJob = job.value

  if (!currentJob) {
    return 'Salary not listed'
  }

  if (currentJob.salaryLabel) {
    return currentJob.salaryLabel
  }

  const min = formatMoney(currentJob.salaryMin, currentJob.salaryCurrency || 'NGN')
  const max = formatMoney(currentJob.salaryMax, currentJob.salaryCurrency || 'NGN')

  if (min && max) {
    return `${min} - ${max}`
  }

  return min || max || 'Salary not listed'
})

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'End date not listed'
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

const applicationEndDateLabel = computed(() => formatDate(job.value?.applicationEndDate))

const qualifications = computed(() => {
  if (job.value?.requirements?.length) {
    return job.value.requirements
  }

  if (job.value?.responsibilities?.length) {
    return job.value.responsibilities
  }

  return job.value?.summary ? [job.value.summary] : []
})

const perks = computed(() => job.value?.perks || [])
const skills = computed(() => job.value?.skills || [])
const workExperienceLabel = computed(() => {
  const experience = job.value?.experience?.trim()

  if (!experience) {
    return 'Experience not listed'
  }

  const compactExperience = experience.replace(/\s*-\s*/g, '-')

  if (/yrs?\)?$/i.test(compactExperience) || /years?$/i.test(compactExperience)) {
    return compactExperience.replace(/\s*years?$/i, '(yrs)')
  }

  return `${compactExperience}(yrs)`
})
const jobLocationLine = computed(() =>
  [job.value?.location, job.value?.workMode || job.value?.type].filter(Boolean).join(', ') ||
  'Location not listed',
)
const referralLink = computed(() => {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.location.href
})
const referralSubject = computed(() => `Job referral: ${job.value?.title || 'Skills4Export job'}`)
const referralBody = computed(() =>
  `I thought you might be interested in this role: ${job.value?.title || 'Job opportunity'}\n\n${referralLink.value}`,
)
const usableAdverts = computed(() =>
  adverts.value.filter((advert) =>
    Boolean(advert.imageUrl) &&
    !advert.isExpired &&
    (advert.status === 'active' || advert.status === 'approved'),
  ),
)
const rightRailAdvert = computed(() => {
  const rightRailMatch = usableAdverts.value.find((advert) => {
    const locationName = advert.location?.name?.toLowerCase() ?? ''

    return (
      locationName.includes('right') ||
      locationName.includes('rail') ||
      locationName.includes('sidebar') ||
      locationName.includes('job')
    )
  })

  return rightRailMatch ?? usableAdverts.value[0] ?? null
})

const openApplyModal = () => {
  if (!job.value || isApplying.value) {
    return
  }

  if (!authStore.authToken) {
    toast.error('Sign in required', {
      description: 'Please sign in again before applying.',
    })
    return
  }

  isApplyModalOpen.value = true
}

const acceptedResumeExtensions = '.pdf,.doc,.docx,.rtf,.html,.odf,.zip'

const setSelectedResumeFile = (file?: File | null) => {
  selectedResumeFile.value = file ?? null
}

const handleResumeFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement | null
  setSelectedResumeFile(input?.files?.[0] ?? null)
}

const handleResumeDrop = (event: DragEvent) => {
  setSelectedResumeFile(event.dataTransfer?.files?.[0] ?? null)
}

const applyToJob = async () => {
  if (!job.value || isApplying.value) {
    return
  }

  if (!authStore.authToken) {
    toast.error('Sign in required', {
      description: 'Please sign in again before applying.',
    })
    return
  }

  if (!hasAgreedToApplicationTerms.value) {
    toast.error('Agreement required', {
      description: 'Please agree to the terms before applying.',
    })
    return
  }

  isApplying.value = true

  try {
    await jobsStore.applyToCurrentJob({
      resumeMediaId: applicationForm.value.resumeMediaId.trim() || undefined,
      answers: [],
    })
    toast.success('Application submitted')
    isApplyModalOpen.value = false
    applicationForm.value = {
      resumeMediaId: '',
    }
    selectedResumeFile.value = null
    hasAgreedToApplicationTerms.value = false
    if (resumeInput.value) {
      resumeInput.value.value = ''
    }
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to submit this application.'
    toast.error('Application failed', { description: message })
  } finally {
    isApplying.value = false
  }
}

const loadAdverts = async () => {
  isLoadingAdverts.value = true

  try {
    const response = await advertsService.listAdverts(
      {
        per_page: 100,
        sort: '-createdAt',
      },
      authStore.authToken,
    )
    adverts.value = response.data ?? []
  } catch {
    adverts.value = []
  } finally {
    isLoadingAdverts.value = false
  }
}

const copyReferralLink = async () => {
  try {
    await navigator.clipboard.writeText(referralLink.value)
    toast.success('Referral link copied')
  } catch {
    toast.error('Unable to copy link')
  }
}

const sendReferral = () => {
  const recipients = referralEmails.value
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)

  if (!recipients.length) {
    toast.error('Add an email address')
    return
  }

  const mailto = new URL('mailto:')
  mailto.searchParams.set('bcc', recipients.join(','))
  mailto.searchParams.set('subject', referralSubject.value)
  mailto.searchParams.set('body', referralBody.value)
  window.location.href = mailto.toString()
  toast.success('Referral email opened')
  referralEmails.value = ''
}

watch(
  () => route.params.slug,
  (slug) => {
    void jobsStore.loadJob(String(slug))
    void loadAdverts()
  },
  { immediate: true },
)
</script>

<template>
  <section v-if="jobsStore.isLoadingJob" class="space-y-8">
    <div class="animate-pulse border-b border-[color:var(--border-soft)] pb-8">
      <div class="mx-auto max-w-7xl space-y-4">
        <div class="h-4 w-64 rounded-full bg-[var(--surface-secondary)]" />
        <div class="h-10 w-2/3 max-w-3xl rounded-full bg-[var(--surface-secondary)]" />
        <div class="h-5 w-56 rounded-full bg-[var(--surface-secondary)]" />
      </div>
    </div>
    <div class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div class="animate-pulse space-y-8">
        <div class="space-y-3">
          <div class="h-7 w-44 rounded-full bg-[var(--surface-secondary)]" />
          <div class="h-4 w-full rounded-full bg-[var(--surface-secondary)]" />
          <div class="h-4 w-4/5 rounded-full bg-[var(--surface-secondary)]" />
          <div class="h-4 w-2/3 rounded-full bg-[var(--surface-secondary)]" />
        </div>
        <div class="space-y-3">
          <div class="h-7 w-40 rounded-full bg-[var(--surface-secondary)]" />
          <div class="h-28 rounded-[1rem] bg-[var(--surface-secondary)]" />
        </div>
      </div>
      <aside class="hidden animate-pulse space-y-4 lg:block">
        <div class="h-12 rounded-[0.85rem] bg-[var(--surface-secondary)]" />
        <div class="aspect-[29/50] rounded-[0.85rem] bg-[var(--surface-secondary)]" />
      </aside>
    </div>
  </section>

  <section v-else-if="job" class="space-y-8">
    <section class="-mx-3 border-b border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-8 sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6 lg:py-10 xl:-mx-8 xl:px-8">
      <div class="relative mx-auto max-w-7xl">
        <div class="pointer-events-none absolute left-8 top-24 hidden h-20 w-28 opacity-50 md:block">
          <div class="absolute left-6 top-0 h-full w-px rotate-[32deg] bg-[var(--border-soft)]" />
          <div class="absolute left-12 top-0 h-full w-px rotate-[32deg] bg-[var(--border-soft)]" />
          <div class="absolute left-[4.5rem] top-0 h-full w-px rotate-[32deg] bg-[var(--border-soft)]" />
        </div>
        <div class="pointer-events-none absolute right-10 top-8 hidden h-24 w-32 opacity-50 lg:block">
          <div class="absolute right-6 top-0 h-full w-px rotate-[-32deg] bg-[var(--border-soft)]" />
          <div class="absolute right-12 top-0 h-full w-px rotate-[-32deg] bg-[var(--border-soft)]" />
          <div class="absolute right-[4.5rem] top-0 h-full w-px rotate-[-32deg] bg-[var(--border-soft)]" />
        </div>

        <div class="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div class="space-y-4">
            <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
              <RouterLink to="/jobs/feed" class="font-medium text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]">Job List</RouterLink>
              <span>›</span>
              <span>{{ job.title }}</span>
            </div>
            <h1 class="max-w-4xl text-[2.2rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[3rem]">
              {{ job.title }}
            </h1>
            <p class="text-base font-medium text-[var(--text-secondary)] sm:text-lg">
              {{ jobLocationLine }}
            </p>
          </div>

          <button
            type="button"
            :disabled="isApplying || job.hasApplied === true"
            class="inline-flex h-12 items-center justify-center rounded-[0.55rem] bg-[var(--accent)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
            @click="openApplyModal"
          >
            {{ job.hasApplied ? 'Applied' : isApplying ? 'Applying...' : 'Apply for this job' }}
          </button>
        </div>
      </div>
    </section>

    <div class="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <article class="min-w-0 space-y-8">
        <div class="space-y-4 border-b border-[color:var(--border-soft)] pb-8">
          <h2 class="text-[1.3rem] font-semibold text-[var(--text-primary)]">Job Description</h2>
          <p v-if="job.summary" class="text-[0.98rem] leading-8 text-[var(--text-secondary)]">{{ job.summary }}</p>
          <p class="text-[0.98rem] leading-8 text-[var(--text-secondary)]">{{ job.description || 'No description has been added yet.' }}</p>

          <div class="flex flex-wrap gap-2 pt-2">
            <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-sm text-[var(--text-secondary)]">
              <MapPin class="h-4 w-4 text-[var(--accent-strong)]" />
              {{ job.location || 'Location not listed' }}
            </span>
            <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-sm text-[var(--text-secondary)]">
              <BriefcaseBusiness class="h-4 w-4 text-[var(--accent-strong)]" />
              {{ workExperienceLabel }}
            </span>
            <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-sm text-[var(--text-secondary)]">
              <Wallet class="h-4 w-4 text-[var(--accent-strong)]" />
              {{ salaryLabel }}
            </span>
            <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-sm text-[var(--text-secondary)]">
              <CalendarDays class="h-4 w-4 text-[var(--accent-strong)]" />
              Ends {{ applicationEndDateLabel }}
            </span>
          </div>
        </div>

        <div v-if="qualifications.length" class="space-y-4 border-b border-[color:var(--border-soft)] pb-8">
          <h2 class="text-[1.3rem] font-semibold text-[var(--text-primary)]">Qualifications:</h2>
          <ul class="space-y-2">
            <li
              v-for="item in qualifications"
              :key="item"
              class="flex items-start gap-3 text-[0.98rem] leading-8 text-[var(--text-secondary)]"
            >
              <CheckCircle2 class="mt-2 h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>

        <div v-if="skills.length" class="space-y-4 border-b border-[color:var(--border-soft)] pb-8">
          <h2 class="text-[1.3rem] font-semibold text-[var(--text-primary)]">Skills:</h2>
          <div class="rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)]">
            <div class="flex flex-wrap gap-2">
              <span
                v-for="skill in skills"
                :key="skill"
                class="rounded-[0.35rem] bg-[var(--surface-secondary)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] shadow-[inset_0_0_0_1px_var(--border-soft)]"
              >
                {{ skill }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="perks.length" class="space-y-4">
          <h2 class="text-[1.3rem] font-semibold text-[var(--text-primary)]">Perks:</h2>
          <ul class="list-disc space-y-2 pl-5 text-[0.98rem] leading-8 text-[var(--text-secondary)]">
            <li v-for="perk in perks" :key="perk">{{ perk }}</li>
          </ul>
        </div>
      </article>

      <aside class="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <button
          type="button"
          class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[0.55rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          @click="isReferralModalOpen = true"
        >
          Refer a friend
          <ArrowRight class="h-4 w-4" />
        </button>

        <section class="space-y-3">
          <p class="text-center text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Advertisements</p>
          <div
            v-if="isLoadingAdverts && !rightRailAdvert"
            class="advert-placeholder aspect-[29/50] w-full rounded-[0.35rem]"
            aria-label="Loading advertisement"
          />
          <a
            v-else-if="rightRailAdvert?.imageUrl"
            :href="rightRailAdvert.linkUrl || rightRailAdvert.imageUrl"
            target="_blank"
            rel="noopener noreferrer sponsored"
            aria-label="Advertisement"
            class="block overflow-hidden rounded-[0.35rem] bg-[var(--surface-secondary)] transition hover:opacity-90"
          >
            <img
              :src="rightRailAdvert.imageUrl"
              :alt="rightRailAdvert.ownerName ? `${rightRailAdvert.ownerName} advertisement` : 'Advertisement'"
              class="aspect-[29/50] w-full object-cover"
              loading="lazy"
            >
          </a>
          <a
            v-else
            href="#"
            aria-label="Advertisement"
            class="block overflow-hidden rounded-[0.35rem] bg-[var(--surface-secondary)] transition hover:opacity-90"
            @click.prevent
          >
            <div class="advert-placeholder aspect-[29/50] w-full" />
          </a>
        </section>
      </aside>
    </div>

    <ResponsiveOverlay
      v-model="isApplyModalOpen"
      label="Job application"
      title="Apply to this role"
      max-width-class="sm:max-w-2xl"
      :show-header-text="false"
    >
      <form class="-mx-4 -mb-4 -mt-2 sm:-mx-5 sm:-mb-5" @submit.prevent="applyToJob">
        <div class="border-b border-[color:var(--border-soft)] px-4 pb-5 sm:px-5">
          <h2 class="text-[2rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[2.4rem]">
            Apply to this role
          </h2>
        </div>

        <div class="space-y-6 px-4 py-6 sm:px-5">
          <p class="text-lg font-semibold text-[var(--text-secondary)]">{{ job.title }}</p>

          <div class="space-y-3">
            <p class="text-base font-semibold text-[var(--text-primary)]">Resume</p>
            <button
              type="button"
              class="flex min-h-44 w-full flex-col items-center justify-center gap-3 rounded-[0.5rem] border-2 border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-8 text-center text-[var(--text-secondary)] transition hover:border-[color:var(--accent-soft)] hover:bg-[var(--surface-secondary)]"
              @click="resumeInput?.click()"
              @dragover.prevent
              @drop.prevent="handleResumeDrop"
            >
              <UploadCloud class="h-7 w-7 text-[var(--text-tertiary)]" />
              <span class="text-base font-medium sm:text-lg">
                {{ selectedResumeFile ? selectedResumeFile.name : 'Drop files here or click to upload.' }}
              </span>
            </button>
            <input
              ref="resumeInput"
              type="file"
              :accept="acceptedResumeExtensions"
              class="hidden"
              @change="handleResumeFileChange"
            >
            <p class="text-sm leading-6 text-[var(--text-secondary)]">
              .pdf, .doc, .docx, .rtf, .html, .odf, .zip files accepted
            </p>
          </div>

          <label class="mx-auto flex max-w-lg items-start gap-3 text-sm leading-6 text-[var(--text-secondary)] sm:text-base sm:leading-7">
            <input
              v-model="hasAgreedToApplicationTerms"
              type="checkbox"
              class="mt-1 h-4 w-4 rounded border-[color:var(--border-soft)] text-[var(--accent)] focus:ring-[var(--accent-soft)]"
            >
            <span>
              By submitting this form i agree to the terms and conditions governing the use of skills4export.com<span class="text-[var(--danger)]">*</span>
            </span>
          </label>

          <button
            type="submit"
            :disabled="isApplying"
            class="inline-flex h-12 w-full items-center justify-center rounded-[0.65rem] bg-[var(--accent)] px-5 text-base font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
          >
            {{ isApplying ? 'Applying...' : 'Apply' }}
          </button>
        </div>

        <div class="flex justify-end border-t border-[color:var(--border-soft)] px-4 py-5 sm:px-5">
          <button
            type="button"
            class="inline-flex h-11 items-center rounded-[0.75rem] bg-[var(--danger)] px-5 text-sm font-semibold text-white transition hover:opacity-90"
            @click="isApplyModalOpen = false"
          >
            Close
          </button>
        </div>
      </form>
    </ResponsiveOverlay>

    <ResponsiveOverlay
      v-model="isReferralModalOpen"
      label="Refer friends"
      title="Refer friends"
      max-width-class="sm:max-w-xl"
      :show-header-text="false"
    >
      <div class="-mx-4 -mb-4 -mt-2 sm:-mx-5 sm:-mb-5">
        <div class="border-b border-[color:var(--border-soft)] px-4 pb-5 sm:px-5">
          <h2 class="text-[2rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[2.4rem]">
            Refer friends
          </h2>
        </div>

        <div class="px-4 py-6 sm:px-5">
          <div class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-soft)]">
          <h3 class="text-2xl font-semibold text-[var(--text-primary)]">Spread the word to friends.</h3>
          <p class="mt-2 text-sm text-[var(--text-secondary)]">Send a referral by email.</p>

          <form class="mt-4 flex flex-col overflow-hidden rounded-[0.75rem] border border-[color:var(--border-soft)] sm:flex-row" @submit.prevent="sendReferral">
            <input
              v-model="referralEmails"
              class="min-h-11 min-w-0 flex-1 bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              placeholder="Enter email addresses separated by comma"
            >
            <button
              type="submit"
              class="inline-flex h-11 items-center justify-center gap-2 border-t border-[color:var(--border-soft)] px-5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-secondary)] sm:border-l sm:border-t-0"
            >
              Send
              <ArrowRight class="h-4 w-4" />
            </button>
          </form>

          <p class="mt-6 text-sm text-[var(--text-primary)]">Share the referral link on social media.</p>
          <p class="mt-5 text-sm text-[var(--text-primary)]">Copy and paste your referral link.</p>

          <div class="mt-3 flex flex-col overflow-hidden rounded-[0.75rem] border border-[color:var(--border-soft)] sm:flex-row">
            <span class="min-h-11 min-w-0 flex-1 truncate bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]">
              {{ referralLink }}
            </span>
            <button
              type="button"
              class="inline-flex h-11 items-center justify-center gap-2 border-t border-[color:var(--border-soft)] px-5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-secondary)] sm:border-l sm:border-t-0"
              @click="copyReferralLink"
            >
              <Copy class="h-4 w-4" />
              Copy
            </button>
          </div>
        </div>
        </div>

        <div class="flex justify-end border-t border-[color:var(--border-soft)] px-4 py-5 sm:px-5">
          <button
            type="button"
            class="inline-flex h-11 items-center rounded-[0.75rem] bg-[var(--danger)] px-5 text-sm font-semibold text-white transition hover:opacity-90"
            @click="isReferralModalOpen = false"
          >
            Close
          </button>
        </div>
      </div>
    </ResponsiveOverlay>
  </section>

  <section v-else class="rounded-[1.35rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-soft)]">
    <h1 class="text-xl font-semibold text-[var(--text-primary)]">Job not found</h1>
    <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
      {{ jobsStore.jobError || 'The role you opened is not available.' }}
    </p>
  </section>
</template>
