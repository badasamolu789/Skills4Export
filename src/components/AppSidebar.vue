<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Bell,
  Flame,
  House,
  LayoutGrid,
  Tags,
  X,
} from 'lucide-vue-next'
import { usePagesStore } from '@/stores/pages'
import { useAuthStore } from '@/stores/auth'
import { useFreelancersStore } from '@/stores/freelancers'
import { communitiesService, type CommunityRecord } from '@/services/communities'
import { isPrivateCommunity } from '@/utils/communityFilters'
import { getCommunityLineAwesomeClass } from '@/utils/communityIcon'
import { slugify } from '@/utils/slugify'

type SidebarMenuGroup = {
  label: string
  icon?: unknown
  iconClass?: string
  to: string
  target?: string
}

type SidebarLink = {
  label: string
  icon?: unknown
  iconClass?: string
  to: string
  target?: string
}

const props = withDefaults(
  defineProps<{
    dismissible?: boolean
    pinnedLayout?: boolean
    logoSrc?: string
    logoAlt?: string
  }>(),
  {
    dismissible: false,
    pinnedLayout: false,
    logoSrc: '/logo_1.svg',
    logoAlt: 'Skills4Export logo',
  },
)

const emit = defineEmits<{
  (event: 'close'): void
}>()

const trendingLinks = [
  { label: 'Latest', to: '/feed' },
  { label: 'Popular', to: '/feed' },
]

const menuGroups: SidebarMenuGroup[] = [
  {
    label: 'Jobs',
    iconClass: 'las la-industry',
    to: '/jobs/feed',
    target: '_blank',
  },
  {
    label: 'Communities',
    iconClass: 'las la-users',
    to: '/communities',
  },
  {
    label: 'Freelancers',
    iconClass: 'las la-dove',
    to: '/freelancers',
    target: '_blank',
  },
]
const createPageLink: SidebarMenuGroup = {
  label: 'Create Page',
  iconClass: 'lab la-readme',
  to: '/pages/create',
}

const footerLinks = [
  { label: 'Advertising', to: '/' },
  { label: 'Terms', to: '/terms-and-conditions' },
  { label: 'Privacy', to: '/privacy-policy' },
  { label: 'Cookie Policy', to: '/cookie-policy' },
  { label: 'Community Rules', to: '/community-regulations' },
]

