import { api } from '@/lib/api'

export type UserRecord = {
  id?: string
  email?: string
  username?: string | null
  role?: string | null
  created_at?: string
  [key: string]: unknown
}

export type UserProfile = {
  id?: string
  userId?: string
  username?: string
  bio?: string
  location?: string
  avatar?: string | null
  banner?: string | null
  website?: string
  linkedin?: string
  github?: string
  createdAt?: string
}

export type UserSkill = {
  id?: string
  skill?: string
  name?: string
  level?: 'beginner' | 'intermediate' | 'expert' | string
}

export type UserPortfolio = {
  id?: string
  userId?: string
  title?: string
  description?: string
  link?: string
}

export type UserCertification = {
  id?: string
  userId?: string
  name?: string
  issuer?: string
  issueDate?: string
}

export type UserEducation = {
  id?: string
  userId?: string
  school?: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string | null
}

export type UserExperience = {
  id?: string
  userId?: string
  company?: string
  title?: string
  employmentType?: string
  startDate?: string
  endDate?: string | null
  isCurrent?: number
  description?: string
}

export type UserFollower = {
  id?: string
  followerId?: string
  followingId?: string
  createdAt?: string
}

export type UserOauthAccount = {
  id?: string
  userId?: string
  provider?: string
  providerId?: string
  providerEmail?: string | null
  avatarUrl?: string | null
}

export type MyProfileData = {
  user?: UserRecord | null
  profile?: UserProfile | null
  skills?: UserSkill[]
  portfolios?: UserPortfolio[]
  certifications?: UserCertification[]
  education?: UserEducation[]
  experiences?: UserExperience[]
  followers?: UserFollower[]
  oauthAccounts?: UserOauthAccount[]
}

export type MyProfileResponse = {
  success?: boolean
  message?: string
  data?: MyProfileData | null
}

export type MyStats = {
  pages?: number
  communities?: number
  posts?: number
  comments?: number
}

export type MyStatsResponse = {
  success?: boolean
  data?: MyStats | null
}

export type BackgroundUploadResponse = {
  success?: boolean
  data?: {
    jobId?: string
  } | null
}

export type UserResponse = {
  success?: boolean
  data?: UserRecord | null
}

export type UserProfileResponse = {
  success?: boolean
  message?: string
  data?: MyProfileData | null
}

export type UpsertUserProfileResponse = {
  success?: boolean
  data?: UserProfile | null
}

export type CreateUserRequest = {
  email: string
  password: string
}

export type UpsertUserProfileRequest = {
  username?: string
  bio?: string
  location?: string
  avatar?: string | null
  banner?: string | null
  website?: string
  linkedin?: string
  github?: string
}

// Skills
export type AddUserSkillRequest = {
  skill: string
  level?: string
}

export type UserSkillResponse = {
  success: boolean
  data: UserSkill
}

export type UserSkillsListResponse = {
  success: boolean
  data: UserSkill[]
}

export type DeleteUserSkillResponse = {
  success: boolean
  data: {
    id: string
  }
}

// Portfolios
export type AddUserPortfolioRequest = {
  title: string
  description?: string
  link?: string
}

export type UserPortfolioResponse = {
  success: boolean
  data: UserPortfolio
}

export type UserPortfoliosListResponse = {
  success: boolean
  data: UserPortfolio[]
}

export type DeleteUserPortfolioResponse = {
  success: boolean
  data: {
    id: string
  }
}

// Certifications
export type AddUserCertificationRequest = {
  name: string
  issuer?: string
  issueDate?: string
}

export type UserCertificationResponse = {
  success: boolean
  data: UserCertification
}

export type UserCertificationsListResponse = {
  success: boolean
  data: UserCertification[]
}

export type DeleteUserCertificationResponse = {
  success: boolean
  data: {
    id: string
  }
}

// Education
export type AddUserEducationRequest = {
  school: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string | null
}

