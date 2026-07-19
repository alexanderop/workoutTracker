<script setup lang="ts" generic="T extends string">
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { SelectorOption } from '@/features/exercises/data/exerciseOptions'

type Properties = {
  title: string
  description: string
  options: ReadonlyArray<SelectorOption<T>>
  selected?: T
  /** 'grid' for icon grid (Equipment), 'list' for vertical list (others) */
  layout?: 'grid' | 'list'
}

const { title, description, options, selected, layout = 'list' } = defineProps<Properties>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ select: [value: T] }>()

function handleSelect(value: T) {
  emit('select', value)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>

      <!-- Grid layout (for Equipment) -->
      <div
        v-if="layout === 'grid'"
        class="grid min-h-0 grid-cols-3 gap-3 overflow-y-auto overscroll-contain"
      >
        <button
          v-for="option in options"
          :key="option.value"
          class="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all"
          :class="[
            selected === option.value
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-muted',
          ]"
          @click="handleSelect(option.value)"
        >
          <span class="text-3xl">{{ option.icon }}</span>
          <span class="text-xs font-medium text-center">{{ option.label }}</span>
        </button>
      </div>

      <!-- List layout -->
      <div v-else class="min-h-0 space-y-2 overflow-y-auto overscroll-contain">
        <!-- With icon (Muscle style) -->
        <template v-if="options[0]?.icon && !options[0]?.description">
          <button
            v-for="option in options"
            :key="option.value"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left"
            :class="[
              selected === option.value
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50 hover:bg-muted',
            ]"
            @click="handleSelect(option.value)"
          >
            <span class="text-2xl">{{ option.icon }}</span>
            <span class="font-medium">{{ option.label }}</span>
            <span v-if="selected === option.value" class="ml-auto text-primary">✓</span>
          </button>
        </template>

        <!-- With description (Type/Metrics style) -->
        <template v-else>
          <button
            v-for="option in options"
            :key="option.value"
            class="w-full text-left px-4 py-3 rounded-lg border transition-all"
            :class="[
              selected === option.value
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50 hover:bg-muted',
            ]"
            @click="handleSelect(option.value)"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="font-medium">{{ option.label }}</p>
                <p v-if="option.description" class="text-xs text-muted-foreground mt-1">
                  {{ option.description }}
                </p>
              </div>
              <span v-if="selected === option.value" class="text-primary text-lg flex-shrink-0"
                >✓</span
              >
            </div>
          </button>
        </template>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
