<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  BriefcaseBusiness,
  Compass,
  Flame,
  Laugh,
  LayoutGrid,
  MessageSquareMore,
  PlusSquare,
  Sparkles,
  Trophy,
  X,
} from 'lucide-vue-next'
import { usePagesStore } from '@/stores/pages'

type SidebarMenuGroup = {
  label: string
  icon: unknown
  to: string
}

const props = withDefaults(
  defineProps<{
    dismissible?: boolean
    pinnedLayout?: boolean
  }>(),
  {
    dismissible: false,
    pinnedLayout: false,
  },
)

const emit = defineEmits<{
  (event: 'close'): void
}>()

const trendingLinks = [
  { label: 'Popular', to: '/' },
  { label: 'Latest', to: '/' },
]

const menuGroups: SidebarMenuGroup[] = [
  {
    label: 'Jobs',
    icon: BriefcaseBusiness,
    to: '/jobs/feed',
  },
  {
    label: 'Answer',
    icon: MessageSquareMore,
    to: '/answer/question',
  },
  {
    label: 'Contests',
    icon: Trophy,
    to: '/contests',
  },
  {
    label: 'Explore Communities',
    icon: Compass,
    to: '/communities',
  },
  {
    label: 'Freelancers',
    icon: Sparkles,
    to: '/freelancers',
  },
  {
    label: 'Jokes',
    icon: Laugh,
    to: '/jokes',
  },
  {
    label: 'Create Page',
    icon: PlusSquare,
    to: '/pages/create',
  },
]

const footerLinks = [
  'Advertising',
  'Terms',
  'Privacy',
  'Cookie Policy',
  'Community Rules',
]

const pagesStore = usePagesStore()
const route = useRoute()
const latestLinkTarget = computed(() => ({ path: '/', query: { feed: 'latest' } }))
const yourPages = computed(() =>
  pagesStore.pages.slice(0, 5).map((page) => ({
    name: page.name,
    initials: page.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    to: `/pages/${page.slug}`,
  })),
)

const getCurrentQueryValue = (key: string) => {
  const value = route.query[key]
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

const isPlaceholderTarget = (target: string) => target === '/'

const isRouteActive = (target: string) => {
  if (isPlaceholderTarget(target)) {
    return false
  }

  return route.path === target || route.path.startsWith(`${target}/`)
}

const isGroupActive = (group: SidebarMenuGroup) => {
  return group.to ? isRouteActive(group.to) : false
}

const isFeedLinkActive = (label: string) => {
  if (label === 'Latest') {
    return route.path === '/' && getCurrentQueryValue('feed') === 'latest'
  }

  return route.path === '/' && getCurrentQueryValue('feed') !== 'latest'
}

const getTopLevelLinkClasses = (isActive: boolean) =>
  isActive
    ? 'bg-[var(--accent)] text-white shadow-[var(--shadow-soft)]'
    : 'bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:text-[var(--accent-strong)]'

const getTopLevelIconClasses = (isActive: boolean) =>
  isActive ? 'text-white' : 'text-[var(--accent-strong)]'

const getTopLevelLabelClasses = (isActive: boolean) =>
  isActive ? 'text-white' : 'text-inherit'

const closeSidebar = () => {
  emit('close')
}

const handleNavigation = () => {
  if (props.dismissible) {
    closeSidebar()
  }
}
</script>

<template>
  <aside
    :class="
      props.dismissible
        ? 'h-dvh max-h-dvh w-[min(22rem,calc(100vw-0.75rem))] overflow-y-auto overscroll-contain border-r border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]'
        : [
            props.pinnedLayout ? 'w-80' : 'w-full lg:w-[19rem] xl:w-[20rem]',
          ].join(' ')
    "
  >
    <div :class="props.dismissible ? '' : props.pinnedLayout ? 'h-full' : 'lg:sticky lg:top-28'">
      <div
        :class="
          props.dismissible
            ? 'h-full pr-4'
            : [
                'overflow-hidden rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]',
                props.pinnedLayout ? 'h-full' : '',
              ].join(' ')
        "
      >
        <div
          :class="
            props.dismissible
              ? 'space-y-6 p-4'
              : [
                  'space-y-6 p-4 sm:p-5',
                ].join(' ')
          "
        >
          <div v-if="props.dismissible" class="flex justify-end border-b border-[color:var(--border-soft)] pb-4">
            <button
              type="button"
              class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
              @click="closeSidebar"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <section class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Feed
            </p>
            <nav class="space-y-2">
              <RouterLink
                v-for="item in trendingLinks"
                :key="item.label"
                :to="item.label === 'Latest' ? latestLinkTarget : item.to"
                :class="getTopLevelLinkClasses(isFeedLinkActive(item.label))"
                class="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition"
                @click="handleNavigation"
              >
                <Flame :class="getTopLevelIconClasses(isFeedLinkActive(item.label))" class="h-4 w-4" />
                <span :class="getTopLevelLabelClasses(isFeedLinkActive(item.label))">{{ item.label }}</span>
              </RouterLink>
            </nav>
          </section>

          <section class="space-y-3 border-t border-[color:var(--border-soft)] pt-6">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
              Browse
            </p>
            <div class="space-y-2">
              <RouterLink
                v-for="group in menuGroups"
                :key="group.label"
                :to="group.to"
                :class="getTopLevelLinkClasses(isGroupActive(group))"
                class="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition"
                @click="handleNavigation"
              >
                <component
                  :is="group.icon"
                  :class="getTopLevelIconClasses(isGroupActive(group))"
                  class="h-4 w-4"
                />
                <span :class="getTopLevelLabelClasses(isGroupActive(group))">{{ group.label }}</span>
              </RouterLink>
            </div>
          </section>

          <section class="space-y-3 border-t border-[color:var(--border-soft)] pt-6">
            <div class="flex items-center gap-2">
              <LayoutGrid class="h-4 w-4 text-[var(--accent-strong)]" />
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                Your Page
              </p>
            </div>

            <div class="space-y-2">
              <RouterLink
                v-for="page in yourPages"
                :key="page.name"
                :to="page.to"
                class="flex items-center gap-3 rounded-xl bg-[var(--surface-secondary)] px-4 py-3 transition hover:text-[var(--accent-strong)]"
                @click="handleNavigation"
              >
                <span
                  class="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-semibold text-white"
                >
                  {{ page.initials }}
                </span>
                <span class="text-base font-medium text-[var(--text-primary)]">{{ page.name }}</span>
              </RouterLink>
            </div>
          </section>
        </div>

        <footer class="border-t border-[color:var(--border-soft)] px-4 py-4 sm:px-5">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-6 text-[var(--text-tertiary)]">
            <RouterLink
              v-for="item in footerLinks"
              :key="item"
              to="/"
              class="transition hover:text-[var(--accent-strong)]"
            >
              {{ item }}
            </RouterLink>
            <span>|</span>
            <span>© 2026 Skills4export.com</span>
          </div>
        </footer>
      </div>
    </div>
  </aside>
</template>
