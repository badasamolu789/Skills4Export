import { slugify } from '@/utils/slugify'
import type { FeedPost } from '@/data/feedPosts'
import type { PostMediaRecord, PostRecord } from '@/services/posts'
import type { MyProfileData } from '@/services/users'

const formatPostTime = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const getInitials = (value: string) => {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'CM'
}

const getAuthorName = (post: PostRecord, author?: MyProfileData | null) => {
  const profileName = author?.profile?.username?.trim()
  const userName = author?.user?.username?.trim()
  const emailName = author?.user?.email?.split('@')[0]?.trim()

  return profileName || userName || emailName || (post.user_id ? 'Community member' : 'Member')
}

const getAuthorTag = (author?: MyProfileData | null) => {
  const title = author?.experiences?.find((item) => item.title?.trim())?.title?.trim()
  const skills = author?.skills
    ?.map((skill) => (skill.name || skill.skill || '').trim())
    .filter(Boolean)
    .slice(0, 3) ?? []
  const parts = [title, ...skills].filter(Boolean)

  return parts.length ? parts.join(' | ') : 'Skills4Export member'
}

const getOptionalCount = (...values: Array<number | undefined>) => {
  return values.find((value) => typeof value === 'number' && Number.isFinite(value)) ?? 0
}

export const mapApiPostToFeedPost = (
  post: PostRecord,
  media: PostMediaRecord[] = [],
  author?: MyProfileData | null,
): FeedPost => {
  const imageMedia = media
    .filter((item) => item.url)
    .sort((a, b) => a.display_order - b.display_order)

  const authorName = getAuthorName(post, author)
  const authorProfile = {
    name: authorName,
    to: `/profile/view/${post.user_id}`,
    avatarText: getInitials(authorName),
    avatarSrc: author?.profile?.avatar ?? null,
  }

  const basePost = {
    type: post.community_id ? 'community' : 'personal',
    apiId: post.id,
    userId: post.user_id,
    communityId: post.community_id,
    communityName: post.community_id ? 'Community post' : undefined,
    pageId: post.page_id,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    slug: post.id || slugify(post.title),
    time: formatPostTime(post.created_at),
    title: post.title,
    description: post.content,
    imageSrc: imageMedia[0]?.thumbnail_url || imageMedia[0]?.url || '',
    imageAlt: post.title,
    media: imageMedia.map((item) => ({
      id: item.id,
      url: item.url,
      thumbnailUrl: item.thumbnail_url,
      mediaType: item.media_type,
      displayOrder: item.display_order,
    })),
    score: getOptionalCount(post.score, post.reactions_count, post.reaction_count),
    comments: getOptionalCount(post.comments_count, post.comment_count, post.commentsCount),
  }

  if (post.community_id) {
    return {
      ...basePost,
      type: 'community',
      author: {
        ...authorProfile,
        tag: getAuthorTag(author),
      },
    }
  }

  return {
    ...basePost,
    type: 'personal',
    author: {
      ...authorProfile,
      tag: getAuthorTag(author),
    },
  }
}
