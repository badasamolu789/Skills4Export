# Error Handling Implementation Guide

This guide explains how to implement user-facing error handling across the SkillForExport frontend using the new error handling system.

## Overview

The error handling system consists of:
- **`src/lib/errors.ts`** - Error code to user-friendly message mappings
- **`src/composables/useErrorHandler.ts`** - Composable for handling errors with toast notifications
- **`src/lib/api.ts`** - Enhanced API layer with better error messages

## Quick Start

### 1. Using `useErrorHandler` in Components

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useErrorHandler } from '@/composables/useErrorHandler'

const { handleApiError, showSuccessToast } = useErrorHandler()

const isLoading = ref(false)
const formErrors = ref({})

async function handleLogin(credentials) {
  isLoading.value = true
  formErrors.value = {}
  
  try {
    const response = await api.post('/auth/login', credentials)
    showSuccessToast('Login successful!')
    // Continue with login flow
  } catch (error) {
    const result = handleApiError(error)
    // result.fieldErrors can be used to show inline field errors
    formErrors.value = result.fieldErrors || {}
  } finally {
    isLoading.value = false
  }
}
</script>
```

### 2. Handling Form Validation Errors

For 422 validation errors with field-level details:

```typescript
async function submitForm(data) {
  try {
    await api.post('/users/profile', data)
  } catch (error) {
    const { handleValidationError } = useErrorHandler()
    const fieldErrors = handleValidationError(error, { showToast: false })
    
    // fieldErrors is now { email: 'Email already exists', username: 'Username taken' }
    // Apply these errors to form fields
    Object.entries(fieldErrors).forEach(([field, message]) => {
      form.setFieldError(field, message)
    })
  }
}
```

### 3. Using Toast Notifications

```typescript
const { 
  showErrorToast, 
  showWarningToast, 
  showSuccessToast, 
  showInfoToast 
} = useErrorHandler()

// After successful operations
showSuccessToast('Profile updated successfully!')

// For warnings
showWarningToast('You have unsaved changes')

