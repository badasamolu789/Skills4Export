import { api } from '@/lib/api'

export type ShareResourceType = 'post' | 'question' | 'job'

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
  message: string
  data: ShareMetadata
}

const PUBLIC_ORIGIN = 'https://skills4export.com'
const RESOURCE_PATHS: Record<ShareResourceType, string> = {
  post: 'posts',
  question: 'questions',
  job: 'jobs',
}

const assertShareMetadata = (response: ShareMetadataResponse) => {
  const metadata = response.data

  if (
    response.success !== true ||
    !metadata ||
    !metadata.id ||
    !metadata.title ||
    !metadata.description
  ) {
    throw new Error('The post share metadata response is incomplete.')
  }

  return metadata
}

export const getPublicShareUrl = (type: ShareResourceType, id: string) => {
  return `${PUBLIC_ORIGIN}/${RESOURCE_PATHS[type]}/${encodeURIComponent(id)}`
}

export const getShareMetadata = async (type: ShareResourceType, id: string) => {
  const response = await api.get<ShareMetadataResponse>(
    `/share-metadata/${type}/${encodeURIComponent(id)}`,
  )

  return assertShareMetadata(response)
}
