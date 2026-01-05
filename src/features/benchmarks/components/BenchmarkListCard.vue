<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card } from '@/components/ui/card'
import { usePersonalBestDisplay } from '../composables/usePersonalBestDisplay'
import type { DbBenchmark } from '@/db/schema'

type Properties = {
  benchmark: DbBenchmark
  personalBest?: number
  formatType: (type: 'fortime', rounds: number) => string
}

const { benchmark, personalBest, formatType } = defineProps<Properties>()
const emit = defineEmits<{
  click: [id: string]
}>()
const { t } = useI18n()
const { formatCompact, getAriaLabel } = usePersonalBestDisplay()

const pbDisplay = computed(() => formatCompact(personalBest))

const cardAriaLabel = computed(() => getAriaLabel(personalBest, benchmark.name))

// Compute total exercise count from all rounds
const totalExerciseCount = computed(() =>
  benchmark.rounds.reduce((sum, round) => sum + round.exercises.length, 0),
)

function handleActivationKey(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('click', benchmark.id)
  }
}
</script>

<template>
  <Card
    role="button"
    tabindex="0"
    :aria-label="cardAriaLabel"
    class="cursor-pointer p-4 transition-colors hover:bg-accent"
    @click="emit('click', benchmark.id)"
    @keydown="handleActivationKey"
  >
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="font-medium">{{ benchmark.name }}</div>
        <div class="text-sm text-muted-foreground">
          {{ t('workouts.benchmarks.exerciseCount', { count: totalExerciseCount }) }}
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          {{ formatType(benchmark.type, benchmark.rounds.length) }}
        </div>
        <div class="mt-2 text-sm font-medium">
          {{ pbDisplay }}
        </div>
      </div>
      <div class="text-sm text-muted-foreground" aria-hidden="true">›</div>
    </div>
  </Card>
</template>
