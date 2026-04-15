<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BriefcaseBusiness, ChevronLeft, ChevronRight, Mail, MapPin, Wallet, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const step = ref(1)
const skillInput = ref('')
const skillTags = ref<string[]>([])
let closeTimer: ReturnType<typeof setTimeout> | null = null

const form = ref({
  title: '',
  skills: '',
  location: 'Remote',
  jobType: '',
  senderEmail: '',
  confirmEmail: '',
  jobDescription: '',
  qualifications: '',
  workExperience: '',
  minSalary: '',
  companyName: '',
  applicationEndDate: '',
})

const totalSteps = 3
const inputClass =
  'h-13 w-full rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]'
const textareaClass =
  'w-full rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]'

const stepTitle = computed(() => {
  if (step.value === 1) return 'Role Basics'
  if (step.value === 2) return 'Contact & Details'
  return 'Requirements & Salary'
})

const stepDescription = computed(() => {
  if (step.value === 1) return 'Start with the job title, required skills, location, and job type.'
  if (step.value === 2) return 'Add the sender email, company information, and the main job summary.'
  return 'Complete the qualifications, experience, salary, and application deadline.'
})

const previousActionLabel = computed(() => (step.value === 1 ? 'Back' : 'Previous'))

const nextActionLabel = computed(() => {
  if (step.value === 1) return 'Next'
  if (step.value === 2) return 'Proceed'
  return 'Post Job'
})

const closeModal = () => {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  emit('close')
}

const syncSkillsField = () => {
  form.value.skills = skillTags.value.join(', ')
}

const addSkillTag = (rawSkill: string) => {
  const skill = rawSkill.trim()

  if (!skill) {
    return
  }

  const exists = skillTags.value.some((item) => item.toLowerCase() === skill.toLowerCase())

  if (exists) {
    return
  }

  skillTags.value.push(skill)
  syncSkillsField()
}

const commitSkills = (value: string) => {
  const parts = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  parts.forEach(addSkillTag)
}

const handleSkillsInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value

  if (!value.includes(',')) {
    skillInput.value = value
    return
  }

  const segments = value.split(',')
  const pendingValue = segments.pop() ?? ''

  commitSkills(segments.join(','))
  skillInput.value = pendingValue.trimStart()
}

const finalizeSkillInput = () => {
  if (!skillInput.value.trim()) {
    return
  }

  commitSkills(skillInput.value)
  skillInput.value = ''
}

const removeSkillTag = (skill: string) => {
  skillTags.value = skillTags.value.filter((item) => item !== skill)
  syncSkillsField()
}

const nextStep = () => {
  if (step.value < totalSteps) {
    step.value += 1
  }
}

const previousStep = () => {
  if (step.value > 1) {
    step.value -= 1
  }
}

