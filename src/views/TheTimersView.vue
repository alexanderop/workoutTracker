<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { Timer } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import TimerPresetSelector from '@/components/timers/TimerPresetSelector.vue'
import StandaloneTimerRunner from '@/components/timers/StandaloneTimerRunner.vue'
import { BLOCK_COLORS } from '@/types/blocks'
import type { AmrapBlock, EmomBlock, TabataBlock, ForTimeBlock } from '@/types/blocks'

const { t } = useI18n()

type TimerType = 'amrap' | 'emom' | 'tabata' | 'fortime'
type ViewState = 'select' | 'configure' | 'running'
type TimedBlock = AmrapBlock | EmomBlock | TabataBlock | ForTimeBlock

const currentView = ref<ViewState>('select')
const selectedTimer = ref<TimerType | null>(null)
const activeBlock = shallowRef<TimedBlock | null>(null)

function selectTimer(type: TimerType) {
  selectedTimer.value = type
  currentView.value = 'configure'
}

function handleBack() {
  currentView.value = 'select'
  selectedTimer.value = null
}

function handleStart(block: TimedBlock) {
  activeBlock.value = block
  currentView.value = 'running'
}

function handleExit() {
  activeBlock.value = null
  currentView.value = 'select'
  selectedTimer.value = null
}

function handleComplete() {
  // Timer completed - user can restart or exit via the runner UI
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Timer Selection -->
    <template v-if="currentView === 'select'">
      <div class="p-4 border-b">
        <div class="flex items-center gap-2">
          <Timer class="w-5 h-5 text-primary" />
          <h1 class="text-lg font-semibold">{{ t('timers.view.title') }}</h1>
        </div>
      </div>

      <div class="flex-1 p-4">
        <div class="grid grid-cols-2 gap-4">
          <button
            class="p-6 rounded-lg border-2 hover:border-current transition-colors text-center"
            :class="BLOCK_COLORS.amrap.text"
            @click="selectTimer('amrap')"
          >
            <div class="text-2xl font-bold mb-1">{{ t('timers.types.amrap') }}</div>
            <div class="text-sm text-muted-foreground">{{ t('timers.descriptions.amrap') }}</div>
          </button>

          <button
            class="p-6 rounded-lg border-2 hover:border-current transition-colors text-center"
            :class="BLOCK_COLORS.emom.text"
            @click="selectTimer('emom')"
          >
            <div class="text-2xl font-bold mb-1">{{ t('timers.types.emom') }}</div>
            <div class="text-sm text-muted-foreground">{{ t('timers.descriptions.emom') }}</div>
          </button>

          <button
            class="p-6 rounded-lg border-2 hover:border-current transition-colors text-center"
            :class="BLOCK_COLORS.tabata.text"
            @click="selectTimer('tabata')"
          >
            <div class="text-2xl font-bold mb-1">{{ t('timers.types.tabata') }}</div>
            <div class="text-sm text-muted-foreground">
              {{ t('timers.descriptions.workRestIntervals') }}
            </div>
          </button>

          <button
            class="p-6 rounded-lg border-2 hover:border-current transition-colors text-center"
            :class="BLOCK_COLORS.fortime.text"
            @click="selectTimer('fortime')"
          >
            <div class="text-2xl font-bold mb-1">{{ t('timers.types.fortime') }}</div>
            <div class="text-sm text-muted-foreground">
              {{ t('timers.descriptions.raceAgainstClock') }}
            </div>
          </button>
        </div>
      </div>
    </template>

    <!-- Preset Selection -->
    <TimerPresetSelector
      v-if="currentView === 'configure' && selectedTimer"
      :timer-type="selectedTimer"
      @back="handleBack"
      @start="handleStart"
    />

    <!-- Timer Running -->
    <StandaloneTimerRunner
      v-if="currentView === 'running' && activeBlock"
      :block="activeBlock"
      @exit="handleExit"
      @complete="handleComplete"
    />
  </div>
</template>
