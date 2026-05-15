import { ref } from 'vue'
import { ApiError } from '@/lib/api'
import { extractFieldErrors } from '@/lib/errors'

export const useFormFieldStates = <FieldName extends string>() => {
  const fieldErrors = ref<Partial<Record<FieldName, string>>>({})

  const getFieldError = (field: FieldName) => fieldErrors.value[field] || ''

  const hasFieldError = (field: FieldName) => Boolean(getFieldError(field))

  const getFieldState = (field: FieldName) => (hasFieldError(field) ? 'error' : undefined)

  const getFieldAttrs = (field: FieldName) => ({
    'aria-invalid': hasFieldError(field),
    'data-state': getFieldState(field),
  })

  const setFieldError = (field: FieldName, message: string) => {
    fieldErrors.value = {
      ...fieldErrors.value,
      [field]: message,
    }
  }

  const setFieldErrors = (errors: Partial<Record<FieldName, string>>) => {
    fieldErrors.value = {
      ...fieldErrors.value,
      ...errors,
    }
  }

  const setApiFieldErrors = (error: unknown) => {
    if (!(error instanceof ApiError)) {
      return false
    }

    const apiFieldErrors = extractFieldErrors(error.payload)
    if (!Object.keys(apiFieldErrors).length) {
      return false
    }

    fieldErrors.value = {
      ...fieldErrors.value,
      ...(apiFieldErrors as Partial<Record<FieldName, string>>),
    }

    return true
  }

  const clearFieldError = (field: FieldName) => {
    if (!fieldErrors.value[field]) {
      return
    }

    const nextErrors = { ...fieldErrors.value }
    delete nextErrors[field]
    fieldErrors.value = nextErrors
  }

  const clearFieldErrors = () => {
    fieldErrors.value = {}
  }

  return {
    fieldErrors,
    getFieldError,
    hasFieldError,
    getFieldState,
    getFieldAttrs,
    setFieldError,
    setFieldErrors,
    setApiFieldErrors,
    clearFieldError,
    clearFieldErrors,
  }
}
