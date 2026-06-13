import type { CommunityRecord } from '@/services/communities'

const normalizeValue = (value: unknown) =>
  typeof value === 'string'
    ? value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
    : ''

const VERTICAL_VALUES = new Set([
  'vertical',
  'vertical community',
  'vertical communities',
])

const isTruthyFlag = (value: unknown) =>
  value === true ||
  value === 1 ||
  ['true', '1', 'yes'].includes(normalizeValue(value))

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

const metadataMarksVertical = (value: unknown): boolean => {
  const metadata = parseMetadata(value)

  if (typeof metadata === 'string') {
    return VERTICAL_VALUES.has(normalizeValue(metadata))
  }

  if (Array.isArray(metadata)) {
    return metadata.some(metadataMarksVertical)
  }

  if (!metadata || typeof metadata !== 'object') {
    return false
  }

  const record = metadata as Record<string, unknown>
  const flags = [
    record.isVertical,
    record.is_vertical,
    record.verticalCommunity,
    record.vertical_community,
    record.vertical,
  ]
  const types = [
    record.communityType,
    record.community_type,
    record.type,
    record.kind,
    record.classification,
    record.placement,
    record.location,
    record.tags,
  ]

  return flags.some(isTruthyFlag) ||
    types.some(metadataMarksVertical) ||
    Object.entries(record).some(([key, nestedValue]) =>
      normalizeValue(key) === 'vertical' && isTruthyFlag(nestedValue),
    )
}

export const isVerticalCommunity = (community: CommunityRecord) => {
  const flags = [
    community.isVertical,
    community.is_vertical,
    community.verticalCommunity,
    community.vertical_community,
  ]
  const types = [
    community.communityType,
    community.community_type,
    community.type,
  ]
  const metadataValues = [
    community.metadata,
    community.meta,
    community.metaData,
    community.meta_data,
  ]

  return flags.some(isTruthyFlag) ||
    types.some((value) => VERTICAL_VALUES.has(normalizeValue(value))) ||
    metadataValues.some(metadataMarksVertical)
}
