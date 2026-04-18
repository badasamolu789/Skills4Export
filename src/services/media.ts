import { api } from '@/lib/api'

// ============================================================================
// Types
// ============================================================================

export type MediaRegisterRequest = {
    publicId: string
    kind?: string
    replace?: boolean
    pageId?: string | null
}

export type MediaRegisterResponse = {
    success: boolean
    data: {
        jobId: string
    }
}

export type MediaJobStatus = {
    id: string
    name: string
    state: 'pending' | 'active' | 'completed' | 'failed'
    attemptsMade: number
    failedReason: string | null
    friendlyMessage: string | null
    returnvalue: unknown | null
    data: Record<string, unknown> | null
}

export type MediaJobStatusResponse = {
    success: boolean
    data: MediaJobStatus
}

export type CloudinarySignatureResponse = {
    success: boolean
    data: Record<string, unknown>
}

export type UploadAvatarFileResponse = {
    success: boolean
    data: {
        jobId: string
    }
}

// ============================================================================
// Media Service
// ============================================================================

export const mediaService = {
    /**
     * Get Cloudinary upload signature and credentials for direct client upload
     *
     * @param token - Optional authorization token
     * @returns Promise with Cloudinary upload credentials
     */
    getCloudinarySignature: async (token?: string | null) => {
        return api.get<CloudinarySignatureResponse>('/media/signature', { token })
    },
    /**
     * Register a direct client upload (Cloudinary public id) so the server can validate,
     * create an asset record and enqueue processing.
     *
     * Recommended flow: upload media first (or perform direct client upload), then call
     * this endpoint with the provider public id. Server-side validation performed:
     * allowed MIME types (image/jpeg, image/png, image/webp), max file size (enforced
     * by the media worker), and optional checks per `kind` (e.g., avatar/banner uniqueness).
     *
     * @param request - The media registration request
     * @param token - Optional authorization token
     * @returns Promise with job ID for tracking processing status
     */
    registerMedia: async (request: MediaRegisterRequest, token?: string | null) => {
        return api.post<MediaRegisterResponse>('/media/register', request, { token })
    },

    /**
     * Get status for a media processing job
     *
     * @param jobId - The ID of the media job to check
     * @param token - Optional authorization token
     * @returns Promise with job status and details
     */
    getMediaJobStatus: async (jobId: string, token?: string | null) => {
        return api.get<MediaJobStatusResponse>(`/media/jobs/${jobId}`, { token })
    },

    /**
     * Upload avatar file (multipart) - server accepts file and enqueues background
     * validation and Cloudinary upload. Use kind=banner to upload a banner.
     * If image already exists, pass ?replace=true or clear it first using
     * PUT /users/:id/profile with { avatar: null } or { banner: null }.
     *
     * @param userId - The user ID to upload avatar for
     * @param file - The file to upload
     * @param kind - Optional kind ('avatar' or 'banner')
     * @param replace - Optional boolean to replace existing file
     * @param token - Optional authorization token
     * @returns Promise with job ID
     */
    uploadAvatarFile: async (
        userId: string,
        file: File,
        options?: {
            kind?: 'avatar' | 'banner'
            replace?: boolean
            token?: string | null
        },
    ) => {
        const formData = new FormData()
        formData.append('file', file)

        const kind = options?.kind === 'banner' ? 'banner' : 'avatar'
        const queryParams = new URLSearchParams()
        if (options?.replace) {
            queryParams.append('replace', 'true')
        }

        // Use correct endpoint per OpenAPI spec:
        // - avatar: /api/users/{id}/profile/avatar-file
        // - banner: /api/users/{id}/profile/banner (accepts multipart file)
        const endpoint = kind === 'avatar'
            ? `users/${userId}/profile/avatar-file`
            : `users/${userId}/profile/banner`

        const fullEndpoint = queryParams.toString()
            ? `${endpoint}?${queryParams.toString()}`
            : endpoint

        return api.post<UploadAvatarFileResponse>(
            fullEndpoint,
            formData,
            {
                token: options?.token,
            },
        )
    },
}
