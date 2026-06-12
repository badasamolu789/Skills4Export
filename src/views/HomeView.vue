<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppFeedPost from '@/components/AppFeedPost.vue'
import FeedAdvertCard from '@/components/FeedAdvertCard.vue'
import { useCurrentUserIdentity } from '@/composables/useCurrentUserIdentity'
import type { FeedPost } from '@/data/feedPosts'
import { ApiError } from '@/lib/api'
import { advertsService, type AdvertRecord } from '@/services/adverts'
import { communitiesService, type CommunityRecord } from '@/services/communities'
import { pagesService, type PageRecord } from '@/services/pages'
import { postsService, type PostMediaRecord, type PostRecord } from '@/services/posts'
import { questionsService, type QuestionRecord } from '@/services/questions'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { mapWithConcurrency } from '@/utils/async'
import { getPostUserId, mapApiPostToFeedPost } from '@/utils/postMapper'
import { loadQuestionAuthorProfile } from '@/utils/questionAuthor'
import { getQuestionUserId, mapApiQuestionToFeedPost } from '@/utils/questionMapper'

type FeedItem = {
  id: string
  post: FeedPost
}

type FeedAdvertItem = {
  id: string
  type: 'advert'
  advert?: AdvertRecord | null
}

type FeedRenderItem =
  | {
      id: string
      type: 'post'
      post: FeedPost
    }
  | FeedAdvertItem

const INITIAL_POST_COUNT = 4
const LOAD_BATCH_SIZE = 3
const FEED_PAGE_SIZE = 20
const ENRICHMENT_CONCURRENCY = 4
const POST_CREATED_EVENT = 'skills4export:post-created'
const RECENT_CREATED_POSTS_KEY = 'skills4export:recent-created-posts'
const RECENT_CREATED_POST_TTL_MS = 30 * 60 * 1000

type RecentCreatedPost = {
  storedAt: string
  post: PostRecord
  media: PostMediaRecord[]
}

const loadMoreTrigger = ref<HTMLElement | null>(null)
const visiblePostCount = ref(INITIAL_POST_COUNT)
const isLoadingMore = ref(false)
const isLoadingFeed = ref(false)
const feedError = ref('')
const apiPosts = ref<FeedPost[]>([])
const adverts = ref<AdvertRecord[]>([])
const communitiesById = ref(new Map<string, CommunityRecord>())
const authStore = useAuthStore()
const currentUser = useCurrentUserIdentity()
const route = useRoute()
const activeFeedMode = computed(() => {
  const value = route.query.feed
  return (Array.isArray(value) ? value[0] : value) === 'latest' ? 'latest' : 'popular'
})
const activeFeedSort = computed(() => (activeFeedMode.value === 'latest' ? '-createdAt' : '-score'))

const shuffleFeedPosts = (items: FeedPost[]) => {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }

  return shuffled
}

const feedItems = computed<FeedItem[]>(() => {
  return apiPosts.value.map((post) => ({
    id: post.apiId || post.slug,
    post,
  }))
})

const visiblePosts = computed(() => feedItems.value.slice(0, visiblePostCount.value))
const usableAdverts = computed(() =>
  adverts.value.filter((advert) =>
    Boolean(advert.imageUrl) &&
    !advert.isExpired &&
    (advert.status === 'active' || advert.status === 'approved'),
  ),
)

const feedAdverts = computed(() => {
  const feedMatches = usableAdverts.value.filter((advert) => {
    const locationName = advert.location?.name?.toLowerCase() ?? ''

    return (
      locationName.includes('feed') &&
      !locationName.includes('right') &&
      !locationName.includes('rail') &&
      !locationName.includes('sidebar')
    )
  })

  return feedMatches.length ? feedMatches : usableAdverts.value
})

const visibleFeedItems = computed<FeedRenderItem[]>(() => {
  const entries: FeedRenderItem[] = []

  visiblePosts.value.forEach((item, index) => {
    entries.push({
      id: item.id,
      type: 'post',
      post: item.post,
    })

    if ((index + 1) % 4 === 0) {
      const advertIndex = feedAdverts.value.length
        ? Math.floor(index / 4) % feedAdverts.value.length
        : -1

      entries.push({
        id: feedAdverts.value[advertIndex]?.id
          ? `advert-${feedAdverts.value[advertIndex]?.id}-${index + 1}`
          : `advert-placeholder-${index + 1}`,
        type: 'advert',
        advert: feedAdverts.value[advertIndex] ?? null,
      })
    }
  })

  return entries
})
const hasMorePosts = computed(() => visiblePostCount.value < feedItems.value.length)

