import { api } from '@/lib/api'
import type { ApiSuccessResponse, PaginatorPayload } from '@/services/posts'

export type JobRecord = {
  id: string
  slug?: string
  title: string
  companyName: string
  companyId?: string | null
  location?: string | null
  workMode?: 'remote' | 'hybrid' | 'onsite' | null
  type?: 'full-time' | 'part-time' | 'contract' | 'hybrid' | 'remote' | string
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  salaryLabel?: string | null
  experience?: string | null
  skills?: string[]
  description?: string | null
  summary?: string | null
  responsibilities?: string[]
  requirements?: string[]
  perks?: string[]
  applicationEmail?: string | null
  applicationUrl?: string | null
  applicationEndDate?: string | null
  status?: 'draft' | 'pending_review' | 'live' | 'closed' | 'archived' | string
  applicantCount?: number
  hasApplied?: boolean | null
  createdAt?: string
  updatedAt?: string
}

export type JobApplicationRecord = {
  id: string
  jobId: string
  userId: string
  job?: JobRecord | null
  coverLetter?: string | null
  resumeMediaId?: string | null
  answers?: unknown[]
  status?: 'submitted' | 'reviewing' | 'shortlisted' | 'interview' | 'rejected' | 'accepted' | 'withdrawn' | string
  createdAt?: string
  appliedAt?: string
  updatedAt?: string
}

export type JobListParams = {
  page?: number
  per_page?: number
  q?: string
  status?: string
  sort?: string
  location?: string
  type?: string
  skill?: string
  experience?: string
  workMode?: string
}

export type JobRequestOptions = {
  suppressErrorModal?: boolean
}

export type CreateJobRequest = {
  title: string
  skills?: string[] | string
  location?: string
  type?: string
  workMode?: string
  senderEmail?: string
  companyName: string
  company?: string
  description: string
  qualifications?: string
  tasks?: string
  workExperience?: string
  minSalary?: number
  maxSalary?: number | null
  salaryCurrency?: string
  applicationEndDate?: string
}

export type UpdateJobRequest = Partial<CreateJobRequest>

export type UpdateJobStatusRequest = {
  status: 'draft' | 'pending_review' | 'live' | 'closed' | 'archived' | string
}

export type ApplyToJobRequest = {
  coverLetter?: string
  resumeMediaId?: string
  answers?: unknown[]
}

export type UpdateJobApplicationRequest = {
  status?: string
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

const JOB_ROUTES = {
  jobs: '/jobs',
  jobByIdOrSlug: (idOrSlug: string) => `/jobs/${idOrSlug}`,
  jobStatus: (id: string) => `/jobs/${id}/status`,
  jobApplications: (id: string) => `/jobs/${id}/applications`,
  jobApplication: (jobId: string, applicationId: string) =>
    `/jobs/${jobId}/applications/${applicationId}`,
  myPostedJobs: '/me/jobs/posted',
  myApplications: '/me/jobs/applications',
} as const

export const jobsService = {
  listJobs(params: JobListParams = {}, token?: string | null, options: JobRequestOptions = {}) {
    return api.get<PaginatorPayload<JobRecord>>(withQuery(JOB_ROUTES.jobs, params), {
      token,
      ...options,
    })
  },

  createJob(payload: CreateJobRequest, token?: string | null) {
    return api.post<ApiSuccessResponse<JobRecord>>(JOB_ROUTES.jobs, payload, { token })
  },

  getJob(idOrSlug: string, token?: string | null) {
    return api.get<ApiSuccessResponse<JobRecord>>(JOB_ROUTES.jobByIdOrSlug(idOrSlug), { token })
  },

  updateJob(id: string, payload: UpdateJobRequest, token?: string | null) {
    return api.patch<ApiSuccessResponse<JobRecord>>(JOB_ROUTES.jobByIdOrSlug(id), payload, { token })
  },

  deleteJob(id: string, token?: string | null) {
    return api.delete<ApiSuccessResponse<{ deleted?: boolean }>>(JOB_ROUTES.jobByIdOrSlug(id), { token })
  },

  updateJobStatus(id: string, payload: UpdateJobStatusRequest, token?: string | null) {
    return api.patch<ApiSuccessResponse<JobRecord>>(JOB_ROUTES.jobStatus(id), payload, { token })
  },

  applyToJob(id: string, payload: ApplyToJobRequest = {}, token?: string | null) {
    return api.post<ApiSuccessResponse<JobApplicationRecord>>(JOB_ROUTES.jobApplications(id), payload, { token })
  },

  listJobApplications(id: string, params: JobListParams = {}, token?: string | null) {
    return api.get<PaginatorPayload<JobApplicationRecord>>(
      withQuery(JOB_ROUTES.jobApplications(id), params),
      { token },
    )
  },

  listMyPostedJobs(params: JobListParams = {}, token?: string | null) {
    return api.get<PaginatorPayload<JobRecord>>(withQuery(JOB_ROUTES.myPostedJobs, params), { token })
  },

  listMyJobApplications(params: JobListParams = {}, token?: string | null) {
    return api.get<PaginatorPayload<JobApplicationRecord>>(
      withQuery(JOB_ROUTES.myApplications, params),
      { token },
    )
  },

  updateJobApplication(
    jobId: string,
    applicationId: string,
    payload: UpdateJobApplicationRequest,
    token?: string | null,
  ) {
    return api.patch<ApiSuccessResponse<JobApplicationRecord>>(
      JOB_ROUTES.jobApplication(jobId, applicationId),
      payload,
      { token },
    )
  },

  withdrawJobApplication(jobId: string, applicationId: string, token?: string | null) {
    return api.delete<ApiSuccessResponse<{ removed?: boolean }>>(
      JOB_ROUTES.jobApplication(jobId, applicationId),
      { token },
    )
  },
}
