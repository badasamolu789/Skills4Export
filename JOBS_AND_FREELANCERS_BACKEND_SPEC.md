# Jobs And Freelancers Backend Spec

This document describes the backend endpoints needed to replace the current dummy/static Jobs and Freelancers frontend flows with live API data.

The frontend currently has these routes:

- `/jobs/feed` - public/authenticated jobs feed and search
- `/jobs/:slug` - job detail page
- `/jobs` - manage jobs posted by the user and jobs the user applied for
- `/jobs/alerts` - alert preferences for contests, sponsorships, scholarships, and job keywords
- `/freelancers` - freelancer marketplace with freelancer search, freelance jobs, freelancer registration, and freelance job posting

Use the existing API style in `api.json.md`: all routes should live under `/api`, return JSON, use bearer auth for protected user actions, and return either paginator payloads or `{ success, data }` wrappers.

## Shared Requirements

All list endpoints should support pagination:

```json
{
  "current_page": 1,
  "data": [],
  "first_page_url": "...",
  "from": 1,
  "last_page": 1,
  "last_page_url": "...",
  "links": [],
  "next_page_url": null,
  "path": "...",
  "per_page": 20,
  "prev_page_url": null,
  "to": 20,
  "total": 100
}
```

Common query params:

- `page`
- `per_page`
- `q` for free text search
- `sort`, for example `latest`, `oldest`, `most_applied`, `closing_soon`
- `status` where relevant

Common error format:

```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "Human readable message"
  }
}
```

## Jobs Flow

### Job Entity

The frontend needs these fields:

```ts
type Job = {
  id: string
  slug: string
  title: string
  companyName: string
  companyId?: string | null
  location: string
  workMode?: 'remote' | 'hybrid' | 'onsite'
  type: 'full-time' | 'part-time' | 'contract' | 'hybrid' | 'remote'
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string
  salaryLabel?: string
  experience: string
  skills: string[]
  description: string
  summary?: string
  responsibilities: string[]
  requirements: string[]
  perks: string[]
  applicationEmail?: string
  applicationUrl?: string
  applicationEndDate: string
  status: 'draft' | 'pending_review' | 'live' | 'closed' | 'archived'
  applicantCount: number
  hasApplied?: boolean
  createdByUserId: string
  createdAt: string
  updatedAt: string
}
```

### List Jobs

`GET /api/jobs`

Powers `/jobs/feed`.

Query params:

- `q`
- `location`
- `type`
- `skill`
- `experience`
- `workMode`
- `status=live` by default
- `sort=latest`
- `page`
- `per_page`

Response: paginator with `Job[]` at `data`.

### Get Job Detail

`GET /api/jobs/{idOrSlug}`

Powers `/jobs/:slug`.

Response:

```json
{
  "success": true,
  "data": {}
}
```

The `data` object should include the full `Job` fields, especially `summary`, `responsibilities`, `requirements`, and `perks`.

### Create Job

`POST /api/jobs`

Auth required.

Powers the `Post Job` modal on `/jobs/feed`.

Request:

```json
{
  "title": "Senior Software Engineer",
  "skills": ["JavaScript", "Vue", "Project management"],
  "location": "Remote",
  "type": "full-time",
  "senderEmail": "owner@example.com",
  "companyName": "Skills4Export",
  "description": "Describe the role...",
  "qualifications": "Qualifications and tasks...",
  "workExperience": "2-3",
  "minSalary": 250000,
  "maxSalary": null,
  "salaryCurrency": "NGN",
  "applicationEndDate": "2026-06-30"
}
```

Response: `201`

```json
{
  "success": true,
  "data": {}
}
```

The created job can initially be `pending_review` or `live`, depending on moderation policy.

### Update Job

`PATCH /api/jobs/{id}`

Auth required. Only creator/admin should update.

Used later for editing posted jobs from `/jobs`.

### Close Or Archive Job

`PATCH /api/jobs/{id}/status`

Auth required.

Request:

```json
{
  "status": "closed"
}
```

Valid statuses: `draft`, `pending_review`, `live`, `closed`, `archived`.

### Delete Job

`DELETE /api/jobs/{id}`

Auth required. Only creator/admin.

### My Posted Jobs

`GET /api/me/jobs/posted`

Auth required.

Powers the "Jobs Posted" tab on `/jobs`.

Query params:

- `q`
- `status`
- `page`
- `per_page`

Response items should include:

- job fields
- `applicantCount`
- `postedOn` can be derived from `createdAt` frontend-side

### Apply To Job

`POST /api/jobs/{id}/applications`

Auth required.

Powers the "Apply now" button on job details.

Request:

```json
{
  "coverLetter": "Optional text",
  "resumeMediaId": "optional-media-id",
  "answers": []
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "application-uuid",
    "jobId": "job-uuid",
    "userId": "user-uuid",
    "status": "submitted",
    "createdAt": "2026-05-06T12:00:00Z"
  }
}
```

