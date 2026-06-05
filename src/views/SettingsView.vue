<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Eye,
  EyeOff,
  Loader2,
  Monitor,
  Moon,
  Settings2,
  Sun,
  Trash2,
  UserRound,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import AppFeedPost from '@/components/AppFeedPost.vue'
import type { FeedPost } from '@/data/feedPosts'
import { ApiError } from '@/lib/api'
import { useTheme, type ThemeMode } from '@/composables/useTheme'
import { authService } from '@/services/auth'
import { communitiesService, type CommunityRecord } from '@/services/communities'
import { notificationsService, type NotificationPreferences } from '@/services/notifications'
import { postsService, type PostRecord } from '@/services/posts'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import { usePagesStore } from '@/stores/pages'
import { mapApiPostToFeedPost } from '@/utils/postMapper'

type SettingsTab =
  | 'theme'
  | 'change-password'
  | 'email-settings'
  | 'privacy'
  | 'saved-post'
  | 'delete-account'
  | 'delete-page'

const authStore = useAuthStore()
const pagesStore = usePagesStore()
const activeTab = ref<SettingsTab>('privacy')
const showPasswordFields = ref({
  current: false,
  next: false,
  confirm: false,
})
const deleteAccountConfirmed = ref(false)
const deletePageConfirmed = ref(false)
const emailAddress = ref(authStore.currentUser?.email || authStore.signUpDraft.email || '')
const selectedDeletePageId = ref('')
const isSavingPassword = ref(false)
const isSavingEmail = ref(false)
const isLoadingNotificationPreferences = ref(false)
const isSavingNotificationPreferences = ref(false)
const isSavingPrivacy = ref(false)
const isDeletingPage = ref(false)
const isLoadingSavedPosts = ref(false)
const savedPosts = ref<FeedPost[]>([])
const savedPostsError = ref('')
const communitiesById = ref(new Map<string, CommunityRecord>())
const passwordForm = ref({
  current: '',
  next: '',
  confirm: '',
})
const notificationPreferences = ref<NotificationPreferences>({
  inApp: true,
  browser: true,
  email: false,
  comments: true,
  replies: true,
  answers: true,
  scores: true,
  follows: true,
  communities: true,
  jobs: true,
  pages: true,
  system: true,
})
const { theme, resolvedTheme, setTheme } = useTheme()

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'theme', label: 'Theme' },
  { id: 'change-password', label: 'Change Password' },
  { id: 'email-settings', label: 'Email Settings' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'saved-post', label: 'Saved Post' },
  // The current API spec does not expose account deletion, so this tab is not rendered.
  { id: 'delete-page', label: 'Delete Page' },
]

const themeOptions: Array<{
  value: ThemeMode
  label: string
  description: string
  icon: typeof Sun
}> = [
  {
    value: 'light',
    label: 'Light',
    description: 'Use the light interface across the app.',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Use the dark interface across the app.',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Match your device preference automatically.',
    icon: Monitor,
  },
]

const notificationPreferenceOptions = [
  { key: 'inApp', label: 'Inbox', description: 'Answers, comments, and chat notifications' },
  { key: 'browser', label: 'Alerts', description: 'Content from people and pages you follow' },
  { key: 'email', label: 'Email notifications', description: 'Receive selected updates by email' },
  { key: 'comments', label: 'Comments', description: 'New comments on your posts' },
  { key: 'replies', label: 'Replies', description: 'Replies to your comments' },
  { key: 'answers', label: 'Answers', description: 'Answers to your questions' },
  { key: 'scores', label: 'Scores and reactions', description: 'Scores and reactions on your content' },
  { key: 'follows', label: 'Follows', description: 'New followers and follow activity' },
  { key: 'communities', label: 'Research', description: 'Community invitations, surveys, and research' },
  { key: 'jobs', label: 'Recommended Jobs', description: 'Emails highlighting relevant jobs and companies' },
  { key: 'pages', label: 'Page activity', description: 'Updates from pages you manage' },
  { key: 'system', label: 'Features & Announcements', description: 'Product updates and occasional announcements' },
] as const

