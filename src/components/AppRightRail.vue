<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowUpRight, BadgeHelp } from 'lucide-vue-next'
import { advertsService, type AdvertRecord } from '@/services/adverts'
import { questionsService, type QuestionRecord } from '@/services/questions'
import { useAuthStore } from '@/stores/auth'

const props = withDefaults(
  defineProps<{
    pinnedLayout?: boolean
    hideTrendingQuestions?: boolean
  }>(),
  {
    pinnedLayout: false,
    hideTrendingQuestions: false,
  },
)

type TrendingQuestion = {
  id: string
  title: string
  time: string
  author: string
  to: string
  score: number
}

const authStore = useAuthStore()
const questions = ref<QuestionRecord[]>([])
const isLoadingQuestions = ref(false)
const hasLoadedQuestions = ref(false)
const adverts = ref<AdvertRecord[]>([])
const isLoadingAdverts = ref(false)

const getStringValue = (...values: Array<string | null | undefined>) =>
  values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? ''

const getQuestionTimestamp = (question: QuestionRecord) =>
  getStringValue(question.createdAt, question.created_at, question.updatedAt, question.updated_at)

const getQuestionScore = (question: QuestionRecord) => {
  const record = question as QuestionRecord & {
    views?: number
    viewCount?: number
    views_count?: number
    answersCount?: number
    answers_count?: number
  }
  const score = record.views ?? record.viewCount ?? record.views_count ?? record.answersCount ?? record.answers_count

  return typeof score === 'number' && Number.isFinite(score) ? score : 0
}

const formatQuestionTime = (value: string) => {
  const date = new Date(value)

  if (!value || Number.isNaN(date.getTime())) {
    return 'Recently'
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

const getQuestionAuthor = (question: QuestionRecord) =>
  getStringValue(question.user?.name, question.user?.username, question.user?.email?.split('@')[0]) || 'Community member'

const trendingQuestions = computed<TrendingQuestion[]>(() =>
  [...questions.value]
    .sort((first, second) => {
      const scoreDifference = getQuestionScore(second) - getQuestionScore(first)

      if (scoreDifference !== 0) {
        return scoreDifference
      }

      return new Date(getQuestionTimestamp(second)).getTime() - new Date(getQuestionTimestamp(first)).getTime()
    })
    .slice(0, 4)
    .map((question) => ({
      id: question.id,
      title: question.title,
      time: formatQuestionTime(getQuestionTimestamp(question)),
      author: getQuestionAuthor(question),
      to: `/questions/${question.id}`,
      score: getQuestionScore(question),
    })),
)

const usableAdverts = computed(() =>
  adverts.value.filter((advert) =>
    Boolean(advert.imageUrl) &&
    !advert.isExpired &&
    (advert.status === 'active' || advert.status === 'approved'),
  ),
)

const rightRailAdvert = computed(() => {
  const rightRailMatch = usableAdverts.value.find((advert) => {
    const locationName = advert.location?.name?.toLowerCase() ?? ''

    return (
      locationName.includes('right') ||
      locationName.includes('rail') ||
      locationName.includes('sidebar')
    )
  })

  return rightRailMatch ?? usableAdverts.value[0] ?? null
})

const loadTrendingQuestions = async () => {
  isLoadingQuestions.value = true

  try {
    const response = await questionsService.listQuestions(
      { per_page: 5, sort: '-createdAt' },
      authStore.authToken,
      { suppressErrorModal: true },
    )
    questions.value = response.data ?? []
  } catch {
    questions.value = []
  } finally {
    hasLoadedQuestions.value = true
    isLoadingQuestions.value = false
  }
}

const loadAdverts = async () => {
  isLoadingAdverts.value = true

  try {
    const response = await advertsService.listAdverts(
      {
        per_page: 100,
        sort: '-createdAt',
      },
      authStore.authToken,
    )
    adverts.value = response.data ?? []
  } catch {
    adverts.value = []
  } finally {
    isLoadingAdverts.value = false
  }
}

onMounted(() => {
  void loadTrendingQuestions()
  void loadAdverts()
})
</script>

<template>
  <aside :class="props.pinnedLayout ? 'w-full' : 'w-full lg:w-[16.5rem] xl:w-[17.5rem]'">
    <div
      :class="
        [
          'space-y-4',
          props.pinnedLayout
            ? 'h-full'
            : 'lg:sticky lg:top-28',
        ].join(' ')
      "
    >
      <section
        v-if="!props.hideTrendingQuestions"
        class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-elevated)]"
      >
        <div class="flex items-center gap-2">
          <BadgeHelp class="h-4 w-4 text-[var(--accent-strong)]" />
          <h2 class="text-base font-semibold text-[var(--text-primary)]">Trending Questions</h2>
        </div>

        <div
          v-if="isLoadingQuestions"
          class="mt-3 space-y-2"
          aria-label="Loading trending questions"
        >
          <div
            v-for="item in 4"
            :key="item"
            class="animate-pulse rounded-lg bg-[var(--surface-secondary)] p-3"
          >
            <div class="h-4 w-full rounded-full bg-[var(--surface-muted)]" />
            <div class="mt-2 h-3 w-2/3 rounded-full bg-[var(--surface-muted)]" />
          </div>
        </div>

        <div
          v-else-if="trendingQuestions.length"
          class="mt-3 space-y-2"
        >
          <RouterLink
            v-for="item in trendingQuestions"
            :key="item.id"
            :to="item.to"
            class="block rounded-lg bg-[var(--surface-secondary)] p-3 transition hover:bg-[var(--surface-muted)]"
          >
            <p class="text-[0.84rem] font-semibold leading-5 text-[var(--text-primary)]">
              {{ item.title }}
            </p>
            <p class="mt-1 text-[0.72rem] text-[var(--text-secondary)]">
              {{ item.time }} . by {{ item.author }}
            </p>
          </RouterLink>
        </div>

        <p
          v-else-if="hasLoadedQuestions"
          class="mt-3 rounded-lg bg-[var(--surface-secondary)] p-3 text-[0.82rem] text-[var(--text-secondary)]"
        >
          No trending questions yet.
        </p>

        <RouterLink
          to="/answer/question"
          class="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[color:var(--border-soft)] px-3 py-2 text-[0.78rem] font-semibold text-[var(--accent-strong)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-secondary)]"
        >
          View all questions
          <ArrowUpRight class="h-3.5 w-3.5" />
        </RouterLink>
      </section>

      <section>
        <div
          v-if="isLoadingAdverts && !rightRailAdvert"
          class="aspect-[4/5] w-full animate-pulse rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)]"
          aria-label="Loading advertisement"
        />
        <a
          v-else-if="rightRailAdvert?.imageUrl"
          :href="rightRailAdvert.linkUrl || rightRailAdvert.imageUrl"
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label="Advertisement"
          class="block overflow-hidden rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] transition hover:opacity-90"
        >
          <img
            :src="rightRailAdvert.imageUrl"
            :alt="rightRailAdvert.ownerName ? `${rightRailAdvert.ownerName} advertisement` : 'Advertisement'"
            class="aspect-[4/5] w-full object-cover"
            loading="lazy"
          >
        </a>
        <a
          v-else
          href="#"
          aria-label="Advertisement"
          class="block overflow-hidden rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] transition hover:opacity-90"
          @click.prevent
        >
          <div class="advert-placeholder aspect-[4/5] w-full" />
        </a>
      </section>
    </div>
  </aside>
</template>