let observer: IntersectionObserver | null = null
let realtimeTimer: ReturnType<typeof window.setInterval> | null = null

type AuthorLookup = Awaited<ReturnType<typeof buildAuthorLookup>>
type PageLookup = Awaited<ReturnType<typeof buildPageLookup>>

const getFeedSignature = (items: FeedPost[]) =>
  items
    .map((item) => [
      item.type,
      item.apiId || item.slug,
      item.updatedAt || item.createdAt || '',
      item.score ?? 0,
      'comments' in item ? item.comments ?? 0 : item.answers ?? 0,
    ].join(':'))
    .join('|')

const getFeedItemTimestamp = (item: FeedPost) =>
  new Date(item.createdAt || item.updatedAt || '').getTime() || 0

const getFeedItemEngagement = (item: FeedPost) =>
  (item.score ?? 0) + ('comments' in item ? item.comments ?? 0 : item.answers ?? 0)

const sortFeedItems = (items: FeedPost[]) => {
  if (activeFeedMode.value === 'latest') {
    return [...items].sort((first, second) => getFeedItemTimestamp(second) - getFeedItemTimestamp(first))
  }

  return [...items].sort((first, second) => {
    const scoreDifference = (second.score ?? 0) - (first.score ?? 0)
    if (scoreDifference) {
      return scoreDifference
    }

    const engagementDifference = getFeedItemEngagement(second) - getFeedItemEngagement(first)
    if (engagementDifference) {
      return engagementDifference
    }

    return getFeedItemTimestamp(second) - getFeedItemTimestamp(first)
  })
}

const getRecentCreatedPosts = () => {
  if (typeof window === 'undefined') {
    return [] as RecentCreatedPost[]
  }

  try {
    const now = Date.now()
    const items = JSON.parse(window.sessionStorage.getItem(RECENT_CREATED_POSTS_KEY) || '[]') as RecentCreatedPost[]
    const freshItems = items.filter((item) => {
      const storedTime = new Date(item.storedAt).getTime()
      return item.post?.id && Number.isFinite(storedTime) && now - storedTime < RECENT_CREATED_POST_TTL_MS
    })

    if (freshItems.length !== items.length) {
      window.sessionStorage.setItem(RECENT_CREATED_POSTS_KEY, JSON.stringify(freshItems))
    }

    return freshItems
  } catch {
    window.sessionStorage.removeItem(RECENT_CREATED_POSTS_KEY)
    return []
  }
}

const loadMorePosts = async () => {
  if (isLoadingMore.value || !hasMorePosts.value) {
    return
  }

  isLoadingMore.value = true

  window.setTimeout(async () => {
    visiblePostCount.value = Math.min(
      visiblePostCount.value + LOAD_BATCH_SIZE,
      feedItems.value.length,
    )
    isLoadingMore.value = false
    await nextTick()
  }, 350)
}

const buildAuthorLookup = async (posts: PostRecord[], questions: QuestionRecord[]) => {
  const userIds = Array.from(new Set([
    ...posts.filter((post) => !(post.pageId || post.page_id)).map(getPostUserId),
    ...questions.map(getQuestionUserId),
  ].filter(Boolean)))
  const entries = await mapWithConcurrency(
    userIds,
    ENRICHMENT_CONCURRENCY,
    async (userId) => {
      const authorData = await loadQuestionAuthorProfile(
        userId,
        authStore.userId,
        currentUser.profileData.value,
        authStore.authToken,
      )

      return [userId, authorData] as const
    },
  )

  return new Map(entries)
}

const buildPageLookup = async (posts: PostRecord[]) => {
  const pagePosts = posts.filter((post) => post.pageId || post.page_id)
  const lookup = new Map<string, NonNullable<PostRecord['page']> | PageRecord>()

  pagePosts.forEach((post) => {
    const pageId = post.pageId || post.page_id

    if (pageId && post.page?.name) {
      lookup.set(pageId, post.page)
    }
  })

  const missingPageIds = Array.from(new Set(
    pagePosts
      .map((post) => post.pageId || post.page_id)
      .filter((pageId): pageId is string => Boolean(pageId && !lookup.has(pageId))),
  ))
  const entries = await mapWithConcurrency(
    missingPageIds,
    ENRICHMENT_CONCURRENCY,
    async (pageId) => {
      const response = await pagesService.getPage(pageId, authStore.authToken).catch(() => null)
      return [pageId, response?.data ?? null] as const
    },
  )

  entries.forEach(([pageId, page]) => {
    if (page) {
      lookup.set(pageId, page)
    }
  })

  return lookup
}

