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

const getPostUrl = (postId) => `${PUBLIC_ORIGIN}/posts/${encodeURIComponent(postId)}`

const fetchPostShareMetadata = async (postId) => {
  const response = await fetch(
    `${API_BASE_URL}/share-metadata/post/${encodeURIComponent(postId)}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    },
  )

  if (!response.ok) {
    throw new Error(`Share metadata request failed with status ${response.status}.`)
  }

  const payload = await response.json()
  const metadata = payload?.data

  if (
    payload?.success !== true ||
    !metadata?.id ||
    !metadata?.title ||
    !metadata?.description ||
    !metadata?.siteName ||
    (metadata.image !== null && typeof metadata.image !== 'string')
  ) {
    throw new Error('Share metadata response is incomplete.')
  }

  return metadata
}

const renderPostHtml = (baseHtml, metadata, postId) => {
  const title = escapeHtmlAttribute(metadata.title)
  const description = escapeHtmlAttribute(metadata.description)
  const siteName = escapeHtmlAttribute(metadata.siteName)
  const postUrl = escapeHtmlAttribute(getPostUrl(postId))
  const image = metadata.image === null ? null : escapeHtmlAttribute(metadata.image)
  const imageMeta = image
    ? `
    <meta property="og:image" content="${image}" />
    <meta name="twitter:image" content="${image}" />`
    : ''
  const twitterCard = image ? 'summary_large_image' : 'summary'
  const metadataTags = `
    <link rel="canonical" href="${postUrl}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${postUrl}" />${imageMeta}
    <meta name="twitter:card" content="${twitterCard}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />`

  return baseHtml
    .replace(/<title>.*?<\/title>/is, `<title>${title}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/>/i,
      `<meta name="description" content="${description}" />`,
    )
    .replace('</head>', `${metadataTags}\n  </head>`)
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

createServer(async (request, response) => {
  const method = request.method || 'GET'
  if (method !== 'GET' && method !== 'HEAD') {
    send(response, method, 405, 'Method not allowed.', 'text/plain; charset=utf-8')
    return
  }

  const pathname = new URL(request.url || '/', PUBLIC_ORIGIN).pathname
  if (await tryServeAsset(pathname, response, method)) return

  const postRoute = pathname.match(/^\/posts\/([^/]+)\/?$/)
  if (postRoute) {
    try {
      const postId = decodeURIComponent(postRoute[1])
      const [baseHtml, metadata] = await Promise.all([
        readFile(INDEX_FILE, 'utf8'),
        fetchPostShareMetadata(postId),
      ])
      const html = renderPostHtml(baseHtml, metadata, postId)
      send(response, method, 200, html, 'text/html; charset=utf-8')
    } catch {
      send(response, method, 502, 'Unable to render post metadata.', 'text/plain; charset=utf-8')
    }
    return
  }

  const baseHtml = await readFile(INDEX_FILE)
  send(response, method, 200, baseHtml, 'text/html; charset=utf-8')
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Skills4Export frontend listening on port ${PORT}`)
})
