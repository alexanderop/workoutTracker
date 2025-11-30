<script setup lang="ts">
import { useId } from 'vue'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { getDefaultWorkoutName } from '@/lib/workoutName'

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
        <DialogTitle>Finish Workout?</DialogTitle>
        <DialogDescription>
          Your workout will be saved to your history. This action cannot be undone.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-2">
        <Label :for="inputId">Workout Name</Label>
        <Input
          :id="inputId"
          v-model="workoutName"
          :placeholder="getDefaultWorkoutName()"
          aria-label="Workout Name"
        />
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" class="w-full sm:w-auto" @click="handleCancel"> Cancel </Button>
        <Button class="w-full sm:w-auto" @click="handleConfirm"> Finish Workout </Button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
