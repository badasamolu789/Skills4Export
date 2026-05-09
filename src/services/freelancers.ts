import { api } from '@/lib/api'
import type { ApiSuccessResponse, PaginatorPayload } from '@/services/posts'

export type FreelancerRecord = {
  id: string
  userId: string
  name: string
  title: string
  skills: string[]
  location?: string | null
  bio?: string | null
  avatar?: string | null
  passportMediaId?: string | null
  status: 'draft' | 'pending_review' | 'available' | 'certified' | 'suspended' | string
  availability: 'available_now' | 'open' | 'busy' | 'unavailable' | string
  remoteOnly: boolean
  hourlyRateMin?: number | null
  hourlyRateMax?: number | null
  currency?: string | null
  rating?: number | null
  completedJobsCount: number
  createdAt?: string
  updatedAt?: string
}

export type FreelanceJobRecord = {
  id: string
  slug?: string
  title: string
  companyName: string
  postedByUserId: string
  location?: string | null
  type: 'contract' | 'part-time' | 'project-based' | 'remote' | 'hybrid' | string
  skills: string[]
  description?: string | null
  qualifications?: string | null
  minFee?: number | null
  maxFee?: number | null
  currency?: string | null
  feeLabel?: string | null
  applicationEndDate?: string | null
  status: 'pending_review' | 'live' | 'closed' | 'archived' | string
  applicantCount: number
  verified: boolean
  hasApplied?: boolean | null
  createdAt?: string
  updatedAt?: string
}

export type FreelanceApplicationRecord = {
  id: string
  freelanceJobId: string
  userId: string
  freelanceJob?: FreelanceJobRecord | null
  proposal?: string | null
  bidAmount?: number | null
  currency?: string | null
  attachmentMediaIds?: string[]
  status?: string
  createdAt?: string
  appliedAt?: string
  updatedAt?: string
}

export type FreelancerListParams = {
  page?: number
  per_page?: number
  q?: string
  status?: string
  sort?: string
  skill?: string
  location?: string
  availability?: string
  remoteOnly?: boolean
}

export type FreelanceJobListParams = {
  page?: number
  per_page?: number
  q?: string
  status?: string
  sort?: string
  skill?: string
  location?: string
  type?: string
}

export type FreelancerRequestOptions = {
  suppressErrorModal?: boolean
}

export type CreateFreelancerRequest = {
  name: string
  title: string
  skills: string[]
  location: string
  bio: string
  passportMediaId?: string
  availability: 'available_now' | 'open' | 'busy' | 'unavailable' | string
  remoteOnly?: boolean
  agreedToTerms: boolean
}

export type CreateFreelanceJobRequest = {
  title: string
  skills: string[]
  location: string
  type: 'contract' | 'part-time' | 'project-based' | 'remote' | 'hybrid' | string
  description: string
  qualifications: string
  minFee?: number
  maxFee?: number
  currency?: string
  companyName: string
  applicationEndDate: string
  agreedToTerms: boolean
}

export type ApplyToFreelanceJobRequest = {
  proposal?: string
  bidAmount?: number
  currency?: string
  attachmentMediaIds?: string[]
}

const withQuery = (path: string, params: Record<string, unknown> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    query.set(key, String(value))
  })

  const value = query.toString()
  return value ? `${path}?${value}` : path
}

const FREELANCER_ROUTES = {
  freelancers: '/freelancers',
  freelancerByIdOrUserId: (idOrUserId: string) => `/freelancers/${idOrUserId}`,
  myFreelancerProfile: '/me/freelancer-profile',
  freelanceJobs: '/freelance-jobs',
  freelanceJobByIdOrSlug: (idOrSlug: string) => `/freelance-jobs/${idOrSlug}`,
  freelanceJobStatus: (id: string) => `/freelance-jobs/${id}/status`,
  freelanceJobApplications: (id: string) => `/freelance-jobs/${id}/applications`,
  freelanceJobApplication: (jobId: string, applicationId: string) =>
    `/freelance-jobs/${jobId}/applications/${applicationId}`,
  myPostedFreelanceJobs: '/me/freelance-jobs/posted',
  myFreelanceApplications: '/me/freelance-jobs/applications',
} as const

