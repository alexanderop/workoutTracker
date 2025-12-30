<script setup lang="ts">
import type { Muscle } from '@/types/exercises'

import { LayoutGrid } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MUSCLE_COLORS } from '@/lib/exercises/muscleMetadata'
import ScrollFadeContainer from '@/components/ScrollFadeContainer.vue'

const modelValue = defineModel<Muscle | 'all'>({ required: true })
const { t } = useI18n()

const filters = computed<Array<{ value: Muscle | 'all'; label: string; color?: string }>>(() => [
  { value: 'all', label: t('exercises.filters.all') },
  { value: 'chest', label: t('exercises.muscle.chest'), color: MUSCLE_COLORS.chest },
  { value: 'back', label: t('exercises.muscle.back'), color: MUSCLE_COLORS.back },
  { value: 'legs', label: t('exercises.muscle.legs'), color: MUSCLE_COLORS.legs },
  { value: 'shoulders', label: t('exercises.muscle.shoulders'), color: MUSCLE_COLORS.shoulders },
  { value: 'arms', label: t('exercises.muscle.arms'), color: MUSCLE_COLORS.arms },
  { value: 'core', label: t('exercises.muscle.core'), color: MUSCLE_COLORS.core },
])
</script>

<template>
  <ScrollFadeContainer>
    <div class="flex gap-2">
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
  </ScrollFadeContainer>
</template>
