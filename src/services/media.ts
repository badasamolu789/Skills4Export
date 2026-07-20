import { api } from '@/lib/api'
import { optimizeImageFile } from '@/utils/imageOptimization'

// ============================================================================
// Types
// ============================================================================

export type MediaRegisterRequest = {
    publicId: string
    title?: string
    externalUrl?: string
    kind?: string
    replace?: boolean
    pageId?: string | null
    userId?: string | null
}

export type MediaRegisterResponse = {
    success: boolean
    data: {
        jobId: string
    }
}

export type MediaUploadFileResponse = {
    success: boolean
    message?: string
    data: {
        assetId?: string
        id?: string
        url?: string
        publicId?: string
        kind?: string
        title?: string | null
        mimeType?: string | null
        sizeBytes?: number | null
        asset?: Record<string, unknown>
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
    returnValue?: unknown | null
    return_value?: unknown | null
    data: Record<string, unknown> | null
    result?: unknown | null
}

export type MediaJobStatusResponse = {
    success: boolean
    data: MediaJobStatus
}

export type CloudinarySignatureResponse = {
    success: boolean
    data: Record<string, unknown>
}

export type CloudinaryUploadResponse = {
    public_id?: string
    secure_url?: string
    resource_type?: string
    [key: string]: unknown
}

export type UploadAvatarFileResponse = {
    success: boolean
    message?: string
    data: {
        jobId?: string
        assetId?: string
        id?: string
        url?: string
        publicId?: string
        kind?: string
        title?: string | null
        mimeType?: string | null
        sizeBytes?: number | null
        avatar?: string | null
        banner?: string | null
        profile?: Record<string, unknown> | null
    }
}

export type ProfileFileKind = 'avatar' | 'banner' | 'advert_image'

const getStringValue = (source: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
        const value = source[key]

        if (typeof value === 'string' && value.trim()) {
            return value
        }

        if (typeof value === 'number') {
            return String(value)
        }
    }

    return ''
}

const getRecordValue = (source: Record<string, unknown>, keys: string[]) => {
    for (const key of keys) {
        const value = source[key]

        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return value as Record<string, unknown>
        }
    }

    return null
}

const normalizeCloudinaryFieldName = (key: string) => {
    const fieldMap: Record<string, string> = {
        apiKey: 'api_key',
        cloudName: 'cloud_name',
        uploadPreset: 'upload_preset',
        publicId: 'public_id',
        folderName: 'folder',
        eagerAsync: 'eager_async',
        resourceType: 'resource_type',
    }

    return fieldMap[key] ?? key
}

const appendCloudinaryFields = (formData: FormData, fields: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(fields)) {
        const fieldName = normalizeCloudinaryFieldName(key)

        if (
            value === undefined ||
            value === null ||
            fieldName === 'cloud_name' ||
            fieldName === 'uploadUrl' ||
            fieldName === 'upload_url' ||
            fieldName === 'url' ||
            fieldName === 'params' ||
            fieldName === 'parameters'
        ) {
            continue
        }

        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            formData.append(fieldName, String(value))
        }
    }
}

const extractMediaAssetId = (value: unknown): string | null => {
    if (!value) {
        return null
    }

    if (typeof value === 'string') {
        return value
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const id = extractMediaAssetId(item)
            if (id) {
                return id
            }
        }

        return null
    }

    if (typeof value !== 'object') {
        return null
    }

    const record = value as Record<string, unknown>
    const directId = getStringValue(record, [
        'mediaAssetId',
        'mediaAssetID',
        'media_asset_id',
        'assetId',
        'assetID',
        'asset_id',
        'mediaId',
        'mediaID',
        'media_id',
        'uuid',
        '_id',
        'id',
    ])

    if (directId) {
        return directId
    }

    const pluralId = extractMediaAssetId(record.mediaAssetIds ?? record.media_asset_ids ?? record.assetIds ?? record.asset_ids)
    if (pluralId) {
        return pluralId
    }

    for (const key of [
        'asset',
        'assets',
        'mediaAsset',
        'mediaAssets',
        'media_asset',
        'media_assets',
        'media',
        'data',
        'result',
        'returnValue',
        'returnvalue',
        'return_value',
    ]) {
        const nestedId = extractMediaAssetId(record[key])
        if (nestedId) {
            return nestedId
        }
    }

    return null
}

