# Error Handling Implementation Examples

This document provides concrete examples of implementing user-facing error handling in the SkillForExport frontend.

## Example 1: Updated Login View with Proper Error Handling

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthShell from '@/components/AuthShell.vue'
import { authService, extractAuthSession } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { usePasswordToggle } from '@/composables/usePasswordToggle'

const authStore = useAuthStore()
const router = useRouter()
const { handleApiError, showSuccessToast } = useErrorHandler()

const isSubmitting = ref(false)
const passwordToggle = usePasswordToggle()
const form = ref({
  email: '',
  password: '',
  rememberMe: true,
})
const formErrors = ref<Record<string, string>>({})

const submitLogin = async () => {
  if (isSubmitting.value) {
    return
  }

  // Reset previous errors
  formErrors.value = {}
  isSubmitting.value = true

  try {
    const response = await authService.login({
      email: form.value.email,
      password: form.value.password,
    })

    const session = extractAuthSession(response)
    if (!session) {
      throw new Error('No access token was returned by the server.')
    }

    authStore.signUpDraft.email = form.value.email
    authStore.setAuthenticatedSession(session.token, session.userId)
    showSuccessToast('Signed in successfully!')
    
    router.push('/')
  } catch (error) {
    const result = handleApiError(error)
    
    // Show field-level errors if available
    if (result.fieldErrors) {
      formErrors.value = result.fieldErrors
    }
  } finally {
    isSubmitting.value = false
  }
}

const continueWithGoogle = () => {
  window.location.href = authService.getGoogleRedirectUrl()
}
</script>

