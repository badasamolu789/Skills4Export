const getShareBaseUrl = () => {
  const configuredUrl = import.meta.env.VITE_PUBLIC_SHARE_BASE_URL?.trim().replace(/\/+$/, '')

  if (configuredUrl) {
    return configuredUrl
  }

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'https://skills4export.com'
}

export const getSharePath = (type: 'post' | 'question', slug: string) => {
  const encodedSlug = encodeURIComponent(slug)
  return type === 'question' ? `/share/questions/${encodedSlug}` : `/share/posts/${encodedSlug}`
}

export const getShareUrl = (type: 'post' | 'question', slug: string) =>
  new URL(getSharePath(type, slug), getShareBaseUrl()).toString()

export const getDetailPathFromShare = (type: 'post' | 'question', slug: string) => {
  const encodedSlug = encodeURIComponent(slug)
  return type === 'question' ? `/questions/${encodedSlug}` : `/posts/${encodedSlug}`
}
