import { collectUserSkills, usersService, type MyProfileData } from '@/services/users'

const AUTHOR_CACHE_TTL_MS = 5 * 60 * 1000
const authorCache = new Map<string, {
  expiresAt: number
  value: Promise<MyProfileData | null>
}>()

export const loadQuestionAuthorProfile = async (
  userId: string,
  currentUserId?: string | null,
  currentUserProfile?: MyProfileData | null,
  token?: string | null,
) => {
  if (!userId) return null

  if (userId === currentUserId && currentUserProfile) {
    return currentUserProfile
  }

  const cached = authorCache.get(userId)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value
  }

  const value = (async () => {
    const [profileResponse, userResponse, skillsResponse] = await Promise.all([
      usersService.getUserProfile(userId, token).catch(() => null),
      usersService.getUser(userId, token).catch(() => null),
      usersService.listUserSkills(userId, token, { suppressErrorModal: true }).catch(() => null),
    ])

    if (profileResponse?.data) {
      return {
        ...profileResponse.data,
        user: {
          ...(profileResponse.data.user ?? {}),
          ...(userResponse?.data ?? {}),
        },
        skills: collectUserSkills(
          skillsResponse?.data,
          profileResponse.data.skills,
          profileResponse.data,
          userResponse?.data,
        ),
      }
    }

    if (userResponse?.data) {
      return {
        user: userResponse.data,
        skills: collectUserSkills(skillsResponse?.data, userResponse.data),
      }
    }

    return null
  })()

  authorCache.set(userId, {
    expiresAt: Date.now() + AUTHOR_CACHE_TTL_MS,
    value,
  })

  return value
}
