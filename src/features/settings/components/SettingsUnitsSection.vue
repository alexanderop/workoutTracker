<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Scale, Ruler } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from 'vue-i18n'

const settingsStore = useSettingsStore()
const { t } = useI18n()

function handleWeightUnitChange(value: AcceptableValue | ReadonlyArray<AcceptableValue>) {
  if (value === 'kg' || value === 'lbs') {
    void settingsStore.setWeightUnit(value)
  }
}

function handleHeightUnitChange(value: AcceptableValue | ReadonlyArray<AcceptableValue>) {
  if (value === 'cm' || value === 'ft-in') {
    void settingsStore.setHeightUnit(value)
  }
}
</script>

<template>
  <section>
    <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
      {{ t('settings.sections.units') }}
    </h2>
    <div class="space-y-4">
      <!-- Weight -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Label class="flex items-center gap-3 text-base">
          <Scale class="icon-md text-muted-foreground" />
          {{ t('settings.labels.weight') }}
        </Label>
        <ToggleGroup
          type="single"
          :model-value="settingsStore.weightUnit"
          variant="outline"
          data-testid="weight-unit-toggle"
          class="w-full sm:w-auto [&_[data-state=on]]:bg-primary [&_[data-state=on]]:text-primary-foreground"
          @update:model-value="handleWeightUnitChange"
        >
          <ToggleGroupItem
            value="kg"
            :aria-label="t('settings.labels.ariaKilograms')"
            class="flex-1 sm:flex-none min-h-11 px-6"
          >
            kg
          </ToggleGroupItem>
          <ToggleGroupItem
            value="lbs"
            :aria-label="t('settings.labels.ariaPounds')"
            class="flex-1 sm:flex-none min-h-11 px-6"
          >
            lbs
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <!-- Height -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Label class="flex items-center gap-3 text-base">
          <Ruler class="icon-md text-muted-foreground" />
          {{ t('settings.labels.height') }}
        </Label>
        <ToggleGroup
          type="single"
          :model-value="settingsStore.heightUnit"
          variant="outline"
          data-testid="height-unit-toggle"
          class="w-full sm:w-auto [&_[data-state=on]]:bg-primary [&_[data-state=on]]:text-primary-foreground"
          @update:model-value="handleHeightUnitChange"
        >
          <ToggleGroupItem
            value="cm"
            :aria-label="t('settings.labels.ariaCentimeters')"
            class="flex-1 sm:flex-none min-h-11 px-6"
          >
            cm
          </ToggleGroupItem>
          <ToggleGroupItem
            value="ft-in"
            :aria-label="t('settings.labels.ariaFeetAndInches')"
            class="flex-1 sm:flex-none min-h-11 px-6"
          >
            ft/in
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  </section>
</template>
