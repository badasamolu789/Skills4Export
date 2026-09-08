const ALLOWED_TAGS = new Set([
  'a',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'hr',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'strong',
  'u',
  'ul',
])

const ALLOWED_ATTRIBUTES = new Set(['href', 'target', 'rel'])

const HTML_ENTITY_PATTERN = /&(?:lt|gt|amp|quot|#39|nbsp);/i
const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i
const BLOCK_TAG_PATTERN = /<\/?(?:address|article|aside|blockquote|div|h[1-6]|hr|li|ol|p|pre|section|ul)\b/i

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const decodeHtmlEntities = (value: string) => {
  if (!HTML_ENTITY_PATTERN.test(value) || typeof document === 'undefined') {
    return value
  }

  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
}

const normalizePlainTextAsHtml = (value: string) =>
  value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('')

export const sanitizeRichText = (value?: string | null) => {
  const rawHtml = value?.trim() || ''

  if (!rawHtml) {
    return ''
  }

  const decodedHtml = decodeHtmlEntities(rawHtml).trim()
  const html = HTML_TAG_PATTERN.test(decodedHtml)
    ? decodedHtml
    : normalizePlainTextAsHtml(decodedHtml)

  if (!html || typeof DOMParser === 'undefined') {
    return html
  }

  const document = new DOMParser().parseFromString(html, 'text/html')

  Array.from(document.body.querySelectorAll('*')).forEach((element) => {
    if (!ALLOWED_TAGS.has(element.tagName.toLowerCase())) {
      element.replaceWith(...Array.from(element.childNodes))
      return
    }

    Array.from(element.attributes).forEach((attribute) => {
      if (!ALLOWED_ATTRIBUTES.has(attribute.name.toLowerCase())) {
        element.removeAttribute(attribute.name)
      }
    })

    if (element instanceof HTMLAnchorElement) {
      const href = element.getAttribute('href') || ''
      if (!/^(https?:|mailto:|tel:|\/|#)/i.test(href)) {
        element.removeAttribute('href')
      }
      element.setAttribute('target', '_blank')
      element.setAttribute('rel', 'noopener noreferrer')
    }
  })

  const sanitized = document.body.innerHTML.trim()

  if (!BLOCK_TAG_PATTERN.test(sanitized)) {
    return normalizePlainTextAsHtml(document.body.textContent || sanitized)
  }

  return sanitized
}

export const richTextToPlainText = (value?: string | null) => {
  const html = decodeHtmlEntities(value?.trim() || '')

  if (!html || typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() || ''
}
