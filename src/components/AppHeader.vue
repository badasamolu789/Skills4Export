<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleUserRound,
  House,
  LayoutGrid,
  Menu,
  MessageSquareMore,
  Search,
  Trophy,
  Users,
  X,
} from 'lucide-vue-next'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import type { NotificationItem } from '@/data/notifications'

type HeaderLink = {
  label: string
  to: string
}

type MenuItem = {
  label: string
  to: string
  action?: 'logout'
}

const props = withDefaults(
  defineProps<{
    logoSrc: string
    logoAlt?: string
    platformName: string
    links: HeaderLink[]
    searchPlaceholder?: string
    notifications: NotificationItem[]
    isAuthenticated?: boolean
    userName: string
    userRole?: string
    userInitials: string
    userImageSrc?: string
    userMenu: MenuItem[]
  }>(),
  {
    logoAlt: 'Platform logo',
    searchPlaceholder: 'Search communities, questions, jobs, and updates',
    isAuthenticated: true,
    userRole: 'Community member',
  },
)

const emit = defineEmits<{
  (event: 'open-sidebar'): void
  (event: 'menu-action', action: 'logout'): void
}>()

const isNotificationsOpen = ref(false)
const isUserMenuOpen = ref(false)
const unreadCount = computed(() => props.notifications.filter((item) => item.unread).length)

const iconByLink = {
  Home: House,
  Ask: MessageSquareMore,
  Contest: Trophy,
  Job: BriefcaseBusiness,
  Community: Users,
} as const

const openNotifications = () => {
  isNotificationsOpen.value = true
  isUserMenuOpen.value = false
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
  isNotificationsOpen.value = false
}

const openMobileMenu = () => {
  emit('open-sidebar')
  isUserMenuOpen.value = false
}

