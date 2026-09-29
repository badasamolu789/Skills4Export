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
import { hasNextPage } from '@/utils/paginatedLoader'

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

const JOBS_PAGE_SIZE = 5
const MANAGE_JOBS_PAGE_SIZE = 5
const JOBS_CACHE_TTL_MS = 2 * 60 * 1000

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
  const queuedJobs = ref<JobRecord[]>([])
  const hasMoreJobs = ref(false)
  const manageJobsError = ref('')
  const nextPostedJobsPage = ref<number | null>(null)
  const nextAppliedJobsPage = ref<number | null>(null)
  const isLoadingMoreManageJobs = ref(false)
  const jobError = ref('')
  let jobsRequest: Promise<void> | null = null
  let manageJobsRequest: Promise<void> | null = null
  let jobDetailRequest: Promise<void> | null = null
  let jobsLoadedAt = 0
  let manageJobsLoadedAt = 0

  const isFresh = (loadedAt: number) => loadedAt > 0 && Date.now() - loadedAt < JOBS_CACHE_TTL_MS

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

  const loadJobs = async (options: { force?: boolean } = {}) => {
    if (!options.force && jobs.value.length && isFresh(jobsLoadedAt)) {
      return
    }

    if (jobsRequest) {
      return jobsRequest
    }

    isLoadingJobs.value = true
    jobsError.value = ''
    nextJobsPage.value = null
    queuedJobs.value = []
    hasMoreJobs.value = false

    jobsRequest = (async () => {
      try {
        const response = await loadJobsPage(1)
        jobs.value = response.records.slice(0, JOBS_PAGE_SIZE)
        queuedJobs.value = response.records.slice(JOBS_PAGE_SIZE)
        nextJobsPage.value = response.nextPage
        hasMoreJobs.value = queuedJobs.value.length > 0 || Boolean(response.nextPage)
        jobsLoadedAt = Date.now()
      } catch (error) {
        jobsError.value = getDisplayErrorMessage(error, 'Unable to load jobs.')
        jobs.value = []
      } finally {
        isLoadingJobs.value = false
        jobsRequest = null
      }
    })()

    return jobsRequest
  }

  const loadMoreJobs = async () => {
    if ((!nextJobsPage.value && !queuedJobs.value.length) || isLoadingJobs.value || isLoadingMoreJobs.value) {
      return
    }

    isLoadingMoreJobs.value = true

    try {
      if (queuedJobs.value.length) {
        jobs.value = mergeJobs(jobs.value, queuedJobs.value.slice(0, JOBS_PAGE_SIZE))
        queuedJobs.value = queuedJobs.value.slice(JOBS_PAGE_SIZE)
        hasMoreJobs.value = queuedJobs.value.length > 0 || Boolean(nextJobsPage.value)
        return
      }
      if (!nextJobsPage.value) return
      const response = await loadJobsPage(nextJobsPage.value)
      jobs.value = mergeJobs(jobs.value, response.records.slice(0, JOBS_PAGE_SIZE))
      queuedJobs.value = response.records.slice(JOBS_PAGE_SIZE)
      nextJobsPage.value = response.nextPage
      hasMoreJobs.value = queuedJobs.value.length > 0 || Boolean(response.nextPage)
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
      jobsLoadedAt = Date.now()
    }
    postedJobs.value = [response.data, ...postedJobs.value.filter((job) => job.id !== response.data.id)]
    return response.data
  }

  const loadJob = async (idOrSlug: string) => {
    if (
      currentJob.value &&
      (currentJob.value.id === idOrSlug || currentJob.value.slug === idOrSlug)
    ) {
      return
    }

    if (jobDetailRequest) {
      return jobDetailRequest
    }

    isLoadingJob.value = true
    jobError.value = ''
    currentJob.value = null

    jobDetailRequest = (async () => {
      try {
        const response = await jobsService.getJob(idOrSlug, authStore.authToken)
        currentJob.value = mergeWithCachedJobIdentity(response.data, idOrSlug)
      } catch (error) {
        jobError.value = getDisplayErrorMessage(error, 'Unable to load this job.')
      } finally {
        isLoadingJob.value = false
        jobDetailRequest = null
      }
    })()

    return jobDetailRequest
  }

  const applyToCurrentJob = async (payload: ApplyToJobRequest) => {
    if (!currentJob.value) {
      return null
    }

    const applicationJobId = resolveApplicationJobId(currentJob.value)

    if (!applicationJobId) {
      throw new ApiError(
        'This job is not ready to accept applications. Refresh the page and try again.',
        400,
        {
          message: 'This job is not ready to accept applications. Refresh the page and try again.',
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

  const loadManageJobs = async (options: { force?: boolean } = {}) => {
    if (
      !options.force &&
      (postedJobs.value.length || appliedJobs.value.length) &&
      isFresh(manageJobsLoadedAt)
    ) {
      return
    }

    if (manageJobsRequest) {
      return manageJobsRequest
    }

    isLoadingManageJobs.value = true
    manageJobsError.value = ''
    nextPostedJobsPage.value = null
    nextAppliedJobsPage.value = null

    manageJobsRequest = (async () => {
      try {
        const postedResponse = await jobsService.listMyPostedJobs(
          { page: 1, per_page: MANAGE_JOBS_PAGE_SIZE }, authStore.authToken,
        )
        const appliedResponse = await jobsService.listMyJobApplications(
          { page: 1, per_page: MANAGE_JOBS_PAGE_SIZE }, authStore.authToken,
        )

        postedJobs.value = postedResponse.data
        appliedJobs.value = appliedResponse.data
        nextPostedJobsPage.value = hasNextPage(postedResponse) ? postedResponse.current_page + 1 : null
        nextAppliedJobsPage.value = hasNextPage(appliedResponse) ? appliedResponse.current_page + 1 : null
        manageJobsLoadedAt = Date.now()
      } catch (error) {
        manageJobsError.value = getDisplayErrorMessage(error, 'Unable to load your jobs.')
        postedJobs.value = []
        appliedJobs.value = []
      } finally {
        isLoadingManageJobs.value = false
        manageJobsRequest = null
      }
    })()

    return manageJobsRequest
  }

  const loadMoreManageJobs = async (tab: 'posted' | 'applied') => {
    const nextPage = tab === 'posted' ? nextPostedJobsPage.value : nextAppliedJobsPage.value
    if (!nextPage || isLoadingManageJobs.value || isLoadingMoreManageJobs.value) return
    isLoadingMoreManageJobs.value = true
    try {
      if (tab === 'posted') {
        const response = await jobsService.listMyPostedJobs(
          { page: nextPage, per_page: MANAGE_JOBS_PAGE_SIZE }, authStore.authToken,
        )
        postedJobs.value = mergeJobs(postedJobs.value, response.data)
        nextPostedJobsPage.value = hasNextPage(response) ? response.current_page + 1 : null
      } else {
        const response = await jobsService.listMyJobApplications(
          { page: nextPage, per_page: MANAGE_JOBS_PAGE_SIZE }, authStore.authToken,
        )
        const ids = new Set(appliedJobs.value.map((item) => item.id))
        appliedJobs.value = [...appliedJobs.value, ...response.data.filter((item) => !ids.has(item.id))]
        nextAppliedJobsPage.value = hasNextPage(response) ? response.current_page + 1 : null
      }
    } catch (error) {
      manageJobsError.value = getDisplayErrorMessage(error, 'Unable to load more jobs.')
    } finally {
      isLoadingMoreManageJobs.value = false
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
    isLoadingMoreManageJobs,
    isLoadingJob,
    jobsError,
    hasMoreJobs,
    manageJobsError,
    nextPostedJobsPage,
    nextAppliedJobsPage,
    jobError,
    loadJobs,
    loadMoreJobs,
    createJob,
    loadJob,
    applyToCurrentJob,
    withdrawApplication,
    loadManageJobs,
    loadMoreManageJobs,
  }
})
