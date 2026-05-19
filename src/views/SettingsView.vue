<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Eye,
  EyeOff,
  Loader2,
  Monitor,
  Moon,
  Settings2,
  Sun,
  Trash2,
  UserRound,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { ApiError } from '@/lib/api'
import { useTheme, type ThemeMode } from '@/composables/useTheme'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import { usePagesStore } from '@/stores/pages'

type SettingsTab =
  | 'theme'
  | 'change-password'
  | 'email-settings'
  | 'privacy'
  | 'delete-account'
  | 'delete-page'

const authStore = useAuthStore()
const pagesStore = usePagesStore()
const activeTab = ref<SettingsTab>('privacy')
const showPasswordFields = ref({
  current: false,
  next: false,
  confirm: false,
})
const deleteAccountConfirmed = ref(false)
const deletePageConfirmed = ref(false)
const emailAddress = ref(authStore.currentUser?.email || authStore.signUpDraft.email || '')
const selectedDeletePageId = ref('')
const isSavingPassword = ref(false)
const isSavingEmail = ref(false)
const isDeletingPage = ref(false)
const passwordForm = ref({
  current: '',
  next: '',
  confirm: '',
})
const { theme, resolvedTheme, setTheme } = useTheme()

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'theme', label: 'Theme' },
  { id: 'change-password', label: 'Change Password' },
  { id: 'email-settings', label: 'Email Settings' },
  { id: 'privacy', label: 'Privacy' },
  // The current API spec does not expose account deletion, so this tab is not rendered.
  { id: 'delete-page', label: 'Delete Page' },
]

const themeOptions: Array<{
  value: ThemeMode
  label: string
  description: string
  icon: typeof Sun
}> = [
  {
    value: 'light',
    label: 'Light',
    description: 'Use the light interface across the app.',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Use the dark interface across the app.',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Match your device preference automatically.',
    icon: Monitor,
  },
]

const resolvedThemeLabel = computed(() =>
  resolvedTheme.value === 'dark' ? 'Dark mode is currently active.' : 'Light mode is currently active.',
)

const togglePasswordField = (field: keyof typeof showPasswordFields.value) => {
  showPasswordFields.value[field] = !showPasswordFields.value[field]
}

const deleteCopy = computed(() =>
  activeTab.value === 'delete-page'
    ? {
        title: 'Delete Page',
        button: 'Delete page',
      }
    : {
        title: 'Delete Account',
        button: 'Delete your account',
      },
)

const requireAuthToken = () => {
  if (authStore.authToken) {
    return true
  }

  toast.error('Sign in required', {
    description: 'Please sign in again before updating settings.',
  })
  return false
}

const changePassword = async () => {
  if (!requireAuthToken() || isSavingPassword.value) {
    return
  }

  if (!passwordForm.value.current || !passwordForm.value.next || !passwordForm.value.confirm) {
    toast.error('Fill all password fields.')
    return
  }

  if (passwordForm.value.next !== passwordForm.value.confirm) {
    toast.error('New passwords do not match.')
    return
  }

  isSavingPassword.value = true

  try {
    await authService.changePassword(
      {
        current_password: passwordForm.value.current,
        password: passwordForm.value.next,
        password_confirmation: passwordForm.value.confirm,
      },
      authStore.authToken,
    )
    passwordForm.value = { current: '', next: '', confirm: '' }
    toast.success('Password changed.')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to change password.'
    toast.error('Password failed', { description: message })
  } finally {
    isSavingPassword.value = false
  }
}

const changeEmail = async () => {
  if (!requireAuthToken() || isSavingEmail.value) {
    return
  }

  const email = emailAddress.value.trim()

  if (!email) {
    toast.error('Enter an email address.')
    return
  }

  isSavingEmail.value = true

  try {
    await authService.changeEmail({ new_email: email }, authStore.authToken)
    authStore.signUpDraft.email = email
    if (authStore.currentUser) {
      authStore.setCurrentUser({ ...authStore.currentUser, email })
    }
    toast.success('Email address saved.')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to change email.'
    toast.error('Email failed', { description: message })
  } finally {
    isSavingEmail.value = false
  }
}

const deleteSelectedPage = async () => {
  if (!requireAuthToken() || isDeletingPage.value) {
    return
  }

  if (!selectedDeletePageId.value) {
    toast.error('Select a page to delete.')
    return
  }

  if (!deletePageConfirmed.value) {
    toast.error('Confirm page deletion first.')
    return
  }

  isDeletingPage.value = true

  try {
    await pagesStore.deletePageFromApi(selectedDeletePageId.value)
    selectedDeletePageId.value = ''
    deletePageConfirmed.value = false
    toast.success('Page deleted.')
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Unable to delete page.'
    toast.error('Delete failed', { description: message })
  } finally {
    isDeletingPage.value = false
  }
}

onMounted(() => {
  void pagesStore.loadPages()
})
</script>

