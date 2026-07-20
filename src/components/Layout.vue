<script setup lang="ts">
import { Dumbbell, Home, ListChecks, Plus, Settings } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { RouteNames } from '@/router'
import type { RouteName } from '@/router'
import { useQuickAddStore } from '@/stores/quickAdd'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const quickAdd = useQuickAddStore()

const hideNavigation = computed(() => route.meta.hideNav === true)

type NavItem = { routeName: RouteName; icon: typeof Home; label: string }

// Exercises and Weight left the nav when the center "+" button arrived;
// both stay reachable through the quick-add sheet it opens.
const leftNavItems = computed<ReadonlyArray<NavItem>>(() => [
  { routeName: RouteNames.Home, icon: Home, label: t('nav.home') },
  { routeName: RouteNames.Workouts, icon: Dumbbell, label: t('nav.workouts') },
])

const rightNavItems = computed<ReadonlyArray<NavItem>>(() => [
  { routeName: RouteNames.Habits, icon: ListChecks, label: t('nav.habits') },
  { routeName: RouteNames.Settings, icon: Settings, label: t('nav.settings') },
])

defineSlots<{
  default: () => unknown
}>()

function isActive(routeName: RouteName) {
  return route.name === routeName
}
</script>

<template>
  <div class="flex flex-col h-screen bg-background">
    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>

    <!-- Bottom Navigation -->
    <nav v-if="!hideNavigation" class="border-t bg-card sticky bottom-0">
      <div class="flex justify-around">
        <button
          v-for="item in leftNavItems"
          :key="item.routeName"
          class="flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors"
          :class="[
            isActive(item.routeName)
              ? 'text-primary border-t-2 border-primary'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="router.push({ name: item.routeName })"
        >
          <component :is="item.icon" :size="24" class="mb-1" />
          <span class="text-xs font-medium">{{ item.label }}</span>
        </button>

        <button
          type="button"
          class="flex-1 flex flex-col items-center justify-center py-2 px-2"
          :aria-label="t('quickAdd.open')"
          @click="quickAdd.open()"
        >
          <span
            class="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform active:scale-95"
          >
            <Plus :size="26" aria-hidden="true" />
          </span>
        </button>

        <button
          v-for="item in rightNavItems"
          :key="item.routeName"
          class="flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors"
          :class="[
            isActive(item.routeName)
              ? 'text-primary border-t-2 border-primary'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="router.push({ name: item.routeName })"
        >
          <component :is="item.icon" :size="24" class="mb-1" />
          <span class="text-xs font-medium">{{ item.label }}</span>
        </button>
      </div>
    </nav>
  </div>
</template>

<style scoped></style>