const pagesStore = usePagesStore()
const authStore = useAuthStore()
const freelancersStore = useFreelancersStore()
const route = useRoute()
const sidebarCommunities = ref<CommunityRecord[]>([])
const isLoadingSidebarCommunities = ref(false)
const isJobsRoute = computed(() => route.path.startsWith('/jobs'))
const isAnswerRoute = computed(() => route.path.startsWith('/answer'))
const isFreelancersRoute = computed(() => route.path.startsWith('/freelancers'))
const activeFreelancerTab = computed(() =>
  getCurrentQueryValue('tab') === 'jobs' ? 'jobs' : 'freelancers',
)
const shouldShowDefaultSidebar = computed(
  () => !isJobsRoute.value && !isAnswerRoute.value && !isFreelancersRoute.value,
)
const homeSidebarLink = { label: 'Home', icon: House, to: '/feed' }
const jobSidebarLinks: SidebarLink[] = [
  { label: 'Jobs', iconClass: 'las la-industry', to: '/jobs/feed' },
  { label: 'Manage Jobs', iconClass: 'las la-industry', to: '/jobs' },
  { label: 'Create Alert', icon: Bell, to: '/jobs/alerts' },
]
const questionSidebarLinks: SidebarLink[] = [
  { label: 'Questions', iconClass: 'las la-question-circle', to: '/answers' },
]
const freelancerCategoryLinks = computed<SidebarLink[]>(() => {
  const filterNames = Array.from(
    new Set(
      [
        ...freelancersStore.freelancers.flatMap((freelancer) => freelancer.skills || []),
        ...freelancersStore.freelanceJobs.flatMap((job) => job.skills || []),
      ]
        .map((category) => category.trim())
        .filter(Boolean),
    ),
  )

  return filterNames
    .sort((first, second) => first.localeCompare(second))
    .map((filterName) => ({
      label: filterName.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
      icon: Tags,
      to: `/freelancers?tab=${activeFreelancerTab.value}&category=${encodeURIComponent(slugify(filterName))}`,
    }))
})
const freelancerSidebarLinks = computed<SidebarLink[]>(() => [
  { label: 'Home', icon: House, to: '/feed' },
  ...freelancerCategoryLinks.value,
])
const isLoadingFreelancerSidebar = computed(
  () =>
    isFreelancersRoute.value &&
    freelancerCategoryLinks.value.length === 0 &&
    (freelancersStore.isLoadingFreelancers || freelancersStore.isLoadingFreelanceJobs),
)
const yourPages = computed(() =>
  pagesStore.pages.map((page) => ({
    name: page.name,
    initials: page.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    to: `/pages/${page.id}`,
    avatar: page.avatar,
  })),
)
const hasYourPages = computed(() => yourPages.value.length > 0)
const getSpecialCommunityPath = (community: CommunityRecord) => {
  const name = community.name?.trim().toLowerCase()

  if (name === 'jokes') {
    return '/jokes'
  }

  if (name === 'headlines') {
    return '/headlines'
  }

  return ''
}
const sidebarCommunityLinks = computed(() =>
  sidebarCommunities.value
    .filter(
      (community) =>
        community.is_active !== 0 &&
        isPrivateCommunity(community),
    )
    .map((community) => ({
      id: community.id,
      label: community.name,
      iconClass: getCommunityLineAwesomeClass(community),
      to: getSpecialCommunityPath(community) || `/communities/${community.id}`,
      target: '_blank',
    }))
    .sort((first, second) => first.label.localeCompare(second.label)),
)
const hasPrivateCommunities = computed(() => sidebarCommunityLinks.value.length > 0)
const loadUserPages = () => {
  if (!authStore.authToken) {
    pagesStore.clearPages()
    return
  }

  void pagesStore.loadPages()
}

const loadSidebarCommunities = async () => {
  isLoadingSidebarCommunities.value = true

  try {
    const response = await communitiesService.listCommunities(
      { per_page: 100, limit: 100 },
      authStore.authToken,
    )
    sidebarCommunities.value = response.data
  } catch {
    sidebarCommunities.value = []
  } finally {
    isLoadingSidebarCommunities.value = false
  }
}

