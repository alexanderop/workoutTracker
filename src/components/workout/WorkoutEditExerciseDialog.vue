<script setup lang="ts">
import { ref, watch } from 'vue'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'

type Props = {
  open: boolean
  exerciseName: string
  equipment: string
  targetReps: number
  setCount: number
}

type Emits = {
  'update:open': [value: boolean]
  save: [data: { name: string; equipment: string; targetReps: number; setCount: number }]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const name = ref(props.exerciseName)
const equipment = ref(props.equipment)
const targetReps = ref(props.targetReps)
const setCount = ref(props.setCount)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = props.exerciseName
      equipment.value = props.equipment
      targetReps.value = props.targetReps
      setCount.value = props.setCount
    }
  },
)

function handleSave() {
  emit('save', {
    name: name.value,
    equipment: equipment.value,
    targetReps: targetReps.value,
    setCount: Math.max(1, setCount.value),
  })
  emit('update:open', false)
}

function handleCancel() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <MobileDialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Exercise</DialogTitle>
        <DialogDescription> Update the exercise details for this workout </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <Label for="exercise-name">Exercise Name</Label>
          <Input id="exercise-name" v-model="name" placeholder="e.g. Bench Press" class="h-12" />
        </div>

        <div class="grid gap-2">
          <Label for="equipment">Equipment</Label>
          <Input
            id="equipment"
            v-model="equipment"
            placeholder="e.g. Barbell, Dumbbells"
            class="h-12"
          />
        </div>

        <NumberField id="target-reps" v-model="targetReps" :min="1" :max="100">
          <Label for="target-reps">Target Reps</Label>
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>

        <NumberField id="set-count" v-model="setCount" :min="1" :max="20">
          <Label for="set-count">Number of Sets</Label>
          <NumberFieldContent>
            <NumberFieldDecrement />
            <NumberFieldInput />
            <NumberFieldIncrement />
          </NumberFieldContent>
        </NumberField>
      </div>

      <DialogFooter class="flex-row gap-2">
        <Button variant="outline" class="flex-1" @click="handleCancel"> Cancel </Button>
        <Button class="flex-1" @click="handleSave"> Save Changes </Button>
      </DialogFooter>
    </MobileDialogContent>
  </Dialog>
</template>
