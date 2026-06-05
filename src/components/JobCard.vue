<script setup lang="ts">
import { BriefcaseBusiness, MapPin, Wallet } from 'lucide-vue-next'
import type { JobRecord } from '@/services/jobs'

const props = defineProps<{
  job: JobRecord
  statusLabel?: string
  footerLabel?: string
}>()

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

const salaryLabel = () => {
  if (props.job.salaryLabel) {
    return props.job.salaryLabel
  }

  const min = formatMoney(props.job.salaryMin, props.job.salaryCurrency || 'NGN')
  const max = formatMoney(props.job.salaryMax, props.job.salaryCurrency || 'NGN')
  return min && max ? `${min} - ${max}` : min || max || 'Salary not listed'
}

const experienceLabel = () => {
  const experience = props.job.experience?.trim()
  if (!experience) return 'Experience not listed'
  if (/yrs?\)?$/i.test(experience) || /years?$/i.test(experience)) {
    return experience.replace(/\s*years?$/i, '(yrs)')
  }
  return `${experience.replace(/\s*-\s*/g, '-')}(yrs)`
}
</script>

<template>
  <article class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
    <div class="min-w-0">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <RouterLink
          :to="`/jobs/${job.id || job.slug}`"
          class="block text-[1.08rem] font-semibold leading-tight text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
        >
          {{ job.title }}
        </RouterLink>
        <span
          v-if="statusLabel"
          class="rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs font-semibold capitalize text-[var(--text-secondary)]"
        >
          {{ statusLabel }}
        </span>
      </div>

      <p class="mt-2 inline-flex items-center gap-2 text-[0.86rem] font-semibold text-[var(--text-secondary)]">
        <BriefcaseBusiness class="h-4 w-4 text-[var(--accent-strong)]" />
        {{ job.companyName }}
      </p>

      <p v-if="job.description" class="mt-2 line-clamp-2 max-w-3xl text-[0.84rem] leading-5 text-[var(--text-secondary)]">
        {{ job.description }}
      </p>

      <div class="mt-3 flex flex-wrap gap-2">
        <span class="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-[0.82rem] text-[var(--text-secondary)]">
          <MapPin class="h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
          <span class="truncate">{{ job.location || 'Location not listed' }}</span>
        </span>
        <span class="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-[0.82rem] text-[var(--text-secondary)]">
          <BriefcaseBusiness class="h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
          <span class="truncate">{{ experienceLabel() }}</span>
        </span>
        <span class="inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-[0.82rem] text-[var(--text-secondary)]">
          <Wallet class="h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
          <span class="truncate">{{ salaryLabel() }}</span>
        </span>
      </div>

      <div v-if="job.skills?.length" class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="skill in job.skills"
          :key="skill"
          class="rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 py-1 text-[0.76rem] font-semibold text-[var(--text-secondary)]"
        >
          {{ skill }}
        </span>
      </div>

      <p v-if="footerLabel" class="mt-3 text-xs font-medium text-[var(--text-tertiary)]">{{ footerLabel }}</p>
    </div>
  </article>
</template>
