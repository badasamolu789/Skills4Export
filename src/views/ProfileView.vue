<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { BriefcaseBusiness, Globe, Mail, MapPin, Phone, Sparkles, UserRound, Award, BookOpen, ExternalLink, Edit2, MoreHorizontal, Save, Trash2, X, GraduationCap, Briefcase } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ApiError } from '@/lib/api'
import { usersService } from '@/services/users'
import { useAuthStore } from '@/stores/auth'
import type { UserSkill, UserPortfolio, UserCertification, UserEducation, UserExperience } from '@/services/users'

const authStore = useAuthStore()
const route = useRoute()
const isLoadingProfile = ref(false)
const isLoadingFollowers = ref(false)
const isLoadingSkills = ref(false)
const isLoadingPortfolios = ref(false)
const isLoadingCertifications = ref(false)
const isLoadingEducations = ref(false)
const isLoadingExperiences = ref(false)
const isEditingContact = ref(false)
const isSavingContact = ref(false)
const skills = ref<UserSkill[]>([])
const portfolios = ref<UserPortfolio[]>([])
const certifications = ref<UserCertification[]>([])
const educations = ref<UserEducation[]>([])
const experiences = ref<UserExperience[]>([])
const activeActionMenu = ref<{ type: 'skill' | 'portfolio' | 'certification' | 'education' | 'experience'; id: string } | null>(null)
const deletingItem = ref<string | null>(null)
const deleteModal = ref<{ isOpen: boolean; type?: 'skill' | 'portfolio' | 'certification' | 'education' | 'experience'; id?: string; label?: string }>({
  isOpen: false,
})
const stats = ref({
  pages: 0,
  communities: 0,
  posts: 0,
  comments: 0,
  followers: 0,
})

const toggleActionMenu = (type: 'skill' | 'portfolio' | 'certification' | 'education' | 'experience', id: string | undefined) => {
  if (!id) {
    return
  }

  activeActionMenu.value =
    activeActionMenu.value?.type === type && activeActionMenu.value?.id === id
      ? null
      : { type, id }
}

const closeActionMenu = () => {
  activeActionMenu.value = null
}

const isDeleting = (type: string, id: string | undefined) => {
  if (!id) {
    return false
  }
  return deletingItem.value === `${type}-${id}`
}

const openDeleteModal = (type: 'skill' | 'portfolio' | 'certification' | 'education' | 'experience', id: string | undefined, label: string) => {
  if (!id) {
    return
  }

  deleteModal.value = {
    isOpen: true,
    type,
    id,
    label,
  }

  closeActionMenu()
}

const closeDeleteModal = () => {
  deleteModal.value = { isOpen: false }
}

const confirmDelete = async () => {
  if (!deleteModal.value.type || !deleteModal.value.id) {
    return
  }

  await handleDelete(deleteModal.value.type, deleteModal.value.id)
  closeDeleteModal()
}

const handleDelete = async (
  type: 'skill' | 'portfolio' | 'certification' | 'education' | 'experience',
  id: string | undefined,
) => {
  if (!authStore.userId) {
    toast.error('Unable to delete item: missing user identity.')
    return
  }

  if (!id) {
    toast.error('Unable to delete item: missing ID.')
    closeActionMenu()
    return
  }

  const label = {
    skill: 'skill',
    portfolio: 'portfolio item',
    certification: 'certification',
    education: 'education entry',
    experience: 'experience entry',
  }[type]

  deletingItem.value = `${type}-${id}`

  try {
    switch (type) {
      case 'skill':
        await usersService.deleteUserSkill(authStore.userId, id, authStore.authToken)
        skills.value = skills.value.filter((item) => item.id !== id)
        break
      case 'portfolio':
        await usersService.deleteUserPortfolio(authStore.userId, id, authStore.authToken)
        portfolios.value = portfolios.value.filter((item) => item.id !== id)
        break
      case 'certification':
        await usersService.deleteUserCertification(authStore.userId, id, authStore.authToken)
        certifications.value = certifications.value.filter((item) => item.id !== id)
        break
      case 'education':
        await usersService.deleteUserEducation(authStore.userId, id, authStore.authToken)
        educations.value = educations.value.filter((item) => item.id !== id)
        break
      case 'experience':
        await usersService.deleteUserExperience(authStore.userId, id, authStore.authToken)
        experiences.value = experiences.value.filter((item) => item.id !== id)
        break
    }

    toast.success(`${label.charAt(0).toUpperCase() + label.slice(1)} deleted successfully.`)
  } catch (error) {
    const message = error instanceof ApiError || error instanceof Error ? error.message : `Failed to delete ${label}.`
    toast.error('Delete failed', { description: message })
  } finally {
    deletingItem.value = null
    closeActionMenu()
  }
}

