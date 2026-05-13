import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/lib/api'
import {
  freelancersService,
  type ApplyToFreelanceJobRequest,
  type CreateFreelanceJobRequest,
  type CreateFreelancerRequest,
  type FreelanceJobRecord,
  type FreelancerRecord,
} from '@/services/freelancers'
import { useAuthStore } from '@/stores/auth'

export const useFreelancersStore = defineStore('freelancers', () => {
  const authStore = useAuthStore()
  const freelancers = ref<FreelancerRecord[]>([])
  const freelanceJobs = ref<FreelanceJobRecord[]>([])
  const currentFreelanceJob = ref<FreelanceJobRecord | null>(null)
  const isLoadingFreelancers = ref(false)
  const isLoadingFreelanceJobs = ref(false)
  const isLoadingFreelanceJobDetail = ref(false)
  const freelancersError = ref('')
  const freelanceJobsError = ref('')
  const freelanceJobDetailError = ref('')

  const loadFreelancers = async () => {
    isLoadingFreelancers.value = true
    freelancersError.value = ''

    try {
      const response = await freelancersService.listFreelancers({ per_page: 100 }, authStore.authToken)
      freelancers.value = response.data
    } catch (error) {
      freelancersError.value = error instanceof ApiError ? error.message : 'Unable to load freelancers.'
      freelancers.value = []
    } finally {
      isLoadingFreelancers.value = false
    }
  }

  const createFreelancer = async (payload: CreateFreelancerRequest) => {
    const response = await freelancersService.createFreelancer(payload, authStore.authToken)
    freelancers.value = [response.data, ...freelancers.value]
    return response.data
  }

  const loadFreelanceJobs = async () => {
    isLoadingFreelanceJobs.value = true
    freelanceJobsError.value = ''

    try {
      const response = await freelancersService.listFreelanceJobs(
        { per_page: 100, status: 'live' },
        authStore.authToken,
        { suppressErrorModal: true },
      )
      freelanceJobs.value = response.data.filter((job) => !job.status || job.status === 'live')
    } catch (error) {
      freelanceJobsError.value =
        error instanceof ApiError ? error.message : 'Unable to load freelance jobs.'
      freelanceJobs.value = []
    } finally {
      isLoadingFreelanceJobs.value = false
    }
  }

  const createFreelanceJob = async (payload: CreateFreelanceJobRequest) => {
    const response = await freelancersService.createFreelanceJob(payload, authStore.authToken)
    freelanceJobs.value = [response.data, ...freelanceJobs.value]
    return response.data
  }

  const loadFreelanceJob = async (idOrSlug: string) => {
    isLoadingFreelanceJobDetail.value = true
    freelanceJobDetailError.value = ''

    try {
      const response = await freelancersService.getFreelanceJob(idOrSlug, authStore.authToken)
      currentFreelanceJob.value = response.data
    } catch (error) {
      freelanceJobDetailError.value =
        error instanceof ApiError ? error.message : 'Unable to load this freelance job.'
    } finally {
      isLoadingFreelanceJobDetail.value = false
    }
  }

  const applyToCurrentFreelanceJob = async (payload: ApplyToFreelanceJobRequest) => {
    if (!currentFreelanceJob.value) {
      return null
    }

    const response = await freelancersService.applyToFreelanceJob(
      currentFreelanceJob.value.id,
      payload,
      authStore.authToken,
    )
    const updatedJob = {
      ...currentFreelanceJob.value,
      hasApplied: true,
      applicantCount: (currentFreelanceJob.value.applicantCount || 0) + 1,
    }
    currentFreelanceJob.value = updatedJob
    freelanceJobs.value = freelanceJobs.value.map((job) => (job.id === updatedJob.id ? updatedJob : job))
    return response.data
  }

  return {
    freelancers,
    freelanceJobs,
    currentFreelanceJob,
    isLoadingFreelancers,
    isLoadingFreelanceJobs,
    isLoadingFreelanceJobDetail,
    freelancersError,
    freelanceJobsError,
    freelanceJobDetailError,
    loadFreelancers,
    createFreelancer,
    loadFreelanceJobs,
    createFreelanceJob,
    loadFreelanceJob,
    applyToCurrentFreelanceJob,
  }
})
