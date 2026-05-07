import { computed } from 'vue'
import type { MyProfileData } from '@/services/users'
import { useAuthStore } from '@/stores/auth'

const getFirstFilled = (...values: Array<string | null | undefined>) =>
  values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? ''

export const getProfileDisplayName = (profile?: MyProfileData | null) =>
  getFirstFilled(
    profile?.user?.name,
    profile?.profile?.username,
    profile?.user?.username,
    profile?.user?.email?.split('@')[0],
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
    getFirstFilled(
      authStore.signUpDraft.name,
      authStore.userProfile?.username,
      authStore.signUpDraft.username,
      authStore.signUpDraft.email.split('@')[0],
      'Member',
    ),
  )

  const avatarSrc = computed(() => authStore.userProfile?.avatar || authStore.signUpDraft.avatar || '')
  const initials = computed(() => getInitials(displayName.value))
  const role = computed(() => getFirstFilled(authStore.signUpDraft.headline, 'Community member'))
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
