# Error Handling Quick Reference

A quick lookup guide for implementing error handling in SkillForExport frontend components and services.

## Files Created

- **`src/lib/errors.ts`** - Error code to message mappings
- **`src/composables/useErrorHandler.ts`** - Main error handling composable
- **`src/utils/errorUtils.ts`** - Utility functions and helpers
- **`ERROR_HANDLING.md`** - Comprehensive implementation guide
- **`ERROR_HANDLING_EXAMPLES.md`** - Detailed code examples

## Quick Setup in Components

### 1. Import the composable

```typescript
import { useErrorHandler } from '@/composables/useErrorHandler'

const { handleApiError, showSuccessToast } = useErrorHandler()
```

### 2. Try-catch with error handler

```typescript
try {
  await api.post('/endpoint', data)
  showSuccessToast('Success!')
} catch (error) {
  const result = handleApiError(error)
  formErrors.value = result.fieldErrors || {}
}
```

### 3. Show inline field errors

```vue
<input v-model="form.email" />
<p v-if="formErrors.email" class="error">{{ formErrors.email }}</p>
```

## Common Error Scenarios

### Validation Errors (422)

```typescript
const { handleValidationError } = useErrorHandler()

try {
  await submitForm()
} catch (error) {
  const fieldErrors = handleValidationError(error, { showToast: false })
  // fieldErrors = { email: '...', password: '...' }
}
```

### Authentication Errors (401)

```typescript
import { isAuthError } from '@/utils/errorUtils'

try {
  await api.get('/protected')
} catch (error) {
  if (isAuthError(error)) {
    // Logout user and redirect to login
    authStore.logout()
    router.push('/login')
  } else {
    handleApiError(error)
  }
}
```

### Not Found (404)

```typescript
import { isNotFoundError } from '@/utils/errorUtils'

try {
  const item = await fetchItem(id)
} catch (error) {
  if (isNotFoundError(error)) {
    showEmptyState('Item not found')
  } else {
    handleApiError(error)
  }
}
```

### Rate Limiting (429)

```typescript
import { isRateLimitError } from '@/utils/errorUtils'

if (isRateLimitError(error)) {
  showWarningToast('Too many requests. Please wait a moment.')
}
```

### Network Errors

```typescript
import { isNetworkError, retryWithBackoff } from '@/utils/errorUtils'

try {
  const data = await retryWithBackoff(
    () => api.get('/data'),
    { maxAttempts: 3 }
  )
} catch (error) {
  if (isNetworkError(error)) {
    showErrorState('Check your internet connection', () => retry())
  }
}
```

## Error Handling Patterns

### Pattern 1: Form Submission

```typescript
async function handleSubmit() {
  formErrors.value = {}
  isSubmitting.value = true

  try {
    await api.post('/endpoint', form.value)
    showSuccessToast('Saved!')
    router.push('/success')
  } catch (error) {
    formErrors.value = handleValidationError(error, { showToast: true })
  } finally {
    isSubmitting.value = false
  }
}
```

### Pattern 2: Data Fetching

```typescript
async function fetchData() {
  isLoading.value = true
  error.value = null

  try {
    data.value = await api.get('/data')
  } catch (err) {
    const result = handleApiError(err, { showToast: false })
    error.value = result
  } finally {
    isLoading.value = false
  }
}
```

### Pattern 3: Async Operation with Retry

```typescript
async function deleteItem(id: string) {
  try {
    await retryWithBackoff(
      () => api.delete(`/items/${id}`),
      { maxAttempts: 3, retryOn: isNetworkError }
    )
    showSuccessToast('Item deleted!')
  } catch (error) {
    handleApiError(error)
  }
}
```

### Pattern 4: Debounced Save

```typescript
import { debounceAsync } from '@/utils/errorUtils'

const debouncedSave = debounceAsync(
  (data) => api.put('/profile', data),
  1000
)

watch(() => form.value, async (newValue) => {
  try {
    await debouncedSave(newValue)
  } catch (error) {
    handleApiError(error, { showToast: false })
  }
})
```

## Error Messages by Status

| Status | Default Message | Handle With |
|--------|-----------------|-------------|
| 400 | Invalid request | Check validation |
| 401 | Please log in | `isAuthError()` |
| 403 | Permission denied | Check permissions |
| 404 | Not found | `isNotFoundError()` |
| 409 | Conflict | `isConflictError()` |
| 422 | Validation error | `handleValidationError()` |
| 429 | Rate limited | `isRateLimitError()` |
| 500+ | Server error | `isServerError()` |
| Network | Connection error | `isNetworkError()` |

## Composable API

### `useErrorHandler()`

```typescript
const {
  handleApiError,           // Main error handler
  handleValidationError,    // For form validation errors
  throwUserError,          // Throw custom user error
  showErrorToast,          // Show error toast
  showWarningToast,        // Show warning toast
  showSuccessToast,        // Show success toast
  showInfoToast,           // Show info toast
} = useErrorHandler()
```

### `handleApiError(error, options)`

Returns:
```typescript
{
  message: string,           // User-friendly message
  code?: string,            // Error code from API
  fieldErrors?: Record<...>, // Validation errors by field
  status?: number           // HTTP status code
}
```

