<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClipboardList, Newspaper, PenLine, SmilePlus } from 'lucide-vue-next'
import AppFeedPost from '@/components/AppFeedPost.vue'
import { ApiError } from '@/lib/api'
import { communitiesService, type CommunityRecord } from '@/services/communities'
import { postsService, type PostRecord } from '@/services/posts'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { getCommunityLineAwesomeClass } from '@/utils/communityIcon'
import { getPostCommunityId, getPostUserId, mapApiPostToFeedPost } from '@/utils/postMapper'
import { richTextToPlainText } from '@/utils/richText'
import type { FeedPost } from '@/data/feedPosts'

const OPEN_COMPOSER_EVENT = 'skills4export:open-composer'
const POST_CREATED_EVENT = 'skills4export:post-created'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const community = ref<CommunityRecord | null>(null)
const posts = ref<Array<{ record: PostRecord; feedPost: FeedPost }>>([])
const isLoading = ref(false)
const errorMessage = ref('')

const pageKind = computed(() => String(route.meta.specialCommunity ?? 'jokes'))
const targetCommunityName = computed(() => pageKind.value === 'headlines' ? 'Headlines' : 'Jokes')
const isHeadlinesPage = computed(() => pageKind.value === 'headlines')
const selectedHeadlineId = computed(() => String(route.query.headline ?? ''))

const sortedPosts = computed(() => {
  return [...posts.value].sort((first, second) => {
    const firstDate = new Date(first.feedPost.createdAt || first.feedPost.updatedAt || '').getTime()
    const secondDate = new Date(second.feedPost.createdAt || second.feedPost.updatedAt || '').getTime()
    return (Number.isFinite(secondDate) ? secondDate : 0) - (Number.isFinite(firstDate) ? firstDate : 0)
  })
})

const visiblePosts = computed(() => {
  if (!isHeadlinesPage.value || !selectedHeadlineId.value) {
    return sortedPosts.value
  }

  return sortedPosts.value.filter((item) => item.record.id === selectedHeadlineId.value)
})

const headlineLinks = computed(() =>
  sortedPosts.value.map((item) => ({
    id: item.record.id,
    title: item.feedPost.title,
    to: {
      path: '/headlines',
      query: { headline: item.record.id },
    },
  })),
)

const findSpecialCommunity = (items: CommunityRecord[]) => {
  const target = targetCommunityName.value.toLowerCase()

  return items.find((item) => item.name?.trim().toLowerCase() === target) ?? null
}

const loadPost = async (post: PostRecord) => {
  const postUserId = getPostUserId(post)
  const [mediaResponse, authorResponse] = await Promise.all([
    postsService.listPostMedia(post.id, authStore.authToken),
    postUserId
      ? usersService.getUserProfile(postUserId, authStore.authToken)
      : Promise.resolve(null),
  ])

  return {
    record: post,
    feedPost: {
      ...mapApiPostToFeedPost(
        post,
        mediaResponse.data ?? [],
        authorResponse?.data ?? null,
        community.value?.name || targetCommunityName.value,
      ),
      communityName: community.value?.name || targetCommunityName.value,
    },
  }
}

const loadPage = async () => {
  isLoading.value = true
  errorMessage.value = ''
  community.value = null
  posts.value = []

  try {
    const communitiesResponse = await communitiesService.listCommunities(
      { per_page: 100, limit: 100 },
      authStore.authToken,
    )
    const matchedCommunity = findSpecialCommunity(communitiesResponse.data ?? [])

    if (!matchedCommunity) {
      throw new Error(`${targetCommunityName.value} community was not found.`)
    }

    community.value = matchedCommunity

    const postsResponse = await postsService.listPosts(
      { per_page: 100, sort: '-createdAt', communityId: matchedCommunity.id },
      authStore.authToken,
    )
    const communityPosts = (postsResponse.data ?? []).filter(
      (post) => getPostCommunityId(post) === matchedCommunity.id,
    )
    posts.value = await Promise.all(communityPosts.map((post) => loadPost(post)))
  } catch (error) {
    errorMessage.value = error instanceof ApiError || error instanceof Error
      ? error.message
      : `Unable to load ${targetCommunityName.value}.`
  } finally {
    isLoading.value = false
  }
}

const openCommunityPostModal = () => {
  if (!community.value) {
    return
  }

  window.dispatchEvent(
    new CustomEvent(OPEN_COMPOSER_EVENT, {
      detail: {
        type: 'post',
        communityId: community.value.id,
        lockCommunity: true,
      },
    }),
  )
}

const clearSelectedHeadline = () => {
  void router.replace({ path: '/headlines' })
}

const handlePostCreated = () => {
  if (community.value) {
    void loadPage()
  }
}

watch(
  () => route.meta.specialCommunity,
  () => {
    void loadPage()
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener(POST_CREATED_EVENT, handlePostCreated)
})

