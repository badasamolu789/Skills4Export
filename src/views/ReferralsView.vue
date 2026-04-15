<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Copy } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const emailInput = ref('')

const referralLink = computed(() => {
  const username = authStore.signUpDraft.username || 'samuelbada'
  return `https://www.skills4export.com/share/${username}-referral-link`
})

const parsedEmails = computed(() =>
  emailInput.value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
)

const sendReferralInvite = () => {
  if (!parsedEmails.value.length) {
    toast.error('Enter at least one email address.')
    return
  }

  if (parsedEmails.value.length > 5) {
    toast.error('You can send to at most 5 email addresses at once.')
    return
  }

  toast.success('Referral invite prepared', {
    description: `Invite ready for ${parsedEmails.value.join(', ')}.`,
  })

  emailInput.value = ''
}

const copyReferralLink = async () => {
  try {
    await navigator.clipboard.writeText(referralLink.value)
    toast.success('Referral link copied', {
      description: 'You can now paste it anywhere you want to share it.',
    })
  } catch {
    toast.error('Unable to copy referral link.')
  }
}
</script>

<template>
  <section class="px-1 py-2 sm:px-2">
    <div class="mx-auto max-w-6xl rounded-[2rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] sm:p-8 lg:p-12">
      <div class="max-w-4xl">
        <h1 class="text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-[var(--text-primary)] sm:text-[2.75rem] lg:text-[3.25rem]">
          Spread the word with friends.
        </h1>

        <div class="mt-8">
          <p class="text-xl text-[var(--text-primary)] sm:text-2xl">Send a friend by email.</p>

          <div class="mt-5 overflow-hidden rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)]">
            <div class="flex flex-col sm:flex-row">
              <input
                v-model="emailInput"
                type="text"
                placeholder="Enter 5 email address separated by comma"
                class="min-h-16 flex-1 border-none bg-transparent px-5 text-lg text-[var(--text-primary)] outline-none placeholder:text-[color:color-mix(in_srgb,var(--text-secondary)_55%,white)] sm:px-7"
              />
              <button
                type="button"
                class="inline-flex min-h-16 items-center justify-center gap-3 border-t border-[color:var(--border-soft)] px-6 text-lg font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-secondary)] sm:min-w-[10.5rem] sm:border-l sm:border-t-0"
                @click="sendReferralInvite"
              >
                <span>Send</span>
                <ArrowRight class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div class="mt-12">
          <p class="text-xl text-[var(--text-primary)] sm:text-2xl">Copy and paste your referral link anywhere.</p>

          <div class="mt-5 overflow-hidden rounded-[1.1rem] border border-[color:var(--border-soft)] bg-[var(--surface-secondary)]">
            <div class="flex flex-col sm:flex-row">
              <div class="flex min-h-16 flex-1 items-center px-5 text-lg text-[var(--text-primary)] sm:px-7">
                <span class="block w-full truncate">{{ referralLink }}</span>
              </div>
              <button
                type="button"
                class="inline-flex min-h-16 items-center justify-center gap-3 border-t border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-6 text-lg font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)] sm:min-w-[10.5rem] sm:border-l sm:border-t-0"
                @click="copyReferralLink"
              >
                <Copy class="h-5 w-5" />
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
