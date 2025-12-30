<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type Properties = {
  totalExercises: number
  currentIndex: number // 0-based
}

const { totalExercises, currentIndex } = defineProps<Properties>()
const { t } = useI18n()

const dots = computed(() => {
  return Array.from({ length: totalExercises }, (_, index) => {
    if (index < currentIndex) return 'completed'
    if (index === currentIndex) return 'active'
    return 'upcoming'
  })
})
</script>

<template>
  <div role="status" :aria-label="t('workouts.progress.label')" class="px-4 py-3">
    <!-- Screen reader announcement -->
    <div aria-live="polite" aria-atomic="true" class="sr-only">
      {{ t('workouts.progress.announcement', { current: currentIndex + 1, total: totalExercises }) }}
    </div>

    <div class="flex items-center justify-center gap-2">
      <div
        v-for="(state, i) in dots"
        :key="i"
        role="presentation"
        class="transition-all duration-200"
        :class="{
          'h-2 w-2 rounded-full bg-primary': state === 'active',
          'h-1.5 w-1.5 rounded-full bg-primary/60': state === 'completed',
          'h-1.5 w-1.5 rounded-full bg-muted-foreground/20': state === 'upcoming',
        }"
      />
    </div>
  </div>
</template>
