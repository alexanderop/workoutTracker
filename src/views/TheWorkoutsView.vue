<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TemplateListCard from '@/components/TemplateListCard.vue'
import BenchmarkListCard from '@/features/benchmarks/components/BenchmarkListCard.vue'
import { useWorkoutsList } from '@/composables/useWorkoutsList'
import { useBenchmarksList } from '@/composables/useBenchmarksList'

const { t } = useI18n()
const router = useRouter()
const { templates, isLoading, formatTemplateDate } = useWorkoutsList()
const { benchmarks, personalBests, formatBenchmarkType } = useBenchmarksList()

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
    <Tabs v-else default-value="templates" class="flex flex-1 flex-col">
      <TabsList class="mb-6 grid w-full grid-cols-2">
        <TabsTrigger value="templates">{{ t('workouts.list.templates') }}</TabsTrigger>
        <TabsTrigger value="benchmarks">{{ t('workouts.list.benchmarks') }}</TabsTrigger>
      </TabsList>

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
            :personal-best="personalBests.get(benchmark.id)?.completionTimeSeconds"
            :format-type="formatBenchmarkType"
            @click="navigateToBenchmarkDetail"
          />
        </div>

        <!-- Empty state -->
        <div v-else class="flex flex-1 items-center justify-center">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{{ t('workouts.empty.benchmarks.title') }}</EmptyTitle>
              <EmptyDescription>{{ t('workouts.empty.benchmarks.description') }}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
