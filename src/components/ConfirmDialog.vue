<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import DialogActions from '@/components/DialogActions.vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'

const { confirmVariant = 'destructive', showCloseButton = true } = defineProps<{
  title: string
  /** Plain-text description; use the `description` slot for rich content. */
  description?: string
  cancelLabel: string
  confirmLabel: string
  confirmVariant?: 'default' | 'destructive'
  showCloseButton?: boolean
}>()

const open = defineModel<boolean>('open', { required: true })

defineSlots<{
  description?: () => unknown
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function handleCancel() {
  emit('cancel')
  open.value = false
}

function handleConfirm() {
  emit('confirm')
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent :show-close-button="showCloseButton">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>
          <slot name="description">{{ description }}</slot>
        </DialogDescription>
      </DialogHeader>

      <DialogActions v-slot="{ buttonClass }">
        <Button variant="outline" :class="buttonClass" @click="handleCancel">
          {{ cancelLabel }}
        </Button>
        <Button :variant="confirmVariant" :class="buttonClass" @click="handleConfirm">
          {{ confirmLabel }}
        </Button>
      </DialogActions>
    </MobileDialogContent>
  </Dialog>
</template>
