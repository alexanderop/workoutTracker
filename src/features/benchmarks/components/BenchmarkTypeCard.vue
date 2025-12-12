<script setup lang="ts">
import type { Component } from 'vue'
import type { BenchmarkType } from '@/types/benchmark'
import { Button } from '@/components/ui/button'

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
  <Button
    variant="outline"
    :class="[
      'flex flex-col items-center gap-2 h-auto p-4 border-2',
      isSelected ? 'border-primary bg-primary/5' : 'border-border',
    ]"
    @click="emit('select', type)"
  >
    <component :is="icon" :size="32" />
    <div class="text-center">
      <div class="font-semibold">{{ label }}</div>
      <div class="text-xs text-muted-foreground">{{ description }}</div>
    </div>
  </Button>
</template>
