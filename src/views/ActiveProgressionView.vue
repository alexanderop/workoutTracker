<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import DialogActions from '@/components/DialogActions.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { ArrowLeft, Play, Check, X } from 'lucide-vue-next'
import { useProgressionSession } from '@/features/progressions/composables/useProgressionSession'
import { useTimerAudio } from '@/composables/timers/useTimerAudio'

const { id } = defineProps<{
  id: string
}>()

const { t } = useI18n()
const router = useRouter()
const {
  state,
  level,
  currentMinute,
  secondsUntilNextMinute,
  isLastMinute,
  isTimerComplete,
  isActive,
  isReady,
  load,
  startTimer,
  cancelSession,
  completeSession,
} = useProgressionSession(id)

const { playWorkBeep, playComplete } = useTimerAudio()

// Show completion dialog when timer finishes
const showCompletionDialog = computed(() => isTimerComplete.value)

// Format countdown display
const countdownDisplay = computed(() => {
  const secs = secondsUntilNextMinute.value
  const mins = Math.floor(secs / 60)
  const remainingSecs = secs % 60
  return `${mins}:${remainingSecs.toString().padStart(2, '0')}`
})

// Play beep at the start of each minute
watch(currentMinute, (newMinute, oldMinute) => {
  if (newMinute !== oldMinute && isActive.value) {
    playWorkBeep()
  }
})

// Play completion sound when timer finishes
watch(isTimerComplete, (complete) => {
  if (complete) {
    void playComplete()
  }
})

function handleBack(): void {
  if (isActive.value) {
    cancelSession()
  }
  router.push({ name: RouteNames.ProgressionDetail, params: { id } })
}

function handleStart(): void {
  startTimer()
  playWorkBeep()
}

async function handleComplete(completed: boolean): Promise<void> {
  const session = await completeSession(completed)
  if (session) {
    router.push({ name: RouteNames.ProgressionDetail, params: { id } })
  }
}

onMounted(() => {
  load()
})
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between border-b p-4">
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          :aria-label="t('common.goBack')"
          @click="handleBack"
        >
          <ArrowLeft :size="20" />
        </Button>
        <h1 class="text-lg font-semibold">{{ t('progressions.session.title') }}</h1>
      </div>
    </header>

    <!-- Loading state -->
    <div v-if="state.status === 'loading'" class="flex flex-1 items-center justify-center">
      <div class="text-muted-foreground">{{ t('common.states.loading') }}</div>
    </div>

    <!-- Error state -->
    <div v-else-if="state.status === 'error'" class="flex flex-1 items-center justify-center p-4">
      <div class="text-center text-destructive">
        {{ t('common.states.error') }}
      </div>
    </div>

    <!-- Ready / Active state -->
    <div v-else class="flex flex-1 flex-col items-center justify-center p-4">
      <div class="w-full max-w-md space-y-8">
        <!-- Level Display -->
        <Card>
          <CardContent class="pt-6 text-center">
            <div class="text-6xl font-bold">{{ level?.weight }}kg</div>
            <div class="mt-4 text-2xl text-muted-foreground">
              {{ level?.reps }} {{ t('progressions.session.repsPerMinute') }}
            </div>
          </CardContent>
        </Card>

        <!-- Timer Display -->
        <div class="text-center">
          <div v-if="isActive" class="space-y-4">
            <!-- Minute indicator -->
            <div class="text-lg text-muted-foreground">
              {{ t('progressions.session.minute', { current: currentMinute, total: level?.minutes }) }}
            </div>

            <!-- Countdown -->
            <div class="text-8xl font-mono font-bold tabular-nums">
              {{ countdownDisplay }}
            </div>

            <!-- Last minute indicator -->
            <div v-if="isLastMinute" class="text-lg font-medium text-primary">
              {{ t('progressions.session.lastMinute') }}
            </div>
          </div>

          <!-- Ready state -->
          <div v-else-if="isReady" class="space-y-4">
            <div class="text-lg text-muted-foreground">
              {{ t('progressions.session.duration', { minutes: level?.minutes }) }}
            </div>
            <Button size="lg" class="h-20 w-20 rounded-full" @click="handleStart">
              <Play :size="40" />
            </Button>
            <div class="text-sm text-muted-foreground">
              {{ t('progressions.session.tapToStart') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Completion Dialog -->
    <Dialog :open="showCompletionDialog">
      <MobileDialogContent :show-close="false">
        <DialogHeader>
          <DialogTitle>{{ t('progressions.session.completeTitle') }}</DialogTitle>
          <DialogDescription>
            {{ t('progressions.session.completeQuestion') }}
          </DialogDescription>
        </DialogHeader>
        <DialogActions v-slot="{ buttonClass }">
          <Button
            variant="destructive"
            :class="buttonClass"
            @click="handleComplete(false)"
          >
            <X class="mr-2" :size="16" />
            {{ t('progressions.session.no') }}
          </Button>
          <Button :class="buttonClass" @click="handleComplete(true)">
            <Check class="mr-2" :size="16" />
            {{ t('progressions.session.yes') }}
          </Button>
        </DialogActions>
      </MobileDialogContent>
    </Dialog>
  </div>
</template>
