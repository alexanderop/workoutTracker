<script setup lang="ts">
import type { Exercise } from '@/exercises/useExerciseSearch'
import type {
  AmrapConfig,
  BlockExercise,
  CardioConfig,
  EmomConfig,
  ForTimeConfig,
  TabataConfig,
  TimedBlockKind,
} from '@/blocks'
import AddBlockDialog from '@/blocks/ui/AddBlockDialog.vue'
import ConfigureAmrapDialog from '@/blocks/amrap/ui/ConfigureAmrapDialog.vue'
import ConfigureCardioDialog from '@/blocks/cardio/ui/ConfigureCardioDialog.vue'
import ConfigureEmomDialog from '@/blocks/emom/ui/ConfigureEmomDialog.vue'
import ConfigureForTimeDialog from '@/blocks/fortime/ui/ConfigureForTimeDialog.vue'
import ConfigureTabataDialog from '@/blocks/tabata/ui/ConfigureTabataDialog.vue'

const addBlockOpen = defineModel<boolean>('addBlockOpen', { required: true })
const amrapOpen = defineModel<boolean>('amrapOpen', { required: true })
const emomOpen = defineModel<boolean>('emomOpen', { required: true })
const tabataOpen = defineModel<boolean>('tabataOpen', { required: true })
const forTimeOpen = defineModel<boolean>('forTimeOpen', { required: true })
const cardioOpen = defineModel<boolean>('cardioOpen', { required: true })

const emit = defineEmits<{
  'add-exercise': [exercise: Exercise]
  'add-timed-block': [kind: TimedBlockKind]
  'add-cardio-block': []
  'confirm-amrap': [config: AmrapConfig, exercises: ReadonlyArray<BlockExercise>]
  'confirm-emom': [config: EmomConfig, exercises: ReadonlyArray<BlockExercise>]
  'confirm-tabata': [config: TabataConfig, exercise: BlockExercise]
  'confirm-for-time': [config: ForTimeConfig, exercises: ReadonlyArray<BlockExercise>]
  'confirm-cardio': [config: CardioConfig]
}>()

function forwardAmrap(config: AmrapConfig, exercises: ReadonlyArray<BlockExercise>): void {
  emit('confirm-amrap', config, exercises)
}

function forwardEmom(config: EmomConfig, exercises: ReadonlyArray<BlockExercise>): void {
  emit('confirm-emom', config, exercises)
}

function forwardTabata(config: TabataConfig, exercise: BlockExercise): void {
  emit('confirm-tabata', config, exercise)
}

function forwardForTime(config: ForTimeConfig, exercises: ReadonlyArray<BlockExercise>): void {
  emit('confirm-for-time', config, exercises)
}
</script>

<template>
  <AddBlockDialog
    v-model:open="addBlockOpen"
    @add-exercise="emit('add-exercise', $event)"
    @add-timed-block="emit('add-timed-block', $event)"
    @add-cardio-block="emit('add-cardio-block')"
  />

  <ConfigureAmrapDialog v-model:open="amrapOpen" @confirm="forwardAmrap" />
  <ConfigureEmomDialog v-model:open="emomOpen" @confirm="forwardEmom" />
  <ConfigureTabataDialog v-model:open="tabataOpen" @confirm="forwardTabata" />
  <ConfigureForTimeDialog v-model:open="forTimeOpen" @confirm="forwardForTime" />
  <ConfigureCardioDialog v-model:open="cardioOpen" @confirm="emit('confirm-cardio', $event)" />
</template>