export type UserEducationResponse = {
  success: boolean
  data: UserEducation
}

export type UserEducationsListResponse = {
  success: boolean
  data: UserEducation[]
}

export type DeleteUserEducationResponse = {
  success: boolean
  data: {
    id: string
  }
}

// Experience
export type AddUserExperienceRequest = {
  company: string
  title: string
  employmentType?: string
  startDate?: string
  endDate?: string | null
  isCurrent?: boolean
  description?: string
}

export type UserExperienceResponse = {
  success: boolean
  data: UserExperience
}

export type UserExperiencesListResponse = {
  success: boolean
  data: UserExperience[]
}

export type DeleteUserExperienceResponse = {
  success: boolean
  data: {
    id: string
  }
}

// Follow/Followers
export type FollowUserRequest = {
  followerId?: string
}

export type FollowUserResponse = {
  success: boolean
  data: Record<string, unknown>
}

export type FollowersListResponse = {
  success: boolean
  data: UserFollower[]
}

// Login History
export type LoginHistoryRecord = {
  id?: string
  userId?: string
  loginMethod?: string | null
  ipAddress?: string
  loginAt?: string
  [key: string]: unknown
}

export type LoginHistoryResponse = {
  success: boolean
  data: LoginHistoryRecord[]
}

const USER_ROUTES = {
  users: '/users',
  myProfile: '/user/profile/me',
  myStats: '/user/stats/me',
  userById: (id: string) => `/users/${id}`,
  userProfile: (id: string) => `/users/${id}/profile`,
  userAvatar: (id: string) => `/users/${id}/profile/avatar`,
  userBanner: (id: string) => `/users/${id}/profile/banner`,
  // Skills
  userSkills: (id: string) => `/users/${id}/skills`,
  userSkillById: (id: string, skillId: string) => `/users/${id}/skills/${skillId}`,
  // Portfolios
  userPortfolios: (id: string) => `/users/${id}/portfolios`,
  userPortfolioById: (id: string, portfolioId: string) => `/users/${id}/portfolios/${portfolioId}`,
  // Certifications
  userCertifications: (id: string) => `/users/${id}/certifications`,
  userCertificationById: (id: string, certificationId: string) => `/users/${id}/certifications/${certificationId}`,
  // Education
  userEducations: (id: string) => `/users/${id}/education`,
  userEducationById: (id: string, educationId: string) => `/users/${id}/education/${educationId}`,
  // Experience
  userExperiences: (id: string) => `/users/${id}/experiences`,
  userExperienceById: (id: string, experienceId: string) => `/users/${id}/experiences/${experienceId}`,
  // Follow
  userFollow: (id: string) => `/users/${id}/follow`,
  userFollowers: (id: string) => `/users/${id}/followers`,
  // Login History
  userLoginHistory: (id: string) => `/users/${id}/login-history`,
} as const

