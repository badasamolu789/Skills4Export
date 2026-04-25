<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowUp,
  Bookmark,
  Check,
  Users,
  Copy,
  Flag,
  MessageSquare,
  MoreHorizontal,
  Reply,
  Share2,
  X,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { FeedPost } from '@/data/feedPosts'
import { getSeededPublicProfile } from '@/data/publicProfiles'
type PostComment = {
  id: number
  author: string
  time: string
  tag: string
  body: string
  score: number
  isScored: boolean
  isFollowing: boolean
  isReplying: boolean
  replyInput: string
  replies: {
    id: number
    author: string
    time: string
    body: string
  }[]
}

const props = defineProps<{
  post: FeedPost
}>()

const isFollowing = ref(props.post.isFollowing ?? false)
const isSaved = ref(false)
const isScored = ref(false)
const currentScore = ref('score' in props.post ? props.post.score : 0)
const isCommentModalOpen = ref(false)
const isShareModalOpen = ref(false)
const isReportModalOpen = ref(false)
const isPostMenuOpen = ref(false)
const commentInput = ref('')
const currentComments = ref('comments' in props.post ? props.post.comments : 0)
const commentList = ref<PostComment[]>([
  {
    id: 1,
    author: 'Eric Bawa',
    time: '8 hours ago',
    tag: 'Psychologist | CSS3 | Java | Project Mgt.',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    score: 0,
    isScored: false,
    isFollowing: false,
    isReplying: false,
    replyInput: '',
    replies: [],
  },
  {
    id: 2,
    author: 'Kevin Martin',
    time: '8 hours ago',
    tag: 'Psychologist | CSS3 | Java | Project Mgt.',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
    score: 0,
    isScored: false,
    isFollowing: false,
    isReplying: false,
    replyInput: '',
    replies: [],
  },
  {
    id: 3,
    author: 'Aaron Aiken',
    time: '8 hours ago',
    tag: 'Psychologist | CSS3 | Java | Project Mgt.',
    body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.',
    score: 0,
    isScored: false,
    isFollowing: false,
    isReplying: false,
    replyInput: '',
    replies: [],
  },
])
const shareCommunity = ref('')
const shareComment = ref('')
const selectedReportReason = ref('Spam')
const reportTargetLabel = ref('this post')
const followLabel = computed(() => (isFollowing.value ? 'Following' : 'Follow'))
const activeActionClass =
  'border-[color:var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] hover:text-white'
const shareLink = computed(() => {
  const slugSource =
    props.post.type === 'question'
      ? `${props.post.communityName}-${props.post.title}`
      : `${props.post.author.name}-${props.post.title}`

  const slug = slugSource
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `https://www.skills4export.com/share/${slug}`
})
const sharePreviewAuthor = computed(() =>
  props.post.type === 'question' ? props.post.authorName : props.post.author.name,
)
const sharePreviewDescription = computed(() =>
  'description' in props.post ? props.post.description : '',
)
const sharePreviewImageSrc = computed(() => ('imageSrc' in props.post ? props.post.imageSrc : ''))
const sharePreviewImageAlt = computed(() =>
  'imageAlt' in props.post ? props.post.imageAlt || props.post.title : props.post.title,
)
const reportReasons = [
  'Misinformation',
  'Spam',
  'Threats/Violence',
  'Graphic content',
  'Sexual content',
  'Harassment and Bullying',
  'Illegal activities',
  'Sensitive and personal information',
  'Hate speech',
  'Suicide and Self-Harm',
  'Minor abuse',
  'Prohibited transactions',
  'Scam',
  'Copyright and Intellectual Property',
  'Invasion of privacy',
]
const reportReasonDescriptions: Record<string, string> = {
  Misinformation: 'Do not post misleading or false information that may cause harm or confusion.',
  Spam: 'Do not flood the community with repetitive, irrelevant, or deceptive promotional content.',
  'Threats/Violence': 'Do not share threats or encourage physical harm, violence, or intimidation.',
  'Graphic content': 'Do not post disturbing or excessively graphic media without proper context and safeguards.',
  'Sexual content': 'Do not post explicit sexual content or exploitative material.',
  'Harassment and Bullying': 'Do not target others with abuse, intimidation, humiliation, or repeated harassment.',
  'Illegal activities': 'Do not promote or coordinate unlawful acts, fraud, or criminal behavior.',
  'Sensitive and personal information': 'Do not expose private details such as addresses, phone numbers, or identity documents.',
  'Hate speech': 'Do not attack or dehumanize people based on identity, background, or protected characteristics.',
  'Suicide and Self-Harm': 'Do not post content that promotes or glorifies suicide or self-harm.',
  'Minor abuse': 'Do not post content that exploits, endangers, or sexualizes minors in any way.',
  'Prohibited transactions': 'Do not offer or request restricted goods, services, or unsafe financial transactions.',
  Scam: 'Do not impersonate, deceive, or manipulate users for money, data, or attention.',
  'Copyright and Intellectual Property': 'Do not share content that clearly violates copyright, trademark, or ownership rights.',
  'Invasion of privacy': 'Do not publish private conversations, images, or recordings without consent.',
}

