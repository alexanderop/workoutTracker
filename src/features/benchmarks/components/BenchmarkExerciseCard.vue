<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from 'vue-i18n'
import type { DbBenchmarkExercise } from '@/db/schema'

const { exercise, index } = defineProps<{
  exercise: DbBenchmarkExercise
  index: number
}>()

const { t } = useI18n()
</script>

<template>
  <Card class="overflow-hidden">
    <CardContent class="p-4">
      <div class="flex items-center gap-4">
        <!-- Order number with bold typography -->
        <div
          class="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold"
        >
          {{ index + 1 }}
        </div>

        <!-- Exercise icon (large and prominent) -->
        <div class="flex-shrink-0 text-4xl" aria-hidden="true">
          {{ exercise.thumbnail }}
        </div>

        <!-- Exercise info with editorial typography -->
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-lg font-bold">{{ exercise.name }}</h3>
          <p class="text-sm text-muted-foreground">
            <span class="font-semibold">{{ exercise.prescribedReps }}</span>
            {{ t('common.reps') }}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
