type CacheEntry<T> = {
  value?: T
  expiresAt: number
  pending: Promise<T> | null
}

type CachedRequestOptions = {
  ttlMs?: number
  force?: boolean
}

const now = () => Date.now()

export const createCachedRequest = <T>(defaultTtlMs: number) => {
  const entries = new Map<string, CacheEntry<T>>()

  const run = (
    key: string,
    loader: () => Promise<T>,
    options: CachedRequestOptions = {},
  ) => {
    const ttlMs = options.ttlMs ?? defaultTtlMs
    const existing = entries.get(key)

    if (!options.force) {
      if (existing?.pending) {
        return existing.pending
      }

      if (existing?.value !== undefined && existing.expiresAt > now()) {
        return Promise.resolve(existing.value)
      }
    }

    const pending = loader()
      .then((value) => {
        entries.set(key, {
          value,
          expiresAt: now() + ttlMs,
          pending: null,
        })
        return value
      })
      .catch((error) => {
        if (!existing?.value) {
          entries.delete(key)
        } else {
          entries.set(key, {
            ...existing,
            pending: null,
          })
        }
        throw error
      })

    entries.set(key, {
      value: existing?.value,
      expiresAt: existing?.expiresAt ?? 0,
      pending,
    })

    return pending
  }

  const clear = (key?: string) => {
    if (key) {
      entries.delete(key)
      return
    }

    entries.clear()
  }

  return { run, clear }
}

export const runWhenBrowserIsIdle = (callback: () => void, timeout = 1200) => {
  if (typeof window === 'undefined') {
    return null
  }

  const requestIdleCallback = (
    window as Window & {
      requestIdleCallback?: (handler: IdleRequestCallback, options?: IdleRequestOptions) => number
    }
  ).requestIdleCallback

  if (requestIdleCallback) {
    return requestIdleCallback(callback, { timeout })
  }

  return window.setTimeout(callback, timeout)
}
