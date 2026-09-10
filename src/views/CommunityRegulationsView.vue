<script setup lang="ts">
import LegalPageLayout from '@/components/LegalPageLayout.vue'
import { useLegalDocument } from '@/composables/useLegalDocument'
import { legalService } from '@/services/legal'

const { title, content, contentType, isLoading, errorMessage } = useLegalDocument(
  legalService.getCommunityRules,
)
</script>

<template>
  <LegalPageLayout
    :title="title || 'Community Regulations'"
    :text="content"
    :content-type="contentType"
    :is-loading="isLoading"
    :error="errorMessage"
  />
</template>
