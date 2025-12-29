<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { useWorkoutDurationTimer } from '../composables/useWorkoutDurationTimer'
import { useWorkoutMode } from '../composables/useWorkoutMode'
import { RouteNames } from '@/router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { formattedDuration } = useWorkoutDurationTimer()
const { isActiveMode } = useWorkoutMode()

const shouldShow = computed(
  () => isActiveMode.value && route.name !== RouteNames.ActiveWorkout,
)

function navigateToWorkout() {
  router.push({ name: RouteNames.ActiveWorkout })
}
</script>

<template>
  <Transition name="fab">
    <Button
      v-if="shouldShow"
      variant="default"
      size="lg"
      class="fixed bottom-20 right-4 z-40 rounded-full px-5 shadow-lg"
      :aria-label="t('common.aria.activeWorkoutFab')"
      @click="navigateToWorkout"
    >
      <span class="font-mono tabular-nums">{{ formattedDuration }}</span>
    </Button>
  </Transition>
</template>

<style scoped>
.fab-enter-active,
.fab-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(0.5rem);
}
</style>
