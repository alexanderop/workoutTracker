<script setup lang="ts">
import { Plus, Trash2, X } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useTimedBlockExercises } from '@/composables/useTimedBlockExercises'
import type { AmrapConfig, BlockExercise } from '@/types/blocks'
import { BLOCK_ICONS } from '@/types/blocks'
import WorkoutAmrapConfig, { type AmrapConfigModel } from './WorkoutAmrapConfig.vue'
import WorkoutExercisePicker from './WorkoutExercisePicker.vue'

const { t } = useI18n()

type Emits = {
  confirm: [config: AmrapConfig, exercises: ReadonlyArray<BlockExercise>]
}

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<Emits>()

const config = ref<AmrapConfigModel>({ durationMinutes: 12 })

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
    config.value = { durationMinutes: 12 }
    reset()
  }
})

function handleConfirm() {
  emit('confirm', { durationSeconds: config.value.durationMinutes * 60 }, exercises.value)
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
        <span class="sr-only">{{ t('common.buttons.close') }}</span>
      </button>

      <DialogHeader>
        <div class="flex items-center gap-2">
          <span class="text-2xl">{{ BLOCK_ICONS.amrap }}</span>
          <DialogTitle>{{ t('dialogs.amrapConfig.title') }}</DialogTitle>
        </div>
        <DialogDescription>{{ t('dialogs.amrapConfig.description') }}</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto space-y-6 py-4">
        <WorkoutAmrapConfig v-model="config" />

        <Separator />

        <div class="space-y-3">
          <Label>{{ t('dialogs.amrapConfig.exercises') }}</Label>

          <p v-if="exercises.length === 0" class="text-center py-6 text-muted-foreground">
            {{ t('dialogs.amrapConfig.noExercises') }}
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
                  :placeholder="t('dialogs.amrapConfig.repPlaceholder')"
                  @update:model-value="updateExerciseReps(index, Number($event))"
                />
                <Input
                  :model-value="exercise.load ?? ''"
                  class="h-8 flex-1"
                  :placeholder="t('dialogs.amrapConfig.loadPlaceholder')"
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
            {{ t('dialogs.amrapConfig.addExercise') }}
          </Button>
        </div>
      </div>

      <WorkoutExercisePicker
        v-model:open="showExercisePicker"
        mode="multi"
        @select="handleSelectExercise"
      />

      <div class="pt-4 border-t flex gap-3">
        <Button variant="outline" class="flex-1" @click="handleClose">{{
          t('common.buttons.cancel')
        }}</Button>
        <Button class="flex-1" :disabled="!canConfirm" @click="handleConfirm">{{
          t('dialogs.amrapConfig.addBlock')
        }}</Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
