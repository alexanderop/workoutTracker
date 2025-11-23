<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface Props {
  open: boolean
}

interface Emits {
  'update:open': [value: boolean]
  'add': [name: string]
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const exerciseName = ref('')

function handleAdd() {
  if (exerciseName.value.trim()) {
    emit('add', exerciseName.value)
    exerciseName.value = ''
  }
}

function handleOpenChange(value: boolean) {
  emit('update:open', value)
  if (!value) {
    exerciseName.value = ''
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Exercise</DialogTitle>
        <DialogDescription>
          Add a new exercise to this workout session
        </DialogDescription>
      </DialogHeader>

      <Input
        v-model="exerciseName"
        placeholder="Exercise name (e.g., Dumbbell Rows)"
        class="w-full"
        autofocus
        @keyup.enter="handleAdd"
      />

      <div class="flex gap-2 justify-end pt-4">
        <Button
          variant="outline"
          @click="handleOpenChange(false)"
        >
          Cancel
        </Button>
        <Button
          :disabled="!exerciseName.trim()"
          @click="handleAdd"
        >
          Add Exercise
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
