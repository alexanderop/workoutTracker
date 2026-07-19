<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import MobileDialogContent from '@/components/MobileDialogContent.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getNutritionRepository } from '@/db'
import type { DbNutritionGoal } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'

const { goal } = defineProps<{ goal: DbNutritionGoal }>()
const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()

const calories = ref(goal.calories)
const protein = ref(goal.proteinGrams)
const carbohydrates = ref(goal.carbohydrateGrams)
const fat = ref(goal.fatGrams)
const saving = ref(false)
const saveFailed = ref(false)

watch(
  () => [open.value, goal] as const,
  ([isOpen]) => {
    if (!isOpen) return
    calories.value = goal.calories
    protein.value = goal.proteinGrams
    carbohydrates.value = goal.carbohydrateGrams
    fat.value = goal.fatGrams
    saveFailed.value = false
  },
)

const isValid = computed(
  () =>
    Number(calories.value) > 0 &&
    Number(protein.value) >= 0 &&
    Number(carbohydrates.value) >= 0 &&
    Number(fat.value) >= 0,
)

async function save() {
  if (!isValid.value || saving.value) return
  saving.value = true
  saveFailed.value = false
  const [error] = await tryCatch(
    getNutritionRepository().saveGoal({
      id: 'current',
      calories: Number(calories.value),
      proteinGrams: Number(protein.value),
      carbohydrateGrams: Number(carbohydrates.value),
      fatGrams: Number(fat.value),
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
      <form class="space-y-4" @submit.prevent="save">
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
