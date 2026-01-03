<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Trophy } from 'lucide-vue-next'
import type { SampleBenchmark } from '../../constants/previewData'

const { benchmark } = defineProps<{
  benchmark: SampleBenchmark
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex items-center gap-3 rounded-lg border bg-card p-4">
    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
      <Trophy class="h-5 w-5 text-primary" />
    </div>
    <div class="min-w-0 flex-1 text-left">
      <p class="truncate font-medium">{{ benchmark.name }}</p>
      <p class="text-sm text-muted-foreground">
        {{ benchmark.type === 'forTime' ? t('onboarding.benchmarks.forTime') : t('onboarding.benchmarks.amrap') }}
      </p>
    </div>
  </div>
</template>
