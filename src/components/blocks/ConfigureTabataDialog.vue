<script setup lang="ts">
import { Plus, Trash2 } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useToggle } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import DialogActions from '@/components/DialogActions.vue'
import ExercisePicker from '@/components/ExercisePicker.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import ExerciseAvatar from '@/components/ExerciseAvatar.vue'
import { generateId } from '@/db/index'
import type { BlockExercise, TabataConfig as TabataBlockConfig } from '@/blocks'
import { BLOCK_ICONS } from '@/blocks'
import type { Exercise } from '@/composables/useExerciseSearch'
import TabataConfigComponent, { type TabataConfigModel } from './TabataConfig.vue'

const { t } = useI18n()

type Emits = {
  confirm: [config: TabataBlockConfig, exercise: BlockExercise]
}

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<Emits>()

const config = ref<TabataConfigModel>({ rounds: 8, workSeconds: 20, restSeconds: 10 })
const exercise = ref<BlockExercise | null>(null)
const [showExercisePicker, toggleShowExercisePicker] = useToggle(false)

const canConfirm = computed(() => exercise.value !== null)

watch(open, (isOpen) => {
  if (!isOpen) {
    return
  }

  config.value = { rounds: 8, workSeconds: 20, restSeconds: 10 }
  exercise.value = null
  toggleShowExercisePicker(false)
})

function handleSelectExercise(selected: Exercise) {
  exercise.value = {
    id: generateId(),
    name: selected.name,
    prescribedReps: 0,
    load: null,
    image: selected.image ?? null,
  }
}

function removeExercise() {
  exercise.value = null
}

function handleConfirm() {
  if (!exercise.value) {
    return
  }

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
          <span class="text-2xl">{{ BLOCK_ICONS.tabata }}</span>
          <DialogTitle>{{ t('dialogs.tabataConfig.title') }}</DialogTitle>
        </div>
        <DialogDescription>{{ t('dialogs.tabataConfig.description') }}</DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto space-y-6 py-4">
        <TabataConfigComponent v-model="config" />

        <Separator />

        <div class="space-y-3">
          <Label>{{ t('dialogs.tabataConfig.exercise') }}</Label>

          <div v-if="!exercise" class="text-center py-6 text-muted-foreground">
            <p>{{ t('dialogs.tabataConfig.selectExercise') }}</p>
          </div>

          <div v-else class="flex items-center gap-3 bg-secondary/30 rounded-lg p-3">
            <ExerciseAvatar :name="exercise.name" :image="exercise.image" size="md" />
            <div class="flex-1">
              <p class="font-medium">{{ exercise.name }}</p>
            </div>
            <Button variant="ghost" size="icon-sm" class="text-destructive" @click="removeExercise">
              <Trash2 class="w-4 h-4" />
              <span class="sr-only">{{ t('common.aria.removeExercise') }}</span>
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

      <DialogActions variant="inline" class="pt-4" v-slot="{ buttonClass }">
        <Button variant="outline" :class="buttonClass" @click="handleClose">
          {{ t('common.buttons.cancel') }}
        </Button>
        <Button :class="buttonClass" :disabled="!canConfirm" @click="handleConfirm">
          {{ t('dialogs.tabataConfig.addBlock') }}
        </Button>
      </DialogActions>
    </MobileDialogContent>
  </Dialog>
</template>
