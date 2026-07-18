<script setup lang="ts">
import type { SVGAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { getExerciseIcon } from './registry'

const {
  name,
  label,
  decorative = true,
  class: className,
} = defineProps<{
  name: string
  label?: string
  decorative?: boolean
  class?: SVGAttributes['class']
}>()

const resolvedIcon = computed(() => getExerciseIcon(name))
const accessibleLabel = computed(() => label ?? resolvedIcon.value?.title)
</script>

<template>
  <component
    :is="resolvedIcon.component"
    v-if="resolvedIcon"
    data-slot="exercise-icon"
    :data-testid="`exercise-icon-${resolvedIcon.key}`"
    :data-icon="resolvedIcon.key"
    :data-exercise-icon="resolvedIcon.key"
    :data-decorative="decorative"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="decorative ? undefined : accessibleLabel"
    :role="decorative ? undefined : 'img'"
    :class="cn('size-full', className)"
  />
</template>
