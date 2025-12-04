<script setup lang="ts">
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { getDefaultWorkoutName } from '@/lib/workoutName'

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })
const workoutName = defineModel<string>('workoutName', { default: '' })

const emit = defineEmits<{
  confirm: [name: string]
  cancel: []
}>()

const inputId = useId()

function handleCancel() {
  emit('cancel')
  open.value = false
}

function handleConfirm() {
  const finalName = workoutName.value.trim() || getDefaultWorkoutName()
  emit('confirm', finalName)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('dialogs.finish.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('dialogs.finish.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-2">
        <Label :for="inputId">{{ t('dialogs.finish.workoutName') }}</Label>
        <Input
          :id="inputId"
          v-model="workoutName"
          :placeholder="getDefaultWorkoutName()"
          :aria-label="t('dialogs.finish.workoutName')"
        />
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" class="w-full sm:w-auto" @click="handleCancel">
          {{ t('common.buttons.cancel') }}
        </Button>
        <Button class="w-full sm:w-auto" @click="handleConfirm">
          {{ t('dialogs.finish.finishButton') }}
        </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