onBeforeUnmount(() => {
  window.removeEventListener(POST_CREATED_EVENT, handlePostCreated)
})
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-wrap items-center gap-2 px-1 text-sm text-[var(--text-secondary)]">
      <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
      <span>/</span>
      <span class="font-medium text-[var(--accent-strong)]">{{ targetCommunityName }}</span>
    </div>

    <section class="relative overflow-hidden rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-elevated)] sm:p-8">
      <div class="pointer-events-none absolute right-8 top-0 hidden h-full w-48 opacity-60 lg:block">
        <div class="absolute right-10 top-0 h-full w-px rotate-[-32deg] bg-[var(--border-soft)]" />
        <div class="absolute right-20 top-0 h-full w-px rotate-[-32deg] bg-[var(--border-soft)]" />
        <div class="absolute right-[7.5rem] top-0 h-full w-px rotate-[-32deg] bg-[var(--border-soft)]" />
      </div>

      <div class="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-[var(--surface-secondary)] text-[var(--accent-strong)]">
              <Newspaper v-if="isHeadlinesPage" class="h-6 w-6" />
              <i v-else-if="community" :class="getCommunityLineAwesomeClass(community)" class="text-[1.6rem] leading-none" aria-hidden="true" />
              <SmilePlus v-else class="h-6 w-6" />
            </span>
            <div>
              <h1 class="text-[2rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[2.35rem]">
                {{ targetCommunityName }}
              </h1>
              <p class="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                {{ richTextToPlainText(community?.description) || (isHeadlinesPage ? 'Join the discussions.' : 'Share decent jokes and anecdotes with the community.') }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex shrink-0 flex-row flex-wrap items-center gap-2 lg:min-w-[26rem] lg:justify-end">
          <button
            v-if="!isHeadlinesPage"
            type="button"
            :disabled="!community"
            class="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[0.75rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            @click="openCommunityPostModal"
          >
            <PenLine class="h-4 w-4" />
            Page Post
          </button>
          <RouterLink
            to="/community-regulations"
            class="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[0.75rem] bg-[var(--surface-secondary)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--accent-strong)]"
          >
            <ClipboardList class="h-4 w-4" />
            View Regulations
          </RouterLink>
        </div>
      </div>
    </section>

    <div
      :class="
        isHeadlinesPage
          ? 'grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]'
          : 'space-y-5'
      "
    >
      <aside
        v-if="isHeadlinesPage"
        class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-elevated)] lg:sticky lg:top-28 lg:self-start"
      >
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-semibold text-[var(--text-primary)]">Today's Headline Topics</h2>
          <button
            v-if="selectedHeadlineId"
            type="button"
            class="text-xs font-semibold text-[var(--accent-strong)]"
            @click="clearSelectedHeadline"
          >
            All
          </button>
        </div>

        <div v-if="isLoading" class="mt-4 space-y-3">
          <div v-for="item in 6" :key="item" class="flex animate-pulse gap-2">
            <span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm bg-[var(--surface-muted)]" />
            <span class="h-4 flex-1 rounded-full bg-[var(--surface-muted)]" />
          </div>
        </div>

        <nav v-else-if="headlineLinks.length" class="mt-4 space-y-2">
          <RouterLink
            v-for="item in headlineLinks"
            :key="item.id"
            :to="item.to"
            class="flex gap-2 rounded-lg px-2 py-2 text-sm leading-6 text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--accent-strong)]"
            :class="selectedHeadlineId === item.id ? 'bg-[var(--surface-secondary)] font-semibold text-[var(--accent-strong)]' : ''"
          >
            <span class="mt-2 h-2 w-2 shrink-0 rounded-sm bg-[var(--accent-strong)]" />
            <span>{{ item.title }}</span>
          </RouterLink>
        </nav>

        <p v-else class="mt-4 rounded-lg border border-dashed border-[color:var(--border-soft)] p-3 text-sm leading-6 text-[var(--text-secondary)]">
          Headline links will appear here once posts are available.
        </p>
      </aside>

      <section class="space-y-4">
        <div v-if="isLoading" class="space-y-3">
          <article
            v-for="item in 3"
            :key="item"
            class="animate-pulse rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-soft)]"
          >
            <div class="h-4 w-32 rounded-full bg-[var(--surface-secondary)]" />
            <div class="mt-4 h-6 w-2/3 rounded-full bg-[var(--surface-secondary)]" />
            <div class="mt-3 h-4 w-full rounded-full bg-[var(--surface-secondary)]" />
            <div class="mt-2 h-4 w-4/5 rounded-full bg-[var(--surface-secondary)]" />
          </article>
        </div>

        <div v-else-if="errorMessage" class="rounded-[1.35rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-soft)]">
          {{ errorMessage }}
        </div>

        <div v-else-if="visiblePosts.length" class="space-y-4">
          <AppFeedPost
            v-for="item in visiblePosts"
            :key="item.feedPost.apiId || item.feedPost.slug"
            :post="item.feedPost"
          />
        </div>

        <div v-else class="rounded-[1.35rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-soft)]">
          <p class="text-sm font-semibold text-[var(--text-primary)]">No posts yet.</p>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">
            {{ isHeadlinesPage ? 'Headline discussions will appear here once posts are available.' : 'Use Page Post to start the jokes feed.' }}
          </p>
        </div>
      </section>
    </div>
  </section>
</template>
