<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import DialogActions from '@/components/DialogActions.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'

const { workoutName } = defineProps<{
  workoutName: string
}>()

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  confirm: []
}>()

function handleCancel(): void {
  open.value = false
}

function handleConfirm(): void {
  emit('confirm')
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('workouts.deleteWorkout.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('workouts.deleteWorkout.description', { name: workoutName }) }}
        </DialogDescription>
      </DialogHeader>

      <DialogActions v-slot="{ buttonClass }">
        <Button variant="outline" :class="buttonClass" @click="handleCancel">
          {{ t('common.buttons.cancel') }}
        </Button>
        <Button variant="destructive" :class="buttonClass" @click="handleConfirm">
          {{ t('workouts.deleteWorkout.confirmButton') }}
        </Button>
      </DialogActions>
    </MobileDialogContent>
  </Dialog>
</template>
