<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BriefcaseBusiness, Mail, MapPin, Wallet, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ApiError } from '@/lib/api'
import RichTextEditor from '@/components/RichTextEditor.vue'
import type { JobRecord } from '@/services/jobs'
import { useAuthStore } from '@/stores/auth'
import { useJobsStore } from '@/stores/jobs'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'created', job: JobRecord): void
}>()

const authStore = useAuthStore()
const jobsStore = useJobsStore()
const skillInput = ref('')
const skillTags = ref<string[]>([])
const isSubmitting = ref(false)
let closeTimer: ReturnType<typeof setTimeout> | null = null

const form = ref({
  title: '',
  skills: '',
  location: '',
  jobType: '',
  senderEmail: '',
  confirmEmail: '',
  jobDescription: '',
  qualifications: '',
  workExperience: '',
  minSalary: '',
  maxSalary: '',
  companyName: '',
  applicationEndDate: '',
})

const inputClass =
  'h-10 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 text-[0.86rem] text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]'
const textareaClass =
  'w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 py-2.5 text-[0.86rem] text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]'

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

const getTrimmedValue = (value: string) => value.trim()

const getApiErrorDescription = (error: unknown, fallback: string) => {
  if (!(error instanceof ApiError)) {
    return fallback
  }

  const payload = error.payload

  if (payload?.errors) {
    const messages = Object.values(payload.errors)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter(Boolean)

    if (messages.length) {
      return messages.join(' ')
    }
  }

  if (payload?.message) {
    return payload.message
  }

  if (typeof payload?.error === 'string') {
    return payload.error
  }

  if (payload?.error?.message) {
    return payload.error.message
  }

  return error.message || fallback
}

const submitForm = async () => {
  finalizeSkillInput()

  const title = getTrimmedValue(form.value.title)
  const companyName = getTrimmedValue(form.value.companyName)
  const description = getTrimmedValue(form.value.jobDescription)
  const senderEmail = getTrimmedValue(form.value.senderEmail)
  const confirmEmail = getTrimmedValue(form.value.confirmEmail)

  if (!title || !companyName || !description) {
    toast.error('Fill the required fields first.', {
      description: 'Job title, company name, and job description are required.',
    })
    return
  }

  if (senderEmail && confirmEmail && senderEmail !== confirmEmail) {
    toast.error('Emails do not match.')
    return
  }

  if (!authStore.authToken) {
    toast.error('Sign in required', {
      description: 'Please sign in again before posting a job.',
    })
    return
  }

  if (isSubmitting.value) {
    return
  }

  isSubmitting.value = true

  try {
    const job = await jobsStore.createJob({
      title,
      skills: skillTags.value.length ? [...skillTags.value] : undefined,
      location: getTrimmedValue(form.value.location) || undefined,
      type: form.value.jobType || undefined,
      workMode: form.value.jobType === 'remote' || form.value.jobType === 'hybrid' ? form.value.jobType : undefined,
      senderEmail: senderEmail || undefined,
      companyName,
      description,
      qualifications: getTrimmedValue(form.value.qualifications) || undefined,
      workExperience: form.value.workExperience || undefined,
      minSalary: form.value.minSalary ? Number(form.value.minSalary) : undefined,
      maxSalary: form.value.maxSalary ? Number(form.value.maxSalary) : null,
      salaryCurrency: 'NGN',
      applicationEndDate: form.value.applicationEndDate || undefined,
    })

    emit('created', job)
    toast.success('Job submitted', {
      description: `${job.title || form.value.title || 'Your job'} will show after admin approval.`,
    })

    closeTimer = setTimeout(() => {
      closeModal()
    }, 1200)
  } catch (error) {
    const message = getApiErrorDescription(error, 'Unable to post this job.')
    toast.error('Job failed', { description: message })
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
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
      class="fixed inset-0 z-[120] flex items-end justify-center bg-[#0c0c1b]/50 px-0 pt-5 sm:items-center sm:px-4 sm:py-5"
    >
      <div
        class="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)] sm:rounded-[1rem]"
      >
        <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submitForm">
          <div class="flex items-center justify-between gap-3 border-b border-[color:var(--border-soft)] px-4 py-3 sm:px-5">
            <h2 class="text-lg font-semibold text-[var(--text-primary)]">Post Job</h2>

            <button
              type="button"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
              @click="closeModal"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div class="grid gap-4 md:grid-cols-2">
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
                class="flex min-h-[5.5rem] flex-wrap items-start gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 py-2.5 transition focus-within:border-[color:var(--accent-soft)]"
              >
                <span
                  v-for="skill in skillTags"
                  :key="skill"
                  class="inline-flex items-center gap-1.5 rounded-full bg-[color:color-mix(in_srgb,var(--accent)_14%,white)] px-2.5 py-1.5 text-[0.8rem] font-medium text-[var(--accent-strong)]"
                >
                  <span>{{ skill }}</span>
                  <button
                    type="button"
                    class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[var(--accent-strong)] transition hover:bg-[var(--surface-muted)]"
                    @click="removeSkillTag(skill)"
                  >
                    <X class="h-3.5 w-3.5" />
                  </button>
                </span>

                <input
                  :value="skillInput"
                  type="text"
                  placeholder="java, project mgt, node.js, team mgt, ..."
                  class="min-w-[12rem] flex-1 border-none bg-[var(--surface-secondary)] px-1 py-2 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                  @input="handleSkillsInput"
                  @blur="finalizeSkillInput"
                  @keydown.enter.prevent="finalizeSkillInput"
                />
              </div>
              <input v-model="form.skills" type="hidden" />
            </label>

            <label class="space-y-2">
              <span class="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <MapPin class="h-4 w-4 text-[var(--accent-strong)]" />
                <span>Location:*</span>
              </span>
              <input
                v-model="form.location"
                type="text"
                placeholder="Lagos, Nigeria"
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
                rows="4"
                placeholder="Describe the role, team, responsibilities, and what success looks like."
                :class="textareaClass"
              />
            </label>
            <label class="space-y-2 md:col-span-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Qualifications:*</span>
              <RichTextEditor
                v-model="form.qualifications"
                placeholder="List the qualifications, experience, certifications, and requirements for this job."
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
              <span class="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Wallet class="h-4 w-4 text-[var(--accent-strong)]" />
                <span>Max Salary: ₦</span>
              </span>
              <input
                v-model="form.maxSalary"
                type="number"
                min="0"
                placeholder="500000"
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

          <div class="shrink-0 border-t border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 sm:px-5">
          <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
              type="submit"
              :disabled="isSubmitting"
              class="inline-flex items-center justify-center gap-2 rounded-[0.8rem] bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              >
                <BriefcaseBusiness class="h-4 w-4" />
                <span>{{ isSubmitting ? 'Posting...' : 'Post Job' }}</span>
              </button>
          </div>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
