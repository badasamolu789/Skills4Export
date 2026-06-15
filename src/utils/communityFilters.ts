import type { CommunityRecord } from '@/services/communities'

const normalizeValue = (value: unknown) =>
  typeof value === 'string'
    ? value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
    : ''

const PRIVATE_VALUES = new Set([
  'private',
  'restricted',
  'connections',
  'connections only',
  'community',
  'community only',
  'members',
  'members only',
])

const PUBLIC_VALUES = new Set(['public', 'open'])

const parseMetadata = (value: unknown): unknown => {
  if (typeof value !== 'string' || !value.trim()) {
    return value
  }

  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

const readMetadataVisibility = (value: unknown): string => {
  const metadata = parseMetadata(value)

  if (typeof metadata === 'string') {
    return normalizeValue(metadata)
  }

  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return ''
  }

  const record = metadata as Record<string, unknown>
  const candidates = [
    record.visibility,
    record.privacy,
    record.access,
    record.defaultPostVisibility,
    record.default_post_visibility,
  ]

  return candidates.map(normalizeValue).find(Boolean) ?? ''
}

export const getCommunityVisibility = (community: CommunityRecord) => {
  const directValues = [
    community.visibility,
    community.privacy,
    community.defaultPostVisibility,
    community.default_post_visibility,
  ]
  const directVisibility = directValues.map(normalizeValue).find(Boolean)

  if (directVisibility) {
    return directVisibility
  }

  const metadataValues = [
    community.metadata,
    community.meta,
    community.metaData,
    community.meta_data,
  ]

  return metadataValues.map(readMetadataVisibility).find(Boolean) ?? ''
}

export const isPrivateCommunity = (community: CommunityRecord) =>
  PRIVATE_VALUES.has(getCommunityVisibility(community))

export const isPublicCommunity = (community: CommunityRecord) => {
  const visibility = getCommunityVisibility(community)
  return !visibility || PUBLIC_VALUES.has(visibility)
}
