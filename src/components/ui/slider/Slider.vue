<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

// `label` names the thumb, not the root. reka-ui gives a single-thumb slider no
// accessible name at all (its built-in fallback only kicks in for range
// sliders), and an `aria-label` on <Slider> would land on the wrapper div —
// never on the element that actually has role="slider".
const props = defineProps<SliderRootProps & { class?: HTMLAttributes['class']; label?: string }>()
const emits = defineEmits<SliderRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'label')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

/**
 * One name per thumb. A range slider's handles are separate controls, so
 * repeating the same name on both would leave a screen reader user unable to
 * tell which end they are dragging. Mirrors reka-ui's own positional wording,
 * with the caller's label supplying the context reka-ui has no way to know.
 */
function thumbLabel(index: number, total: number): string | undefined {
  if (!props.label) return undefined
  if (total <= 1) return props.label
  if (total === 2) return `${props.label} ${index === 0 ? 'minimum' : 'maximum'}`
  return `${props.label} value ${index + 1} of ${total}`
}
</script>

<template>
  <SliderRoot
    v-slot="{ modelValue }"
    data-slot="slider"
    :class="
      cn(
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
        props.class,
      )
    "
    v-bind="forwarded"
  >
    <SliderTrack
      data-slot="slider-track"
      class="bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
    >
      <SliderRange
        data-slot="slider-range"
        class="bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
      />
    </SliderTrack>

    <SliderThumb
      v-for="(_, key) in modelValue"
      :key="key"
      data-slot="slider-thumb"
      :aria-label="thumbLabel(key, modelValue?.length ?? 0)"
      class="bg-white border-primary ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderRoot>
</template>
