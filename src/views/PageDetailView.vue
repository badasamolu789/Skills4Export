<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  ArrowRight,
  CalendarPlus,
  CloudUpload,
  Edit3,
  ExternalLink,
  Image as ImageIcon,
  MoreVertical,
  PenLine,
  UploadCloud,
  Video,
  X,
} from 'lucide-vue-next'
import AppFeedPost from '@/components/AppFeedPost.vue'
import JobCard from '@/components/JobCard.vue'
import RichTextContent from '@/components/RichTextContent.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import ResponsiveOverlay from '@/components/ResponsiveOverlay.vue'
import SkillPillInput from '@/components/SkillPillInput.vue'
import type { FeedPost } from '@/data/feedPosts'
import { ApiError } from '@/lib/api'
import { jobsService, type JobRecord } from '@/services/jobs'
import { mediaService } from '@/services/media'
import { pagesService } from '@/services/pages'
import { postsService, type PostMediaRecord, type PostRecord } from '@/services/posts'
import { usePagesStore } from '@/stores/pages'
import { useAuthStore } from '@/stores/auth'
import { getOptionalCount, getPostUserId } from '@/utils/postMapper'

type PageTab = 'about' | 'posts' | 'photos' | 'jobs' | 'dates'

type PagePost = {
  record: PostRecord
  media: PostMediaRecord[]
}

type InternshipDateRow = {
  id: string
  year: string
  dateFrom: string
  dateTo: string
  jobType: string
}

type PageUploadItem = {
  id: string
  title: string
  url: string
  mediaType: 'image' | 'video'
  isLocal?: boolean
}

const PAGE_UPLOAD_FALLBACKS_KEY = 'skills4export-page-upload-fallbacks'

const getStoredPageUploads = (pageId: string) => {
  if (typeof window === 'undefined') return [] as PageUploadItem[]

  try {
    const records = JSON.parse(window.localStorage.getItem(PAGE_UPLOAD_FALLBACKS_KEY) || '{}') as Record<string, PageUploadItem[]>
    return records[pageId] || []
  } catch {
    return []
  }
}

const rememberPageUploads = (pageId: string, uploads: PageUploadItem[]) => {
  if (typeof window === 'undefined') return

  try {
    const records = JSON.parse(window.localStorage.getItem(PAGE_UPLOAD_FALLBACKS_KEY) || '{}') as Record<string, PageUploadItem[]>
    records[pageId] = uploads.filter((item) => !item.isLocal && /^https?:\/\//.test(item.url))
    window.localStorage.setItem(PAGE_UPLOAD_FALLBACKS_KEY, JSON.stringify(records))
  } catch {
    // Ignore storage quota/privacy-mode failures; backend loading still works.
  }
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const pagesStore = usePagesStore()

const activeTab = ref<PageTab>('about')
const pagePosts = ref<PagePost[]>([])
const recommendedJobs = ref<JobRecord[]>([])
const isLoadingPosts = ref(false)
const isLoadingJobs = ref(false)
const pageLoadError = ref('')
const isEditPageModalOpen = ref(false)
const isLoadingPageEdit = ref(false)
const isSavingPage = ref(false)
const isPagePostModalOpen = ref(false)
const isSubmittingPagePost = ref(false)
const isInternshipModalOpen = ref(false)
const isUploadModalOpen = ref(false)
const isUploadingPageMedia = ref(false)
const uploadFileInput = ref<HTMLInputElement | null>(null)
const uploadFile = ref<File | null>(null)
const uploadPreviewUrl = ref('')
const uploadFileName = ref('')
const pageUploads = ref<PageUploadItem[]>([])
const uploadForm = ref({
  title: '',
})
const pagePostTitle = ref('')
const pagePostContent = ref('')
const pagePostFile = ref<File | null>(null)
const pagePostFileInput = ref<HTMLInputElement | null>(null)
const pagePostFilePreviewUrl = ref('')
const agreedToPagePostTerms = ref(false)
const internshipRows = ref<InternshipDateRow[]>([])
const internshipDraftRows = ref<InternshipDateRow[]>([])
const editBusinessForm = ref({
  name: '',
  slogan: '',
  contactEmail: '',
  website: '',
  staffSize: '',
  businessCategory: '',
  description: '',
})
const editStudentForm = ref({
  fullName: '',
  email: '',
  phone: '',
  courseOfStudy: '',
  graduationDate: '',
  skills: '',
  about: '',
})
const editAvatarFile = ref<File | null>(null)
const editAvatarPreviewUrl = ref('')
const editAvatarFileInput = ref<HTMLInputElement | null>(null)
const isUpdatingPageFollow = ref(false)

const POST_IMAGE_MAX_BYTES = 5 * 1024 * 1024
const POST_IMAGE_ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif'])
const postImageSizeReferences = [
  '1080 x 1350 (4:5)',
  '1080 x 1080 (1:1)',
  '1200 x 627 (1.91:1)',
] as const

const isPublicView = computed(() => route.name === 'public-page-detail')
const page = computed(() =>
  isPublicView.value
    ? pagesStore.getPublicPageByIdOrSlug(String(route.params.slug)) || pagesStore.getPageByIdOrSlug(String(route.params.slug))
    : pagesStore.getPageByIdOrSlug(String(route.params.slug)),
)
const isPageOwner = computed(() => Boolean(
  page.value && authStore.userId && page.value.ownerId === authStore.userId,
))

const getMetadataString = (key: string) => {
  const value = page.value?.metadata?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

const getMetadataStringList = (key: string) => {
  const value = page.value?.metadata?.[key]

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }

  return []
}

const pageTypeLabel = computed(() => page.value?.category === 'student' ? 'Student page' : 'Business page')
const pageImage = computed(() => page.value?.avatar || '')
const pageInitials = computed(() =>
  page.value?.name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'PG',
)
const courseLabel = computed(() =>
  getMetadataString('courseOfStudy') ||
  getMetadataString('businessCategory') ||
  pageTypeLabel.value,
)
const graduationLabel = computed(() => {
  const value = getMetadataString('graduationDate')
  const date = new Date(value)

  if (!value || Number.isNaN(date.getTime())) {
    return ''
  }

  return String(date.getFullYear())
})
const pageMetaLine = computed(() => {
  if (page.value?.category === 'business' && getMetadataString('slogan')) {
    return getMetadataString('slogan')
  }

  const items = [
    courseLabel.value ? `course - ${courseLabel.value}` : '',
    graduationLabel.value ? `grad. year - ${graduationLabel.value}` : '',
  ].filter(Boolean)

  return items.join(' | ')
})
const pageSkills = computed(() => getMetadataStringList('skills'))
const publicDisplayTarget = computed(() =>
  `/pages/${page.value?.slug || page.value?.id || String(route.params.slug)}/public`,
)
const managementDisplayTarget = computed(() =>
  `/pages/${page.value?.slug || page.value?.id || String(route.params.slug)}`,
)
const aboutRows = computed(() => {
  const rows = page.value?.category === 'business'
    ? [
      ['Slogan', getMetadataString('slogan')],
      ['Contact email', getMetadataString('contactEmail')],
      ['Website', getMetadataString('website')],
      ['Staff size', getMetadataString('staffSize')],
      ['Category of business', getMetadataString('businessCategory')],
    ]
    : [
      ['Email', getMetadataString('email')],
      ['Phone number', getMetadataString('phone')],
      ['Course of study', getMetadataString('courseOfStudy')],
      ['Graduation date', getMetadataString('graduationDate')],
      ['Skills', pageSkills.value.join(', ')],
    ]

  return rows
    .filter((row) => row[1])
    .map(([label, value]) => ({ label, value }))
})
const hasPageUploads = computed(() => pageUploads.value.length > 0)
const pagePostFileKind = computed(() => {
  if (!pagePostFile.value) {
    return ''
  }

  return pagePostFile.value.type.startsWith('video/') ? 'video' : 'image'
})
const pagePostFileSize = computed(() => {
  if (!pagePostFile.value) {
    return ''
  }

  const sizeInMb = pagePostFile.value.size / (1024 * 1024)
  return sizeInMb >= 1 ? `${sizeInMb.toFixed(1)} MB` : `${Math.max(1, Math.round(pagePostFile.value.size / 1024))} KB`
})
const pagePostFileRecommendation = computed(() =>
  pagePostFileKind.value === 'image'
    ? 'Best: 1080 x 1350 portrait. Also supports square 1080 x 1080 and landscape 1200 x 627.'
    : 'Video preview',
)

const tabs = computed<Array<{ label: string; value: PageTab }>>(() =>
  page.value?.category === 'business'
    ? [
      { label: 'About', value: 'about' },
      { label: 'Posts', value: 'posts' },
      { label: 'Upload Photos', value: 'photos' },
      { label: 'Jobs', value: 'jobs' },
    ]
    : [
      { label: 'About', value: 'about' },
      { label: 'Posts', value: 'posts' },
      { label: 'Avai. dates for internship', value: 'dates' },
    ],
)

const pageFeedPosts = computed<FeedPost[]>(() =>
  pagePosts.value.map((item) => {
    const media = item.media
      .filter((mediaItem) => mediaItem.url)
      .sort((a, b) => a.display_order - b.display_order)
      .map((mediaItem) => ({
        id: mediaItem.id,
        url: mediaItem.url,
        thumbnailUrl: mediaItem.thumbnail_url,
        mediaType: mediaItem.media_type,
        displayOrder: mediaItem.display_order,
      }))
    const imageMedia = media.find((mediaItem) => mediaItem.url)

    return {
      type: 'personal',
      apiId: item.record.id,
      userId: getPostUserId(item.record),
      pageId: page.value?.id || item.record.page_id || null,
      communityId: item.record.community_id || null,
      communityName: item.record.community?.name || undefined,
      originalPostId: item.record.originalPostId || item.record.parent_post_id || null,
      createdAt: item.record.created_at,
      updatedAt: item.record.updated_at,
      slug: item.record.id,
      author: {
        name: page.value?.name || '',
        to: publicDisplayTarget.value,
        avatarText: pageInitials.value,
        avatarSrc: pageImage.value || null,
        tag: pageSkills.value.slice(0, 3).join(' | '),
      },
      time: formatPostTime(item.record.created_at),
      title: item.record.title,
      description: item.record.content,
      imageSrc: imageMedia?.thumbnailUrl || imageMedia?.url || '',
      imageAlt: item.record.title,
      media,
      score: getOptionalCount(item.record.score, item.record.reactions_count, item.record.reaction_count),
      comments: getOptionalCount(item.record.comments_count, item.record.comment_count, item.record.commentsCount),
      isFollowing: Boolean(page.value?.isFollowing),
      isSaved: Boolean(item.record.is_saved),
      isScored: Boolean(item.record.is_liked),
    }
  }),
)

function formatPostTime(value?: string) {
  const date = new Date(value || '')

  if (!value || Number.isNaN(date.getTime())) {
    return 'Recently'
  }

  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60)),
    'hour',
  )
}

