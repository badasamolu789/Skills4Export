/**
 * Comprehensive error code to user-friendly message mapping
 * Based on SkillForExport API OpenAPI specification
 */

export type ErrorCategory =
    | 'auth'
    | 'user'
    | 'media'
    | 'post'
    | 'question'
    | 'community'
    | 'page'
    | 'general'
    | 'validation'

export interface ErrorMessageConfig {
    code: string
    category: ErrorCategory
    userMessage: string
    recoveryAction?: string
    severity?: 'error' | 'warning' | 'info'
}

// Default messages by HTTP status code
const HTTP_STATUS_MESSAGES: Record<number, string> = {
    400: 'The request could not be processed. Please check your input and try again.',
    401: 'Please log in to continue.',
    403: "You don't have permission to perform this action.",
    404: 'The item you\'re looking for could not be found.',
    409: 'This action conflicts with an existing item. Please try something else.',
    413: 'The file is too large. Please try a smaller file.',
    415: 'The file type is not supported.',
    422: 'Some information you provided is invalid. Please check and try again.',
    429: "You're doing that too often. Please wait a moment and try again.",
    500: "Something went wrong on our end. We're working on it. Please try again later.",
    503: 'We\'re temporarily unavailable. Please check back in a few minutes.',
    504: 'The request is taking too long. Please check your connection and try again.',
}

// Network and client errors
const NETWORK_ERROR_MESSAGES: Record<string, string> = {
    timeout: 'The request is taking too long. Please check your connection and try again.',
    offline: 'Unable to connect. Please check your internet connection and try again.',
    network: 'Unable to connect. Please check your internet connection and try again.',
    abort: 'The request was cancelled. Please try again.',
}

/**
 * Authentication related errors
 */
const AUTH_ERRORS: Record<string, string> = {
    invalid_credentials: 'The email or password you entered is incorrect. Please try again.',
    email_already_exists: 'An account with this email already exists. Try logging in instead.',
    email_already_registered: 'An account with this email already exists. Try logging in instead.',
    invalid_otp: 'The verification code you entered is incorrect or has expired. Request a new one?',
    invalid_otp_code: 'The verification code you entered is incorrect or has expired. Request a new one?',
    otp_expired: 'The verification code has expired. Request a new one.',
    otp_max_attempts: "You've reached the maximum attempts. Request a new code.",
    otp_too_frequent: "You've requested too many codes. Please wait a few minutes before trying again.",
    password_too_weak: 'Password must be at least 8 characters and include uppercase, lowercase, and a number.',
    invalid_email_format: 'Please enter a valid email address (e.g., name@example.com).',
    google_token_expired: 'Your Google session has expired. Please sign in with Google again.',
    google_token_invalid: 'Your Google session has expired. Please sign in with Google again.',
    missing_required_fields: 'Please fill in all required fields: email, password, and full name.',
    password_reset_token_invalid: 'This password reset link is invalid or has expired. Request a new one.',
    email_not_verified: 'Please verify your email address before logging in. Check your inbox.',
    account_not_verified: 'Please verify your email address before logging in. Check your inbox.',
    session_expired: 'Your session has expired. Please log in again.',
    unauthorized: 'Please log in to continue.',
}

/**
 * User profile and account related errors
 */
const USER_ERRORS: Record<string, string> = {
    profile_already_exists: 'You already have a profile. Use the edit option to update it.',
    username_already_taken: 'This username is already taken. Please choose another one.',
    username_taken: 'This username is already taken. Please choose another one.',
    cannot_follow_self: 'You cannot follow your own account.',
    already_following_user: 'You are already following this user.',
    user_not_found: "This user account doesn't exist or has been deactivated.",
    invalid_user_id: 'Invalid user identifier. Please check the URL and try again.',
    cannot_delete_others_content: "You don't have permission to delete this item.",
    unauthorized_profile_access: 'This profile is private. You need to be connected to view it.',
    profile_private: 'This profile is private. You need to be connected to view it.',
}

/**
 * Media upload related errors
 */
const MEDIA_ERRORS: Record<string, string> = {
    file_too_large: 'This file is too large. Maximum size is 10MB for images.',
    unsupported_media_type: 'Only JPG, PNG, and WEBP image formats are supported.',
    unsupported_file_type: 'Only JPG, PNG, and WEBP image formats are supported.',
    invalid_image_url: 'The image URL you provided is invalid or inaccessible.',
    avatar_already_exists: "You already have a profile picture. Use 'Replace' to upload a new one.",
    banner_already_exists: "You already have a banner image. Use 'Replace' to upload a new one.",
    upload_failed: "We couldn't process your image. It may be corrupted or too large. Try a different image.",
    upload_job_failed: "We couldn't process your image. It may be corrupted or too large. Try a different image.",
    upload_timeout: "The upload is taking longer than expected. We'll notify you when it's ready.",
    cloudinary_signature_expired: 'Upload session expired. Please refresh and try again.',
    invalid_public_id: 'Invalid media reference. Please re-upload the file.',
    media_not_found: 'The requested media could not be found.',
}

/**
 * Post and content related errors
 */
const POST_ERRORS: Record<string, string> = {
    empty_post_content: 'Your post cannot be empty. Please add some content.',
    post_title_required: 'Please add a title to your post.',
    content_required: 'Your post cannot be empty. Please add some content.',
    media_not_yet_processed: 'Your images are still being processed. Please wait a moment before posting.',
    invalid_media_asset_id: 'One or more attached images are invalid. Please re-upload them.',
    community_not_found: "The community you're trying to post to doesn't exist.",
    not_community_member: 'You must join this community before you can post here.',
    cannot_post_in_community: 'You must join this community before you can post here.',
    post_not_found: "This post has been deleted or doesn't exist.",
    cannot_edit_others_post: 'You can only edit your own posts.',
    cannot_delete_others_post: 'You can only delete your own posts.',
    post_already_reported: "You've already reported this post. We'll review it soon.",
    comment_too_long: 'Comments are limited to 2,000 characters. Please shorten your response.',
    comment_on_deleted_post: 'This post is no longer available.',
    parent_comment_not_found: "The comment you're replying to has been deleted.",
}

