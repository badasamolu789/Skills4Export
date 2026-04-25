<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { toast } from 'vue-sonner'
import AppHeader from '@/components/AppHeader.vue'
import AppRightRail from '@/components/AppRightRail.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import { ApiError } from '@/lib/api'
import { authService } from '@/services/auth'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { notifications } from '@/data/notifications'

const headerLinks = [
  { label: 'Home', to: '/feed' },
  { label: 'Ask', to: '/answer/question' },
  { label: 'Contest', to: '/referrals' },
  { label: 'Job', to: '/jobs/feed' },
  { label: 'Community', to: '/communities' },
]

const authStore = useAuthStore()
const appStore = useAppStore()
const route = useRoute()
const router = useRouter()
const isMobileSidebarOpen = ref(false)
// Temporary API debug modal toggle. Remove this with the debug modal overlay when no longer needed.
const showApiDebugModal =
  import.meta.env.VITE_SHOW_API_DEBUG_MODAL === undefined
    ? import.meta.env.DEV
    : import.meta.env.VITE_SHOW_API_DEBUG_MODAL === 'true'

const profileName = computed(() => authStore.signUpDraft.name || 'Samuel Bada')
const profileRole = computed(() => authStore.signUpDraft.headline || 'Founder account')
const profileImage = computed(() => authStore.signUpDraft.avatar || authStore.userProfile?.avatar || '')
const profileInitials = computed(() =>
  profileName.value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const userMenu = computed(() => [
  { label: 'Profile', to: '/profile' },
  { label: 'Create Alerts', to: '/jobs/alerts' },
  { label: 'Manage activities', to: '/' },
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
const currentLayout = computed(() => String(route.meta.layout ?? 'public'))
const showHeader = computed(() => currentLayout.value === 'app')
const hideSidebar = computed(() => Boolean(route.meta.hideSidebar))
const forceRightRail = computed(() => Boolean(route.meta.showRightRail))
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
    (showWorkspaceShell.value || usesWorkspaceShell.value) &&
    route.path !== '/communities' &&
    route.path !== '/settings',
)
const workspaceShellClasses = computed(() =>
  showWorkspaceShell.value
    ? [
        'flex flex-col gap-6 lg:h-[calc(100vh-theme(spacing.16))] lg:min-h-0 lg:overflow-hidden lg:grid lg:gap-5 xl:gap-6',
        showSidebar.value && showRightRail.value
          ? 'lg:grid-cols-[20rem_minmax(0,1fr)_20rem]'
          : showSidebar.value
            ? 'lg:grid-cols-[20rem_minmax(0,1fr)]'
            : showRightRail.value
              ? 'lg:grid-cols-[minmax(0,1fr)_20rem]'
              : 'lg:grid-cols-[minmax(0,1fr)]',
      ].join(' ')
    : 'flex flex-col gap-6 lg:items-start lg:gap-5',
)
const mainClasses = computed(() =>
  showHeader.value
    ? [
        'mx-auto w-full max-w-[96rem] flex-1 px-4 py-5 sm:px-6 sm:py-6 xl:px-8',
        showWorkspaceShell.value ? 'lg:px-6 lg:pt-0 lg:pb-8' : 'lg:px-6 lg:py-8',
      ].join(' ')
    : 'mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10',
)

watch(
  () => route.fullPath,
  () => {
    isMobileSidebarOpen.value = false
  },
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

    <main :class="[mainClasses, showWorkspaceShell ? 'lg:overflow-hidden' : '']">
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
          <div :class="showWorkspaceShell ? 'lg:pt-4' : ''">
            <AppSidebar :pinned-layout="showWorkspaceShell" />
          </div>
        </div>
        <div
          :class="
            showWorkspaceShell
              ? 'min-w-0 lg:app-scroll lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain'
              : 'min-w-0 w-full'
          "
        >
          <div :class="showWorkspaceShell ? 'lg:pt-4' : ''">
            <RouterView />
          </div>
        </div>
        <div
          v-if="showRightRail"
          class="app-scroll hidden lg:block lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain"
        >
          <div class="lg:pt-4">
            <AppRightRail :pinned-layout="true" />
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
    position="top-right"
    :theme="toasterTheme"
    class="skills-toaster"
    :offset="20"
    :toast-options="toasterOptions"
  />
</template>