const extractMediaUrl = (value: unknown): string | null => {
    if (!value) {
        return null
    }

    if (typeof value === 'string') {
        return /^https?:\/\//.test(value) ? value : null
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const url = extractMediaUrl(item)
            if (url) {
                return url
            }
        }

        return null
    }

    if (typeof value !== 'object') {
        return null
    }

    const record = value as Record<string, unknown>
    const directUrl = getStringValue(record, [
        'secure_url',
        'secureUrl',
        'url',
        'mediaUrl',
        'media_url',
        'avatar',
        'banner',
        'thumbnail_url',
        'thumbnailUrl',
    ])

    if (directUrl && /^https?:\/\//.test(directUrl)) {
        return directUrl
    }

    for (const key of [
        'asset',
        'assets',
        'mediaAsset',
        'mediaAssets',
        'media_asset',
        'media_assets',
        'media',
        'profile',
        'data',
        'result',
        'returnValue',
        'returnvalue',
        'return_value',
    ]) {
        const nestedUrl = extractMediaUrl(record[key])
        if (nestedUrl) {
            return nestedUrl
        }
    }

    return null
}

export const getProcessedMediaAssetId = (job: MediaJobStatus) => {
    return (
        extractMediaAssetId(job.returnvalue) ??
        extractMediaAssetId(job.returnValue) ??
        extractMediaAssetId(job.return_value) ??
        extractMediaAssetId(job.result) ??
        extractMediaAssetId(job.data)
    )
}