/**
 * Question and answer related errors
 */
const QUESTION_ERRORS: Record<string, string> = {
    question_title_required: 'Please enter a title for your question.',
    question_body_required: 'Please provide details about your question.',
    question_not_found: "This question has been removed or doesn't exist.",
    cannot_answer_closed_question: 'This question has been closed and is no longer accepting answers.',
    answer_content_required: 'Your answer cannot be empty.',
    already_accepted_answer: "You've already accepted an answer for this question.",
    cannot_accept_own_answer: 'You cannot accept your own answer as the solution.',
    only_author_can_accept: 'Only the person who asked the question can accept an answer.',
}

/**
 * Community related errors
 */
const COMMUNITY_ERRORS: Record<string, string> = {
    community_name_taken: 'A community with this name already exists. Try a different name.',
    community_name_required: 'Please enter a name for your community.',
    community_not_found: "This community doesn't exist or has been deleted.",
    already_member: "You're already a member of this community.",
    not_member: "You're not a member of this community.",
    cannot_delete_community: 'Only the community owner can delete this community.',
    cannot_update_community: 'Only community admins can update these settings.',
    invalid_category_id: 'Please select a valid category for your community.',
}

/**
 * Page related errors
 */
const PAGE_ERRORS: Record<string, string> = {
    page_slug_taken: 'This page URL is already taken. Please choose a different slug.',
    page_name_required: 'Please enter a name for your page.',
    invalid_slug_format: 'Page URL can only contain letters, numbers, and hyphens.',
    page_not_found: "This page doesn't exist or has been removed.",
    page_not_approved: 'This page is pending approval and is not yet visible to the public.',
    page_inactive: 'This page has been deactivated.',
    cannot_manage_page: "You don't have permission to manage this page.",
}

/**
 * Validation field-level errors
 */
const VALIDATION_ERRORS: Record<string, string> = {
    invalid_website_url: 'Please enter a valid website URL (including https://)',
    invalid_linkedin_url: 'Please enter a valid LinkedIn profile URL',
    invalid_github_url: 'Please enter a valid GitHub profile URL',
    end_date_before_start: 'End date cannot be before start date',
    cannot_have_end_date_if_current: "Current positions shouldn't have an end date",
    bio_too_long: 'Bio must be 500 characters or less',
    invalid_username_format: 'Username can only contain letters, numbers, and underscores',
}

/**
 * Combine all error mappings
 */
const ERROR_MESSAGES: Record<string, string> = {
    // Auth errors
    ...AUTH_ERRORS,
    // User errors
    ...USER_ERRORS,
    // Media errors
    ...MEDIA_ERRORS,
    // Post errors
    ...POST_ERRORS,
    // Question errors
    ...QUESTION_ERRORS,
    // Community errors
    ...COMMUNITY_ERRORS,
    // Page errors
    ...PAGE_ERRORS,
    // Validation errors
    ...VALIDATION_ERRORS,
}

/**
 * Get user-friendly error message based on API response
 */
export function getUserFriendlyErrorMessage(
    errorCode: string | undefined,
    status: number | undefined,
    fallback = 'An error occurred. Please try again.'
): string {
    // Check if we have a specific error code mapping
    if (errorCode && errorCode in ERROR_MESSAGES) {
        return ERROR_MESSAGES[errorCode]
    }

    // Check if we have a status code mapping
    if (status && status in HTTP_STATUS_MESSAGES) {
        return HTTP_STATUS_MESSAGES[status]
    }

    return fallback
}

/**
 * Get recovery action message based on error
 */
export function getRecoveryAction(errorCode: string | undefined, status: number | undefined): string | undefined {
    if (status === 401) {
        return 'Please log in again'
    }
    if (status === 403) {
        return 'You may need to contact support'
    }
    if (status === 404) {
        return 'Try going back to the previous page'
    }
    if (status === 429) {
        return 'Wait a moment before trying again'
    }
    if (status === 500 || status === 503) {
        return 'Try again in a few minutes'
    }
    if (errorCode?.includes('not_found')) {
        return 'Try going back to the previous page'
    }
    return undefined
}

/**
 * Extract error code from API error payload
 */
export function extractErrorCode(payload: Record<string, any> | null | undefined): string | undefined {
    if (!payload) return undefined

    // Try different common error code locations
    if (payload.code) return payload.code
    if (payload.error?.code) return payload.error.code
    if (payload.errorCode) return payload.errorCode
    if (payload.data?.code) return payload.data.code

    return undefined
}

/**
 * Extract validation field errors from 422 response
 */
export function extractFieldErrors(payload: Record<string, any> | null | undefined): Record<string, string> {
    if (!payload || !payload.errors) return {}

    const fieldErrors: Record<string, string> = {}

    Object.entries(payload.errors).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
            // Use the first error message for this field
            fieldErrors[field] = messages[0] || `Invalid ${field}`
        } else if (typeof messages === 'string') {
            fieldErrors[field] = messages
        }
    })

    return fieldErrors
}

/**
 * Determine error severity based on status code
 */
export function getErrorSeverity(status: number | undefined): 'error' | 'warning' | 'info' {
    if (!status) return 'error'
    if (status === 429) return 'warning'
    if (status < 500) return 'warning'
    return 'error'
}
