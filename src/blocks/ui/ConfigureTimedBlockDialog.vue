<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogActions from '@/components/DialogActions.vue'
import ExercisePicker from '@/components/ExercisePicker.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useTimedBlockExercises } from '@/blocks/ui/useTimedBlockExercises'
import type { BlockExercise } from '@/blocks'
import TimedBlockExerciseList from '@/blocks/ui/TimedBlockExerciseList.vue'

const { icon, translationPrefix } = defineProps<{
  /** Block emoji shown next to the dialog title. */
  icon: string
  /**
   * i18n prefix (e.g. `dialogs.amrapConfig`) providing the keys
   * title, description, exercises, noExercises, addExercise,
   * repPlaceholder, loadPlaceholder, and addBlock.
   */
  translationPrefix: string
}>()

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  confirm: [exercises: ReadonlyArray<BlockExercise>]
}>()

defineSlots<{
  /** Config form for the specific block kind. */
  default: () => unknown
}>()

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
  if (!isOpen) {
    return
  }

  reset()
})

function handleConfirm() {
  emit('confirm', exercises.value)
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
          <span class="text-2xl">{{ icon }}</span>
          <DialogTitle>{{ t(`${translationPrefix}.title`) }}</DialogTitle>
        </div>
        <DialogDescription>{{ t(`${translationPrefix}.description`) }}</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto space-y-6 py-4">
        <slot />

        <Separator />

        <div class="space-y-3">
          <Label>{{ t(`${translationPrefix}.exercises`) }}</Label>

          <TimedBlockExerciseList
            :exercises="exercises"
            :empty-message="t(`${translationPrefix}.noExercises`)"
            :add-button-text="t(`${translationPrefix}.addExercise`)"
            :rep-placeholder="t(`${translationPrefix}.repPlaceholder`)"
            :load-placeholder="t(`${translationPrefix}.loadPlaceholder`)"
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
          {{ t(`${translationPrefix}.addBlock`) }}
        </Button>
      </DialogActions>
    </MobileDialogContent>
  </Dialog>
</template>
