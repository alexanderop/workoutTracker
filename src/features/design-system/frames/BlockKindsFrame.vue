<script setup lang="ts">
/**
 * The six workout block kinds. Labels and colors come from the real
 * `BLOCK_META` registry, never a copy — and `summaries` being keyed by
 * `BlockKind` means adding a kind fails the build until it is described here.
 */
import { BLOCK_META } from '@/blocks'
import type { BlockKind } from '@/blocks'

const kinds: ReadonlyArray<BlockKind> = ['strength', 'amrap', 'emom', 'tabata', 'fortime', 'cardio']

const summaries: Record<BlockKind, string> = {
  strength: 'Sets, reps and load. The default.',
  amrap: 'As many rounds as possible in a fixed window.',
  emom: 'Every minute on the minute.',
  tabata: '20s work, 10s rest, eight rounds.',
  fortime: 'Fixed work, race the clock.',
  cardio: 'Distance, duration or pace.',
}
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <div class="space-y-4">
    <p class="text-xs text-muted-foreground">
      Each kind owns one accent token used three ways: a solid accent bar, a
      <code>/20</code> tinted surface, and text.
    </p>

    <div
      v-for="kind in kinds"
      :key="kind"
      class="flex items-stretch gap-3 overflow-hidden rounded-lg border"
    >
      <div class="w-1.5 shrink-0" :class="BLOCK_META[kind].color.accent" />
      <div class="min-w-0 flex-1 py-3 pr-3">
        <div class="flex items-center gap-2">
          <span
            class="rounded-md px-2 py-0.5 text-xs font-semibold"
            :class="[BLOCK_META[kind].color.bg, BLOCK_META[kind].color.text]"
          >
            {{ BLOCK_META[kind].label }}
          </span>
          <code class="text-[10px] text-muted-foreground">--block-{{ kind }}</code>
        </div>
        <p class="pt-1 text-xs text-muted-foreground">{{ summaries[kind] }}</p>
      </div>
    </div>
  </div>
</template>
