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
import { usersService, type MyProfileData } from '@/services/users'
import { useAuthStore } from '@/stores/auth'

const PUBLIC_FREELANCER_STATUSES = new Set(['available', 'certified'])
const PUBLIC_FREELANCE_JOB_STATUSES = new Set(['approved', 'active', 'live'])

const isPublicFreelancer = (freelancer: FreelancerRecord) => {
  const status = freelancer.status?.toLowerCase()
  return !status || PUBLIC_FREELANCER_STATUSES.has(status)
}

const isPublicFreelanceJob = (job: FreelanceJobRecord) => {
  const status = job.status?.toLowerCase()
  return !status || PUBLIC_FREELANCE_JOB_STATUSES.has(status)
}

const mergeFreelanceJobs = (...groups: FreelanceJobRecord[][]) => {
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

const readProfileAvatar = (profile?: MyProfileData | null) =>
  profile?.profile?.avatar ||
  profile?.profile?.avatarUrl ||
  profile?.profile?.avatar_url ||
  profile?.oauthAccounts?.find((account) => account.avatarUrl)?.avatarUrl ||
  null

const readProfileEmail = (profile?: MyProfileData | null) =>
  profile?.user?.email || null

const enrichFreelancerProfiles = async (items: FreelancerRecord[], token?: string | null) => {
  const enriched = await Promise.all(
    items.map(async (freelancer) => {
      if (!freelancer.userId || (freelancer.avatar && (freelancer.email || freelancer.userEmail))) {
        return freelancer
      }

      const profileResponse = await usersService.getUserProfile(freelancer.userId, token)
      const profile = profileResponse.data
      const recordUser = freelancer.user ?? null

      return {
        ...freelancer,
        avatar: freelancer.avatar || recordUser?.avatar || readProfileAvatar(profile),
        email: freelancer.email || freelancer.userEmail || recordUser?.email || readProfileEmail(profile),
        userEmail: freelancer.userEmail || freelancer.email || recordUser?.email || readProfileEmail(profile),
      }
    }),
  )

  return enriched
}

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
      freelancers.value = await enrichFreelancerProfiles(
        response.data.filter(isPublicFreelancer),
        authStore.authToken,
      )
    } catch (error) {
      freelancersError.value = error instanceof ApiError ? error.message : 'Unable to load freelancers.'
      freelancers.value = []
    } finally {
      isLoadingFreelancers.value = false
    }
  }

  const createFreelancer = async (payload: CreateFreelancerRequest) => {
    const response = await freelancersService.createFreelancer(payload, authStore.authToken)
    if (isPublicFreelancer(response.data)) {
      freelancers.value = [response.data, ...freelancers.value]
    }
    return response.data
  }

  const loadFreelanceJobs = async () => {
    if (isLoadingFreelanceJobs.value) {
      return
    }

    isLoadingFreelanceJobs.value = true
    freelanceJobsError.value = ''

    try {
      const publicJobsResponse = await freelancersService.listFreelanceJobs({ per_page: 100 }, authStore.authToken)
      const publicJobs = publicJobsResponse.data.filter(isPublicFreelanceJob)
      let ownPostedJobs: FreelanceJobRecord[] = []

      if (authStore.authToken) {
        const ownPostedJobsResponse = await freelancersService.listMyFreelanceJobs({ per_page: 100 }, authStore.authToken)
        ownPostedJobs = ownPostedJobsResponse.data.filter(isPublicFreelanceJob)
      }

      freelanceJobs.value = mergeFreelanceJobs(ownPostedJobs, publicJobs)
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
    if (isPublicFreelanceJob(response.data)) {
      freelanceJobs.value = [response.data, ...freelanceJobs.value]
    }
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
