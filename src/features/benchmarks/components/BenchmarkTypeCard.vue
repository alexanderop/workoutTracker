<script setup lang="ts">
import type { Component } from 'vue'
import type { BenchmarkType } from '@/types/benchmark'

type Emits = {
  select: [type: BenchmarkType]
}

const { type, isSelected, icon, label, description } = defineProps<{
  type: BenchmarkType
  isSelected: boolean
  icon: Component
  label: string
  description: string
}>()

const emit = defineEmits<Emits>()
</script>

<template>
  <button
    type="button"
    :class="[
      'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent',
    ]"
    @click="emit('select', type)"
  >
    <component :is="icon" :size="32" />
    <div class="text-center">
      <div class="font-semibold">{{ label }}</div>
      <div class="text-xs text-muted-foreground">{{ description }}</div>
    </div>
  </button>
</template>
