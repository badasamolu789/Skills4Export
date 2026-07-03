<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppFeedPost from '@/components/AppFeedPost.vue'
import FeedAdvertCard from '@/components/FeedAdvertCard.vue'
import type { FeedPost } from '@/data/feedPosts'
import { ApiError } from '@/lib/api'
import { advertsService, type AdvertRecord } from '@/services/adverts'
import { feedsService } from '@/services/feeds'
import { useAuthStore } from '@/stores/auth'
import { useSocialActionsStore } from '@/stores/socialActions'
import { mapCompactFeedItemToFeedPost } from '@/utils/feedMapper'

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
const FEED_PAGE_SIZE = 10
const FEED_CACHE_TTL_MS = 5 * 60 * 1000
const POST_CREATED_EVENT = 'skills4export:post-created'

const loadMoreTrigger = ref<HTMLElement | null>(null)
const visiblePostCount = ref(INITIAL_POST_COUNT)
const isLoadingMore = ref(false)
const isLoadingFeed = ref(false)
const feedError = ref('')
const adverts = ref<AdvertRecord[]>([])
const currentFeedPage = ref(1)
const lastFeedPage = ref(1)
const authStore = useAuthStore()
const socialActionsStore = useSocialActionsStore()
const apiPosts = computed(() => socialActionsStore.feed)
const route = useRoute()
const activeFeedMode = computed(() => {
  const value = route.query.feed
  return (Array.isArray(value) ? value[0] : value) === 'popular' ? 'popular' : 'latest'
})

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
          : `advert-empty-${index + 1}`,
        type: 'advert',
        advert: feedAdverts.value[advertIndex] ?? null,
      })
    }
  })

  return entries
})
const hasMorePosts = computed(() =>
  visiblePostCount.value < feedItems.value.length ||
  currentFeedPage.value < lastFeedPage.value,
)

let observer: IntersectionObserver | null = null
let realtimeTimer: ReturnType<typeof window.setInterval> | null = null
let feedRequestVersion = 0

const getFeedSignature = (items: FeedPost[]) =>
  items
    .map((item) => {
      const mediaSignature = item.type === 'question'
        ? ''
        : (item.media ?? [])
            .map((media) => `${media.url}:${media.thumbnailUrl || ''}:${media.mediaType || ''}`)
            .join(',')
      const authorSignature = item.type === 'question'
        ? `${item.authorName}:${item.authorAvatarSrc || ''}`
        : `${item.author.name}:${item.author.avatarSrc || ''}`

      return [
        item.type,
        item.apiId || item.slug,
        item.updatedAt || item.createdAt || '',
        item.score ?? 0,
        'comments' in item ? item.comments ?? 0 : item.answers ?? 0,
        authorSignature,
        mediaSignature,
      ].join(':')
    })
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

const getFeedCacheKey = () =>
  `skills4export:feed:${authStore.userId || 'anonymous'}:${activeFeedMode.value}`

const getFeedViewStateKey = () =>
  `skills4export:feed-view:${authStore.userId || 'anonymous'}:${activeFeedMode.value}`

const restoreFeedViewState = () => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const cached = JSON.parse(window.sessionStorage.getItem(getFeedViewStateKey()) || 'null') as {
      visiblePostCount?: number
      currentFeedPage?: number
      lastFeedPage?: number
    } | null

    if (!cached) {
      return
    }

    if (typeof cached.visiblePostCount === 'number' && Number.isFinite(cached.visiblePostCount)) {
      visiblePostCount.value = Math.max(INITIAL_POST_COUNT, Math.floor(cached.visiblePostCount))
    }

    if (typeof cached.currentFeedPage === 'number' && Number.isFinite(cached.currentFeedPage)) {
      currentFeedPage.value = Math.max(1, Math.floor(cached.currentFeedPage))
    }

    if (typeof cached.lastFeedPage === 'number' && Number.isFinite(cached.lastFeedPage)) {
      lastFeedPage.value = Math.max(1, Math.floor(cached.lastFeedPage))
    }
  } catch {
    window.sessionStorage.removeItem(getFeedViewStateKey())
  }
}

const cacheFeedViewState = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(getFeedViewStateKey(), JSON.stringify({
    visiblePostCount: visiblePostCount.value,
    currentFeedPage: currentFeedPage.value,
    lastFeedPage: lastFeedPage.value,
  }))
}

const restoreCachedFeed = () => {
  if (typeof window === 'undefined' || apiPosts.value.length) {
    return false
  }

  try {
    const cached = JSON.parse(window.sessionStorage.getItem(getFeedCacheKey()) || 'null') as {
      storedAt?: number
      items?: FeedPost[]
    } | null

    if (
      cached?.storedAt &&
      Array.isArray(cached.items) &&
      Date.now() - cached.storedAt < FEED_CACHE_TTL_MS
    ) {
      socialActionsStore.setFeed(cached.items)
      return true
    }
  } catch {
    window.sessionStorage.removeItem(getFeedCacheKey())
  }

  return false
}

