import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/lib/api'
import { extractUserIdFromToken } from '@/services/auth'
import { pagesService, type CreatePageRequest, type PageRecord } from '@/services/pages'
import { useAuthStore } from '@/stores/auth'

export type PageCategory = 'student' | 'business'

const OWNED_PAGE_REFERENCES_KEY = 'skills4export-owned-page-references'
const PAGE_CATEGORY_REFERENCES_KEY = 'skills4export-page-category-references'
const PAGE_METADATA_KEYS = [
  'slogan',
  'contactEmail',
  'website',
  'staffSize',
  'businessCategory',
  'email',
  'phone',
  'courseOfStudy',
  'graduationDate',
  'skills',
] as const

export type ManagedPage = {
  id: string
  slug: string
  name: string
  category: PageCategory
  description: string
  avatar: string | null
  coverImage: string | null
  metadata: Record<string, unknown>
  status: 'active'
  followers: number
  posts: number
  leads: number
  completion: number
  createdAt: string
  updatedAt: string
  ownerId: string
  isFollowing: boolean
}

const getPageOwnerId = (page: PageRecord) => {
  const record = page as PageRecord & {
    createdByUserId?: string | null
    userId?: string | null
    owner_id?: string | null
    created_by_user_id?: string | null
  }

  return record.ownerId || record.createdByUserId || record.userId || record.owner_id || record.created_by_user_id || ''
}

const isUuid = (value?: string | null) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))

const getStoredOwnedPageReferences = () => {
  if (typeof window === 'undefined') {
    return {} as Record<string, string[]>
  }

  try {
    return JSON.parse(window.localStorage.getItem(OWNED_PAGE_REFERENCES_KEY) || '{}') as Record<string, string[]>
  } catch {
    return {}
  }
}

const setStoredOwnedPageReferences = (references: Record<string, string[]>) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(OWNED_PAGE_REFERENCES_KEY, JSON.stringify(references))
}

const getStoredPageCategoryReferences = () => {
  if (typeof window === 'undefined') {
    return {} as Record<string, PageCategory>
  }

  try {
    return JSON.parse(window.localStorage.getItem(PAGE_CATEGORY_REFERENCES_KEY) || '{}') as Record<string, PageCategory>
  } catch {
    return {}
  }
}

const setStoredPageCategoryReferences = (references: Record<string, PageCategory>) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(PAGE_CATEGORY_REFERENCES_KEY, JSON.stringify(references))
}

const rememberPageCategory = (
  page: Pick<ManagedPage, 'id' | 'slug' | 'category'> | (PageRecord & { category?: PageCategory }),
  category: PageCategory,
) => {
  const references = getStoredPageCategoryReferences()

  if (page.id) {
    references[page.id] = category
  }

  if (page.slug) {
    references[page.slug] = category
  }

  setStoredPageCategoryReferences(references)
}

const getRememberedPageCategory = (page: Pick<PageRecord, 'id' | 'slug'>) => {
  const references = getStoredPageCategoryReferences()
  return references[page.id] || references[page.slug] || null
}

const getPayloadPageCategory = (payload: Partial<CreatePageRequest>): PageCategory | null => {
  const category = payload.type || payload.pageType || payload.page_type

  if (category === 'student' || payload.metadata?.theme === 'student' || payload.metadata?.pageType === 'student') {
    return 'student'
  }

  if (category === 'business' || payload.metadata?.theme === 'business' || payload.metadata?.pageType === 'business') {
    return 'business'
  }

  return null
}

const getSubmittedMetadata = (payload: Partial<CreatePageRequest>) => {
  const metadata: Record<string, unknown> = {
    ...(payload.metadata || {}),
  }
  const payloadRecord = payload as Record<string, unknown>

  for (const key of PAGE_METADATA_KEYS) {
    if (payloadRecord[key] !== undefined) {
      metadata[key] = payloadRecord[key]
    }
  }

  return metadata
}

const valuesMatch = (left: unknown, right: unknown) => {
  if (Array.isArray(left) && Array.isArray(right)) {
    return JSON.stringify(left.map(String).sort()) === JSON.stringify(right.map(String).sort())
  }

  return String(left ?? '').trim() === String(right ?? '').trim()
}

