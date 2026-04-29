import { useAppStore } from '@/stores/app'
import { getUserFriendlyErrorMessage } from '@/lib/errors'

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ApiRequestOptions = {
  method?: ApiMethod
  body?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
  token?: string | null
}

export type ApiErrorPayload = {
  message?: string
  error?:
  | string
  | {
    code?: string
    message?: string
  }
  errors?: Record<string, string[] | string>
  statusCode?: number
  success?: boolean
}

export class ApiError extends Error {
  status: number
  payload: ApiErrorPayload | null

  constructor(message: string, status: number, payload: ApiErrorPayload | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 8000) // Reduced from 15000 to 8000ms

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>()

// Response cache for GET requests
const responseCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
const DEFAULT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Request prioritization
const HIGH_PRIORITY_ENDPOINTS = [
  '/auth/me',
  '/auth/verify',
  '/users/me',
]

// Retry configuration
const MAX_RETRIES = 3
const RETRY_BASE_DELAY = 1000 // 1 second
const RETRY_MAX_DELAY = 10000 // 10 seconds

// Temporary API debug modal toggle.
const SHOW_API_DEBUG_MODAL =
  import.meta.env.VITE_SHOW_API_DEBUG_MODAL === undefined
    ? import.meta.env.DEV
    : import.meta.env.VITE_SHOW_API_DEBUG_MODAL === 'true'
const SHOW_API_REQUEST_LOGS =
  import.meta.env.VITE_SHOW_API_REQUEST_LOGS === undefined
    ? import.meta.env.DEV
    : import.meta.env.VITE_SHOW_API_REQUEST_LOGS === 'true'

const getApiBaseUrl = () => {
  if (!API_BASE_URL && !import.meta.env.DEV) {
    throw new ApiError(
      'Missing VITE_API_BASE_URL. Add it to your environment before making API calls.',
      500,
    )
  }

  return API_BASE_URL
}

const getAbsoluteBaseUrl = () => {
  const baseUrl = getApiBaseUrl()

  if (!baseUrl || baseUrl.startsWith('/')) {
    return null
  }

  try {
    return new URL(baseUrl)
  } catch {
    return null
  }
}

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const baseUrl = getApiBaseUrl()

  if (!baseUrl) {
    return normalizedPath
  }

  if (import.meta.env.DEV) {
    const absoluteBaseUrl = getAbsoluteBaseUrl()

    if (absoluteBaseUrl) {
      const basePath =
        absoluteBaseUrl.pathname && absoluteBaseUrl.pathname !== '/'
          ? absoluteBaseUrl.pathname.replace(/\/+$/, '')
          : ''

      return `${basePath}${normalizedPath}`
    }
  }

  if (baseUrl.startsWith('/')) {
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    return `${normalizedBase}${normalizedPath}`
  }

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const relativePath = normalizedPath.replace(/^\/+/, '')

  return new URL(relativePath, normalizedBase).toString()
}

const mergeSignals = (signal?: AbortSignal, timeoutMs = API_TIMEOUT_MS) => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)

  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  return {
    signal: controller.signal,
    cleanup: () => window.clearTimeout(timeoutId),
  }
}

const parseResponse = async <T>(response: Response): Promise<T | null> => {
  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return (await response.json()) as T
  }

  return (await response.text()) as T
}

const getErrorMessage = (payload: ApiErrorPayload | null, status: number, fallback: string) => {
  if (!payload) {
    return fallback
  }

  // Try to extract error code from various locations
  const errorCode =
    (payload as any).code ||
    (payload.error && typeof payload.error === 'object' && (payload.error as any).code) ||
    (payload as any).errorCode ||
    ((payload as any).data && (payload as any).data.code)

  // Use the new error message mapping
  if (errorCode) {
    const userMessage = getUserFriendlyErrorMessage(errorCode, status)
    if (userMessage && userMessage !== fallback) {
      return userMessage
    }
  }

  // Fallback to original message extraction
  if (payload.message) {
    return payload.message
  }

  if (typeof payload.error === 'string') {
    return payload.error
  }

  if (payload.error?.message) {
    return payload.error.message
  }

  return fallback
}

