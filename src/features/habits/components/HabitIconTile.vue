<script setup lang="ts">
/**
 * A habit's icon on its accent-tinted background.
 *
 * The tint is what gives each habit a colour identity above the fold -- a bare
 * glyph left every card looking alike until you read the name. Extracted
 * because all three layouts plus the home card render it and differ only in
 * size, and the class string carries two coupled halves (`habit-accent-tint`
 * for the background, `habit-accent-fg` for the glyph) that are easy to drift
 * apart when copied.
 *
 * `habit-accent-fg` colours the glyph and nothing else on purpose: measured
 * against the built stylesheet the accent runs 2.2:1 to 3.6:1 on its own tint
 * in light mode, which is fine behind `AppIcon` (`aria-hidden`) and nowhere
 * near what text would need.
 */
import { AppIcon } from '@/components/app-icons'
import { resolveHabitIcon } from '../lib/habitIcons'

const SIZE_CLASS = {
  sm: 'size-7 rounded-lg',
  md: 'size-8 rounded-lg',
  lg: 'size-11 rounded-xl',
} as const

const ICON_CLASS = {
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
} as const

const { icon, size = 'md' } = defineProps<{
  icon: string | null
  size?: keyof typeof SIZE_CLASS
}>()
</script>

<template>
  <span
    class="habit-accent-tint habit-accent-fg flex shrink-0 items-center justify-center"
    :class="SIZE_CLASS[size]"
  >
    <AppIcon :name="resolveHabitIcon(icon)" :class="ICON_CLASS[size]" />
  </span>
</template>
