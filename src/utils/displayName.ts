export const isLikelyEmail = (value?: string | null) =>
  Boolean(value?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))

export const getDisplayName = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const trimmed = value?.trim()

    if (trimmed && !isLikelyEmail(trimmed)) {
      return trimmed
    }
  }

  return ''
}

const lowercaseSmallWords = new Set([
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'from',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
])

const formatWordInitialCaps = (value: string) =>
  value
    .split(/([-'’])/)
    .map((part) => {
      if (!part || /^[-'’]$/.test(part)) {
        return part
      }

      const lower = part.toLowerCase()
      return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`
    })
    .join('')

export const toInitialCaps = (value?: string | null, options: { keepSmallWords?: boolean } = {}) => {
  const trimmed = value?.trim()

  if (!trimmed) {
    return ''
  }

  return trimmed
    .split(/(\s+)/)
    .map((part, index) => {
      if (/^\s+$/.test(part)) {
        return part
      }

      const lower = part.toLowerCase()
      if (options.keepSmallWords && index > 0 && lowercaseSmallWords.has(lower)) {
        return lower
      }

      return formatWordInitialCaps(part)
    })
    .join('')
}

export const getInitialsFromName = (value: string, fallback = 'CM') =>
  value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || fallback
