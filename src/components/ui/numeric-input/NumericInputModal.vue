<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import NumericWheelPicker from './NumericWheelPicker.vue'
import NumericKeypad from './NumericKeypad.vue'
import NumericSteppers from './NumericSteppers.vue'
import { useNumericInput, type InputType } from './useNumericInput'

type Props = {
  type: InputType
  unit?: string
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
})

const modelValue = defineModel<number>({ required: true })
const open = defineModel<boolean>('open', { required: true })

const { getPresetConfig } = useNumericInput()

// Internal value for editing (doesn't emit until Done)
const internalValue = ref(modelValue.value)

// Reset internal value when dialog opens
watch(open, (isOpen) => {
  if (isOpen) {
    internalValue.value = modelValue.value
  }
})

const config = computed(() => getPresetConfig(props.type))

const title = computed(() => {
  const titles: Record<InputType, string> = {
    weight: 'Weight',
    reps: 'Reps',
    rir: 'RIR',
  }
  return titles[props.type]
})

function handleDone() {
  modelValue.value = internalValue.value
  open.value = false
}

function handleCancel() {
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      :show-close-button="false"
      :aria-describedby="undefined"
      class="flex h-[100dvh] w-screen max-w-none flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none"
    >
      <!-- Header -->
      <header class="flex items-center justify-between border-b px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          class="text-muted-foreground"
          @click="handleCancel"
        >
          Cancel
        </Button>

        <DialogTitle class="text-sm font-semibold uppercase tracking-wider">
          {{ title }}
        </DialogTitle>

        <Button
          variant="ghost"
          size="sm"
          class="text-primary font-semibold"
          @click="handleDone"
        >
          Done
        </Button>
      </header>

      <!-- Content -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Wheel Picker -->
        <div class="flex-1 overflow-hidden">
          <NumericWheelPicker
            v-model="internalValue"
            :type="type"
            :unit="unit"
          />
        </div>

        <!-- Steppers -->
        <div class="border-t px-4 py-3">
          <NumericSteppers
            v-model="internalValue"
            :min="config.min"
            :max="config.max"
            :small-step="config.step"
            :large-step="config.step * 2"
          />
        </div>

        <!-- Keypad -->
        <div class="border-t px-4 py-4">
          <NumericKeypad
            v-model="internalValue"
            :max="config.max"
          />
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
