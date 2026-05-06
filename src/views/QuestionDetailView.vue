<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowUp, BookOpen, Bookmark, Check, CloudUpload, MessageSquare, Share2, Users } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import { getFeedPostBySlug, type QuestionPost } from '@/data/feedPosts'
import { ApiError } from '@/lib/api'
import { questionsService, type QuestionAnswerRecord } from '@/services/questions'
import { usersService, type MyProfileData } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { getQuestionUserId, mapApiQuestionToFeedPost } from '@/utils/questionMapper'

const route = useRoute()
const authStore = useAuthStore()

type AnswerItem = {
  id: string
  authorName: string
  authorTo: string
  avatarSrc: string | null
  avatarText: string
  authorMeta: string[]
  time: string
  content: string
  score: number
}

const apiQuestion = ref<QuestionPost | null>(null)
const isLoadingQuestion = ref(false)
const questionError = ref('')
const answerItems = ref<AnswerItem[]>([])
const answerSort = ref('newest')
const answerInput = ref('')
const isAnswerModalOpen = ref(false)
const isSubmittingAnswer = ref(false)
const answerAttachments = ref<File[]>([])
const answererProfile = ref<MyProfileData | null>(null)
const isLoadingAnswererProfile = ref(false)

const seedQuestion = computed(() => {
  const post = getFeedPostBySlug(String(route.params.slug))
  return post?.type === 'question' ? post : null
})

const question = computed(() => apiQuestion.value || seedQuestion.value)
const questionId = computed(() => question.value?.apiId)