const privacySettings = ref({
  profilePicture: 'public',
  country: 'public',
  biography: 'public',
})

const resolvedThemeLabel = computed(() =>
  resolvedTheme.value === 'dark' ? 'Dark mode is currently active.' : 'Light mode is currently active.',
)

const togglePasswordField = (field: keyof typeof showPasswordFields.value) => {
  showPasswordFields.value[field] = !showPasswordFields.value[field]
}

const deleteCopy = computed(() =>
  activeTab.value === 'delete-page'
    ? {
        title: 'Delete Page',
        button: 'Delete page',
      }
    : {
        title: 'Delete Account',
        button: 'Delete your account',
      },
)

const requireAuthToken = () => {
  if (authStore.authToken) {
    return true
  }

  toast.error('Sign in required', {
    description: 'Please sign in again before updating settings.',
  })
  return false
}

const mapSavedPost = async (post: PostRecord) => {
  const [mediaResponse, authorResponse] = await Promise.all([
    postsService.listPostMedia(post.id, authStore.authToken).catch(() => null),
    post.user_id
      ? usersService.getUserProfile(post.user_id, authStore.authToken).catch(() => null)
      : Promise.resolve(null),
  ])

  return mapApiPostToFeedPost(
    post,
    mediaResponse?.data ?? [],
    authorResponse?.data ?? null,
    communitiesById.value.get(post.community_id || post.communityId || '')?.name,
  )
}

const loadSavedPosts = async () => {
  if (!requireAuthToken() || isLoadingSavedPosts.value) {
    return
  }

  isLoadingSavedPosts.value = true
  savedPostsError.value = ''

  try {
    const communitiesResponse = await communitiesService
      .listCommunities({ per_page: 100, limit: 100 }, authStore.authToken)
      .catch(() => null)
    communitiesById.value = new Map(
      (communitiesResponse?.data ?? []).map((community) => [community.id, community]),
    )

    const response = await postsService
      .listSavedPosts({ per_page: 100, sort: '-createdAt' }, authStore.authToken)
      .catch(() => postsService.listPosts({ per_page: 100, sort: '-createdAt' }, authStore.authToken))
    const records = response.data ?? []
    const savedRecords = records.some((post) => post.is_saved) ? records.filter((post) => post.is_saved) : records
    savedPosts.value = await Promise.all(savedRecords.map(mapSavedPost))
  } catch (error) {
    savedPosts.value = []
    savedPostsError.value =
      error instanceof ApiError ? error.message : 'Unable to load saved posts.'
  } finally {
    isLoadingSavedPosts.value = false
  }
}

const loadNotificationPreferences = async () => {
  if (!authStore.authToken || isLoadingNotificationPreferences.value) {
    return
  }

  isLoadingNotificationPreferences.value = true

  try {
    const response = await notificationsService.getPreferences(authStore.authToken)
    notificationPreferences.value = {
      ...notificationPreferences.value,
      ...(response.data ?? {}),
    }
  } catch {
    return
  } finally {
    isLoadingNotificationPreferences.value = false
  }
}

const updateNotificationPreference = async (key: string, value: boolean) => {
  if (!requireAuthToken() || isSavingNotificationPreferences.value) {
    return
  }

  const previousPreferences = { ...notificationPreferences.value }
  notificationPreferences.value = {
    ...notificationPreferences.value,
    [key]: value,
  }
  isSavingNotificationPreferences.value = true

  try {
    const response = await notificationsService.updatePreferences(
      notificationPreferences.value,
      authStore.authToken,
    )
    notificationPreferences.value = {
      ...notificationPreferences.value,
      ...(response.data ?? {}),
    }
    toast.success('Notification preference saved.')
  } catch (error) {
    notificationPreferences.value = previousPreferences
    const message = error instanceof Error ? error.message : 'Unable to save notification preferences.'
    toast.error('Notification preference failed', { description: message })
  } finally {
    isSavingNotificationPreferences.value = false
  }
}

