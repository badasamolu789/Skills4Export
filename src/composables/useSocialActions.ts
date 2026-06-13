import { computed } from 'vue'
import { useSocialActionsStore } from '@/stores/socialActions'

export const useSocialActions = () => {
  const store = useSocialActionsStore()

  const forContent = (
    contentId: () => string,
    authorId: () => string,
    type: () => 'post' | 'question',
  ) => ({
    isFollowing: computed(() => store.isFollowingUser(authorId())),
    isScored: computed(() => store.isContentScored(contentId())),
    score: computed(() => store.getScoreCount(contentId())),
    isFollowLoading: computed(() => Boolean(store.loadingActions[`follow:${authorId()}`])),
    isScoreLoading: computed(() => Boolean(store.loadingActions[`score:${contentId()}`])),
    toggleFollow: () => store.toggleUserFollow(authorId()),
    toggleScore: () => store.toggleContentScore(contentId(), type()),
  })

  return {
    store,
    forContent,
  }
}
