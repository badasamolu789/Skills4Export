import type { PaginatorPayload } from '@/services/posts'

export const DEFAULT_PAGE_SIZE = 20

export const hasNextPage = <T>(response: PaginatorPayload<T>) =>
  Boolean(response.next_page_url) || response.current_page < response.last_page

export async function loadPaginatedRecords<T, Params extends { page?: number; per_page?: number }>(
  loadPage: (params: Params) => Promise<PaginatorPayload<T>>,
  params: Omit<Params, 'page' | 'per_page'> & Partial<Pick<Params, 'page' | 'per_page'>> = {} as Omit<Params, 'page' | 'per_page'> & Partial<Pick<Params, 'page' | 'per_page'>>,
  options: {
    perPage?: number
    maxPages?: number
  } = {},
) {
  const perPage = options.perPage ?? params.per_page ?? DEFAULT_PAGE_SIZE
  const startPage = params.page ?? 1
  const maxPages = options.maxPages ?? Number.POSITIVE_INFINITY
  const records: T[] = []
  let page = startPage
  let pagesLoaded = 0
  let lastResponse: PaginatorPayload<T> | null = null

  while (pagesLoaded < maxPages) {
    const response = await loadPage({
      ...params,
      page,
      per_page: perPage,
    } as Params)

    records.push(...response.data)
    lastResponse = response
    pagesLoaded += 1

    if (!hasNextPage(response)) {
      break
    }

    page = response.current_page + 1
  }

  return {
    data: records,
    lastResponse,
    nextPage: lastResponse && hasNextPage(lastResponse) ? lastResponse.current_page + 1 : null,
  }
}
