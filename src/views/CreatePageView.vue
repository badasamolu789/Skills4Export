<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Building2, FileText, GraduationCap, LayoutTemplate, Sparkles } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { PageCategory } from '@/stores/pages'
import { usePagesStore } from '@/stores/pages'

const router = useRouter()
const pagesStore = usePagesStore()

const form = reactive({
  name: '',
  category: 'student' as PageCategory,
  description: '',
})

const categoryOptions: Array<{
  value: PageCategory
  label: string
  description: string
  icon: unknown
}> = [
  {
    value: 'student',
    label: 'Student',
    description: 'Best for student communities, academic initiatives, and learning-focused brands.',
    icon: GraduationCap,
  },
  {
    value: 'business',
    label: 'Business',
    description: 'Best for companies, service providers, founders, and commercial organizations.',
    icon: Building2,
  },
]

const canSubmit = computed(
  () =>
    form.name.trim().length >= 3 &&
    form.description.trim().length >= 20 &&
    Boolean(form.category),
)

const handleSubmit = () => {
  if (!canSubmit.value) {
    toast.error('Complete the page details', {
      description: 'Add a page name, pick a category, and write a description with at least 20 characters.',
    })
    return
  }

  const page = pagesStore.createPage({
    name: form.name,
    category: form.category,
    description: form.description,
  })

  toast.success('Page created', {
    description: `${page.name} is ready for setup and management.`,
  })

  void router.push(`/pages/${page.slug}`)
}
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">Create page</span>
      </div>

      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 class="text-[1.7rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[2.1rem]">
            Create a new page
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            Set up a dedicated page for your student initiative or business presence. Once created, you’ll land on the page details screen to manage activity and visibility.
          </p>
        </div>

        <div class="rounded-[1.15rem] bg-[linear-gradient(135deg,rgba(66,63,151,0.12),rgba(211,154,69,0.12))] px-4 py-3 text-sm text-[var(--text-secondary)] shadow-[var(--shadow-soft)]">
          <span class="font-semibold text-[var(--text-primary)]">{{ pagesStore.pageCount }}</span>
          page{{ pagesStore.pageCount === 1 ? '' : 's' }} already in your workspace
        </div>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
      <section class="rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)] sm:p-6">
        <div class="flex items-center gap-3">
          <span class="inline-flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[var(--surface-secondary)] text-[var(--accent-strong)]">
            <LayoutTemplate class="h-5 w-5" />
          </span>
          <div>
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Page information</h2>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">These details help people understand what the page is about.</p>
          </div>
        </div>

        <form class="mt-6 space-y-6" @submit.prevent="handleSubmit">
          <label class="block space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Page name</span>
            <input
              v-model="form.name"
              type="text"
              placeholder="Enter page name"
              class="w-full rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
            />
          </label>

          <div class="space-y-3">
            <p class="text-sm font-semibold text-[var(--text-primary)]">Category of the page</p>
            <div class="grid gap-3 sm:grid-cols-2">
              <button
                v-for="option in categoryOptions"
                :key="option.value"
                type="button"
                class="rounded-[1.15rem] border px-4 py-4 text-left transition"
                :class="
                  form.category === option.value
                    ? 'border-[var(--accent)] bg-[linear-gradient(135deg,rgba(66,63,151,0.12),rgba(255,255,255,0.98))] shadow-[var(--shadow-soft)]'
                    : 'border-[color:var(--border-soft)] bg-[var(--surface-secondary)] hover:border-[var(--accent-soft)]'
                "
                @click="form.category = option.value"
              >
                <div class="flex items-start gap-3">
                  <span class="inline-flex h-11 w-11 items-center justify-center rounded-[0.95rem] bg-[var(--surface-primary)] text-[var(--accent-strong)]">
                    <component :is="option.icon" class="h-5 w-5" />
                  </span>
                  <div>
                    <p class="text-base font-semibold text-[var(--text-primary)]">{{ option.label }}</p>
                    <p class="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{{ option.description }}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <label class="block space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Page description</span>
            <textarea
              v-model="form.description"
              rows="6"
              placeholder="Describe what this page represents, who it serves, and what people should expect from it."
              class="w-full rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-3 text-sm leading-7 text-[var(--text-primary)] outline-none transition focus:border-[var(--accent)]"
            />
          </label>

          <div class="flex flex-col gap-3 border-t border-[color:var(--border-soft)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-[var(--text-secondary)]">
              After creation, we’ll take you to the page detail screen to manage the page.
            </p>
            <button
              type="submit"
              class="inline-flex items-center justify-center rounded-[1rem] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!canSubmit"
            >
              Create page
            </button>
          </div>
        </form>
      </section>

      <aside class="space-y-6">
        <section class="rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center gap-3">
            <Sparkles class="h-5 w-5 text-[var(--accent-strong)]" />
            <h2 class="text-lg font-semibold text-[var(--text-primary)]">What this unlocks</h2>
          </div>

          <div class="mt-5 space-y-3">
            <article class="rounded-[1rem] bg-[var(--surface-secondary)] p-4">
              <p class="text-sm font-semibold text-[var(--text-primary)]">Public page identity</p>
              <p class="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Give your initiative or business a clear place in the platform.</p>
            </article>
            <article class="rounded-[1rem] bg-[var(--surface-secondary)] p-4">
              <p class="text-sm font-semibold text-[var(--text-primary)]">Management actions</p>
              <p class="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Use the detail page to update information, share the page, and track readiness.</p>
            </article>
            <article class="rounded-[1rem] bg-[var(--surface-secondary)] p-4">
              <p class="text-sm font-semibold text-[var(--text-primary)]">Room to grow</p>
              <p class="mt-1 text-sm leading-6 text-[var(--text-secondary)]">Start with the essentials now and expand into posts, followers, and campaigns later.</p>
            </article>
          </div>
        </section>

        <section class="rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center gap-3">
            <FileText class="h-5 w-5 text-[var(--accent-strong)]" />
            <h2 class="text-lg font-semibold text-[var(--text-primary)]">Tips</h2>
          </div>

          <ul class="mt-5 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
            <li class="rounded-[1rem] bg-[var(--surface-secondary)] p-4">Use a short, memorable page name.</li>
            <li class="rounded-[1rem] bg-[var(--surface-secondary)] p-4">Choose the category that best matches the audience you want to attract.</li>
            <li class="rounded-[1rem] bg-[var(--surface-secondary)] p-4">Write a description that explains the purpose of the page in plain language.</li>
          </ul>
        </section>
      </aside>
    </div>
  </section>
</template>