const makeClientId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const makeEmptyInternshipRow = (): InternshipDateRow => ({
  id: makeClientId(),
  year: '',
  dateFrom: '',
  dateTo: '',
  jobType: '',
})

const openInternshipModal = () => {
  internshipDraftRows.value = internshipRows.value.length
    ? internshipRows.value.map((row) => ({ ...row, id: makeClientId() }))
    : [makeEmptyInternshipRow()]
  isInternshipModalOpen.value = true
}

const addInternshipDraftRow = () => {
  internshipDraftRows.value = [...internshipDraftRows.value, makeEmptyInternshipRow()]
}

const submitInternshipRows = () => {
  const completeRows = internshipDraftRows.value
    .map((row) => ({
      ...row,
      year: row.year.trim(),
      dateFrom: row.dateFrom.trim(),
      dateTo: row.dateTo.trim(),
      jobType: row.jobType.trim(),
    }))
    .filter((row) => row.year || row.dateFrom || row.dateTo || row.jobType)

  if (!completeRows.length) {
    toast.error('Add at least one internship date row.')
    return
  }

  const hasIncompleteRow = completeRows.some((row) => !row.year || !row.dateFrom || !row.dateTo || !row.jobType)

  if (hasIncompleteRow) {
    toast.error('Complete year, date from, date to, and job type for each row.')
    return
  }

  internshipRows.value = completeRows.map((row) => ({
    ...row,
    id: makeClientId(),
  }))
  isInternshipModalOpen.value = false
  toast.success('Internship dates added.')
}

const clearUploadSelection = (options?: { keepPreview?: boolean }) => {
  if (!options?.keepPreview && uploadPreviewUrl.value) {
    URL.revokeObjectURL(uploadPreviewUrl.value)
  }

  uploadFile.value = null
  uploadFileName.value = ''
  uploadPreviewUrl.value = ''

  if (uploadFileInput.value) {
    uploadFileInput.value.value = ''
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

const clearPagePostFile = () => {
  pagePostFile.value = null

  if (pagePostFileInput.value) {
    pagePostFileInput.value.value = ''
  }
}

const openPagePostModal = () => {
  pagePostTitle.value = ''
  pagePostContent.value = ''
  clearPagePostFile()
  agreedToPagePostTerms.value = false
  isPagePostModalOpen.value = true
}

const handlePagePostFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] ?? null

  if (file?.type.startsWith('image/')) {
    if (!POST_IMAGE_ALLOWED_TYPES.has(file.type)) {
      toast.error('Unsupported post image format', {
        description: 'Use PNG, JPG, JPEG, or GIF for post images.',
      })
      target.value = ''
      pagePostFile.value = null
      return
    }

    if (file.size > POST_IMAGE_MAX_BYTES) {
      toast.error('Post image is too large', {
        description: 'Post images must be 5 MB or smaller.',
      })
      target.value = ''
      pagePostFile.value = null
      return
    }
  }

  pagePostFile.value = file
}

