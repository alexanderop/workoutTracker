<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import DialogActions from '@/components/DialogActions.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import MobileNumberPicker from '@/components/MobileNumberPicker.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Exercise } from '@/composables/useExerciseSearch'

type Emits = {
  confirm: [reps: number]
  cancel: []
}

const { exercise } = defineProps<{
  exercise: Exercise | null
}>()

const emit = defineEmits<Emits>()

const open = defineModel<boolean>('open', { required: true })
const reps = ref(10)

const { t } = useI18n()

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      reps.value = 10
    }
  },
)

function handleConfirm() {
  emit('confirm', reps.value)
  open.value = false
}

function handleCancel() {
  emit('cancel')
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ t('dialogs.benchmarkReps.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('dialogs.benchmarkReps.description', { exercise: exercise?.name ?? '' }) }}
        </DialogDescription>
      </DialogHeader>

      <div class="py-4">
        <MobileNumberPicker
          v-model="reps"
          :min="1"
          :max="500"
          :step="1"
          :large-step="5"
        />
      </div>

      <DialogActions variant="inline" v-slot="{ buttonClass }">
        <Button variant="outline" :class="buttonClass" @click="handleCancel">
          {{ t('common.buttons.cancel') }}
        </Button>
        <Button :class="buttonClass" @click="handleConfirm">
          {{ t('common.buttons.add') }}
        </Button>
      </DialogActions>
    </MobileDialogContent>
  </Dialog>
</template>
