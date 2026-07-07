<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { TrendingUp } from '@lucide/vue'
import { RouteNames } from '@/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import ProgressionCard from '@/features/progressions/components/ProgressionCard.vue'
import { useProgressions } from '@/features/progressions/composables/useProgressions'

const { t } = useI18n()
const router = useRouter()
const { state } = useProgressions()

function navigateToDetail(id: string): void {
  router.push({ name: RouteNames.ProgressionDetail, params: { id } })
}

function handleCreate(): void {
  router.push({ name: RouteNames.CreateProgression })
}
</script>

<template>
  <div class="flex flex-1 flex-col p-4">
    <Card class="mb-6">
      <CardContent class="pt-6">
        <h1 class="mb-2 text-3xl font-bold">{{ t('progressions.title') }}</h1>
        <p class="text-muted-foreground">{{ t('progressions.subtitle') }}</p>
      </CardContent>
    </Card>

    <!-- Loading state -->
    <div v-if="state.status === 'loading'" class="flex flex-1 items-center justify-center py-8">
      <div class="text-muted-foreground">{{ t('common.states.loading') }}</div>
    </div>

    <!-- Error state -->
    <div v-else-if="state.status === 'error'" class="flex flex-1 items-center justify-center py-8">
      <div class="text-destructive">{{ t('common.states.error') }}</div>
    </div>

    <!-- Content -->
    <template v-else>
      <div class="mb-4">
        <Button class="w-full" @click="handleCreate">
          {{ t('progressions.buttons.create') }}
        </Button>
      </div>

      <!-- Progressions list -->
      <div v-if="state.items.length > 0" class="grid flex-1 gap-3 overflow-y-auto">
        <ProgressionCard
          v-for="item in state.items"
          :key="item.id"
          :id="item.id"
          :name="item.name"
          :level="item.level"
          :progress="item.progress"
          :is-complete="item.isComplete"
          :sessions-completed="item.sessionsCompleted"
          @click="navigateToDetail"
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
    </template>
  </div>
</template>
