<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

type Props = {
  presets: Array<number>
  unit?: string
  allowDecimal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  allowDecimal: false,
})

const modelValue = defineModel<number>({ required: true })
const emit = defineEmits<{
  select: [value: number]
}>()

const scrollViewportRef = ref<HTMLElement | null>(null)

function formatValue(value: number): string {
  if (props.allowDecimal) {
    return value % 1 === 0 ? String(value) : value.toFixed(1)
  }
  return String(value)
}

function selectPreset(value: number) {
  modelValue.value = value
  emit('select', value)
}

function scrollToSelected() {
  nextTick(() => {
    const selectedButton = scrollViewportRef.value?.querySelector(
      '[data-selected="true"]',
    )
    selectedButton?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}

onMounted(scrollToSelected)

// Scroll to selected when value changes externally (e.g., from keypad)
watch(modelValue, scrollToSelected)
</script>

<template>
  <ScrollArea class="h-full">
    <div
      ref="scrollViewportRef"
      role="listbox"
      :aria-label="`Select value`"
      class="flex flex-col items-center gap-2 px-4 py-4"
    >
      <button
        v-for="value in presets"
        :key="value"
        type="button"
        role="option"
        :aria-selected="value === modelValue"
        :data-selected="value === modelValue"
        :data-testid="
          value === modelValue ? 'preset-selected' : `preset-${value}`
        "
        :class="
          cn(
            'flex h-12 w-full max-w-[200px] items-center justify-center rounded-lg text-lg transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            value === modelValue
              ? 'bg-secondary font-semibold text-foreground'
              : 'text-muted-foreground hover:bg-secondary/50',
          )
        "
        @click="selectPreset(value)"
      >
        <span class="tabular-nums">{{ formatValue(value) }}</span>
        <span v-if="unit" class="ml-1 text-base font-normal opacity-70">
          {{ unit }}
        </span>
      </button>
    </div>
  </ScrollArea>
</template>
