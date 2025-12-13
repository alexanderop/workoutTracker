<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { BarChart3, ChevronRight } from 'lucide-vue-next'
import { RouteNames } from '@/router'
import { formatRelativeDate } from '@/lib/formatters'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import type { LastSessionData } from '@/features/workout/composables/useWorkout'

const { workoutId, completedAt, sets } = defineProps<{
  workoutId: string
  completedAt: number
  sets: LastSessionData['sets']
}>()

const { t } = useI18n()
const { toDisplayValue, unitLabel } = useWeightDisplay()

/**
 * Format the sets summary as "80kg x 8, 8, 7" or "80kg, 85kg, 90kg x 5, 5, 5"
 * Collapses identical weights to show weight once.
 */
const formattedSummary = computed(() => {
  if (sets.length === 0) return ''

  // Get display weights and reps
  const displayWeights = sets.map((set) => {
    const displayWeight = toDisplayValue(set.kg)
    return displayWeight !== undefined ? String(displayWeight) : '—'
  })

  const reps = sets.map((set) => set.reps || '—')

  // Check if all weights are the same
  const allSameWeight = displayWeights.every((w) => w === displayWeights[0])

  if (allSameWeight) {
    // Format: "80kg x 8, 8, 7"
    return `${displayWeights[0]}${unitLabel.value} x ${reps.join(', ')}`
  }

  // Format: "80, 85, 90kg x 8, 8, 8"
  return `${displayWeights.join(', ')}${unitLabel.value} x ${reps.join(', ')}`
})

const formattedDate = computed(() => formatRelativeDate(completedAt))
</script>

<template>
  <RouterLink
    :to="{ name: RouteNames.WorkoutDetail, params: { id: workoutId } }"
    class="block"
  >
    <div
      class="flex items-center gap-3 px-3 py-2 bg-muted/30 rounded-lg
             hover:bg-muted/50 transition-colors cursor-pointer group"
    >
      <BarChart3 class="icon-sm text-muted-foreground shrink-0" aria-hidden="true" />
      <span class="text-sm text-muted-foreground truncate">
        {{ t('workouts.lastSession.label') }}: {{ formattedSummary }}
      </span>
      <span class="text-xs text-muted-foreground/70 ml-auto shrink-0">
        {{ formattedDate }}
      </span>
      <ChevronRight
        class="icon-sm text-muted-foreground/50 shrink-0
               group-hover:translate-x-0.5 transition-transform"
        aria-hidden="true"
      />
    </div>
  </RouterLink>
</template>
