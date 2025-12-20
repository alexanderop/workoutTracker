<script setup lang="ts" generic="T extends string">
import type { HTMLAttributes } from 'vue'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export type SegmentedOption<V extends string> = {
  value: V
  label: string
}

const { options, defaultValue, listClass } = defineProps<{
  options: Array<SegmentedOption<T>>
  defaultValue?: T
  listClass?: HTMLAttributes['class']
}>()

const model = defineModel<T>()

defineSlots<{
  default?: () => unknown
}>()
</script>

<template>
  <Tabs v-model="model" :default-value="defaultValue" class="flex flex-1 flex-col">
    <TabsList
      :class="cn('grid w-full', listClass)"
      :style="{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }"
    >
      <TabsTrigger v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </TabsTrigger>
    </TabsList>
    <slot />
  </Tabs>
</template>
