<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { BarChart3 } from '@lucide/vue'

const { t } = useI18n()

const { exerciseName } = defineProps<{
  exerciseName: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-8 text-center">
    <!-- Icon -->
    <div class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-6">
      <BarChart3 aria-hidden="true" class="w-8 h-8 text-muted-foreground" />
    </div>

    <!-- Title -->
    <h3 class="text-lg font-semibold mb-2">
      {{ t('exercises.progress.empty.title') }}
    </h3>

    <!-- Description -->
    <p class="text-sm text-muted-foreground max-w-[240px]">
      {{ t('exercises.progress.empty.description', { exercise: exerciseName }) }}
    </p>
  </div>
</template>
