<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import { Pause, Play, RotateCcw, X } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import PageLayout from '@/components/PageLayout.vue'
import WorkoutAmrapView from '@/components/timers/WorkoutAmrapView.vue'
import WorkoutEmomView from '@/components/timers/WorkoutEmomView.vue'
import WorkoutTabataView from '@/components/timers/WorkoutTabataView.vue'
import WorkoutForTimeView from '@/components/timers/WorkoutForTimeView.vue'
import { BLOCK_COLORS } from '@/types/blocks'
import type { AmrapBlock, EmomBlock, TabataBlock, ForTimeBlock } from '@/types/blocks'

const { t } = useI18n()

type TimedBlock = AmrapBlock | EmomBlock | TabataBlock | ForTimeBlock

type TimerViewExposed = {
  toggle: () => void
  reset: () => void
  complete: () => unknown
  isRunning: { value: boolean }
  formattedTime: { value: string }
}

const { block } = defineProps<{
  block: TimedBlock
}>()

const emit = defineEmits<{
  exit: []
  complete: []
}>()

const timerRef = useTemplateRef<TimerViewExposed>('timer')
const isComplete = ref(false)

const colors = computed(() => BLOCK_COLORS[block.kind])
const timerLabel = computed(() => t(`timers.types.${block.kind}`))

const isRunning = computed(() => timerRef.value?.isRunning.value ?? false)

function handleToggle() {
  timerRef.value?.toggle()
}

function handleReset() {
  isComplete.value = false
  timerRef.value?.reset()
}

function handleComplete() {
  isComplete.value = true
  emit('complete')
}

function handleExit() {
  emit('exit')
}
</script>

<template>
  <PageLayout :title="timerLabel" prevent-navigation @back="handleExit">
    <!-- Timer Content -->
    <div class="flex-1 flex flex-col">
      <WorkoutAmrapView
        v-if="block.kind === 'amrap'"
        ref="timer"
        :block="block"
        :on-complete="handleComplete"
      />
      <WorkoutEmomView
        v-if="block.kind === 'emom'"
        ref="timer"
        :block="block"
        :on-complete="handleComplete"
      />
      <WorkoutTabataView
        v-if="block.kind === 'tabata'"
        ref="timer"
        :block="block"
        :on-complete="handleComplete"
      />
      <WorkoutForTimeView
        v-if="block.kind === 'fortime'"
        ref="timer"
        :block="block"
        :on-complete="handleComplete"
      />
    </div>

    <template #footer>
      <div v-if="!isComplete" class="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          class="h-12 w-12"
          :aria-label="t('common.aria.exitTimer')"
          @click="handleExit"
        >
          <X class="w-5 h-5" />
        </Button>

        <Button
          size="lg"
          class="h-14 w-14 rounded-full"
          :class="colors.accent"
          @click="handleToggle"
        >
          <Pause v-if="isRunning" class="w-6 h-6" />
          <Play v-if="!isRunning" class="w-6 h-6 ml-0.5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          class="h-12 w-12"
          :aria-label="t('common.aria.resetTimer')"
          @click="handleReset"
        >
          <RotateCcw class="w-5 h-5" />
        </Button>
      </div>

      <!-- Completion state -->
      <div v-if="isComplete" class="text-center space-y-4">
        <div class="text-2xl font-bold" :class="colors.text">{{ t('timers.runner.complete') }}</div>
        <div class="flex gap-3 justify-center">
          <Button variant="outline" @click="handleReset">
            <RotateCcw class="w-4 h-4 mr-2" />
            {{ t('timers.runner.again') }}
          </Button>
          <Button @click="handleExit">{{ t('timers.runner.done') }}</Button>
        </div>
      </div>
    </template>
  </PageLayout>
</template>
