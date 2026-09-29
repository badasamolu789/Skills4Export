const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readString = (source: unknown, keys: string[]) => {
  if (!isRecord(source)) {
    return ''
  }

  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

const readRecord = (source: unknown, keys: string[]) => {
  if (!isRecord(source)) {
    return null
  }

  for (const key of keys) {
    const value = source[key]

    if (isRecord(value)) {
      return value
    }
  }

  return null
}

export const getAuthorProfileDisplayTitle = (source: unknown) =>
  readString(readRecord(source, ['profile']), ['display_title'])
