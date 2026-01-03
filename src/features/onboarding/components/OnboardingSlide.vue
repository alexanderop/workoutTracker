<script setup lang="ts">
/**
 * Base layout component for onboarding slides.
 * Provides consistent structure with title, description, and content slots.
 */
const { title, description } = defineProps<{
  title: string
  description?: string
}>()

defineSlots<{
  default(): unknown
  actions?(): unknown
}>()

defineExpose({})
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center px-6 py-8">
    <div class="w-full max-w-md space-y-6 text-center">
      <div class="space-y-2">
        <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
        <p v-if="description" class="text-muted-foreground">
          {{ description }}
        </p>
      </div>

      <div class="space-y-4">
        <slot />
      </div>

      <div v-if="$slots.actions" class="flex flex-col gap-3 pt-4">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
