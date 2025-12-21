<script setup lang="ts">
import type { Muscle } from '@/types/exercises'

import { LayoutGrid } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const modelValue = defineModel<Muscle | 'all'>({ required: true })
const { t } = useI18n()

const muscleColors: Record<Muscle, string> = {
  chest: 'bg-muscle-chest',
  back: 'bg-muscle-back',
  legs: 'bg-muscle-legs',
  shoulders: 'bg-muscle-shoulders',
  arms: 'bg-muscle-arms',
  core: 'bg-muscle-core',
}

const filters = computed<Array<{ value: Muscle | 'all'; label: string; color?: string }>>(() => [
  { value: 'all', label: t('exercises.filters.all') },
  { value: 'chest', label: t('exercises.muscle.chest'), color: muscleColors.chest },
  { value: 'back', label: t('exercises.muscle.back'), color: muscleColors.back },
  { value: 'legs', label: t('exercises.muscle.legs'), color: muscleColors.legs },
  { value: 'shoulders', label: t('exercises.muscle.shoulders'), color: muscleColors.shoulders },
  { value: 'arms', label: t('exercises.muscle.arms'), color: muscleColors.arms },
  { value: 'core', label: t('exercises.muscle.core'), color: muscleColors.core },
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
      <LayoutGrid v-if="filter.value === 'all'" class="size-3.5" aria-hidden="true" />
      <span v-else class="size-2.5 rounded-full" :class="filter.color" aria-hidden="true" />
      {{ filter.label }}
    </button>
  </div>
</template>
