<script setup lang="ts">
import { ChevronDown, Dumbbell } from 'lucide-vue-next'
import { computed } from 'vue'
import { useToggle } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import type { DbStrengthBlock } from '@/db/schema'
import WorkoutDetailSetTable from './WorkoutDetailSetTable.vue'

const { exercise } = defineProps<{
  exercise: DbStrengthBlock
}>()

const { t } = useI18n()
const { formatWithUnit } = useWeightDisplay()
const [isOpen] = useToggle(false)

const completedSets = computed(() => exercise.sets.filter((s) => s.status === 'completed'))

const summary = computed(() => {
  const sets = completedSets.value
  if (sets.length === 0) return t('workouts.sets.noSetsCompleted')

  const bestWeightKg = Math.max(...sets.map((s) => Number.parseFloat(s.kg) || 0))
  return `${sets.length} set${sets.length > 1 ? 's' : ''} × ${formatWithUnit(bestWeightKg, 1)}`
})
</script>

<template>
  <Collapsible v-model:open="isOpen">
    <Card class="overflow-hidden">
      <CollapsibleTrigger as-child>
        <CardHeader class="cursor-pointer select-none transition-colors hover:bg-muted/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary"
              >
                <Dumbbell class="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 class="text-lg font-medium">{{ exercise.name }}</h3>
                <p class="text-sm text-muted-foreground">{{ summary }}</p>
              </div>
            </div>
            <ChevronDown
              class="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200"
              :class="{ 'rotate-180': isOpen }"
            />
          </div>
        </CardHeader>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <CardContent class="pt-0">
          <WorkoutDetailSetTable :sets="exercise.sets" />

          <div v-if="exercise.targetReps > 0" class="mt-3 text-sm text-muted-foreground">
            {{ t('workouts.sets.target', { reps: exercise.targetReps }) }}
          </div>
        </CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>
</template>
