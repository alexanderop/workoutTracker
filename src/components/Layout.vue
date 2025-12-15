<script setup lang="ts">
import { Activity, Dumbbell, Home, Settings } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { RouteNames } from '@/router'
import type { RouteName } from '@/router'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const hideNavigation = computed(() => route.meta.hideNav === true)

const navItems = computed<
  ReadonlyArray<{ routeName: RouteName; icon: typeof Home; label: string }>
>(() => [
  { routeName: RouteNames.Home, icon: Home, label: t('nav.home') },
  { routeName: RouteNames.Workouts, icon: Dumbbell, label: t('nav.workouts') },
  { routeName: RouteNames.Exercises, icon: Activity, label: t('nav.exercises') },
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
  <div class="flex flex-col h-screen bg-background lg:flex-row">
    <!-- Sidebar Navigation (Desktop) / Bottom Navigation (Mobile) -->
    <nav
      v-if="!hideNavigation"
      class="border-t bg-card sticky bottom-0 lg:relative lg:h-screen lg:w-64 lg:border-t-0 lg:border-r"
    >
      <div class="flex justify-around lg:flex-col lg:gap-2 lg:p-4">
        <button
          v-for="item in navItems"
          :key="item.routeName"
          class="flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3 lg:rounded-lg"
          :class="[
            isActive(item.routeName)
              ? 'text-primary border-t-2 border-primary lg:border-t-0 lg:bg-primary/10'
              : 'text-muted-foreground hover:text-foreground lg:hover:bg-accent',
          ]"
          @click="router.push({ name: item.routeName })"
        >
          <component :is="item.icon" :size="24" class="mb-1 lg:mb-0" />
          <span class="text-xs font-medium lg:text-sm">{{ item.label }}</span>
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>
  </div>
</template>

<style scoped></style>
