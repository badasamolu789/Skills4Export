<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  GraduationCap,
  Image,
  Loader2,
} from 'lucide-vue-next'
import { ApiError } from '@/lib/api'
import SkillPillInput from '@/components/SkillPillInput.vue'
import { pagesService, type PageCategoryRecord, type PagePrefillRecord } from '@/services/pages'
import { useAuthStore } from '@/stores/auth'
import { usePagesStore, type PageCategory } from '@/stores/pages'
import { slugify } from '@/utils/slugify'

const router = useRouter()
const authStore = useAuthStore()
const pagesStore = usePagesStore()

type PageTypeOption = {
  label: string
  value: PageCategory
  icon: unknown
  category?: PageCategoryRecord | null
  description?: string
  isLimitReached?: boolean
  limitText?: string
}

const selectedPageType = ref<PageCategory | null>(null)
const selectedPageCategory = ref<PageCategoryRecord | null>(null)
const pageCategories = ref<PageCategoryRecord[]>([])
const isLoadingPageCategories = ref(false)
const pageCategoriesError = ref('')
const agreedToTerms = ref(false)
const isSubmitting = ref(false)
const isLoadingPrefill = ref(false)
const avatarFile = ref<File | null>(null)
const avatarPreviewUrl = ref('')
const prefilledAvatarUrl = ref('')
const avatarFileInput = ref<HTMLInputElement | null>(null)
const loadedPrefillTypes = new Set<PageCategory>()

const businessForm = ref({
  name: '',
  slogan: '',
  contactEmail: '',
  website: '',
  staffSize: '',
  businessCategory: '',
  description: '',
})

const studentForm = ref({
  fullName: '',
  email: '',
  phone: '',
  courseOfStudy: '',
  graduationDate: '',
  skills: '',
  about: '',
})

const currentTitle = computed(() => {
  if (selectedPageCategory.value?.name) {
    return `Create ${selectedPageCategory.value.name} Page`
  }

  if (selectedPageType.value === 'business') return 'Create Business Page'
  if (selectedPageType.value === 'student') return 'Students Page Form'
  return 'Choose a Page Category'
})

const categoryToPageType = (category?: PageCategoryRecord | null): PageCategory => {
  const signal = `${category?.slug || ''} ${category?.name || ''}`.toLowerCase()
  return signal.includes('student') ? 'student' : 'business'
}

const getCategoryIcon = (type: PageCategory) => type === 'student' ? GraduationCap : Building2

const pageTypes = computed<PageTypeOption[]>(() => {
  const activeCategories = pageCategories.value.filter((category) => category.is_active !== 0)

  return activeCategories.map((category) => {
    const value = categoryToPageType(category)
    const maxPages = category.max_pages_per_user
    const totalPages = category.total_pages ?? 0
    const isLimitReached = typeof maxPages === 'number' && maxPages > 0 && totalPages >= maxPages

    return {
      label: `Create ${category.name} page`,
      value,
      icon: getCategoryIcon(value),
      category,
      description: category.description || undefined,
      isLimitReached,
      limitText: typeof maxPages === 'number' && maxPages > 0
        ? `${totalPages}/${maxPages} created`
        : undefined,
    }
  })
})

const currentDescription = computed(() =>
  selectedPageType.value === 'business'
    ? businessForm.value.description
    : studentForm.value.about,
)

const currentName = computed(() =>
  selectedPageType.value === 'business'
    ? businessForm.value.name
    : studentForm.value.fullName,
)

const uploadLabel = computed(() =>
  selectedPageType.value === 'student' ? 'Upload Passport' : 'Upload Logo',
)

const currentAvatarUrl = computed(() => avatarPreviewUrl.value || prefilledAvatarUrl.value)

const readFirstValue = (...values: unknown[]) => {
  const value = values.find((item) => typeof item === 'string' && item.trim())
  return typeof value === 'string' ? value.trim() : ''
}

const fillIfEmpty = (
  currentValue: string,
  value: unknown,
  update: (nextValue: string) => void,
) => {
  if (!currentValue.trim() && typeof value === 'string' && value.trim()) {
    update(value.trim())
  }
}

