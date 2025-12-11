<script setup lang="ts">
import { Plus, Trash2, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useToggle } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { generateId } from '@/db/index'
import type { BlockExercise, TabataConfig } from '@/types/blocks'
import { BLOCK_ICONS } from '@/types/blocks'
import ExercisePicker from '@/components/ExercisePicker.vue'
import WorkoutTabataConfig, { type TabataConfigModel } from './WorkoutTabataConfig.vue'

const { t } = useI18n()

type Emits = {
  confirm: [config: TabataConfig, exercise: BlockExercise]
}

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<Emits>()

const config = ref<TabataConfigModel>({ rounds: 8, workSeconds: 20, restSeconds: 10 })
const exercise = ref<BlockExercise | null>(null)
const [showExercisePicker, toggleShowExercisePicker] = useToggle(false)

const canConfirm = computed(() => exercise.value !== null)

watch(open, (isOpen) => {
  if (isOpen) {
    config.value = { rounds: 8, workSeconds: 20, restSeconds: 10 }
    exercise.value = null
    toggleShowExercisePicker(false)
  }
})

function handleSelectExercise(selected: { name: string; icon: string }) {
  exercise.value = {
    id: generateId(),
    name: selected.name,
    prescribedReps: 0,
    load: null,
    thumbnail: selected.icon,
  }
}

function removeExercise() {
  exercise.value = null
}

function handleConfirm() {
  if (exercise.value) {
    emit(
      'confirm',
      {
        rounds: config.value.rounds,
        workSeconds: config.value.workSeconds,
        restSeconds: config.value.restSeconds,
      },
      exercise.value,
    )
    open.value = false
  }
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
          <span class="text-2xl">{{ BLOCK_ICONS.tabata }}</span>
          <DialogTitle>{{ t('dialogs.tabataConfig.title') }}</DialogTitle>
        </div>
        <DialogDescription>{{ t('dialogs.tabataConfig.description') }}</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto space-y-6 py-4">
        <WorkoutTabataConfig v-model="config" />

        <Separator />

        <div class="space-y-3">
          <Label>{{ t('dialogs.tabataConfig.exercise') }}</Label>

          <div v-if="!exercise" class="text-center py-6 text-muted-foreground">
            <p>{{ t('dialogs.tabataConfig.selectExercise') }}</p>
          </div>

          <div v-else class="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
            <span class="text-xl">{{ exercise.thumbnail }}</span>
            <div class="flex-1">
              <p class="font-medium">{{ exercise.name }}</p>
            </div>
            <Button variant="ghost" size="icon-sm" class="text-destructive" @click="removeExercise">
              <Trash2 class="w-4 h-4" />
            </Button>
          </div>

          <Button
            v-if="!exercise"
            variant="outline"
            class="w-full"
            @click="toggleShowExercisePicker(true)"
          >
            <Plus class="w-4 h-4 mr-2" />
            {{ t('dialogs.tabataConfig.selectButton') }}
          </Button>
        </div>
      </div>

      <ExercisePicker
        v-model:open="showExercisePicker"
        presentation="overlay"
        mode="single"
        @select="handleSelectExercise"
      />

      <div class="pt-4 border-t flex gap-3">
        <Button variant="outline" class="flex-1" @click="handleClose">{{
          t('common.buttons.cancel')
        }}</Button>
        <Button class="flex-1" :disabled="!canConfirm" @click="handleConfirm">{{
          t('dialogs.tabataConfig.addBlock')
        }}</Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
