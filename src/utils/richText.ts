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

export const sanitizeRichText = (value?: string | null) => {
  const html = value?.trim() || ''

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

  return document.body.innerHTML
}

export const richTextToPlainText = (value?: string | null) => {
  const html = value?.trim() || ''

  if (!html || typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() || ''
}
