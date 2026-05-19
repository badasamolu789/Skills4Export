const DIRECT_MEDIA_EXTENSIONS = /\.(avif|gif|jpe?g|m4v|mov|mp4|png|webm|webp)(\?.*)?$/i
const TRUSTED_MEDIA_HOSTS = new Set([
  'res.cloudinary.com',
  'images.unsplash.com',
  'cdn.pixabay.com',
  'images.pexels.com',
])

export const isDirectMediaUrl = (value: string) => {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return false
  }

  try {
    const url = new URL(trimmedValue)

    if (!['http:', 'https:'].includes(url.protocol)) {
      return false
    }

    if (DIRECT_MEDIA_EXTENSIONS.test(`${url.pathname}${url.search}`)) {
      return true
    }

    return TRUSTED_MEDIA_HOSTS.has(url.hostname.toLowerCase())
  } catch {
    return false
  }
}
