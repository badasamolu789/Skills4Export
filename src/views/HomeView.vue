<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppFeedPost from '@/components/AppFeedPost.vue'
import { feedPosts, type FeedPost } from '@/data/feedPosts'

type FeedItem = {
  id: string
  post: FeedPost
}

const INITIAL_POST_COUNT = 4
const LOAD_BATCH_SIZE = 3
const FEED_REPEAT_COUNT = 6

const loadMoreTrigger = ref<HTMLElement | null>(null)
const visiblePostCount = ref(INITIAL_POST_COUNT)
const isLoadingMore = ref(false)

const feedItems = computed<FeedItem[]>(() =>
  Array.from({ length: FEED_REPEAT_COUNT }, (_, repeatIndex) =>
    feedPosts.map((post, postIndex) => ({
      id: `${post.slug}-${repeatIndex + 1}-${postIndex + 1}`,
      post: {
        ...post,
        slug: `${post.slug}-${repeatIndex + 1}`,
      },
    })),
  ).flat(),
)

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

onMounted(() => {
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
    <div class="space-y-6">
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
        v-else-if="!hasMorePosts"
        class="text-sm text-(--text-tertiary)"
      >
        You’re all caught up for now.
      </p>
    </div>
  </section>
</template>
