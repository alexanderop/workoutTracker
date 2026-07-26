<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from '@lucide/vue'
import { Input } from '@/components/ui/input'
import type { DesignSection } from '../types'

const { sections, selectedId } = defineProps<{
  sections: ReadonlyArray<DesignSection>
  selectedId: string | null
}>()

const emit = defineEmits<{
  select: [id: string]
}>()

const query = ref('')

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return sections
  return sections
    .map((section) => ({
      ...section,
      frames: section.frames.filter(
        (frame) =>
          frame.name.toLowerCase().includes(needle) ||
          frame.description.toLowerCase().includes(needle),
      ),
    }))
    .filter((section) => section.frames.length > 0)
})

const frameCount = computed(() =>
  filtered.value.reduce((total, section) => total + section.frames.length, 0),
)
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design tooling chrome, not product copy -->
  <aside class="flex w-56 shrink-0 flex-col border-r bg-card">
    <div class="relative shrink-0 p-2">
      <Search
        class="pointer-events-none absolute left-4 top-1/2 icon-sm -translate-y-1/2 text-muted-foreground"
      />
      <Input v-model="query" placeholder="Search frames" class="h-8 pl-8 text-xs" />
    </div>

    <nav class="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
      <div v-for="section in filtered" :key="section.id" class="mb-4">
        <p
          class="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {{ section.name }}
        </p>
        <button
          v-for="frame in section.frames"
          :key="frame.id"
          type="button"
          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors"
          :class="
            frame.id === selectedId
              ? 'bg-accent font-medium text-accent-foreground'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
          "
          @click="emit('select', frame.id)"
        >
          <span
            class="size-1.5 shrink-0 rounded-full"
            :class="frame.id === selectedId ? 'bg-primary' : 'bg-border'"
          />
          <span class="truncate">{{ frame.name }}</span>
        </button>
      </div>

      <p v-if="frameCount === 0" class="px-2 py-4 text-xs text-muted-foreground">
        No frames match “{{ query }}”.
      </p>
    </nav>
  </aside>
</template>
