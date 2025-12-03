<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import TimerPresetList from '@/components/timers/TimerPresetList.vue'
import TimerCustomForm from '@/components/timers/TimerCustomForm.vue'
import { BLOCK_COLORS } from '@/types/blocks'
import type { AmrapBlock, EmomBlock, TabataBlock, ForTimeBlock } from '@/types/blocks'

type TimerType = 'amrap' | 'emom' | 'tabata' | 'fortime'

type AmrapPreset = { label: string; description: string; durationSeconds: number }
type EmomPreset = { label: string; description: string; minutes: number }
type TabataPreset = {
  label: string
  description: string
  rounds: number
  workSeconds: number
  restSeconds: number
}
type ForTimePreset = { label: string; description: string; timeCapSeconds: number | null }

const AMRAP_PRESETS: Array<AmrapPreset> = [
  { label: '5 min', description: 'Quick burst', durationSeconds: 300 },
  { label: '10 min', description: 'Standard', durationSeconds: 600 },
  { label: '15 min', description: 'Extended', durationSeconds: 900 },
  { label: '20 min', description: 'Long form', durationSeconds: 1200 },
]

const EMOM_PRESETS: Array<EmomPreset> = [
  { label: '10 min', description: 'Quick session', minutes: 10 },
  { label: '15 min', description: 'Standard', minutes: 15 },
  { label: '20 min', description: 'Extended', minutes: 20 },
]

const TABATA_PRESETS: Array<TabataPreset> = [
  { label: 'Classic', description: '8×20/10', rounds: 8, workSeconds: 20, restSeconds: 10 },
  { label: 'Long', description: '8×30/15', rounds: 8, workSeconds: 30, restSeconds: 15 },
  { label: 'Short', description: '4×20/10', rounds: 4, workSeconds: 20, restSeconds: 10 },
  { label: 'Nordic', description: '4×4min/3min', rounds: 4, workSeconds: 240, restSeconds: 180 },
]

const FORTIME_PRESETS: Array<ForTimePreset> = [
  { label: '10 min cap', description: 'Quick challenge', timeCapSeconds: 600 },
  { label: '15 min cap', description: 'Standard cap', timeCapSeconds: 900 },
  { label: '20 min cap', description: 'Extended cap', timeCapSeconds: 1200 },
  { label: 'No cap', description: 'Unlimited time', timeCapSeconds: null },
]

const TIMER_LABELS: Record<TimerType, string> = {
  amrap: 'AMRAP',
  emom: 'EMOM',
  tabata: 'Tabata',
  fortime: 'For Time',
}

const { timerType } = defineProps<{
  timerType: TimerType
}>()

const emit = defineEmits<{
  back: []
  start: [block: AmrapBlock | EmomBlock | TabataBlock | ForTimeBlock]
}>()

const showCustom = ref(false)

const colors = computed(() => BLOCK_COLORS[timerType])
const timerLabel = computed(() => TIMER_LABELS[timerType])

const presets = computed(() => {
  switch (timerType) {
    case 'amrap':
      return AMRAP_PRESETS
    case 'emom':
      return EMOM_PRESETS
    case 'tabata':
      return TABATA_PRESETS
    case 'fortime':
      return FORTIME_PRESETS
    default: {
      const exhaustive: never = timerType
      return exhaustive
    }
  }
})

function createAmrapBlock(durationSeconds: number): AmrapBlock {
  return {
    kind: 'amrap',
    id: Date.now(),
    config: { durationSeconds },
    exercises: [],
    result: null,
  }
}

function createEmomBlock(minutes: number): EmomBlock {
  return {
    kind: 'emom',
    id: Date.now(),
    config: { minutes, exerciseRotation: 'each-minute' },
    exercises: [],
    result: null,
  }
}

function createTabataBlock(rounds: number, workSeconds: number, restSeconds: number): TabataBlock {
  return {
    kind: 'tabata',
    id: Date.now(),
    config: { rounds, workSeconds, restSeconds },
    exercise: { id: 'standalone', name: 'Work', prescribedReps: 0, load: null, thumbnail: '' },
    result: null,
  }
}

function createForTimeBlock(timeCapSeconds: number | null): ForTimeBlock {
  return {
    kind: 'fortime',
    id: Date.now(),
    config: { timeCapSeconds },
    exercises: [],
    result: null,
  }
}

function handlePresetSelect(preset: {
  label: string
  description: string
  [key: string]: unknown
}) {
  switch (timerType) {
    case 'amrap':
      emit('start', createAmrapBlock(Number(preset.durationSeconds)))
      break
    case 'emom':
      emit('start', createEmomBlock(Number(preset.minutes)))
      break
    case 'tabata':
      emit(
        'start',
        createTabataBlock(
          Number(preset.rounds),
          Number(preset.workSeconds),
          Number(preset.restSeconds),
        ),
      )
      break
    case 'fortime':
      emit(
        'start',
        createForTimeBlock(preset.timeCapSeconds === null ? null : Number(preset.timeCapSeconds)),
      )
      break
  }
}

function handleCustomSubmit(config: Record<string, number | boolean | null>) {
  switch (timerType) {
    case 'amrap':
      emit('start', createAmrapBlock(Number(config.durationSeconds)))
      break
    case 'emom':
      emit('start', createEmomBlock(Number(config.minutes)))
      break
    case 'tabata':
      emit(
        'start',
        createTabataBlock(
          Number(config.rounds),
          Number(config.workSeconds),
          Number(config.restSeconds),
        ),
      )
      break
    case 'fortime':
      emit(
        'start',
        createForTimeBlock(config.timeCapSeconds === null ? null : Number(config.timeCapSeconds)),
      )
      break
  }
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="p-4 border-b flex items-center gap-3">
      <Button variant="ghost" size="icon" aria-label="Go back" @click="emit('back')">
        <ArrowLeft class="w-5 h-5" />
      </Button>
      <h1 class="text-lg font-semibold">{{ timerLabel }}</h1>
    </div>

    <!-- Content -->
    <div class="flex-1 p-4 overflow-y-auto">
      <TimerPresetList
        v-if="!showCustom"
        :presets="presets"
        :color-class="colors.text"
        @select="handlePresetSelect"
        @show-custom="showCustom = true"
      />

      <TimerCustomForm
        v-else
        :timer-type="timerType"
        :color-class="colors.accent"
        @back="showCustom = false"
        @submit="handleCustomSubmit"
      />
    </div>
  </div>
</template>
