<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronRight } from '@lucide/vue'
import { RouteNames } from '@/router'
import { Button } from '@/components/ui/button'
import { useHabits } from '../composables/useHabits'
import HabitHomeRow from './HabitHomeRow.vue'

/** Home card only surfaces a quick glance -- the full list lives at /habits. */
const HOME_CARD_LIMIT = 4

const { t } = useI18n()
const router = useRouter()
const { todayItems, hasHabits, isLoading, load, toggleToday, entriesFor } = useHabits()

onMounted(load)

const visibleItems = computed(() => todayItems.value.slice(0, HOME_CARD_LIMIT))

function navigateToHabits(): void {
  router.push({ name: RouteNames.Habits })
}
</script>

<template>
  <section v-if="hasHabits || isLoading" class="w-full max-w-md" data-testid="habits-home-card">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-section-title font-semibold">{{ t('habits.home.title') }}</h2>
      <Button
        variant="link"
        size="sm"
        class="h-auto p-0 text-primary"
        :aria-label="t('habits.home.viewAllAriaLabel')"
        @click="navigateToHabits"
      >
        {{ t('habits.home.viewAll') }}
        <ChevronRight class="ml-1 h-4 w-4" />
      </Button>
    </div>

    <div v-if="!isLoading" class="space-y-2">
      <HabitHomeRow
        v-for="item in visibleItems"
        :key="item.habit.id"
        :item="item"
        :entries="entriesFor(item.habit.id)"
        @toggle="toggleToday"
      />
    </div>
  </section>
</template>