Options:
```typescript
{
  showToast?: boolean       // Auto-show toast (default: true)
  onlyFieldErrors?: boolean // Skip other errors (default: false)
}
```

## Utility Functions

### Check Error Type

```typescript
import {
  isApiError,
  isAuthError,
  isValidationError,
  isNotFoundError,
  isConflictError,
  isRateLimitError,
  isServerError,
  isNetworkError,
} from '@/utils/errorUtils'
```

### Retry with Backoff

```typescript
const result = await retryWithBackoff(
  () => api.get('/data'),
  {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    retryOn: isNetworkError,
  }
)
```

### Validation

```typescript
import { validateForm, ValidationRules } from '@/utils/errorUtils'

const errors = validateForm(form.value, [
  ValidationRules.required('email'),
  ValidationRules.email('email'),
  ValidationRules.minLength('password', 8),
  ValidationRules.passwordStrength('password'),
])
```

## Error Categories & Messages

### Auth Errors
- `invalid_credentials` → "The email or password you entered is incorrect..."
- `email_already_exists` → "An account with this email already exists..."
- `invalid_otp` → "The verification code you entered is incorrect..."
- `otp_too_frequent` → "You've requested too many codes..."
- `password_too_weak` → "Password must be at least 8 characters..."
- `session_expired` → "Your session has expired..."

### User Errors
- `profile_already_exists` → "You already have a profile..."
- `username_already_taken` → "This username is already taken..."
- `cannot_follow_self` → "You cannot follow your own account..."
- `user_not_found` → "This user account doesn't exist..."

### Media Errors
- `file_too_large` → "This file is too large. Maximum size is 10MB..."
- `unsupported_media_type` → "Only JPG, PNG, and WEBP image formats..."
- `upload_failed` → "We couldn't process your image..."
- `avatar_already_exists` → "You already have a profile picture..."

### Post Errors
- `empty_post_content` → "Your post cannot be empty..."
- `post_title_required` → "Please add a title to your post..."
- `media_not_yet_processed` → "Your images are still being processed..."
- `not_community_member` → "You must join this community..."
- `post_not_found` → "This post has been deleted..."

### Validation Errors
- `invalid_website_url` → "Please enter a valid website URL..."
- `invalid_linkedin_url` → "Please enter a valid LinkedIn profile URL..."
- `invalid_github_url` → "Please enter a valid GitHub profile URL..."
- `bio_too_long` → "Bio must be 500 characters or less"
- `invalid_username_format` → "Username can only contain letters, numbers..."

## Toast Notifications

### Success Toast
```typescript
const { showSuccessToast } = useErrorHandler()
showSuccessToast('Profile updated successfully!')
```

### Error Toast (auto-shown by handleApiError)
```typescript
handleApiError(error) // Automatically shows error toast
```

### Custom Toast
```typescript
const { showWarningToast, showInfoToast } = useErrorHandler()
showWarningToast('You have unsaved changes')
showInfoToast('Check your email for verification link')
```

## Form Error Display

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.email" />
    <span v-if="formErrors.email" class="error-text">
      {{ formErrors.email }}
    </span>
  </form>
</template>

<script setup lang="ts">
const formErrors = ref<Record<string, string>>({})

const handleSubmit = async () => {
  try {
    await api.post('/endpoint', form.value)
  } catch (error) {
    formErrors.value = handleValidationError(error)
  }
}
</script>
```

## CSS Classes (Tailwind)

Recommended error styling:

```css
.error-text {
  @apply text-sm text-red-500 mt-1 block;
}

.error-input {
  @apply border-red-500;
}

.error-state {
  @apply rounded-lg bg-red-50 p-4 text-red-800;
}

.warning-state {
  @apply rounded-lg bg-amber-50 p-4 text-amber-800;
}
```

## Best Practices

✅ **Do:**
- Show field errors inline below inputs
- Use toasts for async operation feedback
- Validate client-side before sending
- Handle specific error types differently
- Show loading states while submitting
- Provide retry buttons for failed loads
- Use success toasts for operations

❌ **Don't:**
- Show all errors in one toast
- Ignore validation errors
- Leave users confused by generic errors
- Show technical error details
- Forget to clear previous errors
- Submit multiple times
- Hide errors silently

## Debugging

Enable API debugging in `.env`:

```bash
VITE_SHOW_API_DEBUG_MODAL=true
VITE_SHOW_API_REQUEST_LOGS=true
```

Check app store for error details:

```typescript
import { useAppStore } from '@/stores/app'
const appStore = useAppStore()
console.log(appStore.apiErrorModal)
```

## Integration with Forms

### Vue Form (Composition API)

```typescript
const form = reactive({
  email: '',
  password: '',
})
const errors = ref({})

async function submit() {
  try {
    await api.post('/auth/login', form)
  } catch (error) {
    errors.value = handleValidationError(error, { showToast: false })
  }
}
```

### Form Library Integration

Most form libraries support error binding:

```typescript
form.setFieldError('email', fieldErrors.email)
form.setFieldErrors(fieldErrors)
```

## Performance Tips

- Use debouncing for save-on-change operations
- Avoid showing loading skeletons on errors
- Cache errors briefly to avoid duplicate requests
- Use timeout for long-running operations
- Clean up intervals in error handlers
