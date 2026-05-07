<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { BriefcaseBusiness, Building2, Code2, Compass, Lock, Palette, Rocket, Users } from 'lucide-vue-next'
import { ApiError } from '@/lib/api'
import {
  communitiesService,
  type CommunityMemberRecord,
  type CommunityRecord,
} from '@/services/communities'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const community = ref<CommunityRecord | null>(null)
const members = ref<CommunityMemberRecord[]>([])
const isLoadingCommunity = ref(false)
const isJoining = ref(false)
const communityError = ref('')

const iconList = [Palette, Code2, Rocket, BriefcaseBusiness, Building2, Users]
const isMember = computed(() => members.value.some((member) => member.userId === authStore.userId))
const visibilityLabel = computed(() =>
  community.value?.default_post_visibility === 'community' ? 'Community posts' : 'Open community',
)

const communityIcon = computed(() => {
  const value = `${community.value?.category?.name || ''} ${community.value?.name || ''}`.toLowerCase()

  if (value.includes('design')) return Palette
  if (value.includes('tech') || value.includes('code')) return Code2
  if (value.includes('founder') || value.includes('business')) return Building2
  if (value.includes('job') || value.includes('freelance')) return BriefcaseBusiness
  if (value.includes('opportun')) return Rocket

  return iconList[0]
})

const focusAreas = computed(() =>
  [
    community.value?.category?.name,
    community.value?.default_post_visibility ? `${community.value.default_post_visibility} visibility` : '',
    `${community.value?.posts_count || 0} posts`,
    `${community.value?.comments_count || 0} comments`,
  ].filter(Boolean),
)

const loadCommunity = async (id: string) => {
  isLoadingCommunity.value = true
  communityError.value = ''
  community.value = null
  members.value = []

  try {
    const [communityResponse, membersResponse] = await Promise.all([
      communitiesService.getCommunity(id, authStore.authToken),
      communitiesService.listCommunityMembers(id, authStore.authToken).catch(() => null),
    ])
    community.value = communityResponse.data
    members.value = membersResponse?.data ?? []
  } catch (error) {
    communityError.value = error instanceof ApiError ? error.message : 'Unable to load this community.'
  } finally {
    isLoadingCommunity.value = false
  }
}

const toggleMembership = async () => {
  if (!community.value || isJoining.value) {
    return
  }

  if (!authStore.authToken) {
    toast.error('Sign in required', {
      description: 'Please sign in again before joining a community.',
    })
    return
  }

  isJoining.value = true

  try {
    if (isMember.value) {
      await communitiesService.leaveCommunity(community.value.id, authStore.authToken)
      members.value = members.value.filter((member) => member.userId !== authStore.userId)
      toast.success('Left community')
      return
    }

    const response = await communitiesService.joinCommunity(community.value.id, authStore.authToken)
    members.value = [response.data, ...members.value]
    toast.success('Joined community')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to update community membership.'
    toast.error('Community failed', { description: message })
  } finally {
    isJoining.value = false
  }
}

const shareCommunity = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('Community link copied')
  } catch {
    toast.error('Unable to copy link')
  }
}

watch(
  () => route.params.slug,
  (slug) => {
    void loadCommunity(String(slug))
  },
  { immediate: true },
)
</script>

<template>
  <section v-if="isLoadingCommunity" class="space-y-6">
    <div class="animate-pulse space-y-4 px-1">
      <div class="h-4 w-64 rounded-full bg-[var(--surface-secondary)]" />
      <div class="flex items-start gap-4">
        <div class="h-16 w-16 rounded-[1.4rem] bg-[var(--surface-secondary)]" />
        <div class="flex-1 space-y-3">
          <div class="h-7 w-1/2 rounded-full bg-[var(--surface-secondary)]" />
          <div class="h-4 w-full max-w-3xl rounded-full bg-[var(--surface-secondary)]" />
          <div class="h-4 w-2/3 rounded-full bg-[var(--surface-secondary)]" />
        </div>
      </div>
    </div>
    <article class="animate-pulse rounded-3xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)] sm:p-6">
      <div class="flex gap-2">
        <span class="h-9 w-28 rounded-full bg-[var(--surface-secondary)]" />
        <span class="h-9 w-36 rounded-full bg-[var(--surface-secondary)]" />
      </div>
      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div class="space-y-4">
          <div class="h-6 w-48 rounded-full bg-[var(--surface-secondary)]" />
          <div class="flex flex-wrap gap-2">
            <span class="h-9 w-28 rounded-full bg-[var(--surface-secondary)]" />
            <span class="h-9 w-32 rounded-full bg-[var(--surface-secondary)]" />
            <span class="h-9 w-24 rounded-full bg-[var(--surface-secondary)]" />
          </div>
        </div>
        <aside class="space-y-3">
          <span class="block h-12 rounded-2xl bg-[var(--surface-secondary)]" />
          <span class="block h-12 rounded-2xl bg-[var(--surface-secondary)]" />
        </aside>
      </div>
    </article>
  </section>

  <section v-else-if="community" class="space-y-6">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/communities" class="transition hover:text-[var(--accent-strong)]">Communities</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">{{ community.name }}</span>
      </div>

      <div class="flex items-start gap-4">
        <span class="inline-flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[var(--surface-secondary)] text-[var(--accent-strong)]">
          <component :is="communityIcon" class="h-8 w-8" />
        </span>
        <div>
          <h1 class="text-[1.8rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[2.15rem]">
            {{ community.name }}
          </h1>
          <p class="mt-2 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            {{ community.description || 'No community description has been added yet.' }}
          </p>
        </div>
      </div>
    </div>

    <article class="rounded-3xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)] sm:p-6">
      <div class="flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-sm text-[var(--text-secondary)]">
          <Users class="h-4 w-4 text-[var(--accent-strong)]" />
          {{ members.length }} member{{ members.length === 1 ? '' : 's' }}
        </span>
        <span class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-sm text-[var(--text-secondary)]">
          <component :is="community.default_post_visibility === 'community' ? Lock : Compass" class="h-4 w-4 text-[var(--accent-strong)]" />
          {{ visibilityLabel }}
        </span>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <h2 class="text-xl font-semibold text-[var(--text-primary)]">Community Details</h2>
          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="item in focusAreas"
              :key="item"
              class="inline-flex items-center rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-sm text-[var(--text-secondary)]"
            >
              {{ item }}
            </span>
          </div>
        </div>

        <aside class="space-y-3">
          <button
            type="button"
            :disabled="isJoining"
            class="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
            @click="toggleMembership"
          >
            {{ isJoining ? 'Updating...' : isMember ? 'Leave community' : 'Join community' }}
          </button>
          <button
            type="button"
            class="inline-flex w-full items-center justify-center rounded-2xl border border-[color:var(--border-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="shareCommunity"
          >
            Share
          </button>
        </aside>
      </div>
    </article>
  </section>

  <section v-else class="rounded-[1.35rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-soft)]">
    <h1 class="text-xl font-semibold text-[var(--text-primary)]">Community not found</h1>
    <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
      {{ communityError || 'The community you opened is not available.' }}
    </p>
  </section>
</template>
