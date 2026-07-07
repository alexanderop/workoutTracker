<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Props = {
  open: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  cancel: []
  discard: []
}>()

const { t } = useI18n()

/**
 * Any dialog close that isn't an explicit button click (Escape, outside
 * click) is treated as "cancel" -- the pending navigation stays blocked and
 * the form keeps its unsaved changes.
 */
function handleOpenChange(value: boolean): void {
  if (!value) emit('cancel')
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('dialogs.unsavedChanges.title') }}</DialogTitle>
        <DialogDescription>{{ t('dialogs.unsavedChanges.description') }}</DialogDescription>
      </DialogHeader>
      <div class="flex gap-3 pt-4">
        <Button variant="outline" class="flex-1" @click="emit('cancel')">
          {{ t('common.buttons.cancel') }}
        </Button>
        <Button variant="destructive" class="flex-1" @click="emit('discard')">
          {{ t('dialogs.unsavedChanges.confirmButton') }}
        </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
