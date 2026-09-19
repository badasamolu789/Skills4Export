import { onBeforeUnmount } from 'vue'

type SeoMetaInput = {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
}

const SITE_NAME = 'Skills4Export'
const DEFAULT_TITLE = 'Skills4Export'
const DEFAULT_DESCRIPTION =
  'Skills4Export is a community for posts, questions, learning, jobs, pages, and professional activity.'
const DEFAULT_IMAGE = '/logo_2.png'
const DEFAULT_SITE_URL = 'https://skills4export.com'
const MAX_DESCRIPTION_LENGTH = 180

const siteUrl = () =>
  import.meta.env.VITE_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : DEFAULT_SITE_URL)

const trimDescription = (value: string) => {
  const normalized = value.replace(/\s+/g, ' ').trim()

  if (normalized.length <= MAX_DESCRIPTION_LENGTH) {
    return normalized
  }

  return `${normalized.slice(0, MAX_DESCRIPTION_LENGTH - 1).trim()}...`
}

const toAbsoluteUrl = (value?: string) => {
  const fallback = siteUrl()
  const candidate = value?.trim() || DEFAULT_IMAGE

  try {
    return new URL(candidate, fallback).toString()
  } catch {
    return new URL(DEFAULT_IMAGE, fallback).toString()
  }
}

const setOrCreateMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  if (typeof document === 'undefined') {
    return
  }

  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

const setCanonical = (url: string) => {
  if (typeof document === 'undefined') {
    return
  }

  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }

  element.setAttribute('href', url)
}

const applySeoMeta = (input: SeoMetaInput = {}) => {
  if (typeof document === 'undefined') {
    return
  }

  const title = input.title?.trim() || DEFAULT_TITLE
  const description = trimDescription(input.description || DEFAULT_DESCRIPTION)
  const image = toAbsoluteUrl(input.image)
  const url = toAbsoluteUrl(input.url || (typeof window !== 'undefined' ? window.location.href : '/'))
  const type = input.type || 'website'
  const pageTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`

  document.title = pageTitle
  setCanonical(url)

  setOrCreateMeta('meta[name="description"]', 'name', 'description', description)
  setOrCreateMeta('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME)
  setOrCreateMeta('meta[property="og:type"]', 'property', 'og:type', type)
  setOrCreateMeta('meta[property="og:title"]', 'property', 'og:title', title)
  setOrCreateMeta('meta[property="og:description"]', 'property', 'og:description', description)
  setOrCreateMeta('meta[property="og:image"]', 'property', 'og:image', image)
  setOrCreateMeta('meta[property="og:url"]', 'property', 'og:url', url)

  setOrCreateMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
  setOrCreateMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
  setOrCreateMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
  setOrCreateMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image)
}

export const useSeoMeta = () => {
  const setSeoMeta = (input: SeoMetaInput) => applySeoMeta(input)
  const resetSeoMeta = () => applySeoMeta()

  onBeforeUnmount(resetSeoMeta)

  return {
    setSeoMeta,
    resetSeoMeta,
  }
}
