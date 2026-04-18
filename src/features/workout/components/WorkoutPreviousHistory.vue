<script setup lang="ts">
import type { Set } from '@/types/workout'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Separator } from '@/components/ui/separator'
import { useWeightDisplay } from '@/composables/useWeightDisplay'

type Properties = {
  sets: ReadonlyArray<Set>
  date?: string
}

const { sets, date } = defineProps<Properties>()

const { t } = useI18n()
const { toDisplayValue, unitLabel } = useWeightDisplay()

function formatSetWeight(kgValue: string): string {
  if (!kgValue) return '—'
  const display = toDisplayValue(kgValue)
  return display === undefined ? '—' : String(display)
}

const hasHistoryData = computed(() => sets.some((set) => set.kg !== '' || set.reps !== ''))
</script>

<template>
  <div v-if="hasHistoryData" class="mt-2">
    <Separator class="my-6" />
    <p class="text-xs font-semibold text-muted-foreground mb-3">
      {{ t('workouts.previous.label', { date: date }).toUpperCase() }}
    </p>
    <div class="space-y-1">
      <div
        v-for="(set, index) in sets.slice(0, 3)"
        :key="set.id"
        class="flex justify-between text-sm px-2 py-1 bg-secondary/30 rounded"
      >
        <span class="text-muted-foreground">{{
          t('workouts.previous.setLabel', { number: index + 1 })
        }}</span>
        <span class="font-medium"
          >{{ formatSetWeight(set.kg) }} {{ unitLabel }} × {{ set.reps }}</span
        >
      </div>
    </div>
  </div>
</template>