const changePassword = async () => {
  if (!requireAuthToken() || isSavingPassword.value) {
    return
  }

  if (!passwordForm.value.current || !passwordForm.value.next || !passwordForm.value.confirm) {
    toast.error('Fill all password fields.')
    return
  }

  if (passwordForm.value.next !== passwordForm.value.confirm) {
    toast.error('New passwords do not match.')
    return
  }

  isSavingPassword.value = true

  try {
    await authService.changePassword(
      {
        current_password: passwordForm.value.current,
        password: passwordForm.value.next,
        password_confirmation: passwordForm.value.confirm,
      },
      authStore.authToken,
    )
    passwordForm.value = { current: '', next: '', confirm: '' }
    toast.success('Password changed.')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to change password.'
    toast.error('Password failed', { description: message })
  } finally {
    isSavingPassword.value = false
  }
}

const changeEmail = async () => {
  if (!requireAuthToken() || isSavingEmail.value) {
    return
  }

  const email = emailAddress.value.trim()

  if (!email) {
    toast.error('Enter an email address.')
    return
  }

  isSavingEmail.value = true

  try {
    await authService.changeEmail({ new_email: email }, authStore.authToken)
    authStore.signUpDraft.email = email
    if (authStore.currentUser) {
      authStore.setCurrentUser({ ...authStore.currentUser, email })
    }
    toast.success('Email address saved.')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to change email.'
    toast.error('Email failed', { description: message })
  } finally {
    isSavingEmail.value = false
  }
}

const deleteSelectedPage = async () => {
  if (!requireAuthToken() || isDeletingPage.value) {
    return
  }

  if (!selectedDeletePageId.value) {
    toast.error('Select a page to delete.')
    return
  }

  if (!deletePageConfirmed.value) {
    toast.error('Confirm page deletion first.')
    return
  }

  isDeletingPage.value = true

  try {
    await pagesStore.deletePageFromApi(selectedDeletePageId.value)
    selectedDeletePageId.value = ''
    deletePageConfirmed.value = false
    toast.success('Page deleted.')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to delete page.'
    toast.error('Delete failed', { description: message })
  } finally {
    isDeletingPage.value = false
  }
}

const savePrivacy = async () => {
  if (!requireAuthToken() || isSavingPrivacy.value) return

  isSavingPrivacy.value = true
  try {
    await usersService.updatePrivacy(privacySettings.value, authStore.authToken)
    toast.success('Privacy settings saved.')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save privacy settings.'
    toast.error('Privacy update failed', { description: message })
  } finally {
    isSavingPrivacy.value = false
  }
}

onMounted(() => {
  void pagesStore.loadPages()
  void loadSavedPosts()
  void loadNotificationPreferences()
})
</script>