<template>
  <AuthShell
    :centered="true"
    badge="Login"
    title="Welcome back"
    description="Sign in to your account"
  >
    <form @submit.prevent="submitLogin" class="space-y-4">
      <div>
        <input 
          v-model="form.email" 
          type="email" 
          placeholder="Email address"
          required
          class="w-full rounded px-3 py-2"
          :aria-invalid="Boolean(formErrors.email)"
        />
        <p v-if="formErrors.email" class="mt-1 text-sm text-red-500">
          {{ formErrors.email }}
        </p>
      </div>

      <div>
        <input 
          v-model="form.password" 
          :type="passwordToggle.isVisible.value ? 'text' : 'password'" 
          placeholder="Password"
          required
          class="w-full rounded px-3 py-2"
          :aria-invalid="Boolean(formErrors.password)"
        />
        <p v-if="formErrors.password" class="mt-1 text-sm text-red-500">
          {{ formErrors.password }}
        </p>
      </div>

      <button 
        type="submit" 
        :disabled="isSubmitting"
        class="w-full rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
      >
        {{ isSubmitting ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>

    <button 
      @click="continueWithGoogle"
      class="mt-4 w-full rounded border px-4 py-2"
    >
      Continue with Google
    </button>
  </AuthShell>
</template>
```

## Example 2: Sign Up View with Email and Password Validation

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import { useErrorHandler } from '@/composables/useErrorHandler'

const router = useRouter()
const authStore = useAuthStore()
const { handleValidationError, showSuccessToast } = useErrorHandler()

const isSubmitting = ref(false)
const form = ref({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
})
const formErrors = ref<Record<string, string>>({})

// Validate password strength client-side
const passwordStrength = computed(() => {
  const password = form.value.password
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++
  
  return strength
})

const canSubmit = computed(() => {
  return (
    form.value.fullName &&
    form.value.email &&
    form.value.password &&
    form.value.password === form.value.confirmPassword &&
    form.value.acceptedTerms &&
    passwordStrength.value >= 3
  )
})

const submitSignUp = async () => {
  if (!canSubmit.value || isSubmitting.value) {
    return
  }

  formErrors.value = {}
  isSubmitting.value = true

  try {
    await authService.signUp({
      fullName: form.value.fullName,
      email: form.value.email,
      password: form.value.password,
    })

    // Store sign-up data for next step
    authStore.signUpDraft.name = form.value.fullName
    authStore.signUpDraft.email = form.value.email
    authStore.signUpDraft.password = form.value.password

    showSuccessToast('Account created! Verify your email to continue.')
    router.push('/verify-email')
  } catch (error) {
    formErrors.value = handleValidationError(error, { showToast: true })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submitSignUp" class="space-y-4">
    <div>
      <label>Full Name</label>
      <input 
        v-model="form.fullName" 
        type="text"
        required
        :aria-invalid="Boolean(formErrors.fullName)"
      />
      <p v-if="formErrors.fullName" class="error">{{ formErrors.fullName }}</p>
    </div>

    <div>
      <label>Email</label>
      <input 
        v-model="form.email" 
        type="email"
        required
        :aria-invalid="Boolean(formErrors.email)"
      />
      <p v-if="formErrors.email" class="error">{{ formErrors.email }}</p>
    </div>

    <div>
      <label>Password</label>
      <input 
        v-model="form.password" 
        type="password"
        required
        :aria-invalid="Boolean(formErrors.password)"
      />
      <div class="mt-2 flex gap-1">
        <div 
          v-for="i in 5" 
          :key="i"
          :class="[
            'h-1 flex-1 rounded-full',
            i <= passwordStrength.value ? 'bg-green-500' : 'bg-gray-200'
          ]"
        />
      </div>
      <p v-if="formErrors.password" class="error">{{ formErrors.password }}</p>
    </div>

    <div>
      <label>Confirm Password</label>
      <input 
        v-model="form.confirmPassword" 
        type="password"
        required
      />
      <p v-if="form.password !== form.confirmPassword" class="error">
        Passwords do not match
      </p>
    </div>

    <label>
      <input v-model="form.acceptedTerms" type="checkbox" required />
      I accept the Terms of Service
    </label>

    <button 
      type="submit" 
      :disabled="!canSubmit || isSubmitting"
      class="w-full"
    >
      {{ isSubmitting ? 'Creating Account...' : 'Create Account' }}
    </button>
  </form>
</template>
```

## Example 3: Create Post with Media Validation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { postsService } from '@/services/posts'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { handleApiError, showSuccessToast } = useErrorHandler()

const isSubmitting = ref(false)
const form = ref({
  title: '',
  content: '',
  communityId: '',
  mediaIds: [] as string[],
})
const formErrors = ref<Record<string, string>>({})
const isUploadingMedia = ref(false)
const uploadProgress = ref(0)

const uploadMedia = async (files: File[]) => {
  isUploadingMedia.value = true
  uploadProgress.value = 0

  try {
    const uploadedIds: string[] = []
    
    for (const file of files) {
      // Check file size client-side
      const MAX_SIZE = 10 * 1024 * 1024 // 10MB
      if (file.size > MAX_SIZE) {
        formErrors.value.media = `File "${file.name}" is too large. Maximum size is 10MB.`
        continue
      }

      // Check file type
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
      if (!ALLOWED_TYPES.includes(file.type)) {
        formErrors.value.media = `File "${file.name}" has an unsupported format.`
        continue
      }

      try {
        const mediaId = await postsService.uploadMedia(file)
        uploadedIds.push(mediaId)
        uploadProgress.value = Math.round((uploadedIds.length / files.length) * 100)
      } catch (error) {
        const result = handleApiError(error, { showToast: false })
        formErrors.value.media = result.message
      }
    }

    form.value.mediaIds = uploadedIds
  } finally {
    isUploadingMedia.value = false
    uploadProgress.value = 0
  }
}

const submitPost = async () => {
  if (isSubmitting.value) return

  formErrors.value = {}
  isSubmitting.value = true

  try {
    // Wait for media to be processed
    if (form.value.mediaIds.length > 0) {
      const unprocessedMedia = await checkMediaStatus(form.value.mediaIds)
      if (unprocessedMedia.length > 0) {
        formErrors.value.media = 'Your images are still being processed. Please wait a moment.'
        return
      }
    }

    await postsService.createPost({
      title: form.value.title,
      content: form.value.content,
      communityId: form.value.communityId,
      mediaAssetIds: form.value.mediaIds,
    })

    showSuccessToast('Post published successfully!')
    // Reset form or redirect
  } catch (error) {
    const result = handleApiError(error)
    formErrors.value = result.fieldErrors || {}
    
    // If general error, show in banner
    if (!result.fieldErrors || Object.keys(result.fieldErrors).length === 0) {
      formErrors.value.general = result.message
    }
  } finally {
    isSubmitting.value = false
  }
}

const checkMediaStatus = async (mediaIds: string[]) => {
  // Implementation to check if media is processed
  return []
}
</script>

<template>
  <form @submit.prevent="submitPost" class="space-y-6">
    <!-- Error Banner -->
    <div v-if="formErrors.general" class="rounded bg-red-50 p-4 text-red-800">
      {{ formErrors.general }}
    </div>

    <!-- Title -->
    <div>
      <label>Post Title</label>
      <input 
        v-model="form.title" 
        type="text"
        placeholder="What's your post about?"
        :aria-invalid="Boolean(formErrors.title)"
      />
      <p v-if="formErrors.title" class="error">{{ formErrors.title }}</p>
    </div>

    <!-- Content -->
    <div>
      <label>Content</label>
      <textarea 
        v-model="form.content"
        placeholder="Share your thoughts..."
        rows="8"
        :aria-invalid="Boolean(formErrors.content)"
      />
      <p v-if="formErrors.content" class="error">{{ formErrors.content }}</p>
    </div>

    <!-- Media Upload -->
    <div>
      <label>Add Images</label>
      <div 
        class="border-2 border-dashed rounded p-6 text-center"
        @drop.prevent="uploadMedia($event.dataTransfer.files as any)"
        @dragover.prevent
      >
        <input
          type="file"
          multiple
          accept="image/*"
          @change="uploadMedia($event.target.files as any)"
        />
      </div>
      <p v-if="formErrors.media" class="error">{{ formErrors.media }}</p>
      
      <!-- Upload Progress -->
      <div v-if="isUploadingMedia" class="mt-2">
        <div class="bg-gray-200 rounded-full h-2">
          <div 
            class="bg-blue-500 h-2 rounded-full transition-all"
            :style="{ width: uploadProgress + '%' }"
          />
        </div>
        <p class="text-sm text-gray-600 mt-1">{{ uploadProgress }}% uploaded</p>
      </div>
    </div>

    <button 
      type="submit" 
      :disabled="isSubmitting || isUploadingMedia"
      class="w-full"
    >
      {{ isSubmitting ? 'Publishing...' : 'Publish Post' }}
    </button>
  </form>
</template>
```

## Example 4: Profile Edit with Multiple Field Types

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { usersService } from '@/services/users'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { handleValidationError, showSuccessToast } = useErrorHandler()

const isSubmitting = ref(false)
const form = ref({
  bio: '',
  website: '',
  linkedin: '',
  github: '',
  location: '',
  headline: '',
})
const formErrors = ref<Record<string, string>>({})

const submitProfile = async () => {
  formErrors.value = {}
  isSubmitting.value = true

  try {
    await usersService.updateProfile(form.value)
    showSuccessToast('Profile updated successfully!')
  } catch (error) {
    const result = handleValidationError(error, { showToast: false })
    
    // Map field-level errors
    Object.entries(result).forEach(([field, message]) => {
      formErrors.value[field] = message
    })

    // Show toast for critical errors
    if (Object.keys(result).length === 0) {
      const apiError = handleApiError(error, { showToast: true })
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submitProfile" class="space-y-6">
    <div>
      <label>Bio ({{ form.bio.length }}/500)</label>
      <textarea 
        v-model="form.bio"
        maxlength="500"
        placeholder="Tell us about yourself"
        :aria-invalid="Boolean(formErrors.bio)"
      />
      <p v-if="formErrors.bio" class="error">{{ formErrors.bio }}</p>
    </div>

    <div>
      <label>Website</label>
      <input 
        v-model="form.website"
        type="url"
        placeholder="https://example.com"
        :aria-invalid="Boolean(formErrors.website)"
      />
      <p v-if="formErrors.website" class="error">{{ formErrors.website }}</p>
    </div>

    <div>
      <label>LinkedIn</label>
      <input 
        v-model="form.linkedin"
        type="url"
        placeholder="https://linkedin.com/in/yourprofile"
        :aria-invalid="Boolean(formErrors.linkedin)"
      />
      <p v-if="formErrors.linkedin" class="error">{{ formErrors.linkedin }}</p>
    </div>

    <div>
      <label>GitHub</label>
      <input 
        v-model="form.github"
        type="url"
        placeholder="https://github.com/yourprofile"
        :aria-invalid="Boolean(formErrors.github)"
      />
      <p v-if="formErrors.github" class="error">{{ formErrors.github }}</p>
    </div>

    <button 
      type="submit" 
      :disabled="isSubmitting"
      class="w-full"
    >
      {{ isSubmitting ? 'Saving...' : 'Save Profile' }}
    </button>
  </form>
</template>
```

## Example 5: Service with Error Handling Wrapper

```typescript
// src/services/posts.ts
import { useErrorHandler } from '@/composables/useErrorHandler'
import { api } from '@/lib/api'

export const postsService = {
  async createPost(data: CreatePostRequest) {
    const { handleApiError } = useErrorHandler()
    
    try {
      const response = await api.post('/posts', data)
      return response
    } catch (error) {
      const { message, fieldErrors, status } = handleApiError(error, { showToast: false })
      
      // Re-throw with additional context
      const enhancedError = new Error(message)
      ;(enhancedError as any).fieldErrors = fieldErrors
      ;(enhancedError as any).status = status
      throw enhancedError
    }
  },

  async uploadMedia(file: File) {
    const { handleApiError } = useErrorHandler()
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/media/upload', formData)
      return response.mediaId
    } catch (error) {
      const { message } = handleApiError(error, { showToast: true })
      throw new Error(message)
    }
  },

  async deletePost(postId: string) {
    const { handleApiError, showSuccessToast } = useErrorHandler()

    try {
      await api.delete(`/posts/${postId}`)
      showSuccessToast('Post deleted successfully!')
    } catch (error) {
      handleApiError(error)
      throw error
    }
  }
}
```

## Example 6: Composable for Data Fetching with Error State

```typescript
// src/composables/useFetch.ts
import { ref, onMounted } from 'vue'
import { useErrorHandler } from '@/composables/useErrorHandler'

export function useFetch<T>(
  fetchFn: () => Promise<T>,
  options = { autoFetch: true }
) {
  const data = ref<T | null>(null)
  const isLoading = ref(false)
  const error = ref<{ message: string; status?: number } | null>(null)
  const { handleApiError } = useErrorHandler()

  const fetch = async () => {
    isLoading.value = true
    error.value = null

    try {
      data.value = await fetchFn()
    } catch (err) {
      const result = handleApiError(err, { showToast: false })
      error.value = {
        message: result.message,
        status: result.status,
      }
    } finally {
      isLoading.value = false
    }
  }

  const retry = () => fetch()

  if (options.autoFetch) {
    onMounted(() => fetch())
  }

  return {
    data,
    isLoading,
    error,
    fetch,
    retry,
  }
}
```

## Example 7: Using in a Component with useFetch

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { usersService } from '@/services/users'
import { useFetch } from '@/composables/useFetch'

const { data: profile, isLoading, error, retry } = useFetch(
  () => usersService.getProfile(),
  { autoFetch: true }
)
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="animate-pulse">
      <div class="h-12 bg-gray-200 rounded" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="rounded bg-red-50 p-4">
      <p class="text-red-800">{{ error.message }}</p>
      <button 
        @click="retry"
        class="mt-2 text-sm text-red-600 underline"
      >
        Try Again
      </button>
    </div>

    <!-- Data State -->
    <div v-else-if="profile">
      <h2>{{ profile.name }}</h2>
      <p>{{ profile.bio }}</p>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center text-gray-500">
      No profile found
    </div>
  </div>
</template>
```

## Implementation Checklist

Use these patterns to update your views and services:

- [ ] Replace manual error handling with `useErrorHandler`
- [ ] Add `formErrors` ref to forms
- [ ] Display field-level errors below inputs
- [ ] Show success toasts for operations
- [ ] Use error states with retry buttons for data fetching
- [ ] Add loading states to prevent error flashes
- [ ] Validate file uploads client-side before sending
- [ ] Show upload progress for large files
- [ ] Test with actual API error responses
- [ ] Update all service functions to use error handler
