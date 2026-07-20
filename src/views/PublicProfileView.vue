<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Award,
  BookOpen,
  Briefcase,
  ExternalLink,
  GraduationCap,
  Image as ImageIcon,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ApiError } from '@/lib/api'
import { getErrorMessage } from '@/lib/errors'
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
import { useSocialActionsStore } from '@/stores/socialActions'
import { getDisplayName, toInitialCaps } from '@/utils/displayName'
import { richTextToPlainText } from '@/utils/richText'

type ProfileUploadItem = {
  id: string
  title: string
  externalUrl?: string
  url: string
  mediaType: 'image' | 'video'
}

const authStore = useAuthStore()
const socialActionsStore = useSocialActionsStore()
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
const following = ref<Array<{
  id: string
  name: string
  avatar: string
  initials: string
}>>([])
const isLoadingProfile = ref(false)
const isTogglingFollow = ref(false)
const profileModal = ref<null | 'followers' | 'following'>(null)
const followStates = ref<Record<string, boolean>>({})
const followToggles = ref<Record<string, boolean>>({})
const loadError = ref('')

const userId = computed(() => {
  const id = route.params.id
  return Array.isArray(id) ? id[0] ?? '' : id ?? ''
})

const readString = (value: unknown) => (typeof value === 'string' ? value : '')
const isVideoMediaUrl = (url: string) => /\/video\/upload\/|\.(mp4|webm|mov|m4v)(?:[?#]|$)/i.test(url)
const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null

const getStringField = (record: Record<string, unknown> | null | undefined, keys: string[]) => {
  for (const key of keys) {
    const value = record?.[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

const getBooleanField = (record: Record<string, unknown> | null | undefined, keys: string[]) => {
  for (const key of keys) {
    const value = record?.[key]

    if (typeof value === 'boolean') {
      return value
    }
  }

  return undefined
}

const getAccountInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const getFollowingUsers = (data: unknown) => {
  const record = asRecord(data)
  const followingValue = record?.following

  if (Array.isArray(followingValue)) {
    return followingValue
  }

  const followingRecord = asRecord(followingValue)
  const users = followingRecord?.users

  return Array.isArray(users) ? users : []
}

const getFollowerUsers = (data: unknown): UserFollower[] => {
  const record = asRecord(data)
  const followersValue = record?.followers

  if (Array.isArray(followersValue)) {
    return followersValue as UserFollower[]
  }

  const followersRecord = asRecord(followersValue)
  const users = followersRecord?.users

  return Array.isArray(users) ? users as UserFollower[] : []
}

const getFollowingAccount = (value: unknown) => {
  const record = asRecord(value)
  const profileRecord =
    asRecord(record?.followingProfile) ||
    asRecord(record?.profile) ||
    asRecord(record?.userProfile)
  const userRecord =
    asRecord(record?.following) ||
    asRecord(record?.user) ||
    asRecord(record?.account) ||
    record
  const id =
    getStringField(record, ['followingId', 'following_id']) ||
    getStringField(userRecord, ['id', 'userId', 'user_id'])
  const name = getDisplayName(
    getStringField(profileRecord, ['displayName', 'display_name', 'name']),
    getStringField(userRecord, ['name', 'displayName', 'display_name', 'fullName', 'full_name', 'username']),
  )
  const avatar =
    getStringField(profileRecord, ['avatar', 'avatarUrl', 'avatar_url', 'profileImage', 'profile_image']) ||
    getStringField(userRecord, ['avatar', 'avatarUrl', 'avatar_url', 'profileImage', 'profile_image'])

  return {
    id,
    name,
    avatar,
    initials: getAccountInitials(name),
  }
}

const getFollowerAccount = (follower: UserFollower) => {
  const followerRecord = follower as Record<string, unknown>
  const userRecord =
    asRecord(followerRecord.follower) ||
    asRecord(followerRecord.user) ||
    asRecord(followerRecord.account)
  const profileRecord =
    asRecord(followerRecord.followerProfile) ||
    asRecord(followerRecord.profile) ||
    asRecord(userRecord?.profile)
  const id =
    getStringField(followerRecord, ['followerId', 'follower_id', 'userId', 'user_id']) ||
    getStringField(userRecord, ['id', 'userId', 'user_id'])
  const name = getDisplayName(
    getStringField(profileRecord, ['displayName', 'display_name', 'name']),
    getStringField(userRecord, ['name', 'displayName', 'display_name', 'fullName', 'full_name', 'username']),
  )
  const avatar =
    getStringField(profileRecord, ['avatar', 'avatarUrl', 'avatar_url', 'profileImage', 'profile_image']) ||
    getStringField(userRecord, ['avatar', 'avatarUrl', 'avatar_url', 'profileImage', 'profile_image'])
  const explicitState = getBooleanField(followerRecord, ['isFollowing', 'is_following', 'followedByMe', 'followed_by_me'])

  return {
    id,
    name,
    avatar,
    initials: getAccountInitials(name),
    isCurrentUser: Boolean(id && id === authStore.userId),
    isFollowing: id ? followStates.value[id] ?? explicitState ?? false : false,
  }
}
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
const followerAccounts = computed(() =>
  followers.value
    .map(getFollowerAccount)
    .filter((account) => account.id),
)

const getPortfolioUploadUrl = (portfolio: UserPortfolio) =>
  portfolio.pictures?.find((picture) => /^https?:\/\//i.test(picture)) || ''

const profileUploads = computed<ProfileUploadItem[]>(() =>
  portfolios.value
    .map((portfolio) => {
      const url = getPortfolioUploadUrl(portfolio)

      if (!url) {
        return null
      }

      return {
        id: portfolio.id || `portfolio-upload-${portfolio.title || url}`,
        title: portfolio.title || 'Profile upload',
        ...(portfolio.link ? { externalUrl: portfolio.link } : {}),
        url,
        mediaType: isVideoMediaUrl(url) ? 'video' : 'image',
      } satisfies ProfileUploadItem
    })
    .filter((item): item is ProfileUploadItem => Boolean(item)),
)

const loadProfile = async () => {
  if (!userId.value) {
    loadError.value = 'This profile link is missing a user ID.'
    return
  }

  isLoadingProfile.value = true
  loadError.value = ''

  try {
    const profileResponse = await usersService.getUserProfile(userId.value, authStore.authToken)
    const profileData = profileResponse.data

    user.value = profileData?.user ?? null
    userProfile.value = profileData?.profile ?? null
    skills.value = collectUserSkills(profileData?.skills, profileData)
    portfolios.value = profileData?.portfolios ?? []
    certifications.value = profileData?.certifications ?? []
    educations.value = profileData?.educations ?? profileData?.education ?? []
    experiences.value = profileData?.experiences ?? profileData?.activeExperiences ?? []
    const nextFollowers = getFollowerUsers(profileData)
    const nextFollowing = getFollowingUsers(profileData)
      .map(getFollowingAccount)
      .filter((account) => account.id)
    const nextFollowingIds = new Set(nextFollowing.map((account) => account.id))

    followers.value = nextFollowers
    following.value = nextFollowing

    const nextFollowStates = { ...followStates.value }
    nextFollowing.forEach((account) => {
      nextFollowStates[account.id] = true
      socialActionsStore.setUserFollowingState(account.id, true)
    })
    nextFollowers.forEach((follower) => {
      const account = getFollowerAccount(follower)
      if (account.id) {
        const followerRecord = follower as Record<string, unknown>
        const explicitState = getBooleanField(followerRecord, ['isFollowing', 'is_following', 'followedByMe', 'followed_by_me'])
        const isFollowing = explicitState ?? nextFollowingIds.has(account.id)
        nextFollowStates[account.id] = isFollowing
        socialActionsStore.setUserFollowingState(account.id, isFollowing)
      }
    })
    followStates.value = nextFollowStates

    socialActionsStore.setProfileStats(userId.value, {
      followers: profileData?.followerCount ?? followers.value.length,
      following: profileData?.followingCount ?? following.value.length,
    })

    if (authStore.authToken && authStore.userId && authStore.userId !== userId.value) {
      const followStatusResponse = await usersService.getUserFollowStatus(userId.value, authStore.authToken)
      const followStatus = followStatusResponse.data
      const isFollowingFromStatus =
        typeof followStatus?.following === 'boolean'
          ? followStatus.following
          : typeof followStatus?.is_following === 'boolean'
            ? followStatus.is_following
            : false

      socialActionsStore.setUserFollowingState(userId.value, isFollowingFromStatus)
    } else {
      socialActionsStore.setUserFollowingState(userId.value, false)
    }

    if (!user.value && !userProfile.value) {
      loadError.value = 'This profile could not be loaded.'
    }
  } catch (error) {
    loadError.value = error instanceof ApiError
      ? error.message
      : getErrorMessage(error, 'This profile could not be loaded.')
  } finally {
    isLoadingProfile.value = false
  }
}

const profile = computed(() => {
  const name = getDisplayName(
    userProfile.value?.displayName ||
      '',
    readString((user.value as Record<string, unknown> | null)?.name),
    userProfile.value?.username ||
      '',
    readString((user.value as Record<string, unknown> | null)?.username),
  )
  const username = userProfile.value?.username || readString((user.value as Record<string, unknown> | null)?.username)
  const email = readString(user.value?.email)
  const phone = readString((user.value as Record<string, unknown> | null)?.phone)
  const location = userProfile.value?.location || readString((user.value as Record<string, unknown> | null)?.location)
  const bio = userProfile.value?.bio || readString((user.value as Record<string, unknown> | null)?.bio)

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
const profileMetaItems = computed(() =>
  [
    featuredSkill.value,
    featuredExperience.value?.company,
    profile.value.location,
  ].filter((item): item is string => Boolean(item && item.trim())),
)
const shouldShowProfileSkeleton = computed(() => isLoadingProfile.value || (!profile.value.name && !loadError.value))

const globalFollowerCount = computed(() => socialActionsStore.getProfileStats(userId.value).followers)
const globalFollowingCount = computed(() => socialActionsStore.getProfileStats(userId.value).following)

const isFollowingProfile = computed(() =>
  socialActionsStore.followingUserIds[userId.value] !== undefined
    ? socialActionsStore.isFollowingUser(userId.value)
    : followers.value.some((entry) => entry.followerId === authStore.userId),
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
      await socialActionsStore.unfollowUser(userId.value)
      followers.value = followers.value.filter((entry) => entry.followerId !== authStore.userId)
    } else {
      await socialActionsStore.followUser(userId.value)
      followers.value = [
        {
          id: `local-${Date.now()}`,
          followerId: authStore.userId,
          followingId: userId.value,
          createdAt: new Date().toISOString(),
        },
        ...followers.value,
      ]
    }
  } catch (error) {
    const message = getErrorMessage(error, 'Unable to update follow status.')

    toast.error('Follow action failed', {
      description: message,
    })
  } finally {
    isTogglingFollow.value = false
  }
}

const toggleFollowFromModal = async (targetUserId: string) => {
  if (!targetUserId || followToggles.value[targetUserId]) {
    return
  }

  if (authStore.userId && targetUserId === authStore.userId) {
    toast.info('This is your profile', {
      description: 'You cannot follow your own account.',
    })
    return
  }

  if (!authStore.isAuthenticated) {
    router.push({
      name: 'login',
      query: { redirect: route.fullPath },
    })
    return
  }

  followToggles.value[targetUserId] = true

  try {
    if (followStates.value[targetUserId]) {
      await socialActionsStore.unfollowUser(targetUserId)
      followStates.value = {
        ...followStates.value,
        [targetUserId]: false,
      }
      following.value = following.value.filter((account) => account.id !== targetUserId)
      return
    }

    await socialActionsStore.followUser(targetUserId)
    followStates.value = {
      ...followStates.value,
      [targetUserId]: true,
    }
    const account = followerAccounts.value.find((item) => item.id === targetUserId)
    if (account && !following.value.some((item) => item.id === targetUserId)) {
      following.value = [
        {
          id: account.id,
          name: account.name,
          avatar: account.avatar,
          initials: account.initials,
        },
        ...following.value,
      ]
    }
  } catch (error) {
    toast.error('Follow action failed', {
      description: getErrorMessage(error, 'Unable to update follow status.'),
    })
  } finally {
    followToggles.value[targetUserId] = false
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
    <div v-if="loadError && !isLoadingProfile" class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 text-center shadow-[var(--shadow-elevated)] sm:p-8">
      <p class="text-lg font-semibold text-[var(--text-primary)]">Profile unavailable</p>
      <p class="mt-2 text-sm text-[var(--text-secondary)]">{{ loadError }}</p>
    </div>

    <template v-else>
      <section class="overflow-hidden rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
        <!-- Banner hidden to match the private profile page layout. -->
        <div v-if="false" class="relative aspect-[4/1] min-h-36 overflow-hidden bg-[var(--surface-secondary)]">
          <img loading="lazy" decoding="async"
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
              <div class="h-24 w-24 overflow-hidden rounded-full border-4 border-[var(--surface-primary)] bg-[var(--surface-secondary)] shadow-[var(--shadow-elevated)]">
                <img loading="lazy" decoding="async"
                  v-if="profile.avatar"
                  :src="profile.avatar"
                  alt="Profile avatar"
                  class="h-full w-full object-cover"
                />
                <span
                  v-else-if="profile.initials"
                  class="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_84%,white),color-mix(in_srgb,var(--accent-strong)_72%,white))] text-2xl font-semibold text-white"
                >
                  {{ profile.initials }}
                </span>
                <span
                  v-else
                  class="block h-full w-full animate-pulse bg-[var(--surface-muted)]"
                  aria-label="Loading profile avatar"
                />
              </div>

              <div class="min-w-0">
                <h1
                  v-if="profile.name"
                  class="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2rem]"
                >
                  {{ profile.name }}
                </h1>
                <div
                  v-else
                  class="h-9 w-72 max-w-full animate-pulse rounded-full bg-[var(--surface-muted)]"
                  aria-label="Loading profile name"
                />

                <div
                  v-if="profileMetaItems.length"
                  class="mt-0.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[0.95rem] leading-5 text-[var(--text-secondary)] sm:justify-start sm:text-[1rem]"
                >
                  <template
                    v-for="(item, index) in profileMetaItems"
                    :key="item"
                  >
                    <span v-if="index > 0">-</span>
                    <span>{{ item }}</span>
                  </template>
                </div>
                <div
                  v-else
                  class="mt-3 flex flex-col gap-2 sm:flex-row"
                  aria-label="Loading profile details"
                >
                  <span class="h-4 w-28 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                  <span class="h-4 w-32 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                  <span class="h-4 w-24 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                </div>

                <div
                  v-if="!shouldShowProfileSkeleton"
                  class="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm font-semibold leading-5 sm:justify-start sm:text-[1rem]"
                >
                  <button
                    type="button"
                    class="text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                    @click="profileModal = 'followers'"
                  >
                    {{ globalFollowerCount }} followers
                  </button>
                  <span class="text-[var(--border-strong,var(--border-soft))]">|</span>
                  <button
                    type="button"
                    class="text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                    @click="profileModal = 'following'"
                  >
                    {{ globalFollowingCount }} following
                  </button>
                </div>
                <div
                  v-else
                  class="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start"
                  aria-label="Loading profile stats"
                >
                  <span class="h-4 w-24 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                  <span class="h-4 w-24 animate-pulse rounded-full bg-[var(--surface-muted)]" />
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
              {{ isTogglingFollow ? 'Updating...' : isFollowingProfile ? 'Unfollow' : 'Follow' }}
            </button>
          </div>
        </div>

        <div class="space-y-8 px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
          <div class="max-w-5xl space-y-5 text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.95rem]">
            <p v-if="profile.bio" class="whitespace-pre-line">{{ richTextToPlainText(profile.bio) }}</p>
            <div
              v-else-if="isLoadingProfile"
              class="space-y-3 py-2"
              aria-label="Loading profile about information"
            >
              <span class="block h-4 w-full max-w-xl animate-pulse rounded-full bg-[var(--surface-muted)]" />
              <span class="block h-4 w-2/3 max-w-lg animate-pulse rounded-full bg-[var(--surface-muted)]" />
            </div>
            <p v-else>No about information added yet.</p>
          </div>

        </div>
      </section>

      <div v-if="isLoadingProfile" class="animate-pulse rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4">
        <div class="h-4 w-40 rounded-full bg-[var(--surface-muted)]" />
        <div class="mt-3 h-3 w-64 max-w-full rounded-full bg-[var(--surface-muted)]" />
      </div>

      <div class="space-y-6">
        <div class="flex flex-col gap-6">
        <section id="skills" class="order-5 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Skills</h2>
            <Award class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="displaySkills.length > 0" class="flex flex-wrap gap-2 sm:gap-3">
            <div
              v-for="skill in displaySkills"
              :key="skill.id || skill.name"
              class="inline-flex max-w-full items-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 py-2 shadow-[var(--shadow-soft)] sm:px-4 sm:py-3"
            >
              <span class="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">{{ skill.name }}</span>
            </div>
          </div>
          <div v-else class="py-8 text-center text-sm text-[var(--text-secondary)]">
            <p>No skills added yet.</p>
          </div>
        </section>

        <section id="portfolio" class="order-4 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Projects</h2>
            <BookOpen class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="portfolios.length > 0" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="portfolio in portfolios"
              :key="portfolio.id || portfolio.title"
              class="min-w-0 overflow-hidden flex h-full flex-col rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4 transition hover:border-[var(--accent)] sm:p-5"
            >
              <div v-if="portfolio.pictures?.[0]" class="-mx-4 -mt-4 mb-4 aspect-video overflow-hidden rounded-t-[1.1rem] bg-[var(--surface-muted)] sm:-mx-5 sm:-mt-5">
                <video
                  v-if="isVideoMediaUrl(portfolio.pictures[0])"
                  :src="portfolio.pictures[0]"
                  class="h-full w-full object-cover"
                  controls
                  playsinline
                  preload="metadata"
                />
                <img loading="lazy" decoding="async"
                  v-else
                  :src="portfolio.pictures[0]"
                  :alt="`${portfolio.title || 'Project'} media`"
                  class="h-full w-full object-cover"
                />
              </div>
              <p class="break-words text-lg font-semibold text-[var(--text-primary)]">{{ portfolio.title }}</p>
              <p v-if="portfolio.description" class="mt-3 line-clamp-5 break-words text-sm leading-6 text-[var(--text-secondary)]">{{ richTextToPlainText(portfolio.description) }}</p>
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
          <div v-else class="py-8 text-center text-sm text-[var(--text-secondary)]">
            <p>No portfolio items added yet.</p>
          </div>
        </section>

        <section id="certifications" class="order-3 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Professional Certifications</h2>
            <Award class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="certifications.length > 0" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          <div v-else class="py-8 text-center text-sm text-[var(--text-secondary)]">
            <p>No certifications added yet.</p>
          </div>
        </section>

        <section id="education" class="order-2 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Highest Level Education</h2>
            <GraduationCap class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="educations.length > 0" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="education in educations"
              :key="education.id || education.school"
              class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <p class="font-semibold text-[var(--text-primary)]">{{ education.school }}</p>
              <p v-if="education.degree" class="text-sm text-[var(--text-secondary)]">{{ education.degree }}</p>
              <p v-if="education.field" class="text-sm text-[var(--text-secondary)]">{{ education.field }}</p>
              <p v-if="education.startDate || education.endDate" class="mt-1 text-xs text-[var(--text-tertiary)]">
                {{ education.startDate ? new Date(education.startDate).toLocaleDateString() : '' }}
                {{ education.startDate && education.endDate ? ' - ' : '' }}
                {{ education.endDate ? new Date(education.endDate).toLocaleDateString() : '' }}
              </p>
            </div>
          </div>
          <div v-else class="py-8 text-center text-sm text-[var(--text-secondary)]">
            <p>No education records added yet.</p>
          </div>
        </section>

        <section id="experience" class="order-1 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Experience</h2>
            <Briefcase class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="experiences.length > 0" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div
              v-for="experience in experiences"
              :key="experience.id || `${experience.company}-${experience.title}`"
              class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <p class="font-semibold text-[var(--text-primary)]">{{ toInitialCaps(experience.title, { keepSmallWords: true }) }}</p>
              <p v-if="experience.company" class="text-sm text-[var(--text-secondary)]">{{ toInitialCaps(experience.company, { keepSmallWords: true }) }}</p>
              <p v-if="experience.employmentType" class="text-xs text-[var(--text-tertiary)]">{{ experience.employmentType }}</p>
              <p v-if="experience.startDate || experience.endDate || experience.isCurrent" class="mt-1 text-xs text-[var(--text-tertiary)]">
                {{ experience.startDate ? new Date(experience.startDate).toLocaleDateString() : '' }}
                {{ experience.startDate && (experience.endDate || experience.isCurrent) ? ' - ' : '' }}
                {{ experience.isCurrent ? 'Present' : (experience.endDate ? new Date(experience.endDate).toLocaleDateString() : '') }}
              </p>
              <p v-if="experience.description" class="mt-2 text-sm text-[var(--text-secondary)]">{{ richTextToPlainText(experience.description) }}</p>
            </div>
          </div>
          <div v-else class="py-8 text-center text-sm text-[var(--text-secondary)]">
            <p>No experience records added yet.</p>
          </div>
        </section>

        <section id="uploads" class="order-6 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="mb-5 flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Uploads</h2>
            <ImageIcon class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="profileUploads.length > 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article
              v-for="item in profileUploads"
              :key="item.id"
              class="overflow-hidden rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-soft)]"
            >
              <div class="aspect-square bg-[var(--surface-secondary)]">
                <img loading="lazy" decoding="async"
                  v-if="item.mediaType === 'image'"
                  :src="item.url"
                  :alt="item.title"
                  class="h-full w-full object-cover"
                />
                <video
                  v-else
                  :src="item.url"
                  class="h-full w-full object-cover"
                  controls
                  playsinline
                  preload="metadata"
                />
              </div>
              <div class="px-4 py-3">
                <a
                  v-if="item.externalUrl"
                  :href="item.externalUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-base font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
                >
                  {{ item.title }}
                </a>
                <h3 v-else class="text-base font-semibold text-[var(--text-primary)]">{{ item.title }}</h3>
              </div>
            </article>
          </div>

          <div v-else class="rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-5 text-center sm:p-8">
            <ImageIcon class="mx-auto h-9 w-9 text-[var(--text-tertiary)]" />
            <p class="mt-3 text-base font-semibold text-[var(--text-primary)]">No profile uploads yet</p>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">Uploaded images and videos will appear here.</p>
          </div>
        </section>

        </div>
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
            {{ profileModal === 'followers' ? 'Followers' : 'Following' }}
          </h3>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">
            <span v-if="profileModal === 'followers'">People currently following this profile.</span>
            <span v-else>Profiles this member follows.</span>
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
        <template v-if="profileModal === 'followers'">
          <div
            v-for="account in followerAccounts"
            :key="account.id"
            class="flex items-center justify-between gap-4 rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
          >
            <RouterLink :to="`/profile/view/${account.id}`" class="flex min-w-0 items-center gap-3">
              <div class="h-12 w-12 overflow-hidden rounded-full bg-[color:color-mix(in_srgb,var(--accent)_16%,white)]">
                <img loading="lazy" decoding="async"
                  v-if="account.avatar"
                  :src="account.avatar"
                  :alt="`${account.name} profile image`"
                  class="h-full w-full object-cover"
                />
                <span
                  v-else
                  class="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--accent-strong)]"
                >
                  {{ account.initials }}
                </span>
              </div>
              <p
                v-if="account.name"
                class="truncate text-sm font-semibold text-[var(--text-primary)]"
              >
                {{ account.name }}
              </p>
              <span
                v-else
                class="h-4 w-36 animate-pulse rounded-full bg-[var(--surface-muted)]"
                aria-label="Loading follower name"
              />
            </RouterLink>
            <button
              v-if="!account.isCurrentUser"
              type="button"
              :disabled="followToggles[account.id]"
              class="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-[0.75rem] px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              :class="
                account.isFollowing
                  ? 'border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-primary)] hover:border-red-200 hover:text-red-500'
                  : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]'
              "
              :title="account.isFollowing ? 'Unfollow' : 'Follow'"
              @click="toggleFollowFromModal(account.id)"
            >
              <component :is="account.isFollowing ? UserCheck : UserPlus" class="h-4 w-4" />
              {{ account.isFollowing ? 'Unfollow' : 'Follow' }}
            </button>
          </div>

          <div
            v-if="followerAccounts.length === 0"
            class="flex min-h-36 flex-col items-center justify-center rounded-[1.15rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-8 text-center"
          >
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--accent-strong)]">
              <UserPlus class="h-5 w-5" />
            </span>
            <p class="mt-3 text-sm font-semibold text-[var(--text-primary)]">No followers yet.</p>
            <p class="mt-1 max-w-sm text-xs leading-5 text-[var(--text-secondary)]">
              People who follow this profile will appear here.
            </p>
          </div>
        </template>

        <template v-else>
          <div
            v-for="account in following"
            :key="account.id"
            class="flex items-center justify-between gap-4 rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
          >
            <RouterLink :to="`/profile/view/${account.id}`" class="flex min-w-0 items-center gap-3">
              <div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[color:color-mix(in_srgb,var(--accent)_16%,white)]">
                <img loading="lazy" decoding="async"
                  v-if="account.avatar"
                  :src="account.avatar"
                  :alt="`${account.name} profile image`"
                  class="h-full w-full object-cover"
                />
                <span
                  v-else
                  class="flex h-full w-full items-center justify-center text-sm font-semibold text-[var(--accent-strong)]"
                >
                  {{ account.initials }}
                </span>
              </div>
              <p
                v-if="account.name"
                class="truncate text-sm font-semibold text-[var(--text-primary)]"
              >
                {{ account.name }}
              </p>
              <span
                v-else
                class="h-4 w-36 animate-pulse rounded-full bg-[var(--surface-muted)]"
                aria-label="Loading following profile name"
              />
            </RouterLink>
            <button
              v-if="authStore.isAuthenticated && authStore.userId !== account.id"
              type="button"
              :disabled="followToggles[account.id]"
              class="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              title="Unfollow"
              @click="toggleFollowFromModal(account.id)"
            >
              <UserCheck class="h-4 w-4" />
              Unfollow
            </button>
          </div>
          <div
            v-if="following.length === 0"
            class="flex min-h-36 flex-col items-center justify-center rounded-[1.15rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-8 text-center"
          >
            <span class="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--accent-strong)]">
              <UserCheck class="h-5 w-5" />
            </span>
            <p class="mt-3 text-sm font-semibold text-[var(--text-primary)]">No following yet.</p>
            <p class="mt-1 max-w-sm text-xs leading-5 text-[var(--text-secondary)]">
              Profiles this member follows will appear here.
            </p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
