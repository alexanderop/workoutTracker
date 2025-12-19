<script setup lang="ts">
import type { Equipment } from '@/types/exercises'

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const modelValue = defineModel<Equipment | 'all'>({ required: true })
const { t } = useI18n()

const filters = computed<Array<{ value: Equipment | 'all'; label: string }>>(() => [
  { value: 'all', label: t('exercises.filters.all') },
  { value: 'barbell', label: t('exercises.equipment.barbell') },
  { value: 'dumbbell', label: t('exercises.equipment.dumbbell') },
  { value: 'machine', label: t('exercises.equipment.machine') },
  { value: 'cable', label: t('exercises.equipment.cable') },
  { value: 'bodyweight', label: t('exercises.equipment.bodyweight') },
  { value: 'kettlebell', label: t('exercises.equipment.kettlebell') },
  { value: 'band', label: t('exercises.equipment.band') },
  { value: 'ez-bar', label: t('exercises.equipment.ez-bar') },
  { value: 'hex-bar', label: t('exercises.equipment.hex-bar') },
  { value: 'club', label: t('exercises.equipment.club') },
])
</script>

<template>
  <div class="flex gap-2 overflow-x-auto scrollbar-hide">
    <button
      v-for="filter in filters"
      :key="filter.value"
      type="button"
      class="filter-pill"
      :class="modelValue === filter.value ? 'filter-pill-active' : 'filter-pill-inactive'"
      @click="modelValue = filter.value"
    >
      {{ filter.label }}
    </button>
  </div>
</template>
