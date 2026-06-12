import { api } from '@/lib/api'
import type { ApiRequestOptions } from '@/lib/api'

export type UserRecord = {
  id?: string
  name?: string | null
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
  displayName?: string
  bio?: string
  description?: string
  about?: string
  aboutMe?: string
  about_me?: string
  location?: string
  avatar?: string | null
  avatarUrl?: string | null
  avatar_url?: string | null
  banner?: string | null
  bannerUrl?: string | null
  banner_url?: string | null
  coverImage?: string | null
  cover_image?: string | null
  coverUrl?: string | null
  cover_url?: string | null
  website?: string
  linkedin?: string
  github?: string
  currentJobTitle?: string | null
  current_job_title?: string | null
  currentWorkspace?: string | null
  current_workspace?: string | null
  createdAt?: string
  [key: string]: unknown
}

export type UserSkillLevel = 'beginner' | 'intermediate' | 'expert'

export type UserSkill = {
  id?: string
  skill?: string
  name?: string
  skillName?: string
  skill_name?: string
  level?: UserSkillLevel | string
  [key: string]: unknown
}

export type UserPortfolio = {
  id?: string
  userId?: string
  title?: string
  description?: string
  link?: string
  pictures?: string[]
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
  isCurrent?: number | boolean
  description?: string
}

export type UserFollower = {
  id?: string
  followerId?: string
  followingId?: string
  createdAt?: string
  follower?: UserRecord | null
  following?: UserRecord | null
  user?: UserRecord | null
  profile?: UserProfile | null
  followerProfile?: UserProfile | null
  followingProfile?: UserProfile | null
  isFollowing?: boolean
  [key: string]: unknown
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
  id?: string
  uuid?: string
  name?: string | null
  email?: string
  location?: string | null
  bio?: string | null
  current_job_title?: string | null
  current_workspace?: string | null
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getStringFromRecord = (record: Record<string, unknown>, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }

    if (isRecord(value)) {
      const nested: string = getStringFromRecord(value, [
        'url',
        'secure_url',
        'secureUrl',
        'imageUrl',
        'image_url',
        'path',
      ])

      if (nested) {
        return nested
      }
    }
  }

  return ''
}

const normalizeUserProfile = (profile?: UserProfile | null): UserProfile | null => {
  if (!profile) {
    return profile ?? null
  }

  const record = profile as Record<string, unknown>
  const avatar = getStringFromRecord(record, [
    'avatar',
    'avatarUrl',
    'avatar_url',
    'avatarImage',
    'avatar_image',
    'profileImage',
    'profile_image',
    'profilePhoto',
    'profile_photo',
  ])
  const banner = getStringFromRecord(record, [
    'banner',
    'bannerUrl',
    'banner_url',
    'coverImage',
    'cover_image',
    'coverUrl',
    'cover_url',
    'cover',
    'headerImage',
    'header_image',
  ])
  const bio = getStringFromRecord(record, [
    'bio',
    'description',
    'about',
    'aboutMe',
    'about_me',
  ])

  return {
    ...profile,
    bio,
    avatar: avatar || profile.avatar || null,
    banner: banner || profile.banner || null,
  }
}

const getProfileFromProfileData = (data?: MyProfileData | null): UserProfile | null => {
  if (!data) {
    return null
  }

  if (data.profile) {
    return data.profile
  }

  const record = data as Record<string, unknown>
  const hasProfileFields = [
    'username',
    'displayName',
    'display_name',
    'bio',
    'description',
    'about',
    'location',
    'avatar',
    'profile_image',
    'currentJobTitle',
    'current_job_title',
    'currentWorkspace',
    'current_workspace',
  ].some((key) => record[key] !== undefined && record[key] !== null)

  if (!hasProfileFields) {
    return null
  }

  const displayName = getStringFromRecord(record, ['displayName', 'display_name', 'name'])
  const avatar = getStringFromRecord(record, ['avatar', 'profile_image', 'profileImage', 'profile_image'])
  const currentJobTitle = getStringFromRecord(record, ['currentJobTitle', 'current_job_title'])
  const currentWorkspace = getStringFromRecord(record, ['currentWorkspace', 'current_workspace'])

  return {
    ...(data as UserProfile),
    userId: getStringFromRecord(record, ['userId', 'user_id', 'uuid']) || data.user?.id,
    ...(displayName ? { displayName } : {}),
    ...(avatar ? { avatar } : {}),
    ...(currentJobTitle ? { currentJobTitle, current_job_title: currentJobTitle } : {}),
    ...(currentWorkspace ? { currentWorkspace, current_workspace: currentWorkspace } : {}),
  }
}

