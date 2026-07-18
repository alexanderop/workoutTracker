<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ChevronRight } from '@lucide/vue'
import { RouteNames } from '@/router'

const emit = defineEmits<{
  navigate: [routeName: string]
}>()

const { t } = useI18n()

const checklistItems = [
  { labelKey: 'onboarding.checklist.createTemplate', routeName: RouteNames.CreateTemplate },
  { labelKey: 'onboarding.checklist.browseExercises', routeName: RouteNames.Exercises },
  { labelKey: 'onboarding.checklist.startWorkout', routeName: RouteNames.Home },
  { labelKey: 'onboarding.checklist.tryBenchmark', routeName: RouteNames.Workouts },
] as const
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center px-6 text-center">
    <h1 class="text-page-title font-bold tracking-tight" tabindex="-1">
      {{ t('onboarding.checklist.title') }}
    </h1>
    <p class="mt-2 text-muted-foreground">
      {{ t('onboarding.checklist.description') }}
    </p>

    <div class="mt-8 w-full max-w-sm space-y-2">
      <button
        v-for="item in checklistItems"
        :key="item.routeName"
        @click="emit('navigate', item.routeName)"
        class="flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent"
      >
        <span class="text-sm font-medium">{{ t(item.labelKey) }}</span>
        <ChevronRight class="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  </div>
</template>
