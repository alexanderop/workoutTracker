<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ClipboardList, TrendingUp, Trophy } from '@lucide/vue'
import { RouteNames } from '@/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { TabsContent } from '@/components/ui/tabs'
import SegmentedControl from '@/components/SegmentedControl.vue'
import TemplateListCard from '@/components/TemplateListCard.vue'
import BenchmarkListCard from '@/features/benchmarks/components/BenchmarkListCard.vue'
import ProgressionCard from '@/features/progressions/components/ProgressionCard.vue'
import { useWorkoutsList } from '@/composables/useWorkoutsList'
import { useBenchmarksList } from '@/composables/useBenchmarksList'
import { useProgressions } from '@/features/progressions/composables/useProgressions'

const { t } = useI18n()

const tabOptions = computed(() => [
  { value: 'templates' as const, label: t('workouts.list.templates') },
  { value: 'benchmarks' as const, label: t('workouts.list.benchmarks') },
  { value: 'progressions' as const, label: t('workouts.list.progressions') },
])
const router = useRouter()
const { templates, isLoading, formatTemplateDate } = useWorkoutsList()
const { benchmarks, personalBests, formatBenchmarkType } = useBenchmarksList()
const { state: progressionsState } = useProgressions()

const progressions = computed(() =>
  progressionsState.value.status === 'success' ? progressionsState.value.items : [],
)

function navigateToTemplateDetail(templateId: string): void {
  router.push({ name: RouteNames.TemplateDetail, params: { id: templateId } })
}

function handleCreateTemplate(): void {
  router.push({ name: RouteNames.CreateTemplate })
}

function handleCreateBenchmark(): void {
  router.push({ name: RouteNames.CreateBenchmark })
}

function navigateToBenchmarkDetail(benchmarkId: string): void {
  router.push({ name: RouteNames.BenchmarkDetail, params: { id: benchmarkId } })
}

function handleCreateProgression(): void {
  router.push({ name: RouteNames.CreateProgression })
}

function navigateToProgressionDetail(progressionId: string): void {
  router.push({ name: RouteNames.ProgressionDetail, params: { id: progressionId } })
}
</script>

<template>
  <div class="flex flex-1 flex-col p-4">
    <Card class="mb-6">
      <CardContent class="pt-6">
        <h1 class="mb-2 text-3xl font-bold">{{ t('workouts.title') }}</h1>
        <p class="text-muted-foreground">{{ t('workouts.subtitle') }}</p>
      </CardContent>
    </Card>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-1 items-center justify-center py-8">
      <div class="text-muted-foreground">{{ t('common.states.loading') }}</div>
    </div>

    <!-- Tabs -->
    <SegmentedControl v-else :options="tabOptions" default-value="templates" list-class="mb-6">
      <!-- Templates Tab -->
      <TabsContent value="templates" class="flex flex-1 flex-col">
        <div class="mb-4">
          <Button class="w-full" @click="handleCreateTemplate">{{
            t('common.buttons.createTemplate')
          }}</Button>
        </div>

        <!-- Templates list -->
        <div v-if="templates.length > 0" class="grid flex-1 gap-3 overflow-y-auto">
          <TemplateListCard
            v-for="template in templates"
            :key="template.id"
            :template="template"
            :format-date="formatTemplateDate"
            @click="navigateToTemplateDetail"
          />
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-1 items-center justify-center">
          <Empty>
            <EmptyMedia>
              <ClipboardList class="h-10 w-10 text-muted-foreground" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{{ t('workouts.empty.templates.title') }}</EmptyTitle>
              <EmptyDescription>{{ t('workouts.empty.templates.description') }}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </TabsContent>

      <!-- Benchmarks Tab -->
      <TabsContent value="benchmarks" class="flex flex-1 flex-col">
        <div class="mb-4">
          <Button class="w-full" @click="handleCreateBenchmark">{{
            t('common.buttons.createBenchmark')
          }}</Button>
        </div>

        <!-- Benchmarks list -->
        <div v-if="benchmarks.length > 0" class="grid flex-1 gap-3 overflow-y-auto">
          <BenchmarkListCard
            v-for="benchmark in benchmarks"
            :key="benchmark.id"
            :benchmark="benchmark"
            :personal-best="personalBests.get(benchmark.id)"
            :format-type="formatBenchmarkType"
            @click="navigateToBenchmarkDetail"
          />
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-1 items-center justify-center">
          <Empty>
            <EmptyMedia>
              <Trophy class="h-10 w-10 text-muted-foreground" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{{ t('workouts.empty.benchmarks.title') }}</EmptyTitle>
              <EmptyDescription>{{ t('workouts.empty.benchmarks.description') }}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </TabsContent>

      <!-- Progressions Tab -->
      <TabsContent value="progressions" class="flex flex-1 flex-col">
        <div class="mb-4">
          <Button class="w-full" @click="handleCreateProgression">{{
            t('progressions.buttons.create')
          }}</Button>
        </div>

        <!-- Progressions list -->
        <div v-if="progressions.length > 0" class="grid flex-1 gap-3 overflow-y-auto">
          <ProgressionCard
            v-for="item in progressions"
            :key="item.id"
            :id="item.id"
            :name="item.name"
            :level="item.level"
            :progress="item.progress"
            :is-complete="item.isComplete"
            :sessions-completed="item.sessionsCompleted"
            @click="navigateToProgressionDetail"
          />
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-1 items-center justify-center">
          <Empty>
            <EmptyMedia>
              <TrendingUp class="h-10 w-10 text-muted-foreground" />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{{ t('progressions.empty.title') }}</EmptyTitle>
              <EmptyDescription>{{ t('progressions.empty.description') }}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </TabsContent>
    </SegmentedControl>
  </div>
</template>
