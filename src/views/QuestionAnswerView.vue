<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppFeedPost from '@/components/AppFeedPost.vue'
import { questionPosts, type QuestionPost } from '@/data/feedPosts'
import { ApiError } from '@/lib/api'
import { questionsService, type QuestionRecord } from '@/services/questions'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { getQuestionUserId, mapApiQuestionToFeedPost } from '@/utils/questionMapper'

const authStore = useAuthStore()
const isLoadingQuestions = ref(false)
const questionsError = ref('')
const apiQuestions = ref<QuestionPost[]>([])
const hasLoadedApiQuestions = ref(false)

const questions = computed(() => (hasLoadedApiQuestions.value ? apiQuestions.value : questionPosts))

const getCurrentUserProfileData = () => ({
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
})

const loadQuestion = async (question: QuestionRecord) => {
  const userId = getQuestionUserId(question)
  const authorResponse = userId
    ? await usersService.getUserProfile(userId, authStore.authToken).catch(() => null)
    : null
  const authorData =
    authorResponse?.data ??
    (userId && userId === authStore.userId ? getCurrentUserProfileData() : null)

  return mapApiQuestionToFeedPost(question, authorData)
}

const loadQuestions = async () => {
  isLoadingQuestions.value = true
  questionsError.value = ''

  try {
    const response = await questionsService.listQuestions(authStore.authToken)
    apiQuestions.value = await Promise.all(response.data.map((question) => loadQuestion(question)))
    hasLoadedApiQuestions.value = true
  } catch (error) {
    questionsError.value =
      error instanceof ApiError ? error.message : 'Unable to load questions from the server.'
    apiQuestions.value = []
    hasLoadedApiQuestions.value = false
  } finally {
    isLoadingQuestions.value = false
  }
}

onMounted(() => {
  void loadQuestions()
})
</script>

<template>
  <section class="space-y-5">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">Question</span>
      </div>
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
      <article
        v-for="item in 4"
        :key="item"
        class="animate-pulse rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-elevated)]"
      >
        <div class="flex items-center gap-2">
          <div class="h-4 w-4 rounded-full bg-[var(--surface-muted)]" />
          <div class="h-3 w-36 rounded-full bg-[var(--surface-muted)]" />
        </div>
        <div class="mt-4 h-6 w-4/5 rounded-full bg-[var(--surface-muted)]" />
        <div class="mt-3 flex flex-wrap gap-2">
          <div class="h-5 w-24 rounded-full bg-[var(--surface-muted)]" />
          <div class="h-5 w-20 rounded-full bg-[var(--surface-muted)]" />
          <div class="h-5 w-28 rounded-full bg-[var(--surface-muted)]" />
        </div>
        <div class="mt-5 flex gap-2">
          <div class="h-9 w-24 rounded-[1rem] bg-[var(--surface-muted)]" />
          <div class="h-9 w-20 rounded-[1rem] bg-[var(--surface-muted)]" />
          <div class="h-9 w-24 rounded-[1rem] bg-[var(--surface-muted)]" />
        </div>
      </article>
    </div>

    <div v-else class="space-y-4">
      <AppFeedPost
        v-for="post in questions"
        :key="post.apiId || `${post.communityName}-${post.title}`"
        :post="post"
      />
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