const getCurrentQueryValue = (key: string) => {
  const value = route.query[key]
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

const isRouteActive = (target: string) => {
  const [targetPath, targetQuery = ''] = target.split('?')

  if (targetQuery) {
    const params = new URLSearchParams(targetQuery)
    return route.path === targetPath &&
      Array.from(params.entries()).every(([key, value]) => getCurrentQueryValue(key) === value)
  }

  if (target === '/jobs') {
    return route.path === '/jobs'
  }

  return route.path === target || route.path.startsWith(`${target}/`)
}

const isGroupActive = (group: SidebarMenuGroup) => {
  if (group.to === '/communities') {
    return route.path === '/communities'
  }

  return group.to ? isRouteActive(group.to) : false
}

const isFeedLinkActive = (label: string) => {
  if (label === 'Latest') {
    return route.path === '/feed' && getCurrentQueryValue('feed') !== 'popular'
  }

  return route.path === '/feed' && getCurrentQueryValue('feed') === 'popular'
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

onMounted(() => {
  loadUserPages()
  void loadSidebarCommunities()
  if (isFreelancersRoute.value && !freelancersStore.freelanceJobs.length) {
    void freelancersStore.loadFreelanceJobs()
  }
  if (isFreelancersRoute.value && !freelancersStore.freelancers.length) {
    void freelancersStore.loadFreelancers()
  }
})

watch(
  () => [authStore.userId, authStore.authToken] as const,
  loadUserPages,
)

watch(
  () => authStore.authToken,
  () => {
    void loadSidebarCommunities()
  },
)

watch(isFreelancersRoute, (isActive) => {
  if (!isActive) {
    return
  }

  if (!freelancersStore.freelanceJobs.length) {
    void freelancersStore.loadFreelanceJobs()
  }
  if (!freelancersStore.freelancers.length) {
    void freelancersStore.loadFreelancers()
  }
})
</script>

<template>
  <aside
    :class="
      props.dismissible
        ? 'h-dvh max-h-dvh w-[min(19rem,calc(100vw-0.75rem))] overflow-y-auto overscroll-contain border-r border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]'
        : [
            props.pinnedLayout ? 'w-full' : 'w-full lg:w-[17rem] xl:w-[18rem]',
          ].join(' ')
    "
  >
    <div :class="props.dismissible ? '' : props.pinnedLayout ? 'h-full' : 'lg:sticky lg:top-28'">
      <div
        :class="
          props.dismissible
            ? 'h-full pr-4'
            : [
                'overflow-hidden rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]',
                props.pinnedLayout ? 'h-full' : '',
              ].join(' ')
        "
      >
        <div
          :class="
            props.dismissible
              ? 'space-y-4 p-3'
              : [
                  'space-y-4 p-3 sm:p-4',
                ].join(' ')
          "
        >
          <div v-if="props.dismissible" class="flex items-center justify-between gap-2 border-b border-[color:var(--border-soft)] pb-3">
            <RouterLink
              to="/feed"
              class="flex min-w-0 items-center"
              @click="handleNavigation"
            >
              <img loading="lazy" decoding="async"
                :src="props.logoSrc"
                :alt="props.logoAlt"
                class="h-10 w-auto object-contain"
              />
            </RouterLink>

            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
              @click="closeSidebar"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <section v-if="isJobsRoute" class="space-y-2">
            <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Jobs
            </p>
            <div class="space-y-1.5">
              <RouterLink
                :to="homeSidebarLink.to"
                :class="getTopLevelLinkClasses(isRouteActive(homeSidebarLink.to))"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.88rem] font-medium transition"
                @click="handleNavigation"
              >
                <House :class="getTopLevelIconClasses(isRouteActive(homeSidebarLink.to))" class="h-4 w-4" />
                <span :class="getTopLevelLabelClasses(isRouteActive(homeSidebarLink.to))">{{ homeSidebarLink.label }}</span>
              </RouterLink>
              <RouterLink
                v-for="item in jobSidebarLinks"
                :key="item.label"
                :to="item.to"
                :class="getTopLevelLinkClasses(isRouteActive(item.to))"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.88rem] font-medium transition"
                @click="handleNavigation"
              >
                <i
                  v-if="'iconClass' in item && item.iconClass"
                  :class="[item.iconClass, getTopLevelIconClasses(isRouteActive(item.to))]"
                  class="text-[1.05rem] leading-none"
                  aria-hidden="true"
                />
                <component
                  :is="item.icon"
                  v-else
                  :class="getTopLevelIconClasses(isRouteActive(item.to))"
                  class="h-4 w-4"
                />
                <span :class="getTopLevelLabelClasses(isRouteActive(item.to))">{{ item.label }}</span>
              </RouterLink>
            </div>
          </section>

          <section v-else-if="isAnswerRoute" class="space-y-2">
            <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Questions
            </p>
            <div class="space-y-1.5">
              <RouterLink
                :to="homeSidebarLink.to"
                :class="getTopLevelLinkClasses(isRouteActive(homeSidebarLink.to))"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.88rem] font-medium transition"
                @click="handleNavigation"
              >
                <House :class="getTopLevelIconClasses(isRouteActive(homeSidebarLink.to))" class="h-4 w-4" />
                <span :class="getTopLevelLabelClasses(isRouteActive(homeSidebarLink.to))">{{ homeSidebarLink.label }}</span>
              </RouterLink>
              <RouterLink
                v-for="item in questionSidebarLinks"
                :key="item.label"
                :to="item.to"
                :class="getTopLevelLinkClasses(isRouteActive(item.to))"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.88rem] font-medium transition"
                @click="handleNavigation"
              >
                <i
                  v-if="'iconClass' in item && item.iconClass"
                  :class="[item.iconClass, getTopLevelIconClasses(isRouteActive(item.to))]"
                  class="text-[1.05rem] leading-none"
                  aria-hidden="true"
                />
                <component
                  :is="item.icon"
                  v-else
                  :class="getTopLevelIconClasses(isRouteActive(item.to))"
                  class="h-4 w-4"
                />
                <span :class="getTopLevelLabelClasses(isRouteActive(item.to))">{{ item.label }}</span>
              </RouterLink>
            </div>
          </section>

          <section v-else-if="isFreelancersRoute" class="space-y-2">
            <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Categories
            </p>
            <div class="space-y-1.5">
              <RouterLink
                v-for="item in freelancerSidebarLinks"
                :key="item.label"
                :to="item.to"
                :class="getTopLevelLinkClasses(isRouteActive(item.to))"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.88rem] font-medium transition"
                @click="handleNavigation"
              >
                <component
                  :is="item.icon"
                  :class="getTopLevelIconClasses(isRouteActive(item.to))"
                  class="h-4 w-4"
                />
                <span :class="getTopLevelLabelClasses(isRouteActive(item.to))">{{ item.label }}</span>
              </RouterLink>
              <template v-if="isLoadingFreelancerSidebar">
                <div
                  v-for="item in 5"
                  :key="`freelancer-sidebar-skeleton-${item}`"
                  class="flex items-center gap-2 rounded-lg bg-[var(--surface-secondary)] px-3 py-2"
                  aria-hidden="true"
                >
                  <span class="h-4 w-4 shrink-0 animate-pulse rounded bg-[var(--surface-muted)]" />
                  <span class="h-3.5 animate-pulse rounded-full bg-[var(--surface-muted)]" :class="item % 2 ? 'w-28' : 'w-36'" />
                </div>
              </template>
            </div>
          </section>

          <section v-if="shouldShowDefaultSidebar" class="space-y-2">
            <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Feed
            </p>
            <nav class="space-y-1.5">
              <RouterLink
                v-for="item in trendingLinks"
                :key="item.label"
                :to="item.label === 'Latest' ? { path: '/feed', query: { feed: 'latest' } } : { path: '/feed', query: { feed: 'popular' } }"
                :class="getTopLevelLinkClasses(isFeedLinkActive(item.label))"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.88rem] font-medium transition"
                @click="handleNavigation"
              >
                <Flame :class="getTopLevelIconClasses(isFeedLinkActive(item.label))" class="h-4 w-4" />
                <span :class="getTopLevelLabelClasses(isFeedLinkActive(item.label))">{{ item.label }}</span>
              </RouterLink>
            </nav>
          </section>

          <section v-if="shouldShowDefaultSidebar" class="space-y-2 border-t border-[color:var(--border-soft)] pt-4">
            <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Browse
            </p>
            <div class="space-y-1.5">
              <template v-for="group in menuGroups" :key="group.label">
                <RouterLink
                  :to="group.to"
                  :target="group.target"
                  :rel="group.target === '_blank' ? 'noopener noreferrer' : undefined"
                  :class="getTopLevelLinkClasses(isGroupActive(group))"
                  class="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.88rem] font-medium transition"
                  @click="handleNavigation"
                >
                  <i
                    v-if="group.iconClass"
                    :class="[group.iconClass, getTopLevelIconClasses(isGroupActive(group))]"
                    class="text-[1.05rem] leading-none"
                    aria-hidden="true"
                  />
                  <component
                    :is="group.icon"
                    v-else
                    :class="getTopLevelIconClasses(isGroupActive(group))"
                    class="h-4 w-4"
                  />
                  <span :class="getTopLevelLabelClasses(isGroupActive(group))">{{ group.label }}</span>
                </RouterLink>
              </template>

            </div>
          </section>

          <section v-if="shouldShowDefaultSidebar && (isLoadingSidebarCommunities || hasPrivateCommunities)" class="space-y-2 border-t border-[color:var(--border-soft)] pt-4">
            <div class="space-y-1.5">
              <template v-if="isLoadingSidebarCommunities">
                <div
                  v-for="item in 2"
                  :key="`private-community-skeleton-${item}`"
                  class="flex items-center gap-2 rounded-lg bg-[var(--surface-secondary)] px-3 py-2"
                  aria-hidden="true"
                >
                  <span class="h-[1.05rem] w-[1.05rem] shrink-0 animate-pulse rounded bg-[var(--surface-muted)]" />
                  <span class="h-3.5 w-32 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                </div>
              </template>
              <RouterLink
                v-else
                v-for="community in sidebarCommunityLinks"
                :key="community.id"
                :to="community.to"
                :target="community.target"
                :rel="community.target === '_blank' ? 'noopener noreferrer' : undefined"
                :class="getTopLevelLinkClasses(isRouteActive(community.to))"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.88rem] font-medium transition"
                @click="handleNavigation"
              >
                <i
                  :class="[community.iconClass, getTopLevelIconClasses(isRouteActive(community.to))]"
                  class="text-[1.05rem] leading-none"
                  aria-hidden="true"
                />
                <span :class="getTopLevelLabelClasses(isRouteActive(community.to))">{{ community.label }}</span>
              </RouterLink>
            </div>
          </section>

          <section v-if="shouldShowDefaultSidebar" class="space-y-2 border-t border-[color:var(--border-soft)] pt-4">
            <RouterLink
              :to="createPageLink.to"
              :class="getTopLevelLinkClasses(isGroupActive(createPageLink))"
              class="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.88rem] font-medium transition"
              @click="handleNavigation"
            >
              <i
                :class="[createPageLink.iconClass, getTopLevelIconClasses(isGroupActive(createPageLink))]"
                class="text-[1.05rem] leading-none"
                aria-hidden="true"
              />
              <span :class="getTopLevelLabelClasses(isGroupActive(createPageLink))">
                {{ createPageLink.label }}
              </span>
            </RouterLink>
          </section>

          <section v-if="shouldShowDefaultSidebar" class="space-y-2 border-t border-[color:var(--border-soft)] pt-4">
            <div class="flex items-center gap-2">
              <LayoutGrid class="h-3.5 w-3.5 text-[var(--accent-strong)]" />
              <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Your Pages
              </p>
            </div>

            <div v-if="hasYourPages" class="space-y-1.5">
              <RouterLink
                v-for="page in yourPages"
                :key="page.name"
                :to="page.to"
                class="flex items-center gap-2 rounded-lg bg-[var(--surface-secondary)] px-3 py-2 transition hover:text-[var(--accent-strong)]"
                @click="handleNavigation"
              >
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--border-soft)] bg-white text-xs font-semibold text-[var(--accent-strong)]"
                >
                  <img
                    v-if="page.avatar"
                    :src="page.avatar"
                    :alt="page.name"
                    class="avatar-fit-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <span v-else>{{ page.initials }}</span>
                </span>
                <span class="text-[0.88rem] font-medium text-[var(--text-primary)]">{{ page.name }}</span>
              </RouterLink>
            </div>
            <p
              v-else
              class="rounded-lg border border-dashed border-[color:var(--border-soft)] px-3 py-4 text-[0.78rem] font-medium leading-5 text-[var(--text-tertiary)]"
            >
              No pages yet.
            </p>
          </section>
        </div>

        <footer class="border-t border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2.5 sm:px-4">
          <div class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.56rem] font-medium leading-4 text-[var(--text-tertiary)]">
            <RouterLink
              v-for="item in footerLinks"
              :key="item.label"
              :to="item.to"
              class="text-[0.56rem] leading-4 transition hover:text-[var(--accent-strong)]"
            >
              {{ item.label }}
            </RouterLink>
            <span class="text-[0.56rem] leading-4">|</span>
            <span class="text-[0.56rem] leading-4">© 2026 Skills4export.com</span>
          </div>
        </footer>
      </div>
    </div>
  </aside>
</template>
