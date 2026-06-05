import { computed } from 'vue'
import type { MyProfileData } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { getDisplayName } from '@/utils/displayName'

const getFirstFilled = (...values: Array<string | null | undefined>) =>
  values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? ''

const getRecordString = (source: unknown, keys: string[]) => {
  if (!source || typeof source !== 'object') {
    return ''
  }

  const record = source as Record<string, unknown>
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

const jobTitleKeys = [
  'jobTitle',
  'job_title',
  'currentJobTitle',
  'current_job_title',
  'profession',
  'occupation',
  'title',
  'headline',
]

export const getProfileDisplayName = (profile?: MyProfileData | null) =>
  getDisplayName(
    profile?.user?.name,
    profile?.profile?.displayName,
    (profile?.profile as Record<string, unknown> | null | undefined)?.display_name as string | undefined,
    (profile as Record<string, unknown> | null | undefined)?.displayName as string | undefined,
    (profile as Record<string, unknown> | null | undefined)?.display_name as string | undefined,
    profile?.profile?.username,
    profile?.user?.username,
  )

export const getProfileSkills = (profile?: MyProfileData | null) =>
  profile?.skills
    ?.map((skill) => (skill.name || skill.skill || '').trim())
    .filter(Boolean)
    .slice(0, 3) ?? []

export const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CM'

export const useCurrentUserIdentity = () => {
  const authStore = useAuthStore()

  const displayName = computed(() =>
    getDisplayName(
      authStore.signUpDraft.name,
      authStore.currentUser?.name,
      authStore.userProfile?.displayName,
      authStore.userProfile?.username,
      authStore.signUpDraft.username,
    ) || 'Member',
  )

  const avatarSrc = computed(() => authStore.userProfile?.avatar || authStore.signUpDraft.avatar || '')
  const initials = computed(() => getInitials(displayName.value))
  const role = computed(() =>
    getFirstFilled(
      authStore.signUpDraft.jobTitle,
      getRecordString(authStore.userProfile, jobTitleKeys),
      getRecordString(authStore.currentUser, jobTitleKeys),
      authStore.signUpDraft.headline,
      'Member',
    ),
  )
  const profilePath = computed(() => (authStore.userId ? `/profile/view/${authStore.userId}` : '/profile'))
  const skills = computed(() => authStore.signUpDraft.interests.slice(0, 3))

  const profileData = computed(() => ({
    user: {
      id: authStore.userId,
      name: displayName.value,
      username: authStore.userProfile?.username || authStore.signUpDraft.username || displayName.value,
      email: authStore.signUpDraft.email,
    },
    profile: authStore.userProfile,
  }))

  return {
    displayName,
    avatarSrc,
    initials,
    role,
    profilePath,
    skills,
    profileData,
  }
}