export const getProcessedMediaUrl = (job: MediaJobStatus) => {
    return (
        extractMediaUrl(job.returnvalue) ??
        extractMediaUrl(job.returnValue) ??
        extractMediaUrl(job.return_value) ??
        extractMediaUrl(job.result) ??
        extractMediaUrl(job.data)
    )
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
     * Upload a file through the backend. This is the API-documented upload path
     * for post/advert media when the browser should not upload directly to Cloudinary.
     *
     * @param file - The file to upload
     * @param options.kind - Optional media kind, e.g. post_image or advert_image
     * @param options.title - Optional display title for the media
     * @param options.token - Optional authorization token
     * @returns Promise with a persisted asset ID and URL
     */
    uploadMediaFile: async (
        file: File,
        options?: {
            kind?: string
            title?: string
            token?: string | null
            timeoutMs?: number
        },
    ) => {
        const uploadFile = file.type.startsWith('image/')
            ? (await optimizeImageFile(file)).file
            : file
        const formData = new FormData()
        formData.append('file', uploadFile)

        if (options?.kind) {
            formData.append('kind', options.kind)
        }

        if (options?.title) {
            formData.append('title', options.title)
        }

        return api.post<MediaUploadFileResponse>('/media/upload', formData, {
            token: options?.token,
            retry: false,
            timeoutMs: options?.timeoutMs ?? 180000,
        })
    },

    uploadCloudinaryFile: async (
        file: File,
        signatureData: Record<string, unknown>,
    ): Promise<CloudinaryUploadResponse> => {
        const params = getRecordValue(signatureData, ['params', 'parameters']) ?? signatureData
        const uploadUrl =
            getStringValue(signatureData, ['uploadUrl', 'upload_url', 'url']) ||
            getStringValue(params, ['uploadUrl', 'upload_url', 'url'])
        const cloudName =
            getStringValue(signatureData, ['cloudName', 'cloud_name']) ||
            getStringValue(params, ['cloudName', 'cloud_name'])
        const resourceType = file.type.startsWith('video/') ? 'video' : 'image'
        const endpoint = uploadUrl || `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`

        if (!uploadUrl && !cloudName) {
            throw new Error('Cloudinary upload details are missing. Please try again.')
        }

        const formData = new FormData()
        formData.append('file', file)
        appendCloudinaryFields(formData, params)

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        })

        const payload = await response.json()

        if (!response.ok) {
            const message =
                payload?.error?.message ||
                payload?.message ||
                'Media upload failed. Please try again.'
            throw new Error(message)
        }

        return payload as CloudinaryUploadResponse
    },

    waitForProcessedMediaAsset: async (
        jobId: string,
        options?: {
            token?: string | null
            attempts?: number
            intervalMs?: number
        },
    ) => {
        const attempts = options?.attempts ?? 30
        const intervalMs = options?.intervalMs ?? 1000

        for (let attempt = 0; attempt < attempts; attempt++) {
            if (attempt > 0) {
                await new Promise((resolve) => setTimeout(resolve, intervalMs))
            }

            const response = await mediaService.getMediaJobStatus(jobId, options?.token)
            const job = response.data

            if (job.state === 'failed') {
                throw new Error(job.friendlyMessage || job.failedReason || 'Media processing failed.')
            }

            if (job.state === 'completed') {
                const assetId = getProcessedMediaAssetId(job)

                if (!assetId) {
                    if (import.meta.env.DEV) {
                        console.info('[media] completed job without extractable asset id', job)
                    }

                    throw new Error('Media processing completed without an asset ID.')
                }

                return assetId
            }
        }

        throw new Error('Your media is still processing. Please try posting again in a moment.')
    },

    waitForProcessedMediaResult: async (
        jobId: string,
        options?: {
            token?: string | null
            attempts?: number
            intervalMs?: number
        },
    ) => {
        const attempts = options?.attempts ?? 30
        const intervalMs = options?.intervalMs ?? 1000

        for (let attempt = 0; attempt < attempts; attempt++) {
            if (attempt > 0) {
                await new Promise((resolve) => setTimeout(resolve, intervalMs))
            }

            const response = await mediaService.getMediaJobStatus(jobId, options?.token)
            const job = response.data

            if (job.state === 'failed') {
                throw new Error(job.friendlyMessage || job.failedReason || 'Media processing failed.')
            }

            if (job.state === 'completed') {
                return {
                    assetId: getProcessedMediaAssetId(job),
                    url: getProcessedMediaUrl(job),
                    job,
                }
            }
        }

        throw new Error('Your media is still processing. Please try again in a moment.')
    },

    /**
     * Upload avatar or banner file (multipart) through the backend to the
     * platform Cloudinary account. The updated endpoint returns the uploaded
     * asset and profile image URL immediately.
     *
     * @param userId - The user ID to upload avatar for
     * @param file - The file to upload
     * @param kind - Optional kind ('avatar' or 'banner')
     * @param replace - Optional boolean to replace existing file
     * @param token - Optional authorization token
     * @returns Promise with the uploaded asset and updated profile image URL
     */
    uploadAvatarFile: async (
        userId: string,
        file: File,
        options?: {
            kind?: ProfileFileKind
            replace?: boolean
            token?: string | null
        },
    ) => {
        const uploadFile = file.type.startsWith('image/')
            ? (await optimizeImageFile(file, {
                maxDimension: 1280,
                quality: 0.86,
                outputType: 'image/webp',
                outputExtension: 'webp',
            })).file
            : file
        const formData = new FormData()
        formData.append('file', uploadFile)

        const kind = options?.kind ?? 'avatar'
        formData.append('kind', kind)

        const queryParams = new URLSearchParams()
        if (options?.replace) {
            queryParams.append('replace', 'true')
        }

        const endpoint = `/users/${userId}/profile/avatar-file`

        const fullEndpoint = queryParams.toString()
            ? `${endpoint}?${queryParams.toString()}`
            : endpoint

        return api.post<UploadAvatarFileResponse>(
            fullEndpoint,
            formData,
            {
                token: options?.token,
                retry: false,
            },
        )
    },
}
