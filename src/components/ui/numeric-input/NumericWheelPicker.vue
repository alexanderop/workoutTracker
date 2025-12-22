<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useNumericInput, type InputType } from './useNumericInput'
import { cn } from '@/lib/utils'

type Props = {
  type: InputType
  unit?: string
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
})

const modelValue = defineModel<number>({ required: true })

const { generateWheelValues, getPresetConfig } = useNumericInput()

const containerRef = ref<HTMLDivElement | null>(null)
const isScrolling = ref(false)
const scrollTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const config = computed(() => getPresetConfig(props.type))

const wheelValues = computed(() => {
  const { step, range, min, max } = config.value
  let values = generateWheelValues(modelValue.value, { step, range })

  // Filter by min/max constraints
  values = values.filter((v) => v >= min && v <= max)

  return values
})

const itemHeight = 56 // h-14 = 56px

function scrollToValue(value: number, smooth = true) {
  if (!containerRef.value) return

  const index = wheelValues.value.indexOf(value)
  if (index === -1) return

  const containerHeight = containerRef.value.clientHeight
  const targetScroll = index * itemHeight - containerHeight / 2 + itemHeight / 2

  containerRef.value.scrollTo({
    top: targetScroll,
    behavior: smooth ? 'smooth' : 'auto',
  })
}

function handleItemClick(value: number) {
  modelValue.value = value
  scrollToValue(value)
}

function handleScroll() {
  if (!containerRef.value) return

  isScrolling.value = true

  // Debounce scroll end detection
  if (scrollTimeout.value) {
    clearTimeout(scrollTimeout.value)
  }

  scrollTimeout.value = setTimeout(() => {
    isScrolling.value = false
    detectCenteredValue()
  }, 150)
}

function detectCenteredValue() {
  if (!containerRef.value) return

  const containerHeight = containerRef.value.clientHeight
  const scrollTop = containerRef.value.scrollTop
  const centerOffset = scrollTop + containerHeight / 2

  // Find which item is at center
  const index = Math.round((centerOffset - itemHeight / 2) / itemHeight)
  const clampedIndex = Math.max(0, Math.min(index, wheelValues.value.length - 1))
  const centeredValue = wheelValues.value[clampedIndex]

  if (centeredValue !== undefined && centeredValue !== modelValue.value) {
    modelValue.value = centeredValue
  }
}

function formatValue(value: number): string {
  if (config.value.allowDecimal) {
    // Show decimals only if not whole number
    return value % 1 === 0 ? String(value) : value.toFixed(1)
  }
  return String(value)
}

// Scroll to initial value on mount
onMounted(async () => {
  await nextTick()
  scrollToValue(modelValue.value, false)
})

// Re-center when modelValue changes externally
watch(modelValue, (newValue) => {
  if (!isScrolling.value) {
    scrollToValue(newValue)
  }
})
</script>

<template>
  <div class="relative h-[280px] w-full overflow-hidden">
    <!-- Gradient overlays for fade effect -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-background to-transparent"
    />
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-background to-transparent"
    />

    <!-- Selection highlight -->
    <div
      class="pointer-events-none absolute inset-x-4 top-1/2 z-5 h-14 -translate-y-1/2 rounded-lg bg-secondary/50"
    />

    <!-- Scrollable wheel -->
    <div
      ref="containerRef"
      data-testid="wheel-container"
      class="h-full snap-y snap-mandatory overflow-y-auto scrollbar-hide"
      @scroll="handleScroll"
    >
      <!-- Top padding for centering -->
      <div :style="{ height: `calc(50% - ${itemHeight / 2}px)` }" />

      <!-- Values -->
      <div
        v-for="value in wheelValues"
        :key="value"
        :data-testid="value === modelValue ? 'wheel-item-selected' : `wheel-item-${value}`"
        :class="
          cn(
            'flex h-14 cursor-pointer snap-center items-center justify-center transition-all duration-150',
            value === modelValue
              ? 'text-2xl font-bold text-foreground'
              : 'text-lg text-muted-foreground/70',
          )
        "
        @click="handleItemClick(value)"
      >
        <span class="tabular-nums">{{ formatValue(value) }}</span>
        <span v-if="unit && value === modelValue" class="ml-1 text-base font-normal">
          {{ unit }}
        </span>
      </div>

      <!-- Bottom padding for centering -->
      <div :style="{ height: `calc(50% - ${itemHeight / 2}px)` }" />
    </div>
  </div>
</template>

<style scoped>
/* Hide scrollbar while keeping functionality */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