const getPagePersistenceIssues = (
  payload: Partial<CreatePageRequest>,
  persisted?: PageRecord | null,
) => {
  if (!persisted) return ['page record']

  const issues: string[] = []
  const submittedMetadata = getSubmittedMetadata(payload)
  const persistedMetadata = persisted.metadata || {}

  if (payload.name !== undefined && !valuesMatch(payload.name, persisted.name)) issues.push('name')
  if (payload.slug !== undefined && !valuesMatch(payload.slug, persisted.slug)) issues.push('slug')
  if (payload.description !== undefined && !valuesMatch(payload.description, persisted.description)) issues.push('description')
  if (payload.categoryId !== undefined && !valuesMatch(payload.categoryId, persisted.categoryId || persisted.category_id)) issues.push('category')
  const submittedType = payload.type || payload.pageType || payload.page_type
  const persistedType = persisted.type || persisted.pageType || persisted.page_type
  if (submittedType && !valuesMatch(submittedType, persistedType)) issues.push('page type')

  for (const [key, value] of Object.entries(submittedMetadata)) {
    if (!valuesMatch(value, persistedMetadata[key])) issues.push(key)
  }

  return issues
}

export const mapPageRecordToManagedPage = (page: PageRecord): ManagedPage => {
  const metadata = page.metadata || {}
  const rawCategory = (page as PageRecord & {
    category?: string | { name?: string | null; slug?: string | null; type?: string | null } | null
    type?: string | null
    pageType?: string | null
    theme?: string | null
  }).category
  const categoryRecord = rawCategory && typeof rawCategory === 'object' ? rawCategory : null
  const categorySignals = [
    metadata.theme,
    metadata.pageType,
    metadata.category,
    metadata.categoryType,
    rawCategory,
    categoryRecord?.name,
    categoryRecord?.slug,
    categoryRecord?.type,
    (page as PageRecord & { type?: string | null }).type,
    (page as PageRecord & { pageType?: string | null }).pageType,
    (page as PageRecord & { page_type?: string | null }).page_type,
    (page as PageRecord & { theme?: string | null }).theme,
  ]
    .map((value) => typeof value === 'string' ? value.toLowerCase() : '')
    .filter(Boolean)
  const metadataKeys = Object.keys(metadata).map((key) => key.toLowerCase())
  const hasStudentMetadata = [
    'courseofstudy',
    'graduationdate',
    'studentnumber',
    'matricnumber',
  ].some((key) => metadataKeys.includes(key))
  const rememberedCategory = getRememberedPageCategory(page)
  const category = categorySignals.some((value) => value.includes('student')) || hasStudentMetadata
    ? 'student'
    : rememberedCategory || 'business'

  return {
    id: page.id,
    slug: page.slug,
    name: page.name,
    category,
    description: page.description,
    avatar: page.avatar ?? null,
    coverImage: page.coverImage ?? null,
    metadata,
    status: page.isActive ? 'active' : 'active',
    followers: page.followers_count ?? 0,
    posts: page.posts_count ?? 0,
    leads: page.category_pages_count ?? 0,
    completion: page.avatar && page.coverImage ? 100 : 60,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    ownerId: getPageOwnerId(page),
    isFollowing: Boolean(page.is_follow ?? page.isFollow),
  }
}

