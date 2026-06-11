<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
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
import RichTextEditor from '@/components/RichTextEditor.vue'
import SkillPillInput from '@/components/SkillPillInput.vue'
import { pagesService } from '@/services/pages'
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
}

const pageTypes: PageTypeOption[] = [
  {
    label: 'Create Business page',
    value: 'business',
    icon: Building2,
  },
  {
    label: 'Create Student page',
    value: 'student',
    icon: GraduationCap,
  },
]

const selectedPageType = ref<PageCategory | null>(null)
const agreedToTerms = ref(false)
const isSubmitting = ref(false)
const avatarFile = ref<File | null>(null)
const avatarPreviewUrl = ref('')
const avatarFileInput = ref<HTMLInputElement | null>(null)

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
  if (selectedPageType.value === 'business') {
    return 'Create Business Page'
  }

  if (selectedPageType.value === 'student') {
    return 'Students Page Form'
  }

  return 'Choose a Page Type'
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

const resetUpload = () => {
  if (avatarPreviewUrl.value) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
  }

  avatarPreviewUrl.value = ''
  avatarFile.value = null

  if (avatarFileInput.value) {
    avatarFileInput.value.value = ''
  }
}

const goBackToOptions = () => {
  selectedPageType.value = null
  agreedToTerms.value = false
  resetUpload()
}

const selectPageType = (type: PageCategory) => {
  selectedPageType.value = type
  agreedToTerms.value = false
  resetUpload()
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
  website: businessForm.value.website.trim(),
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

    if (!businessForm.value.contactEmail.trim() || !businessForm.value.website.trim()) {
      toast.error('Contact email and website are required.')
      return false
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
        name,
        slug,
        description,
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
        const refreshedPage = await pagesStore.loadPage(page.id)
        const processedUrl =
          uploadResponse.data.avatar ||
          uploadResponse.data.page?.avatar ||
          uploadResponse.data.url ||
          ''

        if (refreshedPage) page = refreshedPage
        if (!refreshedPage?.avatar || (processedUrl && refreshedPage.avatar !== processedUrl)) {
          avatarPersistenceWarning = 'The image upload finished, but the saved page record did not return the uploaded image.'
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'The image upload did not finish.'
        toast.warning('Page saved without its image', {
          id: toastId,
          description: `${message} You can upload the image again from the page settings.`,
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
            Choose a Page Type
          </h1>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <button
            v-for="item in pageTypes"
            :key="item.value"
            type="button"
            class="group flex min-h-[19rem] flex-col items-center justify-center rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-elevated)] transition hover:-translate-y-0.5 hover:border-[color:var(--accent-soft)]"
            @click="selectPageType(item.value)"
          >
            <span class="flex h-20 w-20 items-center justify-center rounded-[1rem] bg-[var(--surface-secondary)] text-[var(--text-primary)] transition group-hover:text-[var(--accent-strong)]">
              <component :is="item.icon" class="h-11 w-11" />
            </span>
            <span class="mt-7 text-xl font-semibold text-[var(--text-primary)]">{{ item.label }}</span>
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
          <span>{{ selectedPageType === 'business' ? 'Create business page' : 'students page form' }}</span>
        </div>
      </div>

      <form
        class="mx-auto max-w-4xl rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)] sm:p-7"
        @submit.prevent="submitPage"
      >
        <div v-if="selectedPageType === 'business'" class="grid gap-5">
          <label class="space-y-2">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Product/Service/Business Name</span>
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
              <span class="text-sm font-semibold text-[var(--text-primary)]">Website <span class="text-[var(--danger)]">*</span></span>
              <input v-model="businessForm.website" type="url" class="s4e-page-input" placeholder="https://example.com" />
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
          <div class="flex aspect-[10/9] items-center justify-center overflow-hidden rounded-[0.8rem] bg-[var(--surface-secondary)] text-xl font-semibold tracking-[0.08em] text-[var(--text-secondary)]">
            <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" alt="Page image preview" class="h-full w-full object-cover" />
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

        <label class="mt-6 block space-y-2">
          <span class="text-sm font-semibold text-[var(--text-primary)]">
            {{ selectedPageType === 'business' ? 'Describe your business/organisation' : 'About - Describe your self' }}<span v-if="selectedPageType === 'student'" class="text-[var(--danger)]">*</span>
          </span>
          <RichTextEditor
            v-if="selectedPageType === 'business'"
            v-model="businessForm.description"
            placeholder="Describe the business, services, audience, and what people should expect."
          />
          <RichTextEditor
            v-else
            v-model="studentForm.about"
            placeholder="Describe your academic achievements, skills, interests, and experience."
          />
        </label>

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
            :disabled="isSubmitting"
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
