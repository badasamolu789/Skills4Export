import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserProfile, UserRecord } from '@/services/users'
import { isLikelyEmail } from '@/utils/displayName'

const AUTH_TOKEN_KEY = 'skills4export-auth-token'
const AUTH_USER_ID_KEY = 'skills4export-user-id'
const ONBOARDING_REQUIRED_KEY = 'skills4export-onboarding-required'
const PROFILE_OVERRIDES_KEY = 'skills4export-profile-overrides'

const getStoredToken = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY) ?? ''
}

const getStoredUserId = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(AUTH_USER_ID_KEY) ?? ''
}

export const getStoredOnboardingRequired = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(ONBOARDING_REQUIRED_KEY) === 'true'
}

const normalizeProfileLocation = (location?: string | null) => {
  const trimmed = location?.trim() ?? ''
  const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ')

  if (normalized === 'lagos' || normalized === 'lagos, nigeria') {
    return ''
  }

  return trimmed
}

const getProfileOverrides = () => {
  if (typeof window === 'undefined') {
    return {} as Record<string, Partial<UserProfile>>
  }

  try {
    return JSON.parse(window.localStorage.getItem(PROFILE_OVERRIDES_KEY) || '{}') as Record<string, Partial<UserProfile>>
  } catch {
    return {}
  }
}

const setProfileOverrides = (overrides: Record<string, Partial<UserProfile>>) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PROFILE_OVERRIDES_KEY, JSON.stringify(overrides))
}

