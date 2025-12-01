<script setup lang="ts">
import { Plus, Trash2, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { generateId } from '@/db/index'
import type { BlockExercise, ForTimeConfig } from '@/types/blocks'
import { BLOCK_ICONS, BLOCK_LABELS } from '@/types/blocks'
import WorkoutExercisePicker from './WorkoutExercisePicker.vue'
import WorkoutForTimeConfig, { type ForTimeConfigModel } from './WorkoutForTimeConfig.vue'

type Emits = {
  confirm: [config: ForTimeConfig, exercises: ReadonlyArray<BlockExercise>]
}

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<Emits>()

const config = ref<ForTimeConfigModel>({ hasCap: true, capMinutes: 15 })
const exercises = ref<Array<BlockExercise>>([])
const showExercisePicker = ref(false)

const canConfirm = computed(() => exercises.value.length > 0)

watch(open, (isOpen) => {
  if (isOpen) {
    config.value = { hasCap: true, capMinutes: 15 }
    exercises.value = []
    showExercisePicker.value = false
  }
})

function handleSelectExercise(exercise: { name: string; icon: string }) {
  const newExercise: BlockExercise = {
    id: generateId(),
    name: exercise.name,
    prescribedReps: 10,
    load: null,
    thumbnail: exercise.icon,
  }
  exercises.value = [...exercises.value, newExercise]
  showExercisePicker.value = false
}

function removeExercise(index: number) {
  exercises.value = exercises.value.filter((_, i) => i !== index)
}

function updateExerciseReps(index: number, reps: number) {
  const exercise = exercises.value[index]
  if (exercise) {
    exercise.prescribedReps = reps
  }
}

function updateExerciseLoad(index: number, load: string) {
  const exercise = exercises.value[index]
  if (exercise) {
    exercise.load = load || null
  }
}

function handleConfirm() {
  emit(
    'confirm',
    { timeCapSeconds: config.value.hasCap ? config.value.capMinutes * 60 : null },
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
      :show-close-button="false"
      class="max-w-md h-[100dvh] sm:h-auto sm:max-h-[85vh] flex flex-col rounded-t-none sm:rounded-lg"
    >
      <button
        class="absolute right-4 top-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
        @click="handleClose"
      >
        <X class="size-5" />
        <span class="sr-only">Close</span>
      </button>

      <DialogHeader>
        <div class="flex items-center gap-2">
          <span class="text-2xl">{{ BLOCK_ICONS.fortime }}</span>
          <DialogTitle>Configure {{ BLOCK_LABELS.fortime }}</DialogTitle>
        </div>
        <DialogDescription>Set the time cap and add exercises for this block</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto space-y-6 py-4">
        <WorkoutForTimeConfig v-model="config" />

        <Separator />

        <div class="space-y-3">
          <Label>Exercises</Label>

          <p v-if="exercises.length === 0" class="text-center py-6 text-muted-foreground">
            No exercises added yet
          </p>

          <div
            v-for="(exercise, index) in exercises"
            :key="exercise.id"
            class="flex items-center gap-3 bg-secondary/30 rounded-lg p-3"
          >
            <span class="text-xl">{{ exercise.thumbnail }}</span>
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">{{ exercise.name }}</p>
              <div class="flex gap-2 mt-1">
                <Input
                  :model-value="exercise.prescribedReps"
                  type="number"
                  min="1"
                  class="h-8 w-20"
                  placeholder="Reps"
                  @update:model-value="updateExerciseReps(index, Number($event))"
                />
                <Input
                  :model-value="exercise.load ?? ''"
                  class="h-8 flex-1"
                  placeholder="Load (optional)"
                  @update:model-value="updateExerciseLoad(index, String($event))"
                />
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              class="text-destructive"
              @click="removeExercise(index)"
            >
              <Trash2 class="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" class="w-full" @click="showExercisePicker = true">
            <Plus class="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
        </div>
      </div>

      <WorkoutExercisePicker
        v-model:open="showExercisePicker"
        mode="multi"
        @select="handleSelectExercise"
      />

      <div class="pt-4 border-t flex gap-3">
        <Button variant="outline" class="flex-1" @click="handleClose">Cancel</Button>
        <Button class="flex-1" :disabled="!canConfirm" @click="handleConfirm">Add Block</Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
