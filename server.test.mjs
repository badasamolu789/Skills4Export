import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { renderResourceHtml, server } from './server.mjs'

const baseHtml = await readFile(new URL('./dist/index.html', import.meta.url), 'utf8')
const metadata = {
  title: 'A role & a story',
  description: 'Details about the role & team',
  siteName: 'Skills4Export',
  image: 'https://images.example.com/job.jpg',
}

test('job slug renders one set of metadata and preserves app assets', () => {
  const html = renderResourceHtml(
    baseHtml.replace('</head>', '<meta property="og:title" content="Old title" /><link rel="canonical" href="https://old.example.com" /></head>'),
    metadata,
    'job',
    'assistant-fashion-designer',
  )

  assert.match(html, /<title>A role &amp; a story<\/title>/)
  assert.match(html, /<meta name="description" content="Details about the role &amp; team"/)
  assert.match(html, /<link rel="canonical" href="https:\/\/skills4export.com\/jobs\/assistant-fashion-designer"/)
  assert.match(html, /<meta property="og:url" content="https:\/\/skills4export.com\/jobs\/assistant-fashion-designer"/)
  assert.match(html, /<meta property="og:image" content="https:\/\/images.example.com\/job.jpg"/)
  assert.match(html, /<meta name="twitter:image" content="https:\/\/images.example.com\/job.jpg"/)
  assert.match(html, /<meta name="twitter:card" content="summary_large_image"/)
  assert.equal((html.match(/property="og:title"/g) || []).length, 1)
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1)
  assert.match(html, /<script type="module"/)
  assert.match(html, /<link rel="stylesheet"/)
})

test('post and question with no image render text-only metadata', () => {
  for (const [type, segment] of [['post', 'posts'], ['question', 'questions']]) {
    const html = renderResourceHtml(baseHtml, { ...metadata, image: null }, type, 'resource-id')

    assert.match(html, new RegExp(`<link rel="canonical" href="https://skills4export.com/${segment}/resource-id"`))
    assert.match(html, new RegExp(`<meta property="og:url" content="https://skills4export.com/${segment}/resource-id"`))
    assert.match(html, /<meta property="og:description" content="Details about the role &amp; team"/)
    assert.match(html, /<meta name="twitter:description" content="Details about the role &amp; team"/)
    assert.match(html, /<meta name="twitter:card" content="summary"/)
    assert.doesNotMatch(html, /(?:og:image|twitter:image)/)
  }
})

const requestPage = async (path, metadataResponse = null) => {
  const originalFetch = globalThis.fetch
  let requestedApiUrl = ''
  globalThis.fetch = async (url) => {
    requestedApiUrl = url
    return metadataResponse || {
      ok: true,
      json: async () => ({ success: true, data: {
        ...metadata,
        type: path.startsWith('/posts/') ? 'post' : path.startsWith('/questions/') ? 'question' : 'job',
        id: 'fixture-id',
      } }),
    }
  }

  let status = 0
  let body = ''
  const response = {
    writeHead(code) { status = code },
    end(chunk) { body = chunk?.toString() || '' },
  }

  try {
    server.emit('request', { method: 'GET', url: path }, response)
    for (let attempt = 0; attempt < 100 && status === 0; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    return { status, body, requestedApiUrl }
  } finally {
    globalThis.fetch = originalFetch
  }
}

test('resource routes fetch the matching metadata and return initial HTML', async () => {
  const routes = [
    ['/posts/44a532e2-5282-4d09-ae77-6906f5f2d323', 'post', '44a532e2-5282-4d09-ae77-6906f5f2d323'],
    ['/questions/0e3b88e5-537e-47d8-9701-8eb96cdf7dae/', 'question', '0e3b88e5-537e-47d8-9701-8eb96cdf7dae'],
    ['/jobs/assistant-fashion-designer', 'job', 'assistant-fashion-designer'],
  ]

  for (const [path, type, id] of routes) {
    const { status, body, requestedApiUrl } = await requestPage(path)
    assert.equal(status, 200)
    assert.equal(requestedApiUrl, `https://api.skills4export.com/api/share-metadata/${type}/${id}`)
    assert.match(body, new RegExp(`<meta property="og:url" content="https://skills4export.com/${path.split('/')[1]}/${id}"`))
    assert.match(body, /<meta property="og:description" content="Details about the role &amp; team"/)
    assert.equal((body.match(/property="og:title"/g) || []).length, 1)
  }
})

test('missing metadata, malformed IDs, static assets, and Vue routes', async () => {
  const missing = await requestPage('/jobs/missing-job', { ok: false, status: 404 })
  assert.equal(missing.status, 404)
  assert.doesNotMatch(missing.body, /og:title/)

  const malformed = await requestPage('/questions/bad%2Fid')
  assert.equal(malformed.status, 400)
  assert.equal(malformed.requestedApiUrl, '')

  const asset = await requestPage('/logo_2.svg')
  assert.equal(asset.status, 200)
  assert.equal(asset.requestedApiUrl, '')

  const ordinary = await requestPage('/feed')
  assert.equal(ordinary.status, 200)
  assert.match(ordinary.body, /<div id="app"><\/div>/)
})
