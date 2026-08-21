const FOLLOW_STATE_KEYS = [
  'isFollowing',
  'is_following',
  'isFollow',
  'is_follow',
  'isfollow',
  'followedByMe',
  'followed_by_me',
  'follows',
] as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const readBooleanFlag = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value === 1 ? true : value === 0 ? false : undefined
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (['true', '1', 'yes', 'followed', 'following'].includes(normalized)) {
      return true
    }

    if (['false', '0', 'no', 'unfollowed', 'not_following'].includes(normalized)) {
      return false
    }
  }

  if (isRecord(value)) {
    return readFollowState(value)
  }

  return undefined
}

export const readFollowState = (...sources: unknown[]): boolean | undefined => {
  for (const source of sources) {
    const directValue = readBooleanFlag(source)

    if (directValue !== undefined && !isRecord(source)) {
      return directValue
    }

    if (!isRecord(source)) {
      continue
    }

    for (const key of FOLLOW_STATE_KEYS) {
      const value = readBooleanFlag(source[key])

      if (value !== undefined) {
        return value
      }
    }
  }

  return undefined
}
