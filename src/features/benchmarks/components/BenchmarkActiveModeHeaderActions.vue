<script setup lang="ts">
import { List, MoreVertical, Square, X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const emit = defineEmits<{
  'open-queue': []
  'end-workout': []
  'cancel-workout': []
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