const contactForm = ref({
  email: '',
  phone: '',
  location: '',
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

    if (profileResponse.data?.user?.name && typeof profileResponse.data.user.name === 'string') {
      authStore.signUpDraft.name = profileResponse.data.user.name
    }

    // Sync profile data to store for persistence across reloads
    if (profileResponse.data?.profile) {
      const profile = profileResponse.data.profile
      authStore.signUpDraft.username = profile.username || authStore.signUpDraft.username
      authStore.signUpDraft.headline = profile.bio || authStore.signUpDraft.headline
      authStore.signUpDraft.location = profile.location || authStore.signUpDraft.location
      if (profile.avatar) {
        authStore.signUpDraft.avatar = profile.avatar
      }
      if (profile.banner) {
        authStore.signUpDraft.banner = profile.banner
      }
    }

    stats.value = {
      pages: statsResponse.data?.pages ?? 0,
      communities: statsResponse.data?.communities ?? 0,
      posts: statsResponse.data?.posts ?? 0,
      comments: statsResponse.data?.comments ?? 0,
      followers: 0,
    }

    // Load additional profile data
    skills.value = (profileResponse.data?.skills || []).map((skill) => ({
      id: skill.id || '',
      name: skill.name || '',
      level: skill.level,
    }))

    portfolios.value = profileResponse.data?.portfolios || []

    certifications.value = profileResponse.data?.certifications || []

    educations.value = profileResponse.data?.education || []

    experiences.value = profileResponse.data?.experiences || []

    // Load followers count separately
    if (profileResponse.data?.user?.id) {
      await loadFollowersCount(profileResponse.data.user.id)
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

const loadFollowersCount = async (userId: string) => {
  isLoadingFollowers.value = true

  try {
    const response = await usersService.listFollowers(userId, authStore.authToken)
    stats.value.followers = response.data?.length ?? 0
  } catch (error) {
    // Silently fail - followers count is optional
    stats.value.followers = 0
  } finally {
    isLoadingFollowers.value = false
  }
}

const startEditingContact = () => {
  contactForm.value = {
    email: authStore.signUpDraft.email || '',
    phone: authStore.signUpDraft.phone || '',
    location: authStore.userProfile?.location || authStore.signUpDraft.location || '',
  }
  isEditingContact.value = true
}

const cancelEditingContact = () => {
  isEditingContact.value = false
  contactForm.value = {
    email: '',
    phone: '',
    location: '',
  }
}

const saveContactDetails = async () => {
  if (!authStore.userId) {
    return
  }

  isSavingContact.value = true

  try {
    const payload = {
      username: authStore.signUpDraft.username,
      location: contactForm.value.location,
      website: authStore.userProfile?.website || '',
      linkedin: authStore.userProfile?.linkedin || '',
      github: authStore.userProfile?.github || '',
    }

    let profileResponse

    try {
      profileResponse = await usersService.updateUserProfile(authStore.userId, payload, authStore.authToken)
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) {
        throw error
      }
      profileResponse = await usersService.createUserProfile(authStore.userId, payload, authStore.authToken)
    }

    // Update store
    authStore.signUpDraft.email = contactForm.value.email
    authStore.signUpDraft.phone = contactForm.value.phone
    authStore.signUpDraft.location = contactForm.value.location
    authStore.setUserProfile(profileResponse.data ?? null)

    toast.success('Contact details updated', {
      description: 'Your profile information has been saved.',
    })

    isEditingContact.value = false
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Failed to update contact details.'

    toast.error('Update failed', {
      description: message,
    })
  } finally {
    isSavingContact.value = false
  }
}

onMounted(() => {
  void loadProfile()
})

// Refresh data when user profile changes (after edits)
watch(
  () => authStore.userProfile?.id,
  () => {
    void loadProfile()
  },
)

// Refresh data when navigating to this route
watch(
  () => route.path,
  () => {
    if (route.path === '/profile') {
      void loadProfile()
    }
  },
)

const profile = computed(() => {
  const draft = authStore.signUpDraft
  const apiProfile = authStore.userProfile
  const name = draft.name || apiProfile?.username || 'Samuel Bada'
  const username = apiProfile?.username || draft.username || 'samuelbada'
  const email = draft.email || 'samuel@example.com'
  const phone = draft.phone || '+234 800 000 0000'
  const location = apiProfile?.location || draft.location || 'Lagos, Nigeria'
  const bio = apiProfile?.bio || draft.headline || 'Founder account'

  return {
    name,
    bio,
    username,
    email,
    phone,
    location,
    website: apiProfile?.website || draft.website || `skills4export.com/@${username}`,
    avatar: apiProfile?.avatar || draft.avatar || '',
    banner: apiProfile?.banner || draft.banner || '',
    initials: name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  }
})

const profileStats = computed(() => [
  { label: 'Posts shared', value: String(stats.value.posts || 0), icon: Sparkles },
  { label: 'Followers', value: String(stats.value.followers || 0), icon: UserRound },
  { label: 'Communities', value: String(stats.value.communities || 0), icon: UserRound },
  { label: 'Pages', value: String(stats.value.pages || 0), icon: BriefcaseBusiness },
])
</script>

<template>
  <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
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

    <section class="relative overflow-hidden rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
      <div class="absolute inset-0">
        <div v-if="profile.banner" class="h-full w-full">
          <img
            :src="profile.banner"
            alt="Profile banner"
            class="h-full w-full object-cover"
          />
        </div>
        <div v-else class="h-full w-full bg-[linear-gradient(135deg,rgba(66,63,151,0.12),rgba(211,154,69,0.08))]" />
        <div class="absolute inset-0 bg-[rgba(0,0,0,0.35)]" />
      </div>

      <div class="relative p-5 sm:p-6">
        <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-4">
            <div class="relative">
              <div class="h-20 w-20 overflow-hidden rounded-[1.75rem] bg-[var(--surface-primary)] shadow-[var(--shadow-soft)]">
                <img
                  v-if="profile.avatar"
                  :src="profile.avatar"
                  alt="Profile avatar"
                  class="h-full w-full object-cover"
                />
                <span v-else class="flex h-full w-full items-center justify-center text-xl font-semibold text-white">
                  {{ profile.initials }}
                </span>
              </div>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                @{{ profile.username }}
              </p>
              <h2 class="mt-1 text-2xl font-semibold leading-tight text-white">
                {{ profile.name }}
              </h2>
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-[1rem] border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/15"
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
    </section>

    <!-- Stats Section -->
    <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
      <h2 class="text-lg font-semibold text-[var(--text-primary)] mb-5">Overview</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="stat in profileStats"
          :key="stat.label"
          class="rounded-[1.15rem] bg-[var(--surface-secondary)] p-4 transition hover:bg-[var(--surface-primary)]"
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

    <div class="space-y-6">
      <div class="space-y-6">
        <!-- Contact Section -->
        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Contact</h2>
            <button
              v-if="!isEditingContact"
              type="button"
              @click="startEditingContact"
              class="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] transition"
            >
              <Edit2 class="h-4 w-4" />
              Edit
            </button>
          </div>

          <div v-if="!isEditingContact" class="mt-5 space-y-3">
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
          </div>

          <form v-else class="mt-5 space-y-4" @submit.prevent="saveContactDetails">
            <div class="space-y-2">
              <label class="text-sm font-semibold text-[var(--text-primary)]">Email address</label>
              <div class="relative">
                <Mail class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  v-model="contactForm.email"
                  type="email"
                  class="h-11 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] pl-11 pr-4 text-sm outline-none transition focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-semibold text-[var(--text-primary)]">Phone number</label>
              <div class="relative">
                <Phone class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  v-model="contactForm.phone"
                  type="tel"
                  class="h-11 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] pl-11 pr-4 text-sm outline-none transition focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-semibold text-[var(--text-primary)]">Location</label>
              <div class="relative">
                <MapPin class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  v-model="contactForm.location"
                  type="text"
                  class="h-11 w-full rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] pl-11 pr-4 text-sm outline-none transition focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div class="flex gap-3 pt-4 border-t border-[color:var(--border-soft)]">
              <button
                type="button"
                @click="cancelEditingContact"
                class="flex-1 inline-flex items-center justify-center gap-2 rounded-[1rem] border border-[color:var(--border-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
              >
                <X class="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                :disabled="isSavingContact"
                class="flex-1 inline-flex items-center justify-center gap-2 rounded-[1rem] bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--accent-soft)]"
              >
                <Save class="h-4 w-4" />
                {{ isSavingContact ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </section>

        <!-- About Section -->
        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <h2 class="text-xl font-semibold text-[var(--text-primary)]">About</h2>
          <p v-if="profile.bio" class="mt-3 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            {{ profile.bio }}
          </p>
          <p v-else class="mt-3 text-sm text-[var(--text-secondary)] italic">
            No bio added yet.
          </p>
        </section>
        <section id="skills" class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Skills</h2>
            <Award class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="isLoadingSkills" class="text-sm text-[var(--text-secondary)] text-center py-4">
            Loading skills...
          </div>

          <div v-else-if="skills.length > 0" class="grid gap-3 sm:grid-cols-2">
            <div
              v-for="skill in skills"
              :key="skill.id"
              class="rounded-[1.1rem] bg-[var(--surface-secondary)] p-5 border border-[color:var(--border-soft)]"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1">
                  <p class="text-lg font-semibold text-[var(--text-primary)]">{{ skill.name }}</p>
                  <span
                    class="inline-block mt-2 text-xs font-semibold uppercase tracking-[0.15em] px-3 py-1 rounded-full"
                    :class="{
                      'bg-blue-500/10 text-blue-500': skill.level === 'beginner',
                      'bg-amber-500/10 text-amber-500': skill.level === 'intermediate',
                      'bg-green-500/10 text-green-500': skill.level === 'advanced' || skill.level === 'expert',
                    }"
                  >
                    {{ skill.level || 'beginner' }}
                  </span>
                </div>

                <div class="relative">
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                    @click.stop="toggleActionMenu('skill', skill.id)"
                  >
                    <MoreHorizontal class="h-5 w-5" />
                  </button>

                  <div
                    v-if="activeActionMenu?.type === 'skill' && activeActionMenu?.id === skill.id"
                    class="absolute right-0 z-10 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-[var(--surface-secondary)]"
                      @click="openDeleteModal('skill', skill.id, 'skill')"
                      :disabled="isDeleting('skill', skill.id)"
                    >
                      <Trash2 class="h-4 w-4" />
                      Delete skill
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-sm text-[var(--text-secondary)]">
            <p class="mb-3">No skills added yet.</p>
            <RouterLink
              to="/profile/edit"
              class="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] transition"
            >
              Add your first skill →
            </RouterLink>
          </div>
        </section>

        <!-- Portfolio Section -->
        <section id="portfolio" class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Portfolio</h2>
            <BookOpen class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="isLoadingPortfolios" class="text-sm text-[var(--text-secondary)] text-center py-4">
            Loading portfolio items...
          </div>

          <div v-else-if="portfolios.length > 0" class="space-y-4">
            <article
              v-for="portfolio in portfolios"
              :key="portfolio.id"
              class="rounded-[1.1rem] bg-[var(--surface-secondary)] p-5 border border-[color:var(--border-soft)] transition hover:border-[var(--accent)]"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <p class="text-lg font-semibold text-[var(--text-primary)] break-words">{{ portfolio.title }}</p>
                  <p v-if="portfolio.description" class="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                    {{ portfolio.description }}
                  </p>
                  <a
                    v-if="portfolio.link"
                    :href="portfolio.link"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-strong)] transition"
                  >
                    Visit project
                    <ExternalLink class="h-4 w-4" />
                  </a>
                </div>

                <div class="relative">
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                    @click.stop="toggleActionMenu('portfolio', portfolio.id)"
                  >
                    <MoreHorizontal class="h-5 w-5" />
                  </button>

                  <div
                    v-if="activeActionMenu?.type === 'portfolio' && activeActionMenu?.id === portfolio.id"
                    class="absolute right-0 z-10 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-[var(--surface-secondary)]"
                      @click="openDeleteModal('portfolio', portfolio.id, 'portfolio item')"
                      :disabled="isDeleting('portfolio', portfolio.id)"
                    >
                      <Trash2 class="h-4 w-4" />
                      Delete item
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div v-else class="text-center py-8 text-sm text-[var(--text-secondary)]">
            <p class="mb-3">No portfolio items added yet.</p>
            <RouterLink
              to="/profile/edit"
              class="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] transition"
            >
              Showcase your work →
            </RouterLink>
          </div>
        </section>

        <!-- Certifications Section -->
        <section id="certifications" class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Certifications</h2>
            <Award class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="isLoadingCertifications" class="text-sm text-[var(--text-secondary)] text-center py-4">
            Loading certifications...
          </div>

          <div v-else-if="certifications.length > 0" class="space-y-3">
            <div
              v-for="certification in certifications"
              :key="certification.id"
              class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-semibold text-[var(--text-primary)]">{{ certification.name }}</p>
                  <p v-if="certification.issuer" class="text-sm text-[var(--text-secondary)]">{{ certification.issuer }}</p>
                  <p v-if="certification.issueDate" class="text-xs text-[var(--text-tertiary)] mt-1">Issued: {{ new Date(certification.issueDate).toLocaleDateString() }}</p>
                </div>

                <div class="relative">
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                    @click.stop="toggleActionMenu('certification', certification.id)"
                  >
                    <MoreHorizontal class="h-5 w-5" />
                  </button>

                  <div
                    v-if="activeActionMenu?.type === 'certification' && activeActionMenu?.id === certification.id"
                    class="absolute right-0 z-10 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-[var(--surface-secondary)]"
                      @click="openDeleteModal('certification', certification.id, 'certification')"
                      :disabled="isDeleting('certification', certification.id)"
                    >
                      <Trash2 class="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-sm text-[var(--text-secondary)]">
            <p class="mb-3">No certifications added yet.</p>
            <RouterLink
              to="/profile/edit"
              class="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] transition"
            >
              Add certifications →
            </RouterLink>
          </div>
        </section>

        <!-- Education Section -->
        <section id="education" class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Education</h2>
            <GraduationCap class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="isLoadingEducations" class="text-sm text-[var(--text-secondary)] text-center py-4">
            Loading education records...
          </div>

          <div v-else-if="educations.length > 0" class="space-y-3">
            <div
              v-for="education in educations"
              :key="education.id"
              class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-semibold text-[var(--text-primary)]">{{ education.school }}</p>
                  <p v-if="education.degree" class="text-sm text-[var(--text-secondary)]">{{ education.degree }}</p>
                  <p v-if="education.field" class="text-sm text-[var(--text-secondary)]">{{ education.field }}</p>
                  <p v-if="education.startDate || education.endDate" class="text-xs text-[var(--text-tertiary)] mt-1">
                    {{ education.startDate ? new Date(education.startDate).toLocaleDateString() : '' }}
                    {{ education.startDate && education.endDate ? ' - ' : '' }}
                    {{ education.endDate ? new Date(education.endDate).toLocaleDateString() : '' }}
                  </p>
                </div>

                <div class="relative">
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                    @click.stop="toggleActionMenu('education', education.id)"
                  >
                    <MoreHorizontal class="h-5 w-5" />
                  </button>

                  <div
                    v-if="activeActionMenu?.type === 'education' && activeActionMenu?.id === education.id"
                    class="absolute right-0 z-10 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-[var(--surface-secondary)]"
                      @click="openDeleteModal('education', education.id, 'education entry')"
                      :disabled="isDeleting('education', education.id)"
                    >
                      <Trash2 class="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-sm text-[var(--text-secondary)]">
            <p class="mb-3">No education records added yet.</p>
            <RouterLink
              to="/profile/edit"
              class="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] transition"
            >
              Add education →
            </RouterLink>
          </div>
        </section>

        <!-- Experience Section -->
        <section id="experience" class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Work Experience</h2>
            <Briefcase class="h-5 w-5 text-[var(--accent-strong)]" />
          </div>

          <div v-if="isLoadingExperiences" class="text-sm text-[var(--text-secondary)] text-center py-4">
            Loading experience records...
          </div>

          <div v-else-if="experiences.length > 0" class="space-y-3">
            <div
              v-for="experience in experiences"
              :key="experience.id"
              class="rounded-[1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-semibold text-[var(--text-primary)]">{{ experience.title }}</p>
                  <p class="text-sm text-[var(--text-secondary)]">{{ experience.company }}</p>
                  <p v-if="experience.employmentType" class="text-xs text-[var(--text-tertiary)]">{{ experience.employmentType }}</p>
                  <p class="text-xs text-[var(--text-tertiary)] mt-1">
                    {{ experience.startDate ? new Date(experience.startDate).toLocaleDateString() : '' }}
                    {{ experience.startDate && (experience.endDate || experience.isCurrent) ? ' - ' : '' }}
                    {{ experience.isCurrent ? 'Present' : (experience.endDate ? new Date(experience.endDate).toLocaleDateString() : '') }}
                  </p>
                  <p v-if="experience.description" class="text-sm text-[var(--text-secondary)] mt-2">
                    {{ experience.description }}
                  </p>
                </div>

                <div class="relative">
                  <button
                    type="button"
                    class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                    @click.stop="toggleActionMenu('experience', experience.id)"
                  >
                    <MoreHorizontal class="h-5 w-5" />
                  </button>

                  <div
                    v-if="activeActionMenu?.type === 'experience' && activeActionMenu?.id === experience.id"
                    class="absolute right-0 z-10 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]"
                  >
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 px-3 py-3 text-sm font-semibold text-red-500 transition hover:bg-[var(--surface-secondary)]"
                      @click="openDeleteModal('experience', experience.id, 'experience entry')"
                      :disabled="isDeleting('experience', experience.id)"
                    >
                      <Trash2 class="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-sm text-[var(--text-secondary)]">
            <p class="mb-3">No experience records added yet.</p>
            <RouterLink
              to="/profile/edit"
              class="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] transition"
            >
              Add experience →
            </RouterLink>
          </div>
        </section>

        <!-- Recent Activity Section -->
        <section class="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-elevated)]">
          <div class="flex items-center justify-between gap-3 mb-5">
            <h2 class="text-xl font-semibold text-[var(--text-primary)]">Recent activity</h2>
            <RouterLink to="/feed" class="text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]">
              View feed
            </RouterLink>
          </div>

          <div v-if="stats.posts === 0" class="text-center py-8 text-sm text-[var(--text-secondary)]">
            <p class="mb-3">No posts shared yet.</p>
            <RouterLink
              to="/profile/edit"
              class="text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)] transition"
            >
              Start sharing →
            </RouterLink>
          </div>
          <div v-else class="text-sm text-[var(--text-secondary)] text-center py-4">
            <p>You have {{ stats.posts }} post{{ stats.posts !== 1 ? 's' : '' }} shared.</p>
          </div>
        </section>
      </div>
    </div>
  </section>

  <!-- Delete Confirmation Modal -->
  <div v-if="deleteModal.isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div class="w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]">
      <div class="p-6">
        <h3 class="text-lg font-semibold text-[var(--text-primary)]">Delete {{ deleteModal.label }}?</h3>
        <p class="mt-3 text-sm text-[var(--text-secondary)]">
          This action cannot be undone. Are you sure you want to delete this {{ deleteModal.label }}?
        </p>
      </div>

      <div class="flex gap-3 border-t border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-4">
        <button
          type="button"
          @click="closeDeleteModal"
          class="flex-1 inline-flex items-center justify-center rounded-[1rem] border border-[color:var(--border-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="confirmDelete"
          :disabled="deletingItem !== null"
          class="flex-1 inline-flex items-center justify-center rounded-[1rem] bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-400"
        >
          {{ deletingItem ? 'Deleting...' : 'Delete' }}
        </button>
      </div>
    </div>
  </div>
</template>
