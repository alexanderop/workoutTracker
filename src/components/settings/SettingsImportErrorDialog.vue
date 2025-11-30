<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import MobileDialogContent from '@/components/MobileDialogContent.vue'

const { error } = defineProps<{
  error: string
}>()

const open = defineModel<boolean>('open', { required: true })

function handleClose() {
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <AlertCircle class="h-5 w-5 text-destructive" />
          Import Failed
        </DialogTitle>
        <DialogDescription>
          {{ error }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex justify-end">
        <Button variant="outline" @click="handleClose"> OK </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
