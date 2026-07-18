<script setup lang="ts">
const { title, description } = defineProps<{
  title: string
  description?: string
}>()

defineSlots<{ default(): unknown }>()
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center px-6 text-center">
    <h1 class="text-page-title font-bold tracking-tight" tabindex="-1">
      {{ title }}
    </h1>
    <p v-if="description" class="mt-2 text-muted-foreground">
      {{ description }}
    </p>
    <div class="mt-8 w-full max-w-sm">
      <slot />
    </div>
  </div>
</template>
