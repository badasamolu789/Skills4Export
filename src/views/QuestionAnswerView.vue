<script setup lang="ts">
import AppFeedPost from '@/components/AppFeedPost.vue'
import { questionPosts } from '@/data/feedPosts'
</script>

<template>
  <section class="space-y-5">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">Question</span>
      </div>

      <div>
        <h1 class="text-[1.55rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.85rem] lg:text-[2rem]">
          Questions
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          Answer-focused feed for question posts only. This page accepts and displays only question content.
        </p>
      </div>
    </div>

    <div
      class="overflow-hidden rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
    >
      <div class="bg-[linear-gradient(135deg,rgba(66,63,151,0.12),rgba(211,154,69,0.08))] p-5 sm:p-6">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
          Answer Questions
        </p>
        <p class="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          Browse community questions, open discussions, and contribute helpful answers in one focused space.
        </p>
      </div>
    </div>

    <div class="space-y-6">
      <AppFeedPost
        v-for="post in questionPosts"
        :key="`${post.communityName}-${post.title}`"
        :post="post"
      />
    </div>
  </section>
</template>