const reportApiError = ({
  method,
  url,
  status,
  payload,
  description,
}: {
  method: ApiMethod
  url: string
  status?: string | number
  payload?: unknown
  description: string
}) => {
  if (!SHOW_API_DEBUG_MODAL) {
    return
  }

  try {
    // Temporary API debug modal reporting. Safe to remove later together with appStore.showApiError usage.
    const appStore = useAppStore()
    appStore.showApiError({
      method,
      url,
      status,
      payload,
      description,
    })
  } catch {
    // Ignore store access failures outside an active Pinia context.
  }
}

const logApiRequest = ({
  method,
  url,
  hasBody,
  hasToken,
}: {
  method: ApiMethod
  url: string
  hasBody: boolean
  hasToken: boolean
}) => {
  if (!SHOW_API_REQUEST_LOGS) {
    return
  }

  console.info('[api] request', {
    method,
    url,
    hasBody,
    hasToken,
  })
}

const logApiResponse = ({
  method,
  url,
  status,
  ok,
}: {
  method: ApiMethod
  url: string
  status: number
  ok: boolean
}) => {
  if (!SHOW_API_REQUEST_LOGS) {
    return
  }

  console.info('[api] response', {
    method,
    url,
    status,
    ok,
  })
}

// Request optimization utilities
const getRequestKey = (method: ApiMethod, path: string, body?: unknown) => {
  const bodyKey = body ? JSON.stringify(body) : ''
  return `${method}:${path}:${bodyKey}`
}

const getCacheKey = (method: ApiMethod, path: string) => {
  return `${method}:${path}`
}

const DYNAMIC_CACHE_BYPASS_PREFIXES = [
  '/user/',
  '/users/',
  '/media/',
]

const isCacheable = (method: ApiMethod, path: string) => {
  // Only cache GET requests for endpoints that are not auth- or user-state driven.
  if (method !== 'GET' || path.includes('/auth/')) {
    return false
  }

  return !DYNAMIC_CACHE_BYPASS_PREFIXES.some((prefix) => path.startsWith(prefix))
}

const getCachedResponse = (method: ApiMethod, path: string) => {
  const key = getCacheKey(method, path)
  const cached = responseCache.get(key)

  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data
  }

  // Remove expired cache
  if (cached) {
    responseCache.delete(key)
  }

  return null
}

const setCachedResponse = (method: ApiMethod, path: string, data: any, ttl = DEFAULT_CACHE_TTL) => {
  const key = getCacheKey(method, path)
  responseCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  })
}

const invalidateRelatedCacheEntries = (path: string) => {
  for (const key of responseCache.keys()) {
    const [, cachedPath] = key.split(':', 2)

    if (
      cachedPath.startsWith('/user/') ||
      cachedPath.startsWith('/users/') ||
      cachedPath.startsWith('/media/') ||
      path.startsWith('/user/') ||
      path.startsWith('/users/') ||
      path.startsWith('/media/')
    ) {
      responseCache.delete(key)
    }
  }
}

const getRequestPriority = (path: string) => {
  return HIGH_PRIORITY_ENDPOINTS.some(endpoint => path.includes(endpoint)) ? 'high' : 'normal'
}

const getTimeoutForEndpoint = (path: string) => {
  // Shorter timeout for high-priority endpoints
  if (getRequestPriority(path) === 'high') {
    return 5000 // 5 seconds for auth/me requests
  }
  // Longer timeout for data-heavy endpoints
  if (path.includes('/portfolios') || path.includes('/posts') || path.includes('/communities')) {
    return 12000 // 12 seconds for data-heavy requests
  }
  return API_TIMEOUT_MS // 8 seconds default
}

const shouldRetry = (error: any, attempt: number): boolean => {
  if (attempt >= MAX_RETRIES) return false

  // Retry on network errors, timeouts, and 5xx server errors
  if (error instanceof DOMException && error.name === 'AbortError') return true
  if (error instanceof ApiError) {
    const status = error.status
    // Retry on server errors (5xx) and specific client errors
    return status >= 500 || status === 408 || status === 429 || status === 0
  }

  return false
}

const calculateRetryDelay = (attempt: number): number => {
  // Exponential backoff: baseDelay * 2^(attempt - 1) + jitter
  const exponentialDelay = RETRY_BASE_DELAY * Math.pow(2, attempt - 1)
  const jitter = Math.random() * 1000 // Add up to 1 second of jitter
  return Math.min(exponentialDelay + jitter, RETRY_MAX_DELAY)
}

