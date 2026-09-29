<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppFeedPost from '@/components/AppFeedPost.vue'
import FeedCardSkeleton from '@/components/FeedCardSkeleton.vue'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useCurrentUserIdentity } from '@/composables/useCurrentUserIdentity'
import type { QuestionPost } from '@/data/feedPosts'
import { getDisplayErrorMessage } from '@/lib/errors'
import { communitiesService, type CommunityRecord } from '@/services/communities'
import { questionsService, type QuestionRecord } from '@/services/questions'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { useSocialActionsStore } from '@/stores/socialActions'
import { readFollowState } from '@/utils/followState'
import { hasNextPage, loadPaginatedRecords } from '@/utils/paginatedLoader'
import { loadQuestionAuthorProfile } from '@/utils/questionAuthor'
import { getQuestionUserId, mapApiQuestionToFeedPost } from '@/utils/questionMapper'

const QUESTIONS_PAGE_SIZE = 5
const COMMUNITIES_PAGE_SIZE = 5

const authStore = useAuthStore()
const socialActionsStore = useSocialActionsStore()
const currentUser = useCurrentUserIdentity()
const isLoadingQuestions = ref(false)
const questionsError = ref('')
const apiQuestions = ref<QuestionPost[]>([])
const hasLoadedApiQuestions = ref(false)
const isLoadingMoreQuestions = ref(false)
const nextQuestionsPage = ref<number | null>(null)
const loadMoreTarget = ref<HTMLElement | null>(null)
const communitiesById = ref(new Map<string, CommunityRecord>())

const questions = computed(() => {
  const loadedIds = new Set(apiQuestions.value.map((question) => question.apiId || question.slug))
  const newGlobalQuestions = socialActionsStore.questions.filter(
    (question) => !loadedIds.has(question.apiId || question.slug),
  )

  return [...newGlobalQuestions, ...apiQuestions.value.map((question) => {
    const globalQuestion = socialActionsStore.questions.find(
      (item) => (item.apiId || item.slug) === (question.apiId || question.slug),
    )
    return globalQuestion ?? question
  })]
})

const loadQuestion = async (question: QuestionRecord) => {
  const userId = getQuestionUserId(question)
  const community = communitiesById.value.get(question.communityId || question.community_id || '')
  const [authorData, answersResponse] = await Promise.all([
    userId
      ? loadQuestionAuthorProfile(userId, authStore.userId, currentUser.profileData.value, authStore.authToken)
      : Promise.resolve(null),
    questionsService.listAnswers(question.id, authStore.authToken),
  ])

  const mappedQuestion = mapApiQuestionToFeedPost(
    {
      ...question,
      answers_count: answersResponse.total ?? question.answers_count,
      answers: answersResponse.data ?? question.answers,
    },
    authorData,
    community?.name,
    community,
  )

  const isFollowingAuthor = readFollowState(mappedQuestion)
  if (userId && isFollowingAuthor !== undefined) {
    socialActionsStore.hydrateUserFollowingState(userId, isFollowingAuthor)
  }

  return {
    ...mappedQuestion,
    ...(userId && socialActionsStore.followingUserIds[userId] !== undefined
      ? { isFollowing: socialActionsStore.isFollowingUser(userId) }
      : isFollowingAuthor !== undefined
        ? { isFollowing: isFollowingAuthor }
        : {}),
  }
}

const loadQuestions = async (page = 1) => {
  if (isLoadingQuestions.value || isLoadingMoreQuestions.value) return
  if (page === 1) isLoadingQuestions.value = true
  else isLoadingMoreQuestions.value = true
  questionsError.value = ''

  try {
    const [communitiesResponse, response] = await Promise.all([
      page === 1
        ? loadPaginatedRecords(
          (params) => communitiesService.listCommunities(params, authStore.authToken),
          {},
          { perPage: COMMUNITIES_PAGE_SIZE, maxPages: 1 },
        )
        : Promise.resolve(null),
      questionsService.listQuestions(
        { page, per_page: QUESTIONS_PAGE_SIZE, sort: '-createdAt' },
        authStore.authToken,
      ),
    ])
    if (communitiesResponse) {
      communitiesById.value = new Map(
        communitiesResponse.data.map((community) => [community.id, community]),
      )
    }
    const nextQuestions = await Promise.all(response.data.map((question) => loadQuestion(question)))
    const seen = new Set(apiQuestions.value.map((question) => question.apiId || question.slug))
    apiQuestions.value = page === 1
      ? nextQuestions
      : [...apiQuestions.value, ...nextQuestions.filter((question) => !seen.has(question.apiId || question.slug))]
    nextQuestions.forEach((question) => {
      socialActionsStore.upsertFeedItem(question, { prepend: false })
    })
    nextQuestionsPage.value = hasNextPage(response) ? response.current_page + 1 : null
    hasLoadedApiQuestions.value = true
  } catch (error) {
    questionsError.value = getDisplayErrorMessage(error, 'Questions could not be loaded. Please try again.')
    if (page === 1) apiQuestions.value = []
    hasLoadedApiQuestions.value = true
  } finally {
    isLoadingQuestions.value = false
    isLoadingMoreQuestions.value = false
  }
}

useInfiniteScroll(
  loadMoreTarget,
  () => Boolean(nextQuestionsPage.value) && !isLoadingQuestions.value && !isLoadingMoreQuestions.value,
  () => { if (nextQuestionsPage.value) void loadQuestions(nextQuestionsPage.value) },
  () => apiQuestions.value.length,
)

onMounted(() => {
  void loadQuestions()
})
</script>

<template>
  <section class="space-y-5">
    <div class="space-y-3 px-1">
      <!-- <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">Question</span>
      </div> -->
    </div>

    <div
      v-if="questionsError"
      class="rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-soft)]"
    >
      {{ questionsError }}
    </div>

    <div
      v-if="isLoadingQuestions"
      class="space-y-4"
      aria-label="Loading questions"
    >
      <FeedCardSkeleton v-for="item in 4" :key="item" kind="question" />
    </div>

    <div v-else class="space-y-4">
      <AppFeedPost
        v-for="post in questions"
        :key="post.apiId || `${post.communityName}-${post.title}`"
        :post="post"
        follow-question-author
      />
      <div v-if="nextQuestionsPage" ref="loadMoreTarget" class="py-4 text-center text-sm text-[var(--text-secondary)]">
        {{ isLoadingMoreQuestions ? 'Loading more questions...' : 'Scroll for more questions' }}
      </div>
      <div
        v-if="hasLoadedApiQuestions && !questions.length"
        class="rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 text-center"
      >
        <p class="text-sm font-semibold text-[var(--text-primary)]">No questions yet.</p>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">Ask the first question from the header.</p>
      </div>
    </div>
  </section>
</template>
