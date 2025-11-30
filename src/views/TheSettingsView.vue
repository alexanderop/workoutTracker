<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTheme } from '@/composables/useTheme'
import { useSettingsStore } from '@/stores/settings'

const { isDark } = useTheme()
const settingsStore = useSettingsStore()

function handleWeightUnitChange(value: AcceptableValue | ReadonlyArray<AcceptableValue>) {
  if (value === 'kg' || value === 'lbs') {
    settingsStore.weightUnit = value
  }
}

function handleHeightUnitChange(value: AcceptableValue | ReadonlyArray<AcceptableValue>) {
  if (value === 'cm' || value === 'ft-in') {
    settingsStore.heightUnit = value
  }
}
</script>

<template>
  <div class="flex-1 p-4">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">Settings</h1>
      <p class="text-muted-foreground">Customize your app preferences</p>
    </div>

    <div class="space-y-4 max-w-2xl">
      <!-- Units Section -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Units</CardTitle>
          <CardDescription>Choose your preferred measurement units</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center justify-between">
            <Label>Weight</Label>
            <ToggleGroup
              type="single"
              :model-value="settingsStore.weightUnit"
              variant="outline"
              data-testid="weight-unit-toggle"
              class="[&_[data-state=on]]:bg-primary [&_[data-state=on]]:text-primary-foreground"
              @update:model-value="handleWeightUnitChange"
            >
              <ToggleGroupItem value="kg" aria-label="Kilograms">kg</ToggleGroupItem>
              <ToggleGroupItem value="lbs" aria-label="Pounds">lbs</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div class="flex items-center justify-between">
            <Label>Height</Label>
            <ToggleGroup
              type="single"
              :model-value="settingsStore.heightUnit"
              variant="outline"
              data-testid="height-unit-toggle"
              class="[&_[data-state=on]]:bg-primary [&_[data-state=on]]:text-primary-foreground"
              @update:model-value="handleHeightUnitChange"
            >
              <ToggleGroupItem value="cm" aria-label="Centimeters">cm</ToggleGroupItem>
              <ToggleGroupItem value="ft-in" aria-label="Feet and Inches">ft/in</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      <!-- Appearance Section -->
      <Card>
        <CardHeader>
          <CardTitle class="text-lg">Appearance</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center space-x-2">
            <Switch v-model="isDark" data-testid="theme-toggle" />
            <Label>Dark Mode</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
