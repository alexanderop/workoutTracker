<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronRight } from '@lucide/vue'
import { RouteNames } from '@/router'
import { Button } from '@/components/ui/button'
import { useHabits } from '../composables/useHabits'
import HabitDashboardTile from './HabitDashboardTile.vue'

/** Home card only surfaces a quick glance -- the full list lives at /habits. */
const HOME_CARD_LIMIT = 4

const { t } = useI18n()
const router = useRouter()
const { todayItems, hasHabits, isLoading, load, toggleToday } = useHabits()

onMounted(load)

const visibleItems = computed(() => todayItems.value.slice(0, HOME_CARD_LIMIT))

function navigateToHabits(): void {
  router.push({ name: RouteNames.Habits })
}
</script>

<template>
  <section
    v-if="hasHabits || isLoading"
    aria-labelledby="habits-home-heading"
    class="w-full max-w-md"
    data-testid="habits-home-card"
  >
    <div class="mb-3 flex items-center justify-between px-1">
      <h2 id="habits-home-heading" class="text-section-title font-bold">
        {{ t('habits.title') }}
      </h2>
      <Button
        variant="link"
        size="sm"
        class="h-auto p-0 text-primary"
        :aria-label="t('habits.home.viewAllAriaLabel')"
        @click="navigateToHabits"
      >
        {{ t('common.dashboard.seeAll') }}
        <ChevronRight class="ml-1 size-4" aria-hidden="true" />
      </Button>
    </div>

    <!-- The home tiles have no detail surface of their own: tapping a tile body
         takes the user to the full page, where the detail sheet lives. -->
    <div v-if="!isLoading" class="grid grid-cols-2 gap-3">
      <HabitDashboardTile
        v-for="item in visibleItems"
        :key="item.habit.id"
        :item="item"
        @toggle="toggleToday"
        @open-details="navigateToHabits"
      />
    </div>
  </section>
</template>
