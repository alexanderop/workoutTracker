<script setup lang="ts">
import type { NumberFieldRootEmits, NumberFieldRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { NumberFieldRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<NumberFieldRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<NumberFieldRootEmits>()

// Without format-options, Intl defaults to maximumFractionDigits 3, so reka-ui derives
// inputmode="decimal" and Android shows the cluttered keyboard; defaulting to an integer
// format here gives inputmode="numeric" instead (decimal call sites, e.g. weight, pass
// their own format-options to opt back in). formatOptions is dropped from delegatedProps
// so the computed below is the single source reka-ui binds — leaving it delegated too
// would forward it twice.
const INTEGER_FORMAT_OPTIONS: Intl.NumberFormatOptions = { maximumFractionDigits: 0 }

const delegatedProps = reactiveOmit(props, 'class', 'formatOptions')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
const formatOptions = computed(() => props.formatOptions ?? INTEGER_FORMAT_OPTIONS)
</script>

<template>
  <NumberFieldRoot
    v-slot="slotProps"
    v-bind="forwarded"
    :format-options="formatOptions"
    :class="cn('grid gap-1.5', props.class)"
  >
    <slot v-bind="slotProps" />
  </NumberFieldRoot>
</template>
