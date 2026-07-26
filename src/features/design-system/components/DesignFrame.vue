<script setup lang="ts">
import type { DesignFrameSpec } from '../types'

const { spec, selected } = defineProps<{
  spec: DesignFrameSpec
  selected: boolean
}>()

const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <!-- eslint-disable @intlify/vue-i18n/no-raw-text -- design reference surface, not product copy -->
  <!--
    `data-design-frame` opts this subtree out of drag-to-pan so the real
    components inside stay clickable — the canvas only pans from empty space
    (or with space held).
  -->
  <div
    data-design-frame
    :data-frame-id="spec.id"
    class="flex shrink-0 flex-col gap-1.5"
    :style="{ width: `${spec.width}px` }"
  >
    <button
      type="button"
      class="flex w-fit items-baseline gap-2 rounded px-0.5 text-left"
      @click="emit('select', spec.id)"
    >
      <span
        class="text-xs font-medium transition-colors"
        :class="selected ? 'text-primary' : 'text-muted-foreground hover:text-foreground'"
      >
        {{ spec.name }}
      </span>
      <span class="text-[10px] tabular-nums text-muted-foreground/50">{{ spec.width }}</span>
    </button>

    <div
      class="rounded-xl border bg-background p-5 shadow-sm transition-shadow"
      :class="selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-transparent' : ''"
      @pointerdown="emit('select', spec.id)"
    >
      <component :is="spec.component" />
    </div>
  </div>
</template>
