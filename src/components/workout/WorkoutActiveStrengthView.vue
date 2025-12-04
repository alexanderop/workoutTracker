<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NumberField, NumberFieldInput } from '@/components/ui/number-field'
import { useWeightDisplay } from '@/composables/useWeightDisplay'
import type { StrengthBlock } from '@/types/blocks'

const { t } = useI18n()

type Props = {
  block: StrengthBlock
  activeSetIndex: number
}

const emit = defineEmits<{
  'update-set': [setId: number, field: 'kg' | 'reps' | 'rir', value: number | undefined]
}>()

const { block, activeSetIndex } = defineProps<Props>()

const { unitLabel, toDisplayValue, toStorageValue } = useWeightDisplay()

const activeSet = computed(() => block.sets[activeSetIndex])

// Last completed set for smart hint
const lastCompletedSet = computed(() => {
  const completed = block.sets.slice(0, activeSetIndex).filter((s) => s.status === 'completed')
  return completed.length > 0 ? completed[completed.length - 1] : null
})

const lastSetHint = computed(() => {
  if (!lastCompletedSet.value) return null
  const weight = lastCompletedSet.value.kg
  if (!weight) return null
  return `${t('workouts.active.strength.last')}${toDisplayValue(weight)}${unitLabel.value}`
})

function handleWeightChange(displayValue: number | undefined) {
  if (!activeSet.value) return
  emit('update-set', activeSet.value.id, 'kg', toStorageValue(displayValue))
}

function getRepsValue() {
  return activeSet.value?.reps ? Number(activeSet.value.reps) : undefined
}

function handleRepsChange(value: number | undefined) {
  if (!activeSet.value) return
  emit('update-set', activeSet.value.id, 'reps', value)
}

function getRirValue() {
  return activeSet.value?.rir ? Number(activeSet.value.rir) : undefined
}

function handleRirChange(value: number | undefined) {
  if (!activeSet.value) return
  emit('update-set', activeSet.value.id, 'rir', value)
}
</script>

<template>
  <div class="flex-1 flex flex-col px-4 py-6">
    <!-- Zone 1: Exercise Identity -->
    <header class="text-center mb-6">
      <h1 class="text-lg font-bold uppercase tracking-widest text-foreground/90">
        {{ block.name }}
      </h1>
      <p class="text-sm text-muted-foreground mt-1">
        {{ block.equipment }}
      </p>
    </header>

    <!-- Zone 2: Set Progress Dots -->
    <div class="flex items-center justify-center gap-2 mb-8">
      <div v-for="(set, index) in block.sets" :key="set.id" class="flex items-center gap-2">
        <div
          :class="[
            'size-3 rounded-full transition-all duration-200',
            set.status === 'completed'
              ? 'bg-primary'
              : index === activeSetIndex
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-transparent'
                : 'bg-muted-foreground/30',
          ]"
        />
        <span v-if="index < block.sets.length - 1" class="w-4 h-px bg-muted-foreground/20" />
      </div>
      <span class="ml-3 text-sm text-muted-foreground tabular-nums">
        {{ activeSetIndex + 1 }}/{{ block.sets.length }}
      </span>
    </div>

    <!-- Zone 3: Hero Weight Input -->
    <div v-if="activeSet" class="flex-1 flex flex-col items-center justify-center">
      <div class="mb-8">
        <div class="flex items-baseline justify-center gap-3">
          <NumberField
            :model-value="toDisplayValue(activeSet?.kg)"
            :min="0"
            :max="999"
            @update:model-value="handleWeightChange"
          >
            <NumberFieldInput
              placeholder="—"
              :aria-label="t('common.aria.weight')"
              class="bg-secondary/80 border-0 shadow-none focus-visible:ring-2 focus-visible:ring-primary h-24 text-7xl font-extrabold tabular-nums rounded-2xl text-center w-44"
            />
          </NumberField>
          <span class="text-3xl font-medium text-muted-foreground">{{ unitLabel }}</span>
        </div>
        <!-- Last set hint -->
        <p v-if="lastSetHint" class="text-center text-sm text-muted-foreground/70 mt-2">
          {{ lastSetHint }}
        </p>
      </div>

      <!-- Zone 4: Secondary Inputs (Reps + RIR side-by-side) -->
      <div class="flex items-center justify-center gap-6">
        <!-- Reps -->
        <div class="flex flex-col items-center">
          <NumberField
            :model-value="getRepsValue()"
            :min="0"
            :max="999"
            @update:model-value="handleRepsChange"
          >
            <NumberFieldInput
              placeholder="—"
              :aria-label="t('common.aria.reps')"
              class="bg-secondary/80 border-0 shadow-none focus-visible:ring-2 focus-visible:ring-primary h-16 text-4xl font-bold text-primary tabular-nums rounded-xl text-center w-24"
            />
          </NumberField>
          <span class="text-sm text-muted-foreground mt-2 uppercase tracking-wide">{{
            t('workouts.active.strength.reps')
          }}</span>
        </div>

        <!-- Divider -->
        <div class="h-12 w-px bg-border" />

        <!-- RIR -->
        <div class="flex flex-col items-center">
          <NumberField
            :model-value="getRirValue()"
            :min="0"
            :max="10"
            @update:model-value="handleRirChange"
          >
            <NumberFieldInput
              placeholder="—"
              :aria-label="t('common.aria.repsInReserve')"
              class="bg-secondary/80 border-0 shadow-none focus-visible:ring-2 focus-visible:ring-primary h-16 text-4xl font-bold tabular-nums rounded-xl text-center w-24"
            />
          </NumberField>
          <span class="text-sm text-muted-foreground mt-2 uppercase tracking-wide">{{
            t('workouts.active.strength.rir')
          }}</span>
        </div>
      </div>
    </div>

    <!-- Zone 5: Completed Sets History -->
    <div v-if="block.sets.some((s) => s.status === 'completed')" class="mt-auto pt-6">
      <div class="flex flex-wrap items-center justify-center gap-2">
        <template v-for="set in block.sets" :key="set.id">
          <div
            v-if="set.status === 'completed'"
            class="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium tabular-nums"
          >
            {{ toDisplayValue(set.kg) }}{{ unitLabel }} × {{ set.reps }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
