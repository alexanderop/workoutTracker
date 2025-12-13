<script setup lang="ts">
import { ref } from 'vue'
import { whenever } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import DialogActions from '@/components/DialogActions.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'

const { t } = useI18n()

export type ExerciseEditData = {
  targetReps: number
  setCount: number
}

const { exercise } = defineProps<{
  exercise: ExerciseEditData
}>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  save: [data: ExerciseEditData]
}>()

const targetReps = ref(exercise.targetReps)
const setCount = ref(exercise.setCount)

whenever(open, () => {
  targetReps.value = exercise.targetReps
  setCount.value = exercise.setCount
})

function handleSave() {
  emit('save', {
    targetReps: targetReps.value,
    setCount: Math.max(1, setCount.value),
  })
  open.value = false
}

function handleCancel() {
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('dialogs.editExercise.title') }}</DialogTitle>
        <DialogDescription> {{ t('dialogs.editExercise.description') }} </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <NumberField id="target-reps" v-model="targetReps" :min="1" :max="100">
          <Label for="target-reps">{{ t('dialogs.editExercise.targetReps') }}</Label>
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>

        <NumberField id="set-count" v-model="setCount" :min="1" :max="20">
          <Label for="set-count">{{ t('dialogs.editExercise.numberOfSets') }}</Label>
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
      </div>

      <DialogActions variant="inline" v-slot="{ buttonClass }">
        <Button variant="outline" :class="buttonClass" @click="handleCancel">
          {{ t('common.buttons.cancel') }}
        </Button>
        <Button :class="buttonClass" @click="handleSave">
          {{ t('dialogs.editExercise.saveChanges') }}
        </Button>
      </DialogActions>
    </MobileDialogContent>
  </Dialog>
</template>
