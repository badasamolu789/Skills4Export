import { api } from '@/lib/api'

export type AlertPreferences = {
  contestAlert: boolean
  sponsorshipAlert: boolean
  scholarshipType?: string | null
  jobAlert: boolean
  jobSearchTags: string[]
  createdAt?: string
  updatedAt?: string
}

export type AlertPreferencesRequest = {
  contestAlert: boolean
  sponsorshipAlert: boolean
  scholarshipType?: string | null
  jobAlert: boolean
  jobSearchTags: string[]
}

export type AlertPreferencesResponse = {
  success: boolean
  message?: string
  data: AlertPreferences
}

const ALERT_ROUTES = {
  preferences: '/me/alert-preferences',
} as const

export const alertsService = {
  getAlertPreferences(token?: string | null) {
    return api.get<AlertPreferencesResponse>(ALERT_ROUTES.preferences, { token })
  },

  updateAlertPreferences(payload: AlertPreferencesRequest, token?: string | null) {
    return api.put<AlertPreferencesResponse>(ALERT_ROUTES.preferences, payload, { token })
  },
}
