<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import MobileDialogContent from '@/components/MobileDialogContent.vue'

const { t } = useI18n()

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  confirm: []
}>()

function handleCancel() {
  open.value = false
}

function handleConfirm() {
  emit('confirm')
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('dialogs.cancel.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('dialogs.cancel.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" class="w-full sm:w-auto" @click="handleCancel">
          {{ t('dialogs.cancel.keepWorking') }}
        </Button>
        <Button variant="destructive" class="w-full sm:w-auto" @click="handleConfirm">
          {{ t('dialogs.cancel.deleteWorkout') }}
        </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
