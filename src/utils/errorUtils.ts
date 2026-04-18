/**
 * Common error handling utilities and helpers for the SkillForExport frontend
 */

import { useErrorHandler } from '@/composables/useErrorHandler'
import type { ApiError } from '@/lib/api'

/**
 * Wrapper for async operations that need error handling
 * Automatically manages loading state and errors
 */
export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    options: {
        onError?: (error: { message: string; code?: string; status?: number }) => void
        onSuccess?: (result: T) => void
        showToast?: boolean
    } = {}
) {
    const { handleApiError } = useErrorHandler()
    const { onError, onSuccess, showToast = true } = options

    try {
        const result = await operation()
        onSuccess?.(result)
        return result
    } catch (error) {
        const result = handleApiError(error, { showToast })
        onError?.(result)
        throw result
    }
}

/**
 * Check if an error is a specific type
 */
export function isApiError(error: unknown): error is ApiError {
    return (
        error instanceof Error &&
        error.constructor.name === 'ApiError' &&
        (error as any).status !== undefined
    )
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
    if (!isApiError(error)) return false
    return error.status === 401 || error.status === 403
}

/**
 * Check if error is a validation error (422)
 */
export function isValidationError(error: unknown): boolean {
    if (!isApiError(error)) return false
    return error.status === 422
}

/**
 * Check if error is a not found error (404)
 */
export function isNotFoundError(error: unknown): boolean {
    if (!isApiError(error)) return false
    return error.status === 404
}

/**
 * Check if error is a conflict error (409)
 */
export function isConflictError(error: unknown): boolean {
    if (!isApiError(error)) return false
    return error.status === 409
}

/**
 * Check if error is a rate limit error (429)
 */
export function isRateLimitError(error: unknown): boolean {
    if (!isApiError(error)) return false
    return error.status === 429
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: unknown): boolean {
    if (!isApiError(error)) return false
    return error.status >= 500
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
    if (isApiError(error)) return error.status === 0
    if (error instanceof Error) {
        return (
            error.name === 'AbortError' ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('NetworkError')
        )
    }
    return false
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: {
        maxAttempts?: number
        initialDelay?: number
        maxDelay?: number
        backoffMultiplier?: number
        retryOn?: (error: unknown) => boolean
    } = {}
): Promise<T> {
    const {
        maxAttempts = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffMultiplier = 2,
        retryOn = isNetworkError,
    } = options

    let lastError: unknown

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await operation()
        } catch (error) {
            lastError = error

            // Don't retry if condition not met
            if (!retryOn(error)) {
                throw error
            }

            // Don't wait after last attempt
            if (attempt < maxAttempts - 1) {
                const delay = Math.min(
                    initialDelay * Math.pow(backoffMultiplier, attempt),
                    maxDelay
                )
                await new Promise((resolve) => setTimeout(resolve, delay))
            }
        }
    }

    throw lastError
}

/**
 * Execute operation with timeout
 */
export async function withTimeout<T>(
    operation: Promise<T>,
    timeoutMs = 30000,
    timeoutMessage = 'Operation timed out'
): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(() => {
            reject(new Error(timeoutMessage))
        }, timeoutMs)

        return () => clearTimeout(id)
    })

    return Promise.race([operation, timeoutPromise])
}

/**
 * Debounce an async operation
 * Useful for form submissions and save operations
 */
export function debounceAsync<Args extends any[], R>(
    fn: (...args: Args) => Promise<R>,
    delayMs = 300
) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastPromise: Promise<R> | null = null

    return (...args: Args): Promise<R> => {
        return new Promise((resolve, reject) => {
            if (timeoutId) {
                clearTimeout(timeoutId)
            }

            timeoutId = setTimeout(async () => {
                try {
                    const result = await fn(...args)
                    resolve(result)
                    lastPromise = Promise.resolve(result)
                } catch (error) {
                    reject(error)
                    lastPromise = Promise.reject(error)
                }
            }, delayMs)
        })
    }
}

/**
 * Throttle an async operation
 * Useful for preventing duplicate submissions
 */
export function throttleAsync<Args extends any[], R>(
    fn: (...args: Args) => Promise<R>,
    delayMs = 1000
) {
    let lastCallTime = 0
    let isRunning = false

    return async (...args: Args): Promise<R> => {
        const now = Date.now()

        if (now - lastCallTime < delayMs || isRunning) {
            throw new Error('Operation is throttled. Please wait a moment.')
        }

        lastCallTime = now
        isRunning = true

        try {
            return await fn(...args)
        } finally {
            isRunning = false
        }
    }
}

/**
 * Combine multiple async operations and handle errors
 */
export async function executeAll<T extends readonly Promise<any>[]>(
    promises: T,
    options: { stopOnFirstError?: boolean } = {}
): Promise<PromiseSettledResult<Awaited<T[number]>>[]> {
    const { stopOnFirstError = false } = options

    if (stopOnFirstError) {
        try {
            const results = await Promise.all(promises)
            return results.map((value) => ({ status: 'fulfilled' as const, value }))
        } catch (error) {
            return [{ status: 'rejected' as const, reason: error }]
        }
    }

    return Promise.allSettled(promises)
}

