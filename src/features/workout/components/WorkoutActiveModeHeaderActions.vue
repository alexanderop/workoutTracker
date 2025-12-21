<script setup lang="ts">
import { List, MoreVertical, SkipForward, Square, Trash2, X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import WorkoutDurationBadge from './WorkoutDurationBadge.vue'

const { canSkipBlock = false } = defineProps<{
  canSkipBlock?: boolean
}>()

const emit = defineEmits<{
  'skip-block': []
  'open-queue': []
  'end-workout': []
  'cancel-workout': []
  'remove-block': []
}>()

const { t } = useI18n()
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    class="flex-shrink-0"
    :aria-label="t('workouts.active.queue.open')"
    @click="emit('open-queue')"
  >
    <List class="size-5" />
  </Button>
  <WorkoutDurationBadge />
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        class="flex-shrink-0"
        :aria-label="t('common.aria.workoutOptions')"
      >
        <MoreVertical class="size-5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-48">
      <DropdownMenuItem v-if="canSkipBlock" @click="emit('skip-block')">
        <SkipForward class="size-4 mr-2" />
        {{ t('workouts.active.mode.skipBlock') }}
      </DropdownMenuItem>
      <DropdownMenuItem class="text-destructive" @click="emit('remove-block')">
        <Trash2 class="size-4 mr-2" />
        {{ t('workouts.active.mode.removeBlock') }}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="emit('end-workout')">
        <Square class="size-4 mr-2" />
        {{ t('workouts.active.mode.endWorkout') }}
      </DropdownMenuItem>
      <DropdownMenuItem class="text-destructive" @click="emit('cancel-workout')">
        <X class="size-4 mr-2" />
        {{ t('workouts.active.mode.cancelWorkout') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