type UploadedPagePostMedia = {
  mediaAssetIds: string[]
  fallbackUrl?: string
  mediaType?: string
}

const uploadSelectedPagePostMedia = async () => {
  if (!pagePostFile.value) {
    return {
      mediaAssetIds: [],
    } satisfies UploadedPagePostMedia
  }

  const mediaType = pagePostFile.value.type.startsWith('video/') ? 'video' : 'image'
  const uploadResponse = await mediaService.uploadMediaFile(pagePostFile.value, {
    kind: mediaType === 'video' ? 'video' : 'post_image',
    title: pagePostFile.value.name,
    token: authStore.authToken,
  })
  const assetId = uploadResponse.data.assetId || uploadResponse.data.id
  const url = uploadResponse.data.url

  if (assetId) {
    return {
      mediaAssetIds: [assetId],
      mediaType,
    } satisfies UploadedPagePostMedia
  }

  if (url) {
    return {
      mediaAssetIds: [],
      fallbackUrl: url,
      mediaType,
    } satisfies UploadedPagePostMedia
  }

  throw new Error('Media upload completed without an asset ID or URL.')
}

const openUploadModal = () => {
  uploadForm.value = { title: '' }
  clearUploadSelection()
  isUploadModalOpen.value = true
}

const selectUploadFile = (file?: File | null) => {
  if (!file) {
    return
  }

  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    toast.error('Please choose an image or video file.')
    return
  }

  clearUploadSelection()
  uploadFile.value = file
  uploadFileName.value = file.name
  uploadPreviewUrl.value = URL.createObjectURL(file)
}

const handleUploadFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  selectUploadFile(input.files?.[0])
}

const handleUploadDrop = (event: DragEvent) => {
  selectUploadFile(event.dataTransfer?.files?.[0])
}

const submitPageUpload = async () => {
  if (!page.value || isUploadingPageMedia.value) {
    return
  }

  const title = uploadForm.value.title.trim()

  if (!title) {
    toast.error('Upload title is required.')
    return
  }

  if (!uploadFile.value) {
    toast.error('Choose an image or video to upload.')
    return
  }

  if (!authStore.authToken) {
    toast.error('Please sign in before uploading media.')
    return
  }

  const selectedFile = uploadFile.value
  const mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image'
  const toastId = toast.loading('Uploading media...')
  isUploadingPageMedia.value = true

  try {
    const uploadResponse = await mediaService.uploadMediaFile(selectedFile, {
      kind: mediaType,
      title,
      token: authStore.authToken,
    })

    const remoteUrl = uploadResponse.data.url || uploadPreviewUrl.value
    const shouldKeepPreview = remoteUrl === uploadPreviewUrl.value

    pageUploads.value.unshift({
      id: uploadResponse.data.assetId || uploadResponse.data.id || makeClientId(),
      title,
      url: remoteUrl,
      mediaType,
      isLocal: shouldKeepPreview,
    })
    rememberPageUploads(page.value.id, pageUploads.value)

    toast.success('Upload added', { id: toastId })
    isUploadModalOpen.value = false
    uploadForm.value = { title: '' }
    clearUploadSelection({ keepPreview: shouldKeepPreview })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to upload this media.'
    toast.error('Upload failed', { id: toastId, description: message })
  } finally {
    isUploadingPageMedia.value = false
  }
}

const openEditPageModal = async () => {
  if (!page.value || isLoadingPageEdit.value) {
    return
  }

  isLoadingPageEdit.value = true

  try {
    const refreshedPage = await pagesStore.loadPage(page.value.id)
    if (!refreshedPage) {
      toast.warning('Using the currently loaded page details because the latest details could not be fetched.')
    }
  } catch {
    toast.warning('Using the currently loaded page details because the latest details could not be fetched.')
  } finally {
    isLoadingPageEdit.value = false
  }

  if (!page.value) return

  if (page.value.category === 'business') {
    editBusinessForm.value = {
      name: page.value.name,
      slogan: getMetadataString('slogan'),
      contactEmail: getMetadataString('contactEmail'),
      website: getMetadataString('website'),
      staffSize: getMetadataString('staffSize'),
      businessCategory: getMetadataString('businessCategory'),
      description: page.value.description,
    }
  } else {
    editStudentForm.value = {
      fullName: page.value.name,
      email: getMetadataString('email'),
      phone: getMetadataString('phone'),
      courseOfStudy: getMetadataString('courseOfStudy'),
      graduationDate: getMetadataString('graduationDate'),
      skills: pageSkills.value.join(', '),
      about: page.value.description,
    }
  }

  clearEditAvatarSelection()
  isEditPageModalOpen.value = true
}

const clearEditAvatarSelection = () => {
  if (editAvatarPreviewUrl.value) {
    URL.revokeObjectURL(editAvatarPreviewUrl.value)
  }

  editAvatarFile.value = null
  editAvatarPreviewUrl.value = ''

  if (editAvatarFileInput.value) {
    editAvatarFileInput.value.value = ''
  }
}

const handleEditAvatarFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null

  if (!file?.type.startsWith('image/')) {
    toast.error('Choose an image file.')
    clearEditAvatarSelection()
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    toast.error('Image is too large', { description: 'Maximum file size is 10 MB.' })
    clearEditAvatarSelection()
    return
  }

  clearEditAvatarSelection()
  editAvatarFile.value = file
  editAvatarPreviewUrl.value = URL.createObjectURL(file)
}

const getEditMetadata = () => {
  if (page.value?.category === 'business') {
    return {
      slogan: editBusinessForm.value.slogan.trim(),
      contactEmail: editBusinessForm.value.contactEmail.trim(),
      website: editBusinessForm.value.website.trim(),
      staffSize: editBusinessForm.value.staffSize,
      businessCategory: editBusinessForm.value.businessCategory.trim(),
    }
  }

  return {
    email: editStudentForm.value.email.trim(),
    phone: editStudentForm.value.phone.trim(),
    courseOfStudy: editStudentForm.value.courseOfStudy.trim(),
    graduationDate: editStudentForm.value.graduationDate,
    skills: editStudentForm.value.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean),
  }
}