const normalizeSkillLevel = (value: unknown): UserSkillLevel | string | undefined => {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'advanced') {
    return 'expert'
  }

  return normalized
}

const toApiSkillLevel = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined
  }

  const normalized = value.trim().toLowerCase()
  return normalized === 'expert' ? 'advanced' : normalized
}

export const normalizeUserSkill = (skill: unknown): UserSkill => {
  if (typeof skill === 'string') {
    const name = skill.trim()

    return {
      name,
      skill: name,
    }
  }

  if (!isRecord(skill)) {
    return {
      name: '',
      skill: '',
    }
  }

  const record = skill as Record<string, unknown>
  const nestedSkill = isRecord(record.skill) ? record.skill : null
  const nestedName = nestedSkill
    ? getStringFromRecord(nestedSkill, ['name', 'skill', 'title'])
    : typeof record.skill === 'string'
      ? record.skill.trim()
      : ''
  const id =
    getStringFromRecord(record, ['id', 'skillId', 'skill_id', 'uuid']) ||
    (nestedSkill ? getStringFromRecord(nestedSkill, ['id', 'skillId', 'skill_id', 'uuid']) : '')
  const name =
    getStringFromRecord(record, ['name', 'skillName', 'skill_name', 'title', 'label']) ||
    (typeof record.skill === 'string' ? record.skill.trim() : '') ||
    nestedName

  return {
    ...skill,
    ...(id ? { id } : {}),
    name,
    skill: typeof record.skill === 'string' ? record.skill : name,
    level: normalizeSkillLevel(record.level),
  }
}

export const normalizeUserSkills = (...sources: unknown[]): UserSkill[] => {
  const merged: UserSkill[] = []
  const seen = new Set<string>()

  sources.forEach((source) => {
    getSkillListFromValue(source)
      .map(normalizeUserSkill)
      .forEach((skill) => {
        const name = skill.name || skill.skill || ''
        const key = (skill.id || name).toLowerCase()

        if (!name || seen.has(key)) {
          return
        }

        seen.add(key)
        merged.push(skill)
      })
  })

  return merged
}

const normalizeUserSkillResponse = <T extends { data?: UserSkill | null }>(response: T): T => ({
  ...response,
  data: response.data ? normalizeUserSkill(response.data) as T['data'] : response.data,
})

const getSkillListFromValue = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value
  }

  if (!isRecord(value)) {
    return []
  }

  for (const key of ['skills', 'userSkills', 'user_skills', 'data', 'items', 'records', 'results']) {
    if (Array.isArray(value[key])) {
      return value[key] as unknown[]
    }
  }

  for (const key of ['profile', 'user']) {
    const nestedSkills = getSkillListFromValue(value[key])

    if (nestedSkills.length) {
      return nestedSkills
    }
  }

  return []
}

export const collectUserSkills = (...sources: unknown[]): UserSkill[] => {
  for (const source of sources) {
    const skills = normalizeUserSkills(source)

    if (skills.length) {
      return skills
    }
  }

  return []
}

const normalizeUserSkillsListResponse = <T extends { data?: UserSkill[] }>(response: T): T => {
  const skills = normalizeUserSkills(response.data)

  if (skills.length || Array.isArray(response.data)) {
    return {
      ...response,
      data: skills as T['data'],
    }
  }

  return response
}

const normalizeMyProfileResponse = (response: MyProfileResponse): MyProfileResponse => ({
  ...response,
  data: response.data
    ? {
      ...response.data,
      profile: normalizeUserProfile(getProfileFromProfileData(response.data)),
      skills: collectUserSkills(response.data.skills, response.data),
    }
    : response.data,
})

