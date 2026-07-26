<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import type { AppIconClass } from './types'
import { type AppIconKey, getAppIcon } from './registry'

/**
 * Icons are decorative by default -- they sit beside their own visible text, so
 * announcing them again is noise. A labelled icon must carry a caller-supplied
 * `label`: the registry titles are developer-facing English, and falling back to
 * one would announce English on a German screen.
 */
const {
  name,
  label,
  decorative = true,
  class: className,
} = defineProps<
  { name: AppIconKey; class?: AppIconClass } & (
    | { decorative?: true; label?: never }
    | { decorative: false; label: string }
  )
>()

const icon = computed(() => getAppIcon(name))
</script>

<template>
  <component
    :is="icon.component"
    data-slot="app-icon"
    :data-testid="`app-icon-${name}`"
    :data-icon="name"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="decorative ? undefined : label"
    :role="decorative ? undefined : 'img'"
    :class="cn('size-full', className)"
  />
</template>