const savePageEdit = async () => {
  if (!page.value || isSavingPage.value) {
    return
  }

  const isBusiness = page.value.category === 'business'
  const name = isBusiness ? editBusinessForm.value.name.trim() : editStudentForm.value.fullName.trim()
  const description = isBusiness ? editBusinessForm.value.description.trim() : editStudentForm.value.about.trim()

  if (!name) {
    toast.error(isBusiness ? 'Business name is required.' : 'Full name is required.')
    return
  }

  isSavingPage.value = true
  const toastId = toast.loading('Saving page...')
  let avatarPersistenceWarning = ''

  try {
    const metadata = getEditMetadata()

    const pageId = page.value.id
    await pagesStore.updatePageFromApi(pageId, {
      type: page.value.category,
      name,
      slug: page.value.slug,
      description,
      metadata: {
        ...page.value.metadata,
        ...metadata,
      },
    })

    if (editAvatarFile.value) {
      toast.loading('Uploading page image...', { id: toastId })
      const uploadResponse = await pagesService.uploadPageAvatarFile(pageId, editAvatarFile.value, authStore.authToken)
      const refreshedPage = await pagesStore.loadPage(pageId)
      const processedUrl =
        uploadResponse.data.avatar ||
        uploadResponse.data.page?.avatar ||
        uploadResponse.data.url ||
        ''

      if (!refreshedPage?.avatar || (processedUrl && refreshedPage.avatar !== processedUrl)) {
        avatarPersistenceWarning = 'The page image upload finished, but the saved page record did not return the uploaded image.'
      }
    }

    if (pagesStore.pagePersistenceWarning || avatarPersistenceWarning) {
      toast.warning('Page updated with a backend persistence warning', {
        id: toastId,
        description: [pagesStore.pagePersistenceWarning, avatarPersistenceWarning].filter(Boolean).join(' '),
      })
    } else {
      toast.success('Page updated and verified', { id: toastId })
    }
    isEditPageModalOpen.value = false
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update this page.'
    toast.error('Page update failed', { id: toastId, description: message })
  } finally {
    isSavingPage.value = false
  }
}

const loadPageForSlug = async () => {
  pageLoadError.value = ''

  const loadedPage = isPublicView.value
    ? await pagesStore.loadPublicPage(String(route.params.slug))
    : await pagesStore.loadPage(String(route.params.slug))

  if (!loadedPage) {
    pageLoadError.value = pagesStore.pagesError || 'Unable to load this page.'
  }
}

const togglePageFollow = async () => {
  if (!page.value || isUpdatingPageFollow.value) return

  if (isPageOwner.value) {
    toast.info('This is your page.')
    return
  }

  isUpdatingPageFollow.value = true
  const nextFollowing = !page.value.isFollowing

  try {
    if (nextFollowing) {
      await pagesService.followPage(page.value.id, authStore.authToken)
    } else {
      await pagesService.unfollowPage(page.value.id, authStore.authToken)
    }

    pagesStore.setPageFollowing(page.value.id, nextFollowing)
    toast.success(nextFollowing ? 'Following page' : 'Unfollowed page')
  } catch (error) {
    toast.error('Unable to update page follow', {
      description: error instanceof Error ? error.message : 'Please try again.',
    })
  } finally {
    isUpdatingPageFollow.value = false
  }
}

const loadPagePosts = async () => {
  if (!page.value?.id) {
    pagePosts.value = []
    return
  }

  isLoadingPosts.value = true

  try {
    const pageId = page.value.id
    const response = await postsService.listPagePosts(
      pageId,
      { per_page: 20, sort: '-createdAt' },
      authStore.authToken,
    )
    const records = (response.data ?? []).filter((post) => {
      const postPageId = post.pageId || post.page_id
      return postPageId === pageId
    })
    const mediaResults = await Promise.allSettled(
      records.map((post) => postsService.listPostMedia(post.id, authStore.authToken)),
    )

    pagePosts.value = records.map((record, index) => ({
      record,
      media: mediaResults[index]?.status === 'fulfilled' ? mediaResults[index].value.data ?? [] : [],
    }))
  } catch {
    pagePosts.value = []
  } finally {
    isLoadingPosts.value = false
  }
}

const loadRecommendedJobs = async () => {
  isLoadingJobs.value = true

  try {
    const response = await jobsService.listJobs(
      { per_page: 20, sort: '-createdAt' },
      authStore.authToken,
      { suppressErrorModal: true },
    )
    const jobs = response.data ?? []
    recommendedJobs.value = jobs
  } catch {
    recommendedJobs.value = []
  } finally {
    isLoadingJobs.value = false
  }
}

const readUploadString = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

