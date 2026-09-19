import { computed } from 'vue'
import type { MyProfileData } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { getDisplayName, toInitialCaps } from '@/utils/displayName'

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
]

const workplaceKeys = [
  'workplace',
  'currentWorkplace',
  'current_workplace',
  'company',
  'companyName',
  'company_name',
  'organization',
  'organisation',
  'employer',
]

const studentInstitutionKeys = [
  'institutionOfStudy',
  'institution_of_study',
  'university',
  'school',
]

const courseOfStudyKeys = [
  'courseOfStudy',
  'course_of_study',
  'field',
]

export const getProfileDisplayName = (profile?: MyProfileData | null) =>
  toInitialCaps(getDisplayName(
    profile?.user?.name,
    profile?.profile?.displayName,
    (profile?.profile as Record<string, unknown> | null | undefined)?.display_name as string | undefined,
    (profile as Record<string, unknown> | null | undefined)?.displayName as string | undefined,
    (profile as Record<string, unknown> | null | undefined)?.display_name as string | undefined,
    profile?.profile?.username,
    profile?.user?.username,
  ))

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
    .toUpperCase()

export const useCurrentUserIdentity = () => {
  const authStore = useAuthStore()

  const displayName = computed(() =>
    toInitialCaps(getDisplayName(
      authStore.signUpDraft.name,
      authStore.currentUser?.name,
      authStore.userProfile?.displayName,
      authStore.userProfile?.username,
      authStore.signUpDraft.username,
    )),
  )

  const avatarSrc = computed(() => authStore.userProfile?.avatar || authStore.signUpDraft.avatar || '')
  const initials = computed(() => getInitials(displayName.value))
  const currentTitle = computed(() =>
    toInitialCaps(getFirstFilled(
      authStore.signUpDraft.jobTitle,
      getRecordString(authStore.userProfile, jobTitleKeys),
      getRecordString(authStore.currentUser, jobTitleKeys),
    ), { keepSmallWords: true }),
  )
  const currentWorkplace = computed(() =>
    toInitialCaps(getFirstFilled(
      authStore.signUpDraft.workplace,
      getRecordString(authStore.userProfile, workplaceKeys),
      getRecordString(authStore.currentUser, workplaceKeys),
    ), { keepSmallWords: true }),
  )
  const isStudent = computed(() =>
    authStore.signUpDraft.accountType === 'student' ||
    getRecordString(authStore.userProfile, ['accountType', 'account_type']).toLowerCase() === 'student' ||
    Boolean(authStore.signUpDraft.university || authStore.signUpDraft.courseOfStudy),
  )
  const studentInstitution = computed(() =>
    toInitialCaps(getFirstFilled(
      authStore.signUpDraft.university,
      getRecordString(authStore.userProfile, studentInstitutionKeys),
      getRecordString(authStore.currentUser, studentInstitutionKeys),
    ), { keepSmallWords: true }),
  )
  const courseOfStudy = computed(() =>
    toInitialCaps(getFirstFilled(
      authStore.signUpDraft.courseOfStudy,
      getRecordString(authStore.userProfile, courseOfStudyKeys),
      getRecordString(authStore.currentUser, courseOfStudyKeys),
    ), { keepSmallWords: true }),
  )
  const explicitDisplayTitle = computed(() =>
    getFirstFilled(
      getRecordString(authStore.userProfile, ['displayTitle', 'display_title']),
      getRecordString(authStore.currentUser, ['displayTitle', 'display_title']),
    ),
  )
  const displayTitle = computed(() => {
    if (explicitDisplayTitle.value) {
      return explicitDisplayTitle.value
    }

    return isStudent.value
      ? [courseOfStudy.value, studentInstitution.value].filter(Boolean).join(' | ')
      : currentTitle.value && currentWorkplace.value
        ? `${currentTitle.value} at ${currentWorkplace.value}`
        : [currentTitle.value, currentWorkplace.value].filter(Boolean).join('')
  })
  const role = computed(() => displayTitle.value)
  const profilePath = computed(() => (authStore.userId ? `/profile/view/${authStore.userId}` : '/profile'))
  const skills = computed(() => authStore.signUpDraft.interests.slice(0, 3))

  const profileData = computed(() => ({
    user: {
      id: authStore.userId,
      name: displayName.value,
      username: authStore.userProfile?.username || authStore.signUpDraft.username || displayName.value,
      email: authStore.signUpDraft.email,
    },
    profile: {
      ...(authStore.userProfile ?? {}),
      displayTitle: displayTitle.value,
      display_title: displayTitle.value,
      ...(isStudent.value
        ? {
            accountType: 'student',
            account_type: 'student',
            institutionOfStudy: studentInstitution.value,
            institution_of_study: studentInstitution.value,
            university: studentInstitution.value,
            courseOfStudy: courseOfStudy.value,
            course_of_study: courseOfStudy.value,
          }
        : {
            currentJobTitle: currentTitle.value,
            current_job_title: currentTitle.value,
            currentWorkspace: currentWorkplace.value,
            current_workspace: currentWorkplace.value,
          }),
    },
  }))

  return {
    displayName,
    avatarSrc,
    initials,
    role,
    displayTitle,
    currentTitle,
    currentWorkplace,
    studentInstitution,
    courseOfStudy,
    profilePath,
    skills,
    profileData,
  }
}
