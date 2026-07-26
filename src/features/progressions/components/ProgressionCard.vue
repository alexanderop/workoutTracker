<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight } from '@lucide/vue'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { ProgressionLevel } from '../types'

type Properties = {
  id: string
  name: string
  level: ProgressionLevel
  progress: number
  isComplete: boolean
  sessionsCompleted: number
}

const { id, name, level, progress, isComplete, sessionsCompleted } = defineProps<Properties>()
const emit = defineEmits<{
  click: [id: string]
}>()
const { t } = useI18n()

const levelDisplay = computed(() => `${level.weight}kg • ${level.reps} reps • ${level.minutes} min`)

const statusBadge = computed(() => {
  if (isComplete) {
    return { text: t('progressions.status.complete'), variant: 'default' as const }
  }
  return null
})

const cardAriaLabel = computed(() =>
  isComplete
    ? t('progressions.card.ariaComplete', { name })
    : t('progressions.card.ariaCurrent', {
        name,
        weight: level.weight,
        reps: level.reps,
        minutes: level.minutes,
      }),
)

function handleActivationKey(event: KeyboardEvent): void {
  if (!(event.key === 'Enter' || event.key === ' ')) {
    return
  }

  event.preventDefault()
  emit('click', id)
}
</script>

<template>
  <Card
    role="button"
    tabindex="0"
    :aria-label="cardAriaLabel"
    class="cursor-pointer p-4 transition-colors hover:bg-accent"
    @click="emit('click', id)"
    @keydown="handleActivationKey"
  >
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="font-medium">{{ name }}</span>
          <Badge v-if="statusBadge" :variant="statusBadge.variant">
            {{ statusBadge.text }}
          </Badge>
        </div>
        <div class="mt-1 text-sm text-muted-foreground">
          {{ levelDisplay }}
        </div>
        <div class="mt-2 flex items-center gap-2">
          <Progress :model-value="progress" class="h-2 flex-1" />
          <span class="text-xs text-muted-foreground">{{ progress }}%</span>
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          {{ t('progressions.card.sessions', { count: sessionsCompleted }) }}
        </div>
      </div>
      <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </div>
  </Card>
</template>
