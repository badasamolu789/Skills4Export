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
    session?: {
      token?: string
      accessToken?: string
      tokenType?: string
      expiresIn?: number
      user?: Record<string, unknown>
    }
  }
  session?: {
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
// const BaseURL = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
const AUTH_ROUTES = {
  signUp: '/auth/register',
  login: '/auth/login',
  verifyOtp: '/auth/verify-registration',
  requestOtp: '/auth/request-otp',
  verifyGeneralOtp: '/auth/verify-otp',
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

  const user = response.data?.user || response.user || response.data?.session?.user || response.session?.user

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

  const token =
    response.data?.accessToken ||
    response.accessToken ||
    response.data?.token ||
    response.token ||
    response.data?.session?.accessToken ||
    response.data?.session?.token ||
    response.session?.accessToken ||
    response.session?.token

  if (!token) {
    return null
  }

  const user = response.data?.user || response.user || response.data?.session?.user || response.session?.user
  const userId = extractUserId(response) || undefined

  return {
    token,
    userId,
    tokenType:
      response.data?.tokenType ||
      response.tokenType ||
      response.data?.session?.tokenType ||
      response.session?.tokenType,
    expiresIn:
      response.data?.expiresIn ||
      response.expiresIn ||
      response.data?.session?.expiresIn ||
      response.session?.expiresIn,
    user,
  }
}

export const authService = {
  signUp(payload: SignUpRequest) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.signUp, {
      fullName: payload.fullName,
      name: payload.fullName,
      email: payload.email,
      password: payload.password,
    })
  },
  login(payload: LoginRequest) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.login, payload)
  },
  verifyOtp(payload: VerifyOtpRequest) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.verifyOtp, {
      email: payload.email,
      otpCode: payload.otpCode,
      otp: payload.otpCode,
      code: payload.otpCode,
      purpose: payload.purpose,
    })
  },
  requestOtp(email: string, purpose = 'registration') {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.requestOtp, { email, purpose })
  },
  verifyGeneralOtp(payload: VerifyOtpRequest) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.verifyGeneralOtp, {
      email: payload.email,
      otpCode: payload.otpCode,
      otp: payload.otpCode,
      code: payload.otpCode,
      purpose: payload.purpose,
    })
  },
  forgotPassword(email: string) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.requestOtp, {
      email,
      purpose: 'password_reset',
    })
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
