<script setup lang="ts">
import { computed, ref } from 'vue'
import { Bell, BriefcaseBusiness, GraduationCap, Trophy, X } from 'lucide-vue-next'

const contestAlert = ref(true)
const sponsorshipAlert = ref(false)
const scholarshipType = ref('')
const jobAlert = ref(true)
const jobSearchInput = ref('')
const jobSearchTags = ref<string[]>([])

const scholarshipOptions = [
  'Academic Scholarship',
  'IT Tech Scholarship',
  'Artisan Skills Scholarship',
  'Soft skills Scholarship',
]

const maxJobSearchTags = 10

const remainingJobSearchSlots = computed(() => maxJobSearchTags - jobSearchTags.value.length)

const addJobSearchTag = (rawValue: string) => {
  const value = rawValue.trim()

  if (!value || jobSearchTags.value.length >= maxJobSearchTags) {
    return
  }

  const exists = jobSearchTags.value.some((item) => item.toLowerCase() === value.toLowerCase())

  if (exists) {
    return
  }

  jobSearchTags.value.push(value)
}

const commitJobSearchTags = (value: string) => {
  const parts = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  parts.forEach(addJobSearchTag)
}

const handleJobSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value

  if (jobSearchTags.value.length >= maxJobSearchTags) {
    jobSearchInput.value = ''
    return
  }

  if (!value.includes(',')) {
    jobSearchInput.value = value
    return
  }

  const segments = value.split(',')
  const pendingValue = segments.pop() ?? ''

  commitJobSearchTags(segments.join(','))
  jobSearchInput.value = pendingValue.trimStart()
}

const finalizeJobSearchInput = () => {
  if (!jobSearchInput.value.trim()) {
    return
  }

  commitJobSearchTags(jobSearchInput.value)
  jobSearchInput.value = ''
}

const removeJobSearchTag = (tag: string) => {
  jobSearchTags.value = jobSearchTags.value.filter((item) => item !== tag)
}
</script>

<template>
  <section class="space-y-5">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/jobs/feed" class="transition hover:text-[var(--accent-strong)]">Jobs</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">Create Alert</span>
      </div>
      <div>
        <h1 class="text-[1.55rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.85rem] lg:text-[2rem]">
          Create alerts
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          Choose the alert types you want and tailor sponsorship and job updates around your goals.
        </p>
      </div>
    </div>

    <div
      class="overflow-hidden rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
    >
      <div class="bg-[linear-gradient(135deg,rgba(66,63,151,0.12),rgba(211,154,69,0.08))] p-5 sm:p-6">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
          Alerts Setup
        </p>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          Toggle contest and sponsorship alerts, then add the jobs or skills you want tracked for tailored updates.
        </p>
      </div>
    </div>

    <section
      class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]"
    >
      <div class="flex items-center gap-2">
        <Bell class="h-5 w-5 text-[var(--accent-strong)]" />
        <h2 class="text-[1.05rem] font-semibold text-[var(--text-primary)] sm:text-[1.12rem]">Alert Preferences</h2>
      </div>

      <div class="mt-5 space-y-5">
        <label
          class="flex items-center justify-between gap-4 rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-4"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <Trophy class="h-4 w-4 text-[var(--accent-strong)]" />
              <p class="font-semibold text-[var(--text-primary)]">Contest Alert</p>
            </div>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">
              Turn contest notifications on or off with one simple toggle.
            </p>
          </div>
          <input v-model="contestAlert" type="checkbox" class="h-5 w-5 accent-[var(--accent)]" />
        </label>

        <div class="rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-4">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <GraduationCap class="h-4 w-4 text-[var(--accent-strong)]" />
                <p class="font-semibold text-[var(--text-primary)]">Sponsorship Alert</p>
              </div>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">
                Enable sponsorship updates and choose the scholarship types you want to follow.
              </p>
            </div>
            <input v-model="sponsorshipAlert" type="checkbox" class="mt-1 h-5 w-5 accent-[var(--accent)]" />
          </div>

          <div v-if="sponsorshipAlert" class="mt-4 space-y-3">
            <div>
              <p class="text-sm font-semibold text-[var(--text-primary)]">Scholarship Type:</p>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">
                Select the sponsorship category you want alerts for.
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <label
                v-for="option in scholarshipOptions"
                :key="option"
                class="flex cursor-pointer items-center gap-3 rounded-[1rem] border px-4 py-3 transition"
                :class="
                  scholarshipType === option
                    ? 'border-[color:var(--accent-soft)] bg-white'
                    : 'border-[color:var(--border-soft)] bg-[var(--surface-primary)]'
                "
              >
                <input
                  v-model="scholarshipType"
                  type="radio"
                  name="scholarshipType"
                  :value="option"
                  class="h-4 w-4 accent-[var(--accent)]"
                />
                <span class="text-sm font-medium text-[var(--text-primary)]">{{ option }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-4">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <BriefcaseBusiness class="h-4 w-4 text-[var(--accent-strong)]" />
                <p class="font-semibold text-[var(--text-primary)]">Job Alert</p>
              </div>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">
                Add the jobs or skills you are searching for so we can tailor alert matches.
              </p>
            </div>
            <input v-model="jobAlert" type="checkbox" class="mt-1 h-5 w-5 accent-[var(--accent)]" />
          </div>

          <div v-if="jobAlert" class="mt-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="text-sm font-semibold text-[var(--text-primary)]">Jobs you are searching for</p>
                <p class="mt-1 text-sm text-[var(--text-secondary)]">Add up to 10 jobs/skills.</p>
              </div>
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                {{ remainingJobSearchSlots }} slots left
              </p>
            </div>

            <div
              class="flex min-h-[7rem] flex-wrap items-start gap-2 rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-3 transition focus-within:border-[color:var(--accent-soft)]"
            >
              <span
                v-for="tag in jobSearchTags"
                :key="tag"
                class="inline-flex items-center gap-2 rounded-full bg-[color:color-mix(in_srgb,var(--accent)_14%,white)] px-3 py-2 text-sm font-medium text-[var(--accent-strong)]"
              >
                <span>{{ tag }}</span>
                <button
                  type="button"
                  class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/70 text-[var(--accent-strong)] transition hover:bg-white"
                  @click="removeJobSearchTag(tag)"
                >
                  <X class="h-3.5 w-3.5" />
                </button>
              </span>

              <input
                v-if="jobSearchTags.length < maxJobSearchTags"
                :value="jobSearchInput"
                type="text"
                placeholder="Product designer, frontend developer, UI/UX, ..."
                class="min-w-[14rem] flex-1 border-none bg-transparent px-1 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                @input="handleJobSearchInput"
                @blur="finalizeJobSearchInput"
                @keydown.enter.prevent="finalizeJobSearchInput"
              />
            </div>

            <p class="text-xs text-[var(--text-secondary)]">
              Type a job title or skill and separate it with a comma to turn it into a pill.
            </p>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>
