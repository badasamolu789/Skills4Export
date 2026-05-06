<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Copy,
  FilePenLine,
  GraduationCap,
  Megaphone,
  Rocket,
  Settings2,
  Users,
} from 'lucide-vue-next'
import type { ManagedPage } from '@/stores/pages'
import { usePagesStore } from '@/stores/pages'

const route = useRoute()
const pagesStore = usePagesStore()

const page = computed(() => pagesStore.getPageBySlug(String(route.params.slug)))

const categoryCopy: Record<ManagedPage['category'], { label: string; icon: unknown; summary: string }> = {
  student: {
    label: 'Student page',
    icon: GraduationCap,
    summary: 'Designed for learning communities, student-led initiatives, and academic visibility.',
  },
  business: {
    label: 'Business page',
    icon: BriefcaseBusiness,
    summary: 'Designed for organizations, service brands, and growth-focused company profiles.',
  },
}

const stats = computed(() => {
  if (!page.value) {
    return []
  }

  return [
    { label: 'Followers', value: page.value.followers, icon: Users },
    { label: 'Posts', value: page.value.posts, icon: Megaphone },
    { label: 'Leads', value: page.value.leads, icon: BarChart3 },
  ]
})

const managementActions = computed(() => {
  if (!page.value) {
    return []
  }

  return [
    {
      title: 'Edit page information',
      description: 'Update the page name, category, and description whenever your positioning changes.',
      icon: FilePenLine,
    },
    {
      title: 'Share page',
      description: 'Promote the page across your network to attract more followers and visitors.',
      icon: Copy,
    },
    {
      title: 'Publish updates',
      description: 'Use the page as a base for announcements, opportunities, and program highlights.',
      icon: Rocket,
    },
    {
      title: 'Manage settings',
      description: 'Control visibility, ownership, and the overall setup status of the page.',
      icon: Settings2,
    },
  ]
})
</script>

<template>
  <section v-if="page" class="space-y-6">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/pages/create" class="transition hover:text-[var(--accent-strong)]">Pages</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">{{ page.name }}</span>
      </div>

      <div>
        <h1 class="text-[1.7rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[2.1rem]">
          {{ page.name }}
        </h1>
        <p class="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          Central management for your page. This is where page actions, visibility checks, and growth signals can be handled.
        </p>
      </div>
    </div>

    <section class="overflow-hidden rounded-[1.55rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
      <div class="bg-[linear-gradient(135deg,#e8e9ff,#fef3c7)] p-5 sm:p-6">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div class="flex items-start gap-4">
            <span class="inline-flex h-18 w-18 items-center justify-center rounded-[1.65rem] bg-[var(--surface-primary)] text-[var(--accent-strong)] shadow-[var(--shadow-soft)]">
              <component :is="categoryCopy[page.category].icon" class="h-8 w-8" />
            </span>

            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center rounded-full bg-[var(--surface-primary)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                  {{ categoryCopy[page.category].label }}
                </span>
                <span class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
                  {{ page.status }}
                </span>
              </div>

              <p class="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                {{ page.description }}
              </p>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            >
              Share page
            </button>
            <RouterLink
              to="/pages/create"
              class="inline-flex items-center justify-center rounded-[1rem] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              Create another page
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="grid gap-4 border-t border-[color:var(--border-soft)] p-5 sm:grid-cols-3 sm:p-6">
        <article
          v-for="item in stats"
          :key="item.label"
          class="rounded-[1.15rem] bg-[var(--surface-secondary)] p-4"
        >
          <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            <component :is="item.icon" class="h-4 w-4 text-[var(--accent-strong)]" />
            <span>{{ item.label }}</span>
          </div>
          <p class="mt-3 text-2xl font-semibold text-[var(--text-primary)]">{{ item.value }}</p>
        </article>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.85fr)]">
      <div class="space-y-6">
        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center gap-3">
            <BadgeCheck class="h-5 w-5 text-[var(--accent-strong)]" />
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Page overview</h2>
          </div>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <article class="rounded-[1rem] bg-[var(--surface-secondary)] p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Category</p>
              <p class="mt-2 text-base font-semibold text-[var(--text-primary)]">{{ categoryCopy[page.category].label }}</p>
              <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{{ categoryCopy[page.category].summary }}</p>
            </article>
            <article class="rounded-[1rem] bg-[var(--surface-secondary)] p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Readiness</p>
              <p class="mt-2 text-base font-semibold text-[var(--text-primary)]">{{ page.completion }}% complete</p>
              <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">This page has the core setup in place and is ready for more content and audience growth.</p>
            </article>
          </div>
        </section>

        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <h2 class="text-xl font-semibold text-[var(--text-primary)]">Page actions</h2>
          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <article
              v-for="action in managementActions"
              :key="action.title"
              class="rounded-[1.1rem] bg-[var(--surface-secondary)] p-4"
            >
              <component :is="action.icon" class="h-5 w-5 text-[var(--accent-strong)]" />
              <h3 class="mt-4 text-base font-semibold text-[var(--text-primary)]">{{ action.title }}</h3>
              <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{{ action.description }}</p>
            </article>
          </div>
        </section>
      </div>

      <aside class="space-y-6">
        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Page timeline</h2>
          <div class="mt-5 space-y-3 text-sm text-[var(--text-secondary)]">
            <article class="rounded-[1rem] bg-[var(--surface-secondary)] p-4">
              <p class="font-semibold text-[var(--text-primary)]">Created</p>
              <p class="mt-1">{{ new Date(page.createdAt).toLocaleDateString() }}</p>
            </article>
            <article class="rounded-[1rem] bg-[var(--surface-secondary)] p-4">
              <p class="font-semibold text-[var(--text-primary)]">Last updated</p>
              <p class="mt-1">{{ new Date(page.updatedAt).toLocaleDateString() }}</p>
            </article>
            <article class="rounded-[1rem] bg-[var(--surface-secondary)] p-4">
              <p class="font-semibold text-[var(--text-primary)]">Page slug</p>
              <p class="mt-1 break-all">/pages/{{ page.slug }}</p>
            </article>
          </div>
        </section>

        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Suggested next steps</h2>
          <div class="mt-5 space-y-3">
            <article class="rounded-[1rem] bg-[var(--surface-secondary)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
              Upload a branded cover and profile image when media support is added.
            </article>
            <article class="rounded-[1rem] bg-[var(--surface-secondary)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
              Publish the first update so visitors know the page is active.
            </article>
            <article class="rounded-[1rem] bg-[var(--surface-secondary)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
              Invite collaborators or followers to start building traction.
            </article>
          </div>
        </section>
      </aside>
    </div>
  </section>

  <section v-else class="rounded-[1.35rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-soft)]">
    <h1 class="text-xl font-semibold text-[var(--text-primary)]">Page not found</h1>
    <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
      The page you opened is not available right now. You can create a fresh one instead.
    </p>
    <RouterLink
      to="/pages/create"
      class="mt-5 inline-flex items-center justify-center rounded-[1rem] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
    >
      Create page
    </RouterLink>
  </section>
</template>
