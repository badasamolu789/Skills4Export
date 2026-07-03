import { slugify } from '@/utils/slugify'
import type { FeedPost } from '@/data/feedPosts'
import type { PageRecord } from '@/services/pages'
import type { PostMediaRecord, PostRecord } from '@/services/posts'
import type { MyProfileData } from '@/services/users'
import { getDisplayName } from '@/utils/displayName'
import { getProfileContextTag } from '@/utils/profileContextTag'

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
    .toUpperCase()
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getStringValue = (source: unknown, keys: string[]) => {
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

const getNestedRecord = (source: unknown, key: string) => {
  if (!isRecord(source)) {
    return null
  }

  const value = source[key]
  return isRecord(value) ? value : null
}

const firstNestedRecord = (source: unknown, keys: string[]) => {
  for (const key of keys) {
    const value = getNestedRecord(source, key)

    if (value) {
      return value
    }
  }

  return null
}

export const getPostUserId = (post: PostRecord) =>
  getStringValue(post, ['user_id', 'userId', 'authorId', 'author_id']) ||
  getStringValue(post.user, ['id', 'userId', 'user_id'])

const getAuthorName = (post: PostRecord, author?: MyProfileData | null) => {
  const authorRecord = isRecord(author) ? author : null
  const authorUser = getNestedRecord(author, 'user')
  const authorProfile = getNestedRecord(author, 'profile') ?? authorRecord
  const postUser = isRecord(post.user) ? post.user : null
  const postAuthor = firstNestedRecord(post, ['author', 'creator', 'owner'])
  const postProfile =
    firstNestedRecord(post, ['profile', 'userProfile', 'user_profile']) ??
    firstNestedRecord(postUser, ['profile', 'userProfile', 'user_profile'])

  return getDisplayName(
    getStringValue(authorUser, ['name', 'displayName', 'display_name']),
    getStringValue(authorProfile, ['displayName', 'display_name', 'name']),
    getStringValue(authorRecord, ['displayName', 'display_name', 'name']),
    getStringValue(postProfile, ['displayName', 'display_name', 'name']),
    getStringValue(postAuthor, ['name', 'displayName', 'display_name', 'username']),
    getStringValue(postUser, ['name', 'displayName', 'display_name']),
    getStringValue(post, ['authorName', 'author_name', 'userName', 'user_name', 'displayName', 'display_name', 'name']),
    getStringValue(authorUser, ['username']),
    getStringValue(authorProfile, ['username']),
    getStringValue(authorRecord, ['username']),
    getStringValue(postProfile, ['username']),
    getStringValue(postUser, ['username']),
    getStringValue(post, ['username']),
  )
}

const getAuthorTag = (author?: MyProfileData | null) => {
  const authorRecord = isRecord(author) ? author : null
  const profileRecord = getNestedRecord(author, 'profile') ?? authorRecord
  const rawSkills = Array.isArray(author?.skills)
    ? author.skills
    : Array.isArray(profileRecord?.skills)
      ? profileRecord.skills
      : []

  const skills = rawSkills
    .map((skill) => {
      if (typeof skill === 'string') {
        return skill.trim()
      }

      return getStringValue(skill, ['name', 'skill', 'skillName', 'skill_name', 'title', 'label'])
    })
    .filter((skill) => skill && skill.toLowerCase() !== 'skills4export member')
    .slice(0, 3)

  return skills.join(' | ') || getProfileContextTag(author)
}

const getAuthorAvatar = (post: PostRecord, author?: MyProfileData | null) => {
  const authorRecord = isRecord(author) ? author : null
  const profileRecord = getNestedRecord(author, 'profile') ?? authorRecord
  const postUser = isRecord(post.user) ? post.user : null
  const postProfile =
    firstNestedRecord(post, ['profile', 'userProfile', 'user_profile']) ??
    firstNestedRecord(postUser, ['profile', 'userProfile', 'user_profile'])
  const avatarKeys = [
    'avatar',
    'avatarUrl',
    'avatar_url',
    'profileImage',
    'profile_image',
    'profilePhoto',
    'profile_photo',
  ]

  return (
    getStringValue(profileRecord, avatarKeys) ||
    getStringValue(postProfile, avatarKeys) ||
    getStringValue(postUser, avatarKeys) ||
    getStringValue(post, avatarKeys) ||
    null
  )
}

const getPageTag = (page?: PostRecord['page'] | PageRecord | null) => {
  if (!page) {
    return ''
  }

  const pageRecord = isRecord(page) ? page : null
  const pageType = getStringValue(pageRecord, ['type', 'pageType', 'page_type']).toLowerCase()

  if (pageType === 'business' || pageType === 'student') {
    return `${pageType[0]?.toUpperCase()}${pageType.slice(1)} page`
  }

  return ''
}

export const getOptionalCount = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string' && value.trim()) {
      const numberValue = Number(value)

      if (Number.isFinite(numberValue)) {
        return numberValue
      }
    }
  }

  return 0
}

export const getPostCommunityId = (post: PostRecord) => post.community_id || post.communityId || null

