import { onMounted, ref } from 'vue'
import { ApiError } from '@/lib/api'
import type { ApiSuccessResponse } from '@/services/posts'
import type { LegalDocumentContentType, LegalDocumentRecord } from '@/services/legal'

type LegalDocumentLoader = () => Promise<ApiSuccessResponse<LegalDocumentRecord>>

export const useLegalDocument = (loader: LegalDocumentLoader) => {
  const title = ref('')
  const content = ref('')
  const contentType = ref<LegalDocumentContentType>('html')
  const isLoading = ref(true)
  const errorMessage = ref('')

  const loadDocument = async () => {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await loader()
      const document = response.data

      title.value = document.title
      content.value = document.content
      contentType.value = document.contentType
    } catch (error) {
      errorMessage.value = error instanceof ApiError || error instanceof Error
        ? error.message
        : 'Unable to load this document.'
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    void loadDocument()
  })

  return {
    title,
    content,
    contentType,
    isLoading,
    errorMessage,
  }
}