export const usersService = {
  getMyProfile(token?: string | null) {
    return api.get<MyProfileResponse>(USER_ROUTES.myProfile, { token })
  },
  getMyStats(token?: string | null) {
    return api.get<MyStatsResponse>(USER_ROUTES.myStats, { token })
  },
  getUser(id: string, token?: string | null) {
    return api.get<UserResponse>(USER_ROUTES.userById(id), { token })
  },
  createUser(payload: CreateUserRequest, token?: string | null) {
    return api.post<UserResponse>(USER_ROUTES.users, payload, { token })
  },
  getUserProfile(id: string, token?: string | null) {
    return api.get<UserProfileResponse>(USER_ROUTES.userProfile(id), { token })
  },
  createUserProfile(id: string, payload: UpsertUserProfileRequest, token?: string | null) {
    return api.post<UpsertUserProfileResponse>(USER_ROUTES.userProfile(id), payload, { token })
  },
  updateUserProfile(id: string, payload: UpsertUserProfileRequest, token?: string | null) {
    return api.put<UpsertUserProfileResponse>(USER_ROUTES.userProfile(id), payload, { token })
  },
  uploadUserAvatar(
    id: string,
    body: { url: string },
    token?: string | null,
    options?: { replace?: boolean },
  ) {
    const endpoint = options?.replace
      ? `${USER_ROUTES.userAvatar(id)}?replace=true`
      : USER_ROUTES.userAvatar(id)

    return api.post<BackgroundUploadResponse>(endpoint, body, { token })
  },
  uploadUserBanner(
    id: string,
    body: { url: string },
    token?: string | null,
    options?: { replace?: boolean },
  ) {
    const endpoint = options?.replace
      ? `${USER_ROUTES.userBanner(id)}?replace=true`
      : USER_ROUTES.userBanner(id)

    return api.post<BackgroundUploadResponse>(endpoint, body, { token })
  },

  // ========================================================================
  // Skills
  // ========================================================================

  /**
   * List all skills for a user
   * @param userId - The user ID
   * @param token - Optional authorization token
   */
  listUserSkills(userId: string, token?: string | null) {
    return api.get<UserSkillsListResponse>(USER_ROUTES.userSkills(userId), { token })
  },

  /**
   * Add a skill to a user's profile
   * @param userId - The user ID
   * @param payload - The skill data (skill name and optional level)
   * @param token - Optional authorization token
   */
  addUserSkill(userId: string, payload: AddUserSkillRequest, token?: string | null) {
    return api.post<UserSkillResponse>(USER_ROUTES.userSkills(userId), payload, { token })
  },

  /**
   * Delete a skill from a user's profile
   * @param userId - The user ID
   * @param skillId - The skill ID
   * @param token - Optional authorization token
   */
  deleteUserSkill(userId: string, skillId: string, token?: string | null) {
    return api.delete<DeleteUserSkillResponse>(USER_ROUTES.userSkillById(userId, skillId), { token })
  },

  // ========================================================================
  // Portfolios
  // ========================================================================

  /**
   * List all portfolios for a user
   * @param userId - The user ID
   * @param token - Optional authorization token
   */
  listUserPortfolios(userId: string, token?: string | null) {
    return api.get<UserPortfoliosListResponse>(USER_ROUTES.userPortfolios(userId), { token })
  },

  /**
   * Add a portfolio item to a user's profile
   * @param userId - The user ID
   * @param payload - The portfolio data (title, description, link)
   * @param token - Optional authorization token
   */
  addUserPortfolio(userId: string, payload: AddUserPortfolioRequest, token?: string | null) {
    return api.post<UserPortfolioResponse>(USER_ROUTES.userPortfolios(userId), payload, { token })
  },

  /**
   * Delete a portfolio item from a user's profile
   * @param userId - The user ID
   * @param portfolioId - The portfolio ID
   * @param token - Optional authorization token
   */
  deleteUserPortfolio(userId: string, portfolioId: string, token?: string | null) {
    return api.delete<DeleteUserPortfolioResponse>(
      USER_ROUTES.userPortfolioById(userId, portfolioId),
      { token },
    )
  },

  // ========================================================================
  // Certifications
  // ========================================================================

  /**
   * List all certifications for a user
   * @param userId - The user ID
   * @param token - Optional authorization token
   */
  listUserCertifications(userId: string, token?: string | null) {
    return api.get<UserCertificationsListResponse>(USER_ROUTES.userCertifications(userId), { token })
  },

  /**
   * Add a certification to a user's profile
   * @param userId - The user ID
   * @param payload - The certification data
   * @param token - Optional authorization token
   */
  addUserCertification(userId: string, payload: AddUserCertificationRequest, token?: string | null) {
    return api.post<UserCertificationResponse>(USER_ROUTES.userCertifications(userId), payload, { token })
  },

  /**
   * Delete a certification from a user's profile
   * @param userId - The user ID
   * @param certificationId - The certification ID
   * @param token - Optional authorization token
   */
  deleteUserCertification(userId: string, certificationId: string, token?: string | null) {
    return api.delete<DeleteUserCertificationResponse>(USER_ROUTES.userCertificationById(userId, certificationId), { token })
  },

  // ========================================================================
  // Education
  // ========================================================================

  /**
   * List all education records for a user
   * @param userId - The user ID
   * @param token - Optional authorization token
   */
  listUserEducations(userId: string, token?: string | null) {
    return api.get<UserEducationsListResponse>(USER_ROUTES.userEducations(userId), { token })
  },

  /**
   * Add an education record to a user's profile
   * @param userId - The user ID
   * @param payload - The education data
   * @param token - Optional authorization token
   */
  addUserEducation(userId: string, payload: AddUserEducationRequest, token?: string | null) {
    return api.post<UserEducationResponse>(USER_ROUTES.userEducations(userId), payload, { token })
  },

  /**
   * Delete an education record from a user's profile
   * @param userId - The user ID
   * @param educationId - The education ID
   * @param token - Optional authorization token
   */
  deleteUserEducation(userId: string, educationId: string, token?: string | null) {
    return api.delete<DeleteUserEducationResponse>(USER_ROUTES.userEducationById(userId, educationId), { token })
  },

  // ========================================================================
  // Experience
  // ========================================================================

  /**
   * List all experience records for a user
   * @param userId - The user ID
   * @param token - Optional authorization token
   */
  listUserExperiences(userId: string, token?: string | null) {
    return api.get<UserExperiencesListResponse>(USER_ROUTES.userExperiences(userId), { token })
  },

  /**
   * Add an experience record to a user's profile
   * @param userId - The user ID
   * @param payload - The experience data
   * @param token - Optional authorization token
   */
  addUserExperience(userId: string, payload: AddUserExperienceRequest, token?: string | null) {
    return api.post<UserExperienceResponse>(USER_ROUTES.userExperiences(userId), payload, { token })
  },

  updateUserExperience(userId: string, experienceId: string, payload: AddUserExperienceRequest, token?: string | null) {
    return api.put<UserExperienceResponse>(
      USER_ROUTES.userExperienceById(userId, experienceId),
      payload,
      { token },
    )
  },

  /**
   * Delete an experience record from a user's profile
   * @param userId - The user ID
   * @param experienceId - The experience ID
   * @param token - Optional authorization token
   */
  deleteUserExperience(userId: string, experienceId: string, token?: string | null) {
    return api.delete<DeleteUserExperienceResponse>(USER_ROUTES.userExperienceById(userId, experienceId), { token })
  },

  /**
   * Follow a user
   * @param userId - The user ID to follow
   * @param payload - Optional follower data
   * @param token - Optional authorization token
   */
  followUser(userId: string, payload?: FollowUserRequest, token?: string | null) {
    return api.post<FollowUserResponse>(USER_ROUTES.userFollow(userId), payload || {}, { token })
  },

  /**
   * Unfollow a user
   * @param userId - The user ID to unfollow
   * @param token - Optional authorization token
   */
  unfollowUser(userId: string, token?: string | null) {
    return api.delete<FollowUserResponse>(USER_ROUTES.userFollow(userId), { token })
  },

  /**
   * Get list of followers for a user
   * @param userId - The user ID
   * @param token - Optional authorization token
   */
  listFollowers(userId: string, token?: string | null) {
    return api.get<FollowersListResponse>(USER_ROUTES.userFollowers(userId), { token })
  },

  // ========================================================================
  // Login History
  // ========================================================================

  /**
   * Get login history for a user
   * @param userId - The user ID
   * @param token - Optional authorization token
   */
  getLoginHistory(userId: string, token?: string | null) {
    return api.get<LoginHistoryResponse>(USER_ROUTES.userLoginHistory(userId), { token })
  },
}