// For informational messages
showInfoToast('Check your email for verification link')
```

## Error Categories Supported

The system handles errors across all API endpoints:

### Authentication (`/api/auth/*`)
- Invalid credentials
- Email already registered
- Invalid OTP code
- Password too weak
- Google token expired
- Account not verified

### User Profile (`/api/users/*`)
- Profile already exists
- Username taken
- Cannot follow yourself
- User not found
- Unauthorized access

### Media Upload (`/api/media/*`)
- File too large
- Unsupported file type
- Upload failed
- Avatar/banner already exists

### Posts (`/api/posts/*`)
- Empty post content
- Media not processed
- Not a community member
- Cannot edit/delete others' posts
- Post not found

### Questions (`/api/questions/*`)
- Missing required fields
- Question/answer not found
- Cannot answer closed question

### Communities (`/api/communities/*`)
- Community name taken
- Already a member
- Cannot delete community

### Pages (`/api/pages/*`)
- Page slug taken
- Page not approved/inactive
- Cannot manage page

## Implementing in Services

Here's how to use the error handler in service functions:

```typescript
// src/services/auth.ts
import { useErrorHandler } from '@/composables/useErrorHandler'
import { api } from '@/lib/api'

export const loginUser = async (credentials) => {
  const { handleApiError } = useErrorHandler()
  
  try {
    const response = await api.post('/auth/login', credentials)
    return response
  } catch (error) {
    const errorInfo = handleApiError(error)
    throw errorInfo // Re-throw with structured error info
  }
}
```

## Best Practices

### 1. Toast Messages
Use toast notifications for async operations:
- Login/Sign up success
- Profile updates
- Post/comment creation
- File uploads
- Deletions

```typescript
try {
  await api.post('/posts', postData)
  showSuccessToast('Post created successfully!')
} catch (error) {
  handleApiError(error) // Already shows error toast
}
```

### 2. Form Validation Errors
Show validation errors inline:
```vue
<template>
  <form @submit.prevent="submitForm">
    <input v-model="form.email" />
    <span v-if="formErrors.email" class="error">{{ formErrors.email }}</span>
  </form>
</template>
```

### 3. Network Errors
Handle gracefully with retry options:
```typescript
try {
  // API call
} catch (error) {
  const result = handleApiError(error)
  // Show retry button if network error
  if (result.status === 0) {
    // Network error - show retry button
  }
}
```

### 4. Critical Errors
Show modal dialogs for critical errors:
```typescript
try {
  // Important operation
} catch (error) {
  const { message, status } = handleApiError(error, { showToast: false })
  
  if (status >= 500) {
    // Show modal instead of toast for server errors
    showErrorModal(message)
  }
}
```

## API Error Response Format

The system handles various API error response formats:

```json
{
  "code": "email_already_exists",
  "message": "Email is already registered",
  "errors": {
    "email": ["Email already exists"],
    "password": ["Password too weak"]
  }
}
```

## Extending the Error Mapping

To add new error codes, update `src/lib/errors.ts`:

```typescript
// Add to the appropriate category object
const AUTH_ERRORS: Record<string, string> = {
  // ... existing errors
  new_error_code: 'User-friendly message for this error',
}

// For validation errors, add to VALIDATION_ERRORS
const VALIDATION_ERRORS: Record<string, string> = {
  // ... existing validations
  custom_validation_rule: 'Your custom validation message',
}
```

## Customizing Toast Duration

```typescript
const { handleApiError } = useErrorHandler()

// Default duration is 5000ms
handleApiError(error)

// Custom duration
const result = handleApiError(error, { 
  showToast: true,
  toastDuration: 7000 
})
```

## Error Severity Levels

The system automatically determines error severity:
- **429 (Rate Limited)**: Warning (yellow)
- **4xx errors**: Warning (yellow)
- **5xx errors**: Error (red)

Adjust toast styling based on severity in your toast component.

## Testing Error Scenarios

To test the error handling:

```typescript
// Simulate API error
import { ApiError } from '@/lib/api'

const mockError = new ApiError('Test error', 401, {
  code: 'invalid_credentials'
})

const { handleApiError } = useErrorHandler()
const result = handleApiError(mockError)
console.log(result) // Shows user-friendly message
```

## Integration with Form Libraries

### Vue Form (or similar)

```typescript
const form = reactive({
  email: '',
  password: '',
  errors: {}
})

async function submit() {
  try {
    await api.post('/auth/login', {
      email: form.email,
      password: form.password
    })
  } catch (error) {
    const fieldErrors = handleValidationError(error, { showToast: false })
    form.errors = fieldErrors
  }
}
```

## Error Handling in Stores (Pinia)

```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { useErrorHandler } from '@/composables/useErrorHandler'

export const useAuthStore = defineStore('auth', {
  actions: {
    async login(credentials) {
      const { handleApiError } = useErrorHandler()
      
      try {
        const response = await api.post('/auth/login', credentials)
        this.token = response.accessToken
      } catch (error) {
        const { message, code } = handleApiError(error)
        this.lastError = { message, code }
        throw error
      }
    }
  }
})
```

## Common Patterns

### Pattern 1: API Call with Toast Feedback
```typescript
async function saveProfile(profileData) {
  try {
    await api.put(`/users/${userId}/profile`, profileData)
    showSuccessToast('Profile saved successfully!')
  } catch (error) {
    handleApiError(error)
  }
}
```

### Pattern 2: Form Submission with Inline Errors
```typescript
async function submitForm() {
  formErrors.value = {}
  try {
    await api.post('/posts', formData)
    showSuccessToast('Post created!')
    router.push('/')
  } catch (error) {
    formErrors.value = handleValidationError(error, { showToast: true })
  }
}
```

### Pattern 3: Lazy Loading with Fallback
```typescript
async function loadContent() {
  try {
    content.value = await api.get('/content')
  } catch (error) {
    const { message, status } = handleApiError(error, { showToast: false })
    if (status === 404) {
      showEmptyState('No content found')
    } else {
      showErrorState(message, () => loadContent())
    }
  }
}
```

## Migration Checklist

To implement error handling across the app:

- [ ] Add error handling to all authentication flows
- [ ] Add field-level validation error handling to forms
- [ ] Add error handling to all API calls in services
- [ ] Show success toasts for create/update/delete operations
- [ ] Implement empty states with retry for failed data loads
- [ ] Add error boundaries for critical sections
- [ ] Test error scenarios for each feature
- [ ] Update loading states to prevent error flashes

## Configuration

Error toast position and duration can be customized in `useErrorHandler`:

```typescript
const showErrorToast = (message: string, duration = 5000) => {
  toast.error(message, {
    duration,
    position: 'top-right', // Can change to 'top-center', 'bottom-right', etc.
  })
}
```

## Debugging

To debug API errors during development, check the API error modal in the app store:

```typescript
const appStore = useAppStore()
console.log(appStore.apiErrorModal) // Shows full error details
```

Or enable API request logging in `.env`:

```
VITE_SHOW_API_REQUEST_LOGS=true
VITE_SHOW_API_DEBUG_MODAL=true
```
