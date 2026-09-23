import { api } from '@/lib/api'

export type ShareMetadataType =
  | 'post'
  | 'question'
  | 'job'
  | 'freelance-job'
  | 'page'
  | 'community'
  | 'user'

export type ShareMetadata = {
  type: string
  id: string
  title: string
  description: string
  image: string | null
  url: string
  canonicalUrl: string
  authorName: string | null
  siteName: string
  openGraph: Record<string, unknown>
  twitter: Record<string, unknown>
}

type ShareMetadataResponse = {
  success: boolean
  message?: string
  data: ShareMetadata
}

export const shareMetadataService = {
  get(type: ShareMetadataType, id: string) {
    return api.get<ShareMetadataResponse>(
      `/share-metadata/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,
    )
  },
}
