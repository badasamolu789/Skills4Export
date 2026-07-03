import { slugify } from '@/utils/slugify'
import type { QuestionPost } from '@/data/feedPosts'
import type { CommunityRecord } from '@/services/communities'
import type { QuestionRecord } from '@/services/questions'
import type { MyProfileData } from '@/services/users'
import { getOptionalCount } from '@/utils/postMapper'
import { getDisplayName } from '@/utils/displayName'
import { getCommunityLineAwesomeClass } from '@/utils/communityIcon'
import { getProfileContextTag } from '@/utils/profileContextTag'

const getStringValue = (...values: Array<string | null | undefined>) =>
  values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? ''

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

const readRecord = (source: unknown, keys: string[]) => {
  if (!isRecord(source)) {
    return null
  }

  for (const key of keys) {
    const value = source[key]

    if (isRecord(value)) {
      return value
    }
  }

  return null
}

export const getQuestionUserId = (question: QuestionRecord) =>
  getStringValue(question.userId, question.user_id, question.user?.id, question.asker?.id)

export const getQuestionCommunityId = (question: QuestionRecord) =>
  getStringValue(question.communityId, question.community_id, question.community?.id)

export const getQuestionCreatedAt = (question: QuestionRecord) =>
  getStringValue(question.createdAt, question.created_at, question.updatedAt, question.updated_at)

const getQuestionUpdatedAt = (question: QuestionRecord) =>
  getStringValue(question.updatedAt, question.updated_at, question.createdAt, question.created_at)

const formatQuestionTime = (value?: string) => {
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

const getAuthorName = (question: QuestionRecord, author?: MyProfileData | null) => {
  const profileRecord = author?.profile as Record<string, unknown> | null | undefined
  const questionUser = isRecord(question.user) ? question.user : null
  const questionAsker = isRecord(question.asker) ? question.asker : null
  const questionAuthor = readRecord(question, ['author', 'creator', 'owner'])
  const questionProfile =
    readRecord(question, ['profile', 'userProfile', 'user_profile']) ??
    readRecord(questionUser, ['profile', 'userProfile', 'user_profile'])
  const profileName = getDisplayName(
    author?.user?.name?.trim() ||
      '',
    author?.profile?.displayName?.trim(),
    typeof profileRecord?.display_name === 'string' ? profileRecord.display_name.trim() : '',
    typeof profileRecord?.name === 'string' ? profileRecord.name.trim() : '',
    author?.profile?.username?.trim(),
    author?.user?.username?.trim(),
  )
  const userName = getDisplayName(
    questionUser?.name as string | undefined,
    readString(questionUser, ['displayName', 'display_name']),
    readString(questionProfile, ['displayName', 'display_name', 'name']),
    readString(questionAuthor, ['name', 'displayName', 'display_name', 'username']),
    questionUser?.username as string | undefined,
    questionAsker?.name as string | undefined,
    questionAsker?.username as string | undefined,
    readString(question, ['authorName', 'author_name', 'userName', 'user_name', 'displayName', 'display_name', 'name']),
  )

  return profileName || userName
}

const getAuthorTag = (author?: MyProfileData | null) => {
  const profileRecord = author?.profile as Record<string, unknown> | null | undefined
  const rawSkills = author?.skills ?? (Array.isArray(profileRecord?.skills) ? profileRecord.skills : [])
  const skills = rawSkills
    ?.map((skill) => {
      if (typeof skill === 'string') {
        return skill.trim()
      }

      const skillRecord = skill as Record<string, unknown>
      const value =
        skillRecord.name ||
        skillRecord.skill ||
        skillRecord.skillName ||
        skillRecord.skill_name ||
        skillRecord.title ||
        skillRecord.label

      return typeof value === 'string' ? value.trim() : ''
    })
    .filter((skill) => skill && skill.toLowerCase() !== 'skills4export member')
    .slice(0, 3) ?? []

  return skills.join(' | ') || getProfileContextTag(author)
}

export const mapApiQuestionToFeedPost = (
  question: QuestionRecord,
  author?: MyProfileData | null,
  communityName?: string,
  community?: CommunityRecord | null,
): QuestionPost => {
  const authorName = getAuthorName(question, author)
  const userId = getQuestionUserId(question)
  const communityId = getQuestionCommunityId(question)
  const embeddedCommunity = question.community
    ? {
      id: question.community.id || communityId,
      name: question.community.name || communityName || '',
      description: question.community.description || '',
      icon: question.community.icon,
      iconName: question.community.iconName,
      icon_name: question.community.icon_name,
      iconClass: question.community.iconClass,
      icon_class: question.community.icon_class,
    } as CommunityRecord
    : null
  const iconCommunity = community || embeddedCommunity
  const createdAt = getQuestionCreatedAt(question)
  const updatedAt = getQuestionUpdatedAt(question)
  const answerCount = Math.max(
    getOptionalCount(
      question.answers_count,
      question.answer_count,
      question.answersCount,
    ),
    Array.isArray(question.answers) ? question.answers.length : 0,
  )

  return {
    type: 'question',
    apiId: question.id,
    userId,
    communityId,
    communityName: communityId ? communityName || question.community?.name || '' : 'Everyone',
    communityIconClass: iconCommunity ? getCommunityLineAwesomeClass(iconCommunity) : 'las la-users',
    createdAt,
    updatedAt,
    slug: question.id || slugify(question.title),
    title: question.title,
    body: question.body,
    time: formatQuestionTime(createdAt),
    authorName,
    authorTo: userId ? `/profile/view/${userId}` : '/profile',
    authorAvatarSrc: author?.profile?.avatar ?? null,
    tag: getAuthorTag(author),
    answers: answerCount,
    score: getOptionalCount(
      question.score,
      question.reactions_count,
      question.reaction_count,
      question.reactionsCount,
      question.likes_count,
      question.likesCount,
    ),
    isSaved: Boolean(question.is_saved),
    isScored: Boolean(question.is_liked),
  }
}
