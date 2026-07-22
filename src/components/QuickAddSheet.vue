<script setup lang="ts">
import type { Component } from 'vue'
import {
  Activity,
  Apple,
  ChevronRight,
  ClipboardList,
  ListChecks,
  Play,
  Scale,
  TrendingUp,
} from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { RouteNames } from '@/router'
import type { RouteName } from '@/router'

type SheetAction = {
  key: string
  icon: Component
  label: string
  onSelect: () => void
}

const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{
  'log-weight': []
}>()

const { t } = useI18n()
const router = useRouter()

function navigateTo(routeName: RouteName, query?: Record<string, string>): void {
  open.value = false
  router.push({ name: routeName, query })
}

function handleLogWeight(): void {
  open.value = false
  emit('log-weight')
}

const quickActions = computed<ReadonlyArray<SheetAction>>(() => [
  {
    key: 'start-workout',
    icon: Play,
    label: t('quickAdd.startWorkout'),
    onSelect: () => navigateTo(RouteNames.ActiveWorkout),
  },
  {
    key: 'log-weight',
    icon: Scale,
    label: t('quickAdd.logWeight'),
    onSelect: handleLogWeight,
  },
  {
    key: 'add-habit',
    icon: ListChecks,
    label: t('quickAdd.addHabit'),
    onSelect: () => navigateTo(RouteNames.Habits, { create: '1' }),
  },
  {
    key: 'log-past-workout',
    icon: ClipboardList,
    label: t('quickAdd.logPastWorkout'),
    onSelect: () => navigateTo(RouteNames.LogPastWorkout),
  },
])

const browseItems = computed<ReadonlyArray<SheetAction>>(() => [
  {
    key: 'food-log',
    icon: Apple,
    label: t('quickAdd.foodLog'),
    onSelect: () => navigateTo(RouteNames.FoodLog),
  },
  {
    key: 'exercises',
    icon: Activity,
    label: t('nav.exercises'),
    onSelect: () => navigateTo(RouteNames.Exercises),
  },
  {
    key: 'weight-history',
    icon: TrendingUp,
    label: t('quickAdd.weightHistory'),
    onSelect: () => navigateTo(RouteNames.Weight),
  },
])
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle class="text-center">{{ t('quickAdd.title') }}</DialogTitle>
        <DialogDescription class="sr-only">{{ t('quickAdd.description') }}</DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="action in quickActions"
          :key="action.key"
          type="button"
          class="group flex flex-col items-center gap-2 rounded-lg py-2 transition-colors"
          @click="action.onSelect"
        >
          <span
            class="flex size-14 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-accent"
          >
            <component :is="action.icon" class="size-6" aria-hidden="true" />
          </span>
          <span class="text-xs font-medium">{{ action.label }}</span>
        </button>
      </div>

      <div class="divide-y border-t">
        <button
          v-for="item in browseItems"
          :key="item.key"
          type="button"
          class="flex min-h-12 w-full items-center gap-3 py-3 text-left transition-colors hover:bg-accent/40"
          @click="item.onSelect"
        >
          <component :is="item.icon" class="size-5 text-muted-foreground" aria-hidden="true" />
          <span class="flex-1 font-medium">{{ item.label }}</span>
          <ChevronRight class="size-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </div>
    </MobileDialogContent>
  </Dialog>
</template>
