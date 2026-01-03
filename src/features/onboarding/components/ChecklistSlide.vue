<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RouteNames } from '@/router'
import type { RouteName } from '@/router'
import OnboardingSlide from './OnboardingSlide.vue'

type Emits = {
  navigate: [routeName: RouteName]
  complete: []
}

const emit = defineEmits<Emits>()
const { t } = useI18n()

const checklistItems = [
  { labelKey: 'onboarding.checklist.createTemplate', routeName: RouteNames.CreateTemplate },
  { labelKey: 'onboarding.checklist.browseExercises', routeName: RouteNames.Exercises },
  { labelKey: 'onboarding.checklist.startWorkout', routeName: RouteNames.Home },
  { labelKey: 'onboarding.checklist.tryBenchmark', routeName: RouteNames.Workouts },
] as const

function handleItemClick(routeName: RouteName): void {
  emit('navigate', routeName)
}

defineExpose({})
</script>

<template>
  <OnboardingSlide
    :title="t('onboarding.checklist.title')"
    :description="t('onboarding.checklist.description')"
  >
    <div class="space-y-2">
      <Card
        v-for="item in checklistItems"
        :key="item.routeName"
        class="cursor-pointer transition-colors hover:bg-accent"
        @click="handleItemClick(item.routeName)"
      >
        <CardContent class="flex items-center justify-between p-4">
          <span>{{ t(item.labelKey) }}</span>
          <ChevronRight :size="20" class="text-muted-foreground" />
        </CardContent>
      </Card>
    </div>

    <template #actions>
      <Button size="lg" class="w-full" @click="emit('complete')">
        {{ t('onboarding.navigation.letsGo') }}
      </Button>
    </template>
  </OnboardingSlide>
</template>
