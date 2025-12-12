<script setup lang="ts">
import { Trophy, Check } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { useEnterAnimation } from '@/composables/useEnterAnimation'
import { formatDuration } from '@/lib/formatters'

type Props = {
  workoutName: string
  duration: number
}

const { workoutName, duration } = defineProps<Props>()

const emit = defineEmits<{
  'view-details': []
}>()

const { t } = useI18n()
const formattedDuration = computed(() => formatDuration(duration))
const { isVisible } = useEnterAnimation(100)
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center p-6 gap-8">
    <!-- Trophy icon with bounce -->
    <div
      class="relative"
      :class="isVisible ? 'animate-bounce-in' : 'opacity-0'"
    >
      <div class="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
        <Trophy class="w-12 h-12 text-primary" aria-hidden="true" />
      </div>
      <div class="absolute inset-0 w-24 h-24 rounded-full bg-primary/10 blur-xl -z-10" />
    </div>

    <!-- Title -->
    <div
      class="text-center"
      :class="isVisible ? 'animate-slide-up-fade' : 'opacity-0'"
      :style="{ animationDelay: '200ms' }"
    >
      <h1 class="text-3xl font-bold tracking-tight mb-2">
        {{ t('workouts.summary.title') }}
      </h1>
      <p class="text-muted-foreground text-lg">{{ workoutName }}</p>
    </div>

    <!-- Duration (large) -->
    <div
      class="text-center"
      :class="isVisible ? 'animate-slide-up-fade' : 'opacity-0'"
      :style="{ animationDelay: '400ms' }"
    >
      <div class="text-6xl font-bold font-mono text-primary tabular-nums">
        {{ formattedDuration }}
      </div>
      <p class="text-muted-foreground mt-2">{{ t('workouts.summary.totalDuration') }}</p>
    </div>

    <!-- View Details Button -->
    <Button
      size="lg"
      class="h-touch text-lg font-semibold gap-2"
      :class="isVisible ? 'animate-slide-up-fade' : 'opacity-0'"
      :style="{ animationDelay: '600ms' }"
      @click="emit('view-details')"
    >
      <Check class="icon-md" aria-hidden="true" />
      {{ t('workouts.summary.viewDetails') }}
    </Button>
  </div>
</template>