Duplicate applications should return `409` with code `already_applied`.

### My Applied Jobs

`GET /api/me/jobs/applications`

Auth required.

Powers the "Jobs Applied For" tab on `/jobs`.

Response item:

```ts
type JobApplicationSummary = {
  id: string
  job: Job
  status: 'submitted' | 'reviewing' | 'shortlisted' | 'interview' | 'rejected' | 'accepted' | 'withdrawn'
  appliedAt: string
  updatedAt: string
}
```

### Job Applications For Posted Job

`GET /api/jobs/{id}/applications`

Auth required. Only job creator/admin.

Used for future applicant management.

### Update Application Status

`PATCH /api/jobs/{jobId}/applications/{applicationId}`

Auth required. Only job creator/admin.

Request:

```json
{
  "status": "interview"
}
```

### Withdraw Application

`DELETE /api/jobs/{jobId}/applications/{applicationId}`

Auth required. Applicant only.

Should set status to `withdrawn` rather than hard delete if audit history is needed.

## Job Alerts Flow

### Alert Preferences Entity

```ts
type AlertPreferences = {
  contestAlert: boolean
  sponsorshipAlert: boolean
  scholarshipType?: 'Academic Scholarship' | 'IT Tech Scholarship' | 'Artisan Skills Scholarship' | 'Soft skills Scholarship' | null
  jobAlert: boolean
  jobSearchTags: string[]
  createdAt: string
  updatedAt: string
}
```

### Get My Alert Preferences

`GET /api/me/alert-preferences`

Auth required.

Powers `/jobs/alerts` initial state.

### Update My Alert Preferences

`PUT /api/me/alert-preferences`

Auth required.

Request:

```json
{
  "contestAlert": true,
  "sponsorshipAlert": false,
  "scholarshipType": null,
  "jobAlert": true,
  "jobSearchTags": ["Product designer", "Frontend developer", "UI/UX"]
}
```

Backend validation:

- Max 10 `jobSearchTags`
- `scholarshipType` required only when `sponsorshipAlert=true`
- Tags should be unique case-insensitively

## Freelancers Flow

The `/freelancers` page has two tabs:

- Freelancers
- Freelance jobs

It also has two modals:

- Register as a Freelancer
- Post Freelancer Job

### Freelancer Profile Entity

This can be linked to the existing user profile, but it needs marketplace-specific fields.

```ts
type FreelancerProfile = {
  id: string
  userId: string
  name: string
  title: string
  skills: string[]
  location: string
  bio: string
  avatar?: string | null
  passportMediaId?: string | null
  status: 'draft' | 'pending_review' | 'available' | 'certified' | 'suspended'
  availability: 'available_now' | 'open' | 'busy' | 'unavailable'
  remoteOnly: boolean
  hourlyRateMin?: number | null
  hourlyRateMax?: number | null
  currency?: string
  rating?: number | null
  completedJobsCount?: number
  createdAt: string
  updatedAt: string
}
```

### List Freelancers

`GET /api/freelancers`

Powers the Freelancers tab.

Query params:

- `q`
- `skill`
- `location`
- `availability`
- `status`
- `remoteOnly`
- `sort`
- `page`
- `per_page`

Response: paginator with `FreelancerProfile[]` at `data`.

### Get Freelancer Profile

`GET /api/freelancers/{idOrUserId}`

Returns one freelancer profile. This can be used by public profile pages or a future freelancer detail page.

### Register As Freelancer

`POST /api/freelancers`

Auth required.

Powers "Register as a Freelancer".

Request:

```json
{
  "name": "Samuel Bada",
  "title": "Software Developer",
  "skills": ["Vue", "Node.js", "Product design"],
  "location": "Lagos",
  "bio": "Describe achievements, skills, and experience.",
  "passportMediaId": "optional-media-id",
  "availability": "available_now",
  "remoteOnly": false,
  "agreedToTerms": true
}
```

Response: `201`

```json
{
  "success": true,
  "data": {}
}
```

Recommended behavior:

- If no marketplace moderation is required, set `status=available`
- If review is required, set `status=pending_review`
- Duplicate registration should return `409` with code `freelancer_profile_exists`

### Update My Freelancer Profile

`PATCH /api/me/freelancer-profile`

Auth required.

Allows the user to update marketplace-specific freelancer fields.

### Get My Freelancer Profile

`GET /api/me/freelancer-profile`

Auth required.

Used to know if the current user is already registered as a freelancer and to prefill the registration modal.

### Upload Freelancer Passport

Use existing media flow if possible:

1. `GET /api/media/signature`
2. Upload directly to Cloudinary
3. `POST /api/media/register` with `kind=freelancer_passport`
4. Poll `GET /api/media/jobs/{id}`
5. Send returned media asset ID in `POST /api/freelancers`

Alternatively, add:

