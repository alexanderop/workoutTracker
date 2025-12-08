<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { formatDate, formatDuration } from '@/lib/formatters'
import type { AttemptWithComparison } from '../composables/useBenchmarkAttemptHistory'

const { attempts } = defineProps<{
  attempts: ReadonlyArray<AttemptWithComparison>
}>()

const { t } = useI18n()
</script>

<template>
  <!-- Attempt History Section -->
  <div v-if="attempts.length > 0" class="border-t bg-muted/20 px-4 py-6">
    <h2 class="mb-4 text-lg font-semibold">
      {{ t('workouts.benchmarks.attemptHistory') }}
    </h2>

    <div class="space-y-2">
      <!-- Attempt rows -->
      <div
        v-for="attempt in attempts"
        :key="attempt.id"
        class="flex items-center justify-between rounded-lg bg-card px-4 py-3"
      >
        <!-- Date -->
        <div class="text-sm text-muted-foreground">
          {{ formatDate(attempt.completedAt) }}
        </div>

        <!-- Time -->
        <div class="text-lg font-semibold">
          {{ formatDuration(attempt.completionTime) }}
        </div>

        <!-- Comparison -->
        <div v-if="attempt.isPersonalBest" class="flex items-center gap-1 text-sm font-semibold text-primary">
          {{ t('workouts.benchmarks.pbBadge') }}
        </div>
        <div v-else class="text-sm text-muted-foreground">
          +{{ formatDuration(attempt.comparison.delta!) }}
        </div>
      </div>
    </div>
  </div>

  <!-- Empty state -->
  <div v-else class="border-t px-4 py-8 text-center text-muted-foreground">
    {{ t('workouts.benchmarks.noAttempts') }}
  </div>
</template>
