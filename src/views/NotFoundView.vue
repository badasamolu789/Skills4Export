<template>
  <section class="min-h-[calc(100vh-5rem)] bg-[var(--app-bg)] px-4 py-10 text-[var(--text-primary)] sm:px-6 lg:px-8">
    <div class="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center">
      <div class="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
        <div class="order-2 lg:order-1">
          <div class="relative overflow-hidden rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 sm:p-7">
            <div class="absolute -left-12 top-10 h-28 w-28 rounded-full bg-[color:color-mix(in_srgb,var(--accent)_18%,transparent)] blur-2xl" />
            <div class="absolute -right-16 bottom-8 h-36 w-36 rounded-full bg-[color:color-mix(in_srgb,var(--accent-strong)_16%,transparent)] blur-2xl" />
            <img
              class="relative mx-auto aspect-square w-full max-w-[34rem] object-contain"
              src="/404-error-with-tired-person.svg"
              alt="Tired person standing beside a 404 error sign"
            >
          </div>
        </div>

        <div class="order-1 text-center lg:order-2 lg:text-left">
          <p class="mb-4 inline-flex items-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]">
            404 error
          </p>
          <h1 class="text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl">
            This page took a wrong turn.
          </h1>
          <p class="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--text-secondary)] lg:mx-0">
            The link may be broken, moved, or no longer available. Let us get you back to Skills4Export.
          </p>

          <div class="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <RouterLink
              to="/"
              class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[0.85rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] sm:w-auto"
            >
              <Home class="h-4 w-4" />
              Go home
            </RouterLink>

            <button
              type="button"
              class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[0.85rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--accent-soft)] hover:text-[var(--accent-strong)] sm:w-auto"
              @click="goBack"
            >
              <ArrowLeft class="h-4 w-4" />
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Home, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }

  router.push('/')
}
</script>
