<script setup lang="ts">
import type { useRestTimer } from '@/composables/timers/useRestTimer'
import { Clock, RotateCcw } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const { t } = useI18n()

type Props = {
  timer: ReturnType<typeof useRestTimer>
}

defineProps<Props>()

const emit = defineEmits<{
  finish: []
  cancel: []
}>()
</script>

<template>
  <div class="sticky bottom-0 bg-background/95 backdrop-blur-sm safe-area-bottom">
    <Separator />

    <!-- Rest Timer Row -->
    <div class="flex items-center justify-between px-4 py-3">
      <div class="flex items-center gap-3">
        <div
          :class="
            cn(
              'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
              timer.isRunning.value
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground',
            )
          "
        >
          <Clock class="w-4 h-4" />
        </div>
        <div class="flex flex-col">
          <span class="text-xs text-muted-foreground">{{ t('workouts.active.footer.rest') }}</span>
          <span
            :class="
              cn(
                'text-xl font-bold font-mono tabular-nums transition-colors',
                timer.isRunning.value ? 'text-primary' : 'text-foreground',
              )
            "
          >
            {{ timer.formattedTime }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Reset button (only when timer has value) -->
        <Button
          v-if="timer.elapsedSeconds.value > 0"
          variant="ghost"
          size="icon"
          class="h-9 w-9 text-muted-foreground hover:text-foreground"
          @click="timer.reset"
        >
          <RotateCcw class="w-4 h-4" />
        </Button>

        <!-- Start/Stop toggle -->
        <Button
          size="sm"
          :variant="timer.isRunning.value ? 'default' : 'outline'"
          class="min-w-[72px] transition-all"
          @click="timer.toggle"
        >
          {{ timer.isRunning.value ? t('common.rest.timer.stop') : t('common.rest.timer.start') }}
        </Button>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3 px-4 pb-4">
      <Button
        variant="outline"
        class="flex-1 h-12 text-base font-semibold"
        size="lg"
        @click="emit('cancel')"
      >
        {{ t('common.rest.timer.cancel') }}
      </Button>
      <Button class="flex-1 h-12 text-base font-semibold" size="lg" @click="emit('finish')">
        {{ t('common.rest.timer.finishWorkout') }}
      </Button>
    </div>
  </div>
</template>
