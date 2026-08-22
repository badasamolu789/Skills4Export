import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getDisplayErrorMessage } from '@/lib/errors'
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
import { hasNextPage } from '@/utils/paginatedLoader'
import { createCachedRequest } from '@/utils/requestCache'

const PUBLIC_FREELANCER_STATUSES = new Set(['available', 'certified', 'verified'])
const PUBLIC_FREELANCE_JOB_STATUSES = new Set(['approved', 'active', 'live'])
const FREELANCERS_PAGE_SIZE = 10
const FREELANCE_JOBS_PAGE_SIZE = 10
const FREELANCERS_CACHE_TTL_MS = 2 * 60 * 1000
const FREELANCER_PROFILE_CACHE_TTL_MS = 5 * 60 * 1000

const userProfileRequests = createCachedRequest<MyProfileData | null>(FREELANCER_PROFILE_CACHE_TTL_MS)

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

const loadFreelancerProfile = (userId: string, token?: string | null) =>
  userProfileRequests.run(
    `${token ? 'auth' : 'guest'}:${userId}`,
    () => usersService.getUserProfile(userId, token).then((response) => response.data ?? null),
  )

const enrichFreelancerProfiles = async (items: FreelancerRecord[], token?: string | null) => {
  const enriched: FreelancerRecord[] = []
  const batchSize = 4

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize)
    const records = await Promise.all(
      batch.map(async (freelancer) => {
        if (!freelancer.userId || (freelancer.avatar && (freelancer.email || freelancer.userEmail))) {
          return freelancer
        }

        const profile = await loadFreelancerProfile(freelancer.userId, token)
        const recordUser = freelancer.user ?? null

        return {
          ...freelancer,
          avatar: freelancer.avatar || recordUser?.avatar || readProfileAvatar(profile),
          email: freelancer.email || freelancer.userEmail || recordUser?.email || readProfileEmail(profile),
          userEmail: freelancer.userEmail || freelancer.email || recordUser?.email || readProfileEmail(profile),
        }
      }),
    )

    enriched.push(...records)
  }

  return enriched
}