const cacheFeed = (items: FeedPost[]) => {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(getFeedCacheKey(), JSON.stringify({
    storedAt: Date.now(),
    items,
  }))
}

const loadMorePosts = async () => {
  if (isLoadingMore.value || !hasMorePosts.value) {
    return
  }

  isLoadingMore.value = true

  if (visiblePostCount.value >= feedItems.value.length && currentFeedPage.value < lastFeedPage.value) {
    await loadFeed({
      background: true,
      page: currentFeedPage.value + 1,
      append: true,
    })
    visiblePostCount.value = Math.min(
      visiblePostCount.value + LOAD_BATCH_SIZE,
      feedItems.value.length,
    )
    cacheFeedViewState()
    isLoadingMore.value = false
    await nextTick()
    return
  }

  window.setTimeout(async () => {
    visiblePostCount.value = Math.min(
      visiblePostCount.value + LOAD_BATCH_SIZE,
      feedItems.value.length,
    )
    cacheFeedViewState()
    isLoadingMore.value = false
    await nextTick()
  }, 150)
}

const publishFeed = (items: FeedPost[], append = false) => {
  const mergedItems = append ? [...apiPosts.value, ...items] : items
  const byId = new Map<string, FeedPost>()

  mergedItems.forEach((item) => {
    byId.set(item.apiId || item.slug, item)
  })

  const nextPosts = sortFeedItems(Array.from(byId.values()))

  if (getFeedSignature(apiPosts.value) !== getFeedSignature(nextPosts)) {
    socialActionsStore.setFeed(nextPosts)
  }

  cacheFeed(nextPosts)
  visiblePostCount.value = apiPosts.value.length
    ? Math.max(visiblePostCount.value, INITIAL_POST_COUNT)
    : INITIAL_POST_COUNT
  cacheFeedViewState()
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

const loadFeed = async (options: {
  background?: boolean
  page?: number
  append?: boolean
} = {}) => {
  const requestVersion = ++feedRequestVersion
  const requestedPage = options.page ?? 1

  if (!options.background && !apiPosts.value.length) {
    isLoadingFeed.value = true
  }
  feedError.value = ''

  try {
    const advertsResponse = requestedPage === 1
      ? await advertsService.listAdverts(
          {
            per_page: 20,
            sort: '-createdAt',
          },
        )
      : null

    const compactFeedResponse = await feedsService.listCompactFeed(
      {
        mode: activeFeedMode.value,
        page: requestedPage,
        per_page: FEED_PAGE_SIZE,
      },
      authStore.authToken,
    )

    if (requestVersion !== feedRequestVersion) {
      return
    }

    currentFeedPage.value = compactFeedResponse.current_page || requestedPage
    lastFeedPage.value = compactFeedResponse.last_page || 1
    publishFeed(
      (compactFeedResponse.data ?? []).map(mapCompactFeedItemToFeedPost),
      Boolean(options.append),
    )
    isLoadingFeed.value = false

    if (advertsResponse) {
      adverts.value = advertsResponse.data ?? []
    }
  } catch (error) {
    if (!options.background) {
      feedError.value =
        error instanceof ApiError ? error.message : 'Unable to load the feed from the server.'
      if (!apiPosts.value.length) {
        socialActionsStore.setFeed([])
        adverts.value = []
      }
    }
  } finally {
    if (!options.background && requestVersion === feedRequestVersion) {
      isLoadingFeed.value = false
    }
  }
}

const handlePostCreated = () => {
  visiblePostCount.value = INITIAL_POST_COUNT
  cacheFeedViewState()
  void loadFeed({ background: true })
}

onMounted(() => {
  restoreFeedViewState()
  const restoredFeed = restoreCachedFeed()
  if (!restoredFeed) {
    void loadFeed()
  }
  setupObserver()
  window.addEventListener(POST_CREATED_EVENT, handlePostCreated)
  realtimeTimer = window.setInterval(() => {
    if (!isLoadingFeed.value && currentFeedPage.value === 1) {
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
  currentFeedPage.value = 1
  lastFeedPage.value = 1
  socialActionsStore.setFeed([])
  restoreFeedViewState()
  const restoredFeed = restoreCachedFeed()
  if (!restoredFeed) {
    void loadFeed()
  }
})

onBeforeUnmount(() => {
  cacheFeedViewState()
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
      v-if="isLoadingFeed && !feedItems.length"
      class="space-y-6"
      aria-label="Loading posts"
    >
      <article
        v-for="item in INITIAL_POST_COUNT"
        :key="item"
        class="animate-pulse rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4"
      >
        <div class="flex items-start gap-4">
          <div class="h-16 w-16 rounded-full bg-[var(--surface-muted)]" />
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