const normalizeWebsiteUrl = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  const startsWithAllowedPrefix = /^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)

  if (!startsWithAllowedPrefix) {
    throw new Error('Invalid website URL')
  }

  const candidate = /^www\./i.test(trimmed)
    ? `https://${trimmed}`
    : trimmed
  const parsed = new URL(candidate)

  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname.includes('.')) {
    throw new Error('Invalid website URL')
  }

  return parsed.toString().replace(/\/$/, '')
}

const resetUpload = () => {
  if (avatarPreviewUrl.value) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
  }

  avatarPreviewUrl.value = ''
  prefilledAvatarUrl.value = ''
  avatarFile.value = null

  if (avatarFileInput.value) {
    avatarFileInput.value.value = ''
  }
}

const goBackToOptions = () => {
  selectedPageType.value = null
  selectedPageCategory.value = null
  agreedToTerms.value = false
  resetUpload()
}

const getLocalPrefill = (type: PageCategory): PagePrefillRecord => {
  const currentUser = authStore.currentUser
  const profile = authStore.userProfile
  const draft = authStore.signUpDraft
  const name = readFirstValue(profile?.displayName, currentUser?.name, draft.name)
  const email = readFirstValue(currentUser?.email, draft.email)

  return {
    type,
    pageType: type,
    name,
    email,
    contactEmail: email,
    phone: readFirstValue(profile?.phone, draft.phone),
    courseOfStudy: readFirstValue(draft.courseOfStudy),
    skills: draft.interests,
    website: readFirstValue(profile?.website, draft.website),
    avatar: readFirstValue(profile?.avatar, profile?.avatarUrl, profile?.avatar_url, draft.avatar),
  }
}

const applyPagePrefill = (type: PageCategory, prefill: PagePrefillRecord) => {
  if (type === 'business') {
    fillIfEmpty(
      businessForm.value.name,
      prefill.name,
      (value) => { businessForm.value.name = value },
    )
    fillIfEmpty(
      businessForm.value.contactEmail,
      readFirstValue(prefill.contactEmail, prefill.email),
      (value) => { businessForm.value.contactEmail = value },
    )
    fillIfEmpty(
      businessForm.value.website,
      prefill.website,
      (value) => { businessForm.value.website = value },
    )
    fillIfEmpty(
      businessForm.value.businessCategory,
      prefill.businessCategory,
      (value) => { businessForm.value.businessCategory = value },
    )
    return
  }

  fillIfEmpty(
    studentForm.value.fullName,
    prefill.name,
    (value) => { studentForm.value.fullName = value },
  )
  fillIfEmpty(
    studentForm.value.email,
    prefill.email,
    (value) => { studentForm.value.email = value },
  )
  fillIfEmpty(
    studentForm.value.phone,
    prefill.phone,
    (value) => { studentForm.value.phone = value },
  )
  fillIfEmpty(
    studentForm.value.courseOfStudy,
    prefill.courseOfStudy,
    (value) => { studentForm.value.courseOfStudy = value },
  )

  if (!studentForm.value.skills.trim() && Array.isArray(prefill.skills)) {
    studentForm.value.skills = prefill.skills.map((skill) => skill.trim()).filter(Boolean).join(', ')
  }

  if (!studentForm.value.about.trim()) {
    studentForm.value.about = readFirstValue(
      authStore.userProfile?.bio,
      authStore.userProfile?.about,
      authStore.userProfile?.aboutMe,
      authStore.userProfile?.about_me,
    )
  }

  if (!avatarFile.value && !prefilledAvatarUrl.value) {
    prefilledAvatarUrl.value = readFirstValue(prefill.avatar)
  }
}

