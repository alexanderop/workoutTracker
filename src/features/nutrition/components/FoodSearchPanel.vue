<script setup lang="ts">
import { Globe, Search } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DbFood } from '@/db/schema'
import { useRemoteFoodSearch } from '../composables/useRemoteFoodSearch'
import type { ExternalFoodHit } from '../lib/foodData'
import { excludeLibraryDuplicates, searchFoods } from '../lib/foodSearch'
import FoodResultRow from './FoodResultRow.vue'

const { foods } = defineProps<{ foods: ReadonlyArray<DbFood> }>()
const emit = defineEmits<{ stage: [food: DbFood]; 'stage-external': [hit: ExternalFoodHit] }>()
const query = defineModel<string>('query', { required: true })

const { t } = useI18n()

const results = computed(() => searchFoods(foods, query.value))

/**
 * Open Food Facts, searched in the background. The library list above is
 * computed synchronously and never waits on this — the network is an extra
 * section, not a gate on logging a food you already have.
 */
const { state: remote } = useRemoteFoodSearch(query)

const remoteResults = computed(() =>
  remote.value.status === 'ready' ? excludeLibraryDuplicates(remote.value.foods, foods) : [],
)

function servingGrams(food: DbFood): number {
  return food.defaultServingGrams ?? 100
}

/** Open Food Facts serving quantities are frequently missing; 100 g is the fallback. */
function hitGrams(hit: ExternalFoodHit): number {
  return hit.servingGrams ?? 100
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <p class="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {{ query.length > 0 ? t('nutrition.sheet.matches') : t('nutrition.sheet.recents') }}
      </p>

      <ul v-if="results.length > 0" data-testid="food-search-results">
        <FoodResultRow
          v-for="food in results"
          :key="food.id"
          :name="food.name"
          :brand="food.brand"
          :grams="servingGrams(food)"
          :nutrients="food.nutrientsPer100Grams"
          :serving-name="food.defaultServingName ?? t('nutrition.food.serving')"
          @stage="emit('stage', food)"
        />
      </ul>
      <p v-else class="px-4 py-6 text-center text-sm text-muted-foreground">
        {{
          foods.length === 0 ? t('nutrition.sheet.emptyLibrary') : t('nutrition.sheet.noMatches')
        }}
      </p>

      <!--
        Hidden entirely until a query is long enough to search for, so the
        recents view on open stays exactly what it was.
      -->
      <section v-if="remote.status !== 'idle'" data-testid="food-search-online">
        <p
          class="flex items-center gap-1.5 border-t bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          <Globe class="size-3.5" aria-hidden="true" />
          {{ t('nutrition.sheet.online') }}
        </p>

        <p
          v-if="remote.status === 'searching'"
          class="px-4 py-4 text-center text-sm text-muted-foreground"
        >
          {{ t('nutrition.sheet.onlineSearching') }}
        </p>
        <!--
          Not an alert and not a toast: an unreachable food database is a
          missing extra, and the library above still answers the question.
        -->
        <!-- `status`, not `alert`: announced politely when a screen reader
             lands on it or the region updates, without interrupting. -->
        <p
          v-else-if="remote.status === 'error'"
          role="status"
          class="px-4 py-4 text-center text-sm text-muted-foreground"
        >
          {{ t('nutrition.sheet.onlineFailed') }}
        </p>
        <ul v-else-if="remoteResults.length > 0" data-testid="food-search-online-results">
          <FoodResultRow
            v-for="hit in remoteResults"
            :key="hit.id"
            :name="hit.name"
            :brand="hit.brand"
            :grams="hitGrams(hit)"
            :nutrients="hit.nutrientsPer100Grams"
            :serving-name="t('nutrition.food.serving')"
            @stage="emit('stage-external', hit)"
          />
        </ul>
        <p v-else class="px-4 py-4 text-center text-sm text-muted-foreground">
          {{ t('nutrition.sheet.onlineNoMatches') }}
        </p>
      </section>
    </div>

    <!--
      Pinned low rather than at the top of the panel: on a phone this is the
      only field in the sheet, and it belongs in thumb reach.
    -->
    <div class="shrink-0 border-t p-3">
      <Label for="food-sheet-search" class="sr-only">{{ t('nutrition.sheet.search') }}</Label>
      <div class="relative">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="food-sheet-search"
          v-model="query"
          class="pl-9"
          type="search"
          autocomplete="off"
          :placeholder="t('nutrition.sheet.searchPlaceholder')"
        />
      </div>
    </div>
  </div>
</template>
