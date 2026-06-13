<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RefreshCw, WifiOff } from 'lucide-vue-next'
import { Toaster } from 'vue-sonner'
import { toast } from 'vue-sonner'
import AppHeader from '@/components/AppHeader.vue'
import NetworkStatusCard from '@/components/NetworkStatusCard.vue'
import AppRightRail from '@/components/AppRightRail.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import { useCurrentUserIdentity } from '@/composables/useCurrentUserIdentity'
import { ApiError, SESSION_EXPIRED_EVENT, type SessionExpiredEventDetail } from '@/lib/api'
import { authService } from '@/services/auth'
import { usersService } from '@/services/users'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { useSocialActionsStore } from '@/stores/socialActions'
import { useTheme } from '@/composables/useTheme'
import { isLikelyEmail } from '@/utils/displayName'

const headerLinks: Array<{ label: string; to?: string; action?: 'ask' | 'post'; target?: string; iconClass?: string }> = [
  { label: 'Home', to: '/feed' },
  { label: 'Ask', action: 'ask', iconClass: 'las la-question-circle' },
  { label: 'Post', action: 'post' },
  { label: 'Answer', to: '/answer/question', iconClass: 'las la-book' },
  { label: 'Communities', to: '/communities', iconClass: 'las la-users' },
]

const authStore = useAuthStore()
const appStore = useAppStore()
const notificationsStore = useNotificationsStore()
const socialActionsStore = useSocialActionsStore()
const route = useRoute()
const router = useRouter()
const isMobileSidebarOpen = ref(false)
// Temporary API debug modal toggle. Remove this with the debug modal overlay when no longer needed.
const showApiDebugModal =
  import.meta.env.VITE_SHOW_API_DEBUG_MODAL === undefined
    ? import.meta.env.DEV
    : import.meta.env.VITE_SHOW_API_DEBUG_MODAL === 'true'

const currentUser = useCurrentUserIdentity()
const isLoadingCurrentUserProfile = ref(false)
const profileName = currentUser.displayName
const profileRole = currentUser.role
const profileInitials = currentUser.initials
const profileImage = currentUser.avatarSrc
const notifications = computed(() => notificationsStore.visibleNotifications)

const userMenu = computed(() => [
  { label: 'Profile', to: '/profile' },
  { label: 'Create Alerts', to: '/jobs/alerts' },
  { label: 'Manage activities', to: '/activities' },
  { label: 'Manage Jobs', to: '/jobs' },
  { label: 'Referrals', to: '/referrals' },
  ...(authStore.isAuthenticated
    ? [
        { label: 'Settings', to: '/settings' },
        { label: authStore.authMenuLabel, to: '/', action: 'logout' as const },
      ]
    : [{ label: authStore.authMenuLabel, to: '/auth/login' }]),
])

const { resolvedTheme } = useTheme()

const toasterTheme = computed(() => resolvedTheme.value)
const toasterOptions = {
  class: 'skills-toast',
  descriptionClass: 'skills-toast__description',
  actionButtonClass: 'skills-toast__action',
  cancelButtonClass: 'skills-toast__cancel',
}
const showNetworkOverlay = computed(
  () => appStore.networkStatus.offline || appStore.networkStatus.backendUnreachable,
)
const currentLayout = computed(() => String(route.meta.layout ?? 'public'))
const showHeader = computed(() => currentLayout.value === 'app')
const hideSidebar = computed(() => Boolean(route.meta.hideSidebar))
const hideRightRail = computed(() => Boolean(route.meta.hideRightRail))
const forceRightRail = computed(() => Boolean(route.meta.showRightRail))
const hideRightRailQuestions = computed(() => route.path.startsWith('/communities/'))
const hideRightRailAdverts = computed(() => Boolean(route.meta.hideRightRailAdverts))
const usesWorkspaceShell = computed(
  () =>
    showHeader.value &&
    !route.path.startsWith('/profile') &&
    route.path !== '/settings' &&
    !route.path.startsWith('/pages/create'),
)
const showSidebar = computed(() => usesWorkspaceShell.value && !hideSidebar.value)
const showWorkspaceShell = computed(() => showSidebar.value || forceRightRail.value)
const showRightRail = computed(
  () =>
    !hideRightRail.value &&
    (showWorkspaceShell.value || usesWorkspaceShell.value) &&
    route.path !== '/communities' &&
    route.path !== '/settings',
)
const workspaceShellClasses = computed(() =>
  showWorkspaceShell.value
    ? [
        'flex flex-col gap-4 lg:h-[calc(100vh-theme(spacing.14))] lg:min-h-0 lg:overflow-hidden lg:grid lg:gap-4 xl:gap-5',
        showSidebar.value && showRightRail.value
          ? 'lg:grid-cols-[17.5rem_minmax(0,1fr)_17.5rem]'
          : showSidebar.value
            ? 'lg:grid-cols-[17.5rem_minmax(0,1fr)]'
            : showRightRail.value
              ? 'lg:grid-cols-[minmax(0,1fr)_17.5rem]'
              : 'lg:grid-cols-[minmax(0,1fr)]',
      ].join(' ')
    : 'flex flex-col gap-4 lg:items-start lg:gap-4',
)
const mainClasses = computed(() =>
  showHeader.value
    ? [
        'mx-auto w-full max-w-[86rem] flex-1 px-3 py-4 sm:px-4 sm:py-5 xl:px-8',
        showWorkspaceShell.value ? 'lg:px-5 lg:pt-0 lg:pb-5' : 'lg:px-6 lg:py-6',
      ].join(' ')
    : 'mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-6xl flex-1 items-center justify-center px-3 py-5 sm:px-5 sm:py-6 lg:px-6 lg:py-8',
)

