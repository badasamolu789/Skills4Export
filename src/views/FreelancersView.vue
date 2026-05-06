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
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import { publicProfileRoute, seededPublicProfiles } from '@/data/publicProfiles'

const activeTab = ref<'freelancers' | 'jobs'>('freelancers')
const skillQuery = ref('')
const locationQuery = ref('')
const availabilityFilter = ref('Any of the options')
const isRegisterModalOpen = ref(false)
const isPostJobModalOpen = ref(false)
const agreedToTerms = ref(false)
const freelancerTermsAgreed = ref(false)
const passportFileName = ref('')
const visibleFreelancerCount = ref(2)
const visibleJobCount = ref(1)
const revealSentinel = ref<HTMLElement | null>(null)
let revealObserver: IntersectionObserver | null = null

const freelancers = seededPublicProfiles.map((profile, index) => ({
  id: profile.id,
  name: String(profile.user.name || 'Freelancer'),
  initials: String(profile.user.name || 'Freelancer')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
  title: profile.experiences[0]?.title || 'Freelancer',
  location: profile.profile.location || 'Remote',
  bio: profile.profile.bio || 'Available for freelance opportunities.',
  skills: profile.skills
    .map((skill) => skill.name || skill.skill)
    .filter((skill): skill is string => Boolean(skill)),
  status: index % 2 === 0 ? 'Certified' : 'Available',
  to: publicProfileRoute(profile.id),
}))

const freelanceJobs = [
  {
    id: 'job-web-app-development',
    title: 'Web App Development',
    company: 'TradeBridge Labs',
    location: 'Remote',
    fee: 'N300k - N320k',
    deadline: '12 days left',
    skills: ['javascript', 'bootstrap-4', 'jquery', 'select', 'bootstrap-4', 'jquery', 'select'],
    description:
      'I need a full-featured e-commerce web application. I need a developer who can build it from architecture to deployment. I have preference on the tech-stack React, or another modern front...',
  },
  {
    id: 'job-content-strategy',
    title: 'Export content strategist',
    company: 'Market Access Studio',
    location: 'Lagos, Nigeria',
    fee: 'N250k - N400k',
    deadline: '18 days left',
    skills: ['Writing', 'SEO', 'Research'],
    description: 'Create practical articles and guides for businesses preparing to sell into new markets.',
  },
]

const trendingQuestions = [
  {
    title: 'Using web3 to call precompile contract',
    time: '2 mins ago',
    author: 'Sudhir Kumbhare',
  },
  {
    title: 'Is it true while finding Time Complexity of the algorithm [closed]',
    time: '48 mins ago',
    author: 'wimax',
  },
  {
    title: 'image picker and store them into firebase with flutter',
    time: '1 hour ago',
    author: 'Antonin gavrel',
  },
]

const filteredFreelancers = computed(() => {
  const skill = skillQuery.value.trim().toLowerCase()
  const location = locationQuery.value.trim().toLowerCase()

  return freelancers.filter((freelancer) => {
    const skillMatch =
      !skill ||
      freelancer.skills.some((item) => item.toLowerCase().includes(skill)) ||
      freelancer.title.toLowerCase().includes(skill)
    const locationMatch = !location || freelancer.location.toLowerCase().includes(location)

    return skillMatch && locationMatch
  })
})