const handleMenuItemClick = (item: MenuItem) => {
  isUserMenuOpen.value = false

  if (item.action) {
    emit('menu-action', item.action)
  }
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-(--border-soft) bg-(--header-bg)">
    <div class="px-4 py-3 sm:px-5 lg:px-6">
      <div class="relative flex items-center justify-between gap-3 md:hidden">
        <RouterLink to="/" class="flex items-center justify-center">
          <img
            :src="logoSrc"
            :alt="logoAlt"
            class="h-[4.1rem] w-auto object-contain"
          />
        </RouterLink>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            aria-label="Open menu"
            title="Open menu"
            @click="openMobileMenu"
          >
            <Menu class="h-5 w-5" />
          </button>

          <RouterLink
            to="/mobile/notifications"
            class="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            aria-label="Open notifications"
            title="Open notifications"
          >
            <Bell class="h-5 w-5" />
            <span
              v-if="unreadCount"
              class="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white"
            >
              {{ unreadCount }}
            </span>
          </RouterLink>

          <RouterLink
            to="/mobile/search"
            class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--search-bg)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            :aria-label="searchPlaceholder"
            :title="searchPlaceholder"
          >
            <Search class="h-4 w-4 text-[var(--text-tertiary)]" />
          </RouterLink>
        </div>
      </div>

      <div class="mt-3 grid grid-cols-5 gap-2 md:hidden">
        <RouterLink
          v-for="link in links"
          :key="link.label"
          :to="link.to"
          class="flex min-h-14 items-center justify-center rounded-[1rem] bg-[var(--surface-secondary)] px-2 py-3 text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
          :aria-label="link.label"
          :title="link.label"
        >
          <component
            :is="iconByLink[link.label as keyof typeof iconByLink] || LayoutGrid"
            class="h-5 w-5 stroke-[2]"
          />
        </RouterLink>
      </div>

      <div class="relative hidden items-center justify-between md:flex">
        <RouterLink to="/" class="flex items-center justify-center">
          <img
            :src="logoSrc"
            :alt="logoAlt"
            class="h-[4.4rem] w-auto object-contain sm:h-21 lg:h-14"
          />
        </RouterLink>

        <nav class="absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 md:flex lg:gap-5">
          <RouterLink
            v-for="link in links"
            :key="link.label"
            :to="link.to"
            class="flex h-14 w-14 items-center justify-center text-[var(--text-secondary)] transition hover:text-[var(--accent)]"
            :aria-label="link.label"
            :title="link.label"
          >
            <component
              :is="iconByLink[link.label as keyof typeof iconByLink] || LayoutGrid"
              class="h-[1.35rem] w-[1.35rem] stroke-[1.8]"
            />
          </RouterLink>
        </nav>

        <div class="ml-auto hidden items-center gap-3 md:flex">
          <label
            class="flex h-12 w-[13.5rem] items-center gap-3 rounded-full bg-[var(--search-bg)] px-4 text-[var(--text-secondary)] lg:w-[15.5rem]"
          >
            <Search class="h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              type="search"
              :placeholder="searchPlaceholder"
              class="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </label>

          <button
            type="button"
            class="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="openNotifications"
          >
            <Bell class="h-5 w-5" />
            <span
              v-if="unreadCount"
              class="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white"
            >
              {{ unreadCount }}
            </span>
          </button>

          <div class="relative">
            <button
              type="button"
              class="relative flex items-center rounded-full bg-[var(--surface-secondary)] p-1.5 transition"
              @click="toggleUserMenu"
            >
              <span
                v-if="props.isAuthenticated && !userImageSrc"
                class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white"
              >
                {{ userInitials }}
              </span>
              <img
                v-else-if="props.isAuthenticated && userImageSrc"
                :src="userImageSrc"
                :alt="userName"
                class="h-10 w-10 rounded-full object-cover"
              />
              <span
                v-else
                class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-primary)] text-[var(--text-secondary)]"
              >
                <CircleUserRound class="h-5 w-5" />
              </span>
              <span
                v-if="props.isAuthenticated"
                class="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-[var(--surface-primary)] bg-green-500"
              />
            </button>

            <div
              v-if="isUserMenuOpen"
              class="absolute right-0 top-[calc(100%+0.75rem)] w-72 rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-elevated)]"
            >
              <div class="flex items-start justify-between gap-3 rounded-[1.25rem] bg-[var(--surface-muted)] p-4">
                <div class="flex min-w-0 items-center gap-3">
                  <span
                    v-if="props.isAuthenticated && !userImageSrc"
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white"
                  >
                    {{ userInitials }}
                  </span>
                  <img
                    v-else-if="props.isAuthenticated && userImageSrc"
                    :src="userImageSrc"
                    :alt="userName"
                    class="h-12 w-12 rounded-full object-cover"
                  />
                  <span
                    v-else
                    class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-primary)] text-[var(--text-secondary)]"
                  >
                    <CircleUserRound class="h-6 w-6" />
                  </span>

                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {{ props.isAuthenticated ? userName : 'Guest user' }}
                    </p>
                    <p class="mt-1 truncate text-xs text-[var(--text-tertiary)]">
                      {{
                        props.isAuthenticated
                          ? userRole
                          : 'Log in to personalize your profile, alerts, and activities.'
                      }}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                  aria-label="Close user menu"
                  @click="isUserMenuOpen = false"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>

              <div class="mt-3 space-y-1">
                <RouterLink
                  v-for="item in userMenu"
                  :key="item.label"
                  :to="item.to"
                  class="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--accent-strong)]"
                  @click="handleMenuItemClick(item)"
                >
                  <span>{{ item.label }}</span>
                  <ChevronDown class="h-4 w-4 -rotate-90" />
                </RouterLink>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <ResponsiveOverlay
      v-model="isNotificationsOpen"
      label="Notifications"
      title="Recent activity"
      description="Important updates, community mentions, and alerts will show here."
      max-width-class="sm:max-w-2xl"
    >
      <div class="space-y-3">
        <article
          v-for="item in notifications"
          :key="item.id"
          class="rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <p class="text-sm font-semibold text-[var(--text-primary)]">{{ item.title }}</p>
              <p class="text-sm leading-7 text-[var(--text-secondary)]">{{ item.description }}</p>
            </div>
            <span
              v-if="item.unread"
              class="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[var(--danger)]"
            />
          </div>
          <p class="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            {{ item.time }}
          </p>
        </article>
      </div>
    </ResponsiveOverlay>

  </header>
</template>