const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  path: string,
  maxRetries = MAX_RETRIES
): Promise<T> => {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (!shouldRetry(error, attempt)) {
        throw error
      }

      if (attempt <= maxRetries) {
        const delay = calculateRetryDelay(attempt)
        console.warn(`API request failed (attempt ${attempt}/${maxRetries + 1}), retrying in ${delay}ms:`, {
          path,
          error: error instanceof ApiError ? error.message : String(error)
        })

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

export const apiRequest = async <T>(
  path: string,
  { method = 'GET', body, headers, signal, token }: ApiRequestOptions = {},
): Promise<T> => {
  const requestKey = getRequestKey(method, path, body)
  const cacheKey = getCacheKey(method, path)

  // Check cache for GET requests
  if (isCacheable(method, path)) {
    const cached = getCachedResponse(method, path)
    if (cached) {
      logApiResponse({
        method,
        url: path,
        status: 200,
        ok: true,
      })
      return cached
    }
  }

  // Request deduplication - return pending request if exists
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)
  }

  const mergedHeaders = new Headers(headers)
  const hasBody = body !== undefined
  const isFormData = body instanceof FormData
  let requestUrl = ''

  if (hasBody && !isFormData && !mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json')
  }

  if (!mergedHeaders.has('Accept')) {
    mergedHeaders.set('Accept', 'application/json')
  }

  // Add performance headers
  mergedHeaders.set('Accept-Encoding', 'gzip, deflate, br')

  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`)
  }

  // Use endpoint-specific timeout
  const endpointTimeout = getTimeoutForEndpoint(path)
  const { signal: requestSignal, cleanup } = mergeSignals(signal, endpointTimeout)

  const makeRequest = async (): Promise<T> => {
    try {
      requestUrl = buildUrl(path)
      logApiRequest({
        method,
        url: requestUrl,
        hasBody,
        hasToken: Boolean(token),
      })

      const response = await fetch(requestUrl, {
        method,
        headers: mergedHeaders,
        body: hasBody ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
        signal: requestSignal,
        // Add keepalive for critical requests
        keepalive: getRequestPriority(path) === 'high',
      })

      logApiResponse({
        method,
        url: requestUrl,
        status: response.status,
        ok: response.ok,
      })

      const payload = await parseResponse<T | ApiErrorPayload>(response)

      if (!response.ok) {
        reportApiError({
          method,
          url: requestUrl,
          status: response.status,
          payload,
          description: 'The backend returned an error response.',
        })

        throw new ApiError(
          getErrorMessage(payload as ApiErrorPayload | null, response.status, 'Something went wrong while contacting the server.'),
          response.status,
          (payload as ApiErrorPayload | null) ?? null,
        )
      }

      // Cache successful GET responses
      if (isCacheable(method, path)) {
        setCachedResponse(method, path, payload)
      } else if (method !== 'GET') {
        invalidateRelatedCacheEntries(path)
      }

      return payload as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        reportApiError({
          method,
          url: requestUrl || path,
          status: 408,
          payload: { message: 'Request timeout' },
          description: 'The request timed out before the server responded.',
        })
        throw new ApiError('The request timed out. Please try again.', 408)
      }

      reportApiError({
        method,
        url: requestUrl || path,
        status: 0,
        payload: { message: String(error) },
        description: 'The request could not reach the backend service.',
      })

      throw new ApiError('Unable to reach the server. Check your network connection and try again.', 0)
    } finally {
      cleanup()
    }
  }

  // Store pending request for deduplication
  const requestPromise = retryWithBackoff(() => makeRequest(), path)
  pendingRequests.set(requestKey, requestPromise)

  try {
    const result = await requestPromise
    return result
  } finally {
    // Clean up pending request
    pendingRequests.delete(requestKey)
  }
}
export const api = {
  get: <T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
}

export const apiConfig = {
  baseUrl: (() => {
    if (!API_BASE_URL) {
      return ''
    }

    if (import.meta.env.DEV) {
      const absoluteBaseUrl = getAbsoluteBaseUrl()

      if (absoluteBaseUrl) {
        return absoluteBaseUrl.pathname.replace(/\/+$/, '')
      }
    }

    return API_BASE_URL
  })(),
  timeoutMs: API_TIMEOUT_MS,
}
