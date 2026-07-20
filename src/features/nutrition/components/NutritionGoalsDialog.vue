<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { getNutritionRepository } from '@/db'
import type { DbNutritionGoal } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'
import {
  caloriesFromMacros,
  macroGramsFromPercents,
  macroPercentsFromGrams,
} from '../lib/nutritionCalculations'

const { goal } = defineProps<{ goal: DbNutritionGoal }>()
const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()

type MacroMode = 'grams' | 'percent'

const mode = ref<MacroMode>('grams')
const calories = ref(goal.calories)
const protein = ref(goal.proteinGrams)
const carbohydrates = ref(goal.carbohydrateGrams)
const fat = ref(goal.fatGrams)
const proteinPercent = ref(0)
const carbsPercent = ref(0)
const fatPercent = ref(0)
const saving = ref(false)
const saveFailed = ref(false)

function resetFromGoal() {
  mode.value = 'grams'
  protein.value = goal.proteinGrams
  carbohydrates.value = goal.carbohydrateGrams
  fat.value = goal.fatGrams
  calories.value = goal.calories
  const percents = macroPercentsFromGrams(goal)
  proteinPercent.value = percents.protein
  carbsPercent.value = percents.carbohydrate
  fatPercent.value = percents.fat
  saveFailed.value = false
}

watch(
  () => [open.value, goal] as const,
  ([isOpen]) => {
    if (!isOpen) return
    resetFromGoal()
  },
)

const gramMacros = computed(() => ({
  proteinGrams: Number(protein.value),
  carbohydrateGrams: Number(carbohydrates.value),
  fatGrams: Number(fat.value),
}))

const macroCalories = computed(() => caloriesFromMacros(gramMacros.value))

const percents = computed(() => ({
  protein: Number(proteinPercent.value),
  carbohydrate: Number(carbsPercent.value),
  fat: Number(fatPercent.value),
}))

const percentTotal = computed(
  () => percents.value.protein + percents.value.carbohydrate + percents.value.fat,
)

const percentGrams = computed(() => macroGramsFromPercents(Number(calories.value), percents.value))

// Tolerate float noise from decimal splits (33.3 + 33.3 + 33.4), not real gaps.
const percentTotalComplete = computed(() => Math.abs(percentTotal.value - 100) < 0.001)
const percentTotalDisplay = computed(() => Math.round(percentTotal.value * 10) / 10)

const gramsModeValid = computed(
  () =>
    macroCalories.value > 0 &&
    gramMacros.value.proteinGrams >= 0 &&
    gramMacros.value.carbohydrateGrams >= 0 &&
    gramMacros.value.fatGrams >= 0,
)

const percentModeValid = computed(
  () =>
    Number(calories.value) > 0 &&
    percents.value.protein >= 0 &&
    percents.value.carbohydrate >= 0 &&
    percents.value.fat >= 0 &&
    percentTotalComplete.value,
)

const isValid = computed(() =>
  mode.value === 'grams' ? gramsModeValid.value : percentModeValid.value,
)

function switchToPercentMode() {
  mode.value = 'percent'
  if (!gramsModeValid.value) return
  calories.value = macroCalories.value
  const derived = macroPercentsFromGrams(gramMacros.value)
  proteinPercent.value = derived.protein
  carbsPercent.value = derived.carbohydrate
  fatPercent.value = derived.fat
}

function switchToGramsMode() {
  const canSeed = percentModeValid.value
  const grams = percentGrams.value
  mode.value = 'grams'
  if (!canSeed) return
  protein.value = grams.proteinGrams
  carbohydrates.value = grams.carbohydrateGrams
  fat.value = grams.fatGrams
}

function handleModeChange(value: AcceptableValue | ReadonlyArray<AcceptableValue>) {
  if (value === mode.value) return
  if (value === 'percent') return switchToPercentMode()
  if (value === 'grams') return switchToGramsMode()
}

