<script setup lang="ts">
import type { Equipment, Muscle } from '@/types/exercises'

import ExerciseEquipmentFilter from '@/components/ExerciseEquipmentFilter.vue'
import ExerciseMuscleFilter from '@/components/ExerciseMuscleFilter.vue'

/**
 * Shared filter component combining muscle and equipment filters.
 * Used by exercise page, picker dialogs, and overlay mode.
 */
type Properties = {
  /** Class for muscle filter row */
  muscleClass?: string
  /** Class for equipment filter row */
  equipmentClass?: string
}

const { muscleClass = '', equipmentClass = 'mt-2' } = defineProps<Properties>()

const muscleFilter = defineModel<Muscle | 'all'>('muscle', { default: 'all' })
const equipmentFilter = defineModel<Equipment | 'all'>('equipment', { default: 'all' })
</script>

<template>
  <div>
    <ExerciseMuscleFilter v-model="muscleFilter" :class="muscleClass" />
    <ExerciseEquipmentFilter v-model="equipmentFilter" :class="equipmentClass" />
  </div>
</template>
