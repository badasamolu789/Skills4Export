import { slugify } from '@/utils/slugify'
import type { QuestionPost } from '@/data/feedPosts'
import type { QuestionRecord } from '@/services/questions'
import type { MyProfileData } from '@/services/users'

const getStringValue = (...values: Array<string | null | undefined>) =>
  values.find((value) => typeof value === 'string' && value.trim())?.trim() ?? ''

export const getQuestionUserId = (question: QuestionRecord) =>
  getStringValue(question.userId, question.user_id, question.user?.id)

export const getQuestionCommunityId = (question: QuestionRecord) =>
  getStringValue(question.communityId, question.community_id)

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
  const profileName = getStringValue(
    author?.profile?.username,
    (author?.profile as { name?: string; displayName?: string } | undefined)?.name,
    (author?.profile as { name?: string; displayName?: string } | undefined)?.displayName,
  )
  const userName = getStringValue(
    author?.user?.username,
    (author?.user as { name?: string; displayName?: string } | undefined)?.name,
    (author?.user as { name?: string; displayName?: string } | undefined)?.displayName,
    question.user?.username,
    question.user?.name,
  )
  const emailName = author?.user?.email?.split('@')[0]?.trim()
  const embeddedEmailName = question.user?.email?.split('@')[0]?.trim()
  const userId = getQuestionUserId(question)

  return profileName || userName || emailName || embeddedEmailName || (userId ? 'Community member' : 'Member')
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

export const mapApiQuestionToFeedPost = (
  question: QuestionRecord,
  author?: MyProfileData | null,
): QuestionPost => {
  const authorName = getAuthorName(question, author)
  const userId = getQuestionUserId(question)
  const communityId = getQuestionCommunityId(question)
  const createdAt = getQuestionCreatedAt(question)
  const updatedAt = getQuestionUpdatedAt(question)

  return {
    type: 'question',
    apiId: question.id,
    userId,
    communityId,
    communityName: communityId ? 'Community question' : 'Everyone',
    createdAt,
    updatedAt,
    slug: question.id || slugify(question.title),
    title: question.title,
    body: question.body,
    time: formatQuestionTime(createdAt),
    authorName,
    authorTo: userId ? `/profile/view/${userId}` : '/profile',
    tag: getAuthorTag(author),
    answers: question.answers?.length ?? 0,
  }
}
