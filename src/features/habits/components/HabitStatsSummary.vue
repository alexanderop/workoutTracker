<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Flame, Trophy, TrendingUp } from '@lucide/vue'
import type { HabitStats } from '../composables/useHabitStats'

const { stats } = defineProps<{
  stats: HabitStats
}>()

const { t } = useI18n()

const completionRateDisplay = computed(() => `${Math.round(stats.completionRate30d * 100)}%`)
</script>

<template>
  <div class="grid grid-cols-3 gap-2 text-center">
    <div class="rounded-lg border bg-card p-3">
      <Flame class="mx-auto mb-1 h-4 w-4 text-highlight" aria-hidden="true" />
      <p class="text-lg font-bold tabular-nums">{{ stats.currentStreak }}</p>
      <p class="text-xs text-muted-foreground">{{ t('habits.stats.currentStreak') }}</p>
    </div>
    <div class="rounded-lg border bg-card p-3">
      <Trophy class="mx-auto mb-1 h-4 w-4 text-highlight" aria-hidden="true" />
      <p class="text-lg font-bold tabular-nums">{{ stats.longestStreak }}</p>
      <p class="text-xs text-muted-foreground">{{ t('habits.stats.longestStreak') }}</p>
    </div>
    <div class="rounded-lg border bg-card p-3">
      <TrendingUp class="mx-auto mb-1 h-4 w-4 text-success" aria-hidden="true" />
      <p class="text-lg font-bold tabular-nums">{{ completionRateDisplay }}</p>
      <p class="text-xs text-muted-foreground">{{ t('habits.stats.completionRate') }}</p>
    </div>
  </div>
</template>
