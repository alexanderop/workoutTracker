<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import DialogActions from '@/components/DialogActions.vue'
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

      <DialogActions v-slot="{ buttonClass }">
        <Button variant="outline" :class="buttonClass" @click="handleCancel">
          {{ t('dialogs.cancel.keepWorking') }}
        </Button>
        <Button variant="destructive" :class="buttonClass" @click="handleConfirm">
          {{ t('dialogs.cancel.deleteWorkout') }}
        </Button>
      </DialogActions>
    </MobileDialogContent>
  </Dialog>
</template>
