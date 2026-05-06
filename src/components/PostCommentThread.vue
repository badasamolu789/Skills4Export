<script setup lang="ts">
import { ArrowUp, Reply } from 'lucide-vue-next'

export type PostCommentThreadItem = {
  id: number | string
  parentId?: string | null
  author: string
  authorTo?: string
  avatarSrc?: string | null
  avatarText?: string
  time: string
  tag?: string
  body: string
  score?: number
  isScored?: boolean
  isFollowing?: boolean
  isReplying: boolean
  areRepliesOpen: boolean
  replyInput: string
  replies: PostCommentThreadItem[]
}

defineOptions({
  name: 'PostCommentThread',
})

defineProps<{
  comments: PostCommentThreadItem[]
  isSubmitting?: boolean
}>()

const emit = defineEmits<{
  toggleScore: [comment: PostCommentThreadItem]
  toggleReply: [comment: PostCommentThreadItem]
  submitReply: [comment: PostCommentThreadItem]
}>()

const activeActionClass =
  'border-[color:var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] hover:text-white'
</script>

<template>
  <div class="space-y-2 border-l-2 border-[color:var(--border-soft)] pl-3">
    <article
      v-for="comment in comments"
      :key="comment.id"
      class="py-1.5"
    >
      <div class="flex items-start gap-2.5">
        <RouterLink
          :to="comment.authorTo || '/profile'"
          class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-secondary)] text-[0.62rem] font-semibold text-[var(--text-tertiary)]"
        >
          <img
            v-if="comment.avatarSrc"
            :src="comment.avatarSrc"
            :alt="comment.author"
            class="h-full w-full object-cover"
          />
          <span v-else>{{ comment.avatarText || comment.author.split(' ').map((part) => part[0]).join('').slice(0, 2) }}</span>
        </RouterLink>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-1.5 text-[0.74rem] text-[var(--text-secondary)]">
            <RouterLink
              :to="comment.authorTo || '/profile'"
              class="font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
            >
              {{ comment.author }}
            </RouterLink>
            <span>{{ comment.time }}</span>
          </div>
          <p v-if="comment.tag" class="mt-0.5 text-[0.7rem] text-[var(--text-secondary)]">{{ comment.tag }}</p>
          <p class="mt-1.5 text-[0.8rem] leading-6 text-[var(--text-primary)]">{{ comment.body }}</p>
        </div>
      </div>

      <div class="mt-2 flex flex-wrap gap-1.5">
        <button
          v-if="typeof comment.score === 'number'"
          type="button"
          class="inline-flex items-center gap-1 rounded-[0.7rem] border px-2 py-1.5 text-[0.74rem] font-medium transition"
          :class="
            comment.isScored
              ? activeActionClass
              : 'border-[color:var(--border-soft)] text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'
          "
          @click="emit('toggleScore', comment)"
        >
          <ArrowUp class="h-3 w-3" />
          {{ comment.score }} score
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-[0.7rem] border border-[color:var(--border-soft)] px-2 py-1.5 text-[0.74rem] font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
          @click="emit('toggleReply', comment)"
        >
          <Reply class="h-3 w-3" />
          {{ comment.isReplying ? 'Cancel Reply' : 'Reply' }}
        </button>
      </div>

      <div v-if="comment.isReplying" class="mt-2 flex flex-col gap-2 border-l-2 border-[color:var(--border-soft)] pl-3">
        <textarea
          v-model="comment.replyInput"
          rows="3"
          placeholder="Write your reply..."
          class="w-full rounded-[0.7rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-[0.8rem] text-[var(--text-primary)] outline-none transition focus:border-[color:var(--accent-soft)]"
        />
        <div class="flex justify-end gap-2">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-[0.7rem] border border-[color:var(--border-soft)] px-3 py-2 text-[0.78rem] font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            @click="emit('toggleReply', comment)"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="isSubmitting || !comment.replyInput.trim()"
            class="inline-flex items-center justify-center rounded-[0.7rem] bg-[var(--accent)] px-3 py-2 text-[0.78rem] font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
            @click="emit('submitReply', comment)"
          >
            Reply
          </button>
        </div>
      </div>

      <PostCommentThread
        v-if="comment.replies.length"
        class="mt-2"
        :comments="comment.replies"
        :is-submitting="isSubmitting"
        @toggle-score="emit('toggleScore', $event)"
        @toggle-reply="emit('toggleReply', $event)"
        @submit-reply="emit('submitReply', $event)"
      />
    </article>
  </div>
</template>
