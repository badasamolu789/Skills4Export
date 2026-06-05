<script setup lang="ts">
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'
import type { EditorRelaxedConstructor } from '@ckeditor/ckeditor5-integrations-common'

withDefaults(defineProps<{
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

const editorConfig = {
  placeholder: '',
  toolbar: [
    'heading',
    '|',
    'bold',
    'italic',
    'link',
    '|',
    'bulletedList',
    'numberedList',
    '|',
    'undo',
    'redo',
  ],
}
</script>

<template>
  <div class="s4e-rich-editor">
    <Ckeditor
      :editor="editor"
      :model-value="modelValue"
      :disabled="disabled"
      :config="{ ...editorConfig, placeholder }"
      @update:model-value="emit('update:modelValue', String($event || ''))"
    />
  </div>
</template>

<style scoped>
.s4e-rich-editor :deep(.ck.ck-editor) {
  width: 100%;
}

.s4e-rich-editor :deep(.ck.ck-toolbar) {
  border-color: var(--border-soft);
  border-top-left-radius: 0.75rem;
  border-top-right-radius: 0.75rem;
  background: var(--surface-secondary);
}

.s4e-rich-editor :deep(.ck.ck-editor__main > .ck-editor__editable) {
  min-height: 8rem;
  border-color: var(--border-soft);
  border-bottom-left-radius: 0.75rem;
  border-bottom-right-radius: 0.75rem;
  background: var(--surface-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.75;
}

.s4e-rich-editor :deep(.ck.ck-editor__main > .ck-editor__editable.ck-focused) {
  border-color: var(--accent-soft);
  box-shadow: none;
}
</style>
