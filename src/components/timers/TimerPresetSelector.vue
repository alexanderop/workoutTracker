<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, Play, Settings2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import TimerPresetButton from '@/components/timers/TimerPresetButton.vue'
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

const { timerType } = defineProps<{
  timerType: TimerType
}>()

const emit = defineEmits<{
  back: []
  start: [block: AmrapBlock | EmomBlock | TabataBlock | ForTimeBlock]
}>()

const showCustom = ref(false)

// Custom form state
const customAmrap = ref({ minutes: 10 })
const customEmom = ref({ minutes: 10 })
const customTabata = ref({ rounds: 8, workSeconds: 20, restSeconds: 10 })
const customForTime = ref({ minutes: 10, hasCap: true })

const colors = computed(() => BLOCK_COLORS[timerType])

const timerLabel = computed(() => {
  const labels: Record<TimerType, string> = {
    amrap: 'AMRAP',
    emom: 'EMOM',
    tabata: 'Tabata',
    fortime: 'For Time',
  }
  return labels[timerType]
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

function selectAmrapPreset(preset: AmrapPreset) {
  emit('start', createAmrapBlock(preset.durationSeconds))
}

function selectEmomPreset(preset: EmomPreset) {
  emit('start', createEmomBlock(preset.minutes))
}

function selectTabataPreset(preset: TabataPreset) {
  emit('start', createTabataBlock(preset.rounds, preset.workSeconds, preset.restSeconds))
}

function selectForTimePreset(preset: ForTimePreset) {
  emit('start', createForTimeBlock(preset.timeCapSeconds))
}

function startCustom() {
  if (timerType === 'amrap') {
    emit('start', createAmrapBlock(customAmrap.value.minutes * 60))
    return
  }

  if (timerType === 'emom') {
    emit('start', createEmomBlock(customEmom.value.minutes))
    return
  }

  if (timerType === 'tabata') {
    emit(
      'start',
      createTabataBlock(
        customTabata.value.rounds,
        customTabata.value.workSeconds,
        customTabata.value.restSeconds,
      ),
    )
    return
  }

  // fortime
  emit(
    'start',
    createForTimeBlock(customForTime.value.hasCap ? customForTime.value.minutes * 60 : null),
  )
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="p-4 border-b flex items-center gap-3">
      <Button variant="ghost" size="icon" @click="emit('back')">
        <ArrowLeft class="w-5 h-5" />
      </Button>
      <h1 class="text-lg font-semibold">{{ timerLabel }}</h1>
    </div>

    <!-- Content -->
    <div class="flex-1 p-4 overflow-y-auto">
      <!-- Presets -->
      <div v-if="!showCustom" class="space-y-3">
        <!-- AMRAP Presets -->
        <template v-if="timerType === 'amrap'">
          <TimerPresetButton
            v-for="preset in AMRAP_PRESETS"
            :key="preset.label"
            :label="preset.label"
            :description="preset.description"
            :color-class="colors.text"
            @select="selectAmrapPreset(preset)"
          />
        </template>

        <!-- EMOM Presets -->
        <template v-if="timerType === 'emom'">
          <TimerPresetButton
            v-for="preset in EMOM_PRESETS"
            :key="preset.label"
            :label="preset.label"
            :description="preset.description"
            :color-class="colors.text"
            @select="selectEmomPreset(preset)"
          />
        </template>

        <!-- Tabata Presets -->
        <template v-if="timerType === 'tabata'">
          <TimerPresetButton
            v-for="preset in TABATA_PRESETS"
            :key="preset.label"
            :label="preset.label"
            :description="preset.description"
            :color-class="colors.text"
            @select="selectTabataPreset(preset)"
          />
        </template>

        <!-- For Time Presets -->
        <template v-if="timerType === 'fortime'">
          <TimerPresetButton
            v-for="preset in FORTIME_PRESETS"
            :key="preset.label"
            :label="preset.label"
            :description="preset.description"
            :color-class="colors.text"
            @select="selectForTimePreset(preset)"
          />
        </template>

        <!-- Custom option -->
        <button
          class="w-full p-4 rounded-lg border-2 border-dashed hover:border-muted-foreground transition-colors text-left"
          @click="showCustom = true"
        >
          <div class="flex items-center gap-3">
            <Settings2 class="w-5 h-5 text-muted-foreground" />
            <div>
              <div class="font-semibold text-foreground">Custom</div>
              <div class="text-sm text-muted-foreground">Configure your own settings</div>
            </div>
          </div>
        </button>
      </div>

      <!-- Custom Form -->
      <div v-if="showCustom" class="space-y-6">
        <!-- AMRAP custom -->
        <div v-if="timerType === 'amrap'" class="space-y-4">
          <div class="space-y-2">
            <Label for="amrap-minutes">Duration (minutes)</Label>
            <Input
              id="amrap-minutes"
              v-model.number="customAmrap.minutes"
              type="number"
              min="1"
              max="60"
            />
          </div>
        </div>

        <!-- EMOM custom -->
        <div v-if="timerType === 'emom'" class="space-y-4">
          <div class="space-y-2">
            <Label for="emom-minutes">Duration (minutes)</Label>
            <Input
              id="emom-minutes"
              v-model.number="customEmom.minutes"
              type="number"
              min="1"
              max="60"
            />
          </div>
        </div>

        <!-- Tabata custom -->
        <div v-if="timerType === 'tabata'" class="space-y-4">
          <div class="space-y-2">
            <Label for="tabata-rounds">Rounds</Label>
            <Input
              id="tabata-rounds"
              v-model.number="customTabata.rounds"
              type="number"
              min="1"
              max="20"
            />
          </div>
          <div class="space-y-2">
            <Label for="tabata-work">Work (seconds)</Label>
            <Input
              id="tabata-work"
              v-model.number="customTabata.workSeconds"
              type="number"
              min="5"
              max="600"
            />
          </div>
          <div class="space-y-2">
            <Label for="tabata-rest">Rest (seconds)</Label>
            <Input
              id="tabata-rest"
              v-model.number="customTabata.restSeconds"
              type="number"
              min="5"
              max="600"
            />
          </div>
        </div>

        <!-- For Time custom -->
        <div v-if="timerType === 'fortime'" class="space-y-4">
          <div class="flex items-center gap-2">
            <input
              id="fortime-hascap"
              v-model="customForTime.hasCap"
              type="checkbox"
              class="rounded"
            />
            <Label for="fortime-hascap">Enable time cap</Label>
          </div>
          <div v-if="customForTime.hasCap" class="space-y-2">
            <Label for="fortime-minutes">Time cap (minutes)</Label>
            <Input
              id="fortime-minutes"
              v-model.number="customForTime.minutes"
              type="number"
              min="1"
              max="60"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-4">
          <Button variant="outline" class="flex-1" @click="showCustom = false"> Back </Button>
          <Button class="flex-1" :class="colors.accent" @click="startCustom">
            <Play class="w-4 h-4 mr-2" />
            Start
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
