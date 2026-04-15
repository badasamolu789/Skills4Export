<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { BriefcaseBusiness, Globe, Mail, MapPin, Phone, Sparkles, UserRound, Users } from 'lucide-vue-next'
import { feedPosts } from '@/data/feedPosts'
import { ApiError } from '@/lib/api'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isLoadingProfile = ref(false)
const stats = ref({
  pages: 0,
  communities: 0,
  posts: 0,
  comments: 0,
})

const loadProfile = async () => {
  if (!authStore.isAuthenticated) {
    return
  }

  isLoadingProfile.value = true

  try {
    const [profileResponse, statsResponse] = await Promise.all([
      usersService.getMyProfile(authStore.authToken),
      usersService.getMyStats(authStore.authToken),
    ])

    authStore.setUserProfile(profileResponse.data?.profile ?? null)

    if (profileResponse.data?.user?.id) {
      authStore.setUserId(profileResponse.data.user.id)
    }

    if (profileResponse.data?.user?.email && typeof profileResponse.data.user.email === 'string') {
      authStore.signUpDraft.email = profileResponse.data.user.email
    }

    stats.value = {
      pages: statsResponse.data?.pages ?? 0,
      communities: statsResponse.data?.communities ?? 0,
      posts: statsResponse.data?.posts ?? 0,
      comments: statsResponse.data?.comments ?? 0,
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      authStore.setUserProfile(null)
      return
    }
  } finally {
    isLoadingProfile.value = false
  }
}

onMounted(() => {
  void loadProfile()
})

const profile = computed(() => {
  const draft = authStore.signUpDraft
  const apiProfile = authStore.userProfile
  const name = draft.name || 'Samuel Bada'
  const headline = draft.headline || apiProfile?.bio || 'Founder account'
  const username = apiProfile?.username || draft.username || 'samuelbada'
  const email = draft.email || 'samuel@example.com'
  const phone = draft.phone || '+234 800 000 0000'
  const location = apiProfile?.location || draft.location || 'Lagos, Nigeria'
  const interests = draft.interests.length ? draft.interests : ['Community', 'Jobs', 'Referrals']

  return {
    name,
    headline,
    username,
    email,
    phone,
    location,
    interests,
    website: apiProfile?.website || `skills4export.com/@${username}`,
    initials: name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  }
})

const recentPosts = computed(() =>
  feedPosts.filter((post) => {
    if (post.type === 'question') {
      return post.authorName === profile.value.name
    }

    return post.author.name === profile.value.name
  }).slice(0, 3),
)

const profileStats = computed(() => [
  { label: 'Posts shared', value: String(stats.value.posts || recentPosts.value.length || 0), icon: Sparkles },
  { label: 'Communities', value: String(stats.value.communities || 0), icon: Users },
  { label: 'Pages', value: String(stats.value.pages || 0), icon: BriefcaseBusiness },
])
</script>

