<script setup lang="ts">
import { ref, useId, watch } from 'vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const open = defineModel<boolean>('open', { required: true })

const { initialName = '', isSaving = false } = defineProps<{
  initialName?: string
  isSaving?: boolean
}>()

const emit = defineEmits<{
  confirm: [name: string]
}>()

const templateName = ref('')
const inputId = useId()

// Reset name when dialog opens
watch(open, (isOpen) => {
  if (isOpen) {
    templateName.value = initialName
  }
})

function handleConfirm() {
  const trimmedName = templateName.value.trim()
  if (!trimmedName) return
  emit('confirm', trimmedName)
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle>Save as Template</DialogTitle>
        <DialogDescription>
          Save this workout as a template to quickly start similar workouts in the future.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-2 py-4">
        <Label :for="inputId">Template Name</Label>
        <Input
          :id="inputId"
          v-model="templateName"
          placeholder="e.g., Push Day"
          aria-label="Template Name"
        />
      </div>

      <div class="flex gap-3">
        <Button variant="outline" class="flex-1" :disabled="isSaving" @click="open = false">
          Cancel
        </Button>
        <Button class="flex-1" :disabled="!templateName.trim() || isSaving" @click="handleConfirm">
          {{ isSaving ? 'Saving...' : 'Save Template' }}
        </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
