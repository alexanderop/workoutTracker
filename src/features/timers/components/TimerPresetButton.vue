<script setup lang="ts">
import { Play } from 'lucide-vue-next'

const { label, description, colorClass } = defineProps<{
  label: string
  description: string
  colorClass: string
}>()

defineEmits<{
  select: []
}>()
</script>

<template>
  <button
    class="w-full p-4 rounded-lg border-2 hover:border-current transition-colors text-left"
    :class="colorClass"
    @click="$emit('select')"
  >
    <div class="flex items-center justify-between">
      <div>
        <div class="font-semibold text-foreground">{{ label }}</div>
        <div class="text-sm text-muted-foreground">{{ description }}</div>
      </div>
      <Play class="icon-md" :class="colorClass" />
    </div>
  </button>
</template>