const getPublicProfileIdFromRoute = (routeTarget: string) => {
  const match = routeTarget.match(/\/profile\/view\/([^/?#]+)/)
  return match?.[1] ?? ''
}

const authorRoute = computed(() =>
  props.post.type === 'question' ? props.post.authorTo : props.post.author.to,
)

const authorName = computed(() =>
  props.post.type === 'question' ? props.post.authorName : props.post.author.name,
)

const authorProfileDetails = computed(() => {
  const publicProfileId = getPublicProfileIdFromRoute(authorRoute.value)
  const publicProfile = publicProfileId ? getSeededPublicProfile(publicProfileId) : null

  if (!publicProfile) {
    return []
  }

  const details: string[] = []
  const jobTitle = publicProfile.experiences[0]?.title?.trim()
  const skillNames = publicProfile.skills
    .map((skill) => (skill.name || skill.skill || '').trim())
    .filter(Boolean)
    .slice(0, 3)

  if (jobTitle) {
    details.push(jobTitle)
  }

  details.push(...skillNames)

  return details
})

const authorMetaLine = computed(() => authorProfileDetails.value.join(' • '))

const toggleFollow = () => {
  isFollowing.value = !isFollowing.value
}

const toggleScore = () => {
  isScored.value = !isScored.value
  currentScore.value += isScored.value ? 1 : -1
}

const toggleSave = () => {
  isSaved.value = !isSaved.value

  toast.success(isSaved.value ? 'Post saved' : 'Post removed from saved', {
    description: isSaved.value
      ? 'This post is now in your saved list.'
      : 'This post has been removed from your saved list.',
  })
}

const openCommentModal = () => {
  isCommentModalOpen.value = true
}

const closeCommentModal = () => {
  isCommentModalOpen.value = false
  commentInput.value = ''
}

const submitComment = () => {
  const value = commentInput.value.trim()

  if (!value) {
    return
  }

  commentList.value.unshift({
    id: Date.now(),
    author: 'You',
    time: 'Just now',
    tag: 'Community Member',
    body: value,
    score: 0,
    isScored: false,
    isFollowing: false,
    isReplying: false,
    replyInput: '',
    replies: [],
  })
  currentComments.value += 1
  commentInput.value = ''

  toast.success('Comment added', {
    description: 'Your comment has been added to this post.',
  })
}

const openShareModal = () => {
  isShareModalOpen.value = true
}

const closeShareModal = () => {
  isShareModalOpen.value = false
}

const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    toast.success('Link copied', {
      description: 'The post link has been copied to your clipboard.',
    })
  } catch {
    toast.error('Unable to copy link', {
      description: 'Your browser blocked clipboard access. You can still copy the link manually.',
    })
  }
}

const submitShare = () => {
  toast.success('Post shared', {
    description: shareCommunity.value
      ? `Shared to ${shareCommunity.value}.`
      : 'Your share has been prepared successfully.',
  })
  closeShareModal()
}

const openReportModal = () => {
  reportTargetLabel.value = 'this post'
  isReportModalOpen.value = true
}

const togglePostMenu = () => {
  isPostMenuOpen.value = !isPostMenuOpen.value
}

const handleMobileSave = () => {
  toggleSave()
  isPostMenuOpen.value = false
}

const handleMobileReport = () => {
  openReportModal()
  isPostMenuOpen.value = false
}

const closeReportModal = () => {
  isReportModalOpen.value = false
}

const submitReport = () => {
  toast.success('Report submitted', {
    description: `Thanks for reporting ${reportTargetLabel.value} under ${selectedReportReason.value}.`,
  })
  closeReportModal()
}

const toggleCommentScore = (comment: PostComment) => {
  comment.isScored = !comment.isScored
  comment.score += comment.isScored ? 1 : -1
}

const toggleCommentFollow = (comment: PostComment) => {
  comment.isFollowing = !comment.isFollowing
}

const openCommentReportModal = (comment: PostComment) => {
  reportTargetLabel.value = `${comment.author}'s comment`
  isReportModalOpen.value = true
}

const toggleCommentReply = (comment: PostComment) => {
  comment.isReplying = !comment.isReplying
}

const submitCommentReply = (comment: PostComment) => {
  const value = comment.replyInput.trim()

  if (!value) {
    return
  }

  comment.replies.unshift({
    id: Date.now(),
    author: 'You',
    time: 'Just now',
    body: value,
  })
  comment.replyInput = ''
  comment.isReplying = false

  toast.success('Reply added', {
    description: `Your reply to ${comment.author} is now live.`,
  })
}
</script>

<template>
  <article
    class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4 shadow-[var(--shadow-elevated)] sm:p-5"
  >
    <template v-if="post.type === 'question'">
      <div class="min-w-0">
        <div>
          <div class="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span class="font-semibold text-[var(--accent-strong)]">Q.</span>
            <Users class="h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
            <span class="truncate">{{ post.communityName }}</span>
          </div>
          <RouterLink
            :to="`/posts/${post.slug}`"
            class="mt-3 block text-[1.22rem] font-semibold leading-tight text-[var(--text-primary)] transition hover:text-[var(--accent-strong)] sm:text-[1.4rem] lg:text-[1.55rem]"
          >
            {{ post.title }}
          </RouterLink>
          <div class="mt-3 flex min-w-0 items-center gap-2 text-sm leading-7 text-[var(--text-secondary)]">
            <RouterLink :to="authorRoute" class="shrink-0 font-semibold text-[var(--accent-strong)]">
              {{ authorName }}
            </RouterLink>
            <span v-if="authorMetaLine" class="min-w-0 truncate">
              • {{ authorMetaLine }}
            </span>
          </div>
          <p class="mt-1 text-sm leading-7 text-[var(--text-secondary)]">
            {{ post.time }}
          </p>
        </div>
      </div>

      <div class="mt-5 flex flex-wrap gap-1.5 sm:gap-2">
        <RouterLink
          :to="`/posts/${post.slug}`"
          class="inline-flex h-9 items-center rounded-[1rem] border border-[color:var(--border-soft)] px-3 text-[0.9rem] font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] sm:h-8.5 sm:px-3.5 sm:text-[0.84rem]"
        >
          View details
        </RouterLink>
        <button
          type="button"
          class="inline-flex h-9 items-center rounded-[1rem] border px-3 text-[0.9rem] font-medium transition sm:h-8.5 sm:px-3.5 sm:text-[0.84rem]"
          :class="
            isFollowing
              ? activeActionClass
              : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
          "
          @click="toggleFollow"
        >
          {{ followLabel }}
        </button>
        <span
          class="inline-flex h-9 items-center rounded-[1rem] border border-[color:var(--border-soft)] px-3 text-[0.9rem] font-medium text-[var(--text-secondary)] sm:h-8.5 sm:px-3.5 sm:text-[0.84rem]"
        >
          {{ post.answers }} Answers
        </span>
      </div>
    </template>

    <template v-else>
      <div class="space-y-4">
        <div class="flex items-start gap-3 sm:gap-4">
          <span
            class="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.6rem] border border-[color:var(--border-soft)] text-lg font-semibold text-[var(--accent-strong)] sm:h-18 sm:w-18"
          >
            {{ post.author.avatarText }}
          </span>

          <div class="min-w-0 flex-1">
            <div class="min-w-0">
              <div class="flex items-start gap-2">
                <div class="min-w-0 flex flex-1 items-center gap-2">
                  <RouterLink
                    :to="authorRoute"
                    class="shrink-0 text-base font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)] sm:text-lg"
                  >
                    {{ authorName }}
                  </RouterLink>
                  <span
                    v-if="authorMetaLine"
                    class="min-w-0 truncate text-sm text-[var(--text-secondary)]"
                  >
                    • {{ authorMetaLine }}
                  </span>
                </div>

                <div class="relative ml-auto sm:hidden">
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                    aria-label="More actions"
                    @click="togglePostMenu"
                  >
                    <MoreHorizontal class="h-4 w-4" />
                  </button>

                  <div
                    v-if="isPostMenuOpen"
                    class="absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[9rem] rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-2 shadow-[var(--shadow-elevated)]"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--accent-strong)]"
                      @click="handleMobileSave"
                    >
                      <Bookmark class="h-4 w-4" />
                      {{ isSaved ? 'Saved' : 'Save' }}
                    </button>
                    <button
                      type="button"
                      class="mt-1 flex w-full items-center gap-2 rounded-[0.8rem] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--accent-strong)]"
                      @click="handleMobileReport"
                    >
                      <Flag class="h-4 w-4" />
                      Report
                    </button>
                  </div>
                </div>
              </div>

              <div class="mt-2 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <div class="flex min-w-0 flex-1 items-center gap-2">
                  <button
                    type="button"
                    class="inline-flex h-9 shrink-0 items-center rounded-[1rem] border px-3 text-[0.9rem] font-medium transition sm:h-8.5 sm:px-3.5 sm:text-[0.84rem]"
                    :class="
                      isFollowing
                        ? activeActionClass
                        : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
                    "
                    @click="toggleFollow"
                  >
                    {{ followLabel }}
                  </button>
                  <span class="truncate">{{ post.time }}</span>
                </div>

                <div class="ml-auto flex items-center gap-2 self-start">
                  <RouterLink
                    v-if="post.type === 'community'"
                    :to="`/posts/${post.slug}`"
                    class="inline-flex h-9 shrink-0 items-center justify-center rounded-[1rem] border border-[color:var(--border-soft)] px-3 text-[0.9rem] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] sm:h-8.5 sm:px-3.5 sm:text-[0.84rem]"
                  >
                    View post
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="min-w-0">
          <RouterLink
            :to="`/posts/${post.slug}`"
            class="block text-[1.22rem] font-semibold leading-tight text-[var(--text-primary)] transition hover:text-[var(--accent-strong)] sm:text-[1.4rem] lg:text-[1.55rem]"
          >
            {{ post.title }}
          </RouterLink>
          <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.98rem] sm:leading-8">
            {{ post.description }}
          </p>

          <img
            :src="post.imageSrc"
            :alt="post.imageAlt || post.title"
            class="mt-5 h-52 w-full rounded-[1.25rem] object-cover sm:h-72 lg:h-80"
          />

          <div class="mt-5 flex flex-wrap gap-1.5 sm:gap-2">
            <button
              type="button"
              class="inline-flex h-9 items-center gap-1.5 rounded-[1rem] border px-2.5 text-[0.9rem] font-medium transition sm:h-8.5 sm:px-3 sm:text-[0.84rem]"
              :class="
                isScored
                  ? activeActionClass
                  : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
              "
              @click="toggleScore"
            >
              <ArrowUp class="h-3.5 w-3.5" />
              {{ currentScore }} score
            </button>
            <button
              type="button"
              class="inline-flex h-9 items-center gap-1.5 rounded-[1rem] border border-[color:var(--border-soft)] px-2.5 text-[0.9rem] font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] sm:h-8.5 sm:px-3 sm:text-[0.84rem]"
              @click="openShareModal"
            >
              <Share2 class="h-3.5 w-3.5" />
              Share
            </button>
            <button
              type="button"
              class="inline-flex h-9 items-center gap-1.5 rounded-[1rem] border border-[color:var(--border-soft)] px-2.5 text-[0.9rem] font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] sm:h-8.5 sm:px-3 sm:text-[0.84rem]"
              @click="openCommentModal"
            >
              <MessageSquare class="h-3.5 w-3.5" />
              {{ currentComments }}
            </button>
            <button
              type="button"
              class="hidden h-9 items-center gap-1.5 rounded-[1rem] border border-[color:var(--border-soft)] px-2.5 text-[0.9rem] font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)] sm:inline-flex sm:h-8.5 sm:px-3 sm:text-[0.84rem]"
              @click="handleMobileReport"
            >
              <Flag class="h-3.5 w-3.5" />
              Report
            </button>
            <button
              type="button"
              class="hidden h-9 items-center gap-1.5 rounded-[1rem] border px-2.5 text-[0.9rem] font-medium transition sm:inline-flex sm:h-8.5 sm:px-3 sm:text-[0.84rem]"
              :class="
                isSaved
                  ? activeActionClass
                  : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
              "
              @click="handleMobileSave"
            >
              <Bookmark class="h-3.5 w-3.5" />
              {{ isSaved ? 'Saved' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </article>

  <Teleport to="body">
    <div
      v-if="isCommentModalOpen"
      class="fixed inset-0 z-[120] flex items-end justify-center bg-[color:rgba(12,12,27,0.58)] px-0 pt-6 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
    >
      <div
        class="flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[1.6rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[0_32px_90px_rgba(12,12,27,0.28)] sm:max-h-[92vh] sm:rounded-[1.6rem]"
      >
        <div class="flex items-center justify-between border-b border-[color:var(--border-soft)] px-5 py-4 sm:px-6">
          <h2 class="text-[1.35rem] font-semibold text-[var(--text-primary)] sm:text-[1.45rem]">Comments</h2>
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="closeCommentModal"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div class="flex overflow-hidden rounded-[1rem] border border-[color:var(--border-soft)]">
            <input
              v-model="commentInput"
              type="text"
              placeholder="Comment..."
              class="h-13 min-w-0 flex-1 bg-[var(--surface-secondary)] px-4 text-sm text-[var(--text-primary)] outline-none"
              @keydown.enter.prevent="submitComment"
            />
            <button
              type="button"
              class="inline-flex items-center justify-center bg-[var(--text-secondary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--text-primary)]"
              @click="submitComment"
            >
              Add Comment
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center bg-[#d64a4a] px-5 text-sm font-semibold text-white transition hover:bg-[#be3d3d]"
              @click="closeCommentModal"
            >
              Cancel
            </button>
          </div>

          <div class="mt-6 space-y-6">
            <article
              v-for="comment in commentList"
              :key="`${comment.author}-${comment.time}-${comment.body}`"
              class="border-b border-[color:var(--border-soft)] pb-6"
            >
              <div class="flex items-start gap-4">
                <span
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-center text-[0.7rem] font-medium leading-tight text-[var(--text-tertiary)]"
                >
                  Image<br />
                  Loading
                </span>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span class="font-semibold text-[var(--text-primary)]">{{ comment.author }}</span>
                    <span>{{ comment.time }}</span>
                  </div>
                  <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ comment.tag }}</p>
                  <p class="mt-2 text-base leading-8 text-[var(--text-primary)]">{{ comment.body }}</p>

                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-[0.9rem] border px-3 py-2 text-sm font-medium transition"
                      :class="
                        comment.isScored
                          ? activeActionClass
                          : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
                      "
                      @click="toggleCommentScore(comment)"
                    >
                      <ArrowUp class="h-4 w-4" />
                      {{ comment.score }} score
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-[0.9rem] border border-[color:var(--border-soft)] px-3 py-2 text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                      @click="toggleCommentReply(comment)"
                    >
                      <Reply class="h-4 w-4" />
                      {{ comment.isReplying ? 'Cancel Reply' : 'Reply' }}
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-[0.9rem] border px-3 py-2 text-sm font-medium transition"
                      :class="
                        comment.isFollowing
                          ? activeActionClass
                          : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
                      "
                      @click="toggleCommentFollow(comment)"
                    >
                      <Check v-if="comment.isFollowing" class="h-4 w-4" />
                      {{ comment.isFollowing ? 'Following' : 'Follow' }}
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-[0.9rem] border border-[color:var(--border-soft)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                      @click="openCommentReportModal(comment)"
                    >
                      <Flag class="h-4 w-4" />
                      Report
                    </button>
                  </div>

                  <div v-if="comment.isReplying" class="mt-4 flex flex-col gap-3 rounded-[1rem] bg-[var(--surface-secondary)] p-4">
                    <textarea
                      v-model="comment.replyInput"
                      rows="3"
                      placeholder="Write your reply..."
                      class="w-full rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
                    />
                    <div class="flex justify-end gap-2">
                      <button
                        type="button"
                        class="inline-flex items-center justify-center rounded-[0.9rem] border border-[color:var(--border-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                        @click="toggleCommentReply(comment)"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center justify-center rounded-[0.9rem] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                        @click="submitCommentReply(comment)"
                      >
                        Reply
                      </button>
                    </div>
                  </div>

                  <div v-if="comment.replies.length" class="mt-4 space-y-3 rounded-[1rem] bg-[var(--surface-secondary)] p-4">
                    <article
                      v-for="reply in comment.replies"
                      :key="reply.id"
                      class="rounded-[0.9rem] bg-[var(--surface-primary)] p-3"
                    >
                      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <span class="font-semibold text-[var(--text-primary)]">{{ reply.author }}</span>
                        <span>{{ reply.time }}</span>
                      </div>
                      <p class="mt-2 text-sm leading-7 text-[var(--text-primary)]">{{ reply.body }}</p>
                    </article>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isShareModalOpen"
      class="fixed inset-0 z-[120] flex items-end justify-center bg-[color:rgba(12,12,27,0.58)] px-0 pt-6 backdrop-blur-sm sm:items-center sm:px-4 sm:py-6"
    >
      <div
        class="flex max-h-[90dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[1.6rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[0_32px_90px_rgba(12,12,27,0.28)] sm:max-h-[92vh] sm:rounded-[1.6rem]"
      >
        <div class="flex items-center justify-between border-b border-[color:var(--border-soft)] px-5 py-4 sm:px-6">
          <h2 class="text-[1.35rem] font-semibold text-[var(--text-primary)] sm:text-[1.45rem]">Share</h2>
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="closeShareModal"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div class="space-y-6">
            <div class="space-y-2">
              <p class="text-base font-semibold text-[var(--text-primary)]">Share a link to this Post</p>
              <div class="flex overflow-hidden rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)]">
                <input
                  :value="shareLink"
                  readonly
                  class="h-13 min-w-0 flex-1 bg-transparent px-4 text-sm text-[var(--text-primary)] outline-none"
                />
                <button
                  type="button"
                  class="inline-flex items-center gap-2 border-l border-[color:var(--border-soft)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
                  @click="copyShareLink"
                >
                  <Copy class="h-4 w-4" />
                  Copy
                </button>
              </div>
            </div>

            <div class="space-y-2 border-t border-[color:var(--border-soft)] pt-5">
              <p class="text-base font-semibold text-[var(--text-primary)]">Share within a community</p>
              <select
                v-model="shareCommunity"
                class="h-13 w-full rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
              >
                <option value="">Select a community</option>
                <option value="Design Community">Design Community</option>
                <option value="Tech Careers">Tech Careers</option>
                <option value="Opportunities Hub">Opportunities Hub</option>
                <option value="General Community">General Community</option>
              </select>
            </div>

            <div class="space-y-2">
              <textarea
                v-model="shareComment"
                rows="3"
                placeholder="Make comment here..."
                class="w-full rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
              />
            </div>

            <div class="rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4">
              <p class="text-[1.3rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.4rem]">
                {{ post.title }}
              </p>
              <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                {{ sharePreviewDescription }}
              </p>
              <div class="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <span class="font-semibold text-[var(--text-primary)]">{{ sharePreviewAuthor }}</span>
                <span>{{ post.time }}</span>
              </div>
              <img
                v-if="sharePreviewImageSrc"
                :src="sharePreviewImageSrc"
                :alt="sharePreviewImageAlt"
                class="mt-4 h-64 w-full rounded-[1rem] object-cover sm:h-80"
              />
            </div>
          </div>
        </div>

        <div class="shrink-0 border-t border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-5 py-4 sm:px-6">
          <div class="flex justify-end">
            <button
              type="button"
              class="inline-flex min-w-[9rem] items-center justify-center gap-2 rounded-[1rem] bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              @click="submitShare"
            >
              <span>Share</span>
              <ArrowUp class="h-4 w-4 rotate-45" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="isReportModalOpen"
      class="fixed inset-0 z-[120] flex items-center justify-center bg-[color:rgba(12,12,27,0.58)] px-4 py-6 backdrop-blur-sm"
    >
      <div
        class="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[0_32px_90px_rgba(12,12,27,0.28)]"
      >
        <div class="flex items-center justify-between border-b border-[color:var(--border-soft)] px-5 py-4 sm:px-6">
          <h2 class="text-[1.4rem] font-semibold text-[var(--text-primary)] sm:text-[1.5rem]">Submit A Report</h2>
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="closeReportModal"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <p class="max-w-3xl text-[1.15rem] leading-9 text-[var(--text-primary)]">
            Thank you for reporting to us posts that break the rules. Let us know which of the rules applies.
          </p>

          <button
            type="button"
            class="mt-4 inline-flex items-center rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
          >
            Review community rules
          </button>

          <div class="mt-8 flex flex-wrap gap-3">
            <button
              v-for="reason in reportReasons"
              :key="reason"
              type="button"
              class="inline-flex items-center rounded-[0.9rem] border px-4 py-2.5 text-sm font-semibold transition"
              :class="
                selectedReportReason === reason
                  ? 'border-[color:color-mix(in_srgb,var(--warning,#f59e0b)_45%,transparent)] bg-[color:rgba(245,158,11,0.14)] text-[var(--text-primary)]'
                  : 'border-[color:var(--border-soft)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
              "
              @click="selectedReportReason = reason"
            >
              {{ reason }}
            </button>
          </div>

          <div class="mt-8 rounded-[1.2rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-5">
            <div class="flex items-center gap-2">
              <Check class="h-5 w-5 text-[var(--accent-strong)]" />
              <h3 class="text-[1.35rem] font-semibold text-[var(--text-primary)]">{{ selectedReportReason }}:</h3>
            </div>
            <p class="mt-3 text-base leading-8 text-[var(--text-secondary)]">
              {{ reportReasonDescriptions[selectedReportReason] }}
            </p>
          </div>
        </div>

        <div class="shrink-0 border-t border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-5 py-4 sm:px-6">
          <div class="flex justify-end">
            <button
              type="button"
              class="inline-flex min-w-[9rem] items-center justify-center rounded-[1rem] bg-[#e23a47] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#c9313d]"
              @click="submitReport"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
