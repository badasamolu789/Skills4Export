<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import {
  ArrowRight,
  Bell,
  ChevronDown,
  CircleUserRound,
  CloudUpload,
  House,
  Image as ImageIcon,
  LayoutGrid,
  Menu,
  MessageSquareMore,
  Search,
  SquarePen,
  Users,
  Video,
  X,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import type { NotificationItem } from '@/data/notifications'
import { ApiError } from '@/lib/api'
import { mediaService } from '@/services/media'
import { postsService } from '@/services/posts'
import { questionsService } from '@/services/questions'
import { useAuthStore } from '@/stores/auth'

type HeaderLink = {
  label: string
  to?: string
  action?: 'ask' | 'post'
  target?: string
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
const activeComposer = ref<null | 'ask' | 'post'>(null)
const router = useRouter()
const authStore = useAuthStore()
const askTitle = ref('')
const askQuestion = ref('')
const postAudienceId = ref('')
const postTitle = ref('')
const postUrl = ref('')
const postContent = ref('')
const postFile = ref<File | null>(null)
const postFileInput = ref<HTMLInputElement | null>(null)
const postFilePreviewUrl = ref('')
const agreedToPostTerms = ref(false)
const isSubmittingQuestion = ref(false)
const isSubmittingPost = ref(false)
const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024
const POST_IMAGE_ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif'])
const postImageSizeReferences = [
  '1080 x 1350 (4:5)',
  '1080 x 1080 (1:1)',
  '1200 x 627 (1.91:1)',
] as const
const unreadCount = computed(() => props.notifications.filter((item) => item.unread).length)
const postEditor = ClassicEditor as any
const postEditorConfig = {
  toolbar: [
    'heading',
    '|',
    'bold',
    'italic',
    'underline',
    'bulletedList',
    'numberedList',
    '|',
    'link',
    'blockQuote',
    'codeBlock',
    '|',
    'undo',
    'redo',
  ],
  placeholder: 'Write the post content here...',
}
const postFileKind = computed(() => {
  if (!postFile.value) {
    return ''
  }

  return postFile.value.type.startsWith('video/') ? 'video' : 'image'
})
const postFileSize = computed(() => {
  if (!postFile.value) {
    return ''
  }

  const sizeInMb = postFile.value.size / (1024 * 1024)
  return sizeInMb >= 1 ? `${sizeInMb.toFixed(1)} MB` : `${Math.max(1, Math.round(postFile.value.size / 1024))} KB`
})
const postFileRecommendation = computed(() => {
  if (postFileKind.value !== 'image') {
    return 'Video preview'
  }

  return 'Best: 1080 x 1350 portrait. Also supports square 1080 x 1080 and landscape 1200 x 627.'
})

const iconByLink = {
  Home: House,
  Ask: MessageSquareMore,
  Post: SquarePen,
  Community: Users,
} as const

const openComposer = (type: 'ask' | 'post') => {
  activeComposer.value = type
  isUserMenuOpen.value = false
  isNotificationsOpen.value = false
}

const closeComposer = () => {
  activeComposer.value = null
}

const handleHeaderLinkAction = (link: HeaderLink) => {
  if (link.action) {
    openComposer(link.action)
  }
}

const handlePostFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] ?? null

  if (file?.type.startsWith('image/')) {
    if (!POST_IMAGE_ALLOWED_TYPES.has(file.type)) {
      toast.error('Unsupported post image format', {
        description: 'Use PNG, JPG, JPEG, or GIF for post images.',
      })
      target.value = ''
      postFile.value = null
      return
    }

    if (file.size > POST_IMAGE_MAX_BYTES) {
      toast.error('Post image is too large', {
        description: 'Post images must be 5 MB or smaller.',
      })
      target.value = ''
      postFile.value = null
      return
    }
  }

  postFile.value = file
}

const clearPostFile = () => {
  postFile.value = null

  if (postFileInput.value) {
    postFileInput.value.value = ''
  }
}

