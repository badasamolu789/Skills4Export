<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useId, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    description?: string
    label?: string
    maxWidthClass?: string
    mobileAside?: boolean
    showHeaderText?: boolean
  }>(),
  {
    label: 'Responsive Panel',
    maxWidthClass: 'sm:max-w-xl',
    mobileAside: false,
    showHeaderText: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const overlayId = useId()

const panelClasses = computed(() =>
  props.mobileAside
    ? [
        'min-h-dvh w-[min(19rem,calc(100vw-0.75rem))] overflow-y-auto border-r border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]',
        'rounded-r-[1rem] px-3 pb-4 pt-3 sm:min-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-1.5rem)] sm:rounded-[1rem] sm:px-4 sm:pb-5 sm:pt-4',
      ].join(' ')
    : [
        'w-full max-h-[calc(100dvh-1.5rem)] overflow-y-auto border border-[color:var(--border-soft)] bg-[var(--surface-primary)] shadow-[var(--shadow-elevated)]',
        'rounded-[1rem] px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4',
        props.maxWidthClass,
      ].join(' '),
)

const containerClasses = computed(() =>
  props.mobileAside
    ? 'fixed inset-0 z-50 flex items-start justify-start overflow-hidden bg-[#0c121e]'
    : 'fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-(--overlay-bg) px-3 py-3 sm:items-center sm:px-6 sm:py-6',
)

const panelTransitionClasses = computed(() =>
  props.mobileAside
    ? {
        enterActive: 'transition duration-300 ease-out',
        enterFrom: '-translate-x-full opacity-0',
        enterTo: 'translate-x-0 opacity-100',
        leaveActive: 'transition duration-200 ease-in',
        leaveFrom: 'translate-x-0 opacity-100',
        leaveTo: '-translate-x-full opacity-0',
      }
    : {
        enterActive: 'transition duration-300 ease-out',
        enterFrom: 'translate-y-8 opacity-0 sm:scale-95 sm:translate-y-0',
        enterTo: 'translate-y-0 opacity-100 sm:scale-100',
        leaveActive: 'transition duration-200 ease-in',
        leaveFrom: 'translate-y-0 opacity-100 sm:scale-100',
        leaveTo: 'translate-y-8 opacity-0 sm:scale-95 sm:translate-y-0',
      },
)

const close = () => emit('update:modelValue', false)

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.modelValue) {
    close()
  }
}

const handleContainerClick = (event: MouseEvent) => {
  if (props.mobileAside) {
    const target = event.target as HTMLElement | null
    const panelRoot = document.getElementById(overlayId)

    if (panelRoot && target && !panelRoot.contains(target)) {
      close()
    }

    return
  }

  if (event.target === event.currentTarget) {
    close()
  }
}

watch(
  () => props.modelValue,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  },
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        :class="containerClasses"
        @click="handleContainerClick"
      >
        <transition
          :enter-active-class="panelTransitionClasses.enterActive"
          :enter-from-class="panelTransitionClasses.enterFrom"
          :enter-to-class="panelTransitionClasses.enterTo"
          :leave-active-class="panelTransitionClasses.leaveActive"
          :leave-from-class="panelTransitionClasses.leaveFrom"
          :leave-to-class="panelTransitionClasses.leaveTo"
        >
          <div
            v-if="modelValue && props.mobileAside"
            :id="overlayId"
          >
            <slot />
          </div>

          <div
            v-else-if="modelValue"
            :id="overlayId"
            :class="panelClasses"
          >
            <div v-if="!props.mobileAside" class="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--surface-muted)] sm:hidden" />
            <div class="flex items-start justify-between gap-3">
              <div v-if="props.showHeaderText">
                <p class="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                  {{ label }}
                </p>
                <h3 class="mt-1.5 text-lg font-semibold text-[var(--text-primary)]">{{ title }}</h3>
                <p v-if="description" class="mt-2 max-w-lg text-[0.86rem] leading-6 text-[var(--text-secondary)]">
                  {{ description }}
                </p>
              </div>

              <button
                type="button"
                class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] text-[var(--accent-strong)] transition hover:border-[var(--accent-soft)] hover:bg-[var(--surface-muted)]"
                aria-label="Close panel"
                @click="close"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <div :class="props.showHeaderText ? 'mt-4' : 'mt-2'">
              <slot />
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>
