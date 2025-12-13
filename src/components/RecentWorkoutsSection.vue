<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronRight, Dumbbell } from 'lucide-vue-next'
import { RouteNames } from '@/router'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import RecentWorkoutCard from '@/components/RecentWorkoutCard.vue'
import { useRecentWorkouts } from '@/composables/useRecentWorkouts'

const { t } = useI18n()
const router = useRouter()
const { recentWorkouts, hasHistory, isLoading } = useRecentWorkouts(3)

function navigateToWorkoutDetail(id: string): void {
  router.push({ name: RouteNames.WorkoutDetail, params: { id } })
}

function navigateToHistory(): void {
  router.push({ name: RouteNames.History })
}
</script>

<template>
  <section class="w-full max-w-md">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-lg font-semibold">{{ t('nav.homeView.recentWorkouts') }}</h2>
      <Button
        v-if="hasHistory"
        variant="link"
        size="sm"
        class="h-auto p-0 text-primary"
        @click="navigateToHistory"
      >
        {{ t('nav.homeView.viewAll') }}
        <ChevronRight class="ml-1 h-4 w-4" />
      </Button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="py-8 text-center text-sm text-muted-foreground">
      {{ t('common.states.loading') }}
    </div>

    <!-- Workouts list -->
    <div v-else-if="hasHistory" class="space-y-2">
      <RecentWorkoutCard
        v-for="workout in recentWorkouts"
        :key="workout.id"
        :workout="workout"
        @click="navigateToWorkoutDetail"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="py-8">
      <Empty>
        <EmptyMedia>
          <Dumbbell class="h-10 w-10 text-muted-foreground" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{{ t('nav.homeView.emptyHistory.title') }}</EmptyTitle>
          <EmptyDescription>{{ t('nav.homeView.emptyHistory.description') }}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  </section>
</template>
