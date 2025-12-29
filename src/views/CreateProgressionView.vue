<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import { useProgressionForm, COMMON_KETTLEBELL_WEIGHTS } from '@/features/progressions/composables/useProgressionForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { RouteNames } from '@/router'
import { ArrowLeft, Trash2 } from 'lucide-vue-next'

const { t } = useI18n()
const router = useRouter()
const {
  name,
  selectedWeights,
  startingWeightIndex,
  isSaveDisabled,
  isSaving,
  sortedWeights,
  startingWeightOptions,
  toggleWeight,
  isWeightSelected,
  reset,
  save,
} = useProgressionForm()

function handleBack(): void {
  router.push({ name: RouteNames.Progressions })
}

function handleDiscard(): void {
  reset()
}

async function handleSave(): Promise<void> {
  const progression = await save()
  if (!progression) return

  router.push({ name: RouteNames.ProgressionDetail, params: { id: progression.id } })
}

function handleStartingWeightChange(value: AcceptableValue): void {
  if (typeof value === 'string') {
    startingWeightIndex.value = parseInt(value, 10)
  }
}
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between border-b p-4">
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          :aria-label="t('common.goBack')"
          @click="handleBack"
        >
          <ArrowLeft :size="20" />
        </Button>
        <h1 class="text-lg font-semibold">{{ t('progressions.create.title') }}</h1>
      </div>
      <div class="flex items-center gap-2">
        <Button
          v-if="name || selectedWeights.length > 0"
          variant="ghost"
          size="sm"
          :disabled="isSaving"
          @click="handleDiscard"
        >
          <Trash2 class="mr-1 icon-sm" />
          {{ t('common.buttons.discard') }}
        </Button>
        <Button :disabled="isSaveDisabled" @click="handleSave">
          {{ isSaving ? t('common.states.saving') : t('common.buttons.save') }}
        </Button>
      </div>
    </header>

    <!-- Form Content -->
    <div class="flex-1 overflow-y-auto p-4">
      <div class="mx-auto max-w-md space-y-6">
        <!-- Progression Name -->
        <div class="space-y-2">
          <Label for="progression-name">{{ t('progressions.create.name') }}</Label>
          <Input
            id="progression-name"
            v-model="name"
            :placeholder="t('progressions.create.namePlaceholder')"
          />
        </div>

        <!-- Available Kettlebells -->
        <div class="space-y-2">
          <Label>{{ t('progressions.create.kettlebells') }}</Label>
          <p class="text-sm text-muted-foreground">
            {{ t('progressions.create.kettlebellsHint') }}
          </p>
          <div class="flex flex-wrap gap-2">
            <Button
              v-for="weight in COMMON_KETTLEBELL_WEIGHTS"
              :key="weight"
              :variant="isWeightSelected(weight) ? 'default' : 'outline'"
              size="sm"
              @click="toggleWeight(weight)"
            >
              {{ weight }}kg
            </Button>
          </div>
        </div>

        <!-- Starting Weight -->
        <div v-if="sortedWeights.length > 1" class="space-y-2">
          <Label for="starting-weight">{{ t('progressions.create.startingWeight') }}</Label>
          <Select
            :model-value="String(startingWeightIndex)"
            @update:model-value="handleStartingWeightChange"
          >
            <SelectTrigger id="starting-weight">
              <SelectValue :placeholder="t('progressions.create.selectWeight')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in startingWeightOptions"
                :key="option.value"
                :value="String(option.value)"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Preview -->
        <div v-if="sortedWeights.length > 0" class="rounded-lg border p-4">
          <Label class="mb-2 block">{{ t('progressions.create.preview') }}</Label>
          <div class="text-sm text-muted-foreground">
            <p>{{ t('progressions.create.previewStart', { weight: sortedWeights[startingWeightIndex] }) }}</p>
            <p class="mt-1">{{ t('progressions.create.previewPath') }}</p>
            <div class="mt-2 flex flex-wrap gap-1">
              <span
                v-for="(weight, index) in sortedWeights"
                :key="weight"
                :class="[
                  'rounded px-2 py-0.5 text-xs',
                  index < startingWeightIndex
                    ? 'bg-muted text-muted-foreground line-through'
                    : 'bg-primary/10 text-primary',
                ]"
              >
                {{ weight }}kg
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
