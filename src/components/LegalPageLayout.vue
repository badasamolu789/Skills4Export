<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

type ParsedSection = {
  id: string
  title: string
  blocks: string[]
}

const props = defineProps<{
  title: string
  text: string
  showSidebar?: boolean
}>()

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const isTopLevelSectionHeading = (line: string) => /^\d+\.\s+\S/.test(line)

const toBlocks = (lines: string[]) => {
  const blocks: string[] = []
  let currentBlock: string[] = []

  lines.forEach((line) => {
    if (!line.trim()) {
      if (currentBlock.length) {
        blocks.push(currentBlock.join('\n'))
        currentBlock = []
      }
      return
    }

    currentBlock.push(line)
  })

  if (currentBlock.length) {
    blocks.push(currentBlock.join('\n'))
  }

  return blocks
}

const parsedSections = computed<ParsedSection[]>(() => {
  const lines = props.text.replace(/\r\n/g, '\n').split('\n').map((line) => line.trimEnd())
  const sections: Array<{ id: string; title: string; lines: string[] }> = []
  let currentSection: { id: string; title: string; lines: string[] } | null = null
  const usedIds = new Map<string, number>()

  const getUniqueId = (title: string) => {
    const baseId = slugify(title) || 'section'
    const count = usedIds.get(baseId) ?? 0
    usedIds.set(baseId, count + 1)
    return count ? `${baseId}-${count + 1}` : baseId
  }

  lines.forEach((line) => {
    const shouldStartSection = props.showSidebar && isTopLevelSectionHeading(line)

    if (shouldStartSection) {
      if (currentSection) {
        sections.push(currentSection)
      }

      currentSection = {
        id: getUniqueId(line),
        title: line,
        lines: [],
      }
      return
    }

    if (!currentSection) {
      currentSection = {
        id: 'overview',
        title: '',
        lines: [],
      }
    }

    currentSection.lines.push(line)
  })

  if (currentSection) {
    sections.push(currentSection)
  }

  return sections
    .map((section) => ({
      id: section.id,
      title: section.title,
      blocks: toBlocks(section.lines),
    }))
    .filter((section) => section.title || section.blocks.length)
})

const navigationSections = computed(() =>
  props.showSidebar ? parsedSections.value.filter((section) => section.title) : [],
)
</script>

<template>
  <section class="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
    <header class="border-b border-[color:var(--border-soft)] bg-[var(--surface-primary)]">
      <div class="mx-auto flex w-full max-w-7xl flex-col items-center px-4 py-10 text-center sm:px-6 lg:px-8 lg:py-14">
        <RouterLink to="/" class="inline-flex items-center justify-center">
          <img loading="eager" decoding="async" fetchpriority="high" src="/logo_1.svg" alt="Skills4Export logo" class="h-12 w-auto sm:h-14" />
        </RouterLink>
        <h1 class="mt-7 text-3xl font-bold tracking-normal text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
          {{ title }}
        </h1>
      </div>
    </header>

    <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div
        class="grid gap-6 lg:gap-8"
        :class="showSidebar ? 'lg:grid-cols-[18rem_minmax(0,1fr)]' : 'lg:grid-cols-1'"
      >
        <aside v-if="showSidebar" class="lg:sticky lg:top-6 lg:self-start">
          <nav
            aria-label="Document sections"
            class="rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] p-3 shadow-[var(--shadow-soft)]"
          >
            <a
              v-for="section in navigationSections"
              :key="section.id"
              :href="`#${section.id}`"
              class="block rounded-xl px-4 py-3 text-sm font-semibold leading-5 text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--accent-strong)]"
            >
              {{ section.title }}
            </a>
          </nav>
        </aside>

        <article class="rounded-2xl border border-[color:var(--border-soft)] bg-[var(--surface-primary)] px-5 py-6 shadow-[var(--shadow-soft)] sm:px-7 lg:px-9 lg:py-9">
          <section
            v-for="section in parsedSections"
            :id="section.title ? section.id : undefined"
            :key="section.id"
            class="scroll-mt-8 first:pt-0"
            :class="section.title ? 'pt-9' : ''"
          >
            <h2
              v-if="section.title"
              class="text-2xl font-bold leading-snug tracking-normal text-[var(--text-primary)]"
            >
              {{ section.title }}
            </h2>
            <div class="mt-5 space-y-5 text-base leading-8 text-[var(--text-secondary)] sm:text-[1.05rem]">
              <p
                v-for="(block, blockIndex) in section.blocks"
                :key="`${section.id}-${blockIndex}`"
                class="whitespace-pre-line"
              >
                {{ block }}
              </p>
            </div>
          </section>
        </article>
      </div>
    </main>
  </section>
</template>
