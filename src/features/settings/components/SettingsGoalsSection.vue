<script setup lang="ts">
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Target } from 'lucide-vue-next'
import { useSettingsStore } from '@/stores/settings'
import { useI18n } from 'vue-i18n'
import { ref, watch } from 'vue'

const settingsStore = useSettingsStore()
const { t } = useI18n()

const inputValue = ref<string>(
  settingsStore.workoutHoursPerWeek !== null ? String(settingsStore.workoutHoursPerWeek) : '',
)

watch(
  () => settingsStore.workoutHoursPerWeek,
  (newValue) => {
    inputValue.value = newValue !== null ? String(newValue) : ''
  },
)

function handleWorkoutHoursChange(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return

  const value = target.value.trim()

  if (value === '') {
    settingsStore.setWorkoutHoursPerWeek(null)
    return
  }

  const hours = parseFloat(value)
  if (!isNaN(hours) && hours >= 0 && hours <= 168) {
    settingsStore.setWorkoutHoursPerWeek(hours)
  }
}
</script>

<template>
  <section>
    <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
      {{ t('settings.sections.goals') }}
    </h2>
    <div class="space-y-4">
      <!-- Workout Hours Per Week -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Label class="flex items-center gap-3 text-base" for="workout-hours-input">
          <Target class="icon-md text-muted-foreground" />
          {{ t('settings.labels.workoutHoursPerWeek') }}
        </Label>
        <div class="flex flex-col gap-2 w-full sm:w-auto">
          <Input
            id="workout-hours-input"
            v-model="inputValue"
            type="number"
            min="0"
            max="168"
            step="0.5"
            :placeholder="t('settings.labels.workoutHoursPlaceholder')"
            data-testid="workout-hours-input"
            class="w-full sm:w-32"
            @blur="handleWorkoutHoursChange"
            @keydown.enter="handleWorkoutHoursChange"
          />
          <p class="text-xs text-muted-foreground">
            {{ t('settings.labels.workoutHoursDescription') }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