const submitForm = () => {
  toast.success('Job posted successfully', {
    description: `${form.value.title || 'Your job'} is now ready for applicants.`,
  })

  closeTimer = setTimeout(() => {
    closeModal()
  }, 1200)
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      step.value = 1
      skillInput.value = ''
      return
    }

    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-[120] flex items-center justify-center bg-[color:rgba(12,12,27,0.58)] px-4 py-6 backdrop-blur-sm"
    >
      <div
        class="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[0_32px_90px_rgba(12,12,27,0.28)]"
      >
        <div class="border-b border-[color:var(--border-soft)] bg-[linear-gradient(135deg,rgba(66,63,151,0.12),rgba(211,154,69,0.08))] px-5 py-5 sm:px-6">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
                <span>Jobs</span>
                <span>/</span>
                <span class="font-medium text-[var(--accent-strong)]">Post A New Job</span>
              </div>
              <h2 class="mt-3 text-[1.7rem] font-semibold leading-tight text-[var(--text-primary)]">
                Post a new job
              </h2>
              <p class="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                Fill in the role details step by step, then publish the opening to the jobs feed.
              </p>
            </div>

            <button
              type="button"
              class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
              @click="closeModal"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="mt-5 flex flex-wrap items-center gap-3">
            <div
              v-for="current in totalSteps"
              :key="current"
              class="flex min-w-[8rem] flex-1 items-center gap-3 rounded-[1rem] border px-3 py-3"
              :class="
                current === step
                  ? 'border-[color:var(--accent-soft)] bg-[var(--surface-primary)]'
                  : 'border-[color:var(--border-soft)] bg-[color:rgba(255,255,255,0.55)]'
              "
            >
              <span
                class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
                :class="
                  current === step
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)]'
                "
              >
                {{ current }}
              </span>
              <div class="min-w-0">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                  Step {{ current }}
                </p>
                <p class="truncate text-sm font-medium text-[var(--text-primary)]">
                  {{ current === 1 ? 'Role' : current === 2 ? 'Contact' : 'Requirements' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div class="mb-5">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
              {{ stepTitle }}
            </p>
            <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
              {{ stepDescription }}
            </p>
          </div>

          <div v-if="step === 1" class="grid gap-4 md:grid-cols-2">
            <label class="space-y-2 md:col-span-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Job Title / Designation:*</span>
              <input
                v-model="form.title"
                type="text"
                placeholder="Senior Software Engineer, Business Development Mgr"
                :class="inputClass"
              />
            </label>

            <label class="space-y-2 md:col-span-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Required skills:*</span>
              <div
                class="flex min-h-[7.5rem] flex-wrap items-start gap-2 rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 py-3 transition focus-within:border-[color:var(--accent-soft)]"
              >
                <span
                  v-for="skill in skillTags"
                  :key="skill"
                  class="inline-flex items-center gap-2 rounded-full bg-[color:color-mix(in_srgb,var(--accent)_14%,white)] px-3 py-2 text-sm font-medium text-[var(--accent-strong)]"
                >
                  <span>{{ skill }}</span>
                  <button
                    type="button"
                    class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/70 text-[var(--accent-strong)] transition hover:bg-white"
                    @click="removeSkillTag(skill)"
                  >
                    <X class="h-3.5 w-3.5" />
                  </button>
                </span>

                <input
                  :value="skillInput"
                  type="text"
                  placeholder="java, project mgt, node.js, team mgt, ..."
                  class="min-w-[12rem] flex-1 border-none bg-transparent px-1 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                  @input="handleSkillsInput"
                  @blur="finalizeSkillInput"
                  @keydown.enter.prevent="finalizeSkillInput"
                />
              </div>
              <input v-model="form.skills" type="hidden" />
              <p class="text-xs text-[var(--text-secondary)]">
                Type a skill and add a comma to turn it into a badge pill.
              </p>
            </label>

            <label class="space-y-2">
              <span class="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <MapPin class="h-4 w-4 text-[var(--accent-strong)]" />
                <span>Location:*</span>
              </span>
              <input
                v-model="form.location"
                type="text"
                placeholder="Remote"
                :class="inputClass"
              />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Job Type:*</span>
              <select
                v-model="form.jobType"
                :class="inputClass"
              >
                <option value="">Select</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </label>
          </div>

          <div v-else-if="step === 2" class="grid gap-4 md:grid-cols-2">
            <label class="space-y-2">
              <span class="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Mail class="h-4 w-4 text-[var(--accent-strong)]" />
                <span>Sender's Email:*</span>
              </span>
              <input
                v-model="form.senderEmail"
                type="email"
                placeholder="jondoe@email.com"
                :class="inputClass"
              />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Re-enter Email:*</span>
              <input
                v-model="form.confirmEmail"
                type="email"
                placeholder="jondoe@email.com"
                :class="inputClass"
              />
            </label>

            <label class="space-y-2 md:col-span-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Company Name:*</span>
              <input
                v-model="form.companyName"
                type="text"
                placeholder="Company Name"
                :class="inputClass"
              />
            </label>

            <label class="space-y-2 md:col-span-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Job Description:*</span>
              <textarea
                v-model="form.jobDescription"
                rows="5"
                placeholder="Describe the role, team, responsibilities, and what success looks like."
                :class="textareaClass"
              />
            </label>
          </div>

          <div v-else class="grid gap-4 md:grid-cols-2">
            <label class="space-y-2 md:col-span-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Qualifications and Tasks:*</span>
              <textarea
                v-model="form.qualifications"
                rows="5"
                placeholder="Outline the qualifications, certifications, and core tasks for the role."
                :class="textareaClass"
              />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Work Experience:*</span>
              <select
                v-model="form.workExperience"
                :class="inputClass"
              >
                <option value="">Select</option>
                <option value="0-1">0 - 1 year</option>
                <option value="2-3">2 - 3 years</option>
                <option value="4-6">4 - 6 years</option>
                <option value="7+">7+ years</option>
              </select>
              <p class="text-xs text-[var(--text-secondary)]">
                Minimum work experience required to apply for this job.
              </p>
            </label>

            <label class="space-y-2">
              <span class="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Wallet class="h-4 w-4 text-[var(--accent-strong)]" />
                <span>Min Salary: ₦</span>
              </span>
              <input
                v-model="form.minSalary"
                type="number"
                min="0"
                placeholder="250000"
                :class="inputClass"
              />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Application end date:*</span>
              <input
                v-model="form.applicationEndDate"
                type="date"
                :class="inputClass"
              />
            </label>
          </div>
        </div>

        <div class="shrink-0 border-t border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-5 py-4 sm:px-6">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs leading-6 text-[var(--text-secondary)]">
              By posting, you agreed to the Terms of Service and Privacy Policy.
            </p>
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
              Step {{ step }} of {{ totalSteps }}
            </p>
          </div>

          <div class="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full border border-[color:var(--border-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
              @click="closeModal"
            >
              Cancel
            </button>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                class="inline-flex min-w-[8.5rem] items-center justify-center gap-2 rounded-full border border-[color:var(--border-soft)] px-4 py-2.5 text-sm font-semibold transition"
                :class="
                  step > 1
                    ? 'text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
                    : 'cursor-not-allowed text-[var(--text-tertiary)] opacity-60'
                "
                :disabled="step === 1"
                @click="previousStep"
              >
                <ChevronLeft class="h-4 w-4" />
                <span>{{ previousActionLabel }}</span>
              </button>

              <button
                v-if="step < totalSteps"
                type="button"
                class="inline-flex min-w-[8.5rem] items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                @click="nextStep"
              >
                <span>{{ nextActionLabel }}</span>
                <ChevronRight class="h-4 w-4" />
              </button>

              <button
                v-else
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                @click="submitForm"
              >
                <BriefcaseBusiness class="h-4 w-4" />
                <span>Post Job</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
