<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import type { AppIconClass } from './types'
import { type AppIconKey, getAppIcon } from './registry'

const {
  name,
  label,
  decorative = true,
  class: className,
} = defineProps<{
  name: AppIconKey
  label?: string
  decorative?: boolean
  class?: AppIconClass
}>()

const icon = computed(() => getAppIcon(name))
const accessibleLabel = computed(() => label ?? icon.value.title)
</script>

<template>
  <component
    :is="icon.component"
    data-slot="app-icon"
    :data-testid="`app-icon-${name}`"
    :data-icon="name"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="decorative ? undefined : accessibleLabel"
    :role="decorative ? undefined : 'img'"
    :class="cn('size-full', className)"
  />
</template>
