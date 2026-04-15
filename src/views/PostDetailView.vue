<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowUp, BriefcaseBusiness, MessageSquare, Users } from 'lucide-vue-next'
import { getFeedPostBySlug } from '@/data/feedPosts'

const route = useRoute()

const post = computed(() => getFeedPostBySlug(String(route.params.slug)))

const answerSamples = [
  'Start with 2 to 3 projects that clearly show how you think, not just how the final UI looks.',
  'Document the problem, your role, tradeoffs, and what changed because of your work.',
  'A smaller portfolio with strong storytelling usually beats a large one with weak context.',
]
</script>

<template>
  <section v-if="post" class="space-y-6">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">Post Details</span>
      </div>

      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
          {{ post.type }} post
        </p>
        <h1 class="mt-2 text-[1.8rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[2.15rem]">
          {{ post.title }}
        </h1>
      </div>
    </div>

    <article class="overflow-hidden rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
      <div class="border-b border-[color:var(--border-soft)] bg-[linear-gradient(135deg,rgba(66,63,151,0.08),rgba(211,154,69,0.06))] p-5 sm:p-6">
        <div class="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
          <span v-if="post.type === 'question'" class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-primary)] px-3 py-1.5">
            <Users class="h-4 w-4 text-[var(--accent-strong)]" />
            {{ post.communityName }}
          </span>
          <span v-else class="inline-flex items-center gap-2 rounded-full bg-[var(--surface-primary)] px-3 py-1.5">
            <BriefcaseBusiness class="h-4 w-4 text-[var(--accent-strong)]" />
            {{ post.author.name }}
          </span>
          <span>{{ post.time }}</span>
        </div>
      </div>

      <div class="space-y-6 p-5 sm:p-6">
        <template v-if="post.type === 'question'">
          <p class="text-base leading-8 text-[var(--text-secondary)]">
            {{ post.authorName }} asked this inside {{ post.communityName }} for members with experience in {{ post.tag }}.
          </p>

          <div class="grid gap-4 md:grid-cols-3">
            <div class="rounded-[1.15rem] bg-[var(--surface-secondary)] p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Answers</p>
              <p class="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{{ post.answers }}</p>
            </div>
            <div class="rounded-[1.15rem] bg-[var(--surface-secondary)] p-4 md:col-span-2">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Best direction</p>
              <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                The strongest answers here focus on clarity, proof of work, and how to communicate process instead of only polished outcomes.
              </p>
            </div>
          </div>

          <div class="space-y-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Highlighted Answers</h2>
            <article
              v-for="answer in answerSamples"
              :key="answer"
              class="rounded-[1.15rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <p class="text-sm leading-7 text-[var(--text-secondary)]">{{ answer }}</p>
            </article>
          </div>
        </template>

        <template v-else>
          <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <p class="text-base leading-8 text-[var(--text-secondary)]">{{ post.description }}</p>
              <img
                :src="post.imageSrc"
                :alt="post.imageAlt || post.title"
                class="mt-5 h-64 w-full rounded-[1.25rem] object-cover sm:h-80"
              />
            </div>

            <div class="space-y-4">
              <div class="rounded-[1.15rem] bg-[var(--surface-secondary)] p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Score</p>
                <p class="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]">
                  <ArrowUp class="h-5 w-5 text-[var(--accent-strong)]" />
                  {{ post.score }}
                </p>
              </div>
              <div class="rounded-[1.15rem] bg-[var(--surface-secondary)] p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Comments</p>
                <p class="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]">
                  <MessageSquare class="h-5 w-5 text-[var(--accent-strong)]" />
                  {{ post.comments }}
                </p>
              </div>
            </div>
          </div>
        </template>
      </div>
    </article>
  </section>

  <section v-else class="rounded-[1.35rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8 text-center shadow-[var(--shadow-soft)]">
    <h1 class="text-xl font-semibold text-[var(--text-primary)]">Post not found</h1>
    <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
      The post you are looking for is not available in this starter dataset.
    </p>
  </section>
</template>
