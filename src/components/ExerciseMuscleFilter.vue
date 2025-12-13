<script setup lang="ts">
import type { Muscle } from '@/types/exercises'

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const modelValue = defineModel<Muscle | 'all'>({ required: true })
const { t } = useI18n()

const filters = computed<Array<{ value: Muscle | 'all'; label: string }>>(() => [
  { value: 'all', label: t('exercises.filters.all') },
  { value: 'chest', label: t('exercises.muscle.chest') },
  { value: 'back', label: t('exercises.muscle.back') },
  { value: 'legs', label: t('exercises.muscle.legs') },
  { value: 'shoulders', label: t('exercises.muscle.shoulders') },
  { value: 'arms', label: t('exercises.muscle.arms') },
  { value: 'core', label: t('exercises.muscle.core') },
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
