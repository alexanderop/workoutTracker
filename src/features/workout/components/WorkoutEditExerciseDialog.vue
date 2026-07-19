<script setup lang="ts">
import { computed, ref } from 'vue'
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
import { useExercisesStore } from '@/stores/exercises'

const { t } = useI18n()
const exercisesStore = useExercisesStore()

export type ExerciseEditData = {
  exerciseDefinitionId: string | null
  targetReps: number
  targetDuration: number | null
  targetWeight: number | null
  setCount: number
}

const { exercise } = defineProps<{
  exercise: ExerciseEditData
}>()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  save: [data: ExerciseEditData]
}>()

// Check if this is a duration-based exercise (isometric)
const isDurationBased = computed(() => {
  if (!exercise.exerciseDefinitionId) return false
  const exerciseDefinition = exercisesStore.getExerciseById(exercise.exerciseDefinitionId)
  return exerciseDefinition?.metrics === 'duration'
})

const targetReps = ref(exercise.targetReps)
const targetDuration = ref(exercise.targetDuration ?? 30)
const targetWeight = ref(exercise.targetWeight)
const setCount = ref(exercise.setCount)

whenever(open, () => {
  targetReps.value = exercise.targetReps
  targetDuration.value = exercise.targetDuration ?? 30
  targetWeight.value = exercise.targetWeight
  setCount.value = exercise.setCount
})

function handleSave() {
  emit('save', {
    exerciseDefinitionId: exercise.exerciseDefinitionId,
    targetReps: isDurationBased.value ? 0 : targetReps.value,
    targetDuration: isDurationBased.value ? targetDuration.value : null,
    targetWeight: isDurationBased.value ? targetWeight.value : null,
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

      <div class="grid min-h-0 gap-4 overflow-y-auto overscroll-contain scroll-py-2 py-4">
        <!-- Duration field for isometric exercises -->
        <NumberField
          v-if="isDurationBased"
          id="target-duration"
          v-model="targetDuration"
          :min="1"
          :max="600"
        >
          <Label for="target-duration">{{ t('dialogs.editExercise.targetDuration') }}</Label>
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>

        <!-- Reps field for regular exercises -->
        <NumberField v-else id="target-reps" v-model="targetReps" :min="1" :max="100">
          <Label for="target-reps">{{ t('dialogs.editExercise.targetReps') }}</Label>
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>

        <!-- Optional weight field for isometric exercises -->
        <NumberField
          v-if="isDurationBased"
          id="target-weight"
          v-model="targetWeight"
          :min="0"
          :max="500"
        >
          <Label for="target-weight">{{ t('dialogs.editExercise.targetWeight') }}</Label>
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
