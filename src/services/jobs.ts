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
  createdByUserId?: string | null
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
  retry?: boolean
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

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? value as Record<string, unknown> : {}

const readString = (...values: unknown[]) => {
  const value = values.find((item) => typeof item === 'string' && item.trim())
  return typeof value === 'string' ? value : undefined
}

const readNullableString = (...values: unknown[]) => {
  const value = readString(...values)
  return value ?? null
}

const readNumber = (...values: unknown[]) => {
  const value = values.find((item) => {
    if (typeof item === 'number') {
      return Number.isFinite(item)
    }

    if (typeof item === 'string' && item.trim()) {
      return Number.isFinite(Number(item))
    }

    return false
  })

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    return Number(value)
  }

  return null
}

const readBoolean = (...values: unknown[]) => {
  const value = values.find((item) => typeof item === 'boolean')
  return typeof value === 'boolean' ? value : null
}

const readStringList = (...values: unknown[]) => {
  const value = values.find((item) => Array.isArray(item) || typeof item === 'string')

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim()
        }

        const record = asRecord(item)
        return readString(record.name, record.title, record.skill, record.label)?.trim() || ''
      })
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

const isCompleteUuid = (value?: string | null) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))

const readJobId = (...values: unknown[]) => {
  const candidates = values.filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  )
  return candidates.find((value) => isCompleteUuid(value)) ?? candidates[0] ?? ''
}

const normalizeJob = (job: JobRecord | unknown): JobRecord => {
  const record = asRecord(job)
  const company = asRecord(record.company)

  return {
    ...(record as JobRecord),
    id: readJobId(record.id, record.jobId, record.job_id, record.uuid),
    slug: readString(record.slug),
    title: readString(record.title) || 'Untitled job',
    companyName: readString(record.companyName, record.company_name, company.name, record.company) || 'Company not listed',
    companyId: readNullableString(record.companyId, record.company_id, company.id),
    location: readNullableString(record.location),
    workMode: readNullableString(record.workMode, record.work_mode) as JobRecord['workMode'],
    type: readString(record.type, record.jobType, record.job_type),
    salaryMin: readNumber(record.salaryMin, record.salary_min, record.minSalary, record.min_salary),
    salaryMax: readNumber(record.salaryMax, record.salary_max, record.maxSalary, record.max_salary),
    salaryCurrency: readNullableString(record.salaryCurrency, record.salary_currency),
    salaryLabel: readNullableString(record.salaryLabel, record.salary_label),
    experience: readNullableString(record.experience, record.workExperience, record.work_experience),
    skills: readStringList(record.skills),
    description: readNullableString(record.description),
    summary: readNullableString(record.summary),
    responsibilities: readStringList(record.responsibilities, record.tasks),
    requirements: readStringList(record.requirements, record.qualifications),
    perks: readStringList(record.perks),
    applicationEmail: readNullableString(record.applicationEmail, record.application_email, record.senderEmail, record.sender_email),
    applicationUrl: readNullableString(record.applicationUrl, record.application_url),
    applicationEndDate: readNullableString(record.applicationEndDate, record.application_end_date),
    status: readString(record.status),
    applicantCount: readNumber(record.applicantCount, record.applicant_count, record.applicationsCount, record.applications_count) || 0,
    hasApplied: readBoolean(record.hasApplied, record.has_applied),
    createdByUserId: readNullableString(record.createdByUserId, record.created_by_user_id, record.userId, record.user_id),
    createdAt: readString(record.createdAt, record.created_at),
    updatedAt: readString(record.updatedAt, record.updated_at),
  }
}

const normalizePaginator = <T>(response: PaginatorPayload<T>, normalize: (item: unknown) => T): PaginatorPayload<T> => ({
  ...response,
  data: Array.isArray(response.data) ? response.data.map((item) => normalize(item)) : [],
})

const normalizeSuccess = <T>(response: ApiSuccessResponse<T>, normalize: (item: unknown) => T): ApiSuccessResponse<T> => ({
  ...response,
  data: normalize(response.data),
})

