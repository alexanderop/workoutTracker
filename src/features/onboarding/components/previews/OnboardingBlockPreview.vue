<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Dumbbell, Timer } from 'lucide-vue-next'
import type { SampleBlock } from '../../constants/previewData'

const { block } = defineProps<{
  block: SampleBlock
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex items-center gap-3 rounded-lg border bg-card p-4">
    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
      <Dumbbell v-if="block.kind === 'strength'" class="h-5 w-5 text-primary" />
      <Timer v-else class="h-5 w-5 text-primary" />
    </div>
    <div class="min-w-0 flex-1 text-left">
      <p class="truncate font-medium">{{ block.name }}</p>
      <p class="text-sm text-muted-foreground">
        <template v-if="block.kind === 'strength'">
          {{ t('onboarding.quickWorkout.setsReps', { sets: block.sets, reps: block.reps }) }}
        </template>
        <template v-else>
          {{ t('onboarding.quickWorkout.minAmrap', { min: Math.floor(block.duration / 60) }) }}
        </template>
      </p>
    </div>
  </div>
</template>