const loadPageUploads = async () => {
  if (!page.value?.id) {
    pageUploads.value = []
    return
  }

  try {
    const response = await pagesService.listPageUploads(page.value.id, authStore.authToken)
    const apiUploads = (response.data ?? []).flatMap((item, index) => {
      const url = readUploadString(item, ['url', 'secure_url', 'secureUrl', 'mediaUrl', 'media_url'])
      if (!url) return []
      const kind = readUploadString(item, ['kind', 'mediaType', 'media_type', 'resource_type'])
      return [{
        id: readUploadString(item, ['id', 'assetId', 'asset_id', 'uuid']) || `${page.value?.id}-upload-${index}`,
        title: readUploadString(item, ['title', 'name', 'caption']) || 'Page upload',
        url,
        mediaType: kind.includes('video') ? 'video' as const : 'image' as const,
      }]
    })
    const storedUploads = getStoredPageUploads(page.value.id)
    const seen = new Set<string>()
    pageUploads.value = [...apiUploads, ...storedUploads].filter((item) => {
      const key = item.id || item.url
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    rememberPageUploads(page.value.id, pageUploads.value)
  } catch {
    pageUploads.value = getStoredPageUploads(page.value.id)
  }
}

const handleCreatePagePost = () => {
  openPagePostModal()
}

const submitPagePost = async () => {
  if (!page.value || isSubmittingPagePost.value) {
    return
  }

  const title = pagePostTitle.value.trim()
  const content = pagePostContent.value.trim()
  const plainContent = getPlainTextFromHtml(content)

  if (!title || !plainContent) {
    toast.error('Add a title and content before posting.')
    return
  }

  if (!agreedToPagePostTerms.value) {
    toast.error('Accept the terms before posting.')
    return
  }

  if (!authStore.authToken) {
    toast.error('Sign in required', {
      description: 'Please sign in again before creating a page post.',
    })
    return
  }

  isSubmittingPagePost.value = true
  const loadingToastId = toast.loading(pagePostFile.value ? 'Uploading media...' : 'Creating page post...')

  try {
    const uploadedMedia = await uploadSelectedPagePostMedia()

    if (uploadedMedia.mediaAssetIds.length > 0 || uploadedMedia.fallbackUrl) {
      toast.loading('Creating page post...', { id: loadingToastId })
    }

    const response = await postsService.createPost(
      {
        pageId: page.value.id,
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

    toast.success('Page post created', {
      id: loadingToastId,
      description: title,
    })

    isPagePostModalOpen.value = false
    pagePostTitle.value = ''
    pagePostContent.value = ''
    clearPagePostFile()
    agreedToPagePostTerms.value = false
    activeTab.value = 'posts'
    await loadPagePosts()
    await router.push(`/posts/${response.data.id}`)
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Unable to create this page post.'
    toast.error('Post was not created', {
      id: loadingToastId,
      description: message,
    })
  } finally {
    isSubmittingPagePost.value = false
  }
}

const loadPageDetailData = async () => {
  await loadPageForSlug()
  await Promise.all([loadPagePosts(), loadRecommendedJobs(), loadPageUploads()])
}

onMounted(() => {
  void loadPageDetailData()
})

onBeforeUnmount(() => {
  clearUploadSelection()
  clearEditAvatarSelection()
  if (pagePostFilePreviewUrl.value) {
    URL.revokeObjectURL(pagePostFilePreviewUrl.value)
  }

  pageUploads.value.forEach((item) => {
    if (item.isLocal) {
      URL.revokeObjectURL(item.url)
    }
  })
})

watch(
  () => route.params.slug,
  () => {
    activeTab.value = 'about'
    void loadPageDetailData()
  },
)

watch(
  () => page.value?.id,
  () => {
    if (activeTab.value && !tabs.value.some((tab) => tab.value === activeTab.value)) {
      activeTab.value = 'about'
    }

    void loadPagePosts()
  },
)

watch(pagePostFile, (file, previousFile) => {
  if (pagePostFilePreviewUrl.value) {
    URL.revokeObjectURL(pagePostFilePreviewUrl.value)
    pagePostFilePreviewUrl.value = ''
  }

  if (file) {
    pagePostFilePreviewUrl.value = URL.createObjectURL(file)
  }

  if (!file && previousFile && pagePostFileInput.value) {
    pagePostFileInput.value.value = ''
  }
})
</script>

<template>
  <section v-if="page" class="page-detail-shell">
    <nav class="page-breadcrumb" aria-label="Breadcrumb">
      <RouterLink to="/feed">Home</RouterLink>
      <span>/</span>
      <RouterLink to="/pages/create">Pages</RouterLink>
      <span>/</span>
      <span>{{ page.name }}</span>
    </nav>

    <div class="page-detail-hero">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div class="flex min-w-0 items-center gap-4">
            <span class="page-avatar">
              <img loading="lazy" decoding="async" v-if="pageImage" :src="pageImage" :alt="page.name" class="h-full w-full object-cover" />
              <span v-else>{{ pageInitials }}</span>
            </span>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="text-2xl font-semibold leading-tight text-[var(--text-primary)]">
                  {{ page.name }}
                </h1>
                <button
                  v-if="isPageOwner && !isPublicView"
                  type="button"
                  class="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--accent-strong)]"
                  aria-label="Edit page"
                  @click="openEditPageModal"
                >
                  <Edit3 class="h-5 w-5" />
                </button>
              </div>
              <p class="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                {{ pageMetaLine || pageTypeLabel }}
              </p>
              <p class="mt-1 text-sm font-semibold text-[var(--text-secondary)]">
                {{ page.followers }} {{ page.followers === 1 ? 'follower' : 'followers' }}
                <span class="mx-2 text-[var(--text-tertiary)]">|</span>
                {{ page.posts }} {{ page.posts === 1 ? 'post' : 'posts' }}
              </p>
            </div>
          </div>
          <div class="grid w-full gap-3 sm:w-auto sm:grid-cols-2 md:justify-end">
            <RouterLink
              v-if="isPageOwner && !isPublicView"
              :to="publicDisplayTarget"
              class="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--accent)] px-4 text-center text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)]"
            >
              <span class="truncate">View public display</span>
              <ExternalLink class="h-4 w-4" />
            </RouterLink>
            <button
              v-if="isPageOwner && !isPublicView"
              type="button"
              class="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--accent)] px-4 text-sm font-semibold uppercase text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)]"
              @click="handleCreatePagePost"
            >
              <PenLine class="h-4 w-4" />
              <span class="truncate">Page post</span>
            </button>
            <RouterLink
              v-if="isPageOwner && isPublicView"
              :to="managementDisplayTarget"
              class="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-center text-sm font-semibold text-[var(--text-secondary)] shadow-[var(--shadow-soft)] transition hover:border-[color:var(--accent-soft)] hover:text-[var(--accent-strong)]"
            >
              Back to manage page
            </RouterLink>
            <button
              v-if="!isPageOwner"
              type="button"
              :disabled="isUpdatingPageFollow"
              class="inline-flex h-11 min-w-0 items-center justify-center rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              @click="togglePageFollow"
            >
              {{ isUpdatingPageFollow ? 'Updating...' : page.isFollowing ? 'Unfollow' : 'Follow page' }}
            </button>
          </div>
        </div>
      </div>

      <nav class="page-tabs" aria-label="Page sections">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          class="page-tab"
          :class="activeTab === tab.value ? 'page-tab--active' : ''"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <div class="page-detail-body">
      <section v-if="activeTab === 'about'" class="space-y-8">
        <div class="max-w-4xl space-y-8 text-base leading-8 text-[var(--text-secondary)]">
          <div>
            <h2 class="text-sm font-bold uppercase tracking-wide text-[var(--text-secondary)]">About</h2>
            <RichTextContent
              v-if="page.description"
              class="s4e-rich-content mt-3"
              :content="page.description"
            />
            <p v-else class="mt-3">No description has been added for this page yet.</p>
          </div>

          <div
            v-for="row in aboutRows"
            :key="row.label"
            class="border-t border-[color:var(--border-soft)] pt-5"
          >
            <h3 class="text-sm font-bold uppercase tracking-wide text-[var(--text-secondary)]">{{ row.label }}</h3>
            <a
              v-if="row.label.toLowerCase().includes('email')"
              :href="`mailto:${row.value}`"
              class="mt-2 block font-semibold text-[var(--accent-strong)]"
            >
              {{ row.value }}
            </a>
            <a
              v-else-if="row.label === 'Website'"
              :href="row.value"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-2 block font-semibold text-[var(--accent-strong)]"
            >
              {{ row.value }}
            </a>
            <p v-else class="mt-2">{{ row.value }}</p>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'posts'" class="space-y-5">
        <div v-if="isLoadingPosts" class="space-y-4">
          <div v-for="item in 2" :key="item" class="h-48 animate-pulse rounded-[1rem] bg-[var(--surface-secondary)]" />
        </div>
        <div v-else-if="pageFeedPosts.length" class="max-w-4xl space-y-4">
          <AppFeedPost
            v-for="post in pageFeedPosts"
            :key="post.apiId || post.slug"
            :post="post"
          />
        </div>
        <div v-else class="max-w-4xl rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center">
          <p class="text-lg font-semibold text-[var(--text-primary)]">No page posts yet</p>
          <p class="mt-2 text-sm text-[var(--text-secondary)]">Posts fetched for this page will appear here.</p>
        </div>
      </section>

      <section v-else-if="activeTab === 'photos'" class="space-y-8">
        <button
          v-if="isPageOwner && !isPublicView"
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-5 text-sm font-semibold text-[var(--text-secondary)] shadow-[var(--shadow-soft)] transition hover:border-[color:var(--accent-soft)] hover:text-[var(--accent-strong)]"
          @click="openUploadModal"
        >
          <ImageIcon class="h-4 w-4" />
          Upload Photos
        </button>

        <div v-if="hasPageUploads" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article
            v-for="item in pageUploads"
            :key="item.id"
            class="overflow-hidden rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-soft)]"
          >
            <div class="aspect-square bg-[var(--surface-secondary)]">
              <img loading="lazy" decoding="async"
                v-if="item.mediaType === 'image'"
                :src="item.url"
                :alt="item.title"
                class="h-full w-full object-cover"
              />
              <video
                v-else
                :src="item.url"
                class="h-full w-full object-cover"
                controls
              />
            </div>
            <h3 class="px-4 py-3 text-base font-semibold text-[var(--text-primary)]">{{ item.title }}</h3>
          </article>
        </div>

        <div v-else class="rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-8 text-center">
          <ImageIcon class="mx-auto h-9 w-9 text-[var(--text-tertiary)]" />
          <p class="mt-3 text-base font-semibold text-[var(--text-primary)]">No page uploads yet</p>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">Uploaded page images and videos will appear here.</p>
        </div>
      </section>

      <section v-else-if="activeTab === 'jobs'" class="space-y-4">
        <h2 class="text-xl font-semibold text-[var(--text-primary)]">Jobs</h2>
        <div v-if="isLoadingJobs" class="space-y-4">
          <div v-for="item in 2" :key="item" class="h-32 animate-pulse rounded-[1rem] bg-[var(--surface-secondary)]" />
        </div>
        <div v-else-if="recommendedJobs.length" class="space-y-4">
          <JobCard
            v-for="job in recommendedJobs"
            :key="job.id"
            :job="job"
          />
        </div>
        <div v-else class="rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center">
          <p class="text-lg font-semibold text-[var(--text-primary)]">No jobs posted yet</p>
          <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            Jobs posted on the platform will appear here when the API returns them.
          </p>
        </div>
      </section>

      <section v-else class="space-y-8">
        <button
          v-if="isPageOwner && !isPublicView"
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)]"
          @click="openInternshipModal"
        >
          <CalendarPlus class="h-4 w-4" />
          Create available dates for Internship
        </button>

        <section class="space-y-4">
          <h2 class="text-xl font-semibold text-[var(--text-primary)]">Available dates for internship</h2>
          <div
            v-if="!internshipRows.length"
            class="rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center"
          >
            <p class="text-lg font-semibold text-[var(--text-primary)]">No internship dates yet</p>
            <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Available internship dates will appear here once they are added.
            </p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="page-date-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Year</th>
                  <th>date-from</th>
                  <th>date-to</th>
                  <th>Jobtype</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in internshipRows" :key="row.id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ row.year }}</td>
                  <td>{{ row.dateFrom }}</td>
                  <td>{{ row.dateTo }}</td>
                  <td>{{ row.jobType }}</td>
                  <td>
                    <MoreVertical class="h-5 w-5" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="space-y-4">
          <h2 class="text-xl font-semibold text-[var(--text-primary)]">Recommended Jobs</h2>
          <div v-if="isLoadingJobs" class="space-y-4">
            <div v-for="item in 2" :key="item" class="h-32 animate-pulse rounded-[1rem] bg-[var(--surface-secondary)]" />
          </div>
          <div
            v-else-if="!recommendedJobs.length"
            class="rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center"
          >
            <p class="text-lg font-semibold text-[var(--text-primary)]">No recommended jobs yet</p>
            <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Recommended jobs will appear here when the API returns matches for this page.
            </p>
          </div>
          <div v-else class="space-y-4">
            <JobCard
              v-for="job in recommendedJobs"
              :key="job.id"
              :job="job"
            />
          </div>
        </section>
      </section>
    </div>
  </section>

  <section
    v-else-if="pagesStore.isLoadingPages"
    class="space-y-5 rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-soft)]"
    aria-label="Loading page details"
  >
    <div class="flex animate-pulse items-center gap-4">
      <div class="h-20 w-20 rounded-[1rem] bg-[var(--surface-muted)]" />
      <div class="min-w-0 flex-1 space-y-3">
        <div class="h-6 w-2/5 rounded-full bg-[var(--surface-muted)]" />
        <div class="h-4 w-1/4 rounded-full bg-[var(--surface-muted)]" />
      </div>
    </div>
    <div class="animate-pulse space-y-3">
      <div class="h-4 w-full rounded-full bg-[var(--surface-muted)]" />
      <div class="h-4 w-5/6 rounded-full bg-[var(--surface-muted)]" />
      <div class="h-28 rounded-[1rem] bg-[var(--surface-muted)]" />
    </div>
  </section>

  <section
    v-else
    class="rounded-[1rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-soft)]"
  >
    <h1 class="text-xl font-semibold text-[var(--text-primary)]">
      Page not found
    </h1>
    <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
      {{ pageLoadError || pagesStore.pagesError || 'The page you opened is not available right now.' }}
    </p>
  </section>

  <ResponsiveOverlay
    v-model="isInternshipModalOpen"
    label="Internship dates"
    title="Post Internship/IT dates"
    max-width-class="sm:max-w-6xl"
  >
    <form class="space-y-6" @submit.prevent="submitInternshipRows">
      <section class="space-y-4">
        <h3 class="border-b border-[color:var(--border-soft)] pb-4 text-xl font-semibold text-[var(--text-primary)]">
          Internship/IT dates
        </h3>

        <div class="overflow-x-auto">
          <table class="page-date-table min-w-[54rem]">
            <thead>
              <tr>
                <th>#</th>
                <th>Year</th>
                <th>Date from</th>
                <th>Date To</th>
                <th>Job-type</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in internshipDraftRows" :key="row.id">
                <td>
                  <input
                    :value="index + 1"
                    readonly
                    class="h-11 w-full rounded-[0.65rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-3 text-sm text-[var(--text-secondary)] outline-none"
                  />
                </td>
                <td>
                  <input
                    v-model="row.year"
                    type="number"
                    min="1900"
                    max="2100"
                    class="h-11 w-full rounded-[0.65rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]"
                  />
                </td>
                <td>
                  <input
                    v-model="row.dateFrom"
                    type="date"
                    class="h-11 w-full rounded-[0.65rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]"
                  />
                </td>
                <td>
                  <input
                    v-model="row.dateTo"
                    type="date"
                    class="h-11 w-full rounded-[0.65rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]"
                  />
                </td>
                <td>
                  <select
                    v-model="row.jobType"
                    class="h-11 w-full rounded-[0.65rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]"
                  >
                    <option value="">select</option>
                    <option value="Weekends">Weekends</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Remote">Remote</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          type="button"
          class="inline-flex items-center text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
          @click="addInternshipDraftRow"
        >
          + Add another line
        </button>
      </section>

      <div class="flex justify-center">
        <button
          type="submit"
          class="inline-flex h-12 min-w-48 items-center justify-center rounded-[0.75rem] bg-[var(--accent)] px-8 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)]"
        >
          Submit
        </button>
      </div>

    </form>
  </ResponsiveOverlay>

  <ResponsiveOverlay
    v-model="isEditPageModalOpen"
    label="Page"
    :title="page?.category === 'business' ? 'Edit Business Page' : 'Edit Student Page'"
    max-width-class="sm:max-w-4xl"
  >
    <form v-if="page" class="space-y-5" @submit.prevent="savePageEdit">
      <div v-if="page.category === 'business'" class="grid gap-4">
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Business name</span>
          <input v-model="editBusinessForm.name" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Slogan</span>
          <input v-model="editBusinessForm.slogan" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Contact email</span>
          <input v-model="editBusinessForm.contactEmail" type="email" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Website</span>
          <input v-model="editBusinessForm.website" type="url" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Category of business</span>
          <input v-model="editBusinessForm.businessCategory" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Staff size</span>
          <select v-model="editBusinessForm.staffSize" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]">
            <option value="">Select staff size</option>
            <option value="1-10">1 - 10</option>
            <option value="11-50">11 - 50</option>
            <option value="51-200">51 - 200</option>
            <option value="201+">201+</option>
          </select>
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Describe your business/organisation</span>
          <RichTextEditor
            v-model="editBusinessForm.description"
            class="mt-2"
            placeholder="Describe the business, services, audience, and what people should expect."
          />
        </label>
      </div>

      <div v-else class="grid gap-4">
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Full name</span>
          <input v-model="editStudentForm.fullName" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Email</span>
          <input v-model="editStudentForm.email" type="email" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Phone</span>
          <input v-model="editStudentForm.phone" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Course of study</span>
          <input v-model="editStudentForm.courseOfStudy" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Graduation date</span>
          <input v-model="editStudentForm.graduationDate" type="date" class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-sm outline-none focus:border-[color:var(--accent-soft)]" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">Skills</span>
          <SkillPillInput v-model="editStudentForm.skills" placeholder="e.g. Communication, design, research" />
        </label>
        <label>
          <span class="text-sm font-semibold text-[var(--text-primary)]">About - Describe your self</span>
          <RichTextEditor
            v-model="editStudentForm.about"
            class="mt-2"
            placeholder="Describe your academic achievements, skills, interests, and experience."
          />
        </label>
      </div>

      <div class="grid gap-5 sm:grid-cols-[14rem_minmax(0,1fr)] sm:items-center">
        <div class="flex aspect-[10/9] items-center justify-center overflow-hidden rounded-[0.8rem] bg-[var(--surface-secondary)] text-xl font-semibold tracking-[0.08em] text-[var(--text-secondary)]">
          <img loading="lazy" decoding="async"
            v-if="editAvatarPreviewUrl || pageImage"
            :src="editAvatarPreviewUrl || pageImage"
            alt="Page image preview"
            class="h-full w-full object-cover"
          />
          <span v-else>300 x 270</span>
        </div>
        <div class="space-y-4">
          <button
            type="button"
            class="inline-flex h-12 items-center justify-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--accent-soft)] hover:text-[var(--accent-strong)]"
            @click="editAvatarFileInput?.click()"
          >
            <ImageIcon class="h-4 w-4" />
            {{ page.category === 'student' ? 'Upload Passport' : 'Upload Logo' }}
          </button>
          <p class="text-sm text-[var(--text-secondary)]">Maximum file size: 10 MB.</p>
          <input ref="editAvatarFileInput" type="file" accept="image/*" class="sr-only" @change="handleEditAvatarFileChange" />
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t border-[color:var(--border-soft)] pt-4">
        <button
          type="submit"
          :disabled="isSavingPage"
          class="inline-flex h-10 items-center rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
        >
          {{ isSavingPage ? 'Saving...' : 'Save changes' }}
        </button>
      </div>
    </form>
  </ResponsiveOverlay>

  <ResponsiveOverlay
    v-model="isPagePostModalOpen"
    label="Page post"
    title="Create Page Post"
    max-width-class="sm:max-w-4xl"
  >
    <div class="space-y-5">
      <div class="rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-3">
        <p class="truncate text-sm font-semibold text-[var(--text-primary)]">
          Posting as {{ page?.name || 'this page' }}
        </p>
      </div>

      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Post Title<span class="text-[var(--danger)]">*</span></span>
        <input
          v-model="pagePostTitle"
          type="text"
          placeholder="Please choose an appropriate title for the post."
          class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]"
        />
      </label>

      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Content</span>
        <RichTextEditor
          v-model="pagePostContent"
          class="mt-2"
          placeholder="Write the post content here..."
        />
      </label>

      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Images or Video</span>
        <span class="mt-1 block text-xs font-medium text-[var(--text-tertiary)]">
          Post image sizes: {{ postImageSizeReferences.join(' / ') }}. PNG, JPG, or GIF up to 5 MB.
        </span>
        <button
          v-if="!pagePostFile"
          type="button"
          class="mt-2 flex min-h-28 w-full items-center justify-center rounded-[0.75rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-6 text-center text-sm font-medium text-[var(--text-secondary)] transition hover:border-[color:var(--accent-soft)] hover:text-[var(--accent-strong)]"
          @click="pagePostFileInput?.click()"
        >
          <span class="inline-flex items-center gap-2">
            <CloudUpload class="h-5 w-5" />
            Click to upload images or videos.
          </span>
        </button>
        <span
          v-else
          class="mt-2 block overflow-hidden rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)]"
        >
          <span class="block bg-[var(--surface-secondary)] p-3">
            <img loading="lazy" decoding="async"
              v-if="pagePostFileKind === 'image'"
              :src="pagePostFilePreviewUrl"
              :alt="pagePostFile.name"
              class="mx-auto aspect-[4/3] max-h-72 w-full rounded-[0.6rem] bg-[var(--surface-primary)] object-contain"
            />
            <video
              v-else
              :src="pagePostFilePreviewUrl"
              class="mx-auto aspect-[4/3] max-h-72 w-full rounded-[0.6rem] bg-black object-contain"
              controls
              playsinline
            />
          </span>
          <span class="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span class="min-w-0">
              <span class="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <ImageIcon v-if="pagePostFileKind === 'image'" class="h-4 w-4 text-[var(--accent-strong)]" />
                <Video v-else class="h-4 w-4 text-[var(--accent-strong)]" />
                <span class="truncate">{{ pagePostFile.name }}</span>
              </span>
              <span class="mt-1 block text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                {{ pagePostFileKind }} · {{ pagePostFileSize }}
              </span>
              <span class="mt-1 block text-xs text-[var(--text-tertiary)]">
                {{ pagePostFileRecommendation }}
              </span>
            </span>
            <span class="flex shrink-0 items-center gap-2">
              <button
                type="button"
                class="inline-flex h-10 items-center justify-center rounded-[0.65rem] border border-[color:var(--border-soft)] px-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--accent-soft)] hover:text-[var(--accent-strong)]"
                @click="pagePostFileInput?.click()"
              >
                Change
              </button>
              <button
                type="button"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-[0.65rem] border border-[color:var(--border-soft)] px-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--danger)] hover:text-[var(--danger)]"
                @click.prevent="clearPagePostFile"
              >
                <X class="h-4 w-4" />
                Remove
              </button>
            </span>
          </span>
        </span>
        <input ref="pagePostFileInput" type="file" accept="image/*,video/*" class="sr-only" @change="handlePagePostFileChange" />
      </label>

      <button
        type="button"
        class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--accent)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="isSubmittingPagePost"
        @click="submitPagePost"
      >
        {{ isSubmittingPagePost ? 'Posting...' : 'Post' }}
        <ArrowRight class="h-4 w-4" />
      </button>
      <label class="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
        <input v-model="agreedToPagePostTerms" type="checkbox" class="mt-1 h-4 w-4 rounded border-[color:var(--border-soft)]" />
        <span>By posting, you agreed to the <RouterLink to="/terms-and-conditions" class="text-[var(--accent-strong)]">Terms of Service</RouterLink> and <RouterLink to="/privacy-policy" class="text-[var(--accent-strong)]">Privacy Policy</RouterLink>.</span>
      </label>
    </div>
  </ResponsiveOverlay>

  <ResponsiveOverlay
    v-model="isUploadModalOpen"
    label="Uploads"
    title="Uploads"
    max-width-class="sm:max-w-xl"
  >
    <form class="space-y-5" @submit.prevent="submitPageUpload">
      <p class="text-sm leading-7 text-[var(--text-secondary)]">
        If you post image/video and url, the url will open when the upload title is clicked. If no image or video uploaded, the url preview will appear.
      </p>

      <label class="block">
        <span class="text-sm font-semibold text-[var(--text-primary)]">Upload title</span>
        <input
          v-model="uploadForm.title"
          type="text"
          placeholder="photosynthesis in plants"
          class="mt-2 h-11 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]"
        />
      </label>

      <div>
        <span class="text-sm font-semibold text-[var(--text-primary)]">Video/Image</span>
        <button
          type="button"
          class="mt-2 flex min-h-40 w-full items-center justify-center overflow-hidden rounded-[0.65rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 text-center transition hover:border-[color:var(--accent-soft)] hover:bg-[var(--surface-secondary)]"
          @click="uploadFileInput?.click()"
          @dragover.prevent
          @drop.prevent="handleUploadDrop"
        >
          <img loading="lazy" decoding="async"
            v-if="uploadPreviewUrl && uploadFile?.type.startsWith('image/')"
            :src="uploadPreviewUrl"
            alt="Selected upload preview"
            class="max-h-56 w-full rounded-[0.55rem] object-cover"
          />
          <video
            v-else-if="uploadPreviewUrl"
            :src="uploadPreviewUrl"
            class="max-h-56 w-full rounded-[0.55rem] object-cover"
            controls
          />
          <span v-else class="inline-flex items-center gap-3 text-sm font-medium text-[var(--text-secondary)]">
            <UploadCloud class="h-5 w-5 text-[var(--accent-strong)]" />
            Drop files here or click to upload.
          </span>
        </button>
        <input
          ref="uploadFileInput"
          type="file"
          accept="image/*,video/*"
          class="sr-only"
          @change="handleUploadFileChange"
        />
        <p v-if="uploadFileName" class="mt-2 text-xs font-medium text-[var(--text-tertiary)]">
          {{ uploadFileName }}
        </p>
      </div>

      <button
        type="submit"
        :disabled="isUploadingPageMedia"
        class="inline-flex h-12 w-full items-center justify-center rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
      >
        {{ isUploadingPageMedia ? 'Uploading...' : 'Upload' }}
      </button>
    </form>
  </ResponsiveOverlay>
