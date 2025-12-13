<script setup lang="ts">
import { ArrowRight, Play, Timer } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { RouteNames } from '@/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import RecentWorkoutsSection from '@/components/RecentWorkoutsSection.vue'

const { t } = useI18n()
const router = useRouter()

function startWorkout() {
  router.push({ name: RouteNames.ActiveWorkout })
}

function goToTimers() {
  router.push({ name: RouteNames.Timers })
}
</script>

<template>
  <div class="flex flex-1 flex-col items-center gap-6 p-4">
    <!-- Greeting -->
    <div class="w-full max-w-md text-left">
      <h1 class="text-2xl font-bold">{{ t('nav.homeView.greeting') }}</h1>
    </div>
    <!-- Main action card -->
    <Card
      role="button"
      tabindex="0"
      :aria-label="t('nav.homeView.startNewWorkout')"
      class="w-full max-w-md cursor-pointer group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      @click="startWorkout"
      @keydown.enter="startWorkout"
      @keydown.space.prevent="startWorkout"
    >
      <CardHeader class="text-center pb-4">
        <div
          class="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
        >
          <Play class="w-8 h-8 text-primary ml-1" aria-hidden="true" />
        </div>
        <CardTitle class="text-2xl">{{ t('nav.homeView.startNewWorkout') }}</CardTitle>
        <CardDescription>{{ t('nav.homeView.trackDescription') }}</CardDescription>
      </CardHeader>
      <CardContent class="pt-0">
        <Button class="w-full group/btn" size="lg">
          {{ t('common.buttons.getStarted') }}
          <ArrowRight class="ml-2 icon-sm transition-transform group-hover/btn:translate-x-1" aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>

    <!-- Quick Timer card -->
    <Card
      role="button"
      tabindex="0"
      class="w-full max-w-md cursor-pointer group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
      @click="goToTimers"
      @keydown.enter="goToTimers"
      @keydown.space.prevent="goToTimers"
    >
      <CardHeader class="text-center pb-4">
        <div
          class="mx-auto mb-4 w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors"
        >
          <Timer class="w-7 h-7 text-orange-500" aria-hidden="true" />
        </div>
        <CardTitle class="text-xl">{{ t('nav.homeView.quickTimer') }}</CardTitle>
        <CardDescription>{{ t('nav.homeView.quickTimerDescription') }}</CardDescription>
      </CardHeader>
    </Card>

    <!-- Recent Workouts -->
    <RecentWorkoutsSection />
  </div>
</template>
