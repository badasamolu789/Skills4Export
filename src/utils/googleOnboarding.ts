import { extractOnboardingCompleted, getAuthResponseProfile, type AuthSuccessResponse } from '@/services/auth'
import { usersService, type UserProfile, type UserRecord } from '@/services/users'
import { useAuthStore } from '@/stores/auth'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readString = (source: Record<string, unknown> | undefined, keys: string[]) => {
  if (!source) {
    return ''
  }

  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

const hasCompletedProfile = (profile?: UserProfile | null) => {
  if (!profile) {
    return false
  }

  const record = profile as Record<string, unknown>
  const hasLocation = Boolean(readString(record, ['location', 'state', 'country']))
  const hasHeadline = Boolean(
    readString(record, [
      'bio',
      'headline',
      'currentJobTitle',
      'current_job_title',
      'currentWorkspace',
      'current_workspace',
    ]),
  )

  return hasLocation && hasHeadline
}

const syncGoogleUserDraft = (authStore: ReturnType<typeof useAuthStore>, response?: AuthSuccessResponse | null) => {
  const user = response?.data?.user || response?.user || response?.session?.user || response?.data?.session?.user

  if (isRecord(user)) {
    authStore.setCurrentUser(user as UserRecord)
  }

  const data = response?.data as Record<string, unknown> | undefined
  const email = readString(data, ['email'])
  const username = readString(data, ['username'])

  if (email) {
    authStore.signUpDraft.email = email
  }

  if (username) {
    authStore.signUpDraft.username = username
  }

  authStore.signUpDraft.password = ''
  authStore.signUpDraft.emailVerified = true
  authStore.signUpDraft.verificationCode = ''
  authStore.signUpDraft.verificationSentAt = ''
}

export const resolveGoogleOnboardingRedirect = async (
  authStore: ReturnType<typeof useAuthStore>,
  response?: AuthSuccessResponse | null,
) => {
  syncGoogleUserDraft(authStore, response)

  const responseProfile = getAuthResponseProfile(response)
  if (responseProfile) {
    authStore.setUserProfile(responseProfile as UserProfile)
  }

  let onboardingCompleted = extractOnboardingCompleted(response)

  if (onboardingCompleted === null && authStore.authToken) {
    try {
      const profileResponse = await usersService.getMyProfile(authStore.authToken, { suppressErrorModal: true })
      const profile = profileResponse.data?.profile ?? null

      if (profileResponse.data?.user) {
        authStore.setCurrentUser(profileResponse.data.user)
      }

      if (profile) {
        authStore.setUserProfile(profile)
      }

      onboardingCompleted = hasCompletedProfile(profile)
    } catch {
      onboardingCompleted = false
    }
  }

  const requiresOnboarding = onboardingCompleted !== true
  authStore.setOnboardingRequired(requiresOnboarding)

  return requiresOnboarding ? '/auth/signup/details' : '/feed'
}
