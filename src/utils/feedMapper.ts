import { slugify } from '@/utils/slugify'
import type { FeedPost } from '@/data/feedPosts'
import type { CompactFeedMedia, CompactFeedRecord } from '@/services/feeds'
import { getCommunityLineAwesomeClass } from '@/utils/communityIcon'
import { getOptionalCount, isVideoPostMedia } from '@/utils/postMapper'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readString = (source: unknown, keys: string[]) => {
  if (!isRecord(source)) {
    return ''
  }

  for (const key of keys) {
    const value = source[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return ''
}

const readBoolean = (...values: unknown[]) => {
  const value = values.find((item) => item !== undefined && item !== null && item !== '')

  return value === true ||
    value === 1 ||
    String(value ?? '').trim().toLowerCase() === 'true' ||
    String(value ?? '').trim() === '1'
}

const formatFeedTime = (value?: string | null) => {
  if (!value) {
    return 'Just now'
  }

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

const getInitials = (value: string) =>
  value
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const getAuthorSkills = (author: unknown) => {
  const rawSkills = isRecord(author) && Array.isArray(author.skills) ? author.skills : []

  return rawSkills
    .map((skill) => {
      if (typeof skill === 'string') {
        return skill.trim()
      }

      return readString(skill, ['name', 'skill', 'skillName', 'skill_name', 'title', 'label'])
    })
    .filter((skill) => skill && skill.toLowerCase() !== 'skills4export member')
    .slice(0, 3)
    .join(' | ')
}

const normalizeMediaItem = (
  value: CompactFeedMedia,
  feedId: string,
  index: number,
) => {
  const url = readString(value, ['url', 'mediaUrl', 'media_url', 'secureUrl', 'secure_url'])

  if (!url) {
    return null
  }

  const mediaType =
    readString(value, ['type', 'mediaType', 'media_type', 'resourceType', 'resource_type']) ||
    (isVideoPostMedia({ url }) ? 'video' : 'image')

  return {
    id: readString(value, ['id', 'assetId', 'asset_id']) || `${feedId}-media-${index}`,
    url,
    thumbnailUrl: readString(value, ['thumbnailUrl', 'thumbnail_url', 'thumbnail']),
    mediaType,
    displayOrder: getOptionalCount(value.displayOrder, value.display_order, index),
  }
}

export const mapCompactFeedItemToFeedPost = (item: CompactFeedRecord): FeedPost => {
  const itemType = String(item.type || '').toLowerCase()
  const id = item.id
  const createdAt = item.createdAt || item.created_at || ''
  const updatedAt = item.updatedAt || item.updated_at || createdAt
  const author = item.author || item.user || null
  const viewerState = item.viewerState || item.viewer_state || null
  const userId = item.userId || item.user_id || author?.id || ''
  const communityId = item.communityId || item.community_id || item.community?.id || null
  const pageId = item.pageId || item.page_id || item.page?.id || null
  const title = item.title || ''
  const media = (item.media ?? [])
    .map((mediaItem, index) => normalizeMediaItem(mediaItem, id, index))
    .filter((mediaItem): mediaItem is NonNullable<typeof mediaItem> => Boolean(mediaItem))
    .sort((first, second) => (first.displayOrder ?? 0) - (second.displayOrder ?? 0))

  if (itemType === 'question') {
    const authorName = readString(author, ['name', 'displayName', 'display_name', 'username']) || 'Community member'

    return {
      type: 'question',
      apiId: id,
      userId,
      communityId,
      createdAt,
      updatedAt,
      slug: id || slugify(title),
      communityName: communityId ? item.community?.name || '' : 'Everyone',
      communityIconClass: item.community
        ? getCommunityLineAwesomeClass({
          ...item.community,
          id: item.community.id || communityId || '',
          name: item.community.name || '',
          description: '',
        })
        : 'las la-users',
      title,
      body: item.body || item.content || item.description || '',
      time: formatFeedTime(createdAt),
      authorName,
      authorTo: userId ? `/profile/view/${userId}` : '/profile',
      authorAvatarSrc: readString(author, ['avatar', 'avatarUrl', 'avatar_url']) || null,
      tag: getAuthorSkills(author),
      answers: getOptionalCount(item.answersCount, item.answers_count, item.answer_count),
      score: getOptionalCount(item.score),
      isFollowing: readBoolean(viewerState?.isFollowing, viewerState?.is_following),
      isSaved: readBoolean(viewerState?.isSaved, viewerState?.is_saved, item.isSaved, item.is_saved),
      isScored: readBoolean(viewerState?.isScored, viewerState?.is_scored, item.isLiked, item.is_liked),
    }
  }

  const pageName = readString(item.page, ['name', 'displayName', 'display_name', 'title'])
  const authorName =
    pageId
      ? pageName || readString(author, ['name', 'displayName', 'display_name', 'username'])
      : readString(author, ['name', 'displayName', 'display_name', 'username'])
  const avatarSrc = pageId
    ? readString(item.page, ['avatar', 'avatarUrl', 'avatar_url', 'logo', 'logoUrl', 'logo_url']) || null
    : readString(author, ['avatar', 'avatarUrl', 'avatar_url']) || null
  const firstImage = media.find((mediaItem) => !isVideoPostMedia(mediaItem))

  return {
    type: communityId ? 'community' : 'personal',
    apiId: id,
    userId,
    communityId,
    communityName: communityId ? item.community?.name || '' : undefined,
    pageId,
    createdAt,
    updatedAt,
    slug: id || slugify(title),
    author: {
      name: authorName || 'Community member',
      to: pageId ? `/pages/${item.page?.slug || pageId}/public` : `/profile/view/${userId}`,
      avatarText: getInitials(authorName || 'Community member'),
      avatarSrc,
      tag: pageId ? '' : getAuthorSkills(author),
    },
    time: formatFeedTime(createdAt),
    title,
    description: item.content || item.body || item.description || '',
    imageSrc: firstImage?.thumbnailUrl || firstImage?.url || '',
    imageAlt: title,
    media,
    score: getOptionalCount(item.score),
    comments: getOptionalCount(item.commentsCount, item.comments_count, item.comment_count),
    isFollowing: pageId
      ? readBoolean(item.page?.isFollow, item.page?.is_follow, viewerState?.isFollowing, viewerState?.is_following)
      : readBoolean(viewerState?.isFollowing, viewerState?.is_following),
    isSaved: readBoolean(viewerState?.isSaved, viewerState?.is_saved, item.isSaved, item.is_saved),
    isScored: readBoolean(viewerState?.isScored, viewerState?.is_scored, item.isLiked, item.is_liked),
  }
}
