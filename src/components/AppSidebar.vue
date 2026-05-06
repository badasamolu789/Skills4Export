<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  BriefcaseBusiness,
  Bell,
  Compass,
  BookOpen,
  Check,
  FlaskConical,
  Flame,
  Globe2,
  Hammer,
  House,
  Laptop,
  LayoutGrid,
  MessageSquareMore,
  Paintbrush,
  PenLine,
  PlusSquare,
  Puzzle,
  Users,
  X,
} from 'lucide-vue-next'
import { usePagesStore } from '@/stores/pages'

type SidebarMenuGroup = {
  label: string
  icon: unknown
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
  { label: 'Popular', to: '/feed' },
  { label: 'Latest', to: '/feed' },
]

const menuGroups: SidebarMenuGroup[] = [
  {
    label: 'Jobs',
    icon: BriefcaseBusiness,
    to: '/jobs/feed',
    target: '_blank',
  },
  {
    label: 'Answer',
    icon: MessageSquareMore,
    to: '/answer/question',
    target: '_blank',
  },
  {
    label: 'Communities',
    icon: Compass,
    to: '/communities',
  },
  {
    label: 'Freelancers',
    icon: Users,
    to: '/freelancers',
    target: '_blank',
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
const latestLinkTarget = computed(() => ({ path: '/feed', query: { feed: 'latest' } }))
const isJobsRoute = computed(() => route.path.startsWith('/jobs'))
const isAnswerRoute = computed(() => route.path.startsWith('/answer'))
const isFreelancersRoute = computed(() => route.path.startsWith('/freelancers'))
const shouldShowDefaultSidebar = computed(
  () => !isJobsRoute.value && !isAnswerRoute.value && !isFreelancersRoute.value,
)
const homeSidebarLink = { label: 'Home', icon: House, to: '/feed' }
const jobSidebarLinks = [
  { label: 'Jobs', icon: BriefcaseBusiness, to: '/jobs/feed' },
  { label: 'Manage Jobs', icon: BriefcaseBusiness, to: '/jobs' },
  { label: 'Create Alert', icon: Bell, to: '/jobs/alerts' },
]
const freelancerSidebarLinks = [
  { label: 'Home', icon: House, to: '/freelancers' },
  { label: 'Writing', icon: FlaskConical, to: '/freelancers?category=writing' },
  { label: 'Book editing', icon: PenLine, to: '/freelancers?category=book-editing' },
  { label: 'Article writing', icon: Globe2, to: '/freelancers?category=article-writing' },
  { label: 'Digital marketing', icon: BookOpen, to: '/freelancers?category=digital-marketing' },
  { label: 'content writers', icon: Laptop, to: '/freelancers?category=content-writers' },
  { label: 'Web designers', icon: Hammer, to: '/freelancers?category=web-designers' },
  { label: 'Graphic designers', icon: Paintbrush, to: '/freelancers?category=graphic-designers' },
  { label: 'Software developers', icon: BriefcaseBusiness, to: '/freelancers?category=software-developers' },
  { label: 'Mobile app developers', icon: LayoutGrid, to: '/freelancers?category=mobile-app-developers' },
  { label: 'Wordpress developers', icon: Puzzle, to: '/freelancers?category=wordpress-developers' },
  { label: 'Data entry operators', icon: Check, to: '/freelancers?category=data-entry-operators' },
]
const questionSidebarLinks = [
  { label: 'Questions', icon: MessageSquareMore, to: '/answer/question' },
]
const yourPages = computed(() =>
  pagesStore.pages.map((page) => ({
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
const hasYourPages = computed(() => yourPages.value.length > 0)

const getCurrentQueryValue = (key: string) => {
  const value = route.query[key]
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

const isRouteActive = (target: string) => {
  const [targetPath, targetQuery = ''] = target.split('?')

  if (targetQuery) {
    const params = new URLSearchParams(targetQuery)
    const category = params.get('category') ?? ''

    return route.path === targetPath && getCurrentQueryValue('category') === category
  }

  if (target === '/jobs') {
    return route.path === '/jobs'
  }

  return route.path === target || route.path.startsWith(`${target}/`)
}

const isGroupActive = (group: SidebarMenuGroup) => {
  return group.to ? isRouteActive(group.to) : false
}

const isFeedLinkActive = (label: string) => {
  if (label === 'Latest') {
    return route.path === '/feed' && getCurrentQueryValue('feed') === 'latest'
  }

  return route.path === '/feed' && getCurrentQueryValue('feed') !== 'latest'
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
              <img
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
                <component
                  :is="item.icon"
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
                <component
                  :is="item.icon"
                  :class="getTopLevelIconClasses(isRouteActive(item.to))"
                  class="h-4 w-4"
                />
                <span :class="getTopLevelLabelClasses(isRouteActive(item.to))">{{ item.label }}</span>
              </RouterLink>
            </div>
          </section>

          <section v-else-if="isFreelancersRoute" class="space-y-2">
            <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Freelancers
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
                :to="item.label === 'Latest' ? latestLinkTarget : item.to"
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
              <RouterLink
                v-for="group in menuGroups"
                :key="group.label"
                :to="group.to"
                :target="group.target"
                :rel="group.target === '_blank' ? 'noopener noreferrer' : undefined"
                :class="getTopLevelLinkClasses(isGroupActive(group))"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.88rem] font-medium transition"
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
                  class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white"
                >
                  {{ page.initials }}
                </span>
                <span class="text-[0.88rem] font-medium text-[var(--text-primary)]">{{ page.name }}</span>
              </RouterLink>
            </div>
            <RouterLink
              v-else
              to="/pages/create"
              class="block rounded-lg bg-[var(--surface-secondary)] px-3 py-2 text-[0.78rem] font-medium leading-5 text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
              @click="handleNavigation"
            >
              Create your first page
            </RouterLink>
          </section>
        </div>

        <footer class="border-t border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2.5 sm:px-4">
          <div class="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[0.56rem] font-medium leading-4 text-[var(--text-tertiary)]">
            <RouterLink
              v-for="item in footerLinks"
              :key="item"
              to="/"
              class="text-[0.56rem] leading-4 transition hover:text-[var(--accent-strong)]"
            >
              {{ item }}
            </RouterLink>
            <span class="text-[0.56rem] leading-4">|</span>
            <span class="text-[0.56rem] leading-4">© 2026 Skills4export.com</span>
          </div>
        </footer>
      </div>
    </div>
  </aside>
</template>
