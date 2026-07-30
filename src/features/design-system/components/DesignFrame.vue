<script setup lang="ts">
import { computed } from 'vue'
import type { DesignControlState, DesignFrameSpec } from '../types'

const { spec, selected, state } = defineProps<{
  spec: DesignFrameSpec
  selected: boolean
  state?: DesignControlState
}>()

// Only playground frames declare a `state` prop; binding it unconditionally
// would land on every other frame's root element as a stray attribute.
const stateBinding = computed(() => (spec.controls ? { state } : {}))

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
      class="overflow-hidden rounded-xl border bg-background shadow-sm transition-shadow"
      :class="[
        spec.bleed ? '' : 'p-5',
        selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-transparent' : '',
      ]"
      @pointerdown="emit('select', spec.id)"
    >
      <component :is="spec.component" v-bind="stateBinding" />
    </div>
  </div>
</template>