const getPlainTextFromHtml = (value: string) => {
  if (typeof window === 'undefined') {
    return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  }

  const element = document.createElement('div')
  element.innerHTML = value

  return (element.textContent || '').replace(/\u00a0/g, ' ').trim()
}

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

const submitQuestion = async () => {
  const title = askTitle.value.trim()
  const body = askQuestion.value.trim()

  if (!title) {
    toast.error('Question title is required.')
    return
  }

  if (!body) {
    toast.error('Question details are required.')
    return
  }

  if (isSubmittingQuestion.value) {
    return
  }

  isSubmittingQuestion.value = true

  try {
    const response = await questionsService.createQuestion(
      {
        ...(postAudienceId.value ? { communityId: postAudienceId.value } : {}),
        title,
        body,
        visibility: postAudienceId.value ? 'community_public' : 'public',
      },
      authStore.authToken,
    )

    toast.success('Question posted', {
      description: 'Your question is now live.',
    })
    askTitle.value = ''
    askQuestion.value = ''
    postAudienceId.value = ''
    closeComposer()

    if (response.data?.id) {
      await router.push(`/questions/${response.data.id}`)
    }
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to post question.'
    toast.error('Question failed', { description: message })
  } finally {
    isSubmittingQuestion.value = false
  }
}

const inferMediaTypeFromUrl = (url: string) => {
  const normalizedUrl = url.toLowerCase()

  if (/\.(mp4|mov|webm|m4v)(\?|#|$)/.test(normalizedUrl)) {
    return 'video'
  }

  return 'image'
}

type UploadedPostMedia = {
  mediaAssetIds: string[]
  fallbackUrl?: string
  mediaType?: string
}

const uploadSelectedPostMedia = async () => {
  if (!postFile.value) {
    return {
      mediaAssetIds: [],
    } satisfies UploadedPostMedia
  }

  const signatureResponse = await mediaService.getCloudinarySignature(authStore.authToken)
  const uploadResponse = await mediaService.uploadCloudinaryFile(postFile.value, signatureResponse.data)

  if (!uploadResponse.public_id) {
    throw new Error('Media upload completed without a public ID.')
  }

  const registerResponse = await mediaService.registerMedia(
    {
      publicId: uploadResponse.public_id,
      kind: postFile.value.type.startsWith('video/') ? 'video' : 'image',
    },
    authStore.authToken,
  )

  const mediaType = postFile.value.type.startsWith('video/') ? 'video' : 'image'

  try {
    const assetId = await mediaService.waitForProcessedMediaAsset(
      registerResponse.data.jobId,
      {
        token: authStore.authToken,
      },
    )

    return {
      mediaAssetIds: [assetId],
      mediaType,
    } satisfies UploadedPostMedia
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Media processing completed without an asset ID.' &&
      uploadResponse.secure_url
    ) {
      return {
        mediaAssetIds: [],
        fallbackUrl: uploadResponse.secure_url,
        mediaType,
      } satisfies UploadedPostMedia
    }

    throw error
  }
}

