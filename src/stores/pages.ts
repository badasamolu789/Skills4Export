import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/lib/api'
import { pagesService, type CreatePageRequest, type PageRecord } from '@/services/pages'
import { useAuthStore } from '@/stores/auth'
import { slugify } from '@/utils/slugify'

export type PageCategory = 'student' | 'business'

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

  const pageCount = computed(() => pages.value.length)

  const getPageBySlug = (slug: string) => pages.value.find((page) => page.slug === slug) ?? null

  const setPagesFromApi = (records: PageRecord[]) => {
    pages.value = records.map(mapPageRecordToManagedPage)
  }

  const addPageFromApi = (record: PageRecord) => {
    const page = mapPageRecordToManagedPage(record)
    pages.value = [page, ...pages.value.filter((item) => item.id !== page.id)]
    return page
  }

  const loadPages = async () => {
    isLoadingPages.value = true
    pagesError.value = ''

    try {
      const response = await pagesService.listPages({ per_page: 100 }, authStore.authToken)
      setPagesFromApi(response.data)
    } catch (error) {
      pagesError.value = error instanceof ApiError ? error.message : 'Unable to load pages.'
      pages.value = []
    } finally {
      isLoadingPages.value = false
    }
  }

  const createPageFromApi = async (payload: CreatePageRequest) => {
    const response = await pagesService.createPage(payload, authStore.authToken)
    return addPageFromApi(response.data)
  }

  const createPage = (payload: {
    name: string
    category: PageCategory
    description: string
  }) => {
    const baseSlug = slugify(payload.name)
    const matchingSlugs = pages.value.filter(
      (page) => page.slug === baseSlug || page.slug.startsWith(`${baseSlug}-`),
    )
    const slug = matchingSlugs.length === 0 ? baseSlug : `${baseSlug}-${matchingSlugs.length + 1}`
    const timestamp = new Date().toISOString()

    const page: ManagedPage = {
      id: `page-${Date.now()}`,
      slug,
      name: payload.name.trim(),
      category: payload.category,
      description: payload.description.trim(),
      status: 'active',
      followers: 0,
      posts: 0,
      leads: 0,
      completion: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    pages.value = [page, ...pages.value]

    return page
  }

  return {
    pages,
    isLoadingPages,
    pagesError,
    pageCount,
    getPageBySlug,
    setPagesFromApi,
    addPageFromApi,
    loadPages,
    createPageFromApi,
    createPage,
  }
})
