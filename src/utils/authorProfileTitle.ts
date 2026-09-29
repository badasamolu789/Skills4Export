import { usersService } from '@/services/users'
import { getAuthorProfileDisplayTitle } from '@/utils/profileContextTag'

export const AUTHOR_PROFILE_TITLE_UPDATED = 'skills4export:author-profile-title-updated'

const CACHE_MS = 2 * 60 * 1000
const requests = new Map<string, { expiresAt: number; request: Promise<string> }>()

export const loadAuthorProfileTitle = (userId: string, token?: string | null) => {
  const cached = requests.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.request

  const request = usersService.getUserProfile(userId, token)
    .then((response) => getAuthorProfileDisplayTitle(response.data))
    .catch((error) => {
      requests.delete(userId)
      throw error
    })
  requests.set(userId, { expiresAt: Date.now() + CACHE_MS, request })
  return request
}

export const publishAuthorProfileTitle = (userId: string, title: string) => {
  requests.set(userId, { expiresAt: Date.now() + CACHE_MS, request: Promise.resolve(title) })
  window.dispatchEvent(new CustomEvent(AUTHOR_PROFILE_TITLE_UPDATED, { detail: { userId, title } }))
}