async function save() {
  if (!isValid.value || saving.value) return
  saving.value = true
  saveFailed.value = false
  const targets =
    mode.value === 'grams'
      ? { calories: macroCalories.value, ...gramMacros.value }
      : { calories: Number(calories.value), ...percentGrams.value }
  const [error] = await tryCatch(
    getNutritionRepository().saveGoal({
      id: 'current',
      ...targets,
      updatedAt: Date.now(),
    }),
  )
  saving.value = false
  if (error) {
    saveFailed.value = true
    return
  }
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <MobileDialogContent>
      <DialogHeader>
        <DialogTitle>{{ t('nutrition.goals.title') }}</DialogTitle>
        <DialogDescription>{{ t('nutrition.goals.description') }}</DialogDescription>
      </DialogHeader>
      <form class="flex min-h-0 flex-col gap-4" @submit.prevent="save">
        <div class="min-h-0 space-y-4 overflow-y-auto overscroll-contain scroll-py-2">
          <ToggleGroup
            type="single"
            :model-value="mode"
            variant="outline"
            :aria-label="t('nutrition.goals.modeLabel')"
            class="w-full [&_[data-state=on]]:bg-primary [&_[data-state=on]]:text-primary-foreground"
            @update:model-value="handleModeChange"
          >
            <ToggleGroupItem value="grams" class="min-h-11 flex-1">
              {{ t('nutrition.goals.modeGrams') }}
            </ToggleGroupItem>
            <ToggleGroupItem value="percent" class="min-h-11 flex-1">
              {{ t('nutrition.goals.modePercent') }}
            </ToggleGroupItem>
          </ToggleGroup>

          <template v-if="mode === 'grams'">
            <div class="space-y-1.5">
              <Label for="nutrition-goal-calories">{{ t('nutrition.fields.calories') }}</Label>
              <Input
                id="nutrition-goal-calories"
                :model-value="macroCalories"
                type="number"
                readonly
                class="bg-muted/60 text-muted-foreground"
              />
              <p class="text-xs text-muted-foreground">
                {{ t('nutrition.goals.caloriesComputed') }}
              </p>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="space-y-1.5">
                <Label for="nutrition-goal-protein">{{ t('nutrition.fields.protein') }}</Label>
                <Input
                  id="nutrition-goal-protein"
                  v-model="protein"
                  type="number"
                  min="0"
                  inputmode="decimal"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="nutrition-goal-carbs">{{ t('nutrition.fields.carbs') }}</Label>
                <Input
                  id="nutrition-goal-carbs"
                  v-model="carbohydrates"
                  type="number"
                  min="0"
                  inputmode="decimal"
                />
              </div>
              <div class="space-y-1.5">
                <Label for="nutrition-goal-fat">{{ t('nutrition.fields.fat') }}</Label>
                <Input
                  id="nutrition-goal-fat"
                  v-model="fat"
                  type="number"
                  min="0"
                  inputmode="decimal"
                />
              </div>
            </div>
          </template>

          <template v-else>
            <div class="space-y-1.5">
              <Label for="nutrition-goal-calories">{{ t('nutrition.fields.calories') }}</Label>
              <Input
                id="nutrition-goal-calories"
                v-model="calories"
                type="number"
                min="1"
                inputmode="numeric"
              />
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="space-y-1.5">
                <Label for="nutrition-goal-protein-percent">
                  {{ t('nutrition.goals.proteinPercent') }}
                </Label>
                <Input
                  id="nutrition-goal-protein-percent"
                  v-model="proteinPercent"
                  type="number"
                  min="0"
                  max="100"
                  inputmode="numeric"
                />
                <p class="text-xs text-muted-foreground">
                  {{ t('nutrition.goals.approxGrams', { grams: percentGrams.proteinGrams }) }}
                </p>
              </div>
              <div class="space-y-1.5">
                <Label for="nutrition-goal-carbs-percent">
                  {{ t('nutrition.goals.carbsPercent') }}
                </Label>
                <Input
                  id="nutrition-goal-carbs-percent"
                  v-model="carbsPercent"
                  type="number"
                  min="0"
                  max="100"
                  inputmode="numeric"
                />
                <p class="text-xs text-muted-foreground">
                  {{ t('nutrition.goals.approxGrams', { grams: percentGrams.carbohydrateGrams }) }}
                </p>
              </div>
              <div class="space-y-1.5">
                <Label for="nutrition-goal-fat-percent">
                  {{ t('nutrition.goals.fatPercent') }}
                </Label>
                <Input
                  id="nutrition-goal-fat-percent"
                  v-model="fatPercent"
                  type="number"
                  min="0"
                  max="100"
                  inputmode="numeric"
                />
                <p class="text-xs text-muted-foreground">
                  {{ t('nutrition.goals.approxGrams', { grams: percentGrams.fatGrams }) }}
                </p>
              </div>
            </div>
            <p
              class="text-sm"
              :class="percentTotalComplete ? 'text-muted-foreground' : 'text-destructive'"
            >
              {{ t('nutrition.goals.percentTotal', { total: percentTotalDisplay }) }}
              <template v-if="!percentTotalComplete">
                · {{ t('nutrition.goals.percentTotalError') }}
              </template>
            </p>
          </template>
        </div>
        <p v-if="saveFailed" role="alert" class="text-sm text-destructive">
          {{ t('nutrition.errors.saveFailed') }}
        </p>
        <Button type="submit" class="w-full" :disabled="!isValid || saving">
          {{ saving ? t('common.states.saving') : t('nutrition.goals.save') }}
        </Button>
      </form>
    </MobileDialogContent>
  </Dialog>
</template>
