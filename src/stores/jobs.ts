import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/lib/api'
import { getDisplayErrorMessage } from '@/lib/errors'
import {
  jobsService,
  type ApplyToJobRequest,
  type CreateJobRequest,
  type JobApplicationRecord,
  type JobRecord,
} from '@/services/jobs'
import { useAuthStore } from '@/stores/auth'
import { hasNextPage, loadPaginatedRecords } from '@/utils/paginatedLoader'

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

const JOBS_PAGE_SIZE = 12
const MANAGE_JOBS_PAGE_SIZE = 20

export const useJobsStore = defineStore('jobs', () => {
  const authStore = useAuthStore()
  const jobs = ref<JobRecord[]>([])
  const postedJobs = ref<JobRecord[]>([])
  const appliedJobs = ref<JobApplicationRecord[]>([])
  const currentJob = ref<JobRecord | null>(null)
  const isLoadingJobs = ref(false)
  const isLoadingMoreJobs = ref(false)
  const isLoadingManageJobs = ref(false)
  const isLoadingJob = ref(false)
  const jobsError = ref('')
  const nextJobsPage = ref<number | null>(null)
  const hasMoreJobs = ref(false)
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

  const loadJobsPage = async (page = 1) => {
    const publicJobsResponse = await jobsService.listJobs(
      { page, per_page: JOBS_PAGE_SIZE },
      authStore.authToken,
    )
    const publicJobs = publicJobsResponse.data.filter(isPublicJob)
    let ownPostedJobs: JobRecord[] = []

    if (authStore.authToken && page === 1) {
      const ownPostedJobsResponse = await jobsService.listMyPostedJobs(
        { page: 1, per_page: JOBS_PAGE_SIZE },
        authStore.authToken,
      )
      ownPostedJobs = ownPostedJobsResponse.data.filter(isPublicJob)
      postedJobs.value = ownPostedJobs
    }

    return {
      records: mergeJobs(ownPostedJobs, publicJobs),
      nextPage: hasNextPage(publicJobsResponse) ? publicJobsResponse.current_page + 1 : null,
    }
  }

  const loadJobs = async () => {
    isLoadingJobs.value = true
    jobsError.value = ''
    nextJobsPage.value = null
    hasMoreJobs.value = false

    try {
      const response = await loadJobsPage(1)
      jobs.value = response.records
      nextJobsPage.value = response.nextPage
      hasMoreJobs.value = Boolean(response.nextPage)
    } catch (error) {
      jobsError.value = getDisplayErrorMessage(error, 'Unable to load jobs.')
      jobs.value = []
    } finally {
      isLoadingJobs.value = false
    }
  }

  const loadMoreJobs = async () => {
    if (!nextJobsPage.value || isLoadingJobs.value || isLoadingMoreJobs.value) {
      return
    }

    isLoadingMoreJobs.value = true

    try {
      const response = await loadJobsPage(nextJobsPage.value)
      jobs.value = mergeJobs(jobs.value, response.records)
      nextJobsPage.value = response.nextPage
      hasMoreJobs.value = Boolean(response.nextPage)
      jobsError.value = ''
    } catch (error) {
      jobsError.value = getDisplayErrorMessage(error, 'Unable to load more jobs.')
    } finally {
      isLoadingMoreJobs.value = false
    }
  }

  const createJob = async (payload: CreateJobRequest) => {
    const response = await jobsService.createJob(payload, authStore.authToken)
    if (isPublicJob(response.data)) {
      jobs.value = [response.data, ...jobs.value]
    }
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
      jobError.value = getDisplayErrorMessage(error, 'Unable to load this job.')
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
    jobs.value = jobs.value.map((job) =>
      job.id === currentJob.value?.id
        ? { ...job, hasApplied: true, applicantCount: currentJob.value.applicantCount }
        : job,
    )
    appliedJobs.value = [response.data, ...appliedJobs.value]
    return response.data
  }

  const withdrawApplication = async (application: JobApplicationRecord) => {
    if (!application.jobId || !application.id) {
      throw new ApiError('This application cannot be withdrawn.', 400)
    }

    await jobsService.withdrawJobApplication(
      application.jobId,
      application.id,
      authStore.authToken,
    )
    appliedJobs.value = appliedJobs.value.filter((item) => item.id !== application.id)
    jobs.value = jobs.value.map((job) =>
      job.id === application.jobId
        ? {
            ...job,
            hasApplied: false,
            applicantCount: Math.max(0, (job.applicantCount || 0) - 1),
          }
        : job,
    )

    if (currentJob.value?.id === application.jobId) {
      currentJob.value = {
        ...currentJob.value,
        hasApplied: false,
        applicantCount: Math.max(0, (currentJob.value.applicantCount || 0) - 1),
      }
    }
  }

  const loadManageJobs = async () => {
    isLoadingManageJobs.value = true
    manageJobsError.value = ''

    try {
      const postedResponse = await loadPaginatedRecords(
        (params) => jobsService.listMyPostedJobs(params, authStore.authToken),
        {},
        { perPage: MANAGE_JOBS_PAGE_SIZE, maxPages: 3 },
      )
      const appliedResponse = await loadPaginatedRecords(
        (params) => jobsService.listMyJobApplications(params, authStore.authToken),
        {},
        { perPage: MANAGE_JOBS_PAGE_SIZE, maxPages: 3 },
      )

      postedJobs.value = postedResponse.data
      appliedJobs.value = appliedResponse.data
    } catch (error) {
      manageJobsError.value = getDisplayErrorMessage(error, 'Unable to load your jobs.')
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
    isLoadingMoreJobs,
    isLoadingManageJobs,
    isLoadingJob,
    jobsError,
    hasMoreJobs,
    manageJobsError,
    jobError,
    loadJobs,
    loadMoreJobs,
    createJob,
    loadJob,
    applyToCurrentJob,
    withdrawApplication,
    loadManageJobs,
  }
})
