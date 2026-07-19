<script setup lang="ts">
import type { Equipment } from '@/types/exercises'
import type { Component } from 'vue'

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { EQUIPMENT_VALUES } from '@/types/exercises'
import { EQUIPMENT_ICONS } from '@/lib/exercises/equipmentMetadata'
import ScrollFadeContainer from '@/components/ScrollFadeContainer.vue'

const modelValue = defineModel<Equipment | 'all'>({ required: true })
const { t } = useI18n()

// Derived from EQUIPMENT_VALUES so every equipment type gets a filter chip —
// a hardcoded list here silently hid new types (battle-rope, egym) from filtering.
const filters = computed<Array<{ value: Equipment | 'all'; label: string; icon: Component }>>(
  () => [
    { value: 'all', label: t('exercises.filters.all'), icon: EQUIPMENT_ICONS.all },
    ...EQUIPMENT_VALUES.map((value) => ({
      value,
      label: t(`exercises.equipment.${value}`),
      icon: EQUIPMENT_ICONS[value],
    })),
  ],
)
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
        <component :is="filter.icon" class="size-3.5" aria-hidden="true" />
        {{ filter.label }}
      </button>
    </div>
  </ScrollFadeContainer>
</template>
