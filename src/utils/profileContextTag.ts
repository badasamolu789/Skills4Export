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

const readArray = (source: unknown, keys: string[]) => {
  if (!isRecord(source)) {
    return []
  }

  for (const key of keys) {
    const value = source[key]

    if (Array.isArray(value)) {
      return value
    }
  }

  return []
}

const unique = (values: string[]) => {
  const seen = new Set<string>()

  return values.filter((value) => {
    const key = value.toLowerCase()

    if (!value || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export const getProfileContextTag = (source: unknown) => {
  const profile = readRecord(source, ['profile', 'userProfile', 'user_profile'])
  const user = readRecord(source, ['user'])
  const education = [
    ...readArray(source, ['educations', 'education']),
    ...readArray(profile, ['educations', 'education']),
    ...readArray(user, ['educations', 'education']),
  ].find(isRecord)
  const course =
    readString(source, ['courseOfStudy', 'course_of_study']) ||
    readString(profile, ['courseOfStudy', 'course_of_study']) ||
    readString(education, ['field', 'courseOfStudy', 'course_of_study'])
  const school =
    readString(source, ['university', 'school']) ||
    readString(profile, ['university', 'school']) ||
    readString(education, ['school', 'university'])
  const title =
    readString(source, ['currentJobTitle', 'current_job_title', 'jobTitle', 'job_title']) ||
    readString(profile, ['currentJobTitle', 'current_job_title', 'jobTitle', 'job_title'])
  const workspace =
    readString(source, ['currentWorkspace', 'current_workspace', 'workplace']) ||
    readString(profile, ['currentWorkspace', 'current_workspace', 'workplace'])

  if (course || school) {
    return unique([course ? `Studying ${course}` : '', school]).slice(0, 2).join(' | ')
  }

  return unique([title, workspace]).slice(0, 2).join(' | ')
}