const loadPagePrefill = async (type: PageCategory) => {
  const localPrefill = getLocalPrefill(type)
  applyPagePrefill(type, localPrefill)

  if (!authStore.authToken || loadedPrefillTypes.has(type)) {
    return
  }

  isLoadingPrefill.value = true

  try {
    const response = await pagesService.getPagePrefill(type, authStore.authToken)
    applyPagePrefill(type, response.data || localPrefill)
    loadedPrefillTypes.add(type)
  } catch {
    // Local authenticated profile data remains available if prefill cannot load.
  } finally {
    isLoadingPrefill.value = false
  }
}

const selectPageType = (item: PageTypeOption) => {
  if (item.isLimitReached) {
    toast.error('Page limit reached', {
      description: `You have reached the limit for ${item.category?.name || item.value} pages.`,
    })
    return
  }

  selectedPageType.value = item.value
  selectedPageCategory.value = item.category || null
  agreedToTerms.value = false
  resetUpload()
  void loadPagePrefill(item.value)
}

const loadPageCategories = async () => {
  if (!authStore.authToken) {
    return
  }

  isLoadingPageCategories.value = true
  pageCategoriesError.value = ''

  try {
    const response = await pagesService.listPageCategories(authStore.authToken)
    pageCategories.value = response.data
  } catch {
    pageCategoriesError.value = 'Page categories could not load. Showing default options.'
  } finally {
    isLoadingPageCategories.value = false
  }
}

const handleAvatarFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null

  if (!file) {
    resetUpload()
    return
  }

  if (!file.type.startsWith('image/')) {
    toast.error('Choose an image file.')
    resetUpload()
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error('Image is too large', {
      description: 'Maximum file size is 10 MB.',
    })
    resetUpload()
    return
  }

  if (avatarPreviewUrl.value) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
  }

  avatarFile.value = file
  avatarPreviewUrl.value = URL.createObjectURL(file)
}

const getBusinessMetadata = () => ({
  slogan: businessForm.value.slogan.trim(),
  contactEmail: businessForm.value.contactEmail.trim(),
  website: normalizeWebsiteUrl(businessForm.value.website),
  staffSize: businessForm.value.staffSize,
  businessCategory: businessForm.value.businessCategory.trim(),
})

const getStudentMetadata = () => ({
  email: studentForm.value.email.trim(),
  phone: studentForm.value.phone.trim(),
  courseOfStudy: studentForm.value.courseOfStudy.trim(),
  graduationDate: studentForm.value.graduationDate,
  skills: studentForm.value.skills
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean),
})

const validateCurrentForm = () => {
  if (!selectedPageType.value) {
    return false
  }

  if (selectedPageType.value === 'business') {
    if (!businessForm.value.name.trim()) {
      toast.error('Business name is required.')
      return false
    }

    if (!businessForm.value.contactEmail.trim()) {
      toast.error('Contact email is required.')
      return false
    }

    if (businessForm.value.website.trim()) {
      try {
        businessForm.value.website = normalizeWebsiteUrl(businessForm.value.website)
      } catch {
        toast.error('Website must start with http://, https:// or www.')
        return false
      }
    }
  }

  if (selectedPageType.value === 'student') {
    if (!studentForm.value.fullName.trim()) {
      toast.error('Full name is required.')
      return false
    }

    if (!studentForm.value.courseOfStudy.trim() || !studentForm.value.graduationDate) {
      toast.error('Course of study and graduation date are required.')
      return false
    }

    if (!studentForm.value.about.trim()) {
      toast.error('Describe yourself before creating the page.')
      return false
    }
  }

  if (!agreedToTerms.value) {
    toast.error('Accept the terms before creating the page.')
    return false
  }

  return true
}

const findCreatedPage = async (slug: string) => {
  const cachedPage = pagesStore.getPageByIdOrSlug(slug)

  if (cachedPage) {
    return cachedPage
  }

  await pagesStore.loadPages()
  return pagesStore.getPageByIdOrSlug(slug)
}

