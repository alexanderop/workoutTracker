<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getWorkoutsRepository, getTemplatesRepository } from '@/db'
import type { DbCompletedWorkout, DbWorkoutTemplate } from '@/db/schema'
import { formatDate, formatDuration } from '@/lib/formatters'

const { t } = useI18n()

const router = useRouter()

const workouts = ref<ReadonlyArray<DbCompletedWorkout>>([])
const templates = ref<ReadonlyArray<DbWorkoutTemplate>>([])
const isLoading = ref(true)

onMounted(async () => {
  ;[workouts.value, templates.value] = await Promise.all([
    getWorkoutsRepository().getHistory(),
    getTemplatesRepository().getAll(),
  ])
  isLoading.value = false
})

function navigateToWorkoutDetail(workoutId: string): void {
  router.push({ name: RouteNames.WorkoutDetail, params: { id: workoutId } })
}

function navigateToTemplateDetail(templateId: string): void {
  router.push({ name: RouteNames.TemplateDetail, params: { id: templateId } })
}

function handleActivationKey(event: KeyboardEvent, action: () => void): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    action()
  }
}

function handleCreateTemplate(): void {
  router.push({ name: RouteNames.CreateTemplate })
}

function formatTemplateDate(timestamp: number | null): string {
  if (!timestamp) return 'Never used'
  return `Last used ${formatDate(timestamp)}`
}
</script>

<template>
  <div class="flex-1 p-4 flex flex-col">
    <Card class="mb-6">
      <CardContent class="pt-6">
        <h1 class="text-3xl font-bold mb-2">{{ t('workouts.title') }}</h1>
        <p class="text-muted-foreground">{{ t('workouts.empty.description') }}</p>
      </CardContent>
    </Card>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-8 flex-1">
      <div class="text-muted-foreground">{{ t('common.states.loading') }}</div>
    </div>

    <!-- Tabs -->
    <Tabs v-else default-value="history" class="flex flex-col flex-1">
      <TabsList class="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="templates">{{ t('workouts.list.templates') }}</TabsTrigger>
        <TabsTrigger value="history">{{ t('workouts.list.history') }}</TabsTrigger>
      </TabsList>

      <!-- Templates Tab -->
      <TabsContent value="templates" class="flex-1 flex flex-col">
        <div class="mb-4">
          <Button class="w-full" @click="handleCreateTemplate">{{
            t('common.buttons.createTemplate')
          }}</Button>
        </div>

        <!-- Templates list -->
        <div v-if="templates.length > 0" class="grid gap-3 flex-1 overflow-y-auto">
          <Card
            v-for="template in templates"
            :key="template.id"
            role="button"
            tabindex="0"
            class="p-4 cursor-pointer hover:bg-accent transition-colors"
            @click="navigateToTemplateDetail(template.id)"
            @keydown="(e: KeyboardEvent) => handleActivationKey(e, () => navigateToTemplateDetail(template.id))"
          >
            <div class="flex justify-between items-center">
              <div>
                <div class="font-medium">{{ template.name }}</div>
                <div class="text-sm text-muted-foreground">
                  {{ t('workouts.builder.blockCount', { count: template.blocks.length }) }}
                </div>
                <div class="text-xs text-muted-foreground mt-1">
                  {{ formatTemplateDate(template.lastUsedAt) }}
                </div>
              </div>
              <div class="text-sm text-muted-foreground">›</div>
            </div>
          </Card>
        </div>

        <!-- Empty state -->
        <div v-else class="flex-1 flex items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{{ t('workouts.empty.templates.title') }}</EmptyTitle>
              <EmptyDescription>{{ t('workouts.empty.templates.description') }}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </TabsContent>

      <!-- History Tab -->
      <TabsContent value="history" class="flex-1 flex flex-col">
        <!-- Workouts list -->
        <div v-if="workouts.length > 0" class="grid gap-3 flex-1 overflow-y-auto">
          <Card
            v-for="workout in workouts"
            :key="workout.id"
            role="button"
            tabindex="0"
            class="p-4 cursor-pointer hover:bg-accent transition-colors"
            @click="navigateToWorkoutDetail(workout.id)"
            @keydown="(e: KeyboardEvent) => handleActivationKey(e, () => navigateToWorkoutDetail(workout.id))"
          >
            <div class="flex justify-between items-center">
              <div>
                <div class="font-medium">{{ workout.name }}</div>
                <div class="text-sm text-muted-foreground">
                  {{ formatDate(workout.completedAt) }}
                </div>
              </div>
              <div class="text-sm text-muted-foreground tabular-nums">
                {{ formatDuration(workout.durationSeconds) }}
              </div>
            </div>
          </Card>
        </div>

        <!-- Empty state -->
        <div v-else class="flex-1 flex items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{{ t('workouts.empty.history.title') }}</EmptyTitle>
              <EmptyDescription>{{ t('workouts.empty.history.description') }}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
