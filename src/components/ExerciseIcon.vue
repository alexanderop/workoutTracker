<script setup lang="ts">
import type { MovementPattern, PatternColor } from '@/types/exercises'
import { getEquipmentIcon } from '@/lib/equipmentIcons'
import { getPatternColorClasses } from '@/lib/patternIcons'

type Props = {
  equipment?: string | null
  pattern?: MovementPattern | null
  color?: PatternColor | null
  size?: 'sm' | 'md' | 'lg'
}

const { equipment, pattern, color, size = 'md' } = defineProps<Props>()

const containerClasses = {
  sm: 'size-8 rounded-lg',
  md: 'size-10 rounded-lg',
  lg: 'size-12 rounded-lg',
} as const

const iconClasses = {
  sm: 'size-5',
  md: 'size-5',
  lg: 'size-6',
} as const
</script>

<template>
  <div
    :class="[
      'flex-shrink-0 flex items-center justify-center',
      containerClasses[size],
      getPatternColorClasses(pattern ?? undefined, color ?? undefined).bg,
    ]"
  >
    <component
      :is="getEquipmentIcon(equipment ?? undefined)"
      :class="[iconClasses[size], 'text-white']"
    />
  </div>
</template>
