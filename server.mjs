import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT_DIRECTORY = fileURLToPath(new URL('.', import.meta.url))
const DIST_DIRECTORY = resolve(ROOT_DIRECTORY, 'dist')
const INDEX_FILE = resolve(DIST_DIRECTORY, 'index.html')
const API_BASE_URL = 'https://api.skills4export.com/api'
const PUBLIC_ORIGIN = 'https://skills4export.com'
const PORT = Number(process.env.PORT || 4173)
const RESOURCE_PATHS = {
  post: 'posts',
  question: 'questions',
  job: 'jobs',
}
const RESOURCE_TYPES = Object.fromEntries(
  Object.entries(RESOURCE_PATHS).map(([type, path]) => [path, type]),
)

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const escapeHtmlAttribute = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const getResourceUrl = (type, id) =>
  `${PUBLIC_ORIGIN}/${RESOURCE_PATHS[type]}/${encodeURIComponent(id)}`

const fetchShareMetadata = async (type, id) => {
  const response = await fetch(
    `${API_BASE_URL}/share-metadata/${type}/${encodeURIComponent(id)}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    },
  )

  if (!response.ok) {
    const error = new Error(`Share metadata request failed with status ${response.status}.`)
    error.status = response.status === 404 ? 404 : 502
    throw error
  }

  const payload = await response.json()
  const metadata = payload?.data

  if (
    payload?.success !== true ||
    metadata?.type !== type ||
    !metadata?.id ||
    !metadata?.title ||
    !metadata?.description ||
    !metadata?.siteName ||
    (metadata.image != null && typeof metadata.image !== 'string')
  ) {
    throw new Error('Share metadata response is incomplete.')
  }

  return metadata
}

export const renderResourceHtml = (baseHtml, metadata, type, id) => {
  const title = escapeHtmlAttribute(metadata.title)
  const description = escapeHtmlAttribute(metadata.description)
  const siteName = escapeHtmlAttribute(metadata.siteName)
  const resourceUrl = escapeHtmlAttribute(getResourceUrl(type, id))
  const image = metadata.image ? escapeHtmlAttribute(metadata.image) : null
  const imageMeta = image
    ? `
    <meta property="og:image" content="${image}" />
    <meta name="twitter:image" content="${image}" />`
    : ''
  const twitterCard = image ? 'summary_large_image' : 'summary'
  const metadataTags = `
    <link rel="canonical" href="${resourceUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${resourceUrl}" />${imageMeta}
    <meta name="twitter:card" content="${twitterCard}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />`

  return baseHtml
    .replace(/<title>.*?<\/title>/is, `<title>${title}</title>`)
    .replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/gi, '')
    .replace(/<meta\b(?=[^>]*\b(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+)["'])[^>]*>/gi, '')
    .replace('</head>', `${metadataTags}\n  </head>`)
}

const isValidIdentifier = (type, id) => {
  if (!id || id.length > 255 || id === '.' || id === '..' || /[\x00-\x1f\x7f/\\?#]/.test(id)) {
    return false
  }

  return type === 'job'
    ? /^[\p{L}\p{N}_-]+$/u.test(id)
    : /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

const send = (response, method, status, body, contentType) => {
  response.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
  })
  response.end(method === 'HEAD' ? undefined : body)
}

const tryServeAsset = async (pathname, response, method) => {
  const filePath = resolve(DIST_DIRECTORY, `.${pathname}`)
  if (!filePath.startsWith(`${DIST_DIRECTORY}${sep}`)) return false

  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) return false

    const body = await readFile(filePath)
    send(
      response,
      method,
      200,
      body,
      CONTENT_TYPES[extname(filePath)] || 'application/octet-stream',
    )
    return true
  } catch {
    return false
  }
}

const server = createServer(async (request, response) => {
  const method = request.method || 'GET'
  if (method !== 'GET' && method !== 'HEAD') {
    send(response, method, 405, 'Method not allowed.', 'text/plain; charset=utf-8')
    return
  }

  const pathname = new URL(request.url || '/', PUBLIC_ORIGIN).pathname
  if (await tryServeAsset(pathname, response, method)) return

  const resourceRoute = pathname.match(/^\/(posts|questions|jobs)\/([^/]+)\/?$/)
  if (resourceRoute) {
    const type = RESOURCE_TYPES[resourceRoute[1]]
    let id
    try {
      id = decodeURIComponent(resourceRoute[2])
    } catch {
      send(response, method, 400, 'Invalid resource identifier.', 'text/plain; charset=utf-8')
      return
    }

    if (!isValidIdentifier(type, id)) {
      send(response, method, 400, 'Invalid resource identifier.', 'text/plain; charset=utf-8')
      return
    }

    try {
      const [baseHtml, metadata] = await Promise.all([
        readFile(INDEX_FILE, 'utf8'),
        fetchShareMetadata(type, id),
      ])
      const html = renderResourceHtml(baseHtml, metadata, type, id)
      send(response, method, 200, html, 'text/html; charset=utf-8')
    } catch (error) {
      console.error(`Preview failed for ${type}/${id}:`, error)
      const status = error.status === 404 ? 404 : 502
      send(response, method, status, status === 404 ? 'Resource not found.' : 'Unable to render resource metadata.', 'text/plain; charset=utf-8')
    }
    return
  }

  const baseHtml = await readFile(INDEX_FILE)
  send(response, method, 200, baseHtml, 'text/html; charset=utf-8')
})

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Skills4Export frontend listening on port ${PORT}`)
  })
}