const submitPost = async () => {
  const title = postTitle.value.trim()
  const content = postContent.value.trim()
  const plainContent = getPlainTextFromHtml(content)
  const mediaUrl = postUrl.value.trim()

  if (!title || !plainContent) {
    toast.error('Add a title and content before posting.')
    return
  }

  if (!agreedToPostTerms.value) {
    toast.error('Accept the terms before posting.')
    return
  }

  isSubmittingPost.value = true
  const loadingToastId = toast.loading(postFile.value ? 'Uploading media...' : 'Creating post...')

  try {
    const uploadedMedia = await uploadSelectedPostMedia()

    if (uploadedMedia.mediaAssetIds.length > 0 || uploadedMedia.fallbackUrl) {
      toast.loading('Creating post...', { id: loadingToastId })
    }

    const response = await postsService.createPost(
      {
        userId: authStore.userId || undefined,
        communityId: postAudienceId.value || undefined,
        title,
        content,
        mediaAssetIds: uploadedMedia.mediaAssetIds.length ? uploadedMedia.mediaAssetIds : undefined,
      },
      authStore.authToken,
    )

    if (uploadedMedia.fallbackUrl) {
      await postsService.attachPostMedia(
        response.data.id,
        {
          url: uploadedMedia.fallbackUrl,
          mediaType: uploadedMedia.mediaType,
          displayOrder: 0,
        },
        authStore.authToken,
      )
    }

    if (mediaUrl) {
      await postsService.attachPostMedia(
        response.data.id,
        {
          url: mediaUrl,
          mediaType: inferMediaTypeFromUrl(mediaUrl),
          displayOrder: uploadedMedia.fallbackUrl ? 1 : 0,
        },
        authStore.authToken,
      )
    }

    toast.success('Post created', {
      id: loadingToastId,
      description: title,
    })

    await router.push(`/posts/${response.data.id}`)
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Unable to create post.'
    toast.error('Post was not created', {
      id: loadingToastId,
      description: message,
    })
    return
  } finally {
    isSubmittingPost.value = false
  }

  postAudienceId.value = ''
  postTitle.value = ''
  postUrl.value = ''
  postContent.value = ''
  clearPostFile()
  agreedToPostTerms.value = false
  closeComposer()
}

watch(postFile, (file, previousFile) => {
  if (postFilePreviewUrl.value) {
    URL.revokeObjectURL(postFilePreviewUrl.value)
    postFilePreviewUrl.value = ''
  }

  if (file) {
    postFilePreviewUrl.value = URL.createObjectURL(file)
  }

  if (!file && previousFile && postFileInput.value) {
    postFileInput.value.value = ''
  }
})

