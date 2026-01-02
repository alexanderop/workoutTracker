<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import NumericPresetList from './NumericPresetList.vue'
import NumericValueDisplay from './NumericValueDisplay.vue'
import NumericKeypad from './NumericKeypad.vue'
import { useNumericInput, type InputType } from './useNumericInput'
import { useSettingsStore } from '@/stores/settings'
import type { Equipment } from '@/types/exercises'

type Props = {
  type: InputType
  unit?: string
  equipment?: Equipment
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  equipment: undefined,
})

const { t } = useI18n()
const settingsStore = useSettingsStore()

const modelValue = defineModel<number>({ required: true })
const open = defineModel<boolean>('open', { required: true })

const { getPresetConfig, generateWheelValues } = useNumericInput()

// Internal value for editing (doesn't emit until confirmed)
const internalValue = ref(modelValue.value)

// Reset internal value when dialog opens
watch(open, (isOpen) => {
  if (isOpen) {
    internalValue.value = modelValue.value
  }
})

// Keep internalValue in sync with modelValue when dialog is closed
// This ensures presets are centered correctly when external value changes
watch(modelValue, (newValue) => {
  if (!open.value) {
    internalValue.value = newValue
  }
})

const config = computed(() => getPresetConfig(props.type))

const presets = computed(() => {
  const { step, range, min, max } = config.value
  return generateWheelValues(modelValue.value, { step, range, min, max })
})

const title = computed(() => {
  const titles: Record<InputType, string> = {
    weight: 'Weight',
    reps: 'Reps',
    rir: 'RIR',
    duration: 'Duration',
    distance: 'Distance',
  }
  return titles[props.type]
})

function handleConfirm() {
  modelValue.value = internalValue.value
  open.value = false
}

function handlePresetSelect(value: number) {
  // Instant apply: preset tap immediately applies and closes
  modelValue.value = value
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
          {{ t('common.buttons.cancel') }}
        </Button>

        <DialogTitle class="text-sm font-semibold uppercase tracking-wider">
          {{ title }}
        </DialogTitle>

        <!-- Spacer for centering title -->
        <div class="w-[60px]" />
      </header>

      <!-- Content -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- Preset List -->
        <div class="flex-1 overflow-hidden">
          <NumericPresetList
            v-model="internalValue"
            :presets="presets"
            :unit="unit"
            :allow-decimal="config.allowDecimal"
            @select="handlePresetSelect"
          />
        </div>

        <!-- Value Display + Confirm Button -->
        <NumericValueDisplay
          v-model="internalValue"
          :unit="unit"
          :allow-decimal="config.allowDecimal"
          :equipment="equipment"
          :input-type="type"
          :weight-unit="settingsStore.weightUnit"
          @confirm="handleConfirm"
        />

        <!-- Keypad -->
        <div class="border-t px-4 py-4">
          <NumericKeypad
            v-model="internalValue"
            :max="config.max"
            :allow-decimal="config.allowDecimal"
          />
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
