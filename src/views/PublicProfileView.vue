<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Award,
  BookOpen,
  Briefcase,
  ClipboardList,
  ExternalLink,
  GraduationCap,
  Rocket,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import AppFeedPost from '@/components/AppFeedPost.vue'
import { ApiError } from '@/lib/api'
import type { FeedPost } from '@/data/feedPosts'
import { postsService, type PostRecord } from '@/services/posts'
import { questionsService, type QuestionRecord } from '@/services/questions'
import {
  collectUserSkills,
  usersService,
  type UserCertification,
  type UserEducation,
  type UserExperience,
  type UserFollower,
  type UserPortfolio,
  type UserProfile,
  type UserRecord,
  type UserSkill,
} from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { getOptionalCount, getPostUserId, mapApiPostToFeedPost } from '@/utils/postMapper'
import { getQuestionUserId, mapApiQuestionToFeedPost } from '@/utils/questionMapper'
import { getDisplayName } from '@/utils/displayName'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const user = ref<UserRecord | null>(null)
const userProfile = ref<UserProfile | null>(null)
const skills = ref<UserSkill[]>([])
const portfolios = ref<UserPortfolio[]>([])
const certifications = ref<UserCertification[]>([])
const educations = ref<UserEducation[]>([])
const experiences = ref<UserExperience[]>([])
const followers = ref<UserFollower[]>([])
const recentActivities = ref<FeedPost[]>([])
const scoreEntries = ref<Array<{ id: string; title: string; community: string; score: number; typeLabel: string }>>([])
const stats = ref({
  posts: 0,
  questions: 0,
  answers: 0,
  comments: 0,
})
const isLoadingProfile = ref(false)
const isLoadingActivity = ref(false)
const isTogglingFollow = ref(false)
const profileModal = ref<null | 'score' | 'followers'>(null)
const loadError = ref('')

const userId = computed(() => {
  const id = route.params.id
  return Array.isArray(id) ? id[0] ?? '' : id ?? ''
})