watch(
  () => route.fullPath,
  () => {
    isMobileSidebarOpen.value = false
  },
)

const syncBrowserNetworkState = () => {
  if (typeof navigator === 'undefined') {
    return
  }

  appStore.setOfflineStatus(!navigator.onLine)

  if (navigator.onLine) {
    appStore.networkStatus.backendUnreachable = false
  }
}

const handleOffline = () => {
  appStore.setOfflineStatus(true)
  toast.warning('You are offline', {
    description: 'We will reconnect automatically when your internet comes back on.',
  })
}

const handleOnline = () => {
  const hadNetworkIssue = showNetworkOverlay.value
  appStore.clearNetworkIssue()

  if (hadNetworkIssue) {
    toast.success('Connection restored', {
      description: 'You can continue using the app now.',
    })
  }
}

const handleSessionExpired = (event: Event) => {
  if (!authStore.authToken && !authStore.isAuthenticated) {
    return
  }

  const detail = (event as CustomEvent<SessionExpiredEventDetail>).detail
  const redirectTarget =
    route.meta.requiresAuth && route.fullPath.startsWith('/')
      ? route.fullPath
      : '/feed'

  authStore.clearAuthenticatedSession()
  notificationsStore.reset()
  socialActionsStore.reset()

  toast.warning('Session expired', {
    description: detail?.message || 'Please log in again to continue.',
  })

  if (route.name !== 'login') {
    void router.push({
      name: 'login',
      query: {
        redirect: redirectTarget,
      },
    })
  }
}

const reloadCurrentRoute = async () => {
  await router.replace({
    path: route.fullPath,
    query: {
      ...route.query,
      _retry: Date.now().toString(),
    },
  })
}

onMounted(() => {
  syncBrowserNetworkState()
  window.addEventListener('offline', handleOffline)
  window.addEventListener('online', handleOnline)
  window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
})

onBeforeUnmount(() => {
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
  notificationsStore.stopBackgroundSync()
})

const hydrateCurrentUserProfile = async () => {
  if (!authStore.authToken || isLoadingCurrentUserProfile.value) {
    return
  }

  isLoadingCurrentUserProfile.value = true

  try {
    const response = await usersService.getMyProfile(authStore.authToken)
    const profileData = response.data ?? null

    if (profileData?.profile) {
      authStore.setUserProfile(profileData.profile)
    }

    if (profileData?.user?.name && !isLikelyEmail(profileData.user.name)) {
      authStore.signUpDraft.name = profileData.user.name
    }

    if (profileData?.user?.email) {
      authStore.signUpDraft.email = profileData.user.email
    }

    const currentExperience = profileData?.experiences?.find((experience) => Boolean(experience.isCurrent)) || profileData?.experiences?.[0]
    const currentTitle = currentExperience?.title?.trim()
    const currentWorkplace = currentExperience?.company?.trim()

    if (currentTitle) {
      authStore.signUpDraft.jobTitle = currentTitle
    }

    if (currentWorkplace) {
      authStore.signUpDraft.workplace = currentWorkplace
    }
  } catch {
    return
  } finally {
    isLoadingCurrentUserProfile.value = false
  }
}

watch(
  () => authStore.authToken,
  (token) => {
    if (authStore.isAuthenticated && token) {
      void hydrateCurrentUserProfile()
      notificationsStore.startBackgroundSync(token)
    } else {
      notificationsStore.reset()
    }
  },
  { immediate: true },
)

const handleMenuAction = async (action: 'logout') => {
  if (action !== 'logout') {
    return
  }

  const loadingToastId = toast.loading('Logging you out...', {
    description: 'Please wait while we clear your session.',
  })

  try {
    if (authStore.authToken) {
      await authService.logout(authStore.authToken)
    }
  } catch (error) {
    const message =
      error instanceof ApiError ? error.message : 'We could not confirm logout with the server.'

    toast.error('Logout request failed', {
      id: loadingToastId,
      description: `${message} Your local session has still been cleared.`,
    })
  } finally {
    authStore.clearAuthenticatedSession()
    socialActionsStore.reset()
    router.push('/auth/login')

    toast.success('Logged out', {
      id: loadingToastId,
      description: 'Your session has been cleared on this device.',
    })
  }
}
</script>

