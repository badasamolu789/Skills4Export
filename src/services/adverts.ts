import { api } from '@/lib/api'

export type AdvertStatus =
  | 'pending_review'
  | 'approved'
  | 'active'
  | 'expired'
  | 'suspended'
  | 'deleted'

export type AdvertLocation = {
  id?: string
  name?: string
  status?: string
  [key: string]: unknown
}

export type AdvertSite = {
  id?: string
  name?: string
  status?: string
  [key: string]: unknown
}

export type AdvertRecord = {
  id: string
  locationId: string
  location: AdvertLocation | null
  siteId: string
  site: AdvertSite | null
  duration: string | number | null
  durationDays: number | null
  imageUrl: string | null
  imageMediaId: string | null
  linkUrl: string | null
  ownerName: string | null
  ownerPhone: string | null
  ownerEmail: string | null
  approvedBy: string | null
  textAbove: string | null
  textBelow: string | null
  status: AdvertStatus
  startsAt: string | null
  expiresAt: string | null
  isExpired: boolean
  createdByUserId: string | null
  createdAt: string
  updatedAt: string
}

export type AdvertListParams = {
  page?: number
  per_page?: number
  perPage?: number
  limit?: number
  offset?: number
  q?: string
  status?: AdvertStatus | string
  sort?: string
  locationId?: string
  siteId?: string
}

export type AdvertListResponse = {
  current_page: number
  data: AdvertRecord[]
  first_page_url: string | null
  from: number | null
  last_page: number
  last_page_url: string | null
  links: object[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

const ADVERT_ROUTES = {
  adverts: '/adverts',
} as const

const withQuery = (path: string, params: Record<string, unknown> = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const query = searchParams.toString()

  return query ? `${path}?${query}` : path
}

export const advertsService = {
  listAdverts(params: AdvertListParams = {}) {
    return api.get<AdvertListResponse>(withQuery(ADVERT_ROUTES.adverts, params))
  },
}