export const freelancersService = {
  listFreelancers(params: FreelancerListParams = {}, token?: string | null, options: FreelancerRequestOptions = {}) {
    return api.get<PaginatorPayload<FreelancerRecord>>(
      withQuery(FREELANCER_ROUTES.freelancers, params),
      { token, ...options },
    )
  },

  createFreelancer(payload: CreateFreelancerRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<FreelancerRecord>>(FREELANCER_ROUTES.freelancers, payload, { token })
  },

  getFreelancer(idOrUserId: string, token?: string | null) {
    return api.get<ApiSuccessResponse<FreelancerRecord>>(
      FREELANCER_ROUTES.freelancerByIdOrUserId(idOrUserId),
      { token },
    )
  },

  getMyFreelancerProfile(token?: string | null) {
    return api.get<ApiSuccessResponse<FreelancerRecord>>(FREELANCER_ROUTES.myFreelancerProfile, { token })
  },

  updateMyFreelancerProfile(payload: Partial<CreateFreelancerRequest>, token?: string | null) {
    return api.patch<ApiSuccessResponse<FreelancerRecord>>(
      FREELANCER_ROUTES.myFreelancerProfile,
      payload,
      { token },
    )
  },

  listFreelanceJobs(params: FreelanceJobListParams = {}, token?: string | null, options: FreelancerRequestOptions = {}) {
    return api.get<PaginatorPayload<FreelanceJobRecord>>(
      withQuery(FREELANCER_ROUTES.freelanceJobs, params),
      { token, ...options },
    )
  },

  createFreelanceJob(payload: CreateFreelanceJobRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<FreelanceJobRecord>>(FREELANCER_ROUTES.freelanceJobs, payload, { token })
  },

  getFreelanceJob(idOrSlug: string, token?: string | null) {
    return api.get<ApiSuccessResponse<FreelanceJobRecord>>(
      FREELANCER_ROUTES.freelanceJobByIdOrSlug(idOrSlug),
      { token },
    )
  },

  updateFreelanceJob(id: string, payload: Partial<CreateFreelanceJobRequest>, token?: string | null) {
    return api.patch<ApiSuccessResponse<FreelanceJobRecord>>(
      FREELANCER_ROUTES.freelanceJobByIdOrSlug(id),
      payload,
      { token },
    )
  },

  deleteFreelanceJob(id: string, token?: string | null) {
    return api.delete<ApiSuccessResponse<{ deleted?: boolean }>>(
      FREELANCER_ROUTES.freelanceJobByIdOrSlug(id),
      { token },
    )
  },

  updateFreelanceJobStatus(id: string, status: string, token?: string | null) {
    return api.patch<ApiSuccessResponse<FreelanceJobRecord>>(
      FREELANCER_ROUTES.freelanceJobStatus(id),
      { status },
      { token },
    )
  },

  applyToFreelanceJob(id: string, payload: ApplyToFreelanceJobRequest = {}, token?: string | null) {
    return api.post<ApiSuccessResponse<FreelanceApplicationRecord>>(
      FREELANCER_ROUTES.freelanceJobApplications(id),
      payload,
      { token },
    )
  },

  listFreelanceJobApplications(id: string, params: FreelanceJobListParams = {}, token?: string | null) {
    return api.get<PaginatorPayload<FreelanceApplicationRecord>>(
      withQuery(FREELANCER_ROUTES.freelanceJobApplications(id), params),
      { token },
    )
  },

  listMyFreelanceJobs(params: FreelanceJobListParams = {}, token?: string | null) {
    return api.get<PaginatorPayload<FreelanceJobRecord>>(
      withQuery(FREELANCER_ROUTES.myPostedFreelanceJobs, params),
      { token },
    )
  },

  listMyFreelanceApplications(params: FreelanceJobListParams = {}, token?: string | null) {
    return api.get<PaginatorPayload<FreelanceApplicationRecord>>(
      withQuery(FREELANCER_ROUTES.myFreelanceApplications, params),
      { token },
    )
  },

  updateFreelanceApplication(
    jobId: string,
    applicationId: string,
    payload: { status?: string },
    token?: string | null,
  ) {
    return api.patch<ApiSuccessResponse<FreelanceApplicationRecord>>(
      FREELANCER_ROUTES.freelanceJobApplication(jobId, applicationId),
      payload,
      { token },
    )
  },
}
