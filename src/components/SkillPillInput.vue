<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  disabled?: boolean
}>(), {
  placeholder: 'Type a skill, then add a comma',
  disabled: false,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const draft = ref('')

const skills = computed(() =>
  props.modelValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
)

const commitSkills = (value: string) => {
  const nextSkills = [...skills.value]

  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((skill) => {
      const exists = nextSkills.some((item) => item.toLowerCase() === skill.toLowerCase())

      if (!exists) {
        nextSkills.push(skill)
      }
    })

  emit('update:modelValue', nextSkills.join(', '))
}

const handleInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value

  if (!value.includes(',')) {
    draft.value = value
    return
  }

  const segments = value.split(',')
  draft.value = (segments.pop() ?? '').trimStart()
  commitSkills(segments.join(','))
}

const finalizeDraft = () => {
  if (!draft.value.trim()) {
    return
  }

  commitSkills(draft.value)
  draft.value = ''
}

const removeSkill = (skill: string) => {
  emit('update:modelValue', skills.value.filter((item) => item !== skill).join(', '))
}

watch(
  () => props.modelValue,
  () => {
    if (!props.modelValue.trim()) {
      draft.value = ''
    }
  },
)
</script>

<template>
  <div
    class="mt-1 flex min-h-11 flex-wrap items-center gap-2 rounded-[0.75rem] border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-3 py-2 text-sm transition focus-within:border-[color:var(--accent-soft)]"
    :class="disabled ? 'opacity-70' : ''"
  >
    <span
      v-for="skill in skills"
      :key="skill"
      class="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[color:color-mix(in_srgb,var(--accent)_14%,white)] px-3 py-1.5 text-[0.8rem] font-semibold text-[var(--accent-strong)]"
    >
      <span class="truncate">{{ skill }}</span>
      <button
        type="button"
        :disabled="disabled"
        class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[var(--accent-strong)] transition hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed"
        :aria-label="`Remove ${skill}`"
        @click="removeSkill(skill)"
      >
        <X class="h-3.5 w-3.5" />
      </button>
    </span>

    <input
      :value="draft"
      type="text"
      :disabled="disabled"
      :placeholder="skills.length ? '' : placeholder"
      class="h-8 min-w-[12rem] flex-1 border-none bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] disabled:cursor-not-allowed"
      @input="handleInput"
      @blur="finalizeDraft"
      @keydown.enter.prevent="finalizeDraft"
    />
  </div>
</template>