export const isVideoPostMedia = (media?: { mediaType?: string; media_type?: string; url?: string } | null) => {
  const mediaType = String(media?.mediaType || media?.media_type || '').toLowerCase()
  const url = media?.url || ''
  return mediaType.includes('video') || /\/video\/upload\/|\.(mp4|webm|mov|m4v)(?:[?#]|$)/i.test(url)
}

const normalizePostMediaItem = (
  value: unknown,
  postId: string,
  index: number,
): PostMediaRecord | null => {
  if (typeof value === 'string') {
    const url = value.trim()

    return url
      ? {
          id: `${postId}-media-${index}`,
          post_id: postId,
          media_type: isVideoPostMedia({ url }) ? 'video' : 'image',
          url,
          thumbnail_url: '',
          display_order: index,
        }
      : null
  }

  if (!isRecord(value)) {
    return null
  }

  const nestedAsset = firstNestedRecord(value, ['asset', 'mediaAsset', 'media_asset'])
  const source = nestedAsset ? { ...nestedAsset, ...value } : value
  const url = getStringValue(source, [
    'url',
    'secure_url',
    'secureUrl',
    'media_url',
    'mediaUrl',
    'path',
    'file_path',
    'filePath',
  ])

  if (!url) {
    return null
  }

  const mediaType =
    getStringValue(source, ['media_type', 'mediaType', 'kind', 'type', 'resource_type', 'resourceType']) ||
    (isVideoPostMedia({ url }) ? 'video' : 'image')
  const displayOrder = getOptionalCount(source.display_order, source.displayOrder, index)

  return {
    id: getStringValue(source, ['id', 'assetId', 'asset_id', 'mediaId', 'media_id']) || `${postId}-media-${index}`,
    post_id: getStringValue(source, ['post_id', 'postId']) || postId,
    media_type: mediaType,
    url,
    thumbnail_url: getStringValue(source, ['thumbnail_url', 'thumbnailUrl', 'thumbnail']),
    display_order: displayOrder,
  }
}

const getEmbeddedPostMedia = (post: PostRecord) => {
  const candidates = [
    post.media_path,
    post.mediaPath,
    post.file_path,
    post.filePath,
    post.media,
    post.attachments,
  ]

  return candidates
    .flatMap((value) => Array.isArray(value) ? value : [])
    .map((value, index) => normalizePostMediaItem(value, post.id, index))
    .filter((item): item is PostMediaRecord => Boolean(item))
}

export const mapApiPostToFeedPost = (
  post: PostRecord,
  media: PostMediaRecord[] = [],
  author?: MyProfileData | null,
  communityName?: string,
  page?: PostRecord['page'] | PageRecord | null,
): FeedPost => {
  const normalizedMedia = media
    .map((item, index) => normalizePostMediaItem(item, post.id, index))
    .filter((item): item is PostMediaRecord => Boolean(item))
  const mediaByUrl = new Map<string, PostMediaRecord>()

  ;[...getEmbeddedPostMedia(post), ...normalizedMedia].forEach((item) => {
    mediaByUrl.set(item.url, item)
  })

  const imageMedia = Array.from(mediaByUrl.values())
    .sort((a, b) => a.display_order - b.display_order)

  const authorName = getAuthorName(post, author)
  const postUserId = getPostUserId(post)
  const postCommunity = isRecord(post.community) ? post.community : null
  const resolvedCommunityName = communityName || getStringValue(postCommunity, ['name', 'title', 'communityName', 'community_name']) || ''
  const postPageId = post.pageId || post.page_id || getStringValue(post.page, ['id'])
  const resolvedPage = page || post.page
  const pageAuthorName = getStringValue(resolvedPage, [
    'name',
    'displayName',
    'display_name',
    'title',
    'pageName',
    'page_name',
    'businessName',
    'business_name',
    'studentName',
    'student_name',
  ])
  const resolvedAuthorName = postPageId ? pageAuthorName : authorName
  const authorProfile = {
    name: resolvedAuthorName,
    to: postPageId ? `/pages/${resolvedPage?.slug || postPageId}/public` : `/profile/view/${postUserId}`,
    avatarText: getInitials(resolvedAuthorName),
    avatarSrc: postPageId
      ? getStringValue(resolvedPage, ['avatar', 'avatarUrl', 'avatar_url', 'logo', 'logoUrl', 'logo_url']) || null
      : getAuthorAvatar(post, author),
  }
  const authorTag = postPageId ? getPageTag(resolvedPage) : getAuthorTag(author)
  const isFollowingAuthor = postPageId
    ? Boolean(resolvedPage?.is_follow ?? resolvedPage?.isFollow)
    : Boolean(post.is_follow)

  const basePost = {
    type: getPostCommunityId(post) ? 'community' : 'personal',
    apiId: post.id,
    userId: postUserId,
    communityId: getPostCommunityId(post),
    communityName: getPostCommunityId(post) ? resolvedCommunityName : undefined,
    pageId: postPageId,
    originalPostId: post.originalPostId || post.parent_post_id || null,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    slug: post.id || slugify(post.title),
    time: formatPostTime(post.created_at),
    title: post.title,
    description: post.content,
    imageSrc: imageMedia.find((item) => !isVideoPostMedia(item))?.thumbnail_url ||
      imageMedia.find((item) => !isVideoPostMedia(item))?.url ||
      '',
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
    isSaved: Boolean(post.is_saved),
    isScored: Boolean(post.is_liked),
    isFollowing: isFollowingAuthor,
  }

  if (getPostCommunityId(post)) {
    return {
      ...basePost,
      type: 'community',
      author: {
        ...authorProfile,
        tag: authorTag,
      },
    }
  }

  return {
    ...basePost,
    type: 'personal',
    author: {
      ...authorProfile,
      tag: authorTag,
    },
  }
}
