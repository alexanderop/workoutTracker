<script setup lang="ts">
import type { Equipment } from '@/types/exercises'
import type { Component } from 'vue'

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EQUIPMENT_ICONS } from '@/lib/exercises/equipmentMetadata'

const modelValue = defineModel<Equipment | 'all'>({ required: true })
const { t } = useI18n()

const filters = computed<Array<{ value: Equipment | 'all'; label: string; icon: Component }>>(() => [
  { value: 'all', label: t('exercises.filters.all'), icon: EQUIPMENT_ICONS.all },
  { value: 'barbell', label: t('exercises.equipment.barbell'), icon: EQUIPMENT_ICONS.barbell },
  { value: 'dumbbell', label: t('exercises.equipment.dumbbell'), icon: EQUIPMENT_ICONS.dumbbell },
  { value: 'machine', label: t('exercises.equipment.machine'), icon: EQUIPMENT_ICONS.machine },
  { value: 'cable', label: t('exercises.equipment.cable'), icon: EQUIPMENT_ICONS.cable },
  { value: 'bodyweight', label: t('exercises.equipment.bodyweight'), icon: EQUIPMENT_ICONS.bodyweight },
  { value: 'kettlebell', label: t('exercises.equipment.kettlebell'), icon: EQUIPMENT_ICONS.kettlebell },
  { value: 'band', label: t('exercises.equipment.band'), icon: EQUIPMENT_ICONS.band },
  { value: 'ez-bar', label: t('exercises.equipment.ez-bar'), icon: EQUIPMENT_ICONS['ez-bar'] },
  { value: 'hex-bar', label: t('exercises.equipment.hex-bar'), icon: EQUIPMENT_ICONS['hex-bar'] },
  { value: 'club', label: t('exercises.equipment.club'), icon: EQUIPMENT_ICONS.club },
])
</script>

<template>
  <div class="flex gap-2 overflow-x-auto scrollbar-hide">
    <button
      v-for="filter in filters"
      :key="filter.value"
      type="button"
      class="filter-pill flex items-center gap-1.5"
      :class="modelValue === filter.value ? 'filter-pill-active' : 'filter-pill-inactive'"
      @click="modelValue = filter.value"
    >
      <component :is="filter.icon" class="size-3.5" aria-hidden="true" />
      {{ filter.label }}
    </button>
  </div>
</template>
