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

export const getProfileDisplayTitle = (source: unknown) => {
  const profile = readRecord(source, ['profile', 'userProfile', 'user_profile'])
  const user = readRecord(source, ['user'])
  const education = [
    ...readArray(source, ['educations', 'education']),
    ...readArray(profile, ['educations', 'education']),
    ...readArray(user, ['educations', 'education']),
  ].find(isRecord)
  const accountType = (
    readString(source, ['accountType', 'account_type']) ||
    readString(profile, ['accountType', 'account_type']) ||
    readString(user, ['accountType', 'account_type'])
  ).toLowerCase()
  const explicitDisplayTitle =
    readString(source, ['displayTitle', 'display_title']) ||
    readString(profile, ['displayTitle', 'display_title']) ||
    readString(user, ['displayTitle', 'display_title'])
  const course =
    readString(source, ['courseOfStudy', 'course_of_study']) ||
    readString(profile, ['courseOfStudy', 'course_of_study']) ||
    readString(user, ['courseOfStudy', 'course_of_study']) ||
    readString(education, ['field', 'courseOfStudy', 'course_of_study'])
  const school =
    readString(source, ['institutionOfStudy', 'institution_of_study', 'university', 'school']) ||
    readString(profile, ['institutionOfStudy', 'institution_of_study', 'university', 'school']) ||
    readString(user, ['institutionOfStudy', 'institution_of_study', 'university', 'school']) ||
    readString(education, ['school', 'university'])
  const title =
    readString(source, ['currentJobTitle', 'current_job_title', 'jobTitle', 'job_title']) ||
    readString(profile, ['currentJobTitle', 'current_job_title', 'jobTitle', 'job_title']) ||
    readString(user, ['currentJobTitle', 'current_job_title', 'jobTitle', 'job_title'])
  const workspace =
    readString(source, ['currentWorkspace', 'current_workspace', 'currentWorkplace', 'current_workplace', 'workplace']) ||
    readString(profile, ['currentWorkspace', 'current_workspace', 'currentWorkplace', 'current_workplace', 'workplace']) ||
    readString(user, ['currentWorkspace', 'current_workspace', 'currentWorkplace', 'current_workplace', 'workplace'])

  if (explicitDisplayTitle) {
    return explicitDisplayTitle
  }

  if (accountType === 'student' || course || school) {
    return unique([course, school]).slice(0, 2).join(' | ')
  }

  return title && workspace ? `${title} at ${workspace}` : unique([title, workspace]).slice(0, 1).join('')
}

export const getProfileContextTag = (source: unknown) => getProfileDisplayTitle(source)
