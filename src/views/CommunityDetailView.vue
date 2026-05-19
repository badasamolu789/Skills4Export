<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import AppFeedPost from '@/components/AppFeedPost.vue'
import type { FeedPost } from '@/data/feedPosts'
import { ClipboardList, Plus } from 'lucide-vue-next'
import { ApiError } from '@/lib/api'
import {
  communitiesService,
  type CommunityMemberRecord,
  type CommunityRecord,
} from '@/services/communities'
import { postsService, type PostRecord } from '@/services/posts'
import { questionsService, type QuestionRecord } from '@/services/questions'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { getCommunityLineAwesomeClass } from '@/utils/communityIcon'
import { getPostCommunityId, mapApiPostToFeedPost } from '@/utils/postMapper'
import { getQuestionCommunityId, getQuestionUserId, mapApiQuestionToFeedPost } from '@/utils/questionMapper'

const route = useRoute()
const authStore = useAuthStore()
const community = ref<CommunityRecord | null>(null)
const members = ref<CommunityMemberRecord[]>([])
const isLoadingCommunity = ref(false)
const isLoadingCommunityFeed = ref(false)
const isJoining = ref(false)
const communityError = ref('')
const communityFeedError = ref('')
const communityFeed = ref<FeedPost[]>([])

const COMMUNITY_FOLLOWS_KEY = 'skills4export-community-follows'

const getMemberUserId = (member: CommunityMemberRecord) => member.userId || member.user_id || member.user?.id || ''

const getStoredCommunityFollows = () => {
  if (typeof window === 'undefined') {
    return {} as Record<string, string[]>
  }

  try {
    return JSON.parse(window.localStorage.getItem(COMMUNITY_FOLLOWS_KEY) || '{}') as Record<string, string[]>
  } catch {
    return {}
  }
}

const setStoredCommunityFollow = (communityId: string, isFollowing: boolean) => {
  if (typeof window === 'undefined' || !authStore.userId) {
    return
  }

  const follows = getStoredCommunityFollows()
  const userFollows = new Set(follows[authStore.userId] ?? [])

  if (isFollowing) {
    userFollows.add(communityId)
  } else {
    userFollows.delete(communityId)
  }

  follows[authStore.userId] = [...userFollows]
  window.localStorage.setItem(COMMUNITY_FOLLOWS_KEY, JSON.stringify(follows))
}

const hasStoredCommunityFollow = computed(() => {
  if (!community.value?.id || !authStore.userId) {
    return false
  }

  return getStoredCommunityFollows()[authStore.userId]?.includes(community.value.id) ?? false
})

const isMember = computed(() =>
  Boolean(authStore.userId) &&
  (
    members.value.some((member) => getMemberUserId(member) === authStore.userId) ||
    hasStoredCommunityFollow.value
  ),
)
const sortedCommunityFeed = computed(() =>
  [...communityFeed.value].sort((first, second) => {
    const firstDate = new Date(first.createdAt || first.updatedAt || '').getTime()
    const secondDate = new Date(second.createdAt || second.updatedAt || '').getTime()

    return (Number.isFinite(secondDate) ? secondDate : 0) - (Number.isFinite(firstDate) ? firstDate : 0)
  }),
)

const loadCommunityPost = async (post: PostRecord) => {
  const [mediaResponse, authorResponse] = await Promise.all([
    postsService.listPostMedia(post.id, authStore.authToken).catch(() => null),
    post.user_id
      ? usersService.getUserProfile(post.user_id, authStore.authToken).catch(() => null)
      : Promise.resolve(null),
  ])

  return {
    ...mapApiPostToFeedPost(post, mediaResponse?.data ?? [], authorResponse?.data ?? null),
    communityName: community.value?.name || 'Community post',
  } satisfies FeedPost
}

const loadCommunityQuestion = async (question: QuestionRecord) => {
  const userId = getQuestionUserId(question)
  const authorResponse = userId
    ? await usersService.getUserProfile(userId, authStore.authToken).catch(() => null)
    : null

  return {
    ...mapApiQuestionToFeedPost(question, authorResponse?.data ?? null),
    communityName: community.value?.name || 'Community question',
  } satisfies FeedPost
}

