import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/lib/api'
import {
  jobsService,
  type ApplyToJobRequest,
  type CreateJobRequest,
  type JobApplicationRecord,
  type JobRecord,
} from '@/services/jobs'
import { useAuthStore } from '@/stores/auth'

const PUBLIC_JOB_STATUSES = new Set(['approved', 'active', 'live'])

const isPublicJob = (job: JobRecord) => {
  const status = job.status?.toLowerCase()
  return !status || PUBLIC_JOB_STATUSES.has(status)
}

const mergeJobs = (...groups: JobRecord[][]) => {
  const seen = new Set<string>()

  return groups.flat().filter((job) => {
    const key = job.id || job.slug

    if (!key || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

const isCompleteUuid = (value?: string | null) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))

export const useJobsStore = defineStore('jobs', () => {
  const authStore = useAuthStore()
  const jobs = ref<JobRecord[]>([])
  const postedJobs = ref<JobRecord[]>([])
  const appliedJobs = ref<JobApplicationRecord[]>([])
  const currentJob = ref<JobRecord | null>(null)
  const isLoadingJobs = ref(false)
  const isLoadingManageJobs = ref(false)
  const isLoadingJob = ref(false)
  const jobsError = ref('')
  const manageJobsError = ref('')
  const jobError = ref('')

  const findCachedJob = (idOrSlug: string) =>
    [...jobs.value, ...postedJobs.value].find((job) =>
      job.id === idOrSlug ||
      job.slug === idOrSlug ||
      (isCompleteUuid(job.id) && job.id === currentJob.value?.id) ||
      (job.slug && job.slug === currentJob.value?.slug),
    )

  const mergeWithCachedJobIdentity = (job: JobRecord, idOrSlug?: string) => {
    const cachedJob = idOrSlug ? findCachedJob(idOrSlug) : findCachedJob(job.slug || job.id)
    const canonicalId = [job.id, cachedJob?.id].find((value) => isCompleteUuid(value))

    return {
      ...cachedJob,
      ...job,
      id: canonicalId || job.id,
      slug: job.slug || cachedJob?.slug,
    }
  }

  const resolveApplicationJobId = (job: JobRecord) => {
    const cachedJob = findCachedJob(job.slug || job.id)
    return [job.id, cachedJob?.id].find((value) => isCompleteUuid(value)) || ''
  }

  const loadJobs = async () => {
    isLoadingJobs.value = true
    jobsError.value = ''

    try {
      const [publicJobsResult, ownPostedJobsResult] = await Promise.allSettled([
        jobsService.listJobs({ per_page: 100 }, authStore.authToken, { suppressErrorModal: true }),
        authStore.authToken
          ? jobsService.listMyPostedJobs({ per_page: 100 }, authStore.authToken)
          : Promise.resolve({ data: [] as JobRecord[] }),
      ])

      const publicJobs =
        publicJobsResult.status === 'fulfilled' ? publicJobsResult.value.data.filter(isPublicJob) : []
      const ownPostedJobs =
        ownPostedJobsResult.status === 'fulfilled' ? ownPostedJobsResult.value.data : []

      if (ownPostedJobsResult.status === 'fulfilled') {
        postedJobs.value = ownPostedJobs
      }

      if (publicJobsResult.status === 'rejected' && !ownPostedJobs.length) {
        throw publicJobsResult.reason
      }

      jobs.value = mergeJobs(ownPostedJobs, publicJobs)
    } catch (error) {
      jobsError.value = error instanceof ApiError ? error.message : 'Unable to load jobs.'
      jobs.value = []
    } finally {
      isLoadingJobs.value = false
    }
  }

  const createJob = async (payload: CreateJobRequest) => {
    const response = await jobsService.createJob(payload, authStore.authToken)
    jobs.value = [response.data, ...jobs.value]
    postedJobs.value = [response.data, ...postedJobs.value.filter((job) => job.id !== response.data.id)]
    return response.data
  }

  const loadJob = async (idOrSlug: string) => {
    isLoadingJob.value = true
    jobError.value = ''
    currentJob.value = null

    try {
      const response = await jobsService.getJob(idOrSlug, authStore.authToken)
      currentJob.value = mergeWithCachedJobIdentity(response.data, idOrSlug)
    } catch (error) {
      jobError.value = error instanceof ApiError ? error.message : 'Unable to load this job.'
    } finally {
      isLoadingJob.value = false
    }
  }

  const applyToCurrentJob = async (payload: ApplyToJobRequest) => {
    if (!currentJob.value) {
      return null
    }

    const applicationJobId = resolveApplicationJobId(currentJob.value)

    if (!applicationJobId) {
      throw new ApiError(
        'This job cannot accept applications because the API did not return a valid job id.',
        400,
        {
          message: 'This job cannot accept applications because the API did not return a valid job id.',
        },
      )
    }

    const response = await jobsService.applyToJob(applicationJobId, payload, authStore.authToken)

    currentJob.value = {
      ...currentJob.value,
      hasApplied: true,
      applicantCount: (currentJob.value.applicantCount || 0) + 1,
    }
    appliedJobs.value = [response.data, ...appliedJobs.value]
    return response.data
  }

  const loadManageJobs = async () => {
    isLoadingManageJobs.value = true
    manageJobsError.value = ''

    try {
      const [postedResponse, appliedResponse] = await Promise.all([
        jobsService.listMyPostedJobs({ per_page: 100 }, authStore.authToken),
        jobsService.listMyJobApplications({ per_page: 100 }, authStore.authToken),
      ])

      postedJobs.value = postedResponse.data
      appliedJobs.value = appliedResponse.data
    } catch (error) {
      manageJobsError.value = error instanceof ApiError ? error.message : 'Unable to load your jobs.'
      postedJobs.value = []
      appliedJobs.value = []
    } finally {
      isLoadingManageJobs.value = false
    }
  }

  return {
    jobs,
    postedJobs,
    appliedJobs,
    currentJob,
    isLoadingJobs,
    isLoadingManageJobs,
    isLoadingJob,
    jobsError,
    manageJobsError,
    jobError,
    loadJobs,
    createJob,
    loadJob,
    applyToCurrentJob,
    loadManageJobs,
  }
})
