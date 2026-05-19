import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/lib/api'
import { extractUserIdFromToken } from '@/services/auth'
import { pagesService, type CreatePageRequest, type PageRecord } from '@/services/pages'
import { useAuthStore } from '@/stores/auth'

export type PageCategory = 'student' | 'business'

const OWNED_PAGE_REFERENCES_KEY = 'skills4export-owned-page-references'

export type ManagedPage = {
  id: string
  slug: string
  name: string
  category: PageCategory
  description: string
  status: 'active'
  followers: number
  posts: number
  leads: number
  completion: number
  createdAt: string
  updatedAt: string
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

export const mapPageRecordToManagedPage = (page: PageRecord): ManagedPage => {
  const metadata = page.metadata || {}
  const category = metadata.theme === 'student' || metadata.pageType === 'student' ? 'student' : 'business'

  return {
    id: page.id,
    slug: page.slug,
    name: page.name,
    category,
    description: page.description,
    status: page.isActive ? 'active' : 'active',
    followers: page.followers_count ?? 0,
    posts: page.posts_count ?? 0,
    leads: page.category_pages_count ?? 0,
    completion: page.avatar && page.coverImage ? 100 : 60,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  }
}

export const usePagesStore = defineStore('pages', () => {
  const authStore = useAuthStore()
  const pages = ref<ManagedPage[]>([])
  const isLoadingPages = ref(false)
  const pagesError = ref('')
  const loadedForUserId = ref('')

  const pageCount = computed(() => pages.value.length)
  const currentUserId = computed(() => authStore.userId || extractUserIdFromToken(authStore.authToken) || '')

  const getPageBySlug = (slug: string) => pages.value.find((page) => page.slug === slug) ?? null
  const getPageByIdOrSlug = (idOrSlug: string) =>
    pages.value.find((page) => page.id === idOrSlug || page.slug === idOrSlug) ?? null

  const clearPages = () => {
    pages.value = []
    pagesError.value = ''
    loadedForUserId.value = ''
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

  const isOwnedPageRecord = (record: PageRecord) => {
    const ownerId = getPageOwnerId(record)

    if (ownerId) {
      return ownerId === currentUserId.value
    }

    const ownedReferences = getOwnedPageReferences()
    return ownedReferences.has(record.id) || ownedReferences.has(record.slug)
  }

  const getOwnedPageRecords = (records: PageRecord[]) => {
    const userId = currentUserId.value

    if (!authStore.authToken || !userId) {
      return []
    }

    return records.filter(isOwnedPageRecord)
  }

  const setPagesFromApi = (records: PageRecord[]) => {
    const apiPages = getOwnedPageRecords(records).map(mapPageRecordToManagedPage)
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
    pages.value = [page, ...pages.value.filter((item) => item.id !== page.id)]
    loadedForUserId.value = currentUserId.value
    return page
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

    isLoadingPages.value = true
    pagesError.value = ''

    try {
      const response = await pagesService.listPages({ per_page: 100 }, authStore.authToken)
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

    if (cachedPage) {
      return cachedPage
    }

    isLoadingPages.value = true
    pagesError.value = ''

    try {
      const response = await pagesService.getPage(idOrSlug, authStore.authToken)
      return addPageFromApi(response.data)
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

  const createPageFromApi = async (payload: CreatePageRequest) => {
    const response = await pagesService.createPage(payload, authStore.authToken)
    const record = {
      ...response.data,
      ownerId: response.data.ownerId || currentUserId.value,
    }
    return addPageFromApi(record, { trustAsOwned: true }) ?? mapPageRecordToManagedPage(record)
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
    isLoadingPages,
    pagesError,
    pageCount,
    getPageBySlug,
    getPageByIdOrSlug,
    setPagesFromApi,
    addPageFromApi,
    rememberOwnedPage,
    clearPages,
    loadPages,
    loadPage,
    createPageFromApi,
    deletePageFromApi,
  }
})
