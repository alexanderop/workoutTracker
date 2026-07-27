<script setup lang="ts">
/**
 * The tick control every habit layout shares.
 *
 * A plain `<button>`, not the shadcn `Button`: the `outline` variant emits its
 * own background and border utilities (including dark-mode ones), and
 * Tailwind's utilities layer outranks the components layer where the habit
 * accent used to live -- so the accent classes resolved to nothing and every
 * habit's control painted the same neutral grey regardless of the colour the
 * user chose. With no competing utility on the element the accent applies.
 *
 * Extracted rather than fixed in place because all three layouts plus the home
 * card render this control; the sizes below are the only thing they disagreed
 * on.
 */
import { Check } from '@lucide/vue'

/**
 * `sm` is the home card's existing 36px control, kept so a glance surface this
 * work didn't otherwise touch doesn't shift. `md` is the app's 44px touch
 * floor, for the layouts where ticking off is the primary gesture. `lg` is the
 * roomy card layout, where the control is the card's main affordance.
 */
const SIZE_CLASS = {
  sm: 'size-9 rounded-lg',
  md: 'size-touch-target rounded-xl',
  lg: 'size-12 rounded-xl',
} as const

const ICON_CLASS = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
} as const

const {
  pressed,
  label,
  size = 'md',
} = defineProps<{
  pressed: boolean
  label: string
  size?: keyof typeof SIZE_CLASS
}>()

const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="inline-flex shrink-0 items-center justify-center border-2 transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    :class="[SIZE_CLASS[size], pressed ? 'habit-today-complete' : 'habit-today-incomplete']"
    :aria-pressed="pressed"
    :aria-label="label"
    @click="emit('toggle')"
  >
    <Check v-if="pressed" :class="ICON_CLASS[size]" />
  </button>
</template>
