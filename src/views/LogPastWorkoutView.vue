<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronLeft } from 'lucide-vue-next'
import { RouteNames } from '@/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ErrorDialog from '@/components/ErrorDialog.vue'
import SourceSelector from '@/features/log-past-workout/components/SourceSelector.vue'
import DateDurationPicker from '@/features/log-past-workout/components/DateDurationPicker.vue'
import LogPastWorkoutBuilderStep from '@/features/log-past-workout/components/LogPastWorkoutBuilderStep.vue'
import { usePastWorkout } from '@/features/log-past-workout/composables/usePastWorkout'
import { usePastWorkoutSave } from '@/features/log-past-workout/composables/usePastWorkoutSave'

const { t } = useI18n()
const router = useRouter()

type Step = 'source' | 'date-duration' | 'builder'

const currentStep = ref<Step>('source')
const {
  workoutName,
  workoutDate,
  durationMinutes,
  blocks,
  loadFromTemplate,
  loadFromHistory,
  startBlank,
  reset,
} = usePastWorkout()

const { save, isSaving, error } = usePastWorkoutSave()
const showError = ref(false)

const canSave = computed(() => {
  return workoutName.value.trim().length > 0 && blocks.value.length > 0
})

async function handleSourceSelected(source: 'template' | 'history' | 'blank', id?: string) {
  if (source === 'template' && id) {
    await loadFromTemplate(id)
    currentStep.value = 'date-duration'
    return
  }

  if (source === 'history' && id) {
    await loadFromHistory(id)
    currentStep.value = 'date-duration'
    return
  }

  startBlank()
  currentStep.value = 'date-duration'
}

function handleDateDurationComplete() {
  currentStep.value = 'builder'
}

function goBack() {
  if (currentStep.value === 'builder') {
    currentStep.value = 'date-duration'
    return
  }

  if (currentStep.value === 'date-duration') {
    currentStep.value = 'source'
    reset()
    return
  }

  router.push({ name: RouteNames.Home })
}

async function handleSave() {
  const savedId = await save({
    name: workoutName.value,
    date: workoutDate.value,
    durationMinutes: durationMinutes.value,
    blocks: blocks.value,
  })

  if (savedId) {
    router.push({ name: RouteNames.History })
    return
  }

  if (error.value) {
    showError.value = true
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col p-4">
    <!-- Header -->
    <div class="flex items-center gap-2 mb-4">
      <Button variant="ghost" size="icon" :aria-label="t('common.back', 'Back')" @click="goBack">
        <ChevronLeft class="w-5 h-5" aria-hidden="true" />
      </Button>
      <h1 class="text-xl font-semibold">{{ t('logPastWorkout.title', 'Log Past Workout') }}</h1>
    </div>

    <!-- Step: Source Selection -->
    <SourceSelector
      v-if="currentStep === 'source'"
      @select="handleSourceSelected"
    />

    <!-- Step: Date & Duration -->
    <DateDurationPicker
      v-if="currentStep === 'date-duration'"
      v-model:date="workoutDate"
      v-model:duration="durationMinutes"
      @continue="handleDateDurationComplete"
    />

    <!-- Step: Workout Builder -->
    <div v-if="currentStep === 'builder'" class="space-y-4">
      <!-- Workout Name -->
      <div class="space-y-2">
        <Label for="workout-name">{{ t('logPastWorkout.workoutName', 'Workout Name') }}</Label>
        <Input
          id="workout-name"
          v-model="workoutName"
          :placeholder="t('logPastWorkout.workoutNamePlaceholder', 'e.g., Morning Push Day')"
          :aria-label="t('logPastWorkout.workoutName', 'Workout name')"
        />
      </div>

      <!-- Workout Builder -->
      <LogPastWorkoutBuilderStep />

      <!-- Save Button -->
      <Button
        class="w-full"
        :disabled="!canSave || isSaving"
        @click="handleSave"
      >
        {{ isSaving ? t('common.saving', 'Saving...') : t('logPastWorkout.saveWorkout', 'Save Workout') }}
      </Button>
    </div>

    <!-- Error Dialog -->
    <ErrorDialog
      v-model:open="showError"
      :error="error ?? t('logPastWorkout.saveError', 'Failed to save workout. Please try again.')"
      :title="t('logPastWorkout.saveErrorTitle', 'Save Failed')"
    />
  </div>
</template>