const submitPage = async () => {
  if (isSubmitting.value || !selectedPageType.value || !validateCurrentForm()) {
    return
  }

  if (!authStore.authToken) {
    toast.error('Sign in required', {
      description: 'Please sign in again before creating a page.',
    })
    return
  }

  const name = currentName.value.trim()
  const description = currentDescription.value.trim()
  const slug = slugify(name)
  const metadata = selectedPageType.value === 'business' ? getBusinessMetadata() : getStudentMetadata()

  isSubmitting.value = true
  const toastId = toast.loading('Creating page...')

  try {
    let page
    let recoveredExistingPage = false
    let avatarPersistenceWarning = ''

    try {
      page = await pagesStore.createPageFromApi({
        type: selectedPageType.value,
        categoryId: selectedPageCategory.value?.id || undefined,
        name,
        slug,
        description,
        avatar: avatarFile.value ? undefined : prefilledAvatarUrl.value || undefined,
        metadata,
      })
    } catch (error) {
      const isUncertainRequestFailure = error instanceof ApiError && (error.status === 0 || error.status === 408)

      if (!isUncertainRequestFailure) {
        throw error
      }

      // A timed-out create can still have committed on the server. Reconcile
      // only uncertain network failures before allowing another create attempt.
      page = await findCreatedPage(slug)
      recoveredExistingPage = Boolean(page)

      if (!page) throw error
    }

    if (avatarFile.value) {
      toast.loading('Uploading page image...', { id: toastId })

      try {
        const uploadResponse = await pagesService.uploadPageAvatarFile(page.id, avatarFile.value, authStore.authToken)
        const processedUrl =
          uploadResponse.data.avatar ||
          uploadResponse.data.page?.avatar ||
          uploadResponse.data.url ||
          ''

        if (processedUrl) {
          page = { ...page, avatar: processedUrl }
          pagesStore.updatePageAvatar(page.id, processedUrl)
        } else {
          avatarPersistenceWarning = 'The page image is still being processed and will appear shortly.'
        }
      } catch (error) {
        toast.warning('Page saved without its image', {
          id: toastId,
          description: 'The page is ready. You can upload its image again from page settings.',
        })
        await router.push(`/pages/${page.id}`)
        return
      }
    }

    if (pagesStore.pagePersistenceWarning || avatarPersistenceWarning) {
      toast.warning('Page created with a backend persistence warning', {
        id: toastId,
        description: [pagesStore.pagePersistenceWarning, avatarPersistenceWarning].filter(Boolean).join(' '),
      })
    } else {
      toast.success(recoveredExistingPage ? 'Page creation confirmed' : 'Page created and verified', {
        id: toastId,
        description: avatarFile.value
          ? `${page.name} is ready and its image upload completed.`
          : `${page.name} is ready to manage.`,
      })
    }

    await router.push(`/pages/${page.id}`)
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to create this page.'
    toast.error('Page creation failed', { id: toastId, description: message })
  } finally {
    isSubmitting.value = false
  }
}

watch(selectedPageType, () => {
  agreedToTerms.value = false
})

onBeforeUnmount(() => {
  if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value)
})

onMounted(() => {
  void loadPageCategories()
})
</script>