const loadFeedPost = async (post: PostRecord, authorLookup: AuthorLookup, pageLookup: PageLookup) => {
  const [mediaResponse] = await Promise.all([
    postsService.listPostMedia(post.id, authStore.authToken).catch(() => null),
  ])
  const pageId = post.pageId || post.page_id

  return mapApiPostToFeedPost(
    post,
    mediaResponse?.data ?? [],
    authorLookup.get(getPostUserId(post)) ?? null,
    communitiesById.value.get(post.community_id || post.communityId || '')?.name,
    pageId ? pageLookup.get(pageId) ?? null : null,
  )
}

const loadFeedQuestion = async (question: QuestionRecord, authorLookup: AuthorLookup) => {
  const userId = getQuestionUserId(question)
  const community = communitiesById.value.get(question.communityId || question.community_id || '')

  return mapApiQuestionToFeedPost(
    question,
    userId ? authorLookup.get(userId) ?? null : null,
    community?.name,
    community,
  )
}

const setupObserver = () => {
  observer?.disconnect()

  if (!loadMoreTrigger.value) {
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      const [entry] = entries

      if (entry?.isIntersecting) {
        void loadMorePosts()
      }
    },
    {
      root: null,
      rootMargin: '0px 0px 360px 0px',
      threshold: 0.1,
    },
  )

  observer.observe(loadMoreTrigger.value)
}

const loadFeed = async (options: { background?: boolean } = {}) => {
  if (!options.background) {
    isLoadingFeed.value = true
  }
  feedError.value = ''

  try {
    const feedSort = activeFeedSort.value
    const [postsResult, questionsResult, advertsResult, communitiesResult] = await Promise.allSettled([
      postsService.listPosts({ per_page: FEED_PAGE_SIZE, sort: feedSort }, authStore.authToken),
      questionsService.listQuestions({ per_page: FEED_PAGE_SIZE, sort: feedSort }, authStore.authToken),
      advertsService.listAdverts(
        {
          per_page: 20,
          sort: '-createdAt',
        },
        authStore.authToken,
      ),
      communitiesService.listCommunities({ per_page: 100, limit: 100 }, authStore.authToken),
    ])

    if (communitiesResult.status === 'fulfilled') {
      communitiesById.value = new Map(
        (communitiesResult.value.data ?? []).map((community) => [community.id, community]),
      )
    }

    const rawPosts = postsResult.status === 'fulfilled' ? postsResult.value.data ?? [] : []
    const rawQuestions = questionsResult.status === 'fulfilled' ? questionsResult.value.data ?? [] : []
    const [authorLookup, pageLookup] = await Promise.all([
      buildAuthorLookup(rawPosts, rawQuestions),
      buildPageLookup(rawPosts),
    ])

    const posts = await mapWithConcurrency(
      rawPosts,
      ENRICHMENT_CONCURRENCY,
      (post) => loadFeedPost(post, authorLookup, pageLookup),
    )
    const questions = await Promise.all(rawQuestions.map((question) => loadFeedQuestion(question, authorLookup)))

    adverts.value = advertsResult.status === 'fulfilled' ? advertsResult.value.data ?? [] : []
    const apiPostIds = new Set(posts.map((post) => post.apiId || post.slug))
    const recentPosts = getRecentCreatedPosts()
      .filter((item) => !apiPostIds.has(item.post.id))
      .map((item) =>
        mapApiPostToFeedPost(
          item.post,
          item.media ?? [],
          currentUser.profileData.value,
          communitiesById.value.get(item.post.community_id || item.post.communityId || '')?.name,
        ),
      )

    const nextPosts = sortFeedItems([...recentPosts, ...posts, ...questions])
    if (getFeedSignature(apiPosts.value) !== getFeedSignature(nextPosts)) {
      apiPosts.value = nextPosts
    }
    visiblePostCount.value = apiPosts.value.length
      ? Math.max(visiblePostCount.value, INITIAL_POST_COUNT)
      : INITIAL_POST_COUNT

    if (postsResult.status === 'rejected' && questionsResult.status === 'rejected') {
      throw postsResult.reason
    }

    if (postsResult.status === 'rejected' || questionsResult.status === 'rejected') {
      const failed =
        postsResult.status === 'rejected'
          ? postsResult.reason
          : questionsResult.status === 'rejected'
            ? questionsResult.reason
            : null
      feedError.value =
        failed instanceof ApiError
          ? failed.message
          : 'Some feed items could not be loaded from the server.'
    }
  } catch (error) {
    if (!options.background) {
      feedError.value =
        error instanceof ApiError ? error.message : 'Unable to load the feed from the server.'
      apiPosts.value = []
      adverts.value = []
    }
  } finally {
    if (!options.background) {
      isLoadingFeed.value = false
    }
  }
}