const normalizeUserProfileResponse = <T extends { data?: UserProfile | null }>(response: T): T => ({
  ...response,
  data: normalizeUserProfile(response.data) as T['data'],
})

type UserRequestOptions = Pick<ApiRequestOptions, 'suppressErrorModal' | 'signal'>
type ProfileImageUploadOptions = UserRequestOptions & {
  replace?: boolean
}
type ProfileImageUploadRequest =
  | { publicId: string; imageUrl?: string }
  | { public_id: string; imageUrl?: string }
  | { imageUrl: string }

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
  displayName?: string
  bio?: string
  location?: string
  avatar?: string | null
  banner?: string | null
  website?: string
  linkedin?: string
  github?: string
  currentJobTitle?: string
  current_job_title?: string
  currentWorkspace?: string
  current_workspace?: string
}

export type UpdateUserRequest = {
  name?: string
  displayName?: string
}

export type UpdateUserResponse = {
  success?: boolean
  message?: string
  data?: {
    user?: UserRecord | null
    profile?: UserProfile | null
  } | null
}

// Skills
export type AddUserSkillRequest = {
  skill: string
  level?: UserSkillLevel | string
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
  pictures?: string[]
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
  privacy: '/user/privacy',
  settings: '/user/settings',
  userById: (id: string) => `/users/${id}`,
  userProfile: (id: string) => `/users/${id}/profile`,
  userAvatar: (id: string) => `/users/${id}/profile/avatar`,
  userBanner: (id: string) => `/users/${id}/profile/banner`,
  legacyExperienceById: (id: string) => `/experience/${id}`,
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
  getMyProfile(token?: string | null, options?: UserRequestOptions) {
    return api.get<MyProfileResponse>(USER_ROUTES.myProfile, { token, ...options }).then(normalizeMyProfileResponse)
  },
  getMyStats(token?: string | null, options?: UserRequestOptions) {
    return api.get<MyStatsResponse>(USER_ROUTES.myStats, { token, ...options })
  },
  updatePrivacy(payload: Record<string, unknown>, token?: string | null) {
    return api.put<{ success?: boolean; message?: string; data?: unknown[] }>(USER_ROUTES.privacy, payload, { token })
  },
  updateSettings(payload: Record<string, unknown>, token?: string | null) {
    return api.put<{ success?: boolean; message?: string; data?: Record<string, unknown> }>(USER_ROUTES.settings, payload, { token })
  },
  getUser(id: string, token?: string | null) {
    return api.get<UserResponse>(USER_ROUTES.userById(id), { token })
  },
  createUser(payload: CreateUserRequest, token?: string | null) {
    return api.post<UserResponse>(USER_ROUTES.users, payload, { token })
  },
  updateUser(id: string, payload: UpdateUserRequest, token?: string | null) {
    return api
      .patch<UpdateUserResponse>(USER_ROUTES.userById(id), payload, { token })
      .then((response) => ({
        ...response,
        data: response.data
          ? {
            ...response.data,
            profile: normalizeUserProfile(response.data.profile),
          }
          : response.data,
      }))
  },
  getUserProfile(id: string, token?: string | null) {
    return api
      .get<UserProfileResponse>(USER_ROUTES.userProfile(id), { token })
      .then(normalizeMyProfileResponse)
  },
  createUserProfile(
    id: string,
    payload: UpsertUserProfileRequest,
    token?: string | null,
    options?: UserRequestOptions,
  ) {
    return api
      .post<UpsertUserProfileResponse>(USER_ROUTES.userProfile(id), payload, { token, ...options })
      .then(normalizeUserProfileResponse)
  },
  updateUserProfile(
    id: string,
    payload: UpsertUserProfileRequest,
    token?: string | null,
    options?: UserRequestOptions,
  ) {
    return api
      .post<UpsertUserProfileResponse>(USER_ROUTES.userProfile(id), payload, { token, ...options })
      .then(normalizeUserProfileResponse)
  },
  uploadUserAvatar(
    id: string,
    body: ProfileImageUploadRequest,
    token?: string | null,
    options?: ProfileImageUploadOptions,
  ) {
    const endpoint = options?.replace
      ? `${USER_ROUTES.userAvatar(id)}?replace=true`
      : USER_ROUTES.userAvatar(id)

    return api.post<BackgroundUploadResponse>(endpoint, body, {
      token,
      suppressErrorModal: options?.suppressErrorModal,
      signal: options?.signal,
    })
  },
  uploadUserBanner(
    id: string,
    body: ProfileImageUploadRequest,
    token?: string | null,
    options?: ProfileImageUploadOptions,
  ) {
    const endpoint = options?.replace
      ? `${USER_ROUTES.userBanner(id)}?replace=true`
      : USER_ROUTES.userBanner(id)

    return api.post<BackgroundUploadResponse>(endpoint, body, {
      token,
      suppressErrorModal: options?.suppressErrorModal,
      signal: options?.signal,
    })
  },

  // ========================================================================
  // Skills
  // ========================================================================

  /**
   * List all skills for a user
   * @param userId - The user ID
   * @param token - Optional authorization token
   * @param options - Optional API request options
   */
  listUserSkills(userId: string, token?: string | null, options?: ApiRequestOptions) {
    return api
      .get<UserSkillsListResponse>(USER_ROUTES.userSkills(userId), { token, ...options })
      .then(normalizeUserSkillsListResponse)
  },

  /**
   * Add a skill to a user's profile
   * @param userId - The user ID
   * @param payload - The skill data (skill name and optional level)
   * @param token - Optional authorization token
   */
  addUserSkill(
    userId: string,
    payload: AddUserSkillRequest,
    token?: string | null,
    options?: UserRequestOptions,
  ) {
    const apiLevel = toApiSkillLevel(payload.level)
    const requestPayload = {
      ...payload,
      ...(apiLevel ? { level: apiLevel } : {}),
    }

    return api
      .post<UserSkillResponse>(USER_ROUTES.userSkills(userId), requestPayload, { token, ...options })
      .then(normalizeUserSkillResponse)
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
   * @param options - Optional API request options
   */
  listUserPortfolios(userId: string, token?: string | null, options?: ApiRequestOptions) {
    return api.get<UserPortfoliosListResponse>(USER_ROUTES.userPortfolios(userId), { token, ...options })
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
   * @param options - Optional API request options
   */
  listUserCertifications(userId: string, token?: string | null, options?: ApiRequestOptions) {
    return api.get<UserCertificationsListResponse>(USER_ROUTES.userCertifications(userId), { token, ...options })
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
   * @param options - Optional API request options
   */
  listUserEducations(userId: string, token?: string | null, options?: ApiRequestOptions) {
    return api.get<UserEducationsListResponse>(USER_ROUTES.userEducations(userId), { token, ...options })
  },

  /**
   * Add an education record to a user's profile
   * @param userId - The user ID
   * @param payload - The education data
   * @param token - Optional authorization token
   */
  addUserEducation(
    userId: string,
    payload: AddUserEducationRequest,
    token?: string | null,
    options?: UserRequestOptions,
  ) {
    return api.post<UserEducationResponse>(USER_ROUTES.userEducations(userId), payload, {
      token,
      ...options,
    })
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
   * @param options - Optional API request options
   */
  listUserExperiences(userId: string, token?: string | null, options?: ApiRequestOptions) {
    return api.get<UserExperiencesListResponse>(USER_ROUTES.userExperiences(userId), { token, ...options })
  },

  /**
   * Add an experience record to a user's profile
   * @param userId - The user ID
   * @param payload - The experience data
   * @param token - Optional authorization token
   */
  addUserExperience(
    userId: string,
    payload: AddUserExperienceRequest,
    token?: string | null,
    options?: UserRequestOptions,
  ) {
    return api.post<UserExperienceResponse>(USER_ROUTES.userExperiences(userId), payload, {
      token,
      ...options,
    })
  },

  updateUserExperience(userId: string, experienceId: string, payload: AddUserExperienceRequest, token?: string | null) {
    return api.put<UserExperienceResponse>(
      USER_ROUTES.legacyExperienceById(experienceId),
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
   * @param options - Optional API request options
   */
  listFollowers(userId: string, token?: string | null, options?: ApiRequestOptions) {
    return api.get<FollowersListResponse>(USER_ROUTES.userFollowers(userId), { token, ...options })
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