<template>
  <section class="min-h-[calc(100vh-6rem)] px-1 py-6 sm:py-8">
    <div v-if="!selectedPageType" class="mx-auto flex min-h-[calc(100vh-9rem)] max-w-6xl flex-col items-center justify-center">
      <div class="w-full space-y-10">
        <div class="text-center">
          <div class="mx-auto mb-4 flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
            <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
            <span>/</span>
            <span class="font-medium text-[var(--accent-strong)]">Create page options</span>
          </div>
          <h1 class="text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--text-primary)] sm:text-[2.7rem]">
            Choose a Page Category
          </h1>
          <div
            v-if="isLoadingPageCategories"
            class="mt-4 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]"
            aria-live="polite"
          >
            <Loader2 class="h-4 w-4 animate-spin" />
            Loading page categories...
          </div>
          <p v-else-if="pageCategoriesError" class="mt-4 text-sm text-[var(--text-secondary)]">
            {{ pageCategoriesError }}
          </p>
          <p v-else-if="!pageTypes.length" class="mt-4 text-sm text-[var(--text-secondary)]">
            No page categories are available yet.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <button
            v-for="item in pageTypes"
            :key="item.category?.id || item.value"
            type="button"
            :disabled="item.isLimitReached"
            class="group flex min-h-[19rem] flex-col items-center justify-center rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-elevated)] transition hover:-translate-y-0.5 hover:border-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            @click="selectPageType(item)"
          >
            <span class="flex h-20 w-20 items-center justify-center rounded-[1rem] bg-[var(--surface-secondary)] text-[var(--text-primary)] transition group-hover:text-[var(--accent-strong)]">
              <component :is="item.icon" class="h-11 w-11" />
            </span>
            <span class="mt-7 text-xl font-semibold text-[var(--text-primary)]">{{ item.label }}</span>
            <span v-if="item.description" class="mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
              {{ item.description }}
            </span>
            <span v-if="item.limitText" class="mt-4 rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
              {{ item.limitText }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="mx-auto max-w-6xl space-y-7">
      <div
        class="flex flex-col gap-4 px-1"
        :class="selectedPageType === 'student' ? 'items-center text-center' : 'lg:flex-row lg:items-center lg:justify-between'"
      >
        <div>
          <button
            type="button"
            class="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="goBackToOptions"
          >
            <ArrowLeft class="h-4 w-4" />
            Create page options
          </button>
          <h1 class="text-[1.8rem] font-semibold leading-tight tracking-[-0.02em] text-[var(--text-primary)] sm:text-[2.35rem]">
            {{ currentTitle }}
          </h1>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
          <button type="button" class="font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]" @click="goBackToOptions">
            Create page options
          </button>
          <ChevronRight class="h-4 w-4" />
          <span>{{ selectedPageCategory?.name || (selectedPageType === 'business' ? 'Create business page' : 'students page form') }}</span>
        </div>
      </div>

      <form
        class="mx-auto max-w-4xl rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)] sm:p-7"
        @submit.prevent="submitPage"
      >
        <div
          v-if="isLoadingPrefill"
          class="mb-5 flex items-center gap-2 text-sm text-[var(--text-secondary)]"
          aria-live="polite"
        >
          <Loader2 class="h-4 w-4 animate-spin" />
          Loading your saved details...
        </div>

        <div v-if="selectedPageType === 'business'" class="grid gap-5">
          <label class="space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Product/Service/Business Name <span class="text-[var(--danger)]">*</span></span>
            <input v-model="businessForm.name" class="s4e-page-input" placeholder="e.g. Ben Confectioneries" />
          </label>

          <label class="space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Slogan</span>
            <input v-model="businessForm.slogan" class="s4e-page-input" placeholder="e.g. Cooking Up Love, One Dish at a Time" />
          </label>

          <div class="grid gap-5 md:grid-cols-2">
            <label class="space-y-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Contact email <span class="text-[var(--danger)]">*</span></span>
              <input v-model="businessForm.contactEmail" type="email" class="s4e-page-input" placeholder="e.g. aliofor@email.com" />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Website <span class="font-normal text-[var(--text-secondary)]">(optional)</span></span>
              <input
                v-model="businessForm.website"
                type="text"
                inputmode="url"
                autocomplete="url"
                class="s4e-page-input"
                placeholder="Start with http://, https:// or www"
              />
              <span class="block text-xs text-[var(--text-secondary)]">Start with http://, https:// or www</span>
            </label>

            <label class="space-y-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Staff size</span>
              <select v-model="businessForm.staffSize" class="s4e-page-input">
                <option value="">Select</option>
                <option value="1-10">1 - 10</option>
                <option value="11-50">11 - 50</option>
                <option value="51-200">51 - 200</option>
                <option value="201+">201+</option>
              </select>
            </label>

            <label class="space-y-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Category of business</span>
              <input v-model="businessForm.businessCategory" class="s4e-page-input" placeholder="e.g. Information Technology" />
            </label>
          </div>
        </div>

        <div v-else class="grid gap-5">
          <label class="space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Your Full Name<span class="text-[var(--danger)]">*</span></span>
            <input v-model="studentForm.fullName" class="s4e-page-input" placeholder="e.g. Alex Smith Okwuchi" />
          </label>

          <div class="grid gap-5 md:grid-cols-2">
            <label class="space-y-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Email</span>
              <input v-model="studentForm.email" type="email" class="s4e-page-input" placeholder="smith@email.com" />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Phone number</span>
              <input v-model="studentForm.phone" type="tel" class="s4e-page-input" placeholder="+234 000 000 0000" />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Course of study<span class="text-[var(--danger)]">*</span></span>
              <input v-model="studentForm.courseOfStudy" class="s4e-page-input" placeholder="e.g. Mass Communication" />
            </label>

            <label class="space-y-2">
              <span class="text-sm font-semibold text-[var(--text-primary)]">Year of Graduation<span class="text-[var(--danger)]">*</span></span>
              <input v-model="studentForm.graduationDate" type="date" class="s4e-page-input" />
            </label>
          </div>

          <label class="space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Skills</span>
            <SkillPillInput v-model="studentForm.skills" placeholder="e.g. Communication, design, research" />
          </label>
        </div>

        <div class="mt-6 grid gap-5 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center">
          <div class="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border border-[color:var(--border-soft)] bg-white text-xl font-semibold tracking-[0.08em] text-[var(--text-secondary)]">
            <img v-if="currentAvatarUrl" loading="lazy" decoding="async" :src="currentAvatarUrl" alt="Page image preview" class="avatar-fit-cover" />
            <span v-else>300 x 270</span>
          </div>

          <div class="space-y-4">
            <button
              type="button"
              class="inline-flex h-12 items-center justify-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--accent-soft)] hover:text-[var(--accent-strong)]"
              @click="avatarFileInput?.click()"
            >
              <Image class="h-4 w-4" />
              {{ uploadLabel }}
            </button>
            <p class="text-sm text-[var(--text-secondary)]">Maximum file size: 10 MB.</p>
            <input ref="avatarFileInput" type="file" accept="image/*" class="sr-only" @change="handleAvatarFileChange" />
          </div>
        </div>

        <div class="mt-6">
          <div class="mb-2 text-sm font-semibold text-[var(--text-primary)]">
            {{ selectedPageType === 'business' ? 'Describe your business/organisation' : 'About - Describe your self' }}<span v-if="selectedPageType === 'student'" class="text-[var(--danger)]">*</span>
          </div>
          <textarea
            v-if="selectedPageType === 'business'"
            v-model="businessForm.description"
            class="min-h-40 w-full resize-y rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-sm leading-7 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[color:var(--accent-soft)]"
            placeholder="Describe the business, services, audience, and what people should expect."
          />
          <textarea
            v-else
            v-model="studentForm.about"
            class="min-h-40 w-full resize-y rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-sm leading-7 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[color:var(--accent-soft)]"
            placeholder="Describe your academic achievements, skills, interests, and experience."
          />
        </div>

        <label class="mt-6 flex items-start gap-3 text-sm text-[var(--text-secondary)]">
          <input v-model="agreedToTerms" type="checkbox" class="mt-0.5 h-4 w-4 rounded border-[color:var(--border-soft)]" />
          <span>
            By Submitting, you agree to the
            <RouterLink to="/terms-and-conditions" class="text-[var(--accent-strong)]">Terms of Service</RouterLink>
            and
            <RouterLink to="/privacy-policy" class="text-[var(--accent-strong)]">Privacy Policy</RouterLink>.
          </span>
        </label>

        <div class="mt-6">
          <button
            type="submit"
            :disabled="isSubmitting || isLoadingPrefill"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--accent)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
            <Check v-else class="h-4 w-4" />
            {{ isSubmitting ? 'Creating...' : 'Create page' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.s4e-page-input {
  height: 3.1rem;
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid var(--border-soft);
  background: var(--surface-primary);
  padding: 0 1rem;
  font-size: 0.9rem;
  color: var(--text-primary);
  outline: none;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.s4e-page-input::placeholder {
  color: var(--text-tertiary);
}

.s4e-page-input:focus {
  border-color: var(--accent-soft);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
}
</style>