const handlePostCreated = () => {
  visiblePostCount.value = INITIAL_POST_COUNT
  void loadFeed({ background: true })
}

onMounted(() => {
  void loadFeed()
  setupObserver()
  window.addEventListener(POST_CREATED_EVENT, handlePostCreated)
  realtimeTimer = window.setInterval(() => {
    if (!isLoadingFeed.value) {
      void loadFeed({ background: true })
    }
  }, 45000)
})

watch(loadMoreTrigger, async () => {
  await nextTick()
  setupObserver()
})

watch(activeFeedMode, () => {
  visiblePostCount.value = INITIAL_POST_COUNT
  void loadFeed()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener(POST_CREATED_EVENT, handlePostCreated)
  if (realtimeTimer) {
    window.clearInterval(realtimeTimer)
  }
})
</script>

<template>
  <section class="space-y-6">
    <div
      v-if="feedError"
      class="rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-soft)]"
    >
      {{ feedError }}
    </div>

    <div
      v-if="isLoadingFeed"
      class="space-y-6"
      aria-label="Loading posts"
    >
      <article
        v-for="item in INITIAL_POST_COUNT"
        :key="item"
        class="animate-pulse rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4"
      >
        <div class="flex items-start gap-4">
          <div class="h-16 w-16 rounded-[1.4rem] bg-[var(--surface-muted)]" />
          <div class="min-w-0 flex-1 space-y-3">
            <div class="h-4 w-44 rounded-full bg-[var(--surface-muted)]" />
            <div class="h-3 w-28 rounded-full bg-[var(--surface-muted)]" />
          </div>
        </div>
        <div class="mt-5 space-y-2">
          <div class="h-4 w-3/4 rounded-full bg-[var(--surface-muted)]" />
          <div class="h-3 w-full rounded-full bg-[var(--surface-muted)]" />
          <div class="h-3 w-2/3 rounded-full bg-[var(--surface-muted)]" />
        </div>
        <div class="mt-4 h-56 rounded-[0.8rem] bg-[var(--surface-muted)]" />
      </article>
    </div>

    <div
      v-else-if="!feedItems.length"
      class="rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-5 py-10 text-center"
    >
      <h2 class="text-base font-semibold text-[var(--text-primary)]">No posts yet</h2>
      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
        Fresh posts from people you follow and public conversations will appear here as soon as they are available.
      </p>
    </div>

    <div
      v-else
      class="space-y-6"
    >
      <template v-for="item in visibleFeedItems" :key="item.id">
        <AppFeedPost
          v-if="item.type === 'post'"
          :post="item.post"
        />
        <FeedAdvertCard
          v-else
          :advert="item.advert"
        />
      </template>
    </div>

    <div
      ref="loadMoreTrigger"
      class="flex min-h-16 items-center justify-center"
      aria-live="polite"
    >
      <div
        v-if="isLoadingMore"
        class="flex items-center gap-2 rounded-full border border-(--border-soft) bg-(--surface-primary) px-4 py-3 shadow-(--shadow-elevated)"
        aria-label="Loading more posts"
      >
        <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-(--accent)" />
        <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-(--accent)" />
        <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-(--accent)" />
      </div>

      <p
        v-else-if="feedItems.length && !hasMorePosts"
        class="text-sm text-(--text-tertiary)"
      >
        You’re all caught up for now.
      </p>
    </div>
  </section>
</template>
