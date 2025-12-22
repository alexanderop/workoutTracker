<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useNumberLocale } from '@/composables/useNumberLocale'

type Props = {
  unit?: string
  allowDecimal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  allowDecimal: false,
})

const modelValue = defineModel<number>({ required: true })
const emit = defineEmits<{
  confirm: []
}>()

const { formatInputValue } = useNumberLocale()
</script>

<template>
  <div class="flex items-center gap-3 border-t bg-background px-4 py-3">
    <!-- Value Display -->
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="value-display"
      class="flex h-14 flex-1 items-center justify-center rounded-lg bg-secondary/30"
    >
      <span class="text-3xl font-bold tabular-nums text-foreground">
        {{ formatInputValue(modelValue, allowDecimal) }}
      </span>
      <span v-if="unit" class="ml-2 text-lg text-muted-foreground">
        {{ unit }}
      </span>
    </div>

    <!-- Confirm Button -->
    <Button
      type="button"
      size="icon-lg"
      class="h-14 w-14 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
      aria-label="Confirm value"
      data-testid="confirm-button"
      @click="emit('confirm')"
    >
      <Check class="h-6 w-6" stroke-width="3" />
    </Button>
  </div>
</template>