/**
 * Format field validation errors for display
 */
export function formatFieldErrors(
    errors: Record<string, string>
): Array<{ field: string; message: string }> {
    return Object.entries(errors).map(([field, message]) => ({
        field,
        message,
    }))
}

/**
 * Create a user-friendly summary of multiple errors
 */
export function summarizeErrors(errors: Record<string, string>): string {
    const errorCount = Object.keys(errors).length

    if (errorCount === 0) {
        return 'No errors'
    }

    if (errorCount === 1) {
        const [, message] = Object.entries(errors)[0]
        return message
    }

    return `Please fix ${errorCount} errors and try again`
}

/**
 * Format API error for logging/monitoring
 */
export function formatErrorForLogging(error: unknown) {
    if (isApiError(error)) {
        return {
            type: 'ApiError',
            status: error.status,
            message: error.message,
            code: (error.payload as any)?.code,
            payload: error.payload,
        }
    }

    if (error instanceof Error) {
        return {
            type: 'Error',
            name: error.name,
            message: error.message,
            stack: error.stack,
        }
    }

    return {
        type: 'Unknown',
        value: error,
    }
}

/**
 * Check if user should be logged out
 */
export function shouldLogoutUser(error: unknown): boolean {
    if (!isApiError(error)) return false

    // Logout on 401 Unauthorized
    if (error.status === 401) {
        const code = (error.payload as any)?.code
        // But not for invalid_credentials - user just typed wrong password
        if (code === 'invalid_credentials') return false
        // Logout on token expired, session expired, etc.
        return true
    }

    return false
}

/**
 * Transform validation errors to form field errors
 */
export function transformValidationErrors(
    payload: Record<string, any>
): Record<string, string> {
    const fieldErrors: Record<string, string> = {}

    if (payload.errors && typeof payload.errors === 'object') {
        Object.entries(payload.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
                fieldErrors[field] = messages[0] || `Invalid ${field}`
            } else if (typeof messages === 'string') {
                fieldErrors[field] = messages
            }
        })
    }

    return fieldErrors
}

/**
 * Create an error boundary handler for component-level error catching
 */
export function createErrorBoundary(options: {
    onError?: (error: unknown) => void
    fallbackUI?: string
    logErrors?: boolean
} = {}) {
    const { onError, fallbackUI = 'An error occurred', logErrors = true } = options

    return {
        handleError(error: unknown) {
            if (logErrors) {
                console.error('Error boundary caught:', formatErrorForLogging(error))
            }

            onError?.(error)

            return {
                message: fallbackUI,
                error: error instanceof Error ? error.message : String(error),
            }
        },
    }
}

/**
 * Validate input before sending to API
 */
export interface ValidationRule {
    field: string
    validate: (value: any) => boolean | string
    message: string
}

export function validateForm(
    data: Record<string, any>,
    rules: ValidationRule[]
): Record<string, string> {
    const errors: Record<string, string> = {}

    for (const rule of rules) {
        const value = data[rule.field]
        const result = rule.validate(value)

        if (result === false || (typeof result === 'string' && result.length > 0)) {
            errors[rule.field] = typeof result === 'string' ? result : rule.message
        }
    }

    return errors
}

/**
 * Common validation rules
 */
export const ValidationRules = {
    required: (fieldName: string): ValidationRule => ({
        field: fieldName,
        validate: (value) => value !== '' && value !== null && value !== undefined,
        message: `${fieldName} is required`,
    }),

    email: (fieldName: string): ValidationRule => ({
        field: fieldName,
        validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: 'Please enter a valid email address',
    }),

    minLength: (fieldName: string, min: number): ValidationRule => ({
        field: fieldName,
        validate: (value) => value?.length >= min,
        message: `${fieldName} must be at least ${min} characters`,
    }),

    maxLength: (fieldName: string, max: number): ValidationRule => ({
        field: fieldName,
        validate: (value) => value?.length <= max,
        message: `${fieldName} must be ${max} characters or less`,
    }),

    passwordStrength: (fieldName: string): ValidationRule => ({
        field: fieldName,
        validate: (value) => {
            if (!value) return false
            const hasUpper = /[A-Z]/.test(value)
            const hasLower = /[a-z]/.test(value)
            const hasNumber = /[0-9]/.test(value)
            const isLongEnough = value.length >= 8

            return hasUpper && hasLower && hasNumber && isLongEnough
        },
        message:
            'Password must be at least 8 characters with uppercase, lowercase, and numbers',
    }),

    url: (fieldName: string): ValidationRule => ({
        field: fieldName,
        validate: (value) => {
            if (!value) return true // Allow empty
            try {
                new URL(value)
                return true
            } catch {
                return false
            }
        },
        message: 'Please enter a valid URL',
    }),

    match: (fieldName: string, otherValue: any, otherFieldName: string): ValidationRule => ({
        field: fieldName,
        validate: (value) => value === otherValue,
        message: `${fieldName} must match ${otherFieldName}`,
    }),
}
