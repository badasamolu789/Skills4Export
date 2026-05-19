import type { CommunityRecord } from '@/services/communities'

const LINE_AWESOME_STYLES = new Set(['las', 'lar', 'lab', 'lal'])

const getRawIconName = (community: CommunityRecord) =>
  community.icon ??
  community.iconName ??
  community.icon_name ??
  community.iconClass ??
  community.icon_class ??
  community.category?.icon ??
  community.category?.iconName ??
  community.category?.icon_name ??
  community.category?.iconClass ??
  community.category?.icon_class ??
  ''

export const getCommunityLineAwesomeClass = (community: CommunityRecord) => {
  const rawIconName = String(getRawIconName(community)).trim().toLowerCase()

  if (!rawIconName) {
    return 'las la-users'
  }

  const tokens = rawIconName
    .replace(/_/g, '-')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)

  const styleClass = tokens.find((token) => LINE_AWESOME_STYLES.has(token)) || 'las'
  const iconClass = tokens.find((token) => /^la-[a-z0-9-]+$/.test(token))

  if (iconClass) {
    return `${styleClass} ${iconClass}`
  }

  const normalizedIconName = rawIconName
    .replace(/^(las|lar|lab|lal)\s+/u, '')
    .replace(/^la-/u, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return normalizedIconName ? `${styleClass} la-${normalizedIconName}` : 'las la-users'
}