<template>
  <section class="mx-auto max-w-7xl space-y-8 px-3 py-6 sm:px-4 lg:px-6">
    <header class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-4">
          <span class="flex h-14 w-14 items-center justify-center rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--accent-strong)] shadow-[var(--shadow-soft)]">
            <Settings2 class="h-7 w-7" />
          </span>
          <div>
            <h1 class="text-[1.8rem] font-semibold leading-tight text-[var(--text-primary)]">
              Settings
            </h1>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">
              Manage your profile, privacy, notifications, and account access.
            </p>
          </div>
        </div>

        <RouterLink
          to="/profile"
          class="inline-flex h-10 items-center justify-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
        >
          <UserRound class="h-4 w-4" />
          View Profile
        </RouterLink>
      </div>

      <nav class="flex gap-5 overflow-x-auto border-b border-[color:var(--border-soft)] bg-[var(--surface-primary)]">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="shrink-0 border-b-2 px-0 pb-3 text-[0.92rem] font-semibold transition"
          :class="activeTab === tab.id ? 'border-[color:var(--accent)] text-[var(--accent-strong)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>
    </header>

    <div class="max-w-5xl">
      <section v-if="activeTab === 'theme'" class="space-y-5">
        <div class="rounded-[0.9rem] bg-[var(--surface-secondary)] p-5">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Theme</h2>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">Choose how Skills4Export looks on this device.</p>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <button
            v-for="option in themeOptions"
            :key="option.value"
            type="button"
            class="rounded-[0.9rem] border p-4 text-left transition"
            :class="
              theme === option.value
                ? 'border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface-primary))]'
                : 'border-[color:var(--border-soft)] bg-[var(--surface-primary)] hover:border-[color:var(--accent-soft)]'
            "
            @click="setTheme(option.value)"
          >
            <div class="flex items-start justify-between gap-3">
              <span class="inline-flex h-10 w-10 items-center justify-center rounded-[0.75rem] bg-[var(--surface-secondary)] text-[var(--accent-strong)]">
                <component :is="option.icon" class="h-5 w-5" />
              </span>
              <span
                class="mt-1 h-4 w-4 rounded-full border"
                :class="theme === option.value ? 'border-[color:var(--accent)] bg-[var(--accent)]' : 'border-[color:var(--border-soft)] bg-[var(--surface-primary)]'"
              />
            </div>
            <h3 class="mt-4 text-base font-semibold text-[var(--text-primary)]">{{ option.label }}</h3>
            <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{{ option.description }}</p>
          </button>
        </div>

        <div class="rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4">
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            Current selection: <span class="text-[var(--accent-strong)]">{{ theme }}</span>
          </p>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ resolvedThemeLabel }}</p>
        </div>
      </section>

      <section v-else-if="activeTab === 'change-password'" class="space-y-5">
        <div class="rounded-[0.9rem] bg-[var(--surface-secondary)] p-5">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Change password</h2>
        </div>

        <div class="space-y-4">
          <label class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Current Password</span>
            <div class="relative mt-2">
              <input
                v-model="passwordForm.current"
                :type="showPasswordFields.current ? 'text' : 'password'"
                placeholder="Current password"
                class="h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 pr-12 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:text-[var(--accent-strong)]"
                :aria-label="showPasswordFields.current ? 'Hide current password' : 'Show current password'"
                @click="togglePasswordField('current')"
              >
                <EyeOff v-if="showPasswordFields.current" class="h-5 w-5" />
                <Eye v-else class="h-5 w-5" />
              </button>
            </div>
          </label>
          <label class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">New Password</span>
            <div class="relative mt-2">
              <input
                v-model="passwordForm.next"
                :type="showPasswordFields.next ? 'text' : 'password'"
                placeholder="New password"
                class="h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 pr-12 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:text-[var(--accent-strong)]"
                :aria-label="showPasswordFields.next ? 'Hide new password' : 'Show new password'"
                @click="togglePasswordField('next')"
              >
                <EyeOff v-if="showPasswordFields.next" class="h-5 w-5" />
                <Eye v-else class="h-5 w-5" />
              </button>
            </div>
          </label>
          <label class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">New Password (again)</span>
            <div class="relative mt-2">
              <input
                v-model="passwordForm.confirm"
                :type="showPasswordFields.confirm ? 'text' : 'password'"
                placeholder="New password again"
                class="h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 pr-12 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:text-[var(--accent-strong)]"
                :aria-label="showPasswordFields.confirm ? 'Hide password confirmation' : 'Show password confirmation'"
                @click="togglePasswordField('confirm')"
              >
                <EyeOff v-if="showPasswordFields.confirm" class="h-5 w-5" />
                <Eye v-else class="h-5 w-5" />
              </button>
            </div>
          </label>
          <p class="text-sm leading-6 text-[var(--text-secondary)]">
            Passwords must contain at least eight characters, including at least 1 letter and 1 number.
          </p>
          <div>
            <button
              type="button"
              :disabled="isSavingPassword"
              class="mt-4 inline-flex h-11 items-center gap-2 rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              @click="changePassword"
            >
              <Loader2 v-if="isSavingPassword" class="h-4 w-4 animate-spin" />
              {{ isSavingPassword ? 'Changing...' : 'Change Password' }}
            </button>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'email-settings'" class="space-y-7">
        <div class="rounded-[0.9rem] bg-[var(--surface-secondary)] p-5">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Email Settings</h2>
        </div>

        <div class="space-y-8">
          <label class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">
              Email Address <span class="text-xs">(only affects your notifications email address)</span>
            </span>
            <div class="mt-2 flex overflow-hidden rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)]">
              <input
                v-model="emailAddress"
                type="email"
                placeholder="you@example.com"
                class="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm text-[var(--text-primary)] outline-none"
              />
              <button
                type="button"
                :disabled="isSavingEmail"
                class="inline-flex items-center gap-2 border-l border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                @click="changeEmail"
              >
                <Loader2 v-if="isSavingEmail" class="h-4 w-4 animate-spin" />
                {{ isSavingEmail ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </label>

          <article class="rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-[var(--text-primary)]">Notification preferences</p>
                <p class="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  Choose which updates should reach you across the platform.
                </p>
              </div>
              <Loader2
                v-if="isLoadingNotificationPreferences || isSavingNotificationPreferences"
                class="h-4 w-4 animate-spin text-[var(--accent-strong)]"
              />
            </div>

            <div class="mt-5 divide-y divide-[color:var(--border-soft)]">
              <label
                v-for="option in notificationPreferenceOptions"
                :key="option.key"
                class="flex items-center justify-between gap-4 py-5"
              >
                <span>
                  <span class="block text-sm font-semibold text-[var(--text-primary)]">{{ option.label }}</span>
                  <span class="mt-1 block text-sm text-[var(--text-secondary)]">{{ option.description }}</span>
                </span>
                <input
                  type="checkbox"
                  class="peer sr-only"
                  :checked="Boolean(notificationPreferences[option.key])"
                  :disabled="isLoadingNotificationPreferences || isSavingNotificationPreferences"
                  @change="updateNotificationPreference(option.key, ($event.target as HTMLInputElement).checked)"
                />
                <span class="relative h-7 w-12 shrink-0 rounded-full bg-[var(--surface-muted)] transition peer-checked:bg-[var(--accent)] peer-disabled:opacity-50 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
              </label>
            </div>
          </article>
        </div>
      </section>

      <section v-else-if="activeTab === 'saved-post'" class="space-y-5">
        <div class="rounded-[0.9rem] bg-[var(--surface-secondary)] p-5">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Saved Post</h2>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">Posts you have saved appear here.</p>
        </div>

        <div
          v-if="savedPostsError"
          class="rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-secondary)]"
        >
          {{ savedPostsError }}
        </div>

        <div v-if="isLoadingSavedPosts" class="space-y-4">
          <article
            v-for="item in 3"
            :key="item"
            class="animate-pulse rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4"
          >
            <div class="h-4 w-44 rounded-full bg-[var(--surface-muted)]" />
            <div class="mt-4 h-5 w-3/4 rounded-full bg-[var(--surface-muted)]" />
            <div class="mt-3 h-32 rounded-[0.8rem] bg-[var(--surface-muted)]" />
          </article>
        </div>

        <div v-else-if="savedPosts.length" class="space-y-4">
          <AppFeedPost
            v-for="post in savedPosts"
            :key="post.apiId || post.slug"
            :post="post"
          />
        </div>

        <div
          v-else
          class="rounded-[0.9rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 text-center"
        >
          <p class="text-sm font-semibold text-[var(--text-primary)]">No saved posts yet.</p>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">Save posts from the feed to collect them here.</p>
        </div>
      </section>

      <section v-else-if="activeTab === 'privacy'" class="space-y-7">
        <div class="rounded-[0.9rem] bg-[var(--surface-secondary)] p-5">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Privacy Settings</h2>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">Select who may see your profile details</p>
        </div>

        <div class="space-y-5">
          <label v-for="field in [
            { key: 'profilePicture', label: 'Profile Picture' },
            { key: 'country', label: 'Country' },
            { key: 'biography', label: 'Biography' },
          ]" :key="field.key" class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">{{ field.label }}</span>
            <select
              v-model="privacySettings[field.key as keyof typeof privacySettings]"
              class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)]"
            >
              <option value="public">Public</option>
              <option value="followers">Followers only</option>
              <option value="private">Private</option>
            </select>
          </label>
          <button
            type="button"
            :disabled="isSavingPrivacy"
            class="inline-flex h-11 items-center gap-2 rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
            @click="savePrivacy"
          >
            <Loader2 v-if="isSavingPrivacy" class="h-4 w-4 animate-spin" />
            {{ isSavingPrivacy ? 'Saving...' : 'Save changes' }}
          </button>
        </div>
      </section>

      <section
        v-else
        class="rounded-[0.95rem] border border-[color:var(--danger)] bg-[var(--surface-primary)] p-5 sm:p-6"
      >
        <h2 class="text-xl font-semibold text-[var(--danger)]">{{ deleteCopy.title }}</h2>
        <p class="mt-1 text-lg font-semibold text-[var(--danger)]">Sorry to see you go</p>
        <p class="mt-4 text-sm leading-7 text-[var(--text-primary)]">
          Before confirming that you would like your profile deleted, we'd like to take a moment to explain the implications of deletion:
        </p>
        <ul class="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-[var(--text-secondary)]">
          <li>
            Deletion is irreversible, and you will have no way to regain any of your original content, should this deletion be carried out and you change your mind later on.
          </li>
          <li>
            Your questions and answers will remain on the site, but will be disassociated and anonymized, and will not indicate your authorship even if you later return to the site.
          </li>
        </ul>
        <p class="mt-5 text-sm leading-7 text-[var(--text-primary)]">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <label v-if="activeTab === 'delete-page'" class="mt-5 block">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Page to delete</span>
          <select
            v-model="selectedDeletePageId"
            class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)]"
          >
            <option value="">Select a page</option>
            <option v-for="page in pagesStore.pages" :key="page.id" :value="page.id">
              {{ page.name }}
            </option>
          </select>
        </label>
        <label class="mt-5 flex items-start gap-2 text-sm leading-6 text-[var(--text-primary)]">
          <input
            v-if="activeTab === 'delete-account'"
            v-model="deleteAccountConfirmed"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-[color:var(--border-soft)]"
          />
          <input
            v-else
            v-model="deletePageConfirmed"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-[color:var(--border-soft)]"
          />
          <span>
            I have read the information stated above and understand the implications of having my profile deleted. I wish to proceed with the deletion of my profile.
          </span>
        </label>
        <button
          type="button"
          class="mt-6 inline-flex h-11 items-center gap-2 rounded-[0.75rem] bg-[color:color-mix(in_srgb,var(--danger)_45%,white)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="activeTab === 'delete-account' ? !deleteAccountConfirmed : !deletePageConfirmed"
          @click="activeTab === 'delete-page' ? deleteSelectedPage() : undefined"
        >
          <Loader2 v-if="isDeletingPage" class="h-4 w-4 animate-spin" />
          <Trash2 v-else class="h-4 w-4" />
          {{ isDeletingPage ? 'Deleting...' : deleteCopy.button }}
        </button>
      </section>
    </div>
  </section>
</template>
