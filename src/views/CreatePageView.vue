<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Building2, GraduationCap, Loader2, Plus, Search } from 'lucide-vue-next'
import { ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth'
import { usePagesStore, type PageCategory } from '@/stores/pages'
import { slugify } from '@/utils/slugify'

const router = useRouter()
const authStore = useAuthStore()
const pagesStore = usePagesStore()

const pageTypes: Array<{ label: string; value: PageCategory; icon: unknown; description: string }> = [
  {
    label: 'Business page',
    value: 'business',
    icon: Building2,
    description: 'For companies, services, organizations, and professional brands.',
  },
  {
    label: 'Student page',
    value: 'student',
    icon: GraduationCap,
    description: 'For student communities, learning projects, and academic visibility.',
  },
]

const form = ref({
  pageType: 'business' as PageCategory,
  name: '',
  slug: '',
  description: '',
})
const searchQuery = ref('')
const isSubmitting = ref(false)
const hasEditedSlug = ref(false)

const filteredPages = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return pagesStore.pages
  }

  return pagesStore.pages.filter((page) =>
    [page.name, page.slug, page.description, page.category].some((value) =>
      String(value || '').toLowerCase().includes(query),
    ),
  )
})

watch(
  () => form.value.name,
  (name) => {
    if (!hasEditedSlug.value) {
      form.value.slug = slugify(name)
    }
  },
)

const submitPage = async () => {
  if (isSubmitting.value) {
    return
  }

  const slug = slugify(form.value.slug || form.value.name)

  if (!form.value.name.trim() || !slug) {
    toast.error('Add a page name first.')
    return
  }

  if (!authStore.authToken) {
    toast.error('Sign in required', {
      description: 'Please sign in again before creating a page.',
    })
    return
  }

  isSubmitting.value = true

  try {
    const page = await pagesStore.createPageFromApi({
      name: form.value.name.trim(),
      slug,
      description: form.value.description.trim(),
      metadata: {
        pageType: form.value.pageType,
        theme: form.value.pageType,
      },
    })

    toast.success('Page created', {
      description: `${page.name} is ready to manage.`,
    })

    router.push(`/pages/${page.slug}`)
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to create this page.'
    toast.error('Page creation failed', { description: message })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  void pagesStore.loadPages()
})
</script>

<template>
  <section class="space-y-6 px-1">
    <div class="space-y-3">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">Create page</span>
      </div>

      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-[1.7rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[2.1rem]">
            Create a page
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            Set up a public page using the fields supported by the current Pages API.
          </p>
        </div>
        <label class="flex h-11 items-center gap-2 rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-[var(--text-secondary)] shadow-[var(--shadow-soft)] lg:w-80">
          <Search class="h-4 w-4 text-[var(--text-tertiary)]" />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search your pages"
            class="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          />
        </label>
      </div>
    </div>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
      <form
        class="rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)] sm:p-6"
        @submit.prevent="submitPage"
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <button
            v-for="item in pageTypes"
            :key="item.value"
            type="button"
            class="rounded-[1rem] border p-4 text-left transition"
            :class="
              form.pageType === item.value
                ? 'border-[color:var(--accent)] bg-[var(--surface-secondary)] text-[var(--text-primary)]'
                : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:border-[color:var(--accent-soft)]'
            "
            @click="form.pageType = item.value"
          >
            <component :is="item.icon" class="h-5 w-5 text-[var(--accent-strong)]" />
            <p class="mt-3 text-sm font-semibold">{{ item.label }}</p>
            <p class="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{{ item.description }}</p>
          </button>
        </div>

        <div class="mt-5 grid gap-4">
          <label>
            <span class="text-sm font-semibold text-[var(--text-primary)]">Page name</span>
            <input
              v-model="form.name"
              class="mt-2 h-11 w-full rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)]"
              placeholder="My Page"
            />
          </label>

          <label>
            <span class="text-sm font-semibold text-[var(--text-primary)]">Slug</span>
            <input
              v-model="form.slug"
              class="mt-2 h-11 w-full rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)]"
              placeholder="my-page"
              @input="hasEditedSlug = true"
            />
          </label>

          <label>
            <span class="text-sm font-semibold text-[var(--text-primary)]">Description</span>
            <textarea
              v-model="form.description"
              rows="5"
              class="mt-2 w-full rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)]"
              placeholder="A public page"
            />
          </label>
        </div>

        <div class="mt-5 flex justify-end">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-[0.9rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
          >
            <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
            <Plus v-else class="h-4 w-4" />
            {{ isSubmitting ? 'Creating...' : 'Create page' }}
          </button>
        </div>
      </form>

      <aside class="rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-semibold text-[var(--text-primary)]">Your pages</h2>
          <span class="rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
            {{ pagesStore.isLoadingPages ? '...' : filteredPages.length }}
          </span>
        </div>

        <div class="mt-4 space-y-3">
          <article
            v-if="pagesStore.isLoadingPages"
            v-for="item in 3"
            :key="`page-skeleton-${item}`"
            class="animate-pulse rounded-[0.95rem] bg-[var(--surface-secondary)] p-4"
          >
            <div class="h-4 w-2/3 rounded-full bg-[var(--surface-primary)]" />
            <div class="mt-3 h-3 w-full rounded-full bg-[var(--surface-primary)]" />
          </article>

          <RouterLink
            v-if="!pagesStore.isLoadingPages"
            v-for="page in filteredPages"
            :key="page.id"
            :to="`/pages/${page.slug}`"
            class="block rounded-[0.95rem] bg-[var(--surface-secondary)] p-4 transition hover:text-[var(--accent-strong)]"
          >
            <p class="text-sm font-semibold text-[var(--text-primary)]">{{ page.name }}</p>
            <p class="mt-1 text-xs text-[var(--text-secondary)]">/pages/{{ page.slug }}</p>
          </RouterLink>

          <article
            v-if="!pagesStore.isLoadingPages && filteredPages.length === 0"
            class="rounded-[0.95rem] border border-dashed border-[color:var(--border-soft)] p-4 text-center"
          >
            <p class="text-sm font-semibold text-[var(--text-primary)]">
              {{ pagesStore.pagesError ? 'Pages could not be loaded.' : searchQuery ? 'No pages match your search.' : 'No pages yet.' }}
            </p>
            <p class="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
              {{ pagesStore.pagesError || 'Create your first page and it will appear here.' }}
            </p>
          </article>
        </div>
      </aside>
    </div>
  </section>
</template>
