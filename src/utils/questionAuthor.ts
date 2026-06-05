import { collectUserSkills, usersService, type MyProfileData } from '@/services/users'

export const loadQuestionAuthorProfile = async (
  userId: string,
  currentUserId?: string | null,
  currentUserProfile?: MyProfileData | null,
  token?: string | null,
) => {
  if (!userId) return null

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

  if (userId === currentUserId) {
    return currentUserProfile ?? null
  }

  return null
}
