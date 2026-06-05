<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppFeedPost from '@/components/AppFeedPost.vue'
import FeedAdvertCard from '@/components/FeedAdvertCard.vue'
import { useCurrentUserIdentity } from '@/composables/useCurrentUserIdentity'
import type { FeedPost } from '@/data/feedPosts'
import { ApiError } from '@/lib/api'
import { advertsService, type AdvertRecord } from '@/services/adverts'
import { communitiesService, type CommunityRecord } from '@/services/communities'
import { pagesService, type PageRecord } from '@/services/pages'
import { postsService, type PostRecord } from '@/services/posts'
import { questionsService, type QuestionRecord } from '@/services/questions'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { mapWithConcurrency } from '@/utils/async'
import { mapApiPostToFeedPost } from '@/utils/postMapper'
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
    ...posts.filter((post) => !(post.pageId || post.page_id)).map((post) => post.user_id),
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
    authorLookup.get(post.user_id) ?? null,
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
    const [postsResult, questionsResult, advertsResult, communitiesResult] = await Promise.allSettled([
      postsService.listPosts({ per_page: FEED_PAGE_SIZE, sort: '-createdAt' }, authStore.authToken),
      questionsService.listQuestions({ per_page: FEED_PAGE_SIZE, sort: '-createdAt' }, authStore.authToken),
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
    const nextPosts = [...posts, ...questions].sort(
      (first, second) =>
        new Date(second.createdAt || second.updatedAt || '').getTime() -
        new Date(first.createdAt || first.updatedAt || '').getTime(),
    )
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

onMounted(() => {
  void loadFeed()
  setupObserver()
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

onBeforeUnmount(() => {
  observer?.disconnect()
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
        class="inline-flex items-center gap-3 rounded-full border border-(--border-soft) bg-(--surface-primary) px-4 py-2 text-sm text-(--text-secondary) shadow-(--shadow-elevated)"
      >
        <span class="h-2.5 w-2.5 animate-pulse rounded-full bg-(--accent)" />
        Loading more posts...
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
