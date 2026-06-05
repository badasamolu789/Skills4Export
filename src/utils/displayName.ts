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

export const getInitialsFromName = (value: string, fallback = 'CM') =>
  value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || fallback
