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
  <div class="flex flex-col h-screen bg-background">
    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto">
      <slot />
    </main>

    <!-- Bottom Navigation -->
    <nav v-if="!hideNavigation" class="border-t bg-card sticky bottom-0">
      <div class="flex justify-around">
        <button
          v-for="item in navItems"
          :key="item.routeName"
          class="flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors"
          :class="[
            isActive(item.routeName)
              ? 'text-primary border-t-2 border-primary'
              : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="item.routeName === RouteNames.Settings ? undefined : router.push({ name: item.routeName })"
        >
          <component :is="item.icon" :size="24" class="mb-1" />
          <span class="text-xs font-medium">{{ item.label }}</span>
        </button>
      </div>
    </nav>
  </div>
</template>

<style scoped></style>