const formatTime = (value?: string) => {
  if (!value) {
    return 'Just now'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CM'

const getProfileName = (profile?: MyProfileData | null) =>
  profile?.profile?.username?.trim() ||
  profile?.user?.username?.trim() ||
  profile?.user?.email?.split('@')[0]?.trim() ||
  ''

const getProfileSkills = (profile?: MyProfileData | null) =>
  profile?.skills
    ?.map((skill) => (skill.name || skill.skill || '').trim())
    .filter(Boolean)
    .slice(0, 3) ?? []

const currentAnswerAuthor = () => {
  const name =
    authStore.userProfile?.username ||
    authStore.signUpDraft.username ||
    authStore.signUpDraft.name ||
    'You'

  return {
    name,
    to: authStore.userId ? `/profile/view/${authStore.userId}` : '/profile',
    avatarSrc: authStore.userProfile?.avatar || authStore.signUpDraft.avatar || null,
    skills: authStore.signUpDraft.interests.slice(0, 3),
  }
}

const questionAuthor = computed(() => {
  if (!question.value) {
    return null
  }

  return {
    name: question.value.authorName,
    to: question.value.authorTo,
    avatarText: question.value.authorName
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  }
})

const questionSkills = computed(() =>
  question.value?.tag
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3) ?? [],
)

const sortedAnswers = computed(() => {
  if (answerSort.value === 'oldest') {
    return [...answerItems.value].reverse()
  }

  return answerItems.value
})

const answererName = computed(
  () =>
    answererProfile.value?.profile?.username ||
    answererProfile.value?.user?.username ||
    answererProfile.value?.user?.email?.split('@')[0] ||
    authStore.userProfile?.username ||
    authStore.signUpDraft.username ||
    authStore.signUpDraft.name ||
    'You',
)

const answererAvatar = computed(
  () => answererProfile.value?.profile?.avatar || authStore.userProfile?.avatar || authStore.signUpDraft.avatar || '',
)

const answererProfilePath = computed(() => (authStore.userId ? `/profile/view/${authStore.userId}` : '/profile'))

const answererSkills = computed(() => {
  const profileSkills =
    answererProfile.value?.skills
      ?.map((skill) => (skill.name || skill.skill || '').trim())
      .filter(Boolean)
      .slice(0, 3) ?? []

  if (profileSkills.length) {
    return profileSkills
  }

  return authStore.signUpDraft.interests.slice(0, 3).length
    ? authStore.signUpDraft.interests.slice(0, 3)
    : ['Skills4Export member']
})

const answererInitials = computed(() =>
  answererName.value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const mapAnswerItem = async (answer: QuestionAnswerRecord): Promise<AnswerItem> => {
  const userId = answer.userId || answer.user_id || ''
  const author =
    userId && userId === authStore.userId
      ? currentAnswerAuthor()
      : userId
        ? await usersService
            .getUserProfile(userId, authStore.authToken)
            .then((response) => {
              const profile = response.data
              const name = getProfileName(profile) || 'Community member'

              return {
                name,
                to: `/profile/view/${userId}`,
                avatarSrc: profile?.profile?.avatar || null,
                skills: getProfileSkills(profile),
              }
            })
            .catch(() => ({
              name: 'Community member',
              to: `/profile/view/${userId}`,
              avatarSrc: null,
              skills: [] as string[],
            }))
        : {
            name: 'Community member',
            to: '/profile',
            avatarSrc: null,
            skills: [] as string[],
          }

  return {
    id: answer.id,
    authorName: author.name,
    authorTo: author.to,
    avatarSrc: author.avatarSrc,
    avatarText: getInitials(author.name),
    authorMeta: author.skills,
    time: formatTime(answer.createdAt || answer.created_at),
    content: answer.content,
    score: 0,
  }
}

const loadAnswererProfile = async () => {
  if (!authStore.authToken || isLoadingAnswererProfile.value || answererProfile.value) {
    return
  }

  isLoadingAnswererProfile.value = true

  try {
    const response = await usersService.getMyProfile(authStore.authToken)
    answererProfile.value = response.data ?? null
  } catch {
    answererProfile.value = null
  } finally {
    isLoadingAnswererProfile.value = false
  }
}

const loadQuestion = async (id: string) => {
  isLoadingQuestion.value = true
  questionError.value = ''

  try {
    const response = await questionsService.getQuestion(id, authStore.authToken, true)
    const userId = getQuestionUserId(response.data)
    const [authorResponse, answersResponse] = await Promise.all([
      userId ? usersService.getUserProfile(userId, authStore.authToken).catch(() => null) : Promise.resolve(null),
      response.data.answers?.length
        ? Promise.resolve(null)
        : questionsService.listAnswers(response.data.id, authStore.authToken).catch(() => null),
    ])
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
    const answers = response.data.answers ?? answersResponse?.data ?? []

    apiQuestion.value = mapApiQuestionToFeedPost({ ...response.data, answers }, authorData)
    answerItems.value = await Promise.all(answers.map(mapAnswerItem))
  } catch (error) {
    if (!seedQuestion.value) {
      questionError.value = error instanceof ApiError ? error.message : 'Unable to load question.'
    }
  } finally {
    isLoadingQuestion.value = false
  }
}

const openAnswerModal = () => {
  answerInput.value = ''
  answerAttachments.value = []
  isAnswerModalOpen.value = true
  void loadAnswererProfile()
}

const closeAnswerModal = () => {
  isAnswerModalOpen.value = false
  answerInput.value = ''
  answerAttachments.value = []
}

const handleAnswerAttachmentChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  answerAttachments.value = Array.from(input.files ?? [])
}

const submitAnswer = async () => {
  const value = answerInput.value.trim()

  if (!value) {
    return
  }

  if (questionId.value) {
    if (isSubmittingAnswer.value) {
      return
    }

    isSubmittingAnswer.value = true

    try {
      const response = await questionsService.createAnswer(
        questionId.value,
        {
          content: value,
          parentAnswerId: null,
        },
        authStore.authToken,
      )

      answerItems.value.unshift({
        ...(await mapAnswerItem(response.data)),
        authorName: answererName.value,
        authorTo: answererProfilePath.value,
        avatarSrc: answererAvatar.value || null,
        avatarText: answererInitials.value,
        authorMeta: answererSkills.value,
        time: 'Just now',
      })
      closeAnswerModal()
      toast.success('Answer posted')
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Unable to post answer.'
      toast.error('Answer failed', { description: message })
    } finally {
      isSubmittingAnswer.value = false
    }

    return
  }

  answerItems.value.unshift({
    id: `local-answer-${Date.now()}`,
    authorName: answererName.value,
    authorTo: answererProfilePath.value,
    avatarSrc: answererAvatar.value || null,
    avatarText: answererInitials.value,
    authorMeta: answererSkills.value,
    time: 'Just now',
    content: value,
    score: 0,
  })
  closeAnswerModal()
  toast.success('Answer posted')
}

watch(
  () => route.params.slug,
  (slug) => {
    apiQuestion.value = null
    answerItems.value = []
    void loadQuestion(String(slug))
  },
  { immediate: true },
)
</script>

<template>
  <section v-if="isLoadingQuestion && !question" class="space-y-4" aria-label="Loading question">
    <article class="animate-pulse rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4">
      <div class="h-7 w-4/5 rounded-full bg-[var(--surface-muted)]"></div>
      <div class="mt-3 h-4 w-2/3 rounded-full bg-[var(--surface-muted)]"></div>
      <div class="mt-5 h-28 rounded-xl bg-[var(--surface-muted)]"></div>
    </article>
  </section>

  <section v-else-if="question" class="space-y-4">
    <article class="overflow-hidden rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)]">
      <div class="space-y-4 border-b border-[color:var(--border-soft)] p-4 sm:p-5">
        <div class="flex flex-wrap items-center gap-2 text-[0.82rem] text-[var(--text-secondary)]">
          <RouterLink to="/answer/question" class="transition hover:text-[var(--accent-strong)]">Questions</RouterLink>
          <span>/</span>
          <span class="font-medium text-[var(--accent-strong)]">Details</span>
        </div>

        <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
          <RouterLink
            v-if="questionAuthor"
            :to="questionAuthor.to"
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white"
          >
            {{ questionAuthor.avatarText }}
          </RouterLink>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--text-secondary)]">
              <RouterLink
                v-if="questionAuthor"
                :to="questionAuthor.to"
                class="text-base font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
              >
                {{ questionAuthor.name }}
              </RouterLink>
              <span>{{ question.time }}</span>
              <span class="inline-flex items-center gap-1 rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                <Users class="h-3.5 w-3.5" />
                {{ question.communityId ? 'Question in community' : 'Question' }}
              </span>
            </div>

            <h1 class="mt-2 text-[1.45rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.9rem]">
              {{ question.title }}
            </h1>

            <div class="mt-3 flex flex-wrap gap-1.5">
              <span
                v-for="skill in questionSkills"
                :key="skill"
                class="inline-flex rounded-full bg-[var(--surface-secondary)] px-2 py-1 text-[0.62rem] font-medium leading-4 text-[var(--text-secondary)]"
              >
                {{ skill }}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="inline-flex h-10 items-center gap-2 rounded-xl border border-[color:var(--accent)] px-4 text-sm font-semibold text-[var(--accent-strong)] transition hover:bg-[var(--accent-soft)]"
          @click="openAnswerModal"
        >
          <BookOpen class="h-4 w-4" />
          Answer
        </button>
      </div>

      <div class="space-y-6 p-4 sm:p-5">
        <div class="rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4">
          <p v-if="question.body" class="whitespace-pre-line text-[0.94rem] leading-8 text-[var(--text-primary)]">
            {{ question.body }}
          </p>
          <p v-else class="text-sm text-[var(--text-secondary)]">No additional details were added to this question.</p>
        </div>

        <div class="flex flex-col gap-3 border-b border-[color:var(--border-soft)] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              All Answers
            </p>
            <p class="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{{ answerItems.length }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <select
              v-model="answerSort"
              class="h-10 rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm font-semibold text-[var(--text-secondary)] outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <button
              type="button"
              class="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              @click="openAnswerModal"
            >
              <BookOpen class="h-4 w-4" />
              Answer
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <article
            v-for="answer in sortedAnswers"
            :key="answer.id"
            class="border-b border-[color:var(--border-soft)] pb-5 last:border-b-0 last:pb-0"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex min-w-0 items-start gap-3">
                <RouterLink
                  :to="answer.authorTo"
                  class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)] text-[0.68rem] font-semibold text-[var(--text-tertiary)]"
                >
                  <img
                    v-if="answer.avatarSrc"
                    :src="answer.avatarSrc"
                    :alt="answer.authorName"
                    class="h-full w-full object-cover"
                  />
                  <span v-else>{{ answer.avatarText }}</span>
                </RouterLink>
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <RouterLink
                      :to="answer.authorTo"
                      class="font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
                    >
                      {{ answer.authorName }}
                    </RouterLink>
                    <span
                      v-for="item in answer.authorMeta"
                      :key="item"
                      class="text-xs font-semibold text-[var(--text-tertiary)]"
                    >
                      {{ item }}
                    </span>
                  </div>
                  <button
                    type="button"
                    class="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                  >
                    <Check class="h-3.5 w-3.5" />
                    Follow
                  </button>
                </div>
              </div>
              <div class="text-sm text-[var(--text-secondary)] sm:text-right">
                <p class="font-semibold text-[var(--text-primary)]">answered</p>
                <p class="mt-1">{{ answer.time }}</p>
              </div>
            </div>

            <p class="mt-4 whitespace-pre-line text-[0.94rem] leading-8 text-[var(--text-primary)]">
              {{ answer.content }}
            </p>

            <div class="mt-4 flex flex-wrap gap-2">
              <button type="button" class="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)]">
                <ArrowUp class="h-3.5 w-3.5" />
                {{ answer.score }} score
              </button>
              <button type="button" class="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)]">
                <Share2 class="h-3.5 w-3.5" />
                Share
              </button>
              <button type="button" class="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)]">
                <MessageSquare class="h-3.5 w-3.5" />
                0
              </button>
              <button type="button" class="inline-flex h-8 items-center gap-1 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-semibold text-[var(--text-secondary)]">
                <Bookmark class="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </article>
        </div>
      </div>
    </article>
  </section>

  <section v-else class="rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center">
    <h1 class="text-xl font-semibold text-[var(--text-primary)]">Question not found</h1>
    <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
      {{ questionError || 'The question you are looking for is not available.' }}
    </p>
  </section>

  <ResponsiveOverlay
    v-if="question"
    v-model="isAnswerModalOpen"
    label="Answer question"
    title="Answer question"
    max-width-class="sm:max-w-4xl"
    :show-header-text="false"
  >
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <RouterLink
            :to="answererProfilePath"
            class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-strong)]"
          >
            <img
              v-if="answererAvatar"
              :src="answererAvatar"
              :alt="answererName"
              class="h-full w-full object-cover"
            />
            <span v-else>{{ answererInitials }}</span>
          </RouterLink>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <RouterLink
                :to="answererProfilePath"
                class="text-base font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
              >
                {{ answererName }}
              </RouterLink>
              <span
                v-for="skill in answererSkills"
                :key="skill"
                class="text-xs font-semibold text-[var(--text-secondary)]"
              >
                {{ skill }}
              </span>
            </div>
            <h2 class="mt-3 text-xl font-semibold leading-tight text-[var(--text-primary)]">
              {{ question.title }}
            </h2>
          </div>
        </div>
      </div>

      <textarea
        v-model="answerInput"
        rows="12"
        placeholder="Your answer here..."
        class="min-h-[18rem] w-full resize-y rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-[0.95rem] leading-7 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-soft)]"
      />

      <div class="space-y-2">
        <p class="text-sm font-semibold text-[var(--text-primary)]">Images or Video</p>
        <label class="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-6 text-center text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]">
          <CloudUpload class="h-5 w-5" />
          <span>images, videos, click to upload.</span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            class="sr-only"
            @change="handleAnswerAttachmentChange"
          />
        </label>
        <div v-if="answerAttachments.length" class="flex flex-wrap gap-2">
          <span
            v-for="file in answerAttachments"
            :key="`${file.name}-${file.size}`"
            class="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]"
          >
            {{ file.name }}
          </span>
        </div>
      </div>

      <button
        type="button"
        :disabled="isSubmittingAnswer || !answerInput.trim()"
        class="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
        @click="submitAnswer"
      >
        {{ isSubmittingAnswer ? 'Replying...' : 'Reply' }}
        <ArrowUp class="h-4 w-4 rotate-45" />
      </button>

      <div class="flex justify-end border-t border-[color:var(--border-soft)] pt-4">
        <button
          type="button"
          class="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--danger)] px-4 text-sm font-semibold text-white transition hover:opacity-90"
          @click="closeAnswerModal"
        >
          Close
        </button>
      </div>
    </div>
  </ResponsiveOverlay>
</template>