<template>
  <div
    :class="[
      'flex min-h-screen flex-col bg-(--app-bg) text-(--text-primary) transition-colors duration-300',
      showWorkspaceShell ? 'lg:h-screen lg:overflow-hidden' : '',
    ]"
  >
    <AppHeader
      v-if="showHeader"
      @open-sidebar="isMobileSidebarOpen = true"
      @menu-action="handleMenuAction"
      logo-src="/logo_1.svg"
      logo-alt="Skills4Export logo"
      platform-name="Skills4Export"
      :links="headerLinks"
      :notifications="notifications"
      :is-authenticated="authStore.isAuthenticated"
      :user-name="profileName"
      :user-role="profileRole"
      :user-initials="profileInitials"
      :user-image-src="profileImage"
      :user-menu="userMenu"
    />

    <main :class="[mainClasses, showHeader ? 'app-main' : 'public-main', showWorkspaceShell ? 'lg:overflow-hidden' : '']">
      <div
        v-if="showHeader"
        :class="workspaceShellClasses"
      >
        <div
          v-if="showSidebar"
          :class="
            showSidebar
              ? 'app-scroll hidden lg:block lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain'
              : 'hidden lg:block lg:-ml-2 xl:-ml-3'
          "
        >
          <div :class="showWorkspaceShell ? 'lg:pt-3' : ''">
            <AppSidebar :pinned-layout="showWorkspaceShell" />
          </div>
        </div>
        <div
          :class="
            showWorkspaceShell
              ? 'min-w-0 max-w-full overflow-x-hidden lg:app-scroll lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain'
              : 'min-w-0 w-full'
          "
        >
          <div :class="showWorkspaceShell ? 'lg:pt-3' : ''">
            <NetworkStatusCard
              v-if="showNetworkOverlay"
              class="mb-4"
              :offline="appStore.networkStatus.offline"
              :backend-unreachable="appStore.networkStatus.backendUnreachable"
              :last-issue-at="appStore.networkStatus.lastIssueAt"
              @retry="reloadCurrentRoute"
            />
            <RouterView />
          </div>
        </div>
        <div
          v-if="showRightRail"
          class="app-scroll hidden lg:block lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain"
        >
          <div class="lg:pt-3">
            <AppRightRail
              :pinned-layout="true"
              :hide-trending-questions="hideRightRailQuestions"
              :hide-adverts="hideRightRailAdverts"
            />
          </div>
        </div>
      </div>

      <RouterView v-else />
    </main>
  </div>

  <ResponsiveOverlay
    v-if="showHeader"
    v-model="isMobileSidebarOpen"
    label="Navigation"
    title="Browse the platform"
    description="Use the sidebar on mobile to move through jobs, questions, communities, and the rest of the workspace."
    max-width-class="sm:max-w-xl"
    mobile-aside
    :show-header-text="false"
  >
    <AppSidebar
      dismissible
      logo-src="/logo_1.svg"
      logo-alt="Skills4Export logo"
      @close="isMobileSidebarOpen = false"
    />
  </ResponsiveOverlay>

  <!-- Temporary API debug modal. Remove this whole overlay block after backend work is complete. -->
  <ResponsiveOverlay
    v-if="showApiDebugModal"
    v-model="appStore.apiErrorModal.open"
    label="API Error"
    :title="appStore.apiErrorModal.title"
    :description="appStore.apiErrorModal.description"
    max-width-class="sm:max-w-3xl"
  >
    <div class="space-y-4">
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-2xl bg-(--surface-secondary) p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-(--text-tertiary)">Method</p>
          <p class="mt-2 text-sm font-semibold text-(--text-primary)]">{{ appStore.apiErrorModal.method }}</p>
        </div>
        <div class="rounded-2xl bg-(--surface-secondary) p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-(--text-tertiary)">Status</p>
          <p class="mt-2 text-sm font-semibold text-(--text-primary)">{{ appStore.apiErrorModal.status }}</p>
        </div>
        <div class="rounded-2xl bg-(--surface-secondary) p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-(--text-tertiary)">URL</p>
          <p class="mt-2 break-all text-sm font-semibold text-(--text-primary)">{{ appStore.apiErrorModal.url }}</p>
        </div>
      </div>

      <div class="rounded-2xl border border-[color:var(--border-soft) bg-(--surface-secondary) p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-(--text-tertiary)]">Response / Error</p>
        <pre class="mt-3 overflow-x-auto whitespace-pre-wrap wrap-break-word text-sm leading-6 text-(--text-primary)">{{ appStore.apiErrorModal.payload }}</pre>
      </div>
    </div>
  </ResponsiveOverlay>

  <Toaster
    rich-colors
    close-button
    position="bottom-right"
    :theme="toasterTheme"
    class="skills-toaster"
    :offset="20"
    :toast-options="toasterOptions"
  />
</template>
