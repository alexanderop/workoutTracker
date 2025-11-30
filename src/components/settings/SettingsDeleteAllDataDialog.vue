<script setup lang="ts">
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import MobileDialogContent from '@/components/MobileDialogContent.vue'

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
        <DialogTitle>Delete All Data?</DialogTitle>
        <DialogDescription>
          This will permanently delete all your workouts, exercises, templates, and settings. This
          action cannot be undone.
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" class="w-full sm:w-auto" @click="handleCancel"> Cancel </Button>
        <Button variant="destructive" class="w-full sm:w-auto" @click="handleConfirm">
          Delete All Data
        </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
