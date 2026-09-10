import { api } from '@/lib/api'
import type { ApiSuccessResponse } from '@/services/posts'

export type LegalDocumentContentType = 'html' | 'markdown' | 'plain_text'

export type LegalDocumentRecord = {
  id: string
  slug: string
  title: string
  content: string
  contentType: LegalDocumentContentType
  version: string
  status: 'draft' | 'published' | 'archived'
  effectiveDate: string | null
  publishedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

const LEGAL_ROUTES = {
  privacyPolicy: '/privacy-policy',
  cookiePolicy: '/cookie-policy',
  communityRules: '/community-rules',
  terms: '/terms',
}

export const legalService = {
  getPrivacyPolicy() {
    return api.get<ApiSuccessResponse<LegalDocumentRecord>>(LEGAL_ROUTES.privacyPolicy)
  },

  getCookiePolicy() {
    return api.get<ApiSuccessResponse<LegalDocumentRecord>>(LEGAL_ROUTES.cookiePolicy)
  },

  getCommunityRules() {
    return api.get<ApiSuccessResponse<LegalDocumentRecord>>(LEGAL_ROUTES.communityRules)
  },

  getTerms() {
    return api.get<ApiSuccessResponse<LegalDocumentRecord>>(LEGAL_ROUTES.terms)
  },
}
