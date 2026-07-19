<script setup lang="ts">
import { computed } from 'vue'
import { useToggle } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import PageLayout from '@/components/PageLayout.vue'
import TimerPresetList from './TimerPresetList.vue'
import TimerCustomForm from './TimerCustomForm.vue'
import { BLOCK_COLORS } from '@/types/blocks'
import type { AmrapBlock, EmomBlock, TabataBlock, ForTimeBlock } from '@/types/blocks'

const { t } = useI18n()

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

function getAmrapPresets(): Array<AmrapPreset> {
  return [
    { label: '5 min', description: t('timers.presets.quickBurst'), durationSeconds: 300 },
    { label: '10 min', description: t('timers.presets.standard'), durationSeconds: 600 },
    { label: '15 min', description: t('timers.presets.extended'), durationSeconds: 900 },
    { label: '20 min', description: t('timers.presets.longForm'), durationSeconds: 1200 },
  ]
}

function getEmomPresets(): Array<EmomPreset> {
  return [
    { label: '10 min', description: t('timers.presets.quickSession'), minutes: 10 },
    { label: '15 min', description: t('timers.presets.standard'), minutes: 15 },
    { label: '20 min', description: t('timers.presets.extended'), minutes: 20 },
  ]
}

function getTabataPresets(): Array<TabataPreset> {
  return [
    {
      label: t('timers.presets.classic'),
      description: '8×20/10',
      rounds: 8,
      workSeconds: 20,
      restSeconds: 10,
    },
    {
      label: t('timers.presets.long'),
      description: '8×30/15',
      rounds: 8,
      workSeconds: 30,
      restSeconds: 15,
    },
    {
      label: t('timers.presets.short'),
      description: '4×20/10',
      rounds: 4,
      workSeconds: 20,
      restSeconds: 10,
    },
    {
      label: t('timers.presets.nordic'),
      description: '4×4min/3min',
      rounds: 4,
      workSeconds: 240,
      restSeconds: 180,
    },
  ]
}

function getForTimePresets(): Array<ForTimePreset> {
  return [
    { label: '10 min cap', description: t('timers.presets.quickChallenge'), timeCapSeconds: 600 },
    { label: '15 min cap', description: t('timers.presets.standardCap'), timeCapSeconds: 900 },
    { label: '20 min cap', description: t('timers.presets.extendedCap'), timeCapSeconds: 1200 },
    {
      label: t('timers.presets.noCap'),
      description: t('timers.presets.unlimitedTime'),
      timeCapSeconds: null,
    },
  ]
}

const { timerType } = defineProps<{
  timerType: TimerType
}>()

const emit = defineEmits<{
  back: []
  start: [block: AmrapBlock | EmomBlock | TabataBlock | ForTimeBlock]
}>()

const [showCustom, toggleShowCustom] = useToggle(false)

const colors = computed(() => BLOCK_COLORS[timerType])
const timerLabel = computed(() => t(`timers.types.${timerType}`))

const presets = computed(() => {
  switch (timerType) {
    case 'amrap': {
      return getAmrapPresets()
    }
    case 'emom': {
      return getEmomPresets()
    }
    case 'tabata': {
      return getTabataPresets()
    }
    case 'fortime': {
      return getForTimePresets()
    }
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
    exercise: { id: 'standalone', name: 'Work', prescribedReps: 0, load: null, image: null },
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

function handlePresetSelect(preset: Record<string, unknown>) {
  switch (timerType) {
    case 'amrap': {
      emit('start', createAmrapBlock(Number(preset.durationSeconds)))
      break
    }
    case 'emom': {
      emit('start', createEmomBlock(Number(preset.minutes)))
      break
    }
    case 'tabata': {
      emit(
        'start',
        createTabataBlock(
          Number(preset.rounds),
          Number(preset.workSeconds),
          Number(preset.restSeconds),
        ),
      )
      break
    }
    case 'fortime': {
      emit(
        'start',
        createForTimeBlock(preset.timeCapSeconds === null ? null : Number(preset.timeCapSeconds)),
      )
      break
    }
  }
}

function handleCustomSubmit(config: Record<string, number | boolean | null>) {
  switch (timerType) {
    case 'amrap': {
      emit('start', createAmrapBlock(Number(config.durationSeconds)))
      break
    }
    case 'emom': {
      emit('start', createEmomBlock(Number(config.minutes)))
      break
    }
    case 'tabata': {
      emit(
        'start',
        createTabataBlock(
          Number(config.rounds),
          Number(config.workSeconds),
          Number(config.restSeconds),
        ),
      )
      break
    }
    case 'fortime': {
      emit(
        'start',
        createForTimeBlock(config.timeCapSeconds === null ? null : Number(config.timeCapSeconds)),
      )
      break
    }
  }
}
</script>

<template>
  <PageLayout :title="timerLabel" prevent-navigation @back="emit('back')">
    <div class="p-4">
      <TimerPresetList
        v-if="!showCustom"
        :presets="presets"
        :color-class="colors.text"
        @select="handlePresetSelect"
        @show-custom="toggleShowCustom(true)"
      />

      <TimerCustomForm
        v-else
        :timer-type="timerType"
        :color-class="colors.accent"
        @back="toggleShowCustom(false)"
        @submit="handleCustomSubmit"
      />
    </div>
  </PageLayout>
</template>
