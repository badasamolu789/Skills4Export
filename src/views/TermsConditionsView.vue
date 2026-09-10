<script setup lang="ts">
import LegalPageLayout from '@/components/LegalPageLayout.vue'
import { useLegalDocument } from '@/composables/useLegalDocument'
import { legalService } from '@/services/legal'

const { title, content, contentType, isLoading, errorMessage } = useLegalDocument(
  legalService.getTerms,
)
</script>

<template>
  <LegalPageLayout
    :title="title || 'Terms and Conditions'"
    :text="content"
    :content-type="contentType"
    :is-loading="isLoading"
    :error="errorMessage"
    show-sidebar
  />
</template>
