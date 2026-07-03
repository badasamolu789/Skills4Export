import { usersService, type MyProfileData, type UserProfile } from '@/services/users'
import type { useAuthStore } from '@/stores/auth'

type AuthStore = ReturnType<typeof useAuthStore>

const toUsername = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/@.*/, '')
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')

const getIdentity = (authStore: AuthStore) => {
  const draft = authStore.signUpDraft
  const displayName = draft.name.trim() || authStore.currentUser?.name?.trim() || ''
  const fallbackId = authStore.userId ? `user_${authStore.userId.slice(0, 8).toLowerCase()}` : ''

  return {
    displayName,
    username:
      draft.username.trim() ||
      authStore.currentUser?.username?.trim() ||
      toUsername(draft.email) ||
      toUsername(displayName) ||
      fallbackId,
  }
}

const hasMatchingEducation = (data: MyProfileData | null, school: string, field: string) =>
  data?.education?.some(
    (item) =>
      item.school?.trim().toLowerCase() === school.toLowerCase() &&
      item.field?.trim().toLowerCase() === field.toLowerCase(),
  ) ?? false

const hasMatchingExperience = (data: MyProfileData | null, company: string, title: string) =>
  data?.experiences?.some(
    (item) =>
      item.company?.trim().toLowerCase() === company.toLowerCase() &&
      item.title?.trim().toLowerCase() === title.toLowerCase(),
  ) ?? false

export const syncSignUpDetailsToProfile = async (authStore: AuthStore) => {
  if (!authStore.userId || !authStore.authToken) {
    throw new Error('We could not identify your account. Please sign in again.')
  }

  const draft = authStore.signUpDraft
  const identity = getIdentity(authStore)
  const location = draft.location.trim() || [draft.state, draft.country].filter(Boolean).join(', ')
  const onboardingTitle = draft.accountType === 'student'
    ? draft.courseOfStudy.trim()
    : draft.jobTitle.trim()
  const existingBio = authStore.userProfile?.bio?.trim() || ''
  const bio = existingBio.toLowerCase() === onboardingTitle.toLowerCase()
    ? ''
    : existingBio
  const profilePayload = {
    username: identity.username,
    displayName: identity.displayName || undefined,
    bio,
    location,
    currentJobTitle: draft.accountType === 'student'
      ? draft.courseOfStudy.trim() || undefined
      : draft.jobTitle.trim() || undefined,
    currentWorkspace: draft.accountType === 'student'
      ? draft.university.trim() || undefined
      : draft.workplace.trim() || undefined,
  }

  if (identity.displayName) {
    const userResponse = await usersService.updateUser(
      authStore.userId,
      {
        name: identity.displayName,
        displayName: identity.displayName,
      },
      authStore.authToken,
    )

    if (userResponse.data?.user) {
      authStore.setCurrentUser(userResponse.data.user)
    }
  }

  const profileResponse = await usersService.saveUserProfile(
    authStore.userId,
    profilePayload,
    Boolean(authStore.userProfile?.id),
    authStore.authToken,
  )
  const responseRecord = profileResponse.data && typeof profileResponse.data === 'object'
    ? profileResponse.data as Record<string, unknown>
    : null
  const responseProfile = responseRecord?.profile && typeof responseRecord.profile === 'object'
    ? responseRecord.profile as Partial<UserProfile>
    : profileResponse.data as Partial<UserProfile> | null
  const savedProfile: Partial<UserProfile> = {
    ...(responseProfile ?? {}),
    ...profilePayload,
  }

  authStore.setUserProfileOverride(savedProfile)
  authStore.signUpDraft.username = identity.username
  authStore.signUpDraft.name = identity.displayName
  authStore.signUpDraft.location = location
  authStore.signUpDraft.headline = bio

  const profileData = (await usersService.getMyProfile(authStore.authToken)).data ?? null

  if (draft.accountType === 'student') {
    const school = draft.university.trim()
    const field = draft.courseOfStudy.trim()

    if (school && field && profileData && !hasMatchingEducation(profileData, school, field)) {
      await usersService.addUserEducation(
        authStore.userId,
        {
          school,
          field,
          startDate: draft.yearStarted ? `${draft.yearStarted}-01-01` : undefined,
        },
        authStore.authToken,
      )
    }
  } else {
    const company = draft.workplace.trim()
    const title = draft.jobTitle.trim()

    if (company && title && profileData && !hasMatchingExperience(profileData, company, title)) {
      await usersService.addUserExperience(
        authStore.userId,
        {
          company,
          title,
          isCurrent: true,
        },
        authStore.authToken,
      )
    }
  }

  return savedProfile
}
