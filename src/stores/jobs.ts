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

  const loadJobs = async () => {
    isLoadingJobs.value = true
    jobsError.value = ''

    try {
      const response = await jobsService.listJobs(
        { per_page: 100, status: 'live' },
        authStore.authToken,
        { suppressErrorModal: true },
      )
      jobs.value = response.data.filter((job) => !job.status || job.status === 'live')
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
      currentJob.value = response.data
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

    const response = await jobsService.applyToJob(currentJob.value.id, payload, authStore.authToken)
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
