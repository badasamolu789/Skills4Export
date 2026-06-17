import type { CommunityRecord } from '@/services/communities'

const normalizeValue = (value: unknown) =>
  typeof value === 'string'
    ? value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
    : ''

const PRIVATE_VALUES = new Set([
  'private',
  'private community',
  'restricted',
  'connections',
  'connections only',
  'community',
  'community only',
  'members',
  'members only',
  'closed',
])

const PUBLIC_VALUES = new Set(['public', 'open', 'open community'])

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

const readRecordValue = (value: unknown, keys: string[]) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }

  const record = value as Record<string, unknown>
  return keys.map((key) => record[key]).find((item) => item !== undefined && item !== null && item !== '')
}

const isTruthyFlag = (value: unknown) =>
  value === true ||
  value === 1 ||
  normalizeValue(value) === 'true' ||
  normalizeValue(value) === '1' ||
  normalizeValue(value) === 'yes'

const VISIBILITY_KEYS = [
  'visibility',
  'privacy',
  'access',
  'type',
  'community_type',
  'communityType',
  'defaultPostVisibility',
  'default_post_visibility',
]

const PRIVATE_FLAG_KEYS = ['is_private', 'isPrivate', 'private']

const readMetadataVisibility = (value: unknown): string => {
  const metadata = parseMetadata(value)

  if (typeof metadata === 'string') {
    return normalizeValue(metadata)
  }

  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return ''
  }

  const candidates = VISIBILITY_KEYS.map((key) => readRecordValue(metadata, [key]))

  return candidates.map(normalizeValue).find(Boolean) ?? ''
}

const readMetadataPrivateFlag = (value: unknown) => {
  const metadata = parseMetadata(value)
  return isTruthyFlag(readRecordValue(metadata, PRIVATE_FLAG_KEYS))
}

export const getCommunityVisibility = (community: CommunityRecord) => {
  const directValues = VISIBILITY_KEYS.map((key) => readRecordValue(community, [key]))
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

export const isPrivateCommunity = (community: CommunityRecord) => {
  const directPrivateFlag = isTruthyFlag(readRecordValue(community, PRIVATE_FLAG_KEYS))
  const metadataPrivateFlag = [
    community.metadata,
    community.meta,
    community.metaData,
    community.meta_data,
  ].some(readMetadataPrivateFlag)

  return directPrivateFlag || metadataPrivateFlag || PRIVATE_VALUES.has(getCommunityVisibility(community))
}

export const isPublicCommunity = (community: CommunityRecord) => {
  const visibility = getCommunityVisibility(community)
  return !visibility || PUBLIC_VALUES.has(visibility)
}