const normalizeJobApplication = (application: JobApplicationRecord | unknown): JobApplicationRecord => {
  const record = asRecord(application)

  return {
    ...(record as JobApplicationRecord),
    id: readString(record.id, record.uuid) || '',
    jobId: readString(record.jobId, record.job_id) || '',
    userId: readString(record.userId, record.user_id) || '',
    job: record.job ? normalizeJob(record.job) : null,
    coverLetter: readNullableString(record.coverLetter, record.cover_letter),
    resumeMediaId: readNullableString(record.resumeMediaId, record.resume_media_id),
    answers: Array.isArray(record.answers) ? record.answers : [],
    status: readString(record.status),
    createdAt: readString(record.createdAt, record.created_at),
    appliedAt: readString(record.appliedAt, record.applied_at),
    updatedAt: readString(record.updatedAt, record.updated_at),
  }
}

export const jobsService = {
  async listJobs(params: JobListParams = {}, token?: string | null, options: JobRequestOptions = {}) {
    const response = await api.get<PaginatorPayload<JobRecord>>(withQuery(JOB_ROUTES.jobs, params), {
      token,
      ...options,
    })

    return normalizePaginator(response, normalizeJob)
  },

  async createJob(payload: CreateJobRequest, token?: string | null) {
    const response = await api.post<ApiSuccessResponse<JobRecord>>(JOB_ROUTES.jobs, payload, { token })
    return normalizeSuccess(response, normalizeJob)
  },

  async getJob(idOrSlug: string, token?: string | null) {
    const response = await api.get<ApiSuccessResponse<JobRecord>>(JOB_ROUTES.jobByIdOrSlug(idOrSlug), { token })
    return normalizeSuccess(response, normalizeJob)
  },

  async updateJob(id: string, payload: UpdateJobRequest, token?: string | null) {
    const response = await api.patch<ApiSuccessResponse<JobRecord>>(JOB_ROUTES.jobByIdOrSlug(id), payload, { token })
    return normalizeSuccess(response, normalizeJob)
  },

  deleteJob(id: string, token?: string | null) {
    return api.delete<ApiSuccessResponse<{ deleted?: boolean }>>(JOB_ROUTES.jobByIdOrSlug(id), { token })
  },

  async updateJobStatus(id: string, payload: UpdateJobStatusRequest, token?: string | null) {
    const response = await api.patch<ApiSuccessResponse<JobRecord>>(JOB_ROUTES.jobStatus(id), payload, { token })
    return normalizeSuccess(response, normalizeJob)
  },

  async applyToJob(
    id: string,
    payload: ApplyToJobRequest = {},
    token?: string | null,
    options: JobRequestOptions = {},
  ) {
    const response = await api.post<ApiSuccessResponse<JobApplicationRecord>>(
      JOB_ROUTES.jobApplications(id),
      payload,
      { token, ...options },
    )
    return normalizeSuccess(response, normalizeJobApplication)
  },

  async listJobApplications(id: string, params: JobListParams = {}, token?: string | null) {
    const response = await api.get<PaginatorPayload<JobApplicationRecord>>(
      withQuery(JOB_ROUTES.jobApplications(id), params),
      { token },
    )

    return normalizePaginator(response, normalizeJobApplication)
  },

  async listMyPostedJobs(params: JobListParams = {}, token?: string | null) {
    const response = await api.get<PaginatorPayload<JobRecord>>(withQuery(JOB_ROUTES.myPostedJobs, params), { token })
    return normalizePaginator(response, normalizeJob)
  },

  async listMyJobApplications(params: JobListParams = {}, token?: string | null) {
    const response = await api.get<PaginatorPayload<JobApplicationRecord>>(
      withQuery(JOB_ROUTES.myApplications, params),
      { token },
    )

    return normalizePaginator(response, normalizeJobApplication)
  },

  async updateJobApplication(
    jobId: string,
    applicationId: string,
    payload: UpdateJobApplicationRequest,
    token?: string | null,
  ) {
    const response = await api.patch<ApiSuccessResponse<JobApplicationRecord>>(
      JOB_ROUTES.jobApplication(jobId, applicationId),
      payload,
      { token },
    )

    return normalizeSuccess(response, normalizeJobApplication)
  },

  withdrawJobApplication(jobId: string, applicationId: string, token?: string | null) {
    return api.delete<ApiSuccessResponse<{ removed?: boolean }>>(
      JOB_ROUTES.jobApplication(jobId, applicationId),
      { token },
    )
  },
}
