<script setup lang="ts">
import LegalPageLayout from '@/components/LegalPageLayout.vue'
import { useLegalDocument } from '@/composables/useLegalDocument'
import { legalService } from '@/services/legal'

const { title, content, contentType, isLoading, errorMessage } = useLegalDocument(
  legalService.getPrivacyPolicy,
)
</script>

<template>
  <LegalPageLayout
    :title="title || 'Privacy Policy'"
    :text="content"
    :content-type="contentType"
    :is-loading="isLoading"
    :error="errorMessage"
    show-sidebar
  />
</template>