export const useAuthStore = defineStore('auth', () => {
  const authToken = ref(getStoredToken())
  const userId = ref(getStoredUserId())
  const onboardingRequired = ref(getStoredOnboardingRequired())
  const isAuthenticated = ref(Boolean(authToken.value))
  const currentUser = ref<UserRecord | null>(null)
  const userProfile = ref<UserProfile | null>(null)
  const signUpDraft = ref({
    name: '',
    email: '',
    password: '',
    rememberMe: true,
    acceptedTerms: false,
    is16OrAbove: false,
    signUpDetailsCompleted: false,
    emailVerified: false,
    verificationCode: '',
    verificationSentAt: '',
    accountType: 'default' as 'default' | 'student',
    username: '',
    phone: '',
    state: '',
    country: '',
    location: '',
    headline: '',
    jobTitle: '',
    workplace: '',
    university: '',
    yearStarted: '',
    courseOfStudy: '',
    interests: [] as string[],
    avatar: '' as string | null,
    banner: '' as string | null,
    website: '',
    linkedin: '',
    github: '',
  })

  const authMenuLabel = computed(() => (isAuthenticated.value ? 'Log out' : 'Log in'))

  const persistToken = (token: string) => {
    authToken.value = token
    isAuthenticated.value = Boolean(token)

    if (typeof window !== 'undefined') {
      if (token) {
        window.localStorage.setItem(AUTH_TOKEN_KEY, token)
      } else {
        window.localStorage.removeItem(AUTH_TOKEN_KEY)
      }
    }
  }

  const persistUserId = (id: string) => {
    userId.value = id

    if (typeof window !== 'undefined') {
      if (id) {
        window.localStorage.setItem(AUTH_USER_ID_KEY, id)
      } else {
        window.localStorage.removeItem(AUTH_USER_ID_KEY)
      }
    }
  }

  const setOnboardingRequired = (required: boolean) => {
    onboardingRequired.value = required

    if (typeof window !== 'undefined') {
      if (required) {
        window.localStorage.setItem(ONBOARDING_REQUIRED_KEY, 'true')
      } else {
        window.localStorage.removeItem(ONBOARDING_REQUIRED_KEY)
      }
    }
  }

  const resetUserScopedState = () => {
    currentUser.value = null
    userProfile.value = null
    signUpDraft.value = {
      name: '',
      email: '',
      password: '',
      rememberMe: true,
      acceptedTerms: false,
      is16OrAbove: false,
      signUpDetailsCompleted: false,
      emailVerified: false,
      verificationCode: '',
      verificationSentAt: '',
      accountType: 'default',
      username: '',
      phone: '',
      state: '',
      country: '',
      location: '',
      headline: '',
      jobTitle: '',
      workplace: '',
      university: '',
      yearStarted: '',
      courseOfStudy: '',
      interests: [],
      avatar: '',
      banner: '',
      website: '',
      linkedin: '',
      github: '',
    }
  }

  const setAuthenticatedSession = (token: string, id = '') => {
    const isSwitchingSession =
      Boolean(authToken.value && authToken.value !== token) ||
      Boolean(id && userId.value && userId.value !== id)

    if (isSwitchingSession) {
      resetUserScopedState()
    }

    persistToken(token)
    persistUserId(id)
  }

  const clearAuthenticatedSession = () => {
    persistToken('')
    persistUserId('')
    setOnboardingRequired(false)
    resetUserScopedState()
  }

  const setUserId = (id: string) => {
    if (id && userId.value && userId.value !== id) {
      resetUserScopedState()
    }

    persistUserId(id)
  }

  const setCurrentUser = (user: UserRecord | null) => {
    if (user?.id && userId.value && userId.value !== user.id) {
      resetUserScopedState()
    }

    currentUser.value = user

    if (user?.id) {
      persistUserId(user.id)
    }

    if (typeof user?.name === 'string' && !isLikelyEmail(user.name)) {
      signUpDraft.value.name = user.name
    }

    if (typeof user?.email === 'string') {
      signUpDraft.value.email = user.email
    }

    if (typeof user?.username === 'string') {
      signUpDraft.value.username = user.username
    }
  }

  const setUserProfile = (profile: UserProfile | null) => {
    const override = userId.value ? getProfileOverrides()[userId.value] : null
    const mergedProfile = profile
      ? {
          ...profile,
          ...(override ?? {}),
        }
      : override
        ? { ...override }
        : null

    userProfile.value = mergedProfile
      ? {
          ...mergedProfile,
          location: normalizeProfileLocation(mergedProfile.location),
        }
      : null

    if (userProfile.value?.username) {
      signUpDraft.value.username = userProfile.value.username
    }

    if (userProfile.value?.displayName && !isLikelyEmail(userProfile.value.displayName)) {
      signUpDraft.value.name = userProfile.value.displayName
    }

    if (userProfile.value?.bio) {
      signUpDraft.value.headline = userProfile.value.bio
    }

    signUpDraft.value.location = normalizeProfileLocation(userProfile.value?.location)

    const currentJobTitle =
      userProfile.value?.currentJobTitle ||
      userProfile.value?.current_job_title
    const currentWorkspace =
      userProfile.value?.currentWorkspace ||
      userProfile.value?.current_workspace

    if (currentJobTitle) {
      signUpDraft.value.jobTitle = currentJobTitle
    }

    if (currentWorkspace) {
      signUpDraft.value.workplace = currentWorkspace
    }

    if (userProfile.value?.avatar) {
      signUpDraft.value.avatar = userProfile.value.avatar
    }

    if (userProfile.value?.banner) {
      signUpDraft.value.banner = userProfile.value.banner
    }

    if (userProfile.value?.website) {
      signUpDraft.value.website = userProfile.value.website
    }

    if (userProfile.value?.linkedin) {
      signUpDraft.value.linkedin = userProfile.value.linkedin
    }

    if (userProfile.value?.github) {
      signUpDraft.value.github = userProfile.value.github
    }
  }

  const setUserProfileOverride = (profile: Partial<UserProfile>) => {
    if (!userId.value) {
      return
    }

    const overrides = getProfileOverrides()
    overrides[userId.value] = {
      ...(overrides[userId.value] ?? {}),
      ...profile,
      location: normalizeProfileLocation(profile.location),
    }
    setProfileOverrides(overrides)
    setUserProfile({
      ...(userProfile.value ?? {}),
      ...profile,
    })
  }

  const toggleAuth = () => {
    if (isAuthenticated.value) {
      clearAuthenticatedSession()
      return
    }

    isAuthenticated.value = true
  }

  const resetSignUpDraft = () => {
    signUpDraft.value = {
      name: '',
      email: '',
      password: '',
      rememberMe: true,
      acceptedTerms: false,
      is16OrAbove: false,
      signUpDetailsCompleted: false,
      emailVerified: false,
      verificationCode: '',
      verificationSentAt: '',
      accountType: 'default',
      username: '',
      phone: '',
      state: '',
      country: '',
      location: '',
      headline: '',
      jobTitle: '',
      workplace: '',
      university: '',
      yearStarted: '',
      courseOfStudy: '',
      interests: [],
      avatar: null,
      banner: null,
      website: '',
      linkedin: '',
      github: '',
    }
  }

  return {
    authToken,
    userId,
    currentUser,
    userProfile,
    onboardingRequired,
    isAuthenticated,
    signUpDraft,
    authMenuLabel,
    setAuthenticatedSession,
    clearAuthenticatedSession,
    setUserId,
    setCurrentUser,
    setUserProfile,
    setUserProfileOverride,
    setOnboardingRequired,
    toggleAuth,
    resetSignUpDraft,
  }
})
