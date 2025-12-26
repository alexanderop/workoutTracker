<script setup lang="ts">
import { Flame, Trophy, Dumbbell } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { Card } from '@/components/ui/card'

const { currentStreak, longestStreak, totalWorkouts } = defineProps<{
  currentStreak: number
  longestStreak: number
  totalWorkouts: number
}>()

const { t } = useI18n()

// Determine streak status for visual feedback
const streakStatus = currentStreak >= 7 ? 'hot' : currentStreak >= 3 ? 'warm' : 'starting'
</script>

<template>
  <Card class="w-full px-4 py-4">
    <!-- Current Streak - Main Feature -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <div
          class="flex items-center justify-center w-12 h-12 rounded-full transition-colors"
          :class="{
            'bg-orange-500/20': streakStatus === 'hot',
            'bg-orange-500/10': streakStatus === 'warm',
            'bg-muted': streakStatus === 'starting',
          }"
        >
          <Flame
            class="w-6 h-6 transition-colors"
            :class="{
              'text-orange-500': streakStatus === 'hot' || streakStatus === 'warm',
              'text-muted-foreground': streakStatus === 'starting',
            }"
            aria-hidden="true"
          />
        </div>
        <div>
          <div class="text-3xl font-bold">{{ currentStreak }}</div>
          <div class="text-sm text-muted-foreground">
            {{ t('nav.homeView.streak.currentStreak', 'day streak') }}
          </div>
        </div>
      </div>

      <!-- Motivational message based on streak -->
      <div
        v-if="currentStreak > 0"
        class="text-xs font-medium px-3 py-1.5 rounded-full"
        :class="{
          'bg-orange-500/10 text-orange-600 dark:text-orange-400': streakStatus === 'hot',
          'bg-primary/10 text-primary': streakStatus === 'warm',
          'bg-muted text-muted-foreground': streakStatus === 'starting',
        }"
      >
        {{
          streakStatus === 'hot'
            ? t('nav.homeView.streak.onFire', 'On fire!')
            : streakStatus === 'warm'
              ? t('nav.homeView.streak.keepGoing', 'Keep going!')
              : t('nav.homeView.streak.goodStart', 'Good start!')
        }}
      </div>
    </div>

    <!-- Secondary Stats -->
    <div class="grid grid-cols-2 gap-3 pt-3 border-t">
      <!-- Longest Streak -->
      <div class="flex items-center gap-2">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10">
          <Trophy class="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </div>
        <div>
          <div class="text-lg font-semibold">{{ longestStreak }}</div>
          <div class="text-xs text-muted-foreground">
            {{ t('nav.homeView.streak.longestStreak', 'Best streak') }}
          </div>
        </div>
      </div>

      <!-- Total Workouts -->
      <div class="flex items-center gap-2">
        <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
          <Dumbbell class="w-4 h-4 text-primary" aria-hidden="true" />
        </div>
        <div>
          <div class="text-lg font-semibold">{{ totalWorkouts }}</div>
          <div class="text-xs text-muted-foreground">
            {{ t('nav.homeView.streak.totalWorkouts', 'Total') }}
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>
