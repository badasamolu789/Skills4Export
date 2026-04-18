import { toast } from 'vue-sonner'
import type { ApiError } from '@/lib/api'
import {
    getUserFriendlyErrorMessage,
    getRecoveryAction,
    extractErrorCode,
    extractFieldErrors,
    getErrorSeverity,
} from '@/lib/errors'

export interface ErrorHandlerOptions {
    showToast?: boolean
    toastDuration?: number
    onlyFieldErrors?: boolean
}

export interface HandleErrorResult {
    message: string
    code?: string
    fieldErrors?: Record<string, string>
    status?: number
}

/**
 * Composable for handling API errors with user-friendly messages
 * Integrates with vue-sonner for toast notifications
 */
export function useErrorHandler() {
    /**
     * Show an error toast notification
     */
    const showErrorToast = (message: string, duration = 5000) => {
        toast.error(message, {
            duration,
            position: 'top-right',
        })
    }

    /**
     * Show a warning toast notification
     */
    const showWarningToast = (message: string, duration = 5000) => {
        toast.warning(message, {
            duration,
            position: 'top-right',
        })
    }

    /**
     * Show a success toast notification
     */
    const showSuccessToast = (message: string, duration = 3000) => {
        toast.success(message, {
            duration,
            position: 'top-right',
        })
    }

    /**
     * Show an info toast notification
     */
    const showInfoToast = (message: string, duration = 3000) => {
        toast.info(message, {
            duration,
            position: 'top-right',
        })
    }

    /**
     * Handle API errors and return user-friendly messages
     * Optionally shows a toast notification
     */
    const handleApiError = (error: unknown, options: ErrorHandlerOptions = {}): HandleErrorResult => {
        const { showToast: shouldShowToast = true, onlyFieldErrors = false } = options

        // Handle ApiError
        if (error instanceof Error && error.constructor.name === 'ApiError') {
            const apiError = error as ApiError
            const errorCode = extractErrorCode(apiError.payload)
            const fieldErrors = extractFieldErrors(apiError.payload)
            const severity = getErrorSeverity(apiError.status)

            // If we only want field errors and have them, return early
            if (onlyFieldErrors && Object.keys(fieldErrors).length > 0) {
                return {
                    message: 'Please check your input and try again.',
                    code: errorCode,
                    fieldErrors,
                    status: apiError.status,
                }
            }

            const message = getUserFriendlyErrorMessage(errorCode, apiError.status)

            if (shouldShowToast) {
                if (severity === 'warning') {
                    showWarningToast(message)
                } else {
                    showErrorToast(message)
                }
            }

            return {
                message,
                code: errorCode,
                fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
                status: apiError.status,
            }
        }

        // Handle network/fetch errors
        if (error instanceof Error) {
            const errorName = error.name.toLowerCase()
            let message = 'An unexpected error occurred. Please try again.'

            if (errorName === 'aborterror') {
                message = 'The request was cancelled. Please try again.'
            } else if (errorName.includes('timeout')) {
                message = 'The request is taking too long. Please check your connection and try again.'
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                message = 'Unable to connect. Please check your internet connection and try again.'
            }

            if (shouldShowToast) {
                showErrorToast(message)
            }

            return { message, status: 0 }
        }

        // Handle unknown errors
        const message = 'An unexpected error occurred. Please try again.'
        if (shouldShowToast) {
            showErrorToast(message)
        }

        return { message, status: 0 }
    }

    /**
     * Handle form validation errors
     * Returns field errors for inline display
     */
    const handleValidationError = (
        error: unknown,
        options: ErrorHandlerOptions = {}
    ): Record<string, string> => {
        const { showToast: shouldShowToast = false } = options
        const result = handleApiError(error, { ...options, showToast: false, onlyFieldErrors: true })

        if (result.fieldErrors) {
            return result.fieldErrors
        }

        if (shouldShowToast) {
            showErrorToast(result.message)
        }

        return {}
    }

    /**
     * Throw an error with a user-friendly message
     */
    const throwUserError = (message: string): never => {
        const error = new Error(message)
        error.name = 'UserError'
        throw error
    }

    return {
        handleApiError,
        handleValidationError,
        throwUserError,
        showErrorToast,
        showWarningToast,
        showSuccessToast,
        showInfoToast,
    }
}
