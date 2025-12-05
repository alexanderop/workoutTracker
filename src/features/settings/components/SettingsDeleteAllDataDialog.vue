<script setup lang="ts">
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { useI18n } from 'vue-i18n'

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
        <DialogTitle>{{ t('settings.dialogs.deleteAllData.title') }}</DialogTitle>
        <DialogDescription>
          {{ t('settings.dialogs.deleteAllData.description') }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" class="w-full sm:w-auto" @click="handleCancel">
          {{ t('settings.dialogs.deleteAllData.cancel') }}
        </Button>
        <Button variant="destructive" class="w-full sm:w-auto" @click="handleConfirm">
          {{ t('settings.dialogs.deleteAllData.confirm') }}
        </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
