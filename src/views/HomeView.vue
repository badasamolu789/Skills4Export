<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppFeedPost from '@/components/AppFeedPost.vue'
import type { FeedPost } from '@/data/feedPosts'
import { ApiError } from '@/lib/api'
import { postsService, type PostRecord } from '@/services/posts'
import { questionsService, type QuestionRecord } from '@/services/questions'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { mapApiPostToFeedPost } from '@/utils/postMapper'
import { getQuestionUserId, mapApiQuestionToFeedPost } from '@/utils/questionMapper'

type FeedItem = {
  id: string
  post: FeedPost
}

const INITIAL_POST_COUNT = 4
const LOAD_BATCH_SIZE = 3

const loadMoreTrigger = ref<HTMLElement | null>(null)
const visiblePostCount = ref(INITIAL_POST_COUNT)
const isLoadingMore = ref(false)
const isLoadingFeed = ref(false)
const feedError = ref('')
const apiPosts = ref<FeedPost[]>([])
const authStore = useAuthStore()

const feedItems = computed<FeedItem[]>(() => {
  return apiPosts.value.map((post) => ({
    id: post.apiId || post.slug,
    post,
  }))
})

const visiblePosts = computed(() => feedItems.value.slice(0, visiblePostCount.value))
const hasMorePosts = computed(() => visiblePostCount.value < feedItems.value.length)

let observer: IntersectionObserver | null = null

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

const loadFeedPost = async (post: PostRecord) => {
  const [mediaResponse, authorResponse, commentsResponse] = await Promise.all([
    postsService.listPostMedia(post.id, authStore.authToken).catch(() => null),
    post.user_id
      ? usersService.getUserProfile(post.user_id, authStore.authToken).catch(() => null)
      : Promise.resolve(null),
    postsService.listComments(post.id, authStore.authToken).catch(() => null),
  ])

  const mappedPost = mapApiPostToFeedPost(
    post,
    mediaResponse?.data ?? [],
    authorResponse?.data ?? null,
  )

  if ('comments' in mappedPost && commentsResponse) {
    return {
      ...mappedPost,
      comments: commentsResponse.total,
    }
  }

  return mappedPost
}

const loadFeedQuestion = async (question: QuestionRecord) => {
  const userId = getQuestionUserId(question)
  const authorResponse = userId
    ? await usersService.getUserProfile(userId, authStore.authToken).catch(() => null)
    : null
  const authorData =
    authorResponse?.data ??
    (userId && userId === authStore.userId
      ? {
          user: {
            id: authStore.userId,
            username:
              authStore.userProfile?.username ||
              authStore.signUpDraft.username ||
              authStore.signUpDraft.name ||
              'You',
            email: authStore.signUpDraft.email,
          },
          profile: authStore.userProfile,
        }
      : null)

  return mapApiQuestionToFeedPost(question, authorData)
}

const getFeedSortTime = (post: FeedPost) => {
  const value = post.createdAt || ('updatedAt' in post ? post.updatedAt : '') || ''
  const timestamp = new Date(value).getTime()

  return Number.isNaN(timestamp) ? 0 : timestamp
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

const loadFeed = async () => {
  isLoadingFeed.value = true
  feedError.value = ''

  try {
    const [postsResult, questionsResult] = await Promise.allSettled([
      postsService.listPosts(authStore.authToken),
      questionsService.listQuestions(authStore.authToken),
    ])

    const posts =
      postsResult.status === 'fulfilled'
        ? await Promise.all(postsResult.value.data.map((post) => loadFeedPost(post)))
        : []

    const questions =
      questionsResult.status === 'fulfilled'
        ? await Promise.all(questionsResult.value.data.map((question) => loadFeedQuestion(question)))
        : []

    apiPosts.value = [...posts, ...questions].sort((a, b) => getFeedSortTime(b) - getFeedSortTime(a))
    visiblePostCount.value = INITIAL_POST_COUNT

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
    feedError.value =
      error instanceof ApiError ? error.message : 'Unable to load the feed from the server.'
    apiPosts.value = []
  } finally {
    isLoadingFeed.value = false
  }
}

onMounted(() => {
  void loadFeed()
  setupObserver()
})

watch(loadMoreTrigger, async () => {
  await nextTick()
  setupObserver()
})

onBeforeUnmount(() => {
  observer?.disconnect()
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
      <AppFeedPost
        v-for="item in visiblePosts"
        :key="item.id"
        :post="item.post"
      />
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
