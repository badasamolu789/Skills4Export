<script setup lang="ts">
import { computed, ref } from 'vue'
import { Monitor, Moon, Sun } from 'lucide-vue-next'
import { useTheme, type ThemeMode } from '@/composables/useTheme'

const activeTab = ref<'password' | 'theme' | 'email' | 'privacy' | 'delete-account' | 'delete-page'>('theme')

const { theme, resolvedTheme, setTheme } = useTheme()

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
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="space-y-3 px-1">
      <div class="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
        <RouterLink to="/feed" class="transition hover:text-[var(--accent-strong)]">Home</RouterLink>
        <span>/</span>
        <span class="font-medium text-[var(--accent-strong)]">Settings</span>
      </div>
      <div>
        <h1 class="text-[1.65rem] font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.95rem] lg:text-[2.1rem]">
          Settings
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
          Manage your account settings and application preferences.
        </p>
      </div>
    </div>

    <div class="mt-8 rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-8">
      <div class="overflow-hidden rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)]">
        <div class="flex flex-wrap items-center gap-3 border-b border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-6 py-4">
          <button
            type="button"
            class="rounded-full px-4 py-3 text-sm transition"
            :class="activeTab === 'password' ? 'border-b-2 border-[var(--accent)] font-semibold text-[var(--accent-strong)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'"
            @click="activeTab = 'password'"
          >
            Change Password
          </button>
          <button
            type="button"
            class="rounded-full px-4 py-3 text-sm transition"
            :class="activeTab === 'theme' ? 'border-b-2 border-[var(--accent)] font-semibold text-[var(--accent-strong)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'"
            @click="activeTab = 'theme'"
          >
            Theme
          </button>
          <button
            type="button"
            class="rounded-full px-4 py-3 text-sm text-[var(--text-secondary)] transition hover:text-[var(--accent)]"
            @click="activeTab = 'email'"
          >
            Email Settings
          </button>
          <button
            type="button"
            class="rounded-full px-4 py-3 text-sm text-[var(--text-secondary)] transition hover:text-[var(--accent)]"
            @click="activeTab = 'privacy'"
          >
            Privacy
          </button>
          <button
            type="button"
            class="rounded-full px-4 py-3 text-sm text-[var(--text-secondary)] transition hover:text-[var(--accent)]"
            @click="activeTab = 'delete-account'"
          >
            Delete Account
          </button>
          <button
            type="button"
            class="rounded-full px-4 py-3 text-sm text-[var(--text-secondary)] transition hover:text-[var(--accent)]"
            @click="activeTab = 'delete-page'"
          >
            Delete Page
          </button>
        </div>

        <div class="px-6 py-8">
          <section v-if="activeTab === 'theme'" class="space-y-6">
            <div class="rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-6">
              <h2 class="text-base font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">Appearance</h2>
              <p class="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                Choose how Skills4Export looks for you. Your selection is saved on this device.
              </p>
            </div>

            <div class="grid gap-4 lg:grid-cols-3">
              <button
                v-for="option in themeOptions"
                :key="option.value"
                type="button"
                class="rounded-[1.25rem] border p-5 text-left transition"
                :class="
                  theme === option.value
                    ? 'border-[var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_9%,var(--surface-primary))] text-[var(--text-primary)]'
                    : 'border-[color:var(--border-soft)] bg-[var(--surface-primary)] text-[var(--text-primary)] hover:border-[var(--accent-soft)]'
                "
                @click="setTheme(option.value)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--accent-strong)]">
                    <component :is="option.icon" class="h-5 w-5" />
                  </div>
                  <div
                    class="mt-1 h-4 w-4 rounded-full border"
                    :class="theme === option.value ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[color:var(--border-soft)] bg-transparent'"
                  />
                </div>
                <p class="mt-4 text-lg font-semibold">{{ option.label }}</p>
                <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {{ option.description }}
                </p>
              </button>
            </div>

            <div class="rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5">
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                Current selection: <span class="text-[var(--accent-strong)]">{{ theme }}</span>
              </p>
              <p class="mt-2 text-sm text-[var(--text-secondary)]">
                {{ resolvedThemeLabel }}
              </p>
            </div>
          </section>

          <section v-else class="rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)] p-6">
            <h2 class="text-base font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
              {{ activeTab.replace('-', ' ') }}
            </h2>
            <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              This section is ready for the next settings update.
            </p>
          </section>
        </div>
      </div>
    </div>
  </section>
</template>
