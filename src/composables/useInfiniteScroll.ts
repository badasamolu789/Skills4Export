import { nextTick, onBeforeUnmount, onMounted, watch, type Ref } from 'vue'

export const useInfiniteScroll = (
  target: Ref<HTMLElement | null>,
  canLoad: () => boolean,
  loadMore: () => void,
  itemCount: () => number,
) => {
  let observer: IntersectionObserver | null = null

  const observe = (element: HTMLElement | null) => {
    if (!element || !observer) return
    observer.unobserve(element)
    observer.observe(element)
  }

  onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting) && canLoad()) loadMore()
    }, { rootMargin: '200px' })
    observe(target.value)
  })

  watch(target, (current, previous) => {
    if (previous) observer?.unobserve(previous)
    observe(current)
  })

  watch(itemCount, async (current, previous) => {
    if (current <= previous) return
    await nextTick()
    observe(target.value)
  })

  onBeforeUnmount(() => observer?.disconnect())
}