</template>

<style scoped>
.page-detail-shell {
  margin-inline: auto;
  width: 100%;
  max-width: 64rem;
  min-width: 0;
  overflow-x: hidden;
  overflow-wrap: anywhere;
}

.page-breadcrumb {
  margin-bottom: 1rem;
  display: flex;
  max-width: 100%;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding-inline: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.86rem;
}

.page-breadcrumb a {
  font-weight: 600;
  color: var(--text-secondary);
  transition: color 180ms ease;
}

.page-breadcrumb a:hover {
  color: var(--accent-strong);
}

.page-detail-hero {
  border-bottom: 1px solid var(--border-soft);
  background: var(--surface-primary);
  padding: 3rem 0 0;
}

.page-avatar {
  display: inline-flex;
  height: 5rem;
  width: 5rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 1rem;
  background: var(--surface-secondary);
  color: var(--accent-strong);
  font-size: 1.1rem;
  font-weight: 700;
  box-shadow: var(--shadow-soft);
}

.page-tabs {
  margin-top: 2.5rem;
  display: flex;
  gap: 2rem;
  overflow-x: auto;
  max-width: 100%;
}

.page-tab {
  position: relative;
  flex-shrink: 0;
  padding: 0 0 1rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-weight: 700;
  transition: color 180ms ease;
}

