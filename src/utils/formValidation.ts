const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'ymail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'mail.com',
  'gmx.com',
  'gmx.net',
  'yandex.com',
])

export const isBlank = (value: unknown) => String(value ?? '').trim().length === 0

export const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim())

export const isBusinessEmail = (value: string) => {
  const email = value.trim().toLowerCase()

  if (!isValidEmail(email)) {
    return false
  }

  const domain = email.split('@')[1]
  return Boolean(domain && !PERSONAL_EMAIL_DOMAINS.has(domain))
}

export const normalizeWebsiteUrl = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export const isValidWebsiteUrl = (value: string) => {
  try {
    const url = new URL(normalizeWebsiteUrl(value))
    return Boolean(url.hostname.includes('.') && ['http:', 'https:'].includes(url.protocol))
  } catch {
    return false
  }
}

export type ValidationRule<FieldName extends string> = {
  field: FieldName
  value: unknown
  message: string
  validate?: (value: unknown) => boolean
}

export const collectValidationErrors = <FieldName extends string>(
  rules: ValidationRule<FieldName>[],
) => {
  const errors: Partial<Record<FieldName, string>> = {}

  rules.forEach(({ field, value, message, validate }) => {
    if (errors[field]) {
      return
    }

    const isValid = validate ? validate(value) : !isBlank(value)
    if (!isValid) {
      errors[field] = message
    }
  })

  return errors
}
