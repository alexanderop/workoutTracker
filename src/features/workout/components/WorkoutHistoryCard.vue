<script setup lang="ts">
import { Card } from '@/components/ui/card'
import { formatDate, formatDuration } from '@/lib/formatters'

type Properties = {
  workout: {
    id: string
    name: string
    completedAt: number
    durationSeconds: number
  }
}

const { workout } = defineProps<Properties>()
const emit = defineEmits<{
  click: [id: string]
}>()

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
    class="cursor-pointer p-4 transition-colors hover:bg-accent"
    @click="emit('click', workout.id)"
    @keydown="handleActivationKey"
  >
    <div class="flex items-center justify-between">
      <div>
        <div class="font-medium">{{ workout.name }}</div>
        <div class="text-sm text-muted-foreground">
          {{ formatDate(workout.completedAt) }}
        </div>
      </div>
      <div class="tabular-nums text-sm text-muted-foreground">
        {{ formatDuration(workout.durationSeconds) }}
      </div>
    </div>
  </Card>
</template>
