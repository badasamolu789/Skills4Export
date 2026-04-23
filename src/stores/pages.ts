import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
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

const PAGE_STORAGE_KEY = 'skills4export-pages'

const seededPages: ManagedPage[] = [
  {
    id: 'page-el-academy',
    slug: 'el-academy',
    name: 'EL Academy',
    category: 'student',
    description:
      'A student-focused page for sharing academic opportunities, export readiness programs, and peer learning resources.',
    status: 'active',
    followers: 0,
    posts: 0,
    leads: 0,
    completion: 0,
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-04-12T13:30:00.000Z',
  },
  {
    id: 'page-telefun',
    slug: 'telefun',
    name: 'Telefun',
    category: 'business',
    description:
      'A business page built to showcase services, build trust, and convert profile visitors into real conversations.',
    status: 'active',
    followers: 0,
    posts: 0,
    leads: 0,
    completion: 0,
    createdAt: '2026-02-14T10:45:00.000Z',
    updatedAt: '2026-04-14T08:10:00.000Z',
  },
]

const getStoredPages = () => {
  if (typeof window === 'undefined') {
    return seededPages
  }

  const storedValue = window.localStorage.getItem(PAGE_STORAGE_KEY)

  if (!storedValue) {
    window.localStorage.setItem(PAGE_STORAGE_KEY, JSON.stringify(seededPages))
    return seededPages
  }

  try {
    const parsed = JSON.parse(storedValue) as ManagedPage[]

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return seededPages
    }

    return parsed
  } catch {
    return seededPages
  }
}

export const usePagesStore = defineStore('pages', () => {
  const pages = ref<ManagedPage[]>(getStoredPages())

  const persistPages = () => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(PAGE_STORAGE_KEY, JSON.stringify(pages.value))
  }

  const pageCount = computed(() => pages.value.length)

  const getPageBySlug = (slug: string) => pages.value.find((page) => page.slug === slug) ?? null

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
    persistPages()

    return page
  }

  return {
    pages,
    pageCount,
    getPageBySlug,
    createPage,
  }
})
