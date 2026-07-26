<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * The four macro inputs, shared by the quick-add and custom-food panels.
 * `idPrefix` keeps label/input pairs unique if both are ever mounted at once.
 */
const { idPrefix } = defineProps<{ idPrefix: string }>()

const calories = defineModel<number | string>('calories', { required: true })
const protein = defineModel<number | string>('protein', { required: true })
const carbs = defineModel<number | string>('carbs', { required: true })
const fat = defineModel<number | string>('fat', { required: true })

const { t } = useI18n()
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <div class="space-y-1.5">
      <Label :for="`${idPrefix}-calories`">{{ t('nutrition.fields.calories') }}</Label>
      <Input
        :id="`${idPrefix}-calories`"
        v-model="calories"
        type="number"
        min="0"
        inputmode="decimal"
      />
    </div>
    <div class="space-y-1.5">
      <Label :for="`${idPrefix}-protein`">{{ t('nutrition.fields.protein') }}</Label>
      <Input
        :id="`${idPrefix}-protein`"
        v-model="protein"
        type="number"
        min="0"
        step="0.1"
        inputmode="decimal"
      />
    </div>
    <div class="space-y-1.5">
      <Label :for="`${idPrefix}-carbs`">{{ t('nutrition.fields.carbs') }}</Label>
      <Input
        :id="`${idPrefix}-carbs`"
        v-model="carbs"
        type="number"
        min="0"
        step="0.1"
        inputmode="decimal"
      />
    </div>
    <div class="space-y-1.5">
      <Label :for="`${idPrefix}-fat`">{{ t('nutrition.fields.fat') }}</Label>
      <Input
        :id="`${idPrefix}-fat`"
        v-model="fat"
        type="number"
        min="0"
        step="0.1"
        inputmode="decimal"
      />
    </div>
  </div>
</template>
