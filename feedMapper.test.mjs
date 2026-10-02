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
const { mapApiQuestionToFeedPost } = await import('./src/utils/questionMapper.ts')

test('page posts use the backend user title, not page or author metadata', () => {
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

test('personal posts use the backend user title', () => {
  const post = mapCompactFeedItemToFeedPost({
    id: 'post-3',
    type: 'POST',
    title: 'A work update',
    user: { id: 'user-2', name: 'Chris', display_title: 'Engineer at Acme' },
    media: [],
  })

  assert.equal(post.author.tag, 'Engineer at Acme')
})

test('community posts use the backend user title', () => {
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

test('compact feed uses a user author title when user is not embedded', () => {
  const post = mapCompactFeedItemToFeedPost({
    id: 'post-author-only',
    type: 'POST',
    title: 'Solar Power',
    userId: 'user-4',
    author: { id: 'user-4', name: 'Bada Samuel', display_title: 'AI Engineer at Anthropic' },
    media: [],
  })

  assert.equal(post.author.tag, 'AI Engineer at Anthropic')
})

test('compact feed prefers the user title over an older author title', () => {
  const post = mapCompactFeedItemToFeedPost({
    id: 'post-two-titles',
    type: 'POST',
    title: 'Solar Power',
    userId: 'user-4',
    user: { id: 'user-4', name: 'Bada Samuel', display_title: 'AI Engineer at Anthropic' },
    author: { id: 'user-4', name: 'Bada Samuel', display_title: 'Old title' },
    media: [],
  })

  assert.equal(post.author.tag, 'AI Engineer at Anthropic')
})

test('compact feed never uses a page author title as a user title', () => {
  const post = mapCompactFeedItemToFeedPost({
    id: 'page-post-author-only',
    type: 'POST',
    title: 'Page update',
    userId: 'user-4',
    pageId: 'page-1',
    page: { id: 'page-1', name: 'Student Page' },
    author: { id: 'page-1', name: 'Student Page', display_title: 'Page course' },
    media: [],
  })

  assert.equal(post.author.tag, '')
})

test('post detail ignores a stale author profile title', () => {
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

  assert.equal(mapApiPostToFeedPost(record, [], { profile: { display_title: null } }).author.tag, 'Metrulugical Engineering')
  assert.equal(
    mapApiPostToFeedPost(record, [], { profile: { display_title: 'Product Designer at Google' } }).author.tag,
    'Metrulugical Engineering',
  )
})

test('question detail uses the backend user title', () => {
  const question = mapApiQuestionToFeedPost({
    id: 'question-1',
    userId: 'user-4',
    communityId: null,
    title: 'What is solar power?',
    body: 'Question body',
    visibility: 'public',
    isClosed: false,
    acceptedAnswerId: null,
    createdAt: '2026-09-29T08:06:33.000Z',
    updatedAt: '2026-09-29T08:06:33.000Z',
    user: { id: 'user-4', name: 'Bada Samuel', display_title: 'Metallurgical Engineering at University Name' },
  }, { profile: { display_title: 'Old title' } })

  assert.equal(question.tag, 'Metallurgical Engineering at University Name')
})
