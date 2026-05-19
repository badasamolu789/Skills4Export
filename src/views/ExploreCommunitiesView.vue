<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ApiError } from '@/lib/api'
import { communitiesService, type CommunityRecord } from '@/services/communities'
import { useAuthStore } from '@/stores/auth'
import { getCommunityLineAwesomeClass } from '@/utils/communityIcon'

const authStore = useAuthStore()
const searchQuery = ref('')
const communities = ref<CommunityRecord[]>([])
const isLoadingCommunities = ref(false)
const communitiesError = ref('')

const filteredCommunities = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return communities.value
  }

  return communities.value.filter((community) =>
    [community.name, community.description, community.category?.name].some((value) =>
      String(value || '').toLowerCase().includes(query),
    ),
  )
})

const loadCommunities = async () => {
  isLoadingCommunities.value = true
  communitiesError.value = ''

  try {
    const response = await communitiesService.listCommunities({ per_page: 100 }, authStore.authToken)
    communities.value = response.data
  } catch (error) {
    communitiesError.value = error instanceof ApiError ? error.message : 'Unable to load communities.'
    communities.value = []
  } finally {
    isLoadingCommunities.value = false
  }
}

onMounted(() => {
  void loadCommunities()
})
</script>

<template>
  <section class="min-h-[calc(100vh-6rem)] px-4 py-10 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl space-y-8">
      <div class="space-y-4 px-1">
        <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
          <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
          <span>/</span>
          <span class="font-medium text-[var(--accent-strong)]">Explore Communities</span>
        </div>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <h1 class="text-[2rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)] sm:text-[2.5rem]">
              Explore Communities
            </h1>
            <!-- <p class="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              Browse public communities and open the detail page to join, view activity, and see member context.
            </p> -->
          </div>

          <!-- <label class="flex h-11 items-center gap-2 rounded-[0.8rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 text-[var(--text-secondary)] shadow-[var(--shadow-soft)]">
            <Search class="h-4 w-4 text-[var(--text-tertiary)]" />
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Search communities"
              class="min-w-0 flex-1 bg-transparent text-[0.86rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
            />
          </label> -->
        </div>
      </div>

      <div class="space-y-4">
        <article
          v-for="item in 4"
          v-if="isLoadingCommunities"
          :key="`community-skeleton-${item}`"
          class="flex animate-pulse items-start gap-5 overflow-hidden rounded-[2rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-elevated)]"
        >
          <span class="h-16 w-16 rounded-[1.5rem] bg-[var(--surface-secondary)]" />
          <div class="min-w-0 flex-1 space-y-3">
            <div class="h-5 w-1/3 rounded-full bg-[var(--surface-secondary)]" />
            <div class="h-3 w-full rounded-full bg-[var(--surface-secondary)]" />
            <div class="h-3 w-2/3 rounded-full bg-[var(--surface-secondary)]" />
            <div class="flex gap-2">
              <span class="h-7 w-20 rounded-full bg-[var(--surface-secondary)]" />
              <span class="h-7 w-24 rounded-full bg-[var(--surface-secondary)]" />
              <span class="h-7 w-24 rounded-full bg-[var(--surface-secondary)]" />
            </div>
          </div>
        </article>

        <RouterLink
          v-if="!isLoadingCommunities"
          v-for="community in filteredCommunities"
          :key="community.id"
          :to="`/communities/${community.id}`"
          class="flex items-start gap-5 overflow-hidden rounded-[2rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-elevated)] transition hover:border-[color:var(--accent-soft)]"
        >
          <span class="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[var(--surface-secondary)] text-[var(--accent-strong)]">
            <i :class="getCommunityLineAwesomeClass(community)" class="text-[2rem] leading-none" aria-hidden="true" />
          </span>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="text-xl font-semibold text-[var(--text-primary)]">
                {{ community.name }}
              </h2>
            </div>
            <p
              class="mt-2 overflow-hidden text-sm leading-7 text-[var(--text-secondary)]"
              style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;"
            >
              {{ community.description || 'No community description has been added yet.' }}
            </p>
          </div>
        </RouterLink>

        <article
          v-if="!isLoadingCommunities && filteredCommunities.length === 0"
          class="rounded-[1.35rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-soft)]"
        >
          <h2 class="text-xl font-semibold text-[var(--text-primary)]">No communities found.</h2>
          <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
            {{ communitiesError || (searchQuery ? 'Try another community name or category.' : 'Communities will appear here once an admin creates them.') }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
