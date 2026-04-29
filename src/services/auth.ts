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
    id?: string
    email?: string
    username?: string | null
    api_token?: string | null
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
  id_token: string
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
  sendRegistrationOtp: '/register/send-otp',
  verifyRegistrationOtp: '/register/verify-otp',
  resendRegistrationOtp: '/register/resend-otp',
  setRegistrationPassword: '/register/set-password',
  completeRegistration: '/register/complete',
  login: '/login',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  logout: '/logout',
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
    if (typeof response.data?.id === 'string') {
      return response.data.id
    }

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
    response.data?.api_token ||
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
    user: user ?? (response.data ? { id: response.data.id, email: response.data.email, username: response.data.username } : undefined),
  }
}

export const authService = {
  sendRegistrationOtp(email: string) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.sendRegistrationOtp, { email })
  },
  login(payload: LoginRequest) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.login, payload)
  },
  verifyOtp(payload: VerifyOtpRequest) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.verifyRegistrationOtp, {
      email: payload.email,
      otp: payload.otpCode,
    })
  },
  resendRegistrationOtp(email: string) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.resendRegistrationOtp, { email })
  },
  setRegistrationPassword(payload: { email: string; password: string }) {
    return api.post<AuthMessageResponse>(AUTH_ROUTES.setRegistrationPassword, {
      email: payload.email,
      password: payload.password,
    })
  },
  completeRegistration(payload: { email: string; name: string; ref_code?: string }) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.completeRegistration, payload)
  },
  forgotPassword(email: string) {
    return api.post<AuthSuccessResponse>(AUTH_ROUTES.forgotPassword, {
      email,
    })
  },
  resetPassword(payload: {
    email: string
    password: string
    password_confirmation: string
    otp?: string
    token?: string
  }) {
    return api.post<AuthMessageResponse>(AUTH_ROUTES.resetPassword, payload)
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
