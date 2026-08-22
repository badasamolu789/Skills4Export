import type { FeedPost } from '@/data/feedPosts'

export type RelationshipTarget =
  | { type: 'user'; id: string }
  | { type: 'page'; id: string }
  | { type: 'community'; id: string }

export const resolveFeedRelationshipTarget = (
  post: FeedPost,
  options: { followQuestionAuthor?: boolean } = {},
): RelationshipTarget | null => {
  if (post.type === 'question' && post.communityId && !options.followQuestionAuthor) {
    return { type: 'community', id: post.communityId }
  }

  if (post.pageId) {
    return { type: 'page', id: post.pageId }
  }

  if (post.userId) {
    return { type: 'user', id: post.userId }
  }

  return null
}
