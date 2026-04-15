import { api } from '@/lib/api'
import { apiConfig } from '@/lib/api'

export type LoginRequest = {
  email: string
  password: string
}

export type SignUpRequest = {
  fullName: string
  email: string
  password: string
}

export type VerifyOtpRequest = {
  email: string
  otpCode: string
  purpose?: string
}

export type CompleteProfileRequest = {
  username: string
  phone?: string
  location: string
  headline: string
  interests: string[]
}

export type AuthSuccessResponse = {
  success?: boolean
  accessToken?: string
  refreshToken?: string
  message?: string
  token?: string
  otpId?: string
  tokenType?: string
  expiresIn?: number
  user?: Record<string, unknown>
  data?: {
    otpId?: string
    message?: string
    token?: string
    accessToken?: string
    tokenType?: string
    expiresIn?: number
    user?: Record<string, unknown>
  }
}

export type AuthMessageResponse = {
  success?: boolean
  message: string
  data?: {
    id?: string
  }
}

export type GoogleTokenRequest = {
  idToken: string
}

export type AuthSession = {
  token: string
  userId?: string
  tokenType?: string
  expiresIn?: number
  user?: Record<string, unknown>
}

const AUTH_ROUTES = {
  signUp: '/auth/register',
  login: '/auth/login',
  verifyOtp: '/auth/verify-registration',
  requestOtp: '/auth/request-otp',
  verifyGeneralOtp: '/auth/verify-otp',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  completeProfile: '/auth/complete-profile',
  me: '/auth/me',
  logout: '/auth/logout',
  googleRedirect: '/auth/google',
  googleCallback: '/auth/google/callback',
  googleToken: '/auth/google/token',
} as const

export const extractUserId = (response?: AuthSuccessResponse | null): string => {
  if (!response) {
    return ''
  }

  const user = response.data?.user || response.user

  if (!user || typeof user !== 'object') {
    return ''
  }

  if (typeof user.id === 'string') {
    return user.id
  }

  if (typeof user.userId === 'string') {
    return user.userId
  }

  return ''
}

export const extractAuthSession = (response?: AuthSuccessResponse | null): AuthSession | null => {
  if (!response) {
    return null
  }

  const token = response.data?.accessToken || response.accessToken || response.data?.token || response.token

  if (!token) {
    return null
  }

  const user = response.data?.user || response.user
  const userId = extractUserId(response) || undefined

  return {
    token,
    userId,
    tokenType: response.data?.tokenType || response.tokenType,
    expiresIn: response.data?.expiresIn || response.expiresIn,
    user,
  }
}

export const authService = {
  signUp(payload: SignUpRequest) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.signUp, payload)
  },
  login(payload: LoginRequest) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.login, payload)
  },
  verifyOtp(payload: VerifyOtpRequest) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.verifyOtp, payload)
  },
  requestOtp(email: string, purpose = 'registration') {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.requestOtp, { email, purpose })
  },
  verifyGeneralOtp(payload: VerifyOtpRequest) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.verifyGeneralOtp, payload)
  },
  forgotPassword(email: string) {
    return api.post<AuthMessageResponse>(AUTH_ROUTES.forgotPassword, { email })
  },
  resetPassword(payload: { email: string; otpCode: string; newPassword: string }) {
    return api.post<AuthMessageResponse>(AUTH_ROUTES.resetPassword, payload)
  },
  completeProfile(payload: CompleteProfileRequest, token?: string | null) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.completeProfile, payload, { token })
  },
  getCurrentUser(token?: string | null) {
    return api.get<AuthSuccessResponse>(AUTH_ROUTES.me, { token })
  },
  logout(token?: string | null) {
    return api.post<AuthMessageResponse>(AUTH_ROUTES.logout, undefined, { token })
  },
  googleCallback() {
    return api.get<AuthSuccessResponse>(AUTH_ROUTES.googleCallback)
  },
  googleTokenSignIn(payload: GoogleTokenRequest) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.googleToken, payload)
  },
  getGoogleRedirectUrl() {
    return `${apiConfig.baseUrl}${AUTH_ROUTES.googleRedirect}`
  },
}

export { AUTH_ROUTES }
