<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Minus, Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useWeightDisplay } from '@/composables/useWeightDisplay'

const emit = defineEmits<{
  save: [weightKg: number]
}>()

const { t } = useI18n()
const { unitLabel, toStorageValue } = useWeightDisplay()

const inputValue = ref<string>('')

function handleSave() {
  const displayValue = parseFloat(inputValue.value)
  if (isNaN(displayValue) || displayValue <= 0) {
    return
  }

  const kgValue = toStorageValue(displayValue)
  if (kgValue === undefined) {
    return
  }

  emit('save', kgValue)
  inputValue.value = ''
}

function adjustWeight(delta: number) {
  const current = parseFloat(inputValue.value) || 0
  const newValue = Math.max(0, current + delta)
  inputValue.value = newValue.toFixed(1)
}

const isValid = computed(() => {
  const value = parseFloat(inputValue.value)
  return !isNaN(value) && value > 0
})
</script>

<template>
  <div class="space-y-3">
    <Label for="weight-input">{{ t('weight.enterWeight') }}</Label>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        type="button"
        @click="adjustWeight(-0.5)"
        :aria-label="t('weight.decreaseWeight')"
      >
        <Minus class="h-4 w-4" />
      </Button>
      <div class="relative flex-1">
        <Input
          id="weight-input"
          v-model="inputValue"
          type="number"
          inputmode="decimal"
          step="0.1"
          min="0"
          :placeholder="t('weight.placeholder')"
          class="pr-12 text-center text-lg"
          @keyup.enter="handleSave"
        />
        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {{ unitLabel }}
        </span>
      </div>
      <Button
        variant="outline"
        size="icon"
        type="button"
        @click="adjustWeight(0.5)"
        :aria-label="t('weight.increaseWeight')"
      >
        <Plus class="h-4 w-4" />
      </Button>
    </div>
    <Button
      class="w-full"
      :disabled="!isValid"
      @click="handleSave"
    >
      {{ t('weight.save') }}
    </Button>
  </div>
</template>
