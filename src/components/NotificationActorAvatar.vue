<script lang="ts">
const profileRequests = new Map<string, Promise<{ avatar: string; name: string }>>()
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { UserRound } from 'lucide-vue-next'
import { getInitials } from '@/composables/useCurrentUserIdentity'
import type { NotificationItem } from '@/services/notifications'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ item: NotificationItem; compact?: boolean }>()
const authStore = useAuthStore()
const profileAvatar = ref('')
const profileName = ref('')
const imageFailed = ref(false)

watch(
  () => [props.item.actor?.id, props.item.actor?.avatar, authStore.userId] as const,
  async ([actorId, avatar, viewerId]) => {
    profileAvatar.value = ''
    profileName.value = ''
    imageFailed.value = false
    if (!actorId || avatar) return

    const key = `${viewerId}:${actorId}`
    let request = profileRequests.get(key)
    if (!request) {
      request = usersService.getUserProfile(actorId, authStore.authToken).then((response) => ({
        avatar: response.data?.profile?.avatar || '',
        name: response.data?.user?.name || response.data?.profile?.displayName || '',
      }))
      profileRequests.set(key, request)
    }

    try {
      const profile = await request
      if (props.item.actor?.id === actorId) {
        profileAvatar.value = profile.avatar
        profileName.value = profile.name
      }
    } catch {
      profileRequests.delete(key)
    }
  },
  { immediate: true },
)

const name = computed(() => props.item.actor?.name?.trim() || profileName.value || '')
const image = computed(() => imageFailed.value ? '' : props.item.actor?.avatar || profileAvatar.value)
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)] font-semibold text-[var(--accent-strong)]"
    :class="compact ? 'h-11 w-11 text-xs' : 'h-12 w-12 text-sm'"
  >
    <img
      v-if="image"
      :src="image"
      :alt="name || 'Notification sender'"
      loading="lazy"
      decoding="async"
      class="h-full w-full object-cover object-center"
      @error="imageFailed = true"
    />
    <span v-else-if="name">{{ getInitials(name) }}</span>
    <UserRound v-else class="h-5 w-5" aria-hidden="true" />
  </span>
</template>
