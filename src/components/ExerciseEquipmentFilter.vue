<script setup lang="ts">
import type { Equipment } from '@/types/exercises'
import type { Component } from 'vue'

import {
  Cable,
  CircleDot,
  Cog,
  Dumbbell,
  Hexagon,
  LayoutGrid,
  Link,
  PersonStanding,
  Weight,
} from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const modelValue = defineModel<Equipment | 'all'>({ required: true })
const { t } = useI18n()

const equipmentIcons: Record<Equipment | 'all', Component> = {
  all: LayoutGrid,
  barbell: Dumbbell,
  dumbbell: Dumbbell,
  machine: Cog,
  cable: Cable,
  bodyweight: PersonStanding,
  kettlebell: Weight,
  band: Link,
  'ez-bar': Dumbbell,
  'hex-bar': Hexagon,
  club: CircleDot,
}

const filters = computed<Array<{ value: Equipment | 'all'; label: string; icon: Component }>>(() => [
  { value: 'all', label: t('exercises.filters.all'), icon: equipmentIcons.all },
  { value: 'barbell', label: t('exercises.equipment.barbell'), icon: equipmentIcons.barbell },
  { value: 'dumbbell', label: t('exercises.equipment.dumbbell'), icon: equipmentIcons.dumbbell },
  { value: 'machine', label: t('exercises.equipment.machine'), icon: equipmentIcons.machine },
  { value: 'cable', label: t('exercises.equipment.cable'), icon: equipmentIcons.cable },
  { value: 'bodyweight', label: t('exercises.equipment.bodyweight'), icon: equipmentIcons.bodyweight },
  { value: 'kettlebell', label: t('exercises.equipment.kettlebell'), icon: equipmentIcons.kettlebell },
  { value: 'band', label: t('exercises.equipment.band'), icon: equipmentIcons.band },
  { value: 'ez-bar', label: t('exercises.equipment.ez-bar'), icon: equipmentIcons['ez-bar'] },
  { value: 'hex-bar', label: t('exercises.equipment.hex-bar'), icon: equipmentIcons['hex-bar'] },
  { value: 'club', label: t('exercises.equipment.club'), icon: equipmentIcons.club },
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
