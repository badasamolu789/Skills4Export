import { api } from '@/lib/api'

export type UserRecord = {
  id?: string
  email?: string
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

const USER_ROUTES = {
  users: '/users',
  myProfile: '/user/profile/me',
  myStats: '/user/stats/me',
  userById: (id: string) => `/users/${id}`,
  userProfile: (id: string) => `/users/${id}/profile`,
  userAvatar: (id: string) => `/users/${id}/profile/avatar`,
  userBanner: (id: string) => `/users/${id}/profile/banner`,
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
    return api.post<UserProfileResponse>(USER_ROUTES.userProfile(id), payload, { token })
  },
  updateUserProfile(id: string, payload: UpsertUserProfileRequest, token?: string | null) {
    return api.put<UserProfileResponse>(USER_ROUTES.userProfile(id), payload, { token })
  },
  uploadUserAvatar(id: string, body: { url: string }, token?: string | null) {
    return api.post<BackgroundUploadResponse>(USER_ROUTES.userAvatar(id), body, { token })
  },
  uploadUserBanner(id: string, body: { url: string }, token?: string | null) {
    return api.post<BackgroundUploadResponse>(USER_ROUTES.userBanner(id), body, { token })
  },
}
