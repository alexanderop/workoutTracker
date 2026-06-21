<script setup lang="ts">
import { computed, onMounted, shallowRef, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { RouteNames } from '@/router'
import { getWorkoutsRepository } from '@/db'
import type { DbCompletedWorkout } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import { getDateLocale, getCurrentLocale } from '@/lib/dateLocale'
import PageLayout from '@/components/PageLayout.vue'
import WorkoutHistoryCard from '@/components/WorkoutHistoryCard.vue'
import SwipeableWorkoutCard from '@/components/SwipeableWorkoutCard.vue'
import DeleteWorkoutDialog from '@/components/DeleteWorkoutDialog.vue'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { useSwipeableDelete } from '@/composables/useSwipeableDelete'

// ============================================
// Types
// ============================================

type WorkoutGroup = {
  label: string
  workouts: Array<DbCompletedWorkout>
}

type GroupedWorkouts = {
  monthKey: string
  label: string
  workouts: ReadonlyArray<DbCompletedWorkout>
}

// ============================================
// Composable Setup
// ============================================

const { t } = useI18n()
const router = useRouter()

// ============================================
// State
// ============================================

const workouts = shallowRef<ReadonlyArray<DbCompletedWorkout>>([])
const isLoading = ref(true)

// ============================================
// Computed
// ============================================

const groupedByMonth = computed<ReadonlyArray<GroupedWorkouts>>(() => {
  const groups = new Map<string, WorkoutGroup>()
  const dateLocale = getDateLocale(getCurrentLocale())

  for (const workout of workouts.value) {
    const date = new Date(workout.completedAt)
    const monthKey = format(date, 'yyyy-MM')

    const existing = groups.get(monthKey)
    if (!existing) {
      const label = format(date, 'LLLL yyyy', { locale: dateLocale })
      groups.set(monthKey, { label, workouts: [workout] })
      continue
    }
    existing.workouts.push(workout)
  }

  return [...groups].map(([monthKey, group]) => ({
    monthKey,
    label: group.label,
    workouts: group.workouts,
  }))
})

// ============================================
// Methods
// ============================================

async function loadHistory(): Promise<void> {
  isLoading.value = true
  const [error, result] = await tryCatch(getWorkoutsRepository().getHistory({ limit: 100 }))

  if (!error && result) {
    workouts.value = result
  }

  isLoading.value = false
}

// Swipeable delete composable handles card state and deletion
const {
  openCardId,
  deleteDialogOpen,
  workoutToDelete,
  handleCardOpen,
  handleCardClose,
  handleDeleteRequest,
  handleDeleteConfirm,
  isCardSwiped,
} = useSwipeableDelete({
  workouts,
  onDeleted: loadHistory,
})

function navigateToWorkoutDetail(workoutId: string): void {
  if (isCardSwiped.value) return
  router.push({ name: RouteNames.WorkoutDetail, params: { id: workoutId } })
}

// ============================================
// Lifecycle
// ============================================

onMounted(() => {
  loadHistory()
})
</script>

<template>
  <PageLayout :title="t('nav.history')" back-to="/">
    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-16">
      <div class="text-muted-foreground">{{ t('common.states.loading') }}</div>
    </div>

    <!-- Workouts grouped by month -->
    <div v-else-if="workouts.length > 0" class="space-y-6 p-4">
      <section v-for="group in groupedByMonth" :key="group.monthKey">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {{ group.label }}
        </h2>
        <div class="space-y-2">
          <SwipeableWorkoutCard
            v-for="workout in group.workouts"
            :key="workout.id"
            :workout-id="workout.id"
            :is-open="openCardId === workout.id"
            @open="handleCardOpen"
            @close="handleCardClose"
            @delete="handleDeleteRequest"
          >
            <WorkoutHistoryCard
              :workout="workout"
              @click="navigateToWorkoutDetail"
            />
          </SwipeableWorkoutCard>
        </div>
      </section>
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-1 items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{{ t('workouts.empty.history.title') }}</EmptyTitle>
          <EmptyDescription>{{ t('workouts.empty.history.description') }}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <!-- Delete confirmation dialog -->
    <DeleteWorkoutDialog
      v-model:open="deleteDialogOpen"
      :workout-name="workoutToDelete?.name ?? ''"
      @confirm="handleDeleteConfirm"
    />
  </PageLayout>
</template>
