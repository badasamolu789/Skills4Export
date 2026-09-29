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

test('page posts use the posting user title, not page or author metadata', () => {
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
  assert.equal(post.author.tag, 'Agronomy at Lagos University')
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

test('personal posts retain the professional user display title', () => {
  const post = mapCompactFeedItemToFeedPost({
    id: 'post-3',
    type: 'POST',
    title: 'A work update',
    user: { id: 'user-2', name: 'Chris', display_title: 'Engineer at Acme' },
    media: [],
  })

  assert.equal(post.author.tag, 'Engineer at Acme')
})

test('community posts use the member title instead of community data', () => {
  const post = mapCompactFeedItemToFeedPost({
    id: 'post-4',
    type: 'POST',
    title: 'A community update',
    communityId: 'community-1',
    community: { id: 'community-1', name: 'Agriculture' },
    user: { id: 'user-3', name: 'Sam', display_title: 'Researcher at Field Labs' },
    media: [],
  })

  assert.equal(post.author.tag, 'Researcher at Field Labs')
})
