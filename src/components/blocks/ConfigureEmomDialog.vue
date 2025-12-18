<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogActions from '@/components/DialogActions.vue'
import ExercisePicker from '@/components/ExercisePicker.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useTimedBlockExercises } from '@/composables/useTimedBlockExercises'
import type { BlockExercise, EmomConfig as EmomBlockConfig } from '@/types/blocks'
import { BLOCK_ICONS } from '@/types/blocks'
import EmomConfigComponent, { type EmomConfigModel } from './EmomConfig.vue'
import TimedBlockExerciseList from './TimedBlockExerciseList.vue'

const { t } = useI18n()

type Emits = {
  confirm: [config: EmomBlockConfig, exercises: ReadonlyArray<BlockExercise>]
}

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<Emits>()

const config = ref<EmomConfigModel>({ minutes: 10, rotation: 'full-round' })

const {
  exercises,
  showExercisePicker,
  canConfirm,
  handleSelectExercise,
  removeExercise,
  updateExerciseReps,
  updateExerciseLoad,
  reset,
} = useTimedBlockExercises()

watch(open, (isOpen) => {
  if (isOpen) {
    config.value = { minutes: 10, rotation: 'full-round' }
    reset()
  }
})

function handleConfirm() {
  emit(
    'confirm',
    { minutes: config.value.minutes, exerciseRotation: config.value.rotation },
    exercises.value,
  )
  open.value = false
}

function handleClose() {
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent
      class="max-w-md h-[100dvh] sm:h-auto sm:max-h-[85vh] flex flex-col rounded-t-none sm:rounded-lg"
    >
      <DialogHeader>
        <div class="flex items-center gap-2">
          <span class="text-2xl">{{ BLOCK_ICONS.emom }}</span>
          <DialogTitle>{{ t('dialogs.emomConfig.title') }}</DialogTitle>
        </div>
        <DialogDescription>{{ t('dialogs.emomConfig.description') }}</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto space-y-6 py-4">
        <EmomConfigComponent v-model="config" />

        <Separator />

        <div class="space-y-3">
          <Label>{{ t('dialogs.emomConfig.exercises') }}</Label>

          <TimedBlockExerciseList
            :exercises="exercises"
            :empty-message="t('dialogs.emomConfig.noExercises')"
            :add-button-text="t('dialogs.emomConfig.addExercise')"
            :rep-placeholder="t('dialogs.emomConfig.repPlaceholder')"
            :load-placeholder="t('dialogs.emomConfig.loadPlaceholder')"
            @update:reps="updateExerciseReps"
            @update:load="updateExerciseLoad"
            @remove="removeExercise"
            @add="showExercisePicker = true"
          />
        </div>
      </div>

      <ExercisePicker
        v-model:open="showExercisePicker"
        presentation="overlay"
        mode="multi"
        @select="handleSelectExercise"
      />

      <DialogActions variant="inline" class="pt-4" v-slot="{ buttonClass }">
        <Button variant="outline" :class="buttonClass" @click="handleClose">
          {{ t('common.buttons.cancel') }}
        </Button>
        <Button :class="buttonClass" :disabled="!canConfirm" @click="handleConfirm">
          {{ t('dialogs.emomConfig.addBlock') }}
        </Button>
      </DialogActions>
    </MobileDialogContent>
  </Dialog>
</template>
