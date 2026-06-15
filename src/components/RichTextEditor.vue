<script setup lang="ts">
import { computed } from 'vue'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import type { EditorRelaxedConstructor } from '@ckeditor/ckeditor5-integrations-common'

const props = withDefaults(defineProps<{
  modelValue: string
  disabled?: boolean
  placeholder?: string
}>(), {
  disabled: false,
  placeholder: '',
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const editor = ClassicEditor as unknown as EditorRelaxedConstructor

const editorValue = computed({
  get: () => props.modelValue || '',
  set: (value: string) => emit('update:modelValue', value),
})

const editorConfig = {
  placeholder: '',
  toolbar: {
    items: [],
  },
}
</script>

<template>
  <div class="s4e-rich-editor">
    <Ckeditor
      v-model="editorValue"
      :editor="editor"
      :disabled="disabled"
      :config="{ ...editorConfig, placeholder }"
    />
  </div>
</template>

<style scoped>
.s4e-rich-editor :deep(.ck.ck-editor) {
  width: 100%;
}

.s4e-rich-editor :deep(.ck.ck-toolbar) {
  display: none;
}

.s4e-rich-editor :deep(.ck.ck-editor__main > .ck-editor__editable) {
  min-height: 8rem;
  border-color: var(--border-soft);
  border-radius: 0.75rem;
  background: var(--surface-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.75;
}

.s4e-rich-editor :deep(.ck.ck-editor__editable_inline) {
  cursor: text;
}

.s4e-rich-editor :deep(.ck.ck-editor__editable_inline > :first-child) {
  margin-top: 0;
}

.s4e-rich-editor :deep(.ck.ck-editor__editable_inline > :last-child) {
  margin-bottom: 0;
}

.s4e-rich-editor :deep(.ck.ck-editor__main > .ck-editor__editable.ck-focused) {
  border-color: var(--accent-soft);
  box-shadow: none;
}
</style>
