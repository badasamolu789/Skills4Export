import type { CommunityRecord } from '@/services/communities'

const getString = (source: unknown, keys: string[]) => {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return ''
  }

  const record = source as Record<string, unknown>

  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

export const isVerticalCommunity = (community: CommunityRecord) => {
  const record = community as Record<string, unknown>
  const category = community.category as Record<string, unknown> | null | undefined
  const signals = [
    getString(record, ['type', 'communityType', 'community_type', 'kind', 'group']),
    getString(record, ['categoryName', 'category_name', 'categorySlug', 'category_slug']),
    getString(record, ['description']),
    getString(category, ['name', 'slug', 'type']),
  ]
    .filter(Boolean)
    .map((value) => value.toLowerCase())

  return signals.some((value) => /\bvertical\b/.test(value) || value.includes('vertical communit'))
}