const readString = (value: unknown) => (typeof value === 'string' ? value : '')
const isVideoMediaUrl = (url: string) => /\/video\/upload\/|\.(mp4|webm|mov|m4v)(?:[?#]|$)/i.test(url)
const getSkillDisplayName = (skill: UserSkill | { name?: unknown; skill?: unknown; skillName?: unknown; skill_name?: unknown; title?: unknown; label?: unknown }) => {
  const record = skill as Record<string, unknown>
  const directValue = [record.name, record.skillName, record.skill_name, record.title, record.label, record.skill]
    .find((value) => typeof value === 'string' && value.trim())

  if (typeof directValue === 'string') {
    return directValue.trim()
  }

  if (record.skill && typeof record.skill === 'object') {
    const nestedRecord = record.skill as Record<string, unknown>
    const nestedValue = [nestedRecord.name, nestedRecord.skill, nestedRecord.title, nestedRecord.label]
      .find((value) => typeof value === 'string' && value.trim())

    if (typeof nestedValue === 'string') {
      return nestedValue.trim()
    }
  }

  return ''
}

const displaySkills = computed(() =>
  skills.value
    .map((skill) => ({
      ...skill,
      name: getSkillDisplayName(skill),
    }))
    .filter((skill) => skill.name),
)

const publicProfileData = computed(() => ({
  user: user.value,
  profile: userProfile.value,
  skills: displaySkills.value,
}))

const loadRecentActivity = async () => {
  if (!userId.value) {
    return
  }

  isLoadingActivity.value = true

  try {
    const [postsResult, questionsResult] = await Promise.allSettled([
      postsService.listPosts({ per_page: 100, sort: '-createdAt' }, authStore.authToken),
      questionsService.listQuestions({ per_page: 100, sort: '-createdAt' }, authStore.authToken),
    ])
    const allPosts = postsResult.status === 'fulfilled' ? postsResult.value.data : []
    const allQuestions = questionsResult.status === 'fulfilled' ? questionsResult.value.data : []
    const userPosts = allPosts.filter((post: PostRecord) => getPostUserId(post) === userId.value)
    const userQuestions = allQuestions.filter((question: QuestionRecord) => getQuestionUserId(question) === userId.value)
    const [postCommentResults, questionAnswerResults] = await Promise.all([
      Promise.all(allPosts.map((post) => postsService.listComments(post.id, authStore.authToken).catch(() => null))),
      Promise.all(allQuestions.map((question) => questionsService.listAnswers(question.id, authStore.authToken).catch(() => null))),
    ])
    const userCommentCount = postCommentResults.reduce((total, response) => {
      const comments = response?.data ?? []
      return total + comments.filter((comment) => comment.user_id === userId.value).length
    }, 0)
    const userAnswers = questionAnswerResults.flatMap((response) => response?.data ?? []).filter((answer) => {
      const answerUserId = answer.userId || answer.user_id || ''
      return answerUserId === userId.value
    })
    const postActivities = await Promise.all(userPosts.map(async (post) => {
      const [mediaResponse, commentsResponse] = await Promise.all([
        postsService.listPostMedia(post.id, authStore.authToken).catch(() => null),
        postsService.listComments(post.id, authStore.authToken).catch(() => null),
      ])
      const mappedPost = mapApiPostToFeedPost(post, mediaResponse?.data ?? [], publicProfileData.value)

      return {
        ...mappedPost,
        comments: commentsResponse?.total ?? ('comments' in mappedPost ? mappedPost.comments : 0),
      }
    }))
    const questionActivities = userQuestions.map((question) =>
      mapApiQuestionToFeedPost(
        {
          ...question,
          answers_count: questionAnswerResults[allQuestions.findIndex((item) => item.id === question.id)]?.total ?? question.answers_count,
        },
        publicProfileData.value,
      ),
    )

    stats.value = {
      posts: userPosts.length,
      questions: userQuestions.length,
      answers: userAnswers.length,
      comments: userCommentCount,
    }
    scoreEntries.value = [
      ...userPosts.map((post) => ({
        id: post.id,
        title: post.title,
        community: post.community?.name || 'Post',
        score: getOptionalCount(post.score, post.reactions_count, post.reaction_count),
        typeLabel: 'Post',
      })),
      ...userQuestions.map((question) => ({
        id: question.id,
        title: question.title,
        community: 'Question',
        score: getOptionalCount(question.score, question.reactions_count, question.reaction_count),
        typeLabel: 'Question',
      })),
      ...userAnswers.map((answer) => ({
        id: answer.id,
        title: answer.content || answer.body || answer.answer || 'Answer',
        community: 'Answer',
        score: getOptionalCount(answer.score, answer.reactions_count, answer.reaction_count),
        typeLabel: 'Answer',
      })),
    ]
    recentActivities.value = [...postActivities, ...questionActivities]
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      .slice(0, 5)
  } catch {
    recentActivities.value = []
  } finally {
    isLoadingActivity.value = false
  }
}

const loadProfile = async () => {
  if (!userId.value) {
    loadError.value = 'This profile link is missing a user ID.'
    return
  }

  isLoadingProfile.value = true
  loadError.value = ''

  const results = await Promise.allSettled([
    usersService.getUser(userId.value, authStore.authToken),
    usersService.getUserProfile(userId.value, authStore.authToken),
    usersService.listUserSkills(userId.value, authStore.authToken, { suppressErrorModal: true }),
    usersService.listUserPortfolios(userId.value, authStore.authToken, { suppressErrorModal: true }),
    usersService.listUserCertifications(userId.value, authStore.authToken, { suppressErrorModal: true }),
    usersService.listUserEducations(userId.value, authStore.authToken, { suppressErrorModal: true }),
    usersService.listUserExperiences(userId.value, authStore.authToken, { suppressErrorModal: true }),
    usersService.listFollowers(userId.value, authStore.authToken, { suppressErrorModal: true }),
  ])

  const [userResult, profileResult, skillsResult, portfoliosResult, certificationsResult, educationsResult, experiencesResult, followersResult] =
    results

  if (userResult.status === 'fulfilled') {
    user.value = userResult.value.data ?? null
  }

  if (profileResult.status === 'fulfilled') {
    userProfile.value = profileResult.value.data?.profile ?? null
    if (!user.value && profileResult.value.data?.user) {
      user.value = profileResult.value.data.user
    }
  } else if (profileResult.reason instanceof ApiError && profileResult.reason.status !== 404) {
    loadError.value = profileResult.reason.message
  }

  if (skillsResult.status === 'fulfilled') {
    skills.value = collectUserSkills(skillsResult.value.data, profileResult.status === 'fulfilled' ? profileResult.value.data?.skills : null)
  } else {
    skills.value = collectUserSkills(profileResult.status === 'fulfilled' ? profileResult.value.data?.skills : null)
  }

  if (portfoliosResult.status === 'fulfilled') {
    portfolios.value = portfoliosResult.value.data ?? []
  } else {
    portfolios.value = []
  }

  if (certificationsResult.status === 'fulfilled') {
    certifications.value = certificationsResult.value.data ?? []
  } else {
    certifications.value = []
  }

  if (educationsResult.status === 'fulfilled') {
    educations.value = educationsResult.value.data ?? []
  } else {
    educations.value = []
  }

  if (experiencesResult.status === 'fulfilled') {
    experiences.value = experiencesResult.value.data ?? []
  } else {
    experiences.value = []
  }

  if (followersResult.status === 'fulfilled') {
    followers.value = followersResult.value.data ?? []
  } else {
    followers.value = []
  }

  if (!user.value && !userProfile.value && !loadError.value) {
    loadError.value = 'This profile could not be loaded.'
  }

  isLoadingProfile.value = false
}

const profile = computed(() => {
  const name = getDisplayName(
    userProfile.value?.displayName ||
      '',
    readString((user.value as Record<string, unknown> | null)?.name),
    userProfile.value?.username ||
      '',
    readString((user.value as Record<string, unknown> | null)?.username),
  ) || 'Community Member'
  const username = userProfile.value?.username || readString((user.value as Record<string, unknown> | null)?.username) || 'skills4export-member'
  const email = readString(user.value?.email)
  const phone = readString((user.value as Record<string, unknown> | null)?.phone)
  const location = userProfile.value?.location || readString((user.value as Record<string, unknown> | null)?.location)
  const bio = userProfile.value?.bio || readString((user.value as Record<string, unknown> | null)?.bio) || 'This member has not added a public bio yet.'

  return {
    name,
    username,
    email,
    phone,
    location,
    bio,
    website: userProfile.value?.website || '',
    avatar: userProfile.value?.avatar || '',
    banner: userProfile.value?.banner || '',
    initials: name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  }
})

const featuredExperience = computed(() => experiences.value[0] ?? null)
const featuredSkill = computed(() => displaySkills.value[0]?.name || '')
const profileSkillLabel = computed(() => featuredSkill.value || 'Community Member')
const profileCompanyLabel = computed(() => featuredExperience.value?.company || 'Skills4Export')
const profileCountryLabel = computed(() => profile.value.location || 'Location not shared')

const totalTScore = computed(() =>
  scoreEntries.value.reduce((total, entry) => total + entry.score, 0),
)

const summaryCards = computed(() => [
  {
    label: 'Comments',
    value: stats.value.comments,
    icon: ClipboardList,
    accentClass: 'bg-[var(--accent-soft)] text-[var(--accent-strong)]',
  },
  {
    label: 'Questions',
    value: stats.value.questions,
    icon: Sparkles,
    accentClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    label: 'Answers',
    value: stats.value.answers,
    icon: Rocket,
    accentClass: 'bg-amber-100 text-amber-700',
  },
  {
    label: 'Posts',
    value: stats.value.posts,
    icon: BookOpen,
    accentClass: 'bg-violet-100 text-violet-700',
  },
])

const isFollowingProfile = computed(() =>
  followers.value.some((entry) => entry.followerId === authStore.userId),
)
const isOwnProfile = computed(() => Boolean(authStore.userId && authStore.userId === userId.value))

const handleFollowToggle = async () => {
  if (!userId.value || isTogglingFollow.value) {
    return
  }

  if (isOwnProfile.value) {
    toast.info('This is your profile', {
      description: 'You cannot follow your own account.',
    })
    return
  }

  if (!authStore.isAuthenticated) {
    router.push({
      name: 'login',
      query: {
        redirect: route.fullPath,
      },
    })
    return
  }

  isTogglingFollow.value = true

  try {
    if (isFollowingProfile.value) {
      await usersService.unfollowUser(userId.value, authStore.authToken)
      followers.value = followers.value.filter((entry) => entry.followerId !== authStore.userId)
      toast.success('Profile unfollowed')
    } else {
      await usersService.followUser(userId.value, {}, authStore.authToken)
      followers.value = [
        {
          id: `local-${Date.now()}`,
          followerId: authStore.userId,
          followingId: userId.value,
          createdAt: new Date().toISOString(),
        },
        ...followers.value,
      ]
      toast.success('You are now following this profile')
    }
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Unable to update follow status.'

    toast.error('Follow action failed', {
      description: message,
    })
  } finally {
    isTogglingFollow.value = false
  }
}

onMounted(() => {
  void loadProfile()
})

watch(
  () => userId.value,
  () => {
    void loadProfile()
  },
)
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
    <div v-if="loadError && !isLoadingProfile" class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-elevated)]">
      <p class="text-lg font-semibold text-[var(--text-primary)]">Profile unavailable</p>
      <p class="mt-2 text-sm text-[var(--text-secondary)]">{{ loadError }}</p>
    </div>

    <template v-else>
      <section class="overflow-hidden rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
        <!-- Banner hidden to match the private profile page layout. -->
        <div v-if="false" class="relative aspect-[4/1] min-h-36 overflow-hidden bg-[var(--surface-secondary)]">
          <img
            v-if="profile.banner"
            :src="profile.banner"
            alt="Profile banner"
            class="h-full w-full object-cover"
          />
          <div
            v-else
            class="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_16%,white),color-mix(in_srgb,var(--surface-secondary)_80%,white))] text-sm font-semibold text-[var(--text-secondary)]"
          >
            Banner
          </div>
          <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,12,27,0.04),rgba(12,12,27,0.28))]" />
        </div>

        <div class="relative border-b border-[color:var(--border-soft)] px-5 pb-6 pt-4 sm:px-7 lg:px-9 lg:pb-7 lg:pt-5">
          <div class="absolute right-0 top-0 hidden h-full w-48 lg:block">
            <div class="absolute right-10 top-0 h-full w-px rotate-[-32deg] bg-[var(--accent-soft)]" />
            <div class="absolute right-20 top-0 h-full w-px rotate-[-32deg] bg-[var(--accent-soft)]" />
            <div class="absolute right-[7.5rem] top-0 h-full w-px rotate-[-32deg] bg-[var(--accent-soft)]" />
          </div>

          <div class="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
              <div class="h-24 w-24 overflow-hidden rounded-[0.75rem] border-4 border-[var(--surface-primary)] bg-[var(--surface-secondary)] shadow-[var(--shadow-elevated)]">
                <img
                  v-if="profile.avatar"
                  :src="profile.avatar"
                  alt="Profile avatar"
                  class="h-full w-full object-cover"
                />
                <span
                  v-else
                  class="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_84%,white),color-mix(in_srgb,var(--accent-strong)_72%,white))] text-2xl font-semibold text-white"
                >
                  {{ profile.initials }}
                </span>
              </div>

              <div class="min-w-0">
                <h1 class="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2rem]">
                  {{ profile.name }}
                </h1>
                <div class="mt-0.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[0.95rem] leading-5 text-[var(--text-secondary)] sm:justify-start sm:text-[1rem]">
                  <span>{{ profileSkillLabel }}</span>
                  <span>-</span>
                  <span>{{ profileCompanyLabel }}</span>
                  <span>-</span>
                  <span>{{ profileCountryLabel }}</span>
                </div>
                <div class="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-semibold leading-5 sm:justify-start sm:text-[1rem]">
                  <button
                    type="button"
                    class="text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                    @click="profileModal = 'followers'"
                  >
                    {{ followers.length }} followers
                  </button>
                </div>
              </div>
            </div>

            <button
              v-if="!isOwnProfile"
              type="button"
              :disabled="isTogglingFollow"
              class="inline-flex items-center justify-center gap-3 self-center rounded-[1rem] px-5 py-3 text-sm font-semibold shadow-[var(--shadow-soft)] transition sm:self-start"
              :class="
                isFollowingProfile
                  ? 'border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:border-red-500 hover:text-red-500'
                  : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]'
              "
              @click="handleFollowToggle"
            >
              <component :is="isFollowingProfile ? UserCheck : UserPlus" class="h-4 w-4" />
              {{ isTogglingFollow ? 'Updating...' : isFollowingProfile ? 'Following' : 'Follow' }}
            </button>
          </div>
        </div>

        <div class="space-y-8 px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
          <div class="max-w-5xl space-y-5 text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.95rem]">
            <p v-if="profile.bio" class="whitespace-pre-line">{{ profile.bio }}</p>
            <p
              v-else
              class="rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-5 text-sm text-[var(--text-secondary)]"
            >
              No about information added yet.
            </p>
          </div>

        </div>
      </section>

      <div v-if="isLoadingProfile" class="animate-pulse rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4">
        <div class="h-4 w-40 rounded-full bg-[var(--surface-muted)]" />
        <div class="mt-3 h-3 w-64 max-w-full rounded-full bg-[var(--surface-muted)]" />
      </div>

      <div class="space-y-6">
        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Skills</h2>
            <Award class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="displaySkills.length > 0" class="flex flex-wrap gap-3">
            <div
              v-for="skill in displaySkills"
              :key="skill.id || skill.name"
              class="inline-flex max-w-full items-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-3 shadow-[var(--shadow-soft)]"
            >
              <span class="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">{{ skill.name }}</span>
            </div>
          </div>
          <p v-else class="text-sm text-[var(--text-secondary)]">No public skills added yet.</p>
        </section>

        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Portfolio</h2>
            <BookOpen class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="portfolios.length > 0" class="space-y-4">
            <article
              v-for="portfolio in portfolios"
              :key="portfolio.id || portfolio.title"
              class="rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-5"
            >
              <div v-if="portfolio.pictures?.[0]" class="-mx-5 -mt-5 mb-4 aspect-video overflow-hidden rounded-t-[1.1rem] bg-[var(--surface-muted)]">
                <video
                  v-if="isVideoMediaUrl(portfolio.pictures[0])"
                  :src="portfolio.pictures[0]"
                  class="h-full w-full object-cover"
                  controls
                />
                <img
                  v-else
                  :src="portfolio.pictures[0]"
                  :alt="`${portfolio.title || 'Project'} media`"
                  class="h-full w-full object-cover"
                />
              </div>
              <p class="break-words text-lg font-semibold text-[var(--text-primary)]">{{ portfolio.title }}</p>
              <p v-if="portfolio.description" class="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{{ portfolio.description }}</p>
              <a
                v-if="portfolio.link"
                :href="portfolio.link"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
              >
                Visit project
                <ExternalLink class="h-4 w-4" />
              </a>
            </article>
          </div>
          <p v-else class="text-sm text-[var(--text-secondary)]">No portfolio items shared publicly yet.</p>
        </section>

        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Certifications</h2>
            <Award class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="certifications.length > 0" class="space-y-3">
            <div
              v-for="certification in certifications"
              :key="certification.id || certification.name"
              class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <p class="font-semibold text-[var(--text-primary)]">{{ certification.name }}</p>
              <p v-if="certification.issuer" class="text-sm text-[var(--text-secondary)]">{{ certification.issuer }}</p>
              <p v-if="certification.issueDate" class="mt-1 text-xs text-[var(--text-tertiary)]">Issued: {{ new Date(certification.issueDate).toLocaleDateString() }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-[var(--text-secondary)]">No public certifications yet.</p>
        </section>

        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Education</h2>
            <GraduationCap class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="educations.length > 0" class="space-y-3">
            <div
              v-for="education in educations"
              :key="education.id || education.school"
              class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <p class="font-semibold text-[var(--text-primary)]">{{ education.school }}</p>
              <p v-if="education.degree" class="text-sm text-[var(--text-secondary)]">{{ education.degree }}</p>
              <p v-if="education.field" class="text-sm text-[var(--text-secondary)]">{{ education.field }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-[var(--text-secondary)]">No education details shared publicly yet.</p>
        </section>

        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Experience</h2>
            <Briefcase class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="experiences.length > 0" class="space-y-3">
            <div
              v-for="experience in experiences"
              :key="experience.id || `${experience.company}-${experience.title}`"
              class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <p class="font-semibold text-[var(--text-primary)]">{{ experience.title }}</p>
              <p v-if="experience.company" class="text-sm text-[var(--text-secondary)]">{{ experience.company }}</p>
              <p v-if="experience.description" class="mt-2 text-sm text-[var(--text-secondary)]">{{ experience.description }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-[var(--text-secondary)]">No public experience records yet.</p>
        </section>

      </div>
    </template>
  </section>

  <div
    v-if="profileModal"
    class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"
    @click.self="profileModal = null"
  >
    <div class="w-full max-w-2xl overflow-hidden rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
      <div class="flex items-center justify-between gap-4 border-b border-[color:var(--border-soft)] px-5 py-4 sm:px-6">
        <div>
          <h3 class="text-lg font-semibold text-[var(--text-primary)]">
            {{ profileModal === 'score' ? 'T.Scores' : 'Followers' }}
          </h3>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">
            <span v-if="profileModal === 'score'">Public post scores across communities and shared content.</span>
            <span v-else>People currently following this profile.</span>
          </p>
        </div>
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-[0.75rem] border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
          @click="profileModal = null"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-5 sm:px-6">
        <template v-if="profileModal === 'score'">
          <div
            v-for="entry in scoreEntries"
            :key="entry.id"
            class="flex items-start justify-between gap-4 rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
          >
            <div class="min-w-0">
              <p class="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">{{ entry.typeLabel }}</p>
              <p class="mt-2 text-base font-semibold text-[var(--text-primary)]">{{ entry.title }}</p>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ entry.community }}</p>
            </div>
            <div class="rounded-full bg-[color:color-mix(in_srgb,var(--accent)_14%,white)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
              {{ entry.score }} score
            </div>
          </div>

          <div
            v-if="scoreEntries.length === 0"
            class="rounded-[1.15rem] border border-dashed border-[color:var(--border-soft)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]"
          >
            No scored public posts yet.
          </div>
        </template>

        <template v-else>
          <div
            v-for="follower in followers"
            :key="follower.id || follower.followerId"
            class="flex items-center justify-between gap-4 rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-[0.75rem] bg-[color:color-mix(in_srgb,var(--accent)_16%,white)] text-sm font-semibold text-[var(--accent-strong)]">
                {{ (follower.followerId?.charAt(0) || 'U').toUpperCase() }}
              </div>
              <div>
                <p class="text-sm font-semibold text-[var(--text-primary)]">User {{ follower.followerId }}</p>
                <p class="text-xs text-[var(--text-secondary)]">
                  {{ follower.createdAt ? new Date(follower.createdAt).toLocaleDateString() : 'Recently followed' }}
                </p>
              </div>
            </div>
            <Users class="h-5 w-5 text-[var(--text-tertiary)]" />
          </div>

          <div
            v-if="followers.length === 0"
            class="rounded-[1.15rem] border border-dashed border-[color:var(--border-soft)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]"
          >
            No followers yet.
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