export const usePagesStore = defineStore('pages', () => {
  const authStore = useAuthStore()
  const pages = ref<ManagedPage[]>([])
  const publicPages = ref<ManagedPage[]>([])
  const isLoadingPages = ref(false)
  const pagesError = ref('')
  const loadedForUserId = ref('')
  const pagePersistenceWarning = ref('')

  const pageCount = computed(() => pages.value.length)
  const currentUserId = computed(() => authStore.userId || extractUserIdFromToken(authStore.authToken) || '')

  const getPageBySlug = (slug: string) => pages.value.find((page) => page.slug === slug) ?? null
  const getPageByIdOrSlug = (idOrSlug: string) =>
    pages.value.find((page) => page.id === idOrSlug || page.slug === idOrSlug) ?? null
  const getPublicPageByIdOrSlug = (idOrSlug: string) =>
    publicPages.value.find((page) => page.id === idOrSlug || page.slug === idOrSlug) ?? null

  const clearPages = () => {
    pages.value = []
    pagesError.value = ''
    loadedForUserId.value = ''
    publicPages.value = []
  }

  const getOwnedPageReferences = () => {
    const userId = currentUserId.value

    if (!userId) {
      return new Set<string>()
    }

    return new Set(getStoredOwnedPageReferences()[userId] ?? [])
  }

  const rememberOwnedPage = (page: Pick<ManagedPage, 'id' | 'slug'> | PageRecord) => {
    const userId = currentUserId.value

    if (!userId) {
      return
    }

    const references = getStoredOwnedPageReferences()
    const userReferences = new Set(references[userId] ?? [])
    const id = 'id' in page ? page.id : ''
    const slug = 'slug' in page ? page.slug : ''

    if (id) {
      userReferences.add(id)
    }

    if (slug) {
      userReferences.add(slug)
    }

    references[userId] = Array.from(userReferences)
    setStoredOwnedPageReferences(references)
  }

  const setPagesFromApi = (records: PageRecord[]) => {
    // `/me/pages` is already ownership-scoped. Do not discard valid records
    // just because a list response omitted its owner identifier.
    const apiPages = records.map(mapPageRecordToManagedPage)
    apiPages.forEach((page) => {
      rememberOwnedPage(page)
      rememberPageCategory(page, page.category)
    })
    const nextPageKeys = new Set(apiPages.flatMap((page) => [page.id, page.slug]).filter(Boolean))
    const locallyOwnedPages = pages.value.filter((page) => {
      const ownedReferences = getOwnedPageReferences()
      return (
        (ownedReferences.has(page.id) || ownedReferences.has(page.slug)) &&
        !nextPageKeys.has(page.id) &&
        !nextPageKeys.has(page.slug)
      )
    })

    pages.value = [...apiPages, ...locallyOwnedPages]
    loadedForUserId.value = currentUserId.value
  }

  const addPageFromApi = (record: PageRecord, options: { trustAsOwned?: boolean } = {}) => {
    const ownerId = getPageOwnerId(record)
    const ownedReferences = getOwnedPageReferences()
    const isKnownOwnedPage = ownedReferences.has(record.id) || ownedReferences.has(record.slug)

    if (ownerId && ownerId !== currentUserId.value) {
      return null
    }

    if (!ownerId && !options.trustAsOwned && !isKnownOwnedPage) {
      return null
    }

    const page = mapPageRecordToManagedPage(record)
    rememberOwnedPage(page)
    rememberPageCategory(page, page.category)
    pages.value = [page, ...pages.value.filter((item) => item.id !== page.id)]
    loadedForUserId.value = currentUserId.value
    return page
  }

  const updatePageAvatar = (idOrSlug: string, avatar: string) => {
    if (!avatar) {
      return
    }

    const update = (page: ManagedPage) =>
      page.id === idOrSlug || page.slug === idOrSlug
        ? { ...page, avatar, updatedAt: new Date().toISOString() }
        : page

    pages.value = pages.value.map(update)
    publicPages.value = publicPages.value.map(update)
  }

  const loadRememberedOwnedPages = async () => {
    const references = Array.from(getOwnedPageReferences()).filter(isUuid)

    if (!references.length) {
      return
    }

    const results = await Promise.allSettled(
      references.map((id) => pagesService.getPage(id, authStore.authToken)),
    )

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        addPageFromApi(result.value.data)
      }
    })
  }

  const loadPages = async () => {
    if (!authStore.authToken || !currentUserId.value) {
      clearPages()
      return
    }

    if (isLoadingPages.value) {
      return
    }

    isLoadingPages.value = true
    pagesError.value = ''

    try {
      const response = await pagesService.listMyPages({ per_page: 100 }, authStore.authToken)
      setPagesFromApi(response.data)
      await loadRememberedOwnedPages()
    } catch (error) {
      pagesError.value = error instanceof ApiError ? error.message : 'Unable to load pages.'
      await loadRememberedOwnedPages()

      if (!pages.value.length) {
        pages.value = []
      }
    } finally {
      isLoadingPages.value = false
    }
  }

  const loadPage = async (idOrSlug: string) => {
    if (!authStore.authToken || !currentUserId.value) {
      clearPages()
      return null
    }

    const cachedPage = getPageByIdOrSlug(idOrSlug)

    isLoadingPages.value = true
    pagesError.value = ''

    try {
      const record = cachedPage || (isUuid(idOrSlug)
        ? null
        : await pagesService.findPageBySlug(idOrSlug, authStore.authToken, { ownedOnly: true }))
      if (!isUuid(idOrSlug) && !record) {
        pagesError.value = 'Unable to find this page in your pages.'
        return null
      }
      const pageId = record?.id || idOrSlug
      const response = await pagesService.getPage(pageId, authStore.authToken)
      return addPageFromApi(response.data, { trustAsOwned: true })
    } catch (error) {
      await loadPages()
      const page = getPageByIdOrSlug(idOrSlug)

      if (page) {
        return page
      }

      pagesError.value = error instanceof ApiError ? error.message : 'Unable to load page.'
      return null
    } finally {
      isLoadingPages.value = false
    }
  }

  const loadPublicPage = async (idOrSlug: string) => {
    const cachedPage = getPublicPageByIdOrSlug(idOrSlug) || getPageByIdOrSlug(idOrSlug)

    isLoadingPages.value = true
    pagesError.value = ''

    try {
      const record = cachedPage || (isUuid(idOrSlug)
        ? null
        : await pagesService.findPageBySlug(idOrSlug, authStore.authToken))
      if (!isUuid(idOrSlug) && !record) {
        pagesError.value = 'Unable to find this page.'
        return null
      }
      const pageId = record?.id || idOrSlug
      const response = await pagesService.getPage(pageId, authStore.authToken)
      const publicPage = mapPageRecordToManagedPage(response.data)
      publicPages.value = [
        publicPage,
        ...publicPages.value.filter((item) => item.id !== publicPage.id),
      ]
      return publicPage
    } catch (error) {
      pagesError.value = error instanceof ApiError ? error.message : 'Unable to load page.'
      return null
    } finally {
      isLoadingPages.value = false
    }
  }

  const setPageFollowing = (idOrSlug: string, following: boolean) => {
    const update = (page: ManagedPage) =>
      page.id === idOrSlug || page.slug === idOrSlug
        ? {
          ...page,
          isFollowing: following,
          followers: Math.max(0, page.followers + (following ? 1 : -1)),
        }
        : page

    pages.value = pages.value.map(update)
    publicPages.value = publicPages.value.map(update)
  }

  const createPageFromApi = async (payload: CreatePageRequest) => {
    const payloadCategory = getPayloadPageCategory(payload)
    pagePersistenceWarning.value = ''
    const response = await pagesService.createPage(payload, authStore.authToken)
    const record = {
      ...response.data,
      ownerId: response.data.ownerId || currentUserId.value,
    }
    const page = addPageFromApi(record, { trustAsOwned: true }) ?? mapPageRecordToManagedPage(record)

    if (payloadCategory) {
      rememberPageCategory(page, payloadCategory)
      page.category = payloadCategory
    }

    return page
  }

  const updatePageFromApi = async (id: string, payload: Partial<CreatePageRequest>) => {
    const payloadCategory = getPayloadPageCategory(payload)
    pagePersistenceWarning.value = ''
    const response = await pagesService.updatePage(id, payload, authStore.authToken)
    const verifiedResponse = await pagesService.getPage(id, authStore.authToken).catch(() => null)
    const persistenceIssues = getPagePersistenceIssues(payload, verifiedResponse?.data)

    if (persistenceIssues.length) {
      pagePersistenceWarning.value = `The backend accepted the update but the saved page does not match these fields: ${persistenceIssues.join(', ')}.`
    }

    const record = {
      ...(verifiedResponse?.data || response.data),
      ownerId: verifiedResponse?.data.ownerId || response.data.ownerId || currentUserId.value,
    }
    const updatedPage = mapPageRecordToManagedPage(record)
    const nextPage: ManagedPage = payloadCategory
      ? {
        ...updatedPage,
        category: payloadCategory,
      }
      : updatedPage

    pages.value = pages.value.map((page) =>
      page.id === nextPage.id || page.slug === nextPage.slug
        ? {
          ...page,
          ...nextPage,
        }
        : page,
    )

    if (!pages.value.some((page) => page.id === nextPage.id || page.slug === nextPage.slug)) {
      pages.value = [nextPage, ...pages.value]
    }

    publicPages.value = publicPages.value.map((page) =>
      page.id === nextPage.id || page.slug === nextPage.slug
        ? {
          ...page,
          ...nextPage,
        }
        : page,
    )

    rememberOwnedPage(nextPage)
    rememberPageCategory(nextPage, nextPage.category)
    return nextPage
  }

  const deletePageFromApi = async (id: string) => {
    await pagesService.deletePage(id, authStore.authToken)
    pages.value = pages.value.filter((page) => page.id !== id)
  }

  watch(
    () => [authStore.userId, authStore.authToken] as const,
    ([nextUserId, nextToken], [previousUserId, previousToken]) => {
      if (nextUserId !== previousUserId || nextToken !== previousToken) {
        clearPages()
      }
    },
  )

  return {
    pages,
    publicPages,
    isLoadingPages,
    pagesError,
    pagePersistenceWarning,
    pageCount,
    getPageBySlug,
    getPageByIdOrSlug,
    getPublicPageByIdOrSlug,
    setPagesFromApi,
    addPageFromApi,
    updatePageAvatar,
    rememberOwnedPage,
    clearPages,
    loadPages,
    loadPage,
    loadPublicPage,
    setPageFollowing,
    createPageFromApi,
    updatePageFromApi,
    deletePageFromApi,
  }
})
