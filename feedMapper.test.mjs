import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { test } from 'node:test'

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      return nextResolve(new URL(`./src/${specifier.slice(2)}.ts`, import.meta.url).href, context)
    }

    return nextResolve(specifier, context)
  },
})

const { mapCompactFeedItemToFeedPost } = await import('./src/utils/feedMapper.ts')
const { mapApiPostToFeedPost } = await import('./src/utils/postMapper.ts')

test('page posts do not use embedded user, page, or author title', () => {
  const post = mapCompactFeedItemToFeedPost({
    id: 'post-1',
    type: 'POST',
    title: 'Soil care',
    pageId: 'page-1',
    page: { id: 'page-1', name: 'Garden Page', display_title: 'Page course' },
    author: { id: 'page-1', name: 'Garden Page', display_title: 'Author course' },
    user: { id: 'user-1', name: 'Ada', display_title: 'Agronomy at Lagos University' },
    media: [],
  })

  assert.equal(post.author.name, 'Garden Page')
  assert.equal(post.author.tag, '')
  assert.equal(post.userId, 'user-1')
})

test('a page title is never substituted for a missing user display title', () => {
  const post = mapCompactFeedItemToFeedPost({
    id: 'post-2',
    type: 'POST',
    title: 'Soil care',
    pageId: 'page-1',
    page: { id: 'page-1', name: 'Garden Page', display_title: 'Page course' },
    author: { id: 'page-1', name: 'Garden Page', display_title: 'Author course' },
    user: { id: 'user-1', name: 'Ada' },
    media: [],
  })

  assert.equal(post.author.tag, '')
})

test('personal posts wait for the author profile title', () => {
  const post = mapCompactFeedItemToFeedPost({
    id: 'post-3',
    type: 'POST',
    title: 'A work update',
    user: { id: 'user-2', name: 'Chris', display_title: 'Engineer at Acme' },
    media: [],
  })

  assert.equal(post.author.tag, '')
})

test('community posts wait for the author profile title', () => {
  const post = mapCompactFeedItemToFeedPost({
    id: 'post-4',
    type: 'POST',
    title: 'A community update',
    communityId: 'community-1',
    community: { id: 'community-1', name: 'Agriculture' },
    user: { id: 'user-3', name: 'Sam', display_title: 'Researcher at Field Labs' },
    media: [],
  })

  assert.equal(post.author.tag, '')
})

test('post detail uses only the author profile display title', () => {
  const record = {
    id: 'post-5',
    title: 'Solar Power',
    content: 'A guide',
    user_id: 'user-4',
    community_id: null,
    page_id: null,
    created_at: '2026-09-29T08:06:33.000Z',
    updated_at: '2026-09-29T08:06:33.000Z',
    user: { id: 'user-4', name: 'Bada Samuel', display_title: 'Metrulugical Engineering' },
  }

  assert.equal(mapApiPostToFeedPost(record, [], { profile: { display_title: null } }).author.tag, '')
  assert.equal(
    mapApiPostToFeedPost(record, [], { profile: { display_title: 'Product Designer at Google' } }).author.tag,
    'Product Designer at Google',
  )
})
