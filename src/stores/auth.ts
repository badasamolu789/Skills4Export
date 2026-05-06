import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserProfile } from '@/services/users'

const AUTH_TOKEN_KEY = 'skills4export-auth-token'
const AUTH_USER_ID_KEY = 'skills4export-user-id'

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

export const useAuthStore = defineStore('auth', () => {
  const authToken = ref(getStoredToken())
  const userId = ref(getStoredUserId())
  const isAuthenticated = ref(Boolean(authToken.value))
  const userProfile = ref<UserProfile | null>(null)
  const signUpDraft = ref({
    name: '',
    email: '',
    password: '',
    rememberMe: true,
    acceptedTerms: false,
    emailVerified: false,
    verificationCode: '',
    verificationSentAt: '',
    username: '',
    phone: '',
    location: '',
    headline: '',
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

  const setAuthenticatedSession = (token: string, id = '') => {
    persistToken(token)
    persistUserId(id)
  }

  const clearAuthenticatedSession = () => {
    persistToken('')
    persistUserId('')
    userProfile.value = null
  }

  const setUserId = (id: string) => {
    persistUserId(id)
  }

  const setUserProfile = (profile: UserProfile | null) => {
    userProfile.value = profile

    if (profile?.username) {
      signUpDraft.value.username = profile.username
    }

    if (profile?.bio) {
      signUpDraft.value.headline = profile.bio
    }

    if (profile?.location) {
      signUpDraft.value.location = profile.location
    }

    if (profile?.avatar) {
      signUpDraft.value.avatar = profile.avatar
    }

    if (profile?.banner) {
      signUpDraft.value.banner = profile.banner
    }

    if (profile?.website) {
      signUpDraft.value.website = profile.website
    }

    if (profile?.linkedin) {
      signUpDraft.value.linkedin = profile.linkedin
    }

    if (profile?.github) {
      signUpDraft.value.github = profile.github
    }
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
      emailVerified: false,
      verificationCode: '',
      verificationSentAt: '',
      username: '',
      phone: '',
      location: '',
      headline: '',
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
    userProfile,
    isAuthenticated,
    signUpDraft,
    authMenuLabel,
    setAuthenticatedSession,
    clearAuthenticatedSession,
    setUserId,
    setUserProfile,
    toggleAuth,
    resetSignUpDraft,
  }
})
