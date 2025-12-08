<script setup lang="ts">
import { Trophy, Check } from 'lucide-vue-next'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useEnterAnimation } from '@/composables/useEnterAnimation'
import { formatDuration } from '@/lib/formatters'

type Props = {
  completionTime: number
  benchmarkName: string
}

const { completionTime, benchmarkName } = defineProps<Props>()

const emit = defineEmits<{
  'view-details': []
}>()

const formattedTime = computed(() => formatDuration(completionTime))
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
        <Trophy class="w-12 h-12 text-primary" />
      </div>
      <div class="absolute inset-0 w-24 h-24 rounded-full bg-primary/10 blur-xl -z-10" />
    </div>

    <!-- Title -->
    <div
      class="text-center"
      :class="isVisible ? 'animate-slide-up-fade' : 'opacity-0'"
      :style="{ animationDelay: '200ms' }"
    >
      <!-- eslint-disable-next-line @intlify/vue-i18n/no-raw-text -->
      <h1 class="text-3xl font-bold tracking-tight mb-2">
        Workout Complete!
      </h1>
      <p class="text-muted-foreground text-lg">{{ benchmarkName }}</p>
    </div>

    <!-- Completion Time (large) -->
    <div
      class="text-center"
      :class="isVisible ? 'animate-slide-up-fade' : 'opacity-0'"
      :style="{ animationDelay: '400ms' }"
    >
      <div class="text-6xl font-bold font-mono text-primary tabular-nums">
        {{ formattedTime }}
      </div>
      <!-- eslint-disable-next-line @intlify/vue-i18n/no-raw-text -->
      <p class="text-muted-foreground mt-2">Final Time</p>
    </div>

    <!-- View Details Button -->
    <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
    <Button
      size="lg"
      class="h-14 text-lg font-semibold gap-2"
      :class="isVisible ? 'animate-slide-up-fade' : 'opacity-0'"
      :style="{ animationDelay: '600ms' }"
      @click="emit('view-details')"
    >
      <Check class="size-5" />
      View Details
    </Button>
    <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
  </div>
</template>
