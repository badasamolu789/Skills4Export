<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import AuthShell from '@/components/AuthShell.vue'
import { ApiError } from '@/lib/api'
import { authService, extractAuthSession, extractUserIdFromToken } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const statusMessage = ref('Completing your Google sign-in...')
const isProcessing = ref(true)

const getQueryValue = (key: string) => {
  if (typeof window === 'undefined') {
    return ''
  }

  return new URLSearchParams(window.location.search).get(key) ?? ''
}

const getHashValue = (key: string) => {
  if (typeof window === 'undefined') {
    return ''
  }

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash

  return new URLSearchParams(hash).get(key) ?? ''
}

const clearAuthFragment = () => {
  if (typeof window === 'undefined' || !window.location.hash) {
    return
  }

  const cleanUrl = `${window.location.pathname}${window.location.search}`
  window.history.replaceState({}, document.title, cleanUrl)
}

const finishInPopupIfNeeded = (payload: { success: boolean; token?: string; error?: string }) => {
  if (typeof window === 'undefined' || !window.opener || window.opener.closed) {
    return false
  }

  window.opener.postMessage(
    {
      type: 'skills4export-google-auth',
      ...payload,
    },
    window.location.origin,
  )
  window.close()
  return true
}

const finishSignIn = async () => {
  const error = getHashValue('error') || getQueryValue('error') || getHashValue('message') || getQueryValue('message')
  const errorDescription = getHashValue('error_description') || getQueryValue('error_description')
  const directToken = getHashValue('accessToken') || getQueryValue('accessToken') || getHashValue('token') || getQueryValue('token')
  const idToken = getHashValue('idToken') || getQueryValue('idToken') || getHashValue('credential') || getQueryValue('credential')

  if (error) {
    throw new Error(errorDescription || error)
  }

  if (directToken) {
    clearAuthFragment()
    authStore.setAuthenticatedSession(directToken, extractUserIdFromToken(directToken))
    return directToken
  }

  if (idToken) {
    clearAuthFragment()
    const response = await authService.googleTokenSignIn({ id_token: idToken })
    const session = extractAuthSession(response)

    if (!session) {
      throw new Error('Google sign-in completed, but no access token was returned.')
    }

    authStore.setAuthenticatedSession(session.token, session.userId)
    return session.token
  }

  const response = await authService.googleCallback()
  const session = extractAuthSession(response)

  if (!session) {
    throw new Error('Google sign-in could not be completed from the callback response.')
  }

  authStore.setAuthenticatedSession(session.token, session.userId)
  return session.token
}

onMounted(async () => {
  const loadingToastId = toast.loading('Signing you in with Google...', {
    description: 'Please wait while we finalize your account session.',
  })

  try {
    const token = await finishSignIn()
    statusMessage.value = 'Google sign-in complete. Redirecting to your workspace...'

    toast.success('Signed in with Google', {
      id: loadingToastId,
      description: 'Your account session is ready.',
    })

    if (finishInPopupIfNeeded({ success: true, token })) {
      return
    }

    await router.replace('/feed')
  } catch (error) {
    const message =
      error instanceof ApiError || error instanceof Error
        ? error.message
        : 'We could not complete your Google sign-in.'

    statusMessage.value = message

    toast.error('Google sign-in failed', {
      id: loadingToastId,
      description: message,
    })

    if (finishInPopupIfNeeded({ success: false, error: message })) {
      return
    }

    await router.replace('/auth/login')
  } finally {
    isProcessing.value = false
  }
})
</script>

<template>
  <AuthShell
    :centered="true"
    badge="Google Sign-In"
    title="Finishing your authentication."
    description="We are validating the Google response and preparing your session."
  >
    <div class="mx-auto flex w-full max-w-md flex-col items-center rounded-[1.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-6 py-10 text-center shadow-[var(--shadow-elevated)]">
      <div class="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-secondary)]">
        <span
          class="h-6 w-6 rounded-full border-2 border-[var(--accent)] border-t-[var(--surface-primary)]"
          :class="isProcessing ? 'animate-spin' : ''"
        />
      </div>

      <p class="mt-5 text-lg font-semibold text-[var(--text-primary)]">
        {{ statusMessage }}
      </p>
    </div>
  </AuthShell>
</template>
