<script setup lang="ts">
import { ChevronLeft, Edit2, MoreVertical, Trash2 } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const { t } = useI18n()

type Props = {
  exerciseName: string
  equipment: string
  targetReps: number
}

const { exerciseName, equipment, targetReps } = defineProps<Props>()
defineEmits<{
  delete: []
  edit: []
}>()

const router = useRouter()
</script>

<template>
  <div class="sticky top-0 border-b border-border bg-background/95 backdrop-blur-sm z-10">
    <div class="flex items-center gap-3 px-4 py-3">
      <Button
        variant="ghost"
        size="icon"
        class="flex-shrink-0"
        :aria-label="t('common.aria.goBack')"
        @click="router.back()"
      >
        <ChevronLeft class="w-5 h-5" />
      </Button>
      <div class="flex-1 min-w-0">
        <h1 class="text-base font-semibold text-primary truncate">
          {{ exerciseName }}
        </h1>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ equipment }} · {{ targetReps }}
          {{ t('workouts.builder.header.targetReps') }}
        </p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="icon-sm"
            :aria-label="t('common.aria.moreOptions')"
          >
            <MoreVertical class="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="$emit('edit')">
            <Edit2 class="mr-2 h-4 w-4" />
            <span>{{ t('workouts.builder.header.editExercise') }}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-destructive" @click="$emit('delete')">
            <Trash2 class="mr-2 h-4 w-4" />
            <span>{{ t('workouts.builder.header.deleteExercise') }}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