`POST /api/freelancers/passport-file`

Auth required. Multipart upload. Returns `{ success, data: { jobId } }`.

### Freelance Job Entity

Freelance jobs are project/contract opportunities shown under the Freelance jobs tab.

```ts
type FreelanceJob = {
  id: string
  slug: string
  title: string
  companyName: string
  postedByUserId: string
  location: string
  type: 'contract' | 'part-time' | 'project-based' | 'remote' | 'hybrid'
  skills: string[]
  description: string
  qualifications: string
  minFee?: number | null
  maxFee?: number | null
  currency?: string
  feeLabel?: string
  applicationEndDate: string
  status: 'pending_review' | 'live' | 'closed' | 'archived'
  applicantCount: number
  verified: boolean
  hasApplied?: boolean
  createdAt: string
  updatedAt: string
}
```

### List Freelance Jobs

`GET /api/freelance-jobs`

Powers the Freelance jobs tab.

Query params:

- `q`
- `skill`
- `location`
- `type`
- `status=live`
- `sort=latest`
- `page`
- `per_page`

Response: paginator with `FreelanceJob[]`.

### Create Freelance Job

`POST /api/freelance-jobs`

Auth required.

Powers "Post Freelancer Job".

Request:

```json
{
  "title": "Web App Development",
  "skills": ["JavaScript", "React", "Bootstrap"],
  "location": "Remote",
  "type": "project-based",
  "description": "I need a full-featured e-commerce web application.",
  "qualifications": "Frontend and backend experience required.",
  "minFee": 300000,
  "maxFee": 320000,
  "currency": "NGN",
  "companyName": "TradeBridge Labs",
  "applicationEndDate": "2026-06-30",
  "agreedToTerms": true
}
```

Response: `201`, `{ success: true, data: FreelanceJob }`.

### Get Freelance Job Detail

`GET /api/freelance-jobs/{idOrSlug}`

Useful for a future detail page.

### Apply To Freelance Job

`POST /api/freelance-jobs/{id}/applications`

Auth required.

Request:

```json
{
  "proposal": "I can deliver this in 3 weeks.",
  "bidAmount": 300000,
  "currency": "NGN",
  "attachmentMediaIds": []
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "application-uuid",
    "freelanceJobId": "job-uuid",
    "userId": "user-uuid",
    "status": "submitted",
    "createdAt": "2026-05-06T12:00:00Z"
  }
}
```

### My Freelance Jobs Posted

`GET /api/me/freelance-jobs/posted`

Auth required.

### My Freelance Job Applications

`GET /api/me/freelance-jobs/applications`

Auth required.

## Suggested Endpoint Summary

Jobs:

- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/jobs/{idOrSlug}`
- `PATCH /api/jobs/{id}`
- `PATCH /api/jobs/{id}/status`
- `DELETE /api/jobs/{id}`
- `GET /api/me/jobs/posted`
- `POST /api/jobs/{id}/applications`
- `GET /api/me/jobs/applications`
- `GET /api/jobs/{id}/applications`
- `PATCH /api/jobs/{jobId}/applications/{applicationId}`
- `DELETE /api/jobs/{jobId}/applications/{applicationId}`

Alerts:

- `GET /api/me/alert-preferences`
- `PUT /api/me/alert-preferences`

Freelancers:

- `GET /api/freelancers`
- `POST /api/freelancers`
- `GET /api/freelancers/{idOrUserId}`
- `GET /api/me/freelancer-profile`
- `PATCH /api/me/freelancer-profile`
- `POST /api/freelancers/passport-file` if not using the existing media flow

Freelance jobs:

- `GET /api/freelance-jobs`
- `POST /api/freelance-jobs`
- `GET /api/freelance-jobs/{idOrSlug}`
- `PATCH /api/freelance-jobs/{id}`
- `PATCH /api/freelance-jobs/{id}/status`
- `DELETE /api/freelance-jobs/{id}`
- `POST /api/freelance-jobs/{id}/applications`
- `GET /api/me/freelance-jobs/posted`
- `GET /api/me/freelance-jobs/applications`
- `GET /api/freelance-jobs/{id}/applications`
- `PATCH /api/freelance-jobs/{jobId}/applications/{applicationId}`

## Frontend Integration Notes

The current frontend still uses local dummy data for these flows. Once backend endpoints exist, create service modules such as:

- `src/services/jobs.ts`
- `src/services/freelancers.ts`

Then replace:

- `src/data/jobs.ts` usage in `JobFeedView.vue` and `JobDetailView.vue`
- static arrays in `JobsView.vue`
- static arrays in `FreelancersView.vue`
- local-only alert state in `CreateAlertView.vue`
- toast-only submit handlers in `PostJobModal.vue` and `FreelancersView.vue`

Important: endpoints used in widgets or optional sections should not block the full page if they fail. Use `Promise.allSettled` for pages that combine multiple sections.
