import { useAppStore } from '@/stores/app'

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

const API_BASE_URL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_BASE_URL?.trim()
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000)

// Temporary API debug modal toggle.
const SHOW_API_DEBUG_MODAL =
  import.meta.env.VITE_SHOW_API_DEBUG_MODAL === undefined
    ? import.meta.env.DEV
    : import.meta.env.VITE_SHOW_API_DEBUG_MODAL === 'true'

const getApiBaseUrl = () => {
  if (!API_BASE_URL && !import.meta.env.DEV) {
    throw new ApiError(
      'Missing VITE_API_BASE_URL. Add it to your environment before making API calls.',
      500,
    )
  }

  return API_BASE_URL
}

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const baseUrl = getApiBaseUrl()

  if (!baseUrl) {
    return normalizedPath
  }

  if (baseUrl.startsWith('/')) {
    return `${baseUrl}${normalizedPath}`
  }

  return new URL(normalizedPath, baseUrl).toString()
}

const mergeSignals = (signal?: AbortSignal) => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS)

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

const getErrorMessage = (payload: ApiErrorPayload | null, fallback: string) => {
  if (!payload) {
    return fallback
  }

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

export const apiRequest = async <T>(
  path: string,
  { method = 'GET', body, headers, signal, token }: ApiRequestOptions = {},
): Promise<T> => {
  const mergedHeaders = new Headers(headers)
  const hasBody = body !== undefined
  let requestUrl = ''

  if (hasBody && !mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json')
  }

  if (!mergedHeaders.has('Accept')) {
    mergedHeaders.set('Accept', 'application/json')
  }

  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`)
  }

  const { signal: requestSignal, cleanup } = mergeSignals(signal)

  try {
    requestUrl = buildUrl(path)

    const response = await fetch(requestUrl, {
      method,
      headers: mergedHeaders,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: requestSignal,
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
        getErrorMessage(payload as ApiErrorPayload | null, 'Something went wrong while contacting the server.'),
        response.status,
        (payload as ApiErrorPayload | null) ?? null,
      )
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

    throw new ApiError('Unable to reach the server. Check your network or ngrok URL and try again.', 0)
  } finally {
    cleanup()
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
  baseUrl: API_BASE_URL ?? '',
  timeoutMs: API_TIMEOUT_MS,
}