<template>
  <section class="space-y-6">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">Profile</span>
      </div>
      <div>
        <h1 class="text-[1.65rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.95rem] lg:text-[2.1rem]">
          Your profile
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          Manage the public details people see about you across jobs, communities, and conversations.
        </p>
      </div>
    </div>

    <section class="overflow-hidden rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
      <div class="bg-[linear-gradient(135deg,rgba(66,63,151,0.1),rgba(211,154,69,0.06))] p-5 sm:p-6">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div class="flex items-start gap-4">
            <span class="inline-flex h-18 w-18 items-center justify-center rounded-[1.75rem] bg-[var(--surface-primary)] text-xl font-semibold text-[var(--accent-strong)] shadow-[var(--shadow-soft)]">
              {{ profile.initials }}
            </span>
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-tertiary)]">
                @{{ profile.username }}
              </p>
              <h2 class="mt-2 text-[1.65rem] font-semibold leading-tight text-[var(--text-primary)]">
                {{ profile.name }}
              </h2>
              <p class="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                {{ profile.headline }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
            >
              Share profile
            </button>
            <RouterLink
              to="/profile/edit"
              class="inline-flex items-center justify-center rounded-[1rem] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
            >
              Edit profile
            </RouterLink>
          </div>
        </div>
      </div>

      <div class="grid gap-4 border-t border-[color:var(--border-soft)] p-5 sm:grid-cols-3 sm:p-6">
        <article
          v-for="stat in profileStats"
          :key="stat.label"
          class="rounded-[1.15rem] bg-[var(--surface-secondary)] p-4"
        >
          <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
            <component :is="stat.icon" class="h-4 w-4 text-[var(--accent-strong)]" />
            <span>{{ stat.label }}</span>
          </div>
          <p class="mt-3 text-2xl font-semibold text-[var(--text-primary)]">{{ stat.value }}</p>
        </article>
      </div>
    </section>

    <div v-if="isLoadingProfile" class="rounded-[1.25rem] border border-dashed border-[color:var(--border-soft)] p-4 text-sm text-[var(--text-secondary)]">
      Loading your profile...
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.9fr)]">
      <div class="space-y-6">
        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <h2 class="text-xl font-semibold text-[var(--text-primary)]">About</h2>
          <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            {{ profile.headline }} Based in {{ profile.location }}, this profile is set up to support visibility across jobs, referrals, and focused communities.
          </p>

          <div class="mt-5 flex flex-wrap gap-2">
            <span
              v-for="interest in profile.interests"
              :key="interest"
              class="inline-flex items-center rounded-full bg-[var(--surface-secondary)] px-4 py-2 text-sm text-[var(--text-secondary)]"
            >
              {{ interest }}
            </span>
          </div>
        </section>

        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Recent activity</h2>
            <RouterLink to="/" class="text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]">
              View feed
            </RouterLink>
          </div>

          <div class="mt-5 space-y-4">
            <article
              v-for="post in recentPosts"
              :key="post.slug"
              class="rounded-[1.1rem] bg-[var(--surface-secondary)] p-4"
            >
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                {{ post.type }} post
              </p>
              <RouterLink
                :to="`/posts/${post.slug}`"
                class="mt-2 block text-lg font-semibold leading-tight text-[var(--text-primary)] transition hover:text-[var(--accent-strong)]"
              >
                {{ post.title }}
              </RouterLink>
              <p class="mt-2 text-sm text-[var(--text-secondary)]">{{ post.time }}</p>
            </article>

            <article
              v-if="recentPosts.length === 0"
              class="rounded-[1.1rem] border border-dashed border-[color:var(--border-soft)] p-5 text-sm text-[var(--text-secondary)]"
            >
              No recent profile activity yet.
            </article>
          </div>
        </section>
      </div>

      <div class="space-y-6">
        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <h2 class="text-xl font-semibold text-[var(--text-primary)]">Contact</h2>
          <div class="mt-5 space-y-3">
            <div class="flex items-center gap-3 rounded-[1rem] bg-[var(--surface-secondary)] p-4">
              <Mail class="h-4 w-4 text-[var(--accent-strong)]" />
              <span class="text-sm text-[var(--text-secondary)]">{{ profile.email }}</span>
            </div>
            <div class="flex items-center gap-3 rounded-[1rem] bg-[var(--surface-secondary)] p-4">
              <Phone class="h-4 w-4 text-[var(--accent-strong)]" />
              <span class="text-sm text-[var(--text-secondary)]">{{ profile.phone }}</span>
            </div>
            <div class="flex items-center gap-3 rounded-[1rem] bg-[var(--surface-secondary)] p-4">
              <MapPin class="h-4 w-4 text-[var(--accent-strong)]" />
              <span class="text-sm text-[var(--text-secondary)]">{{ profile.location }}</span>
            </div>
            <div class="flex items-center gap-3 rounded-[1rem] bg-[var(--surface-secondary)] p-4">
              <Globe class="h-4 w-4 text-[var(--accent-strong)]" />
              <span class="text-sm text-[var(--text-secondary)]">{{ profile.website }}</span>
            </div>
          </div>
        </section>

        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <h2 class="text-xl font-semibold text-[var(--text-primary)]">Visibility</h2>
          <div class="mt-5 rounded-[1.15rem] bg-[var(--surface-secondary)] p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-[var(--text-primary)]">Profile completion</p>
                <p class="mt-1 text-sm text-[var(--text-secondary)]">
                  Your key identity, contact, and interest details are already set up.
                </p>
              </div>
              <span class="text-lg font-semibold text-[var(--accent-strong)]">92%</span>
            </div>
            <div class="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--surface-primary)]">
              <div class="h-full w-[92%] rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong))]" />
            </div>
          </div>

          <div class="mt-4 flex items-start gap-3 rounded-[1.15rem] bg-[var(--surface-secondary)] p-4">
            <UserRound class="mt-1 h-4 w-4 text-[var(--accent-strong)]" />
            <p class="text-sm leading-7 text-[var(--text-secondary)]">
              A stronger profile helps you appear more credible in communities, job applications, and recruiter searches.
            </p>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
