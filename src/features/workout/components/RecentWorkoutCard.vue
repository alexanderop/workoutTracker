<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Card } from '@/components/ui/card'
import type { RecentWorkout } from '@/features/workout/composables/useRecentWorkouts'

type Properties = {
  workout: RecentWorkout
}

const { workout } = defineProps<Properties>()
const emit = defineEmits<{
  click: [id: string]
}>()

const { t } = useI18n()

function handleActivationKey(event: KeyboardEvent): void {
  if (!(event.key === 'Enter' || event.key === ' ')) {
    return
  }

  event.preventDefault()
  emit('click', workout.id)
}
</script>

<template>
  <Card
    role="button"
    tabindex="0"
    class="cursor-pointer p-3 transition-colors hover:bg-accent"
    @click="emit('click', workout.id)"
    @keydown="handleActivationKey"
  >
    <div class="flex items-center justify-between">
      <div class="min-w-0 flex-1">
        <div class="truncate font-medium">{{ workout.name }}</div>
        <div class="text-sm text-muted-foreground">
          {{ workout.relativeDate }}
        </div>
      </div>
      <div class="flex flex-col items-end text-sm text-muted-foreground">
        <span class="tabular-nums">{{ workout.durationMinutes }}</span>
        <span>{{ workout.setCount }} {{ t('workouts.stats.sets') }}</span>
      </div>
    </div>
  </Card>
</template>