.page-tab::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  border-radius: 999px;
  background: transparent;
  content: '';
}

.page-tab--active {
  color: var(--accent-strong);
}

.page-tab--active::after {
  background: var(--accent);
}

.page-detail-body {
  padding: 2rem 0 4rem;
  min-width: 0;
}

.s4e-rich-content {
  overflow-wrap: anywhere;
}

.s4e-rich-content :deep(a) {
  color: var(--accent-strong);
  font-weight: 600;
}

.s4e-rich-content :deep(ul),
.s4e-rich-content :deep(ol) {
  margin: 0.75rem 0 0.75rem 1.25rem;
}

.s4e-rich-content :deep(ul) {
  list-style: disc;
}

.s4e-rich-content :deep(ol) {
  list-style: decimal;
}

.s4e-rich-content :deep(p) {
  margin-block: 0.5rem;
}

.page-date-table {
  width: 100%;
  min-width: 46rem;
  border-collapse: collapse;
  background: var(--surface-primary);
  color: var(--text-primary);
}

.page-date-table th,
.page-date-table td {
  border: 1px solid var(--border-soft);
  padding: 0.95rem 1rem;
  text-align: left;
  vertical-align: middle;
}

.page-date-table th {
  background: var(--surface-secondary);
  font-size: 0.88rem;
  font-weight: 800;
}

.page-date-table td {
  font-size: 0.92rem;
  color: var(--text-secondary);
}

@media (min-width: 640px) {
  .page-detail-hero {
    padding-top: 3.5rem;
  }
}

@media (min-width: 1024px) {
  .page-detail-hero {
    padding-top: 4rem;
  }
}
</style>