export const useFreelancersStore = defineStore('freelancers', () => {
  const authStore = useAuthStore()
  const freelancers = ref<FreelancerRecord[]>([])
  const freelanceJobs = ref<FreelanceJobRecord[]>([])
  const currentFreelanceJob = ref<FreelanceJobRecord | null>(null)
  const isLoadingFreelancers = ref(false)
  const isLoadingMoreFreelancers = ref(false)
  const isLoadingFreelanceJobs = ref(false)
  const isLoadingMoreFreelanceJobs = ref(false)
  const isLoadingFreelanceJobDetail = ref(false)
  const freelancersError = ref('')
  const freelanceJobsError = ref('')
  const freelanceJobDetailError = ref('')
  let freelancersRequest: Promise<void> | null = null
  let freelanceJobsRequest: Promise<void> | null = null
  let freelanceJobRequest: Promise<void> | null = null
  let freelancersLoadedAt = 0
  let freelanceJobsLoadedAt = 0
  const nextFreelancersPage = ref<number | null>(null)
  const nextFreelanceJobsPage = ref<number | null>(null)
  const hasMoreFreelancerPages = ref(false)
  const hasMoreFreelanceJobPages = ref(false)

  const isFresh = (loadedAt: number) => loadedAt > 0 && Date.now() - loadedAt < FREELANCERS_CACHE_TTL_MS

  const loadFreelancers = async (options: { force?: boolean } = {}) => {
    if (!options.force && freelancers.value.length && isFresh(freelancersLoadedAt)) {
      return
    }

    if (freelancersRequest) {
      return freelancersRequest
    }

    isLoadingFreelancers.value = true
    freelancersError.value = ''

    freelancersRequest = (async () => {
      try {
        const response = await freelancersService.listFreelancers(
          { page: 1, per_page: FREELANCERS_PAGE_SIZE },
          authStore.authToken,
        )
        freelancers.value = await enrichFreelancerProfiles(
          response.data.filter(isPublicFreelancer),
          authStore.authToken,
        )
        nextFreelancersPage.value = hasNextPage(response) ? response.current_page + 1 : null
        hasMoreFreelancerPages.value = Boolean(nextFreelancersPage.value)
        freelancersLoadedAt = Date.now()
      } catch (error) {
        freelancersError.value = getDisplayErrorMessage(error, 'Unable to load freelancers.')
        freelancers.value = []
        nextFreelancersPage.value = null
        hasMoreFreelancerPages.value = false
      } finally {
        isLoadingFreelancers.value = false
        freelancersRequest = null
      }
    })()

    return freelancersRequest
  }

  const loadMoreFreelancers = async () => {
    if (!nextFreelancersPage.value || isLoadingFreelancers.value || isLoadingMoreFreelancers.value) {
      return
    }

    isLoadingMoreFreelancers.value = true

    try {
      const response = await freelancersService.listFreelancers(
        { page: nextFreelancersPage.value, per_page: FREELANCERS_PAGE_SIZE },
        authStore.authToken,
      )
      const nextItems = await enrichFreelancerProfiles(
        response.data.filter(isPublicFreelancer),
        authStore.authToken,
      )
      const seen = new Set(freelancers.value.map((freelancer) => freelancer.id || freelancer.userId))
      freelancers.value = [
        ...freelancers.value,
        ...nextItems.filter((freelancer) => {
          const key = freelancer.id || freelancer.userId
          return key && !seen.has(key)
        }),
      ]
      nextFreelancersPage.value = hasNextPage(response) ? response.current_page + 1 : null
      hasMoreFreelancerPages.value = Boolean(nextFreelancersPage.value)
      freelancersError.value = ''
    } catch (error) {
      freelancersError.value = getDisplayErrorMessage(error, 'Unable to load more freelancers.')
    } finally {
      isLoadingMoreFreelancers.value = false
    }
  }

  const createFreelancer = async (payload: CreateFreelancerRequest) => {
    const response = await freelancersService.createFreelancer(payload, authStore.authToken)
    if (isPublicFreelancer(response.data)) {
      freelancers.value = [response.data, ...freelancers.value]
    }
    return response.data
  }

  const loadFreelanceJobs = async (options: { force?: boolean } = {}) => {
    if (!options.force && freelanceJobs.value.length && isFresh(freelanceJobsLoadedAt)) {
      return
    }

    if (freelanceJobsRequest) {
      return freelanceJobsRequest
    }

    isLoadingFreelanceJobs.value = true
    freelanceJobsError.value = ''

    freelanceJobsRequest = (async () => {
      try {
        const [publicJobsResponse, ownPostedJobsResponse] = await Promise.all([
          freelancersService.listFreelanceJobs(
            { page: 1, per_page: FREELANCE_JOBS_PAGE_SIZE },
            authStore.authToken,
          ),
          authStore.authToken
            ? freelancersService.listMyFreelanceJobs(
              { page: 1, per_page: FREELANCE_JOBS_PAGE_SIZE },
              authStore.authToken,
            )
            : Promise.resolve(null),
        ])
        const publicJobs = publicJobsResponse.data.filter(isPublicFreelanceJob)
        const ownPostedJobs = (ownPostedJobsResponse?.data ?? []).filter(isPublicFreelanceJob)

        freelanceJobs.value = mergeFreelanceJobs(ownPostedJobs, publicJobs)
        nextFreelanceJobsPage.value = hasNextPage(publicJobsResponse) ? publicJobsResponse.current_page + 1 : null
        hasMoreFreelanceJobPages.value = Boolean(nextFreelanceJobsPage.value)
        freelanceJobsLoadedAt = Date.now()
      } catch (error) {
        freelanceJobsError.value = getDisplayErrorMessage(error, 'Unable to load freelance jobs.')
        freelanceJobs.value = []
        nextFreelanceJobsPage.value = null
        hasMoreFreelanceJobPages.value = false
      } finally {
        isLoadingFreelanceJobs.value = false
        freelanceJobsRequest = null
      }
    })()

    return freelanceJobsRequest
  }

  const loadMoreFreelanceJobs = async () => {
    if (!nextFreelanceJobsPage.value || isLoadingFreelanceJobs.value || isLoadingMoreFreelanceJobs.value) {
      return
    }

    isLoadingMoreFreelanceJobs.value = true

    try {
      const response = await freelancersService.listFreelanceJobs(
        { page: nextFreelanceJobsPage.value, per_page: FREELANCE_JOBS_PAGE_SIZE },
        authStore.authToken,
      )
      const publicJobs = response.data.filter(isPublicFreelanceJob)
      freelanceJobs.value = mergeFreelanceJobs(freelanceJobs.value, publicJobs)
      nextFreelanceJobsPage.value = hasNextPage(response) ? response.current_page + 1 : null
      hasMoreFreelanceJobPages.value = Boolean(nextFreelanceJobsPage.value)
      freelanceJobsError.value = ''
    } catch (error) {
      freelanceJobsError.value = getDisplayErrorMessage(error, 'Unable to load more freelance jobs.')
    } finally {
      isLoadingMoreFreelanceJobs.value = false
    }
  }

  const createFreelanceJob = async (payload: CreateFreelanceJobRequest) => {
    const response = await freelancersService.createFreelanceJob(payload, authStore.authToken)
    if (isPublicFreelanceJob(response.data)) {
      freelanceJobs.value = [response.data, ...freelanceJobs.value]
      freelanceJobsLoadedAt = Date.now()
    }
    return response.data
  }

  const loadFreelanceJob = async (idOrSlug: string) => {
    if (
      currentFreelanceJob.value &&
      (currentFreelanceJob.value.id === idOrSlug || currentFreelanceJob.value.slug === idOrSlug)
    ) {
      return
    }

    if (freelanceJobRequest) {
      return freelanceJobRequest
    }

    isLoadingFreelanceJobDetail.value = true
    freelanceJobDetailError.value = ''

    freelanceJobRequest = (async () => {
      try {
        const response = await freelancersService.getFreelanceJob(idOrSlug, authStore.authToken)
        currentFreelanceJob.value = response.data
      } catch (error) {
        freelanceJobDetailError.value = getDisplayErrorMessage(error, 'Unable to load this freelance job.')
      } finally {
        isLoadingFreelanceJobDetail.value = false
        freelanceJobRequest = null
      }
    })()

    return freelanceJobRequest
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
    isLoadingMoreFreelancers,
    isLoadingFreelanceJobs,
    isLoadingMoreFreelanceJobs,
    isLoadingFreelanceJobDetail,
    freelancersError,
    freelanceJobsError,
    freelanceJobDetailError,
    hasMoreFreelancerPages,
    hasMoreFreelanceJobPages,
    loadFreelancers,
    loadMoreFreelancers,
    createFreelancer,
    loadFreelanceJobs,
    loadMoreFreelanceJobs,
    createFreelanceJob,
    loadFreelanceJob,
    applyToCurrentFreelanceJob,
  }
})