const filteredJobs = computed(() => {
  const skill = skillQuery.value.trim().toLowerCase()
  const location = locationQuery.value.trim().toLowerCase()

  return freelanceJobs.filter((job) => {
    const skillMatch =
      !skill ||
      job.skills.some((item) => item.toLowerCase().includes(skill)) ||
      job.title.toLowerCase().includes(skill)
    const locationMatch = !location || job.location.toLowerCase().includes(location)

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
  nextTick(setupRevealObserver)
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
})

const submitFreelancerRegistration = () => {
  if (!freelancerTermsAgreed.value) {
    toast.error('Accept the terms before submitting.')
    return
  }

  toast.success('Freelancer profile submitted', {
    description: 'Your freelancer profile is ready for review.',
  })
  isRegisterModalOpen.value = false
}

const submitFreelanceJob = () => {
  if (!agreedToTerms.value) {
    toast.error('Accept the terms before posting.')
    return
  }

  toast.success('Freelance job posted', {
    description: 'Your freelance job is now ready for applicants.',
  })
  isPostJobModalOpen.value = false
}

const handlePassportUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  passportFileName.value = input.files?.[0]?.name ?? ''
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
          <RouterLink
            v-for="freelancer in visibleFreelancers"
            :key="freelancer.id"
            :to="freelancer.to"
            class="block rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-soft)] transition hover:border-[color:var(--accent-soft)]"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-[0.9rem] bg-[var(--surface-secondary)] text-sm font-semibold text-[var(--accent-strong)]"
              >
                {{ freelancer.initials }}
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
                    <BadgeCheck v-if="freelancer.status === 'Certified'" class="h-3.5 w-3.5 text-[var(--accent-strong)]" />
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
        </template>

        <template v-else>
          <div class="divide-y divide-[color:var(--border-soft)] rounded-[1rem] bg-[var(--surface-primary)] px-4 py-2 shadow-[var(--shadow-soft)]">
            <article
              v-for="job in visibleJobs"
              :key="job.id"
              class="py-5"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <h2 class="text-[1.05rem] font-semibold leading-6 text-[var(--text-primary)]">{{ job.title }}</h2>
                  <p class="mt-2 line-clamp-2 text-[0.9rem] leading-7 text-[var(--text-secondary)]">{{ job.description }}</p>
                </div>
                <span class="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-[0.78rem] font-semibold text-[var(--accent-strong)]">
                  <BriefcaseBusiness class="h-3.5 w-3.5" />
                  {{ job.company }}
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
                  <span class="font-semibold text-emerald-600">Offer | {{ job.fee }}</span>
                  <span class="text-[var(--text-tertiary)]">|</span>
                  <span class="font-semibold text-[var(--danger)]">Verified</span>
                </p>
                <p class="font-medium text-[var(--text-primary)]">{{ job.deadline }}</p>
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
        </template>
      </div>

      <aside class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-elevated)] lg:hidden">
        <h2 class="text-base font-semibold text-[var(--text-primary)]">Trending Questions</h2>
        <div class="mt-3 divide-y divide-[color:var(--border-soft)]">
          <article
            v-for="question in trendingQuestions"
            :key="question.title"
            class="py-3 first:pt-0 last:pb-0"
          >
            <p class="text-[0.86rem] font-semibold leading-6 text-[var(--text-primary)]">{{ question.title }}</p>
            <p class="mt-1 text-[0.74rem] text-[var(--text-secondary)]">
              {{ question.time }} . by <span class="text-[var(--accent-strong)]">{{ question.author }}</span>
            </p>
          </article>
        </div>
      </aside>
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
          <input class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" value="Senior Software Engineer, Business Development Mgr" />
        </label>
        <label class="sm:col-span-2">
          <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Required skills:<span class="text-[var(--danger)]">*</span></span>
          <input class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" value="Java, Project Mgt, Event management, Drumer, ..." />
        </label>
        <label>
          <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Location:<span class="text-[var(--danger)]">*</span></span>
          <input class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" value="Abuja" />
        </label>
        <label>
          <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Job Type:<span class="text-[var(--danger)]">*</span></span>
          <select class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]">
            <option>select</option>
            <option>Contract</option>
            <option>Part time</option>
            <option>Project based</option>
          </select>
        </label>
        <label class="sm:col-span-2">
          <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Job Description:<span class="text-[var(--danger)]">*</span></span>
          <textarea rows="3" class="mt-1 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label class="sm:col-span-2">
          <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Qualifications and Skills:<span class="text-[var(--danger)]">*</span></span>
          <textarea rows="3" class="mt-1 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-[0.82rem] text-[var(--text-secondary)]">Min fee:N</span>
          <input class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-[0.82rem] text-[var(--text-secondary)]">Max fee:N</span>
          <input class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-[0.82rem] text-[var(--text-secondary)]">Company Name :<span class="text-[var(--danger)]">*</span></span>
          <input class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-[0.82rem] text-[var(--text-secondary)]">Application end date:<span class="text-[var(--danger)]">*</span></span>
          <div class="mt-1 flex h-11 items-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3">
            <input type="date" class="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            <Calendar class="h-4 w-4 text-[var(--text-tertiary)]" />
          </div>
        </label>
      </div>
      <label class="flex items-start gap-2 text-[0.82rem] leading-6 text-[var(--text-secondary)]">
        <input v-model="agreedToTerms" type="checkbox" class="mt-1 h-4 w-4 rounded border-[color:var(--border-soft)]" />
        <span>
          <span class="text-[var(--danger)]">*</span>
          By posting, you agreed to the <RouterLink to="/" class="text-[var(--accent-strong)]">Terms of Service</RouterLink> and <RouterLink to="/" class="text-[var(--accent-strong)]">Privacy Policy</RouterLink>.
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
            <input placeholder="Take from user profile" class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]" />
          </label>
          <label class="block">
            <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Job Title</span>
            <input placeholder="Take from user profile" class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]" />
          </label>
          <label class="block">
            <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Skills</span>
            <input placeholder="Take from user profile, else, Java, Project Mgt.." class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]" />
          </label>
          <label class="block">
            <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">Location</span>
            <select class="mt-1 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]">
              <option>Abuja</option>
              <option>Lagos</option>
              <option>Remote</option>
              <option>Accra</option>
            </select>
          </label>
        </div>

        <div class="mt-6 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div class="hidden sm:block" />
          <div class="flex aspect-[10/9] w-full max-w-[14rem] items-center justify-center justify-self-center rounded-[0.85rem] bg-[var(--surface-secondary)] text-xl font-bold text-[var(--text-secondary)]">
            300 x 270
          </div>
          <div class="justify-self-start">
            <label class="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]">
              <Image class="h-4 w-4" />
              Upload Passport
              <input type="file" accept="image/*" class="sr-only" @change="handlePassportUpload" />
            </label>
            <p class="mt-2 text-[0.78rem] text-[var(--text-secondary)]">Maximum file size: 10 MB.</p>
            <p v-if="passportFileName" class="mt-1 inline-flex items-center gap-1 text-[0.76rem] font-medium text-[var(--accent-strong)]">
              <Upload class="h-3.5 w-3.5" />
              {{ passportFileName }}
            </p>
          </div>
        </div>

        <label class="mt-6 block">
          <span class="text-[0.82rem] font-semibold text-[var(--text-primary)]">
            About - Describe your academic achievements, skills, experiences
          </span>
          <textarea rows="3" class="mt-2 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>

        <label class="mt-4 flex items-start gap-2 text-[0.82rem] leading-6 text-[var(--text-secondary)]">
          <input v-model="freelancerTermsAgreed" type="checkbox" class="mt-1 h-4 w-4 rounded border-[color:var(--border-soft)]" />
          <span>
            By Submitting, you agree to the <RouterLink to="/" class="text-[var(--accent-strong)]">Terms of Service</RouterLink> and <RouterLink to="/" class="text-[var(--accent-strong)]">Privacy Policy</RouterLink>.
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
</template>