const loadCommunityFeed = async (communityId: string) => {
  isLoadingCommunityFeed.value = true
  communityFeedError.value = ''
  communityFeed.value = []

  try {
    const [postsResult, questionsResult] = await Promise.allSettled([
      postsService.listPosts({ per_page: 100, sort: '-createdAt' }, authStore.authToken),
      questionsService.listQuestions(
        { per_page: 100, sort: '-createdAt' },
        authStore.authToken,
        { suppressErrorModal: true },
      ),
    ])

    const communityPosts =
      postsResult.status === 'fulfilled'
        ? postsResult.value.data.filter((post) => getPostCommunityId(post) === communityId)
        : []
    const communityQuestions =
      questionsResult.status === 'fulfilled'
        ? questionsResult.value.data.filter((question) => getQuestionCommunityId(question) === communityId)
        : []

    const [mappedPosts, mappedQuestions] = await Promise.all([
      Promise.all(communityPosts.map((post) => loadCommunityPost(post))),
      Promise.all(communityQuestions.map((question) => loadCommunityQuestion(question))),
    ])

    communityFeed.value = [...mappedPosts, ...mappedQuestions]
  } catch (error) {
    communityFeedError.value = error instanceof ApiError ? error.message : 'Unable to load community feed.'
  } finally {
    isLoadingCommunityFeed.value = false
  }
}

const loadCommunity = async (id: string) => {
  isLoadingCommunity.value = true
  communityError.value = ''
  community.value = null
  members.value = []
  communityFeed.value = []

  try {
    const [communityResponse, membersResponse] = await Promise.all([
      communitiesService.getCommunity(id, authStore.authToken),
      communitiesService.listCommunityMembers(id, authStore.authToken).catch(() => null),
    ])
    community.value = communityResponse.data
    members.value = membersResponse?.data ?? []
    await loadCommunityFeed(communityResponse.data.id)
  } catch (error) {
    communityError.value = error instanceof ApiError ? error.message : 'Unable to load this community.'
  } finally {
    isLoadingCommunity.value = false
  }
}

const toggleMembership = async () => {
  if (!community.value || isJoining.value) {
    return
  }

  if (!authStore.authToken) {
    toast.error('Sign in required', {
      description: 'Please sign in again before joining a community.',
    })
    return
  }

  isJoining.value = true

  try {
    if (isMember.value) {
      await communitiesService.leaveCommunity(community.value.id, authStore.authToken)
      members.value = members.value.filter((member) => getMemberUserId(member) !== authStore.userId)
      setStoredCommunityFollow(community.value.id, false)
      toast.success('Unfollowed community')
      return
    }

    const response = await communitiesService.joinCommunity(community.value.id, authStore.authToken)
    members.value = [
      {
        ...response.data,
        userId: response.data.userId || response.data.user_id || authStore.userId,
        communityId: response.data.communityId || response.data.community_id || community.value.id,
      },
      ...members.value.filter((member) => getMemberUserId(member) !== authStore.userId),
    ]
    setStoredCommunityFollow(community.value.id, true)
    toast.success('Following community')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to update community membership.'
    toast.error('Community failed', { description: message })
  } finally {
    isJoining.value = false
  }
}

watch(
  () => route.params.slug,
  (slug) => {
    void loadCommunity(String(slug))
  },
  { immediate: true },
)
</script>

