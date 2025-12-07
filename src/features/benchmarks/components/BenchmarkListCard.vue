<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Card } from '@/components/ui/card'

type Props = {
  benchmark: {
    id: string
    name: string
    type: 'fortime' | 'rounds'
    rounds: number
    exercises: ReadonlyArray<unknown>
  }
  formatType: (type: 'fortime' | 'rounds', rounds: number) => string
}

const { benchmark, formatType } = defineProps<Props>()
const emit = defineEmits<{
  click: [id: string]
}>()
const { t } = useI18n()

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
    class="cursor-pointer p-4 transition-colors hover:bg-accent"
    @click="emit('click', benchmark.id)"
    @keydown="handleActivationKey"
  >
    <div class="flex items-center justify-between">
      <div>
        <div class="font-medium">{{ benchmark.name }}</div>
        <div class="text-sm text-muted-foreground">
          {{ t('workouts.benchmarks.exerciseCount', { count: benchmark.exercises.length }) }}
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          {{ formatType(benchmark.type, benchmark.rounds) }}
        </div>
      </div>
      <div class="text-sm text-muted-foreground">›</div>
    </div>
  </Card>
</template>