onBeforeUnmount(() => {
  if (postFilePreviewUrl.value) {
    URL.revokeObjectURL(postFilePreviewUrl.value)
  }
})
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-(--border-soft) bg-(--header-bg)">
    <div class="mx-auto w-full max-w-[86rem] px-3 py-2 sm:px-4 lg:px-6 xl:px-8">
      <div class="relative flex items-center justify-between gap-2 md:hidden">
        <div class="flex min-w-0 items-center gap-2">
          <button
            type="button"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            aria-label="Open menu"
            title="Open menu"
            @click="openMobileMenu"
          >
            <Menu class="h-4 w-4" />
          </button>
          <RouterLink to="/feed" class="flex min-w-0 items-center justify-center">
            <img
              :src="logoSrc"
              :alt="logoAlt"
              class="h-[2.8rem] w-auto object-contain"
            />
          </RouterLink>
        </div>

        <div class="flex items-center gap-1.5">
          <RouterLink
            to="/mobile/notifications"
            class="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            aria-label="Open notifications"
            title="Open notifications"
          >
            <Bell class="h-4 w-4" />
            <span
              v-if="unreadCount"
              class="absolute -right-0.5 -top-0.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white"
            >
              {{ unreadCount }}
            </span>
          </RouterLink>

          <RouterLink
            to="/mobile/search"
            class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--search-bg)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            :aria-label="searchPlaceholder"
            :title="searchPlaceholder"
          >
            <Search class="h-4 w-4 text-[var(--text-tertiary)]" />
          </RouterLink>

          <RouterLink
            to="/mobile/account"
            class="relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            aria-label="Open account menu"
            title="Open account menu"
          >
            <span
              v-if="props.isAuthenticated && !userImageSrc"
              class="flex h-full w-full items-center justify-center bg-[var(--accent)] text-xs font-bold text-white"
            >
              {{ userInitials }}
            </span>
            <img
              v-else-if="props.isAuthenticated && userImageSrc"
              :src="userImageSrc"
              :alt="userName"
              class="h-full w-full object-cover"
            />
            <span
              v-else
              class="flex h-full w-full items-center justify-center bg-[var(--surface-primary)] text-[var(--text-secondary)]"
            >
              <CircleUserRound class="h-5 w-5" />
            </span>
            <span
              v-if="props.isAuthenticated"
              class="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-[var(--surface-primary)] bg-green-500"
            />
          </RouterLink>
        </div>
      </div>

      <div class="mt-2 grid grid-cols-4 gap-1.5 md:hidden">
        <template
          v-for="link in links"
          :key="link.label"
        >
          <button
            v-if="link.action"
            type="button"
            class="flex min-h-10 items-center justify-center rounded-[0.8rem] bg-[var(--surface-secondary)] px-2 py-2 text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            :aria-label="link.label"
            :title="link.label"
            @click="handleHeaderLinkAction(link)"
          >
            <component
              :is="iconByLink[link.label as keyof typeof iconByLink] || LayoutGrid"
              class="h-4 w-4 stroke-[2]"
            />
          </button>
          <RouterLink
            v-else
            :to="link.to || '/'"
            :target="link.target"
            :rel="link.target === '_blank' ? 'noopener noreferrer' : undefined"
            class="flex min-h-10 items-center justify-center rounded-[0.8rem] bg-[var(--surface-secondary)] px-2 py-2 text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            :aria-label="link.label"
            :title="link.label"
          >
            <component
              :is="iconByLink[link.label as keyof typeof iconByLink] || LayoutGrid"
              class="h-4 w-4 stroke-[2]"
            />
          </RouterLink>
        </template>
      </div>

      <div class="relative hidden grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-8 md:grid lg:gap-12 xl:gap-16">
        <RouterLink to="/feed" class="flex items-center justify-center justify-self-start">
          <img
            :src="logoSrc"
            :alt="logoAlt"
            class="h-[3.2rem] w-auto object-contain sm:h-16 lg:h-11"
          />
        </RouterLink>

        <nav class="hidden items-center gap-2 justify-self-center md:flex lg:gap-3">
          <template
            v-for="link in links"
            :key="link.label"
          >
            <button
              v-if="link.action"
              type="button"
              class="flex h-10 items-center justify-center gap-2 px-2 text-[var(--text-secondary)] transition hover:text-[var(--accent)]"
              :aria-label="link.label"
              :title="link.label"
              @click="handleHeaderLinkAction(link)"
            >
              <component
                :is="iconByLink[link.label as keyof typeof iconByLink] || LayoutGrid"
                class="h-[1.1rem] w-[1.1rem] stroke-[1.8]"
              />
              <span class="text-sm font-semibold">{{ link.label }}</span>
            </button>
            <RouterLink
              v-else
              :to="link.to || '/'"
              :target="link.target"
              :rel="link.target === '_blank' ? 'noopener noreferrer' : undefined"
              class="flex h-10 items-center justify-center gap-2 px-2 text-[var(--text-secondary)] transition hover:text-[var(--accent)]"
              :aria-label="link.label"
              :title="link.label"
            >
              <component
                :is="iconByLink[link.label as keyof typeof iconByLink] || LayoutGrid"
                class="h-[1.1rem] w-[1.1rem] stroke-[1.8]"
              />
              <span class="text-sm font-semibold">{{ link.label }}</span>
            </RouterLink>
          </template>
        </nav>

        <div class="hidden items-center gap-3 justify-self-end md:flex">
          <label
            class="flex h-9 w-[13rem] items-center gap-2 rounded-full bg-[var(--search-bg)] px-3 text-[var(--text-secondary)] lg:w-[15rem] xl:w-[17rem]"
          >
            <Search class="h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              type="search"
              :placeholder="searchPlaceholder"
              class="w-full bg-[var(--search-bg)] text-[0.82rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </label>

          <button
            type="button"
            class="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="openNotifications"
          >
            <Bell class="h-4 w-4" />
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
              class="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition"
              @click="toggleUserMenu"
            >
              <span
                v-if="props.isAuthenticated && !userImageSrc"
                class="flex h-full w-full items-center justify-center bg-[var(--accent)] text-xs font-bold text-white"
              >
                {{ userInitials }}
              </span>
              <img
                v-else-if="props.isAuthenticated && userImageSrc"
                :src="userImageSrc"
                :alt="userName"
                class="h-full w-full object-cover"
              />
              <span
                v-else
                class="flex h-full w-full items-center justify-center bg-[var(--surface-primary)] text-[var(--text-secondary)]"
              >
                <CircleUserRound class="h-5 w-5" />
              </span>
              <span
                v-if="props.isAuthenticated"
                class="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface-primary)] bg-green-500"
              />
            </button>

            <div
              v-if="isUserMenuOpen"
              class="absolute right-0 top-[calc(100%+0.5rem)] w-64 rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-2.5 shadow-[var(--shadow-elevated)]"
            >
              <div class="flex items-start justify-between gap-2 rounded-[0.85rem] bg-[var(--surface-muted)] p-3">
                <div class="flex min-w-0 items-center gap-2">
                  <span
                    v-if="props.isAuthenticated && !userImageSrc"
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white"
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

                  <div class="min-w-0">
                    <p class="truncate text-[0.84rem] font-semibold text-[var(--text-primary)]">
                      {{ props.isAuthenticated ? userName : 'Guest user' }}
                    </p>
                    <p class="mt-0.5 truncate text-[0.72rem] text-[var(--text-tertiary)]">
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
                  class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                  aria-label="Close user menu"
                  @click="isUserMenuOpen = false"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>

              <div class="mt-2 space-y-1">
                <RouterLink
                  v-for="item in userMenu"
                  :key="item.label"
                  :to="item.to"
                  class="flex items-center justify-between rounded-xl px-3 py-2 text-[0.82rem] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--accent-strong)]"
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
          class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-3"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="space-y-1">
              <p class="text-[0.86rem] font-semibold text-[var(--text-primary)]">{{ item.title }}</p>
              <p class="text-[0.82rem] leading-6 text-[var(--text-secondary)]">{{ item.description }}</p>
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

    <ResponsiveOverlay
      :model-value="activeComposer === 'ask'"
      label="Composer"
      title="Ask Question"
      max-width-class="sm:max-w-2xl"
      @update:model-value="(value) => { if (!value) closeComposer() }"
    >
      <div class="space-y-5">
        <label class="block">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Everyone or a Community<span class="text-[var(--danger)]">*</span></span>
          <select
            v-model="postAudienceId"
            class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)]"
          >
            <option value="">Everyone</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Question title<span class="text-[var(--danger)]">*</span></span>
          <input
            v-model="askTitle"
            type="text"
            placeholder="What do you want to ask?"
            class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]"
          />
        </label>
        <textarea
          v-model="askQuestion"
          rows="10"
          placeholder="Add context, what you have tried, and the kind of answer you need..."
          class="w-full resize-y rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]"
        />
        <button
          type="button"
          :disabled="isSubmittingQuestion || !askTitle.trim() || !askQuestion.trim()"
          class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
          @click="submitQuestion"
        >
          {{ isSubmittingQuestion ? 'Posting...' : 'Ask Question' }}
          <ArrowRight class="h-4 w-4" />
        </button>
      </div>
    </ResponsiveOverlay>

    <ResponsiveOverlay
      :model-value="activeComposer === 'post'"
      label="Composer"
      title="Create Post"
      max-width-class="sm:max-w-4xl"
      @update:model-value="(value) => { if (!value) closeComposer() }"
    >
      <div class="space-y-5">
        <label class="block">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Everyone or a Community<span class="text-[var(--danger)]">*</span></span>
          <select class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)]">
            <option>Everyone</option>
            <option>Design Community</option>
            <option>Export Community</option>
            <option>Technology Community</option>
          </select>
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Post Title<span class="text-[var(--danger)]">*</span></span>
          <input
            v-model="postTitle"
            type="text"
            placeholder="Please choose an appropriate title for the post."
            class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]"
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Post Url</span>
          <input
            v-model="postUrl"
            type="url"
            placeholder="post url"
            class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]"
          />
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Content</span>
          <div class="post-content-editor mt-2">
            <Ckeditor
              v-model="postContent"
              :editor="postEditor"
              :config="postEditorConfig"
            />
          </div>
        </label>
        <label class="block">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Images or Video</span>
          <span class="mt-1 block text-xs font-medium text-[var(--text-tertiary)]">
            Post image sizes: {{ postImageSizeReferences.join(' / ') }}. PNG, JPG, or GIF up to 5 MB.
          </span>
          <span
            v-if="!postFile"
            class="mt-2 flex min-h-28 cursor-pointer items-center justify-center rounded-[0.75rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-6 text-center text-sm font-medium text-[var(--text-secondary)] transition hover:border-[color:var(--accent-soft)] hover:text-[var(--accent-strong)]"
          >
            <span class="inline-flex items-center gap-2">
              <CloudUpload class="h-5 w-5" />
              click to upload images or videos.
            </span>
          </span>
          <span
            v-else
            class="mt-2 block overflow-hidden rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)]"
          >
            <span class="block bg-[var(--surface-secondary)] p-3">
              <img
                v-if="postFileKind === 'image'"
                :src="postFilePreviewUrl"
                :alt="postFile.name"
                class="mx-auto aspect-[4/5] max-h-[30rem] w-full max-w-[24rem] rounded-[0.6rem] bg-[var(--surface-primary)] object-contain sm:aspect-[1.91/1] sm:max-w-full"
              />
              <video
                v-else
                :src="postFilePreviewUrl"
                class="max-h-80 w-full rounded-[0.6rem]"
                controls
                playsinline
              />
            </span>
            <span class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span class="min-w-0">
                <span class="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <ImageIcon v-if="postFileKind === 'image'" class="h-4 w-4 text-[var(--accent-strong)]" />
                  <Video v-else class="h-4 w-4 text-[var(--accent-strong)]" />
                  <span class="truncate">{{ postFile.name }}</span>
                </span>
                <span class="mt-1 block text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                  {{ postFileKind }} · {{ postFileSize }}
                </span>
                <span class="mt-1 block text-xs text-[var(--text-tertiary)]">
                  {{ postFileRecommendation }}
                </span>
              </span>
              <span class="flex shrink-0 items-center gap-2">
                <span class="inline-flex h-10 cursor-pointer items-center justify-center rounded-[0.65rem] border border-[color:var(--border-soft)] px-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--accent-soft)] hover:text-[var(--accent-strong)]">
                  Change
                </span>
                <button
                  type="button"
                  class="inline-flex h-10 items-center justify-center gap-2 rounded-[0.65rem] border border-[color:var(--border-soft)] px-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--danger)] hover:text-[var(--danger)]"
                  @click.prevent="clearPostFile"
                >
                  <X class="h-4 w-4" />
                  Remove
                </button>
              </span>
            </span>
          </span>
          <input ref="postFileInput" type="file" accept="image/*,video/*" class="sr-only" @change="handlePostFileChange" />
        </label>
        <button
          type="button"
          class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isSubmittingPost"
          @click="submitPost"
        >
          {{ isSubmittingPost ? 'Posting...' : 'Post' }}
          <ArrowRight class="h-4 w-4" />
        </button>
        <label class="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
          <input v-model="agreedToPostTerms" type="checkbox" class="mt-1 h-4 w-4 rounded border-[color:var(--border-soft)]" />
          <span>By posting, you agreed to the <span class="text-[var(--accent-strong)]">Terms of Service</span> and <span class="text-[var(--accent-strong)]">Privacy Policy</span>.</span>
        </label>
      </div>
    </ResponsiveOverlay>

  </header>
</template>