<template>
  <section v-if="isLoadingCommunity" class="space-y-6">
    <div class="animate-pulse rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-soft)]">
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <div class="space-y-4">
          <div class="h-8 w-64 max-w-full rounded-full bg-[var(--surface-secondary)]" />
          <div class="h-4 w-full max-w-3xl rounded-full bg-[var(--surface-secondary)]" />
          <div class="h-4 w-2/3 max-w-2xl rounded-full bg-[var(--surface-secondary)]" />
          <div class="h-11 w-44 rounded-[0.75rem] bg-[var(--surface-secondary)]" />
        </div>
        <div class="h-12 rounded-[0.75rem] bg-[var(--surface-secondary)]" />
      </div>
    </div>
  </section>

  <section v-else-if="community" class="space-y-6">
    <div class="flex flex-wrap items-center gap-2 px-1 text-sm text-[var(--text-secondary)]">
      <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
      <span>/</span>
      <RouterLink to="/communities" class="transition hover:text-[var(--accent-strong)]">Communities</RouterLink>
    </div>

    <section class="relative overflow-hidden rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-elevated)] sm:p-8">
      <div class="pointer-events-none absolute right-8 top-0 hidden h-full w-48 opacity-60 lg:block">
        <div class="absolute right-10 top-0 h-full w-px rotate-[-32deg] bg-[var(--border-soft)]" />
        <div class="absolute right-20 top-0 h-full w-px rotate-[-32deg] bg-[var(--border-soft)]" />
        <div class="absolute right-[7.5rem] top-0 h-full w-px rotate-[-32deg] bg-[var(--border-soft)]" />
      </div>

      <div class="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start">
        <div class="flex min-w-0 items-start gap-4">
          <span class="mt-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.4rem] bg-[var(--surface-secondary)] text-[var(--accent-strong)]">
            <i :class="getCommunityLineAwesomeClass(community)" class="text-[2rem] leading-none" aria-hidden="true" />
          </span>

          <div class="min-w-0">
            <h1 class="text-[2rem] font-semibold leading-tight tracking-normal text-[var(--text-primary)] sm:text-[2.4rem]">
              {{ community.name }}
            </h1>
            <p
              class="mt-4 max-w-4xl overflow-hidden text-sm leading-7 text-[var(--text-secondary)] sm:text-base"
              style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;"
            >
              {{ community.description || 'No community description has been added yet.' }}
            </p>

            <RouterLink
              to="/community-regulations"
              class="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--surface-secondary)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--accent-strong)]"
            >
              <ClipboardList class="h-4 w-4" />
              View Regulations
            </RouterLink>
          </div>
        </div>

        <div class="flex items-start justify-start lg:justify-end lg:pt-10">
          <button
            type="button"
            :disabled="isJoining"
            class="inline-flex h-12 min-w-40 items-center justify-center gap-2 rounded-[0.75rem] px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            :class="
              isMember
                ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]'
                : 'bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)] hover:text-[var(--accent-strong)]'
            "
            @click="toggleMembership"
            title="Follow this community to get alerted with updates."
          >
            <Plus v-if="!isMember" class="h-4 w-4" />
            {{ isJoining ? 'Updating...' : isMember ? 'Following' : 'Follow' }}
          </button>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <div v-if="isLoadingCommunityFeed" class="space-y-3">
        <article
          v-for="item in 2"
          :key="item"
          class="animate-pulse rounded-3xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-soft)]"
        >
          <div class="h-4 w-32 rounded-full bg-[var(--surface-secondary)]" />
          <div class="mt-4 h-6 w-2/3 rounded-full bg-[var(--surface-secondary)]" />
          <div class="mt-3 h-4 w-full rounded-full bg-[var(--surface-secondary)]" />
          <div class="mt-2 h-4 w-4/5 rounded-full bg-[var(--surface-secondary)]" />
        </article>
      </div>

      <div v-else-if="communityFeedError" class="rounded-[1.35rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-soft)]">
        {{ communityFeedError }}
      </div>

      <div v-else-if="sortedCommunityFeed.length" class="space-y-4">
        <AppFeedPost
          v-for="post in sortedCommunityFeed"
          :key="post.apiId || post.slug"
          :post="post"
        />
      </div>

      <div v-else class="rounded-[1.35rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-soft)]">
        <p class="text-sm font-semibold text-[var(--text-primary)]">No community posts yet.</p>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          Select this community when posting or asking a question to start the feed.
        </p>
      </div>
    </section>
  </section>

  <section v-else class="rounded-[1.35rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-soft)]">
    <h1 class="text-xl font-semibold text-[var(--text-primary)]">Community not found</h1>
    <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
      {{ communityError || 'The community you opened is not available.' }}
    </p>
  </section>
</template>