<template>
  <section class="mx-auto max-w-7xl space-y-8 px-3 py-6 sm:px-4 lg:px-6">
    <header class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-4">
          <span class="flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--accent-strong)] shadow-[var(--shadow-soft)]">
            <Settings2 class="h-7 w-7" />
          </span>
          <div>
            <h1 class="text-[1.8rem] font-semibold leading-tight text-[var(--text-primary)]">
              Settings
            </h1>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">
              Manage your profile, privacy, notifications, and account access.
            </p>
          </div>
        </div>

        <RouterLink
          to="/profile"
          class="inline-flex h-10 items-center justify-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--accent-strong)]"
        >
          <UserRound class="h-4 w-4" />
          View Profile
        </RouterLink>
      </div>

      <nav class="flex gap-5 overflow-x-auto border-b border-[color:var(--border-soft)] bg-[var(--surface-primary)]">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="shrink-0 border-b-2 px-0 pb-3 text-[0.92rem] font-semibold transition"
          :class="activeTab === tab.id ? 'border-[color:var(--accent)] text-[var(--accent-strong)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--accent-strong)]'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>
    </header>

    <div class="max-w-5xl">
      <section v-if="activeTab === 'theme'" class="space-y-5">
        <div class="rounded-[0.9rem] bg-[var(--surface-secondary)] p-5">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Theme</h2>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">Choose how Skills4Export looks on this device.</p>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <button
            v-for="option in themeOptions"
            :key="option.value"
            type="button"
            class="rounded-[0.9rem] border p-4 text-left transition"
            :class="
              theme === option.value
                ? 'border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_10%,var(--surface-primary))]'
                : 'border-[color:var(--border-soft)] bg-[var(--surface-primary)] hover:border-[color:var(--accent-soft)]'
            "
            @click="setTheme(option.value)"
          >
            <div class="flex items-start justify-between gap-3">
              <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--accent-strong)]">
                <component :is="option.icon" class="h-5 w-5" />
              </span>
              <span
                class="mt-1 h-4 w-4 rounded-full border"
                :class="theme === option.value ? 'border-[color:var(--accent)] bg-[var(--accent)]' : 'border-[color:var(--border-soft)] bg-[var(--surface-primary)]'"
              />
            </div>
            <h3 class="mt-4 text-base font-semibold text-[var(--text-primary)]">{{ option.label }}</h3>
            <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{{ option.description }}</p>
          </button>
        </div>

        <div class="rounded-[0.9rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4">
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            Current selection: <span class="text-[var(--accent-strong)]">{{ theme }}</span>
          </p>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ resolvedThemeLabel }}</p>
        </div>
      </section>

      <section v-else-if="activeTab === 'change-password'" class="space-y-5">
        <div class="rounded-[0.9rem] bg-[var(--surface-secondary)] p-5">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Change password</h2>
        </div>

        <div class="space-y-4">
          <label class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">Current Password</span>
            <div class="relative mt-2">
              <input
                v-model="passwordForm.current"
                :type="showPasswordFields.current ? 'text' : 'password'"
                placeholder="Current password"
                class="h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 pr-12 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:text-[var(--accent-strong)]"
                :aria-label="showPasswordFields.current ? 'Hide current password' : 'Show current password'"
                @click="togglePasswordField('current')"
              >
                <EyeOff v-if="showPasswordFields.current" class="h-5 w-5" />
                <Eye v-else class="h-5 w-5" />
              </button>
            </div>
          </label>
          <label class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">New Password</span>
            <div class="relative mt-2">
              <input
                v-model="passwordForm.next"
                :type="showPasswordFields.next ? 'text' : 'password'"
                placeholder="New password"
                class="h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 pr-12 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:text-[var(--accent-strong)]"
                :aria-label="showPasswordFields.next ? 'Hide new password' : 'Show new password'"
                @click="togglePasswordField('next')"
              >
                <EyeOff v-if="showPasswordFields.next" class="h-5 w-5" />
                <Eye v-else class="h-5 w-5" />
              </button>
            </div>
          </label>
          <label class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">New Password (again)</span>
            <div class="relative mt-2">
              <input
                v-model="passwordForm.confirm"
                :type="showPasswordFields.confirm ? 'text' : 'password'"
                placeholder="New password again"
                class="h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 pr-12 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[color:var(--accent-soft)]"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-tertiary)] transition hover:text-[var(--accent-strong)]"
                :aria-label="showPasswordFields.confirm ? 'Hide password confirmation' : 'Show password confirmation'"
                @click="togglePasswordField('confirm')"
              >
                <EyeOff v-if="showPasswordFields.confirm" class="h-5 w-5" />
                <Eye v-else class="h-5 w-5" />
              </button>
            </div>
          </label>
          <p class="text-sm leading-6 text-[var(--text-secondary)]">
            Passwords must contain at least eight characters, including at least 1 letter and 1 number.
          </p>
          <div>
            <button
              type="button"
              :disabled="isSavingPassword"
              class="mt-4 inline-flex h-11 items-center gap-2 rounded-[0.75rem] bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              @click="changePassword"
            >
              <Loader2 v-if="isSavingPassword" class="h-4 w-4 animate-spin" />
              {{ isSavingPassword ? 'Changing...' : 'Change Password' }}
            </button>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'email-settings'" class="space-y-7">
        <div class="rounded-[0.9rem] bg-[var(--surface-secondary)] p-5">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Email Settings</h2>
        </div>

        <div class="space-y-8">
          <label class="block">
            <span class="text-sm font-semibold text-[var(--text-primary)]">
              Email Address <span class="text-xs">(only affects your notifications email address)</span>
            </span>
            <div class="mt-2 flex overflow-hidden rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)]">
              <input
                v-model="emailAddress"
                type="email"
                placeholder="you@example.com"
                class="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm text-[var(--text-primary)] outline-none"
              />
              <button
                type="button"
                :disabled="isSavingEmail"
                class="inline-flex items-center gap-2 border-l border-[color:var(--border-soft)] bg-[var(--surface-secondary)] px-4 text-sm font-semibold text-[var(--text-primary)] transition hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                @click="changeEmail"
              >
                <Loader2 v-if="isSavingEmail" class="h-4 w-4 animate-spin" />
                {{ isSavingEmail ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </label>

          <article class="rounded-[0.9rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4">
            <p class="text-sm font-semibold text-[var(--text-primary)]">Email notification preferences are not available in the current API spec.</p>
            <p class="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
              The app will wire these toggles when a documented email-preferences endpoint is available.
            </p>
          </article>
        </div>
      </section>

      <section v-else-if="activeTab === 'privacy'" class="space-y-7">
        <div class="rounded-[0.9rem] bg-[var(--surface-secondary)] p-5">
          <h2 class="text-lg font-semibold text-[var(--text-primary)]">Privacy Settings</h2>
          <p class="mt-1 text-sm text-[var(--text-secondary)]">Select who may see your profile details</p>
        </div>

        <div class="rounded-[0.9rem] border border-dashed border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-4">
          <p class="text-sm font-semibold text-[var(--text-primary)]">Privacy settings are not available in the current API spec.</p>
          <p class="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            No privacy-settings endpoint is documented yet, so this page no longer saves placeholder visibility data.
          </p>
        </div>
      </section>

      <section
        v-else
        class="rounded-[0.95rem] border border-[color:var(--danger)] bg-[var(--surface-primary)] p-5 sm:p-6"
      >
        <h2 class="text-xl font-semibold text-[var(--danger)]">{{ deleteCopy.title }}</h2>
        <p class="mt-1 text-lg font-semibold text-[var(--danger)]">Sorry to see you go</p>
        <p class="mt-4 text-sm leading-7 text-[var(--text-primary)]">
          Before confirming that you would like your profile deleted, we'd like to take a moment to explain the implications of deletion:
        </p>
        <ul class="mt-4 list-disc space-y-3 pl-5 text-sm leading-7 text-[var(--text-secondary)]">
          <li>
            Deletion is irreversible, and you will have no way to regain any of your original content, should this deletion be carried out and you change your mind later on.
          </li>
          <li>
            Your questions and answers will remain on the site, but will be disassociated and anonymized, and will not indicate your authorship even if you later return to the site.
          </li>
        </ul>
        <p class="mt-5 text-sm leading-7 text-[var(--text-primary)]">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <label v-if="activeTab === 'delete-page'" class="mt-5 block">
          <span class="text-sm font-semibold text-[var(--text-primary)]">Page to delete</span>
          <select
            v-model="selectedDeletePageId"
            class="mt-2 h-12 w-full rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[color:var(--accent-soft)]"
          >
            <option value="">Select a page</option>
            <option v-for="page in pagesStore.pages" :key="page.id" :value="page.id">
              {{ page.name }}
            </option>
          </select>
        </label>
        <label class="mt-5 flex items-start gap-2 text-sm leading-6 text-[var(--text-primary)]">
          <input
            v-if="activeTab === 'delete-account'"
            v-model="deleteAccountConfirmed"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-[color:var(--border-soft)]"
          />
          <input
            v-else
            v-model="deletePageConfirmed"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-[color:var(--border-soft)]"
          />
          <span>
            I have read the information stated above and understand the implications of having my profile deleted. I wish to proceed with the deletion of my profile.
          </span>
        </label>
        <button
          type="button"
          class="mt-6 inline-flex h-11 items-center gap-2 rounded-[0.75rem] bg-[color:color-mix(in_srgb,var(--danger)_45%,white)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="activeTab === 'delete-account' ? !deleteAccountConfirmed : !deletePageConfirmed"
          @click="activeTab === 'delete-page' ? deleteSelectedPage() : undefined"
        >
          <Loader2 v-if="isDeletingPage" class="h-4 w-4 animate-spin" />
          <Trash2 v-else class="h-4 w-4" />
          {{ isDeletingPage ? 'Deleting...' : deleteCopy.button }}
        </button>
      </section>
    </div>
  </section>
</template>
