<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Users, UserPlus, UserCheck } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ApiError } from '@/lib/api'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const userId = computed(() => {
  const id = route.params.id
  return Array.isArray(id) ? id[0] : id
})

const followers = ref<Array<{
  id?: string
  followerId?: string
  followingId?: string
  createdAt?: string
}>>([])
const isLoadingFollowers = ref(false)
const isFollowing = ref<Record<string, boolean>>({})
const isToggling = ref<Record<string, boolean>>({})

const loadFollowers = async () => {
  if (!userId.value) {
    return
  }

  isLoadingFollowers.value = true

  try {
    const response = await usersService.listFollowers(userId.value, authStore.authToken)
    followers.value = response.data
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to load followers.'

    toast.error(message)
  } finally {
    isLoadingFollowers.value = false
  }
}

const followUser = async (targetUserId: string) => {
  if (!authStore.isAuthenticated) {
    router.push('/auth/login')
    return
  }

  isToggling.value[targetUserId] = true

  try {
    await usersService.followUser(targetUserId, {}, authStore.authToken)

    isFollowing.value[targetUserId] = true
    toast.success('Following user!')
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to follow user.'

    toast.error(message)
  } finally {
    isToggling.value[targetUserId] = false
  }
}

const unfollowUser = async (targetUserId: string) => {
  isToggling.value[targetUserId] = true

  try {
    await usersService.unfollowUser(targetUserId, authStore.authToken)

    isFollowing.value[targetUserId] = false
    toast.success('Unfollowed user!')
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to unfollow user.'

    toast.error(message)
  } finally {
    isToggling.value[targetUserId] = false
  }
}

onMounted(() => {
  void loadFollowers()
})
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-(--text-secondary)">
        <RouterLink to="/" class="transition hover:text-(--accent-strong)">Home</RouterLink>
        <span>/</span>
        <RouterLink to="/profile" class="transition hover:text-(--accent-strong)">Profile</RouterLink>
        <span>/</span>
        <span class="font-medium text-(--accent-strong)">Followers</span>
      </div>

      <div>
        <h1 class="text-[1.65rem] font-semibold leading-tight text-(--text-primary) sm:text-[1.95rem] lg:text-[2.1rem]">
          Followers
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-7 text-(--text-secondary) sm:text-base">
          View and manage your followers
        </p>
      </div>
    </div>

    <div v-if="isLoadingFollowers" class="rounded-[1.25rem] border border-dashed border-[color:var(--border-soft)] p-4 text-sm text-[var(--text-secondary)]">
      Loading followers...
    </div>

    <div v-else-if="followers.length === 0" class="rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-elevated)]">
      <Users class="mx-auto h-12 w-12 text-[var(--text-tertiary)]" />
      <p class="mt-4 text-lg font-semibold text-[var(--text-primary)]">No followers yet</p>
      <p class="mt-2 text-sm text-[var(--text-secondary)]">
        When people follow you, they'll appear here.
      </p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="follower in followers"
        :key="follower.id || follower.followerId"
        class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-soft)]"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-sm font-semibold text-[var(--accent-strong)]">
              {{ (follower.followerId?.charAt(0) || 'U').toUpperCase() }}
            </div>
            <p class="mt-3 text-sm font-semibold text-[var(--text-primary)]">
              User {{ follower.followerId }}
            </p>
            <p class="mt-1 text-xs text-[var(--text-tertiary)]">
              {{ follower.createdAt ? new Date(follower.createdAt).toLocaleDateString() : 'Recently' }}
            </p>
          </div>

          <button
            v-if="follower.followerId && follower.followerId !== authStore.userId"
            :disabled="isToggling[follower.followerId]"
            class="flex-shrink-0 inline-flex items-center justify-center gap-2 rounded-[0.875rem] px-3 py-2 text-sm font-semibold transition"
            :class="
              isFollowing[follower.followerId]
                ? 'bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-red-500/10 hover:text-red-500'
                : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]'
            "
            @click="isFollowing[follower.followerId] ? unfollowUser(follower.followerId) : followUser(follower.followerId)"
          >
            <component :is="isFollowing[follower.followerId] ? UserCheck : UserPlus" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
