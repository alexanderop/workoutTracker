<script setup lang="ts">
import { Search } from '@lucide/vue'
import { format } from 'date-fns'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DbFood, DbNutritionDiaryEntry } from '@/db/schema'
import { getCurrentLocale, getDateLocale } from '@/lib/dateLocale'
import { filterFoods, latestFoods, quickAddGrams, timePickFoods } from '../lib/foodSuggestions'
import FoodSearchRow from './FoodSearchRow.vue'

const { foods, history } = defineProps<{
  /** Non-archived library foods, most recently used first. */
  foods: ReadonlyArray<DbFood>
  /** Diary entries across recent history, for picks/recents/serving fallbacks. */
  history: ReadonlyArray<DbNutritionDiaryEntry>
}>()

const emit = defineEmits<{
  select: [food: DbFood]
  'quick-add': [food: DbFood]
  'toggle-favorite': [food: DbFood]
  create: [initialName: string]
}>()

const { t } = useI18n()

const query = ref('')
const trimmedQuery = computed(() => query.value.trim())
const searching = computed(() => trimmedQuery.value.length > 0)

const results = computed(() => filterFoods(foods, trimmedQuery.value))
const favorites = computed(() => foods.filter((food) => food.favorite))
const picks = computed(() => timePickFoods(foods, history, new Date()))
const latest = computed(() => latestFoods(foods, history))

const picksTime = computed(() => {
  const locale = getDateLocale(getCurrentLocale())
  return format(new Date(2000, 0, 1, new Date().getHours()), 'p', { locale })
})

const sections = computed(() => {
  const definitions = [
    { key: 'favorites', title: t('nutrition.food.favorites'), foods: favorites.value },
    {
      key: 'picks',
      title: t('nutrition.food.picksTitle', { time: picksTime.value }),
      foods: picks.value,
    },
    { key: 'latest', title: t('nutrition.food.latest'), foods: latest.value },
  ]
  return definitions.filter((section) => section.foods.length > 0)
})

function gramsFor(food: DbFood): number {
  return quickAddGrams(food, history)
}
</script>

<template>
  <div class="flex min-h-0 flex-col gap-3">
    <div class="relative shrink-0">
      <Search
        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        v-model="query"
        type="search"
        class="pl-9"
        :placeholder="t('nutrition.food.searchPlaceholder')"
        :aria-label="t('nutrition.food.searchPlaceholder')"
        autocomplete="off"
        data-testid="food-search-input"
      />
    </div>

    <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain scroll-py-2">
      <template v-if="searching">
        <ul v-if="results.length > 0" class="space-y-1" role="list">
          <FoodSearchRow
            v-for="food in results"
            :key="food.id"
            :food="food"
            :grams="gramsFor(food)"
            @select="emit('select', $event)"
            @quick-add="emit('quick-add', $event)"
            @toggle-favorite="emit('toggle-favorite', $event)"
          />
        </ul>
        <div v-else class="space-y-3 py-4 text-center">
          <p class="text-sm text-muted-foreground">{{ t('nutrition.food.noResults') }}</p>
          <Button type="button" variant="outline" @click="emit('create', trimmedQuery)">
            {{ t('nutrition.food.createNamed', { query: trimmedQuery }) }}
          </Button>
        </div>
      </template>

      <template v-else>
        <section
          v-for="section in sections"
          :key="section.key"
          class="space-y-1"
          :data-testid="`food-section-${section.key}`"
        >
          <h3 class="px-2 text-sm font-semibold">{{ section.title }}</h3>
          <ul class="space-y-1" role="list">
            <FoodSearchRow
              v-for="food in section.foods"
              :key="food.id"
              :food="food"
              :grams="gramsFor(food)"
              @select="emit('select', $event)"
              @quick-add="emit('quick-add', $event)"
              @toggle-favorite="emit('toggle-favorite', $event)"
            />
          </ul>
        </section>
      </template>
    </div>

    <Button
      type="button"
      variant="outline"
      class="w-full shrink-0"
      @click="emit('create', trimmedQuery)"
    >
      {{ t('nutrition.food.createNew') }}
    </Button>
  </div>
</template>
